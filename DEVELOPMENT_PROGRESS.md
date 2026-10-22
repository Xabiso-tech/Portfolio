# TECH'STAMENT development continuity

Updated 2026-10-22 (Africa/Johannesburg). Development branch: techstament-redesign.
Continue the current implementation; preserve original assets and authored content.

## Recovered implementation

Started at 7ba59d8 with extensive uncommitted source changes: modular Three.js
Bible, generated leather/gilt/paper/wood maps, named camera shots, lighting and
dust, GSAP opening, HTML manuscript projection, leaf turns, portfolio content,
optional synthesised sound, and a Chrome test suite. This work was preserved.
The old README and static checks described retired sketchbook files. No Pages
workflow existed despite being referenced by Vite configuration.

## Completed corrections

- Fixed startup callback order: PageTurn no longer emits before Manuscript stores it.
- Removed nonexistent createLowerBlock call; createBackBoard already builds it.
- Capped the spine ends that appeared hollow in rendered screenshots.
- Bounded optional font requests; fallback fonts cannot block boot indefinitely.
- Hid invitation/footer until their cinematic cues.
- Made phones visit both faces, including correct chapter-side destinations.
- Added the missing continuous-reading CSS and native scrolling key handling.
- Managed contents focus, Escape/Tab handling, and focus transfer into reading.
- Preserved documents retained by Back/Forward Cache; disabled reduced-motion drift.
- Repaired preserved demo return links to the retired projects.html page.
- Fixed one overflowing project page by bounding its screenshot rather than its text.
- Wrapped mobile controls, retained the page indicator, and adapted reading offset.
- Honoured pending Skip after WebGL failure and removed its blocking loading veil.
- Updated current static/browser checks and README; added Pages Actions workflow.
- Ignored locked .qa Chrome files in Vite's watcher.
- Removed unused scripts/probe.cjs after confirming no references; the passing
  browser suite now covers its diagnostic purpose. No original artwork was removed.

## Architecture and changed files

src/main.js coordinates the experience. src/three/{BookScene,Bible,CameraDirector,
Lighting,DustMotes,textures}.js own the physical scene. src/manuscript/{Manuscript,
PageTurn,SpreadProjection,content}.js own reading. Chapters retain spread indices;
mobileSide selects each face. HTML stays readable independently of WebGL.
Optional audio remains in src/audio/SoundDesign.js and src/ui/SoundToggle.js.

Changed/retained source: index.html, package.json, package-lock.json,
vite.config.js, src/main.js, src/styles/techstament.css, the modules above,
src/styles/manuscript.css, and three demo HTML files under public/projects/.
Validation: scripts/check.cjs, scripts/browser-check.cjs, scripts/serve.cjs.
Documentation/deployment: README.md, this file, .github/workflows/deploy.yml.
Only dependencies already selected by the interrupted implementation are used.

## Verified results

- npm.cmd test: PASS, 91 local references, unique IDs, source syntax, chapter
  destinations and a projective-transform corner test.
- npm.cmd run build: PASS; Vite fingerprints assets and uses /Portfolio/ base.
- npm.cmd run test:browser: PASS in local headless Chrome, normal graphics path.
  Covers darkness, lit textured cover, pullback, invitation, physical opening,
  projected-to-flat manuscript, next/previous leaf turns, contents, keyboard,
  all desktop pages fitting, image loading, reduced motion, 390px phone layout,
  every authored mobile face, continuous reading, mobile chapter V and no-WebGL.
- Manually inspected screenshots of cover/reveal/opening, projected and flat
  desktop reading, phone reading/toolbar, continuous reading and fallback.
  Screenshots remain ignored in .qa/ (01-darkness through 14-fallback-reading,
  plus 10b-mobile-continuous). Browser/server processes owned by tests close.
- Vite development command starts successfully; local /Portfolio/ returns 200.
  Port 5173 was already occupied, so the temporary check used 5174 and was stopped.
- git diff --check passes; scanned source for common token/private-key patterns
  with no matches. No dist/, node_modules/ or .qa/ files are tracked.
- External GET checks: GitHub, HR Tech and WeConnect admin return 200. LinkedIn
  returns 999 to automation; WeConnect marketplace timed out after 20 seconds.
  Retained the authentic links; their hosts are outside this repository.

## Git and deployment status

Implementation is validated locally. Commit/push outcome is recorded below after
attempting the authorized Git operations. No remote merge/deployment is yet verified.
The current public URL returns 200 but serves the older portfolio:
https://xabiso-tech.github.io/Portfolio/

GitHub CLI is unavailable. Existing Git Credential Manager cannot supply an
account noninteractively, and no GH_TOKEN/GITHUB_TOKEN is present. A GitHub plugin
is available but has not been connected. Authentication is required to inspect
Pages settings/branch protections and to push, integrate main and deploy.
The workflow expects Settings ? Pages ? GitHub Actions and publishes dist/.

## Remaining work / next specific task

Authenticate GitHub, fetch and check protections, push techstament-redesign,
integrate into main through the permitted workflow, rerun build after integration,
monitor Pages deployment to success, and verify the published HTML/assets and
interactive experience. Do not equate a push with successful deployment.

The earlier full master directive was not found among available attachments;
this session implemented against the supplied continuation directive. Audible
sound quality and physical-device/browser-engine coverage were not manually
verified; browser QA used Chrome. No PDF CV or new contact details were invented.
