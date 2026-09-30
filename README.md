# Xabiso Phendu | Full-Stack Web Developer

**A developer portfolio presented through a graphite studio.**

This portfolio documents my development journey from Life Choices Academy into frontend,
backend, database and full-stack web application work. The graphite styling is the visual
language of the site; software development is its subject.

Static HTML, CSS and vanilla JavaScript. No build step, no framework, no bundler. Push to
`main` and GitHub Pages serves it.

---

## Live Website

[https://xabiso-tech.github.io/Portfolio/](https://xabiso-tech.github.io/Portfolio/)

---

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Home. Full-stack developer identity, an animated Marcus Aurelius quote, and routes into the work. |
| `about.html` | My Story. Learning web development at Life Choices Academy and applying it in projects. |
| `skills.html` | The Toolkit. Practical levels across frontend, backend, databases, frameworks and deployment. |
| `projects.html` | The Workshop. Team applications, individual studies and technical project details. |
| `gallery.html` | Workshop Gallery. A personal collection of visual studies, linked from the Workshop. |
| `contact.html` | Connect. Professional opportunities, collaborations and direct contact links. |

Nested inside `projects/`:

| Project | What it is |
| --- | --- |
| `premium-car-products/` | AutoVault. A four-page Bootstrap 5.3 catalogue. |
| `tech-gaming-products/` | NovaTech. A gaming hardware showcase with no framework. |
| `booking-form/` | A form and schedule study with both of its known bugs fixed. |
| `my-gallery/` | The original CSS-only filtering image gallery and its twelve image studies. |

---

## Technologies Used

- HTML5
- CSS3 (custom properties, grid, flexbox, `prefers-reduced-motion`)
- Vanilla JavaScript, Python, PHP, Node.js and Express
- Vue and Bootstrap 5.3 (used in the AutoVault study)
- MySQL, SQL, REST APIs, Git and GitHub
- GitHub Pages deployment

---

## Featured Work

**HR Tech Solutions**

A four-person team project: an HR system covering employee records, attendance, time off
and payroll. I built the employee and performance review back end, then rewired the
matching front-end pages to read from it. Express 5, MySQL via `mysql2`, JWT, bcrypt, with
routes, controllers, models and middleware kept in separate layers.

Live demo: [HR Tech Solutions](https://nikitamullerr.github.io/HR_System-Group-4/)

Source: [nikitamullerr/Group-4_HRSystem_Project2](https://github.com/nikitamullerr/Group-4_HRSystem_Project2)

**WeConnect**

A B2B marketplace where small businesses order stock from wholesalers: 608 commits, 24
tables, four contributors. I owned delivery — the orders, payments and GPS tracking back
end, the Leaflet map that draws a courier's last known position, and the location setup
workflow that confirms pickup and destination before dispatch. Express 5 and MySQL over
SSL behind a managed host, with a Vue 3 and Vite front end.

Live: [WeConnect](https://weconnect-bir9.onrender.com/landing) · [Admin](https://weconnect-admin4.onrender.com/)

Source: [zahraamoerat/Project-3-E-Commerce1](https://github.com/zahraamoerat/Project-3-E-Commerce1)

---

## Design Direction

The graphite studio is a presentation style rather than the portfolio's subject. Charcoal
surfaces, construction marks, grain and image reveals frame the software work without
turning the site into an artist portfolio. Photographs settle back to their source colours.

---

## Motion & Accessibility

The home page builds the quote “Impediment to action advances action.” through staged
construction marks, lettering and tonal development, then reveals the portfolio. The full
sequence is about five seconds and can be skipped:

- The skip control is keyboard reachable; Escape, Enter, Space or its button skips the intro.
- A 6 second failsafe removes it even if the script never finishes.
- Entrance states are only applied when scripting is available, so the page is fully
  readable with JavaScript off.
- `prefers-reduced-motion: reduce` skips the drawing entirely and shows the page directly.
- Every interactive control is keyboard reachable, with visible focus.
- The Workshop Gallery uses buttons with `aria-pressed` state and a live result count. The original
  project study uses focusable radio inputs and CSS-only filtering.
- Decorative art is `aria-hidden`; the Bootstrap carousel has controls and does not
  auto-rotate.

Life Choices Academy provided technical instruction alongside personal-development training
in communication, leadership, transformation and coaching. Drawing remains a hobby and
occasional side hustle; it informs the graphite styling but is not a professional skill track.

The form studies have no server behind them. AutoVault's contact action is disabled; the
booking study demonstrates client-side form controls and does not send data to a service.

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

Full-Stack Web Developer &middot; Cape Town, South Africa.

- LinkedIn: [linkedin.com/in/xabiso-phendu-ab6347414](https://www.linkedin.com/in/xabiso-phendu-ab6347414/)
- GitHub: [github.com/Xabiso-tech](https://github.com/Xabiso-tech)

---

*Full-stack development, explored through a graphite studio.*
