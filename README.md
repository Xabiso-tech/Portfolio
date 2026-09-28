# Xabiso Phendu Portfolio

**Drawn by Hand. Built with Code.**

A portfolio site that looks like a graphite drawing: dark tonal surfaces, paper grain,
hand-drawn rules, and a pencil that actually draws the opening line.

Static HTML, CSS and vanilla JavaScript. No build step, no framework, no bundler. Push to
`main` and GitHub Pages serves it.

---

## Live Website

[https://xabiso-tech.github.io/Portfolio/](https://xabiso-tech.github.io/Portfolio/)

---

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Home. A ~4.2 second pencil-drawing entrance, then who I am and where to go next. |
| `about.html` | My Story. Where I started, what I actually work on, and what I care about outside it. |
| `skills.html` | The Toolkit. Skills at honest levels, each one tied to something I built. |
| `projects.html` | The Workshop. Two full-stack team projects, then the smaller front-end studies. |
| `contact.html` | Let's Connect. How to reach me, and which repository to read first. |

Nested inside `projects/`:

| Project | What it is |
| --- | --- |
| `premium-car-products/` | AutoVault. A four-page Bootstrap 5.3 catalogue. |
| `tech-gaming-products/` | NovaTech. A gaming hardware showcase with no framework. |
| `booking-form/` | A form and schedule study with both of its known bugs fixed. |
| `my-gallery/` | A filtering image gallery. |

---

## Technologies Used

- HTML5
- CSS3 (custom properties, grid, flexbox, `prefers-reduced-motion`)
- Vanilla JavaScript (no libraries)
- Bootstrap 5.3, only inside the AutoVault study
- Python
- Git and GitHub Pages

---

## Featured Work

**HR Tech Solutions**

A four-person team project: an HR system covering employee records, attendance, time off
and payroll. I built the employee and performance review back end, then rewired the
matching front-end pages to read from it. Express 5, MySQL via `mysql2`, JWT, bcrypt, with
routes, controllers, models and middleware kept in separate layers.

Repository: [nikitamullerr/Group-4_HRSystem_Project2](https://github.com/nikitamullerr/Group-4_HRSystem_Project2)

**WeConnect**

A B2B marketplace where small businesses order stock from wholesalers: 608 commits, 24
tables, four contributors. I owned delivery — the orders, payments and GPS tracking back
end, the Leaflet map that draws a courier's last known position, and the location setup
workflow that confirms pickup and destination before dispatch. Express 5 and MySQL over
SSL behind a managed host, with a Vue 3 and Vite front end.

Repository: [zahraamoerat/Project-3-E-Commerce1](https://github.com/zahraamoerat/Project-3-E-Commerce1)

---

## Design Philosophy

> Every website starts as a rough sketch.

The site is treated the way a drawing is: tone first, then edges, then texture. Grain and
sketched rules are SVG or CSS, so the look costs no image requests and no extra files.

---

## Motion & Accessibility

The home page runs a pencil that draws the opening line, roughly 4.2 seconds, then lifts
away to reveal the page. It is decorative and it is not in the way:

- A skip control is keyboard reachable, and any key, click or scroll jumps straight past it.
- A 6 second failsafe removes it even if the script never finishes.
- Entrance states are only applied when scripting is available, so the page is fully
  readable with JavaScript off.
- `prefers-reduced-motion: reduce` skips the drawing entirely and shows the page directly.
- Every interactive control is keyboard reachable, with visible focus.
- The gallery filters are real radio inputs, visually hidden but still focusable, so they
  work with a keyboard and a screen reader.
- Decorative art is `aria-hidden`; the Bootstrap carousel has controls and does not
  auto-rotate.

Forms on this site are labelled honestly. The two study forms have no server behind them,
so their buttons are disabled and say so, rather than pretending to submit.

---

## Local Testing

There is no build command, because there is no build. To preview:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`. The site also has to work under the `/Portfolio/`
subpath GitHub Pages serves it from, so check links and image paths there too.

---

## Author

**Xabiso Phendu**

Full-Stack Developer in Training. Lifelong student of growth.

- LinkedIn: [linkedin.com/in/xabiso-phendu-ab6347414](https://www.linkedin.com/in/xabiso-phendu-ab6347414/)
- GitHub: [github.com/Xabiso-tech](https://github.com/Xabiso-tech)

---

*Sketched in Charcoal. Refined in Code.*
