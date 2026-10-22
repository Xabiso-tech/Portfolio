
/* ============================================================
   THE LIVING SKETCHBOOK
   FILE 4: CINEMATIC INTRODUCTION

   This file adds a cinematic opening animation to the
   existing sketchbook introduction.

   It works alongside sketchbook.js and does not replace it.
   No external JavaScript libraries are required.
   ============================================================ */

(() => {
  "use strict";

  // Wait until the HTML elements are available.
  function initialiseCinematicIntro() {
    const cover = document.getElementById("book-cover");

    if (!cover) return;

    const openButtons = cover.querySelectorAll(
      "[data-open-book]"
    );

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const prefersReducedMotion = () => reducedMotion.matches;

    let opening = false;

    /* --------------------------------------------------------
       1. ADD ANIMATION STYLES
       These styles belong only to the cinematic introduction.
       -------------------------------------------------------- */

    const style = document.createElement("style");

    style.id = "cinematic-intro-styles";

    style.textContent = `
      /* Keep the original dialog above the page. */
      #book-cover {
        position: fixed;
        overflow: hidden;
        isolation: isolate;
        perspective: 1500px;
        transform-origin: left center;
      }

      /* Darkened atmosphere behind the book. */
      #book-cover::backdrop {
        background:
          radial-gradient(
            ellipse at center,
            rgba(31, 25, 20, .76),
            rgba(10, 9, 8, .95)
          );
        backdrop-filter: blur(9px);
      }

      /* A faint diagonal light moving across the cover. */
      #book-cover::before {
        content: "";
        position: absolute;
        inset: -70%;
        z-index: -1;
        pointer-events: none;
        background: linear-gradient(
          110deg,
          transparent 42%,
          rgba(255, 255, 255, .09) 49%,
          transparent 56%
        );
        transform: translateX(-55%) rotate(-8deg);
        animation: cinematic-cover-light 4s ease-in-out
          infinite alternate;
      }

      /* The decorative drawing starts invisible. */
      #book-cover .cover-strokes path {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.6;
        stroke-linecap: round;
        stroke-dasharray: 1400;
        stroke-dashoffset: 1400;
      }

      #book-cover.cinematic-ready .cover-strokes path {
        animation: cinematic-pencil-draw
          2.6s cubic-bezier(.3, .1, .1, 1) forwards;
      }

      /* The title gently appears like a book-cover reveal. */
      #book-cover.cinematic-ready .cover-name {
        animation: cinematic-title-arrive
          1.15s cubic-bezier(.2, .7, .2, 1) both;
      }

      #book-cover.cinematic-ready .cover-subtitle {
        animation: cinematic-title-arrive
          1.15s ease .25s both;
      }

      #book-cover.cinematic-ready blockquote {
        animation: cinematic-title-arrive
          1.15s ease .55s both;
      }

      /* A decorative book spine adds physical depth. */
      .cinematic-book-spine {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: clamp(12px, 2vw, 28px);
        z-index: 4;
        pointer-events: none;
        background: linear-gradient(
          90deg,
          rgba(0, 0, 0, .36),
          rgba(255, 255, 255, .06) 36%,
          rgba(0, 0, 0, .12) 70%,
          transparent
        );
        border-right: 1px solid rgba(255, 255, 255, .12);
      }

      /* A sheet of paper turns over the open cover. */
      .cinematic-turning-sheet {
        position: absolute;
        inset: 0;
        z-index: 8;
        pointer-events: none;
        visibility: hidden;
        opacity: 0;
        transform-origin: left center;
        transform: rotateY(0deg);
        backface-visibility: visible;
        background:
          repeating-linear-gradient(
            0deg,
            transparent 0 5px,
            rgba(90, 72, 52, .025) 6px
          ),
          #f4efe4;
        box-shadow:
          inset 18px 0 35px rgba(62, 47, 30, .12),
          15px 10px 35px rgba(0, 0, 0, .2);
      }

      .cinematic-turning-sheet::after {
        content: "";
        position: absolute;
        inset: 9%;
        border: 1px solid rgba(80, 62, 40, .12);
      }

      /* The complete book begins its opening sequence. */
      #book-cover.cinematic-opening {
        animation: cinematic-book-open
          1.15s cubic-bezier(.4, 0, .2, 1) forwards;
        pointer-events: none;
      }

      #book-cover.cinematic-opening
      .cinematic-turning-sheet {
        visibility: visible;
        opacity: 1;
        animation: cinematic-sheet-turn
          1.05s cubic-bezier(.4, 0, .2, 1) forwards;
      }

      /* Fade the contents as the page begins turning. */
      #book-cover.cinematic-opening
      > :not(.cinematic-turning-sheet):not(.cinematic-book-spine) {
        animation: cinematic-content-away
          .4s ease forwards;
      }

      /* Reveal the homepage as the book opens. */
      body.cinematic-revealing main[data-page="home"] {
        animation: cinematic-home-reveal
          1.2s cubic-bezier(.2, .7, .2, 1) both;
      }

      @keyframes cinematic-cover-light {
        to {
          transform: translateX(55%) rotate(-8deg);
        }
      }

      @keyframes cinematic-pencil-draw {
        to {
          stroke-dashoffset: 0;
        }
      }

      @keyframes cinematic-title-arrive {
        from {
          opacity: 0;
          transform: translateY(18px);
          filter: blur(5px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
      }

      @keyframes cinematic-content-away {
        to {
          opacity: 0;
          transform: translateX(-12px);
        }
      }

      @keyframes cinematic-sheet-turn {
        0% {
          transform: rotateY(0deg);
          opacity: 1;
        }

        60% {
          transform: rotateY(-95deg);
          opacity: 1;
        }

        100% {
          transform: rotateY(-165deg);
          opacity: 0;
        }
      }

      @keyframes cinematic-book-open {
        0% {
          transform: perspective(1500px)
            rotateY(0deg) scale(1);
          opacity: 1;
        }

        65% {
          transform: perspective(1500px)
            rotateY(-42deg) scale(.97);
          opacity: 1;
        }

        100% {
          transform: perspective(1500px)
            rotateY(-78deg) scale(.9);
          opacity: 0;
        }
      }

      @keyframes cinematic-home-reveal {
        from {
          opacity: .3;
          transform: translateY(25px) scale(.985);
          filter: blur(6px);
        }

        to {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #book-cover,
        #book-cover *,
        body.cinematic-revealing main[data-page="home"] {
          animation: none !important;
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);

    /* --------------------------------------------------------
       2. ADD THE PHYSICAL BOOK DETAILS
       These elements are decorative only.
       -------------------------------------------------------- */

    const spine = document.createElement("div");

    spine.className = "cinematic-book-spine";
    spine.setAttribute("aria-hidden", "true");

    const turningSheet = document.createElement("div");

    turningSheet.className = "cinematic-turning-sheet";
    turningSheet.setAttribute("aria-hidden", "true");

    cover.append(spine, turningSheet);

    /* --------------------------------------------------------
       3. ANIMATE THE COVER WHEN IT APPEARS
       -------------------------------------------------------- */

    function prepareCover() {
      if (!cover.open || opening) return;

      cover.classList.remove(
        "cinematic-opening",
        "cinematic-ready"
      );

      // Restart the introductory pencil and title animations.
      void cover.offsetWidth;

      cover.classList.add("cinematic-ready");
    }

    // The existing script controls when the dialog opens.
    const coverObserver = new MutationObserver(() => {
      if (cover.open) {
        prepareCover();
      }
    });

    coverObserver.observe(cover, {
      attributes: true,
      attributeFilter: ["open"]
    });

    if (cover.open) {
      prepareCover();
    }

    /* --------------------------------------------------------
       4. ANIMATE THE OPEN-BUTTON ACTION

       We intercept the first click before sketchbook.js
       handles it, play the animation, then let the original
       script complete the opening action.
       -------------------------------------------------------- */

    function openCinematically(event) {
      if (opening || prefersReducedMotion()) return;

      // Only animate when the introduction is actually open.
      if (!cover.open) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      opening = true;

      const button = event.currentTarget;

      document.body.classList.add(
        "cinematic-revealing"
      );

      cover.classList.add("cinematic-opening");

      // Let the original open-button handler close the dialog.
      window.setTimeout(() => {
        cover.classList.remove(
          "cinematic-opening",
          "cinematic-ready"
        );

        opening = false;

        // Temporarily bypass our own click interception.
        button.removeEventListener(
          "click",
          openCinematically,
          true
        );

        button.click();

        button.addEventListener(
          "click",
          openCinematically,
          true
        );
      }, 1120);
    }

    openButtons.forEach((button) => {
      button.addEventListener(
        "click",
        openCinematically,
        true
      );
    });

    /* --------------------------------------------------------
       5. CLEAN UP AFTER THE REVEAL
       -------------------------------------------------------- */

    cover.addEventListener("close", () => {
      cover.classList.remove(
        "cinematic-opening",
        "cinematic-ready"
      );

      window.setTimeout(() => {
        document.body.classList.remove(
          "cinematic-revealing"
        );
      }, 1300);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseCinematicIntro,
      { once: true }
    );
  } else {
    initialiseCinematicIntro();
  }
})();
