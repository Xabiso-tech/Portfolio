/* ==========================================================
   TECH'STAMENT — THE APPLICATION CONTROLLER

   This file is the conductor. It owns the order of the
   experience and nothing else; the picture belongs to the Three.js
   scene, the reading belongs to the manuscript, and the sound
   belongs to the synthesiser.

   THE JOURNEY
   -----------
     1.  boot          fonts, textures and the room are prepared
     2.  darkness      the scene starts at zero exposure
     3.  the light     the lamp comes up on the cover
     4.  the reveal    the camera pulls back to the whole book
     5.  the invitation  OPEN THE TESTAMENT appears
     6.  the opening   the cover swings on the spine hinge
     7.  the handoff   the manuscript is laid onto the open pages
     8.  the reading   the pages flatten out and the room dims

   Every step waits for the one before it, so the visitor is
   never shown a half-finished picture.
   ========================================================== */

import './styles/techstament.css';
import './styles/manuscript.css';

import { gsap } from 'gsap';

import { BookScene } from './three/BookScene.js';
import { Manuscript } from './manuscript/Manuscript.js';
import { PAGES, CHAPTERS } from './manuscript/content.js';
import { SoundDesign } from './audio/SoundDesign.js';
import { bindSoundToggle } from './ui/SoundToggle.js';

/* ----------------------------------------------------------
   1. THE DOM
   ---------------------------------------------------------- */

const el = {
  body: document.body,
  scene: document.querySelector('#scene'),
  loader: document.querySelector('#loader'),
  intro: document.querySelector('#intro'),
  header: document.querySelector('.intro__header'),
  actions: document.querySelector('#intro-actions'),
  footer: document.querySelector('.intro__footer'),
  glow: document.querySelector('.atmosphere__glow'),
  openButton: document.querySelector('#open-testament'),
  skipButton: document.querySelector('#skip-intro'),
  soundButton: document.querySelector('#sound-toggle'),
  soundButtonRead: document.querySelector('#sound-toggle-read'),
  fallback: document.querySelector('#fallback'),
  fallbackButton: document.querySelector('#fallback-open'),
  skipLink: document.querySelector('.skip-link'),
};

/* ----------------------------------------------------------
   2. STATE
   ---------------------------------------------------------- */

const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const state = {
  /** 'booting' | 'invited' | 'opening' | 'reading' */
  phase: 'booting',
  book: null,
  manuscript: null,
  sound: new SoundDesign(),
  cancelled: false,
  /** True once the reader has asked to skip the cinema. */
  skipRequested: false,
  /** True once the skip has actually been carried out. */
  skipStarted: false,
  /** True when the 3D room could not be built at all. */
  bookFailed: false,
};

/* ----------------------------------------------------------
   3. SMALL HELPERS
   ---------------------------------------------------------- */

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/** Fade an element out of sight and take it out of the flow. */
function fadeOut(node, duration = 0.6) {
  if (!node) return Promise.resolve();

  return new Promise((resolve) => {
    gsap.to(node, {
      autoAlpha: 0,
      duration: reducedMotion ? 0.01 : duration,
      ease: 'power2.inOut',
      onComplete: resolve,
    });
  });
}

/** Fade an element into sight. */
function fadeIn(node, duration = 0.8, delay = 0) {
  if (!node) return;

  gsap.to(node, {
    autoAlpha: 1,
    duration: reducedMotion ? 0.01 : duration,
    delay: reducedMotion ? 0 : delay,
    ease: 'power2.out',
  });
}

/* ----------------------------------------------------------
   4. FONTS
   ----------------------------------------------------------

   The lettering on the cover is painted into a canvas texture at
   runtime, which means the typefaces have to be in the browser
   before the texture is drawn. Waiting here is the difference
   between a cover that reads TECH'STAMENT and a cover that reads
   TECH'STAMENT in Times New Roman.
   ---------------------------------------------------------- */

async function waitForFonts() {
  if (!document.fonts) return;

  const wanted = [
    '700 100px Cinzel',
    '500 100px Cinzel',
    '400 100px "Cormorant Garamond"',
    'italic 400 100px "Cormorant Garamond"',
    '600 100px Inter',
  ];

  try {
    await Promise.race([
      Promise.all(wanted.map((font) => document.fonts.load(font, 'TECHSTAMENT'))),
      wait(4000),
    ]);
  } catch (error) {
    /* A missing typeface is survivable: the canvas falls back to
       the serif stack declared in the stylesheet. */
  }

  /* Never hold the whole experience hostage to a slow font. */
  await Promise.race([
    document.fonts.ready,
    wait(4000),
  ]);
}

/* ----------------------------------------------------------
   5. THE MANUSCRIPT
   ---------------------------------------------------------- */

function buildManuscript() {
  state.manuscript = new Manuscript({
    pages: PAGES,
    chapters: CHAPTERS,
    reducedMotion,
    onChange: () => {
      /* The dry whisper of paper. */
      state.sound.play('page');
    },
  });

  state.manuscript.mount();
}

/* ----------------------------------------------------------
   6. THE ROOM
   ---------------------------------------------------------- */

function buildRoom() {
  try {
    state.book = new BookScene(el.scene, { reducedMotion });
    return true;
  } catch (error) {
    console.error(
      "TECH'STAMENT: the 3D room could not be started.",
      error
    );
    return false;
  }
}

/* ----------------------------------------------------------
   7. THE LOADER

   The veil stays over the room until the lamp actually starts to
   rise, so the visitor sees darkness and then light rather than a
   finished picture appearing out of nowhere.
   ---------------------------------------------------------- */

function hideLoader() {
  if (!el.loader) return;

  gsap.to(el.loader, {
    autoAlpha: 0,
    duration: reducedMotion ? 0.01 : 0.7,
    ease: 'power2.inOut',
    onComplete: () => el.loader.remove(),
  });
}

/* ----------------------------------------------------------
   8. THE INVITATION
   ---------------------------------------------------------- */

function revealInvitation() {
  if (state.phase !== 'booting') return;

  state.phase = 'invited';

  gsap.set(el.actions, { autoAlpha: 0, y: 26 });
  gsap.set(el.footer, { autoAlpha: 0 });

  if (el.openButton) el.openButton.disabled = false;

  fadeIn(el.actions, 0.9);
  fadeIn(el.footer, 0.7, 0.35);
}

/* ----------------------------------------------------------
   9. OPENING THE BOOK
   ---------------------------------------------------------- */

async function openTestament() {
  if (state.phase !== 'invited' || !state.book) return;

  state.phase = 'opening';

  if (el.openButton) {
    el.openButton.disabled = true;
    el.openButton.setAttribute('aria-busy', 'true');
  }

  /* The invitation gets out of the way before the cover moves. */
  await Promise.all([fadeOut(el.actions, 0.5), fadeOut(el.footer, 0.5)]);

  state.sound.play('leather');

  try {
    await state.book.open();
  } catch (error) {
    console.error("TECH'STAMENT: the book failed to open.", error);
  }

  if (state.cancelled) return;

  await handoff();
}

/* ----------------------------------------------------------
   10. THE HANDOFF
   ----------------------------------------------------------

   The manuscript is real HTML, but for a moment it is laid over
   the open pages with a homography, so that it looks printed on
   the paper. Then it eases out of the book and becomes a flat,
   straight-on reading surface.
   ---------------------------------------------------------- */

async function handoff() {
  const manuscript = state.manuscript;
  const single = state.book.isSinglePage;

  /* The camera has just settled over the spread, so the four
     corners of the page are known exactly. */
  const corners = state.book.spreadCorners(single);

  manuscript.reveal();
  manuscript.project(corners);

  /* Let the reader see the manuscript sitting on the page. */
  await wait(reducedMotion ? 0.01 : 950);

  await manuscript.flatten(reducedMotion ? 0.01 : 1.3);

  await settleIntoReading();
}

/* ----------------------------------------------------------
   11. THE READING ROOM
   ---------------------------------------------------------- */

async function settleIntoReading() {
  const manuscript = state.manuscript;

  manuscript.settle();

  if (state.book) {
    state.book.dim(0.42);
  }

  state.sound.play('chime');

  await fadeOut(el.intro, 0.7);

  state.phase = 'reading';

  if (el.openButton) el.openButton.removeAttribute('aria-busy');

  /* The reader should be able to go straight to the contents. */
  const contents = document.querySelector('#toggle-contents');
  if (contents) {
    contents.setAttribute('title', 'Jump to a chapter');
    contents.focus({ preventScroll: true });
  }
  el.intro.inert = true;
}

/* ----------------------------------------------------------
   12. SKIPPING THE CINEMA
   ----------------------------------------------------------

   The intro is beautiful and it is also six seconds long. Anyone
   who would rather read has to be able to say so.
   ---------------------------------------------------------- */

async function skipToReading() {
  if (state.phase === 'reading') return;
  if (state.skipStarted) return;

  state.skipRequested = true;
  state.cancelled = true;

  /* If the room is still being prepared, the boot sequence picks
     this up as soon as it is ready. */
  if (!state.book && !state.bookFailed) return;

  state.skipStarted = true;
  state.phase = 'opening';

  gsap.killTweensOf([el.actions, el.footer, el.intro]);

  if (state.book) {
    /* Put the book straight into its open state. */
    state.book.cancelIntro();
    state.book.bible.setOpen(1);
    state.book.lighting.setLevel(1, { pages: 1 });
    state.book.renderer.toneMappingExposure = 1.15;
    state.book.director.snap(state.book.spreadShot);
  }

  await Promise.all([fadeOut(el.actions, 0.25), fadeOut(el.footer, 0.25)]);

  const manuscript = state.manuscript;
  manuscript.reveal();
  manuscript.layout();

  await manuscript.flatten(0.01);

  await settleIntoReading();
}

/* ----------------------------------------------------------
   13. NO WEBGL
   ---------------------------------------------------------- */

function showFallback() {
  // The fallback is actionable immediately; no fading veil may intercept clicks.
  gsap.killTweensOf(el.loader);
  el.loader?.remove();

  if (el.fallback) el.fallback.removeAttribute('hidden');

  gsap.set(el.actions, { autoAlpha: 0 });
  gsap.set(el.footer, { autoAlpha: 0 });

  if (el.openButton) el.openButton.disabled = true;
}

/* ----------------------------------------------------------
   14. EVENTS
   ---------------------------------------------------------- */

function registerEvents() {
  el.openButton?.addEventListener('click', openTestament);
  el.skipButton?.addEventListener('click', skipToReading);
  el.fallbackButton?.addEventListener('click', skipToReading);

  el.skipLink?.addEventListener('click', (event) => {
    event.preventDefault();
    skipToReading();
  });
}

/* ----------------------------------------------------------
   15. BOOT
   ---------------------------------------------------------- */

async function boot() {
  el.body.classList.remove('is-booting');

  /* The manuscript DOM is built first: it costs nothing, and it
     means the reader never waits for the pages to exist. */
  buildManuscript();

  bindSoundToggle({
    buttons: [el.soundButton, el.soundButtonRead],
    sound: state.sound,
  });

  registerEvents();

  if (el.openButton) el.openButton.disabled = true;

  /* The cover is painted with real typefaces, so the fonts come
     first. */
  await waitForFonts();

  if (!buildRoom()) {
    state.bookFailed = true;
    showFallback();
    if (state.skipRequested) await skipToReading();
    return;
  }

  /* The reader may have given up on the cinema while the room was
     still being prepared. Honour that now. */
  if (state.skipRequested) {
    await skipToReading();
    return;
  }

  /* The lamp's glow in the air comes up with the light. */
  gsap.to(el.glow, {
    opacity: 1,
    duration: reducedMotion ? 0.01 : 3.2,
    ease: 'power2.inOut',
  });

  hideLoader();

  /* Let the browser paint the darkness before the light moves. */
  await nextFrame();

  try {
    await state.book.playIntro({ onLight: hideLoader });
  } catch (error) {
    console.error("TECH'STAMENT: the introduction failed.", error);
    hideLoader();
  }

  if (state.cancelled) return;

  revealInvitation();
}

boot();

/* ----------------------------------------------------------
   16. CLEANUP
   ---------------------------------------------------------- */

window.addEventListener('pagehide', (event) => {
  // Retain live objects when Back/Forward Cache preserves this document.
  if (event.persisted) return;
  state.cancelled = true;

  state.manuscript?.dispose();
  state.book?.dispose();
  state.sound.dispose();
});
