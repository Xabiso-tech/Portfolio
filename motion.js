/* Retained portfolio enhancements: scroll reveals, developing image plates,
   the original calculator, gallery filtering and subtle pointer tilt.
   Cover, theme, viewer and timeline live in sketchbook.js.
   Drawing logic lives in drafting-table.js. Navigation uses native links. */

(function () {
    "use strict";

    var root = document.documentElement;
    var body = document.body;

    if (window.__motionFailsafe) {
        window.clearTimeout(window.__motionFailsafe);
    }

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var compact = window.matchMedia("(max-width: 46rem)").matches;

    /* Every rAF loop registers here so one handler can stop them
       all when the page is being torn down. */
    var loops = [];

    function loop(fn) {
        var id = 0;
        var stopped = false;

        function tick(now) {
            if (stopped) {
                return;
            }
            fn(now);
            id = window.requestAnimationFrame(tick);
        }

        var handle = {
            cancel: function () {
                stopped = true;
                window.cancelAnimationFrame(id);
                id = 0;
            }
        };

        loops.push(handle);
        id = window.requestAnimationFrame(tick);
        return handle;
    }

    function stopAll() {
        loops.forEach(function (l) { l.cancel(); });
        loops = [];
    }

    window.addEventListener("pagehide", stopAll, { once: true });

    function easeOutQuint(t) {
        return 1 - Math.pow(1 - t, 5);
    }

    function easeDraw(t) {
        /* slow start, decisive middle, gentle settle: the pace of a
           hand moving a pencil rather than a linear wipe */
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function clamp01(v) {
        return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    function range(t, from, to) {
        return clamp01((t - from) / (to - from));
    }

    function rand(a, b) {
        return a + Math.random() * (b - a);
    }

    /* Show every [data-reveal] immediately. Used by the failsafe
       and whenever the reveal observer cannot run. */
    function revealAll() {
        root.classList.add("reveal-fallback");
        var list = document.querySelectorAll("[data-reveal]");
        for (var i = 0; i < list.length; i += 1) {
            list[i].classList.add("is-in");
        }
    }

    /* The year in the colophon is written once, here, so the
       footer does not slowly start lying. */
    (function stampYear() {
        var year = String(new Date().getFullYear());
        var slots = document.querySelectorAll(".year");
        for (var i = 0; i < slots.length; i += 1) {
            slots[i].textContent = year;
        }
    }());

    // Scroll-driven reveals; all content is readable before enhancement.
    function reveals() {
        var targets = [].slice.call(document.querySelectorAll("[data-reveal]"));
        if (!targets.length) { return; }

        if (reduce || !("IntersectionObserver" in window)) {
            targets.forEach(function (el) { el.classList.add("is-in"); });
            return;
        }

        /* Stagger runs of siblings so a grid cascades rather than
           arriving all at once. */
        var lastParent = null;
        var run = 0;

        targets.forEach(function (el) {
            if (el.parentNode !== lastParent) {
                lastParent = el.parentNode;
                run = 0;
            }
            el.style.setProperty("--reveal-delay", (run * 85) + "ms");
            run += 1;
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) { return; }
                entry.target.classList.add("is-in");
                observer.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -7% 0px", threshold: 0.1 });

        targets.forEach(function (el) { observer.observe(el); });
        root.classList.add("reveal-enhanced");
    }


    /* =====================================================
       4. PLATES
       One clock per plate drives the image, the guides, the
       edge and the dust, so nothing needs its own listener.
       ===================================================== */
    function plates() {
        var items = [].slice.call(document.querySelectorAll("[data-plate]"));
        if (!items.length) { return; }

        /* The construction frame and the drawn edge are the same
           on every study, so they are written once here rather than
           pasted twelve times into the page. */
        var GUIDE_MARKS = [
            "M3 3 L97 3 L97 97 L3 97 Z",
            "M3 3 L97 97 M97 3 L3 97",
            "M0 50 L100 50 M50 0 L50 100",
            "M0 3 L8 3 M3 0 L3 8 M92 3 L100 3 M97 0 L97 8",
            "M0 97 L8 97 M3 100 L3 92 M92 97 L100 97 M97 100 L97 92"
        ];

        var EDGE_MARKS = [
            "M0.6 1.4 Q26 0.4 50 1 Q74 1.6 99.2 1.2",
            "M1 0.8 Q0.4 30 1 50 Q1.6 76 0.8 99.2",
            "M99.2 1.2 Q99.6 30 99 50 Q98.4 76 99.4 99.2",
            "M0.8 99.2 Q26 99.6 50 99 Q74 98.4 99.2 99.2",
            "M18 96 Q50 97.4 82 96"
        ];

        function sheet(className, marks, heavyAt) {
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("class", className);
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("preserveAspectRatio", "none");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("focusable", "false");

            marks.forEach(function (d, i) {
                var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
                p.setAttribute("d", d);
                if (i === heavyAt) { p.setAttribute("class", className === "plate-edge" ? "e-heavy" : "p-heavy"); }
                svg.appendChild(p);
            });

            return svg;
        }

        items.forEach(function (plate) {
            var stageBox = plate.querySelector(".plate-stage");
            if (!stageBox) { return; }

            if (!plate.querySelector(".plate-tone")) {
                stageBox.appendChild(document.createElement("div")).className = "plate-tone";
            }
            if (!plate.querySelector(".plate-hatch")) {
                stageBox.appendChild(document.createElement("div")).className = "plate-hatch";
            }
            if (!plate.querySelector(".plate-guides")) {
                stageBox.appendChild(sheet("plate-guides", GUIDE_MARKS, 2));
            }
            if (!plate.querySelector(".plate-dust")) {
                stageBox.appendChild(document.createElement("div")).className = "plate-dust";
            }
            if (!plate.querySelector(".plate-edge")) {
                plate.appendChild(sheet("plate-edge", EDGE_MARKS, 4));
            }
        });

        function start(plate) {
            if (plate.dataset.plateDone) { return; }
            plate.dataset.plateDone = "1";

            var PLATE_MS = 2900;
            var img = plate.querySelector(".plate-img");
            var guides = [].slice.call(plate.querySelectorAll(".plate-guides path, .plate-guides line, .plate-guides circle, .plate-guides rect"));
            var edge = [].slice.call(plate.querySelectorAll(".plate-edge path"));
            var dust = plate.querySelector(".plate-dust");

            var gStrokes = guides.map(arm);
            var eStrokes = edge.map(arm);

            function arm(p) {
                var len = 0;
                try { len = p.getTotalLength(); } catch (err) { len = 0; }
                if (len) {
                    p.style.strokeDasharray = len + " " + len;
                    p.style.strokeDashoffset = String(len);
                }
                return { el: p, len: len };
            }

            function sweep(list, p) {
                for (var i = 0; i < list.length; i += 1) {
                    list[i].el.style.strokeDashoffset = String(list[i].len * (1 - p));
                }
            }

            if (reduce) {
                plate.style.setProperty("--draw", "1");
                sweep(gStrokes, 1);
                sweep(eStrokes, 1);
                return;
            }

            var w = plate.offsetWidth || 300;
            var h = plate.offsetHeight || 300;
            var motes = 0;
            var lastDust = 0;
            var startAt = 0;

            function fall(x, y) {
                if (motes > 16 || !dust) { return; }
                motes += 1;

                var mote = document.createElement("span");
                mote.className = "plate-mote";
                mote.style.left = x.toFixed(0) + "px";
                mote.style.top = y.toFixed(0) + "px";

                var anim = mote.animate(
                    [
                        { transform: "translate3d(0,0,0)", opacity: 0.65 },
                        { transform: "translate3d(" + rand(-12, 12).toFixed(0) + "px," + rand(16, 38).toFixed(0) + "px,0)", opacity: 0 }
                    ],
                    { duration: Math.round(rand(600, 1100)), easing: "ease-out", fill: "forwards" }
                );

                anim.onfinish = function () {
                    if (mote.parentNode) { mote.parentNode.removeChild(mote); }
                    motes -= 1;
                };

                dust.appendChild(mote);
            }

            function tick(now) {
                if (!startAt) { startAt = now; }
                var t = now - startAt;

                var draw = easeOutQuint(range(t, 480, 2380));
                plate.style.setProperty("--draw", draw.toFixed(4));

                sweep(gStrokes, easeDraw(range(t, 60, 1300)));
                sweep(eStrokes, easeDraw(range(t, 1700, PLATE_MS - 200)));

                if (t > 480 && t < 2400 && t - lastDust > 120) {
                    lastDust = t;
                    fall(draw * w, rand(h * 0.18, h * 0.86));
                }

                if (t >= PLATE_MS) {
                    plate.style.setProperty("--draw", "1");
                    sweep(gStrokes, 1);
                    sweep(eStrokes, 1);
                    return;
                }

                loopId = window.requestAnimationFrame(tick);
            }

            var loopId = window.requestAnimationFrame(tick);

            /* one rAF per plate is fine, but it must not outlive
               the page, so it is registered with the shared stop */
            loops.push({
                cancel: function () { window.cancelAnimationFrame(loopId); }
            });
        }

        if (!("IntersectionObserver" in window)) {
            items.forEach(start);
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) { return; }
                observer.unobserve(entry.target);
                start(entry.target);
            });
        }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });

        items.forEach(function (el) { observer.observe(el); });
    }


    /* =====================================================
       5. THE STUDIO CONSOLE
       A direct port of skills/graphite-calculator.py. Same
       operations, same guards, same sentences for the same
       mistakes, so the notes in the Toolkit stay honest.
       ===================================================== */
    function showNumber(v) {
        if (!isFinite(v)) { return String(v); }
        if (v === Math.round(v) && Math.abs(v) < 1e15) { return String(Math.round(v)); }
        return v.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    }

    function consoleUI() {
        var host = document.getElementById("studio-console");
        if (!host) { return; }

        var openBtn = document.getElementById("console-open");
        var closeBtn = document.getElementById("console-close");
        var screen = host.querySelector(".console-screen");
        var keys = host.querySelector(".console-keys");

        var history = [];
        var mode = "calc";
        var buffer = "";
        var acc = null;
        var op = null;
        var slots = [];
        var paper = 0;

        var PAPERS = [
            { name: "A4", w: 210, h: 297 },
            { name: "LETTER", w: 215.9, h: 279.4 },
            { name: "A3", w: 297, h: 420 },
            { name: "A5", w: 148, h: 210 },
            { name: "TABLOID", w: 279.4, h: 431.8 }
        ];

        var MODE_LABELS = {
            calc: "Arithmetic",
            percent: "Percentage",
            frame: "Frame maths",
            paper: "Paper and canvas"
        };

        function say(text, cls) {
            var p = document.createElement("p");
            p.className = cls || "";
            p.textContent = text;
            screen.appendChild(p);
            screen.scrollTop = screen.scrollHeight;
        }

        function clearScreen() {
            screen.textContent = "";
        }

        function value() {
            return buffer === "" ? 0 : parseFloat(buffer);
        }

        function push(bufferText) {
            if (bufferText.length > 14) { return; }
            if (buffer === "0" && bufferText !== ".") {
                buffer = bufferText;
            } else {
                buffer += bufferText;
            }
            echoLine();
        }

        /* the live line at the foot of the screen, so the visitor
           can see what they are typing without it feeling like a
           text field bolted onto an artwork */
        var echoEl = null;

        function echoLine() {
            if (!echoEl) {
                echoEl = document.createElement("p");
                echoEl.className = "c-echo";
                screen.appendChild(echoEl);
            }
            echoEl.textContent = "  " + (buffer === "" ? "0" : buffer) + "   ";
            screen.scrollTop = screen.scrollHeight;
        }

        function commitEcho() {
            if (echoEl) {
                echoEl.remove();
                echoEl = null;
            }
        }

        function banner() {
            say("");
            say("  " + MODE_LABELS[mode] + " — " + (mode === "calc"
                ? "two numbers and an operator"
                : mode === "percent"
                    ? "a percentage of a value, or what percent A is of B"
                    : mode === "frame"
                        ? "outer size and border width"
                        : "standard sizes and their ratios"), "c-dim");
        }

        /* -- operations ------------------------------------------- */
        var OPS = {
            "+": ["add", function (a, b) { return a + b; }],
            "-": ["subtract", function (a, b) { return a - b; }],
            "*": ["multiply", function (a, b) { return a * b; }],
            "/": ["divide", function (a, b) { return a / b; }],
            "%": ["modulo", function (a, b) { return a % b; }],
            "**": ["raise to a power", function (a, b) { return Math.pow(a, b); }]
        };

        function apply(a, o, b) {
            var pair = OPS[o];
            if (!pair) { return null; }

            var name = pair[0];

            /* the two operations that can genuinely divide by nothing */
            if ((o === "/" || o === "%") && b === 0) {
                say("  Cannot " + name + " by zero. There is no answer, so nothing was calculated.", "c-warn");
                return null;
            }

            var result;
            try {
                result = pair[1](a, b);
            } catch (err) {
                say("  That calculation is not valid.", "c-warn");
                return null;
            }

            if (isNaN(result)) {
                say("  That is not a real number (NaN).", "c-warn");
                return null;
            }
            if (!isFinite(result)) {
                say("  That result is too large to represent.", "c-warn");
                return null;
            }

            say("  " + showNumber(a) + " " + o + " " + showNumber(b) + "  =  " + showNumber(result), "c-result");
            say("  (" + name + ")", "c-dim");
            history.push(showNumber(a) + " " + o + " " + showNumber(b) + " = " + showNumber(result));
            return result;
        }

        function calcKey(k) {
            if (/^[0-9.]$/.test(k)) { push(k); return; }

            if (k === "AC") {
                buffer = "";
                acc = null;
                op = null;
                commitEcho();
                say("  Cleared.", "c-dim");
                return;
            }

            if (k === "+-") {
                if (!buffer) { buffer = "0"; }
                buffer = buffer.charAt(0) === "-" ? buffer.slice(1) : "-" + buffer;
                echoLine();
                return;
            }

            if (k === "=") {
                if (op === null) {
                    say("  Choose an operator first, then a number.", "c-warn");
                    return;
                }
                if (buffer === "") {
                    say("  Enter the second number.", "c-warn");
                    return;
                }
                var b = value();
                commitEcho();
                apply(acc, op, b);
                buffer = "";
                op = null;
                return;
            }

            /* any of the six operators */
            if (OPS[k]) {
                if (op !== null) {
                    /* chain: fold the pending pair first, as a
                       calculator should, and keep going */
                    if (buffer === "") {
                        say("  Enter the second number.", "c-warn");
                        return;
                    }
                    var pending = value();
                    commitEcho();
                    var carried = apply(acc, op, pending);
                    if (carried === null) {
                        /* the fold failed, so drop the whole chain
                           rather than continue from a bad number */
                        buffer = "";
                        op = null;
                        acc = null;
                        return;
                    }
                    acc = carried;
                } else {
                    commitEcho();
                    acc = value();
                }
                buffer = "";
                op = k;
                say("  " + showNumber(acc) + " " + k, "c-echo");
            }
        }

        function percentKey(k) {
            if (/^[0-9.]$/.test(k)) { push(k); return; }

            if (k === "AC") {
                buffer = "";
                slots = [];
                commitEcho();
                say("  Cleared.", "c-dim");
                return;
            }

            if (k === "+-") {
                if (!buffer) { buffer = "0"; }
                buffer = buffer.charAt(0) === "-" ? buffer.slice(1) : "-" + buffer;
                echoLine();
                return;
            }

            if (k === "%" || k === "=") {
                if (buffer === "") {
                    say("  Enter a number first.", "c-warn");
                    return;
                }
                slots.push(value());
                commitEcho();
                buffer = "";

                if (slots.length < 2) {
                    say("  " + showNumber(slots[0]) + "% of  …  or  what percent is it of…", "c-echo");
                    return;
                }

                var a = slots[0];
                var b = slots[1];
                slots = [];

                if (k === "%") {
                    var part = b * a / 100;
                    say("  " + showNumber(a) + "% of " + showNumber(b) + "  =  " + showNumber(part), "c-result");
                    history.push(showNumber(a) + "% of " + showNumber(b) + " = " + showNumber(part));
                } else if (b === 0) {
                    say("  Cannot work out a percentage of zero: any part of nothing is undefined.", "c-warn");
                } else {
                    var pct = a / b * 100;
                    say("  " + showNumber(a) + " is " + showNumber(pct) + "% of " + showNumber(b), "c-result");
                    history.push(showNumber(a) + " is " + showNumber(pct) + "% of " + showNumber(b));
                }
            }
        }

        function frameKey(k) {
            if (/^[0-9.]$/.test(k)) { push(k); return; }

            if (k === "AC") {
                buffer = "";
                slots = [];
                commitEcho();
                say("  Cleared.", "c-dim");
                return;
            }

            if (k === "W" || k === "H" || k === "B") {
                if (buffer === "") {
                    say("  Enter a measurement first.", "c-warn");
                    return;
                }
                slots.push({ key: k, v: value() });
                commitEcho();
                buffer = "";
                say("  " + k + " = " + showNumber(slots[slots.length - 1].v), "c-echo");
                return;
            }

            if (k === "+-") {
                buffer = buffer.charAt(0) === "-" ? buffer.slice(1) : "-" + buffer;
                echoLine();
                return;
            }

            if (k === "=") {
                if (slots.length < 3) {
                    say("  I need W, H and B: outer width, outer height, then border width.", "c-warn");
                    return;
                }

                var w = get("W");
                var h = get("H");
                var border = get("B");

                if (w <= 0 || h <= 0) {
                    say("  Outer dimensions must be greater than zero.", "c-warn");
                    slots = [];
                    return;
                }
                if (border < 0) {
                    say("  Border width cannot be negative.", "c-warn");
                    slots = [];
                    return;
                }

                var iw = w - 2 * border;
                var ih = h - 2 * border;

                say("  Outer size      " + showNumber(w) + " x " + showNumber(h), "c-good");
                say("  Border          " + showNumber(border) + " on each edge");
                say("  Inner opening   " + showNumber(iw) + " x " + showNumber(ih));

                if (iw <= 0 || ih <= 0) {
                    say("  The border is wider than the frame, so there is no opening left.", "c-warn");
                    slots = [];
                    return;
                }

                say("  Drawing area    " + showNumber(iw * ih) + " square units");

                if (iw === ih) {
                    say("  That opening is square.");
                } else {
                    var longer = Math.max(iw, ih);
                    var shorter = Math.min(iw, ih);
                    say("  Ratio           1 : " + showNumber(Math.round(shorter / longer * 1000) / 1000) + "  (wider to narrower)");
                }

                slots = [];
                return;
            }
        }

        function get(key) {
            for (var i = 0; i < slots.length; i += 1) {
                if (slots[i].key === key) { return slots[i].v; }
            }
            return 0;
        }

        function paperKey(k) {
            if (k === "AC") {
                paper = 0;
                say("  Back to A4.", "c-dim");
                return;
            }

            var match = -1;
            for (var i = 0; i < PAPERS.length; i += 1) {
                if (PAPERS[i].name === k) { match = i; }
            }

            if (match >= 0) {
                paper = match;
                renderPaper();
                return;
            }

            if (k === "=") {
                renderPaper();
                return;
            }

            say("  Pick a size: " + PAPERS.map(function (p) { return p.name; }).join(", ") + ".", "c-warn");
        }

        function renderPaper() {
            var p = PAPERS[paper];
            var ratio = p.w === p.h
                ? "1 : 1, square"
                : "1 : " + showNumber(Math.round(Math.min(p.w, p.h) / Math.max(p.w, p.h) * 1000) / 1000);

            say("  " + p.name, "c-good");
            say("  Size            " + showNumber(p.w) + " x " + showNumber(p.h) + " mm");
            say("  Ratio           " + ratio);
            say("  Area            " + showNumber(p.w * p.h) + " square mm");
            history.push(p.name + " " + showNumber(p.w) + " x " + showNumber(p.h) + " mm, ratio " + ratio);
        }

        function historyKey() {
            if (!history.length) {
                say("  Nothing calculated yet this session.", "c-warn");
                return;
            }
            say("  This session (" + history.length + "):", "c-good");
            history.forEach(function (line, i) {
                say("   " + (i + 1 < 10 ? " " : "") + (i + 1) + ".  " + line, "c-dim");
            });
        }

        /* -- keys -------------------------------------------------- */
        var DIGITS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "+-"];

        function keySets() {
            if (mode === "calc") {
                return ["+", "-", "*", "/", "%", "**", "AC", "="];
            }
            if (mode === "percent") {
                return ["%", "=", "1/x", "AC"];
            }
            if (mode === "frame") {
                return ["W", "H", "B", "AC", "="];
            }
            return PAPERS.map(function (p) { return p.name; }).concat(["AC", "="]);
        }

        var OP_LABEL = { "+": "+", "-": "−", "*": "×", "/": "÷", "%": "%", "**": "xʸ" };

        function drawKeys() {
            keys.textContent = "";
            var list = keySets();

            DIGITS.forEach(function (k) {
                keys.appendChild(makeKey(k, k, k === "+-" ? "is-op" : ""));
            });

            list.forEach(function (k) {
                var modifier = k === "AC" ? "is-clear" : (k === "=" ? "is-run" : "is-op");
                keys.appendChild(makeKey(OP_LABEL[k] || k, k, modifier));
            });
        }

        function makeKey(label, value, modifier) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "key" + (modifier ? " " + modifier : "");
            b.textContent = label;
            b.setAttribute("data-key", value);
            return b;
        }

        function press(key) {
            /* paper mode has nothing to type into */
            if (mode === "paper" && /^[0-9.+*/%-]$/.test(key)) { return; }

            if (key === "1/x") {
                if (buffer === "") {
                    say("  Enter a number first.", "c-warn");
                    return;
                }
                var v = value();
                commitEcho();
                buffer = "";
                if (v === 0) {
                    say("  Cannot divide by zero. There is no answer, so nothing was calculated.", "c-warn");
                    return;
                }
                var r = 1 / v;
                say("  1 / " + showNumber(v) + "  =  " + showNumber(r), "c-result");
                history.push("1 / " + showNumber(v) + " = " + showNumber(r));
                return;
            }

            if (mode === "calc") { calcKey(key); return; }
            if (mode === "percent") { percentKey(key); return; }
            if (mode === "frame") { frameKey(key); return; }
            paperKey(key);
        }

        keys.addEventListener("click", function (e) {
            var b = e.target.closest ? e.target.closest(".key") : null;
            if (!b) { return; }
            press(b.getAttribute("data-key"));
        });

        /* Held keys on touch read better as pressed graphite. */
        keys.addEventListener("pointerdown", function (e) {
            var b = e.target.closest ? e.target.closest(".key") : null;
            if (b) { b.classList.add("is-down"); }
        }, { passive: true });

        ["pointerup", "pointercancel", "pointerleave"].forEach(function (evt) {
            keys.addEventListener(evt, function () {
                var down = keys.querySelectorAll(".is-down");
                for (var i = 0; i < down.length; i += 1) { down[i].classList.remove("is-down"); }
            }, { passive: true });
        });

        /* The physical keyboard drives the same sheet, because a
           calculator that ignores the number row feels broken. */
        function onKey(e) {
            if (!host.classList.contains("is-open")) { return; }
            if (e.metaKey || e.ctrlKey || e.altKey) { return; }

            var k = e.key;

            if (/^[0-9]$/.test(k) || k === ".") {
                press(k);
            } else if (k === "+" || k === "-" || k === "*" || k === "/") {
                press(k);
            } else if (k === "%") {
                press("%");
            } else if (k === "Enter" || k === "=") {
                press("=");
            } else if (k === "Backspace") {
                buffer = buffer.slice(0, -1);
                if (buffer === "") { commitEcho(); } else { echoLine(); }
            } else             if (k === "Escape") {
                /* Escape backs out of the sheet first, and only
                   clears the entry once it is the only thing left */
                if (host.classList.contains("is-open") && (buffer || acc || op)) {
                    press("AC");
                } else {
                    close();
                    return;
                }
            } else if (k === "Delete") {
                press("AC");
            } else {
                return;
            }

            e.preventDefault();
        }

        /* -- mode switching ---------------------------------------- */
        var modes = [].slice.call(host.querySelectorAll("[data-mode]"));

        modes.forEach(function (b) {
            b.addEventListener("click", function () {
                mode = b.getAttribute("data-mode");
                buffer = "";
                acc = null;
                op = null;
                slots = [];

                modes.forEach(function (o) {
                    o.setAttribute("aria-pressed", String(o === b));
                });

                commitEcho();
                clearScreen();
                say("  Studio Calculator 1.0", "c-good");
                say("  graphite, charcoal, and numbers that behave.", "c-dim");
                banner();
                drawKeys();
            });
        });

        function open() {
            host.hidden = false;
            /* unhide before measuring, so the reveal animates from
               the real size rather than a collapsed box */
            host.classList.add("is-open");

            say("  Studio Calculator 1.0", "c-good");
            say("  graphite, charcoal, and numbers that behave.", "c-dim");
            banner();
            drawKeys();

            if (openBtn) { openBtn.hidden = true; }
            if (closeBtn) { closeBtn.hidden = false; }

            var first = keys.querySelector(".key");
            if (first && fine) { first.focus(); }
        }

        function close() {
            host.classList.remove("is-open");
            host.hidden = true;

            if (closeBtn) { closeBtn.hidden = true; }
            if (openBtn) {
                openBtn.hidden = false;
                openBtn.focus();
            }
        }

        if (openBtn) {
            openBtn.addEventListener("click", open);
        }

        if (closeBtn) {
            closeBtn.addEventListener("click", close);
        }

        document.addEventListener("keydown", onKey);

        window.addEventListener("pagehide", function () {
            document.removeEventListener("keydown", onKey);
        }, { once: true });
    }


    /* =====================================================
       6. THE EXHIBITION FILTER
       ===================================================== */
    function wall() {
        var set = document.querySelector("[data-filter-set]");
        if (!set) { return; }

        var plates = [].slice.call(document.querySelectorAll("[data-cat]"));
        var status = document.getElementById("filter-status");

        set.addEventListener("click", function (e) {
            var b = e.target.closest ? e.target.closest("button[data-filter]") : null;
            if (!b) { return; }

            var want = b.getAttribute("data-filter");
            var shown = 0;

            [].slice.call(set.querySelectorAll("button[data-filter]")).forEach(function (o) {
                o.setAttribute("aria-pressed", String(o === b));
            });

            plates.forEach(function (p) {
                var cat = p.getAttribute("data-cat");
                var on = want === "all" || cat === want;
                p.hidden = !on;
                if (on) { shown += 1; }
            });

            if (status) {
                status.textContent = want === "all"
                    ? "All " + shown + " studies on the wall."
                    : shown + (shown === 1 ? " study" : " studies") + " filed under " + b.textContent.trim().toLowerCase() + ".";
            }
        });
    }


    /* =====================================================
       7. TILT
       A sheet on a board tips towards the hand. Pointer only:
       a touch device gets the ordinary hover lift instead.
       ===================================================== */
    function tilt() {
        if (reduce || !fine) { return; }

        var items = [].slice.call(document.querySelectorAll("[data-tilt]"));

        items.forEach(function (el) {
            var raf = 0;
            var tx = 0;
            var ty = 0;

            function apply() {
                raf = 0;
                el.style.transform =
                    "perspective(1400px) rotateX(" + tx.toFixed(2) + "deg) rotateY(" + ty.toFixed(2) + "deg)";
            }

            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                tx = -py * 2.4;
                ty = px * 2.8;
                if (!raf) { raf = window.requestAnimationFrame(apply); }
            }, { passive: true });

            el.addEventListener("pointerleave", function () {
                el.style.transition = "transform 0.7s cubic-bezier(0.16,1,0.3,1)";
                el.style.transform = "";
                window.setTimeout(function () { el.style.transition = ""; }, 720);
            }, { passive: true });
        });
    }

    // Restoring from browser history must settle images whose animation was paused.
    window.addEventListener("pageshow", function (event) {
        if (!event.persisted) { return; }
        revealAll();
        document.querySelectorAll("[data-plate]").forEach(function (plate) {
            plate.style.setProperty("--draw", "1");
        });
    });

    // Retained modules fail independently and keep ordinary content available.
    root.classList.add("reveal-on");
    try { reveals(); } catch (err) { revealAll(); }
    try { plates(); } catch (err) {
        document.querySelectorAll("[data-plate]").forEach(function (p) {
            p.style.setProperty("--draw", "1");
        });
    }
    try { consoleUI(); } catch (err) { /* Python source is linked as fallback. */ }
    try { wall(); } catch (err) { /* All studies remain available. */ }
    try { tilt(); } catch (err) { /* Ordinary hover remains. */ }
}());
