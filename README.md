# DEV//ON THE ROAD

A static, multi-page portfolio for Xabiso Phendu, Junior Full-Stack Web Developer.

## Run locally

Install the dependencies once with `npm install`, then start the Vite development server:

```sh
npm run dev
```

The pages are also plain HTML and can be opened directly. Keep page, stylesheet, script, and image links relative so they work under GitHub Pages at `/Portfolio/`.

## Experience

The home page pairs a two-step, skippable ignition intro with an illustrated driver's-eye view: a road through tropical hills, windshield framing, dashboard, and destination signs. GSAP is served from the local `assets/js/vendor` directory, so the intro does not depend on a CDN. The page has a CSS fallback and skips the intro when reduced motion is requested.

Navigation signs lead to the eight portfolio destinations. The standard site navigation remains available as an accessible alternative. No audio or WebGL is required.

## Pages

- Home — driver's-eye road view and destination signs
- About — the driver's licence and personal journey
- Skills — fuel stops and technical toolkit
- Projects — project destinations
- Roadworks — challenges and lessons
- Certifications — passport and achievements
- Testimonials — postcards from the crew
- CV — developer passport and print-friendly résumé
- Contact — direct email, phone, GitHub, and LinkedIn routes

## Content and documents

Project details, credentials, work history, and testimonials use the information available in the portfolio. Certificate scans and a downloadable CV are not linked until the actual files are supplied. The CV page can be printed from the browser.

## Deployment

The GitHub Actions workflow publishes the repository root to GitHub Pages when changes reach `main`. Local changes have not been pushed or deployed.
