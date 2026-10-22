# Xabiso Phendu - The Living Sketchbook

A six-page, buildless developer portfolio: warm ivory graphite paper by default,
with a persistent midnight charcoal medium. Software development is the professional
subject; drawing is the presentation language and a personal interest.

## Run locally

Node.js 24 or later is recommended for the included browser checker. The website
itself uses plain HTML, CSS and browser JavaScript and needs no npm installation.

```sh
npm run dev
npm test
npm run test:browser
```

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.
Open http://127.0.0.1:8000/Portfolio/ . The server also supports the root URL.
Alternatively, serve this directory with any static HTTP server.

## Architecture

- `index.html`: optional sketchbook cover, the full Marcus Aurelius quotation,
  original drafting illustration, developer identity and selected team applications.
- `about.html`: factual journey, replaceable original photograph and scroll-drawn timeline.
- `skills.html`: experience levels, existing calculator and the Drafting Table.
- `projects.html`: concise software exhibits, actual local demo screenshots,
  explicitly labelled team application concept diagrams and expandable technical notes.
- `gallery.html`: all twelve original studies, category filters and a modal viewer.
- `contact.html`: direct LinkedIn/GitHub contact and existing application links.
- `style.css`: established component layouts and retained image/calculator styles.
- `sketchbook.css`: medium tokens, compositions, responsive rules and native page turns.
- `theme.js`: saved preference before first paint; first-time visitors get light paper.
- `motion.js`: retained reveals, developing image plates, calculator, gallery filters and tilt.
- `sketchbook.js`: theme control, cover, native dialog viewer and timeline.
- `drafting-table.js`: standalone drawing application.
- `scripts/`: local server, static checks and Chrome browser verification.

The existing `projects/` and `skills/` demos and all original images remain intact.
All production links and assets use relative URLs to work under `/Portfolio/`.

## The Drafting Table

Pencil and textured charcoal, 2H/HB/2B/6B grades, adjustable size and darkness,
eraser, undo/redo, undoable clear, ivory/white/toned paper, optional grid and PNG
export. Pointer capture handles mouse, pen and touch. Keyboard users can focus
the canvas, move with arrows (Shift for larger steps), and toggle a stroke with Space.

Strokes use a fixed 1200 by 800 vector coordinate space. Responsive CSS resizing
preserves the drawing. Undo replays deterministic marks onto a separate ink canvas;
the eraser removes ink without erasing the paper. PNG export composites paper, grid
and ink without the keyboard position marker. Artwork is not uploaded or saved across reloads.

## Motion, accessibility and fallbacks

Native cross-document View Transitions give supported browsers a quick paper turn
without intercepting links or delaying navigation. Mobile uses a simpler fade.
Unsupported browsers navigate normally. Browser back/forward behavior stays native.
Reduced motion disables transitions, reveals immediately and skips the cover.

The first home visit in a browser offers a cover with Open and Skip controls;
Escape also closes it. It never waits for a timer. A full, permanent quotation also
appears in the homepage content. Native modal dialogs handle focus and Escape.
Skip links, visible focus, semantic controls, live filter status and descriptive image
text are retained. Professional content and links remain readable without JavaScript.

## Assets and honest integration points

- The portrait remains `images/1000125110.jpg`; replace its file and dimensions to
  introduce your own self-portrait later.
- `images/drafting-study.svg` is a programmatic design illustration, not a claim
  that Xabiso personally drew it.
- `images/previews/` contains actual screenshots of the unchanged local demos.
  Team application previews are concept diagrams, not fabricated screenshots.
- No current PDF CV was supplied. Home, About and Contact explicitly identify the
  pending CV and link to LinkedIn. To integrate one, add a verified PDF and replace
  the pending labels with ordinary relative `<a download>` links. Do not label a
  draft as a completed CV.
- The hidden `.testimonials` component in index.html is reserved for approved,
  genuine quotations. No endorsements are invented.
- Contact uses real profiles; there is no contact backend.

## Dependencies

The existing package lists GSAP, page-flip, Rough.js, Lenis, Lottie Web and Three.js.
They remain available for future work, but this implementation loads none of these
runtimes. CSS, SVG, Canvas and native browser APIs implement the current experience.
The existing Google Fonts and Font Awesome CDN references remain; system fonts
and readable text links provide fallbacks. Production never references node_modules.

## Verification

`npm test` checks relative links, file/anchor existence, duplicate IDs, quotation,
hidden testimonials and JavaScript syntax across main and nested HTML pages.
`npm run test:browser` uses a hidden headless Chrome and Node's native DevTools
connection; it installs no browser framework. Set `CHROME_PATH` if Chrome is not
at the default Windows location. Screenshots and test downloads go to ignored `.qa/`.
The browser and test server are closed when the run ends.

To regenerate the authentic local preview images after changing a nested demo:
`node scripts/browser-check.cjs --update-previews`.

## Deploy to GitHub Pages

No build is necessary. Publish the repository root using the existing GitHub Pages
branch configuration. Keep all six HTML files, both CSS files, the four browser
scripts, favicon, images, projects and skills directories together. The expected
public path is https://xabiso-tech.github.io/Portfolio/ . No domain-root assumption,
local dependency path, site registration, commit, push or deployment is required by
the redesign itself. Review changes before committing and publishing.

## Professional links

- LinkedIn: https://www.linkedin.com/in/xabiso-phendu-ab6347414/
- GitHub: https://github.com/Xabiso-tech
- WeConnect: https://weconnect-bir9.onrender.com/landing
- WeConnect admin: https://weconnect-admin4.onrender.com/
- WeConnect source: https://github.com/zahraamoerat/Project-3-E-Commerce1
- HR Tech demo: https://nikitamullerr.github.io/HR_System-Group-4/
- HR Tech source: https://github.com/nikitamullerr/Group-4_HRSystem_Project2
