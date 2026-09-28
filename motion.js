/* =========================================================
   motion.js — landing page motion layer
   Progressive enhancement only:
     1. Dismisses the intro curtain on demand (never blocks UI)
     2. Starts / restarts the hero entrance timeline
     3. Scroll-reveals [data-reveal] elements with stagger
   The page stays fully readable if this file fails to load —
   an inline failsafe in index.html reveals everything instead.
   ========================================================= */

(function () {
    "use strict";

    var root = document.documentElement;
    var overlay = document.getElementById("intro-overlay");

    /* the hero is controlled from here, so the inline failsafe is moot */
    if (window.__motionFailsafe) {
        window.clearTimeout(window.__motionFailsafe);
    }

    var heroRunning = false;
    var curtainGone = false;

    function startHero(force) {
        if (heroRunning && !force) {
            return;
        }
        heroRunning = true;

        /* reflow so the entrance animations replay from zero */
        root.classList.remove("reveal-on");
        void root.offsetWidth;
        root.classList.add("reveal-on");
    }

    function dropCurtain() {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        overlay = null;
    }

    function dismiss() {
        if (curtainGone) {
            return;
        }
        curtainGone = true;

        /* fast paper lift */
        root.classList.add("intro-skipped");

        /* restart the hero now that the delays are collapsed */
        startHero(true);

        if (overlay) {
            overlay.addEventListener("animationend", function (event) {
                /* only the curtain's own animation ends it, not its children */
                if (event.target === overlay) {
                    dropCurtain();
                }
            });
        }

        /* failsafe in case the exit animation never reports back */
        window.setTimeout(dropCurtain, 900);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        root.classList.add("reveal-on", "reveal-fallback");
        dropCurtain();
        return;
    }

    if (overlay) {
        overlay.addEventListener("animationend", function (event) {
            if (event.target !== overlay) {
                return;
            }
            curtainGone = true;
            dropCurtain();
        });

        ["click", "keydown", "touchstart", "wheel"].forEach(function (evt) {
            window.addEventListener(evt, dismiss, { passive: true });
        });
    }

    startHero(false);

    /* ---------- Scroll reveal ---------- */
    var targets = Array.prototype.slice.call(
        document.querySelectorAll("[data-reveal]")
    );

    if (!("IntersectionObserver" in window) || !targets.length) {
        return;
    }

    /* stagger siblings so a run of elements cascades instead of popping */
    var lastParent = null;
    var run = 0;

    targets.forEach(function (el) {
        if (el.parentNode !== lastParent) {
            lastParent = el.parentNode;
            run = 0;
        }
        el.style.setProperty("--reveal-delay", (run * 90) + "ms");
        run += 1;
    });

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    targets.forEach(function (el) {
        observer.observe(el);
    });
}());
