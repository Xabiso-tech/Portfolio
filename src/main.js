
/* ==========================================================
   TECH'STAMENT — CINEMATIC APPLICATION CONTROLLER

   Experience:
   1. Darkness
   2. Light reveals the Bible cover
   3. Camera pulls back to reveal the Bible on a table
   4. OPEN THE TESTAMENT button appears
   5. Visitor opens the Bible
   6. Portfolio content is revealed

   ========================================================== */

import { gsap } from 'gsap';
import { BookScene } from './three/BookScene.js';

// ----------------------------------------------------------
// 1. HTML ELEMENTS
// ----------------------------------------------------------

const bookContainer = document.querySelector('#book-canvas');
const intro = document.querySelector('#intro');
const introHeader = document.querySelector('.intro-header');
const introTitle = document.querySelector('.intro-title');
const introActions = document.querySelector('.intro-actions');
const introFooter = document.querySelector('.intro-footer');

const openButton = document.querySelector('#open-testament');
const portfolio = document.querySelector('#portfolio');
const portfolioHeading = document.querySelector('#portfolio-heading');

const soundButton = document.querySelector('#sound-toggle');
const soundLabel = document.querySelector('.sound-label');

const skipLinks = document.querySelectorAll(
  'a[href="#portfolio"]'
);

// ----------------------------------------------------------
// 2. APPLICATION STATE
// ----------------------------------------------------------

let bookScene = null;
let introTimeline = null;

let hasOpened = false;
let isOpening = false;
let introFinished = false;
let transitionCancelled = false;

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// ----------------------------------------------------------
// 3. INITIAL DISPLAY
// ----------------------------------------------------------

function prepareIntroduction() {
  // The Bible canvas remains visible, but its lighting
  // starts nearly black inside the Three.js scene.

  gsap.set(introHeader, {
    autoAlpha: 0
  });

  gsap.set(introTitle, {
    autoAlpha: 0
  });

  gsap.set(introActions, {
    autoAlpha: 0,
    y: 25
  });

  gsap.set(introFooter, {
    autoAlpha: 0
  });

  if (openButton) {
    openButton.disabled = true;
  }

  // Prevent the old title from covering the close-up.
  // The Bible cover itself carries the TECH'STAMENT name.
  if (introTitle) {
    introTitle.setAttribute('aria-hidden', 'true');
  }
}

// ----------------------------------------------------------
// 4. CREATE THE 3D BIBLE
// ----------------------------------------------------------

function initializeBook() {
  if (!bookContainer) return;

  try {
    bookScene = new BookScene(bookContainer);

    console.log(
      "TECH'STAMENT: Cinematic Bible scene initialized."
    );
  } catch (error) {
    console.error(
      "TECH'STAMENT: Unable to initialize the Bible.",
      error
    );

    bookContainer.classList.add('book-canvas--fallback');
  }
}

// ----------------------------------------------------------
// 5. CINEMATIC INTRODUCTION
// ----------------------------------------------------------

async function playCinematicIntroduction() {
  if (!bookScene) {
    showReadyInterface();
    return;
  }

  // Respect accessibility preferences.
  if (prefersReducedMotion) {
    await bookScene.playIntro();

    if (!transitionCancelled) {
      showReadyInterface();
    }

    return;
  }

  // The 3D scene controls the spotlight and camera.
  // It starts with the camera close to the leather cover.
  try {
    await bookScene.playIntro();
  } catch (error) {
    console.error(
      "TECH'STAMENT: Introduction animation failed.",
      error
    );
  }

  if (transitionCancelled) return;

  // Only now reveal the controls.
  showReadyInterface();
}

// ----------------------------------------------------------
// 6. REVEAL THE INVITATION
// ----------------------------------------------------------

function showReadyInterface() {
  if (transitionCancelled || hasOpened) return;

  introFinished = true;

  if (openButton) {
    openButton.disabled = false;
  }

  if (prefersReducedMotion) {
    gsap.set(
      [introHeader, introActions, introFooter],
      {
        autoAlpha: 1,
        y: 0
      }
    );

    return;
  }

  introTimeline = gsap.timeline({
    defaults: {
      ease: 'power2.out'
    }
  });

  introTimeline
    .to(introHeader, {
      autoAlpha: 1,
      duration: 0.8
    })
    .to(
      introActions,
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1
      },
      '-=0.3'
    )
    .to(
      introFooter,
      {
        autoAlpha: 1,
        duration: 0.8
      },
      '-=0.6'
    );
}

// ----------------------------------------------------------
// 7. OPEN THE TESTAMENT
// ----------------------------------------------------------

async function openTestament() {
  if (
    !introFinished ||
    isOpening ||
    hasOpened
  ) {
    return;
  }

  isOpening = true;

  if (openButton) {
    openButton.disabled = true;
    openButton.setAttribute('aria-busy', 'true');
  }

  // Hide the invitation before the Bible opens.
  if (!prefersReducedMotion) {
    await new Promise(resolve => {
      gsap.to(
        [introActions, introFooter],
        {
          autoAlpha: 0,
          y: 20,
          duration: 0.65,
          ease: 'power2.inOut',
          onComplete: resolve
        }
      );
    });
  }

  if (transitionCancelled) return;

  // Physically open the Bible.
  if (bookScene) {
    try {
      await bookScene.open();
    } catch (error) {
      console.error(
        "TECH'STAMENT: Bible opening failed.",
        error
      );
    }
  }

  if (transitionCancelled) return;

  // Allow visitors to see the opened Bible.
  if (!prefersReducedMotion) {
    await new Promise(resolve => {
      gsap.delayedCall(0.9, resolve);
    });
  }

  if (transitionCancelled) return;

  // Temporary transition into portfolio content.
  // Later the contents will appear inside the book.
  if (!prefersReducedMotion) {
    await new Promise(resolve => {
      gsap.to(bookContainer, {
        autoAlpha: 0,
        duration: 1,
        ease: 'power2.inOut',
        onComplete: resolve
      });
    });
  }

  if (transitionCancelled) return;

  revealPortfolio();
}

// ----------------------------------------------------------
// 8. PORTFOLIO REVEAL
// ----------------------------------------------------------

function revealPortfolio() {
  if (!portfolio) return;

  hasOpened = true;
  isOpening = false;

  if (openButton) {
    openButton.removeAttribute('aria-busy');
  }

  portfolio.scrollIntoView({
    behavior: 'auto',
    block: 'start'
  });

  if (portfolioHeading) {
    portfolioHeading.setAttribute('tabindex', '-1');

    portfolioHeading.focus({
      preventScroll: true
    });
  }

  if (!prefersReducedMotion) {
    gsap.fromTo(
      '.portfolio-inner',
      {
        autoAlpha: 0,
        y: 35
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: 'power3.out'
      }
    );
  }
}

// ----------------------------------------------------------
// 9. SKIP INTRO
// ----------------------------------------------------------

function skipIntroduction(event) {
  event.preventDefault();

  transitionCancelled = true;

  if (introTimeline) {
    introTimeline.kill();
  }

  gsap.killTweensOf([
    introHeader,
    introTitle,
    introActions,
    introFooter,
    bookContainer
  ]);

  revealPortfolio();
}

// ----------------------------------------------------------
// 10. SOUND BUTTON
// ----------------------------------------------------------

function initializeSoundButton() {
  if (!soundButton) return;

  // No audio is connected yet, so don't falsely
  // display SOUND ON.
  soundButton.disabled = true;

  soundButton.setAttribute(
    'aria-label',
    'Sound coming in a future update'
  );

  soundButton.setAttribute(
    'aria-pressed',
    'false'
  );

  soundButton.title = 'Sound will be added later';

  if (soundLabel) {
    soundLabel.textContent = 'SOUND OFF';
  }
}

// ----------------------------------------------------------
// 11. REGISTER INTERACTIONS
// ----------------------------------------------------------

function registerEvents() {
  if (openButton) {
    openButton.addEventListener(
      'click',
      openTestament
    );
  }

  skipLinks.forEach(link => {
    link.addEventListener(
      'click',
      skipIntroduction
    );
  });
}

// ----------------------------------------------------------
// 12. INITIALIZE THE EXPERIENCE
// ----------------------------------------------------------

async function initializeApplication() {
  prepareIntroduction();

  initializeSoundButton();
  registerEvents();

  initializeBook();

  // Wait for the browser to paint the initial darkness
  // before beginning the light reveal.
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

  if (!transitionCancelled) {
    await playCinematicIntroduction();
  }

  console.log(
    "TECH'STAMENT: Cinematic sequence initialized."
  );
}

initializeApplication();

// ----------------------------------------------------------
// 13. CLEANUP
// ----------------------------------------------------------

window.addEventListener('pagehide', () => {
  transitionCancelled = true;

  if (introTimeline) {
    introTimeline.kill();
  }

  if (bookScene) {
    bookScene.destroy();
    bookScene = null;
  }
});


/* ==========================================================
   TECH'STAMENT — MANUSCRIPT PAGE NAVIGATION

   Handles:
   - Next and previous page buttons
   - GSAP page-turn animations
   - Current page indicator
   - Navigation button states
   ========================================================== */

function initializeManuscriptPages() {
  // Find the manuscript and its navigation controls.
  const book = document.querySelector("#testament-book");
  const pages = Array.from(
    document.querySelectorAll(".testament-page")
  );

  const previousButton = document.querySelector("#previous-page");
  const nextButton = document.querySelector("#next-page");
  const pageIndicator = document.querySelector("#page-indicator");

  // Do nothing if the manuscript is not on this page.
  if (
    !book ||
    pages.length === 0 ||
    !previousButton ||
    !nextButton ||
    !pageIndicator
  ) {
    return;
  }

  // Track the currently visible page.
  let currentPage = 0;

  // Prevent multiple animations from running together.
  let isTurning = false;

  // Roman numerals for the page indicator.
  const romanNumerals = ["I", "II", "III", "IV"];

  // Respect the visitor's reduced-motion preference.
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // Update the navigation controls.
  function updatePageControls() {
    previousButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === pages.length - 1;

    const pageNumber =
      romanNumerals[currentPage] || String(currentPage + 1);

    const totalPages =
      romanNumerals[pages.length - 1] || String(pages.length);

    pageIndicator.textContent =
      `PAGE ${pageNumber} OF ${totalPages}`;
  }

  // Display a particular manuscript page.
  function showPage(index) {
    pages.forEach((page, pageIndex) => {
      const isActive = pageIndex === index;

      page.hidden = !isActive;
      page.setAttribute("aria-hidden", String(!isActive));

      // Remove leftover animation transforms.
      gsap.set(page, {
        clearProps: "transform,opacity,transformOrigin"
      });
    });

    currentPage = index;
    updatePageControls();
  }

  // Animate from the current page to another page.
  function turnPage(direction) {
    if (isTurning) return;

    const nextIndex = currentPage + direction;

    // Stop at the beginning or end of the manuscript.
    if (nextIndex < 0 || nextIndex >= pages.length) {
      return;
    }

    // Skip animation if reduced motion is requested.
    if (reducedMotion.matches) {
      showPage(nextIndex);
      return;
    }

    isTurning = true;

    const outgoingPage = pages[currentPage];
    const incomingPage = pages[nextIndex];

    // Reveal the next page beneath the current one.
    incomingPage.hidden = false;
    incomingPage.setAttribute("aria-hidden", "true");

    gsap.set(incomingPage, {
      opacity: 1,
      rotationY: 0,
      zIndex: 1
    });

    gsap.set(outgoingPage, {
      transformOrigin:
        direction === 1 ? "left center" : "right center",
      transformPerspective: 1400,
      backfaceVisibility: "hidden",
      rotationY: 0,
      zIndex: 2
    });

    // Temporarily prevent clicks during the animation.
    previousButton.disabled = true;
    nextButton.disabled = true;

    const timeline = gsap.timeline({
      onComplete: () => {
        isTurning = false;
        showPage(nextIndex);
      }
    });

    timeline.to(outgoingPage, {
      rotationY: direction === 1 ? -85 : 85,
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut"
    });

    timeline.fromTo(
      incomingPage,
      {
        opacity: 0.65,
        scale: 0.985
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.55,
        ease: "power2.out"
      },
      0.25
    );
  }

  // Connect the navigation buttons.
  nextButton.addEventListener("click", () => {
    turnPage(1);
  });

  previousButton.addEventListener("click", () => {
    turnPage(-1);
  });

  // Set up the initial title page.
  showPage(0);
}

// Start manuscript navigation when the page is ready.
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeManuscriptPages
  );
} else {
  initializeManuscriptPages();
}

