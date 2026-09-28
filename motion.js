/* =========================================================
   motion.js — graphite drawing sequence + scroll reveals

   Progressive enhancement only. Three jobs:

     1. Draws the pencil sequence on the home page: each stroke
        is revealed by shortening its dash offset while a nib
        rides the head of the stroke, trailing graphite dust.
     2. Releases the hero once the sheet lifts.
     3. Scroll-reveals [data-reveal] elements with a stagger.

   The stage is inert markup marked `hidden`, so if this file
   never loads the page is already fully readable. Every exit
    path removes the stage, and a wall-clock failsafe in
   index.html covers the case where this script itself throws.
   ========================================================= */

(function () {
    "use strict";

    var root = document.documentElement;
    var stage = document.getElementById("graphite-stage");

    /* this script drives the reveal, so the inline failsafe is moot */
    if (window.__motionFailsafe) {
        window.clearTimeout(window.__motionFailsafe);
    }

    var DRAW_MS = 4200;   /* keep in sync with --draw-time in style.css */
    var LIFT_MS = 900;
    var MAX_MOTES = 26;

    /* Draw order. Shadow strokes share a key with the stroke they
       sit beneath so the pair grows together. */
    var TIMELINE = [
        { key: 0, from: 150, to: 1500 },
        { key: 1, from: 1250, to: 2450 },
        { key: 2, from: 2300, to: 3450 },
        { key: 3, from: 3250, to: 3950 },
        { key: 4, from: 3600, to: 4050 }
    ];

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var revealsStarted = false;

    function showPage() {
        root.classList.add("reveal-on");
    }

    function removeStage() {
        if (stage && stage.parentNode) {
            stage.parentNode.removeChild(stage);
        }
        stage = null;
    }

    /* ---------- No stage: just reveal and wire up scroll ---------- */
    function startReveals() {
        if (revealsStarted) {
            return;
        }
        revealsStarted = true;

        var targets = Array.prototype.slice.call(
            document.querySelectorAll("[data-reveal]")
        );

        if (!("IntersectionObserver" in window) || !targets.length) {
            targets.forEach(function (el) {
                el.classList.add("is-in");
            });
            return;
        }

        /* stagger siblings so a run of elements cascades */
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
    }

    if (!stage || reduce) {
        /* nothing to draw, or motion is unwelcome: go straight to content */
        removeStage();
        showPage();
        startReveals();
        return;
    }


    /* =========================================================
       THE DRAWING SEQUENCE
       ========================================================= */
    try {
        var paths = Array.prototype.slice.call(
            stage.querySelectorAll("path[data-draw]")
        );

        var groups = TIMELINE.map(function (step) {
            var members = paths.filter(function (p) {
                return Number(p.getAttribute("data-draw")) === step.key;
            });

            members.forEach(function (p) {
                var len = p.getTotalLength();
                if (!len) {
                    return;
                }
                p.style.strokeDasharray = len + " " + len;
                p.style.strokeDashoffset = String(len);
            });

            /* the first member drives the nib */
            return { step: step, members: members, leader: members[0] || null };
        });

        var nib = document.getElementById("gs-nib");
        var dust = document.getElementById("gs-dust");
        var caption = document.getElementById("gs-caption");
        var bar = document.getElementById("gs-progress-bar");

        var raf = 0;
        var start = 0;
        var lifted = false;
        var moteCount = 0;
        var lastMote = 0;
        var skipped = false;

        stage.hidden = false;

        function easeDraw(t) {
            /* slow start, decisive middle, gentle settle — the pace
               of a hand moving a pencil rather than a linear wipe */
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function spawnMote(xPct, yPct) {
            if (moteCount >= MAX_MOTES) {
                return;
            }
            moteCount += 1;

            var mote = document.createElement("span");
            mote.className = "gs-mote";
            mote.style.left = xPct + "%";
            mote.style.top = yPct + "%";

            var drift = (Math.random() * 34 - 17).toFixed(1);
            var fall = (26 + Math.random() * 46).toFixed(1);
            var dur = (620 + Math.random() * 720).toFixed(0);

            mote.animate(
                [
                    { transform: "translate(0,0) scale(1)", opacity: 0.85 },
                    { transform: "translate(" + drift + "px," + fall + "px) scale(0.3)", opacity: 0 }
                ],
                { duration: dur, easing: "cubic-bezier(0.2,0.6,0.4,1)", fill: "forwards" }
            ).onfinish = function () {
                if (mote.parentNode) {
                    mote.parentNode.removeChild(mote);
                }
                moteCount -= 1;
            };

            dust.appendChild(mote);
        }

        function moveNib(leader, drawn) {
            if (!leader || !nib) {
                return;
            }

            var total = leader.getTotalLength();
            if (!total) {
                return;
            }

            var at = Math.max(0, Math.min(total, drawn));
            var pt = leader.getPointAtLength(at);

            /* tangent from a hair ahead, so the nib keeps its angle
               at the very end of the stroke instead of snapping flat */
            var ahead = leader.getPointAtLength(Math.min(total, at + 1.5));
            var angle = 0;
            if (Math.abs(ahead.x - pt.x) > 0.001 || Math.abs(ahead.y - pt.y) > 0.001) {
                angle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
            }

            /* viewBox is 300x200 and the sheet is 3:2, so the SVG
               maps 1:1 onto the sheet and percentages are exact */
            nib.style.left = (pt.x / 300 * 100) + "%";
            nib.style.top = (pt.y / 200 * 100) + "%";
            nib.style.transform = "rotate(" + angle.toFixed(1) + "deg)";
        }

        function frame(now) {
            if (!stage) {
                return;
            }
            if (!start) {
                start = now;
            }

            var t = now - start;

            if (skipped) {
                t = Math.min(t, DRAW_MS);
            }

            /* progress rule */
            if (bar) {
                bar.style.transform = "scaleX(" + Math.min(1, t / DRAW_MS).toFixed(4) + ")";
            }

            /* caption settles in as the monogram takes shape */
            if (caption) {
                var capT = Math.max(0, Math.min(1, (t - 2400) / 700));
                caption.style.opacity = capT.toFixed(3);
                caption.style.transform =
                    "translateX(-50%) translateY(" + ((1 - capT) * 8).toFixed(2) + "px)";
            }

            if (nib) {
                nib.style.opacity = t > 120 && t < DRAW_MS - 120 ? "1" : "0";
            }

            var liveNib = false;

            for (var i = 0; i < groups.length; i += 1) {
                var g = groups[i];
                var span = g.step.to - g.step.from;

                if (t < g.step.from) {
                    continue;
                }

                var p = span > 0 ? Math.max(0, Math.min(1, (t - g.step.from) / span)) : 1;
                var eased = easeDraw(p);

                for (var j = 0; j < g.members.length; j += 1) {
                    var el = g.members[j];
                    var total = el.getTotalLength();
                    if (total) {
                        el.style.strokeDashoffset = String(total * (1 - eased));
                    }
                }

                if (g.leader) {
                    var gTotal = g.leader.getTotalLength();
                    moveNib(g.leader, gTotal * eased);
                    liveNib = true;

                    /* dust falls from the contact point, not the whole path */
                    if (t - lastMote > 105 && t < DRAW_MS) {
                        lastMote = t;
                        var pt = g.leader.getPointAtLength(gTotal * eased);
                        spawnMote((pt.x / 300 * 100).toFixed(2), (pt.y / 200 * 100).toFixed(2));
                    }
                }
            }

            if (!liveNib && nib) {
                nib.style.opacity = "0";
            }

            if (t >= DRAW_MS && !lifted) {
                lifted = true;
                finish(skipped ? 420 : LIFT_MS);
                return;
            }

            raf = window.requestAnimationFrame(frame);
        }

        function finish(liftMs) {
            window.cancelAnimationFrame(raf);
            raf = 0;

            /* every stroke fully drawn before the sheet lifts, so a
               fast skip never shows a half-drawn mark */
            groups.forEach(function (g) {
                g.members.forEach(function (el) {
                    el.style.strokeDashoffset = "0";
                });
            });

            if (nib) {
                nib.style.opacity = "0";
            }

            if (bar) {
                bar.style.transform = "scaleX(1)";
            }
            if (caption) {
                caption.style.opacity = "1";
            }

            stage.classList.add("is-lifting");
            stage.style.setProperty("--lift-ms", liftMs + "ms");

            /* start the hero as the sheet begins to clear */
            window.setTimeout(showPage, 120);

            var dropTimer = window.setTimeout(function () {
                removeStage();
                startReveals();
            }, liftMs + 60);

            stage.addEventListener("animationend", function (event) {
                if (event.target !== stage) {
                    return;
                }
                window.clearTimeout(dropTimer);
                removeStage();
                startReveals();
            });
        }

        function skip() {
            if (skipped || lifted) {
                return;
            }
            skipped = true;
            stage.classList.add("is-skipped");
        }

        ["click", "keydown", "touchstart", "wheel"].forEach(function (evt) {
            window.addEventListener(evt, skip, { passive: true });
        });

        /* Wall-clock backstop: if rAF is throttled or stalled the
           stage still comes down and the page stays reachable. */
        window.setTimeout(function () {
            if (!lifted) {
                skipped = true;
                finish(420);
            }
        }, DRAW_MS + 900);

        raf = window.requestAnimationFrame(frame);
    } catch (err) {
        /* the drawing is decoration; if any of it fails, drop it */
        removeStage();
        root.classList.add("reveal-on", "reveal-fallback");
    }
}());
