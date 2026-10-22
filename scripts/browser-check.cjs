/* ==============================================================
   TECH'STAMENT — THE BROWSER CHECK

   A real browser, driven through the Chrome DevTools Protocol,
   walks the whole journey: darkness, the light on the cover, the
   pull-back, the invitation, the opening, the handoff onto the
   pages, turning leaves, the contents, the keyboard, the phone
   layout and the no-WebGL fallback.

   There are no test dependencies. Node's built-in WebSocket talks
   to Chrome directly, and the checks are plain assertions.

   Screenshots are written to .qa/ so the result can be looked at
   rather than only measured.

   Usage:
     npm run build && npm run test:browser
   ============================================================== */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const assert = require('assert');

const server = require('./serve.cjs');

const root = path.resolve(__dirname, '..');
const qa = path.join(root, '.qa');

const chrome = process.env.CHROME_PATH
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let browser = null;
let ws = null;
let sequence = 0;
const pending = new Map();
const exceptions = [];
const consoleErrors = [];

/** The name of the stage being run, so a failure says where it came from. */
let stage = 'start-up';

/* ---------- the DevTools connection ---------- */

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;

    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('DevTools timeout: ' + method));
    }, 30000);

    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });

    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (result.exceptionDetails) {
    throw new Error(
      'Page error: ' + JSON.stringify(result.exceptionDetails.exception || result.exceptionDetails)
    );
  }

  return result.result.value;
}

/* ---------- page helpers ---------- */

async function navigate(pathname = '') {
  await send('Page.navigate', {
    url: 'http://127.0.0.1:8000/Portfolio/' + pathname,
  });

  for (let attempt = 0; attempt < 200; attempt += 1) {
    await sleep(60);
    const ready = await evaluate('document.readyState');
    if (ready === 'complete') break;
  }

  await sleep(300);
}

async function screenshot(name) {
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });

  fs.writeFileSync(path.join(qa, name + '.png'), Buffer.from(result.data, 'base64'));
  console.log('  shot  .qa/' + name + '.png');
}

/** Click an element with a real mouse event, at its centre. */
async function click(selector) {
  const box = await evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      visible: rect.width > 0 && rect.height > 0,
    };
  })()`);

  assert(box, 'Nothing to click: ' + selector);
  assert(box.visible, 'The target is not visible: ' + selector);

  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type,
      x: box.x,
      y: box.y,
      button: 'left',
      clickCount: 1,
    });
  }

  await sleep(120);
}

async function pressKey(key, code, keyCode) {
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', {
      type,
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
  }

  await sleep(200);
}

/** Wait until an expression is truthy, or give up. */
async function waitFor(expression, label, timeout = 15000) {
  const started = Date.now();

  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true;
    await sleep(120);
  }

  throw new Error('Timed out waiting for: ' + (label || expression));
}

/**
 * Wait for the invitation, press it, and wait for the manuscript.
 *
 * This is the one path through the experience that every other
 * stage depends on, so it lives in one place.
 */
async function openTheBook() {
  await waitFor(
    'document.querySelector("#open-testament") && !document.querySelector("#open-testament").disabled',
    'the invitation'
  );

  await click('#open-testament');

  await waitFor(
    '!document.querySelector("#manuscript").hasAttribute("hidden")',
    'the manuscript'
  );
}

/**
 * Read the perspective terms out of a matrix3d.
 *
 * CSS matrix3d is column-major, so m14 is the fourth value and
 * m24 is the eighth. They are the terms that divide by w, and
 * they are what makes a transform projective rather than affine.
 */
function perspectiveOf(transform) {
  if (!transform || !transform.startsWith('matrix3d(')) return null;

  const values = transform
    .slice('matrix3d('.length, -1)
    .split(',')
    .map((value) => Number(value.trim()));

  return { m14: values[3], m24: values[7] };
}

/* ---------- the checks ---------- */

async function main() {
  fs.mkdirSync(qa, { recursive: true });

  await new Promise((resolve) => server.listen(8000, '127.0.0.1', resolve));

  browser = cp.spawn(chrome, [
    '--headless=new',
    '--enable-unsafe-swiftshader',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--mute-audio',
    '--remote-debugging-port=9237',
    '--user-data-dir=' + path.join(qa, 'chrome-profile'),
    'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });

  let tabs = null;

  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      tabs = await (await fetch('http://127.0.0.1:9237/json')).json();
      break;
    } catch (error) {
      await sleep(120);
    }
  }

  assert(tabs, 'Chrome did not start. Set CHROME_PATH to your Chrome executable.');

  ws = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.id) {
      const waiter = pending.get(message.id);
      pending.delete(message.id);

      if (!waiter) return;
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
      else waiter.resolve(message.result);
      return;
    }

    if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails);
    }

    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push({
        stage,
        message: message.params.args
          .map((arg) => arg.value || arg.description)
          .join(' '),
      });
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });

  /* -------------------------------------------------------
     1. THE DARKNESS
     ------------------------------------------------------- */

  stage = 'the darkness';
  console.log('1. the darkness');
  await navigate('');

  /* The canvas only appears once the fonts have loaded and the
     scene has been built, so the check waits for it rather than
     assuming it is already there. */
  await waitFor(
    'Boolean(document.querySelector("#scene canvas"))',
    'the room to be drawn'
  );

  assert(
    await evaluate('getComputedStyle(document.querySelector("#intro-actions")).visibility === "hidden"'),
    'The invitation is hidden until the room is ready'
  );

  await screenshot('01-darkness');

  /* -------------------------------------------------------
     2. THE LIGHT ON THE COVER
     ------------------------------------------------------- */

  stage = 'the lit cover';
  console.log('2. the light on the cover');
  await waitFor('!document.querySelector("#loader")', 'the lamp and loading veil', 60000);
  await sleep(3400);
  await screenshot('02-cover');

  /* The cover is a real, lit object: the canvas must not be a
     single flat colour once the lamp is up. */
  const coverVariety = await evaluate(`new Promise(resolve => requestAnimationFrame(() => {
    const canvas = document.querySelector('#scene canvas');
    const probe = document.createElement('canvas');
    probe.width = 120; probe.height = 120;
    const context = probe.getContext('2d');
    context.drawImage(canvas, 0, 0, 120, 120);
    const data = context.getImageData(0, 0, 120, 120).data;
    let min = 255, max = 0, sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const value = (data[i] + data[i + 1] + data[i + 2]) / 3;
      min = Math.min(min, value); max = Math.max(max, value); sum += value;
    }
    resolve({ min, max, mean: sum / (data.length / 4) });
  }))`);

  console.log('  cover pixels', coverVariety);
  assert(coverVariety.max > 40, 'The cover is lit (brightest pixel ' + coverVariety.max + ')');
  assert(coverVariety.max - coverVariety.min > 30, 'The cover has modelling, not a flat fill');

  /* -------------------------------------------------------
     3. THE PULL-BACK AND THE INVITATION
     ------------------------------------------------------- */

  stage = 'the invitation';
  console.log('3. the pull-back and the invitation');
  await waitFor(
    'document.querySelector("#open-testament") && !document.querySelector("#open-testament").disabled',
    'the invitation',
    20000
  );

  await screenshot('03-reveal');

  assert(
    await evaluate('document.querySelector("#intro-actions").getBoundingClientRect().height > 0'),
    'The invitation is on screen'
  );

  /* -------------------------------------------------------
     4. THE BOOK OPENS
     ------------------------------------------------------- */

  stage = 'the opening';
  console.log('4. the opening');

  /* Watch every transform the spread is given, so the handoff can
     be proved rather than assumed. */
  await evaluate(`(() => {
    window.__transforms = [];
    const spread = document.querySelector('#spread');
    const record = () => {
      const value = spread.style.transform;
      if (value && window.__transforms[window.__transforms.length - 1] !== value) {
        window.__transforms.push(value);
      }
    };
    new MutationObserver(record).observe(spread, { attributes: true, attributeFilter: ['style'] });
    record();
    return true;
  })()`);

  await click('#open-testament');

  await sleep(1400);
  await screenshot('04-opening');

  await waitFor(
    '!document.querySelector("#manuscript").hasAttribute("hidden")',
    'the manuscript'
  );

  await sleep(600);
  await screenshot('05-spread');

  /* -------------------------------------------------------
     5. THE READING ROOM
     ------------------------------------------------------- */

  stage = 'the reading room';
  console.log('5. the reading room');

  await waitFor(
    'getComputedStyle(document.querySelector(".manuscript__backdrop")).opacity === "1"',
    'the room to settle behind the pages',
    12000
  );

  await sleep(400);
  await screenshot('06-reading');

  /* The manuscript was laid over the open book with a homography
     and then eased into the flat reading layout, so the record of
     transforms has to contain a projective one and end on a flat
     one. */
  const transforms = await evaluate('window.__transforms');

  assert(transforms.length > 1, 'The manuscript was transformed at all');

  const projective = transforms.filter((value) => {
    const perspective = perspectiveOf(value);
    return perspective && (Math.abs(perspective.m14) > 1e-6 || Math.abs(perspective.m24) > 1e-6);
  });

  assert(
    projective.length > 0,
    'The manuscript was laid over the book with a homography'
  );

  const finalPerspective = perspectiveOf(transforms[transforms.length - 1]);
  assert(
    finalPerspective
      && Math.abs(finalPerspective.m14) < 1e-6
      && Math.abs(finalPerspective.m24) < 1e-6,
    'The manuscript ended up flat and straight-on'
  );

  assert(
    await evaluate('document.querySelectorAll(".page").length >= 2'),
    'Both pages of the spread are rendered'
  );
  assert(
    await evaluate('document.querySelector(".page__body").textContent.length > 40'),
    'The pages carry real text'
  );

  /* -------------------------------------------------------
     6. TURNING THE LEAVES
     ------------------------------------------------------- */

  stage = 'turning the leaves';
  console.log('6. turning the leaves');

  const firstPage = await evaluate(
    'document.querySelector(".page-slot--right .page").dataset.pageId'
  );

  await click('#page-next');
  await sleep(1800);

  const secondPage = await evaluate(
    'document.querySelector(".page-slot--right .page").dataset.pageId'
  );
  assert(secondPage !== firstPage, 'The next page arrived: ' + secondPage);

  await screenshot('07-page-turned');

  await click('#page-prev');
  await sleep(1800);
  assert(
    await evaluate('document.querySelector(".page-slot--right .page").dataset.pageId') === firstPage,
    'The previous page came back'
  );

  /* -------------------------------------------------------
     7. THE CONTENTS
     ------------------------------------------------------- */

  stage = 'the contents';
  console.log('7. the contents');
  await click('#toggle-contents');
  await sleep(400);

  assert(
    await evaluate('document.querySelectorAll("#contents-list button").length === 6'),
    'Every chapter is listed'
  );
  await screenshot('08-contents');

  await evaluate('document.querySelectorAll("#contents-list button")[3].click()');
  await sleep(1800);

  const indicator = await evaluate('document.querySelector("#page-indicator").textContent');
  assert(
    indicator.includes('III'),
    'The contents jump to the right chapter: ' + indicator
  );
  await screenshot('09-chapter');

  /* -------------------------------------------------------
     8. THE KEYBOARD
     ------------------------------------------------------- */

  stage = 'the keyboard';
  console.log('8. the keyboard');
  const beforeKey = await evaluate(
    'document.querySelector(".page-slot--right .page").dataset.pageId'
  );

  await pressKey('ArrowRight', 'ArrowRight', 39);
  await sleep(1800);

  const afterKey = await evaluate(
    'document.querySelector(".page-slot--right .page").dataset.pageId'
  );
  assert(afterKey !== beforeKey, 'The right arrow turns the page');

  /* -------------------------------------------------------
     9. EVERY PAGE FITS ITS PAGE
     ------------------------------------------------------- */

  stage = 'every page fits';
  console.log('9. every page fits');

  /* Reduced motion turns the leaves instantly, so the whole book
     can be walked quickly. */
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await navigate('');

  await openTheBook();
  await sleep(400);

  const spreads = await evaluate('Math.ceil(document.querySelectorAll(".continuous__page").length / 2)');
  const overflows = [];

  for (let spread = 0; spread < spreads; spread += 1) {
    const problem = await evaluate(`(() => {
      const bodies = [...document.querySelectorAll('.page__body')];
      return bodies
        .filter((body) => body.scrollHeight > body.clientHeight + 2)
        .map((body) => body.closest('.page').dataset.pageId + ':' + body.scrollHeight + '/' + body.clientHeight);
    })()`);

    if (problem.length) overflows.push(...new Set(problem));

    if (spread < spreads - 1) {
      await evaluate('document.querySelector("#page-next").click()');
      await sleep(240);
    }
  }

  assert.equal(overflows.length, 0, 'Text overflowing its page: ' + overflows.join(', '));

  /* The artwork has to have arrived too. */
  const brokenImages = await evaluate(
    '[...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src)'
  );
  assert.equal(brokenImages.length, 0, 'Broken images: ' + brokenImages.join(', '));

  /* Every external link in the manuscript has to be one of the
     links that were actually checked. */
  const links = await evaluate(
    '[...new Set([...document.querySelectorAll(".page a")].map((a) => a.href))].sort()'
  );
  assert(links.length >= 5, 'The pages carry their links: ' + links.join(', '));

  await send('Emulation.setEmulatedMedia', { features: [] });

  /* -------------------------------------------------------
     10. THE PHONE
     ------------------------------------------------------- */

  stage = 'the phone';
  console.log('10. the phone');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await navigate('');

  await openTheBook();
  await sleep(700);
  await waitFor('getComputedStyle(document.querySelector(".manuscript__backdrop")).opacity === "1"', 'settled mobile reading');
  await screenshot('10-mobile-reading');

  assert(
    await evaluate('getComputedStyle(document.querySelector(".page-slot--left")).display === "none"'),
    'Only one page is shown on a phone'
  );
  assert(
    await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'),
    'Nothing overflows sideways on a phone'
  );

  // Every authored face must be reachable, including left pages on phones.
  const faceIds = await evaluate('[...document.querySelectorAll(".continuous__page")].map(p => p.dataset.pageId)');
  for (let i = 0; i < faceIds.length; i++) {
    const actual = await evaluate('document.querySelector(".page-slot--right .page").dataset.pageId');
    assert.equal(actual, faceIds[i], 'Phone face ' + i);
    if (i < faceIds.length - 1) { await click('#page-next'); await sleep(500); }
  }
  assert(await evaluate('document.querySelector("#page-next").disabled'), 'Last phone face disables Next');
  await click('#page-prev'); await sleep(500);
  assert.equal(await evaluate('document.querySelector(".page-slot--right .page").dataset.pageId'), faceIds.at(-2));
  await click('#toggle-continuous');
  assert(await evaluate('document.querySelector("#spread").hidden && !document.querySelector("#continuous").hidden'), 'Continuous reading switches layout');
  assert(await evaluate('[...document.querySelectorAll(".continuous .page__body")].every(p => p.scrollHeight <= p.clientHeight + 2)'), 'Continuous text fits');
  await screenshot('10b-mobile-continuous');
  await click('#toggle-continuous');
  await click('#toggle-contents');
  await evaluate('document.querySelectorAll("#contents-list button")[5].click()');
  assert.equal(await evaluate('document.querySelector(".page-slot--right .page").dataset.pageId'), 'chapter-v', 'Phone chapter opens correct face');

  await navigate('');
  await waitFor(
    'document.querySelector("#open-testament") && !document.querySelector("#open-testament").disabled',
    'the invitation on a phone',
    20000
  );
  await screenshot('11-mobile-room');
  await click('#open-testament');
  await sleep(5200);
  await screenshot('12-mobile-spread');

  /* -------------------------------------------------------
     11. NO WEBGL
     ------------------------------------------------------- */

  stage = 'no WebGL';
  console.log('11. no WebGL');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
        return original.call(this, type, ...rest);
      };
    `,
  });

  const errorsBefore = consoleErrors.length;

  await navigate('');
  await waitFor(
    '!document.querySelector("#fallback").hasAttribute("hidden")',
    'the fallback message',
    20000
  );

  await screenshot('13-fallback');

  await click('#fallback-open');
  await waitFor(
    '!document.querySelector("#manuscript").hasAttribute("hidden")',
    'the manuscript without WebGL'
  );
  await sleep(700);
  await screenshot('14-fallback-reading');

  /* The only console error allowed in this stage is the scene
     reporting that it could not start. */
  const fallbackErrors = consoleErrors.slice(errorsBefore);
  const unexpected = fallbackErrors.filter(
    (entry) => !/WebGL|webgl|3D room could not be started/i.test(entry.message)
  );
  assert.equal(
    unexpected.length,
    0,
    'Unexpected console errors without WebGL: '
      + unexpected.map((entry) => entry.message).join(' | ')
  );

  /* -------------------------------------------------------
     12. THE REPORT
     ------------------------------------------------------- */

  const realExceptions = exceptions.filter(
    (entry) => entry && entry.exception && entry.exception.description
  );

  assert.equal(realExceptions.length, 0, 'Uncaught errors: ' + JSON.stringify(realExceptions));

  const unexpectedErrors = consoleErrors.filter(
    (entry) => !(entry.stage === 'no WebGL' && /WebGL|3D room could not be started/i.test(entry.message))
  );
  assert.equal(
    unexpectedErrors.length,
    0,
    'Console errors: '
      + unexpectedErrors.map((entry) => entry.stage + ': ' + entry.message).join(' | ')
  );

  console.log('');
  console.log('PASS: darkness, the lit cover, the pull-back, the invitation,');
  console.log('      the opening, the handoff onto the pages, page turns,');
  console.log('      the contents, the keyboard, every page fitting, the phone');
  console.log('      layout and the no-WebGL fallback. Screenshots in .qa/');
}

main()
  .catch((error) => {
    console.error('');
    console.error('FAILED at stage: ' + stage);
    console.error(error);
    console.error('Browser exceptions:', JSON.stringify(exceptions));
    console.error('Browser console:', JSON.stringify(consoleErrors));
    process.exitCode = 1;
  })
  .finally(async () => {
    if (ws) {
      try {
        await send('Browser.close');
      } catch (error) {
        /* Chrome has already gone. */
      }
      ws.close();
    }

    if (browser) browser.kill();
    server.close();
  });
