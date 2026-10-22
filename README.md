# TECH'STAMENT ? Christ in My Journey Through Code

Xabiso Phendu's portfolio, built with Vite, Three.js and GSAP. A burgundy Bible
emerges from darkness, opens on its spine hinge, and reveals an HTML manuscript
containing the developer journey, skills, projects, artwork, contact and Scripture.
Original assets and frontend studies remain in public/.

## Run and verify

Use Node.js 24 and npm. On Windows use npm.cmd if PowerShell blocks npm.ps1.

    npm ci
    npm run dev
    npm test
    npm run build
    npm run preview
    npm run test:browser

Development: http://127.0.0.1:5173/Portfolio/
Production preview: http://127.0.0.1:4173/Portfolio/
Browser checks require local Chrome and Node's native WebSocket. Set CHROME_PATH
if Chrome is outside its default Windows location. They test dist/ under /Portfolio/
and save ignored screenshots in .qa/.

## Architecture

- src/main.js coordinates boot, invitation, opening, handoff and fallback.
- src/three/ owns physical geometry, generated textures, lighting, dust and camera.
- src/manuscript/content.js holds portfolio content and chapter destinations.
- Manuscript.js owns navigation, continuous reading, contents and keyboard events.
- PageTurn.js animates desktop leaves and visits both page faces on phones.
- SpreadProjection.js maps HTML onto the open book before flattening for reading.
- src/styles/ contains cinematic and parchment styling.
- src/audio/ and src/ui/ provide optional synthesised sound, off by default.
- public/ preserves images, gallery, frontend demos and calculator source.

## Reading and accessibility

Open the testament or Skip the cinema. Arrow keys, Page Up/Down, Home and End
navigate pages. Contents jumps to chapters. Continuous reading exposes all pages
in a scrolling column with native scrolling keys. Phones show one face at a time;
long pages can scroll. Reduced motion shortens animations. Contents manages focus
and Escape returns to its trigger. No-WebGL opens the same manuscript; noscript
supplies a summary. Optional Google Fonts fall back after a bounded wait.
No contact backend or verified PDF CV was supplied; contact uses genuine profiles.
External demo availability depends on its hosts.

## GitHub Pages

Develop on techstament-redesign; production is main. The deployment workflow runs
npm ci, npm test and npm run build, then publishes dist/ using GitHub Actions.
In repository Settings ? Pages select GitHub Actions. Vite base is /Portfolio/.
Expected production URL: https://xabiso-tech.github.io/Portfolio/
A push alone does not verify deployment. See DEVELOPMENT_PROGRESS.md for actual status.
