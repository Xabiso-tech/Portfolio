
/* ==============================================================
   THE LIVING SKETCHBOOK — CHAPTER MOTION / FILE 2

   Adds:
   - Hand-drawn heading animations
   - An illustrated pencil cursor
   - Sketchbook page-turn transitions
   - Chapter labels
   - Reading progress

   Works without extra libraries or build tools.
   ============================================================== */

(() => {
  'use strict';

  // Respect visitors who prefer reduced animation.
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  const finePointer = window.matchMedia(
    '(hover: hover) and (pointer: fine)'
  );

  const page = document.querySelector('main');

  if (!page) return;

  /* ==========================================================
     1. ANIMATION STYLES
     These styles are added automatically by JavaScript.
     ========================================================== */

  const styles = document.createElement('style');

  styles.id = 'living-sketchbook-motion-styles';

  styles.textContent = `
    /* Chapter name displayed in the page margin. */
    .ls-chapter-marker {
      position: fixed;
      left: clamp(8px, 1.3vw, 24px);
      top: 50%;
      z-index: 90;
      writing-mode: vertical-rl;
      transform: translateY(-50%) rotate(180deg);
      font: 500 10px/1.4 var(--mono, monospace);
      letter-spacing: .24em;
      text-transform: uppercase;
      color: var(--chalk-3, #777);
      opacity: .7;
      pointer-events: none;
    }

    .ls-chapter-marker::before {
      content: '';
      display: inline-block;
      height: 42px;
      width: 1px;
      margin-bottom: 14px;
      vertical-align: middle;
      background: var(--ember, #a16a4e);
    }

    /* Pencil illustration that follows the pointer. */
    .ls-pencil {
      position: fixed;
      top: 0;
      left: 0;
      width: 36px;
      height: 100px;
      z-index: 110;
      pointer-events: none;
      opacity: 0;
      transform: translate3d(-100px, -100px, 0) rotate(35deg);
      transform-origin: 50% 88%;
      transition: opacity .25s ease;
      filter: drop-shadow(3px 5px 3px #0003);
    }

    .ls-pencil.ls-visible {
      opacity: 1;
    }

    .ls-pencil svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .ls-pencil-tip {
      position: fixed;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      z-index: 109;
      pointer-events: none;
      opacity: 0;
      background: var(--chalk, #333);
      transform: translate3d(-100px, -100px, 0);
      filter: blur(2px);
    }

    .ls-pencil-tip.ls-visible {
      opacity: .24;
    }

    /* Hand-drawn heading underlines. */
    .ls-etched {
      position: relative;
    }

    .ls-etched > .ls-etch-mark {
      position: absolute;
      left: -.03em;
      bottom: -.16em;
      width: min(100%, 440px);
      height: 20px;
      overflow: visible;
      pointer-events: none;
      color: var(--ember, #965138);
    }

    .ls-etch-mark path {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      opacity: .64;
      stroke-dasharray: 650;
      stroke-dashoffset: 650;
      transition: stroke-dashoffset 1.4s
        cubic-bezier(.2, .7, .1, 1);
    }

    .ls-etched.ls-drawn .ls-etch-mark path {
      stroke-dashoffset: 0;
    }

    .ls-etch-mark path:nth-child(2) {
      opacity: .3;
      transition-delay: .18s;
    }

    /* Reading progress line at the top of the screen. */
    .ls-reading-progress {
      position: fixed;
      z-index: 1000;
      top: 0;
      left: 0;
      height: 2px;
      width: 100%;
      transform: scaleX(0);
      transform-origin: left;
      pointer-events: none;
      background: var(--ember, #965138);
    }

    /* The paper that turns during navigation. */
    .ls-page-turn {
      position: fixed;
      inset: 0;
      z-index: 9998;
      pointer-events: none;
      perspective: 1300px;
      visibility: hidden;
    }

    .ls-page-turn.ls-turning {
      visibility: visible;
    }

    .ls-page-leaf {
      position: absolute;
      inset: -3% -5%;
      transform-origin: right center;
      transform: rotateY(-98deg);
      opacity: 0;
      background: var(--paper, #faf7f0);
      box-shadow:
        -30px 0 60px #0002,
        inset 22px 0 45px #00000010;
      border-left: 1px solid var(--hairline, #ccc);
      transition:
        transform .68s cubic-bezier(.2, .7, .2, 1),
        opacity .2s ease;
    }

    .ls-page-turn.ls-turning .ls-page-leaf {
      transform: rotateY(0deg);
      opacity: 1;
    }

    .ls-page-leaf::before {
      content: '';
      position: absolute;
      inset: 0;
      opacity: .1;
      background: repeating-linear-gradient(
        0deg,
        transparent 0 4px,
        #78664b0a 5px 6px
      );
    }

    .ls-page-caption {
      position: absolute;
      right: 9%;
      bottom: 12%;
      font: 600 clamp(24px, 4vw, 64px)/1.1
        var(--display, Georgia, serif);
      color: var(--chalk, #222);
      opacity: 0;
      transform: translateY(12px);
      transition:
        opacity .3s ease .23s,
        transform .3s ease .23s;
    }

    .ls-page-turn.ls-turning .ls-page-caption {
      opacity: .5;
      transform: none;
    }

    /* Smaller screens use a quicker paper slide. */
    @media (max-width: 780px) {
      .ls-chapter-marker {
        display: none;
      }

      .ls-page-leaf {
        transform: translateX(105%);
        transition:
          transform .38s ease,
          opacity .2s;
      }

      .ls-page-turn.ls-turning .ls-page-leaf {
        transform: translateX(0);
      }
    }

    /* Accessibility: disable elaborate animations. */
    @media (prefers-reduced-motion: reduce) {
      .ls-pencil,
      .ls-pencil-tip,
      .ls-page-turn {
        display: none !important;
      }

      .ls-etch-mark path {
        transition: none !important;
        stroke-dashoffset: 0 !important;
      }
    }
  `;

  document.head.appendChild(styles);

  /* ==========================================================
     2. CHAPTER LABELS
     Each page receives its own chapter name.
     ========================================================== */

  const chapterNames = {
    home: 'I / The First Stroke',
    about: 'II / Behind the Sketchbook',
    skills: 'III / The Artist’s Toolkit',
    projects: 'IV / From Sketch to Screen',
    gallery: 'V / The Exhibition',
    contact: 'VI / Leave a Note'
  };

  const currentChapter = page.dataset.page || 'home';

  const chapterMarker = document.createElement('aside');

  chapterMarker.className = 'ls-chapter-marker';
  chapterMarker.setAttribute('aria-hidden', 'true');

  chapterMarker.textContent =
    chapterNames[currentChapter] || 'The Living Sketchbook';

  document.body.appendChild(chapterMarker);

  /* ==========================================================
     3. READING PROGRESS
     A thin line grows as visitors scroll down the chapter.
     ========================================================== */

  const progress = document.createElement('div');

  progress.className = 'ls-reading-progress';
  progress.setAttribute('aria-hidden', 'true');

  document.body.appendChild(progress);

  let progressQueued = false;

  function updateProgress() {
    progressQueued = false;

    const total = Math.max(
      1,
      document.documentElement.scrollHeight - innerHeight
    );

    const value = Math.min(
      1,
      Math.max(0, scrollY / total)
    );

    progress.style.transform = `scaleX(${value})`;
  }

  function queueProgress() {
    if (progressQueued) return;

    progressQueued = true;
    requestAnimationFrame(updateProgress);
  }

  addEventListener('scroll', queueProgress, {
    passive: true
  });

  addEventListener('resize', queueProgress, {
    passive: true
  });

  updateProgress();

  /* ==========================================================
     4. HAND-DRAWN HEADING UNDERLINES
     Two imperfect graphite strokes appear beneath headings.
     ========================================================== */

  const headings = [
    ...page.querySelectorAll(
      'h2[data-etch], .toolkit-hero > h2'
    )
  ];

  headings.forEach((heading) => {
    if (heading.querySelector('.ls-etch-mark')) return;

    heading.classList.add('ls-etched');

    const svgNS = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(svgNS, 'svg');

    svg.classList.add('ls-etch-mark');

    svg.setAttribute('viewBox', '0 0 440 20');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const paths = [
      'M3 11 C72 6 135 13 208 9 S349 6 436 10',
      'M22 15 Q137 12 244 15 T412 13'
    ];

    paths.forEach((d) => {
      const path = document.createElementNS(svgNS, 'path');

      path.setAttribute('d', d);

      svg.appendChild(path);
    });

    heading.appendChild(svg);
  });

  if (
    'IntersectionObserver' in window &&
    !reduceMotion.matches
  ) {
    const etchObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;

          target.classList.add('ls-drawn');

          observer.unobserve(target);
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -5% 0px'
      }
    );

    headings.forEach((heading) => {
      etchObserver.observe(heading);
    });
  } else {
    headings.forEach((heading) => {
      heading.classList.add('ls-drawn');
    });
  }

  /* ==========================================================
     5. INTERACTIVE PENCIL
     The pencil follows the pointer over the homepage artwork.
     ========================================================== */

  const heroDrawing = document.querySelector(
    '.hero-art, .hero-illustration'
  );

  if (
    heroDrawing &&
    finePointer.matches &&
    !reduceMotion.matches
  ) {
    const pencil = document.createElement('div');

    pencil.className = 'ls-pencil';
    pencil.setAttribute('aria-hidden', 'true');

    pencil.innerHTML = `
      <svg
        viewBox="0 0 36 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 13 18 2 24 13V79L18 96 12 79Z"
          fill="#d9a56b"
          stroke="#60452d"
          stroke-width="1.2"
        />

        <path
          d="M12 13H24M12 79H24"
          stroke="#60452d"
          stroke-width="1.3"
        />

        <path
          d="M16 15V77M20 15V77"
          stroke="#fff3c7"
          stroke-opacity=".65"
          stroke-width="1"
        />

        <path
          d="M12 79 18 96 24 79"
          fill="#dfc9a8"
          stroke="#60452d"
          stroke-width="1"
        />

        <path
          d="M16 90 18 96 20 90Z"
          fill="#292621"
        />

        <path
          d="M12 13V5Q18 1 24 5V13Z"
          fill="#b9655a"
          stroke="#60452d"
          stroke-width="1"
        />
      </svg>
    `;

    const tip = document.createElement('div');

    tip.className = 'ls-pencil-tip';
    tip.setAttribute('aria-hidden', 'true');

    document.body.append(pencil, tip);

    let targetX = -100;
    let targetY = -100;
    let x = -100;
    let y = -100;
    let active = false;
    let frame = 0;

    function render() {
      if (!active) {
        frame = 0;
        return;
      }

      // Smoothly move the pencil toward the pointer.
      x += (targetX - x) * 0.22;
      y += (targetY - y) * 0.22;

      pencil.style.transform = `
        translate3d(${x - 18}px, ${y - 86}px, 0)
        rotate(35deg)
      `;

      tip.style.transform = `
        translate3d(${x - 3}px, ${y - 3}px, 0)
      `;

      frame = requestAnimationFrame(render);
    }

    heroDrawing.addEventListener('pointerenter', () => {
      active = true;

      pencil.classList.add('ls-visible');
      tip.classList.add('ls-visible');

      if (!frame) {
        frame = requestAnimationFrame(render);
      }
    });

    heroDrawing.addEventListener(
      'pointermove',
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
      },
      { passive: true }
    );

    heroDrawing.addEventListener('pointerleave', () => {
      active = false;

      cancelAnimationFrame(frame);
      frame = 0;

      pencil.classList.remove('ls-visible');
      tip.classList.remove('ls-visible');
    });

    addEventListener(
      'pagehide',
      () => cancelAnimationFrame(frame),
      { once: true }
    );
  }

  /* ==========================================================
     6. SKETCHBOOK PAGE TURN
     Internal navigation animates like turning a paper page.
     ========================================================== */

  const turn = document.createElement('div');

  turn.className = 'ls-page-turn';
  turn.setAttribute('aria-hidden', 'true');

  turn.innerHTML = `
    <div class="ls-page-leaf"></div>
    <span class="ls-page-caption">Turning the page…</span>
  `;

  document.body.appendChild(turn);

  let navigating = false;

  document.addEventListener('click', (event) => {
    if (
      reduceMotion.matches ||
      navigating ||
      event.defaultPrevented
    ) {
      return;
    }

    // Don't interfere with modified clicks or new tabs.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest('a[href]');

    if (
      !link ||
      link.hasAttribute('download') ||
      (link.target && link.target !== '_self')
    ) {
      return;
    }

    const destination = new URL(
      link.href,
      location.href
    );

    // Only animate navigation between local HTML pages.
    if (
      destination.origin !== location.origin ||
      destination.pathname === location.pathname
    ) {
      return;
    }

    if (!/\.html?$/i.test(destination.pathname)) {
      return;
    }

    const fromDir = location.pathname.slice(
      0,
      location.pathname.lastIndexOf('/') + 1
    );

    const toDir = destination.pathname.slice(
      0,
      destination.pathname.lastIndexOf('/') + 1
    );

    if (fromDir !== toDir) return;

    event.preventDefault();

    navigating = true;

    turn.classList.add('ls-turning');

    // Navigation always continues after a short delay.
    setTimeout(() => {
      location.assign(destination.href);
    }, 620);
  });

  // Reset the animation when returning using Back or Forward.
  addEventListener('pageshow', () => {
    navigating = false;

    turn.classList.remove('ls-turning');

    updateProgress();
  });
})();
