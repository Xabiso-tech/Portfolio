/* ==========================================================
   TECH'STAMENT — THE MANUSCRIPT CONTENT

   Everything the reader sees inside the Bible lives here.

   HOW THE MODEL WORKS
   -------------------
   The manuscript is a linear list of "faces" (a face is one side of
   one leaf). The reader always sees a spread of two faces:

       spread 0 = faces[0] (left)  + faces[1] (right)
       spread 1 = faces[2] (left)  + faces[3] (right)
       ...

   so a face index i belongs to spread Math.floor(i / 2), and the
   parity of i decides whether it lands on the left or the right
   half of the book.

   Every face is authored as a plain HTML string. That keeps the
   writing close to the finished page and avoids a heavy component
   tree for what is, in the end, a book.

   FACTS
   -----
   Every statement below is drawn from Xabiso's own record: Life
   Choices Academy in Cape Town, team work on WeConnect and HR Tech
   Solutions, and a personal drawing practice. Nothing about
   employment, quotes or contact details is invented.
   ========================================================== */

/* A drawn cross rather than a glyph: it renders identically on every
   platform, whatever the installed fonts happen to contain. */
const CROSS = `<svg class="mark-cross" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7z" fill="currentColor"/></svg>`;

/* The same mark, used as an ornament between passages. */
const ORNAMENT = `<div class="ornament">${CROSS}</div>`;

/* ------------------------------------------------------------
   FACTS USED IN SEVERAL PLACES
   ------------------------------------------------------------ */

export const LINKS = {
  github: 'https://github.com/Xabiso-tech',
  linkedin: 'https://www.linkedin.com/in/xabiso-phendu-ab6347414/',
  weconnect: 'https://weconnect-bir9.onrender.com/landing',
  weconnectAdmin: 'https://weconnect-admin4.onrender.com',
  hrTech: 'https://nikitamullerr.github.io/HR_System-Group-4/',
  myGallery: 'projects/my-gallery/gallery.html',
  autoVault: 'projects/premium-car-products/index.html',
  novaTech: 'projects/tech-gaming-products/index.html',
  booking: 'projects/booking-form/index.html',
  calculator: 'skills/graphite-calculator.py',
};

/* ------------------------------------------------------------
   THE CHAPTERS
   Used by the in-book contents page, by the overlay contents panel
   and by the chapter navigation. `spread` is the index of the
   spread the chapter opens on.
   ------------------------------------------------------------ */

export const CHAPTERS = [
  { id: 'preface', numeral: 'Preface', title: 'Before the First Line', spread: 1, side: 1, folio: '1' },
  { id: 'beginning', numeral: 'Chapter I', title: 'The Beginning', spread: 2, folio: '3' },
  { id: 'equipping', numeral: 'Chapter II', title: 'The Equipping', spread: 4, folio: '7' },
  { id: 'works', numeral: 'Chapter III', title: 'The Works', spread: 6, folio: '11' },
  { id: 'illustrated', numeral: 'Chapter IV', title: 'The Illustrated Pages', spread: 9, folio: '17' },
  { id: 'commission', numeral: 'Chapter V', title: 'The Commission', spread: 10, side: 1, folio: '20' },
];

/* ------------------------------------------------------------
   THE PAGES
   ------------------------------------------------------------ */

export const PAGES = [
  /* ---------- SPREAD 0 — half title and title page ---------- */
  {
    id: 'half-title',
    head: '',
    folio: '',
    html: `
      <div class="title-page">
        ${CROSS}
        <p class="title-page__sub">
          The testimony of a developer who began with curiosity,
          uncertainty and a willingness to learn something new.
        </p>
        ${ORNAMENT}
        <p class="title-page__pillars">Cape Town &middot; South Africa</p>
      </div>
    `,
  },
  {
    id: 'title',
    head: '',
    folio: '',
    html: `
      <div class="title-page">
        ${CROSS}
        <h2 class="title-page__name">TECH'STAMENT</h2>
        <div class="title-page__rule"></div>
        <p class="title-page__sub">Christ in My Journey Through Code</p>
        <p class="title-page__author">Xabiso Phendu</p>
        <p class="title-page__pillars">Faith &middot; Purpose &middot; Code</p>
      </div>
    `,
  },

  /* ---------- SPREAD 1 — contents and preface ---------- */
  {
    id: 'contents',
    head: 'Contents',
    folio: 'i',
    html: `
      <h2>Contents</h2>
      <ol class="contents-page">
        <li><span>The Preface</span><span class="toc-dots"></span><span class="toc-folio">1</span></li>
        <li><span>Chapter I &mdash; The Beginning</span><span class="toc-dots"></span><span class="toc-folio">3</span></li>
        <li><span>Chapter II &mdash; The Equipping</span><span class="toc-dots"></span><span class="toc-folio">7</span></li>
        <li><span>Chapter III &mdash; The Works</span><span class="toc-dots"></span><span class="toc-folio">11</span></li>
        <li><span>Chapter IV &mdash; The Illustrated Pages</span><span class="toc-dots"></span><span class="toc-folio">17</span></li>
        <li><span>Chapter V &mdash; The Commission</span><span class="toc-dots"></span><span class="toc-folio">20</span></li>
      </ol>
      ${ORNAMENT}
      <p>
        The pages that follow are written the way a working developer writes:
        plainly, in the order things actually happened, and with the evidence
        kept within reach.
      </p>
    `,
  },
  {
    id: 'preface',
    head: 'The Preface',
    folio: '1',
    html: `
      <div class="chapter-opener">
        <p class="chapter-opener__numeral">The Preface</p>
        <h2 class="chapter-opener__title">Before the First Line</h2>
        <p class="chapter-opener__sub">A working note about faith, craft, and the work in front of me.</p>
      </div>
      <p class="lede dropcap">
        My name is Xabiso Phendu. I am a web developer in Cape Town, South
        Africa, and this book is the record of how I got here.
      </p>
      <p>
        I did not arrive in software by accident of ambition. I arrived at Life
        Choices Academy with no previous programming experience at all, and I
        learned the trade the slow way: one page, one function, one small
        broken thing at a time.
      </p>
      <p>
        A Bible is a book built around a single idea &mdash; that light is worth
        following even when you cannot yet see where it leads. That is closer to
        my experience of learning to write software than any resume bullet
        point. So the work is set between these covers, where a reader can open
        it, turn the pages, and read it the way it was written.
      </p>
      <div class="verse">
        &ldquo;And whatsoever ye do, do it heartily, as to the Lord, and not unto men.&rdquo;
        <span>Colossians 3:23 &mdash; KJV</span>
      </div>
    `,
  },

  /* ---------- SPREAD 2 — Chapter I opens ---------- */
  {
    id: 'chapter-i',
    head: 'Chapter I',
    folio: '3',
    html: `
      <div class="chapter-opener">
        <p class="chapter-opener__numeral">Chapter I</p>
        <h2 class="chapter-opener__title">The Beginning</h2>
        <p class="chapter-opener__sub">Life Choices Academy, Cape Town.</p>
      </div>
      <p class="dropcap">
        I joined Life Choices Academy with no previous programming experience.
        Everything was unfamiliar &mdash; the structure of a webpage, the logic
        behind a working application, and the quiet discipline of debugging
        something you wrote yourself.
      </p>
      <p>
        That unfamiliarity became the beginning of a new direction. The first
        line of code changed everything: it gave me something concrete to
        break, fix and show to someone else.
      </p>
      <h3>01 / The first build</h3>
      <p>
        HTML gave my pages structure. CSS taught me how to shape an interface.
        JavaScript introduced logic, interaction, and the possibility of making
        a page answer back. I began to see how individual pieces become a
        complete experience.
      </p>
      <div class="flow">
        <span class="flow__step">Structure</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Style</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Behaviour</span>
      </div>
    `,
  },
  {
    id: 'chapter-i-b',
    head: 'Chapter I',
    folio: '4',
    html: `
      <h3>02 / Behind the screen</h3>
      <p class="dropcap">
        As I learned Node.js, Express, MySQL and REST APIs, I started to
        understand what happens after someone clicks a button. How a request
        travels. How data is stored. Why connecting the frontend to the backend
        is the difference between a picture and a product.
      </p>
      <div class="flow">
        <span class="flow__step">Frontend</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">API</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Data</span>
      </div>
      <h3>03 / Building with others</h3>
      <p>
        Team projects gave me practical experience with Git, collaboration,
        troubleshooting and connecting different parts of an application. In
        HR Tech Solutions I worked on employee management and performance
        review functionality. In WeConnect I focused on orders, deliveries,
        location tracking, and the connection between buyers and suppliers.
      </p>
      <h3>04 / Still learning</h3>
      <p>
        I am continuing to develop my skills in frontend and backend
        development &mdash; improving how I structure code, solve problems and
        build reliable applications. The goal is not to make websites look
        good. It is to build software that works.
      </p>
    `,
  },

  /* ---------- SPREAD 3 — the tools that got sharpened ---------- */
  {
    id: 'tools',
    head: 'Chapter I &middot; The road so far',
    folio: '5',
    html: `
      <div class="chapter-opener">
        <p class="chapter-opener__numeral">A journey drawn one line at a time</p>
        <h2 class="chapter-opener__title">The road so far</h2>
        <p class="chapter-opener__sub">Every stage brought a new tool and a clearer picture of how software works.</p>
      </div>
      <div class="flow">
        <span class="flow__step">Life Choices Academy</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">First build</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Backend</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Team work</span>
      </div>
      <h3>What I reach for</h3>
      <p>
        The tools below are the ones I have actually used in coursework, in
        individual studies and in team projects. The written level is the
        useful measure; the meter beside it is only a visual comparison.
      </p>
      <p>
        A level is only real if you have shipped something that needed it.
      </p>
    `,
  },
  {
    id: 'toolkit-frontend',
    head: 'The toolkit',
    folio: '6',
    html: `
      <h3>Browser interface</h3>
      <p class="lede">Frontend development &mdash; the structure, style and behaviour of everything on screen.</p>
      <div class="skill-register">
        <div class="skill-register__item">
          <span class="skill-register__name">HTML</span>
          <span class="skill-register__note">Semantic structure first, then styling. Landmarks, real heading order, labelled form controls.</span>
        </div>
        <div class="skill-register__item">
          <span class="skill-register__name">CSS</span>
          <span class="skill-register__note">Custom properties, Grid and Flexbox, responsive layouts and layered visual treatments.</span>
        </div>
        <div class="skill-register__item">
          <span class="skill-register__name">JavaScript</span>
          <span class="skill-register__note">ES6+, the DOM, and the part that took longest: talking to a server.</span>
        </div>
        <div class="skill-register__item">
          <span class="skill-register__name">Accessibility</span>
          <span class="skill-register__note">Focus states, skip-friendly navigation, reduced-motion fallbacks and a works-without-JavaScript path.</span>
        </div>
      </div>
      <p>
        Evidence: this book, and the front end of the HR system &mdash; focus
        states, real heading order and descriptions on every image that carries
        meaning.
      </p>
    `,
  },

  /* ---------- SPREAD 4 — Chapter II ---------- */
  {
    id: 'chapter-ii',
    head: 'Chapter II',
    folio: '7',
    html: `
      <div class="chapter-opener">
        <p class="chapter-opener__numeral">Chapter II</p>
        <h2 class="chapter-opener__title">The Equipping</h2>
        <p class="chapter-opener__sub">Services, data, and the tools that sharpened the hand.</p>
      </div>
      <p class="dropcap">
        This is the part I moved into on the HR system project, and the part I
        would rather keep building. The levels below come from code I can point
        at rather than from a course.
      </p>
      <h3>Node.js &amp; Express</h3>
      <p>
        Separating an API into routes, controllers and models, so the data layer
        can change without rewriting the HTTP layer. Middleware, error handling
        and configuration kept out of the source.
      </p>
      <h3>MySQL &amp; SQL</h3>
      <p>
        Designing the tables before writing the queries. Relations, joins, and
        parameterised statements everywhere &mdash; because building the string
        yourself is how you end up with a security problem.
      </p>
    `,
  },
  {
    id: 'toolkit-backend',
    head: 'The toolkit',
    folio: '8',
    html: `
      <h3>REST API design</h3>
      <p>
        Resources as endpoints, the right status codes instead of one generic
        failure, and validating input before it reaches the data layer.
        200, 201, 400, 401, 403 and 404 are all used deliberately across the
        employee and review endpoints.
      </p>
      <h3>Authentication</h3>
      <p>
        JSON Web Tokens and hashed passwords. Issuing a token on sign-in,
        attaching it to protected routes in middleware, and rejecting whatever
        does not verify.
      </p>
      <div class="skill-register">
        <div class="skill-register__item">
          <span class="skill-register__name">Express routing</span>
          <span class="skill-register__note">Foundational+ &mdash; eight route groups mounted on one app.</span>
        </div>
        <div class="skill-register__item">
          <span class="skill-register__name">Layered architecture</span>
          <span class="skill-register__note">Foundational+ &mdash; controllers delegating every query to a model module.</span>
        </div>
        <div class="skill-register__item">
          <span class="skill-register__name">Schema design</span>
          <span class="skill-register__note">Foundational+ &mdash; a written schema.sql and an entity relationship diagram.</span>
        </div>
        <div class="skill-register__item">
          <span class="skill-register__name">Safe queries</span>
          <span class="skill-register__note">Foundational+ &mdash; every value passed as a bound parameter.</span>
        </div>
      </div>
    `,
  },

  /* ---------- SPREAD 5 — other languages and the honest table ---------- */
  {
    id: 'toolkit-more',
    head: 'The toolkit',
    folio: '9',
    html: `
      <h3>Additional experience</h3>
      <div class="skill-register">
        <div class="skill-register__item">
          <span class="skill-register__name">Python</span>
          <span class="skill-register__note">Logic, operators, conditionals and input handling &mdash; and the validated calculator below.</span>
        </div>
        <div class="skill-register__item">
          <span class="skill-register__name">Vue</span>
          <span class="skill-register__note">Components, props and reactive state &mdash; later put to work against a real API.</span>
        </div>
        <div class="skill-register__item">
          <span class="skill-register__name">PHP</span>
          <span class="skill-register__note">Superglobals, form handling and the request lifecycle.</span>
        </div>
        <div class="skill-register__item">
          <span class="skill-register__name">Git &amp; GitHub</span>
          <span class="skill-register__note">Branch per feature, meaningful commits, pull requests, and resolving real conflicts.</span>
        </div>
      </div>
      <div class="plate">
        <p class="plate__title">
          <span>Python calculator</span>
          <span class="plate__index">Interactive exercise</span>
        </p>
        <p class="plate__text">
          Four modes: arithmetic, percentages, frame dimensions and common paper
          sizes. Division and modulo by zero are refused rather than guessed at,
          and results that are not real numbers are reported as such.
        </p>
        <ul class="plate__links">
          <li><a href="${LINKS.calculator}" rel="noopener noreferrer">Open the source</a></li>
        </ul>
      </div>
    `,
  },
  {
    id: 'honest-levels',
    head: 'Where each one stands',
    folio: '10',
    html: `
      <div class="chapter-opener">
        <p class="chapter-opener__numeral">Honest levels</p>
        <h2 class="chapter-opener__title">Where each one stands</h2>
        <p class="chapter-opener__sub">Levels are described relative to what I have actually built, not to a curriculum.</p>
      </div>
      <table class="levels">
        <thead>
          <tr><th scope="col">Technology</th><th scope="col">Level</th><th scope="col">Backed by</th></tr>
        </thead>
        <tbody>
          <tr><td>HTML</td><td>Intermediate</td><td>This book, the HR front end</td></tr>
          <tr><td>CSS</td><td>Intermediate</td><td>Design system and interface motion</td></tr>
          <tr><td>JavaScript</td><td>Intermediate</td><td>DOM exercises, API client modules</td></tr>
          <tr><td>Node.js &amp; Express</td><td>Foundational+</td><td>Employee and review back end</td></tr>
          <tr><td>MySQL &amp; SQL</td><td>Foundational+</td><td>Schema, ERD, parameterised queries</td></tr>
          <tr><td>REST API design</td><td>Foundational+</td><td>Resource endpoints, deliberate status codes</td></tr>
          <tr><td>Authentication</td><td>Foundational</td><td>JWT sign-in, bearer middleware, bcrypt</td></tr>
          <tr><td>Git &amp; GitHub</td><td>Intermediate</td><td>Feature branches on a four-person project</td></tr>
          <tr><td>Python</td><td>Foundations</td><td>Operator exercises, validated calculator</td></tr>
          <tr><td>Vue</td><td>Foundations</td><td>Ticket landing page, catalogue</td></tr>
          <tr><td>PHP</td><td>Foundations</td><td>Superglobals and form handling</td></tr>
        </tbody>
      </table>
      <p>
        Nothing here is listed as expert. Every claim on this page is something
        you can go and look at.
      </p>
    `,
  },

  /* ---------- SPREAD 6 — Chapter III opens ---------- */
  {
    id: 'chapter-iii',
    head: 'Chapter III',
    folio: '11',
    html: `
      <div class="chapter-opener">
        <p class="chapter-opener__numeral">Chapter III</p>
        <h2 class="chapter-opener__title">The Works</h2>
        <p class="chapter-opener__sub">From sketch to screen &mdash; interfaces, APIs, databases and working software.</p>
      </div>
      <p class="dropcap">
        Every application begins as an idea. These are the projects that helped
        me turn ideas into interfaces, APIs, databases and working software.
      </p>
      <div class="flow">
        <span class="flow__step">Wireframe</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Application</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Build &amp; iterate</span>
      </div>
      <h3>Collection A &mdash; Team applications</h3>
      <p>
        Built with other people. These projects challenged me to work beyond
        isolated pages: connecting interfaces, back end logic, databases and
        the work of other developers.
      </p>
    `,
  },
  {
    id: 'weconnect',
    head: 'Chapter III &middot; Plate 01',
    folio: '12',
    html: `
      <div class="plate">
        <p class="plate__title">
          <span>WeConnect</span>
          <span class="plate__index">Plate 01 &mdash; Full-stack application</span>
        </p>
        <p class="plate__text">
          A business-to-business marketplace connecting small businesses with
          suppliers, bringing product discovery, ordering, payments and
          deliveries into one platform. My work focused on the orders and
          delivery systems, back end integration, location setup and GPS
          tracking features.
        </p>
        <ul class="plate__tags">
          <li>Vue 3</li>
          <li>Express</li>
          <li>MySQL</li>
          <li>REST APIs</li>
          <li>Leaflet</li>
        </ul>
        <ul class="plate__links">
          <li><a href="${LINKS.weconnect}" rel="noopener noreferrer">Open the marketplace</a></li>
          <li><a href="${LINKS.weconnectAdmin}" rel="noopener noreferrer">Open the admin</a></li>
        </ul>
      </div>
      <h4>My contribution</h4>
      <ul>
        <li>Developed order and delivery functionality for buyers and suppliers.</li>
        <li>Worked on delivery-related back end routes, controllers and database queries.</li>
        <li>Implemented location setup and tracking functionality using mapping tools.</li>
        <li>Connected Vue interfaces to back end APIs and worked with shared project data.</li>
        <li>Collaborated through Git branches, code integration and debugging.</li>
      </ul>
      <p>
        Team: Zanda Kumsha, Zahra Moerat, Phelisa Fani and Xabiso Phendu.
      </p>
    `,
  },

  /* ---------- SPREAD 7 — WeConnect system study and HR Tech ---------- */
  {
    id: 'weconnect-system',
    head: 'Chapter III &middot; System study',
    folio: '13',
    html: `
      <h3>System study &mdash; orders and delivery tracking</h3>
      <div class="flow flow--tall">
        <span class="flow__step">Buyer</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Supplier</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Order</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">Delivery</span>
        <span class="flow__arrow">&rarr;</span>
        <span class="flow__step">GPS / map</span>
      </div>
      <p>
        One connected system: a buyer places an order, the supplier fulfils it,
        and the delivery is traced on a map until it arrives. The link between
        the marketplace and the admin interface is the same database, read by
        two different front ends.
      </p>
      <div class="ornament"><span>&bull;</span></div>
      <p>
        The public marketplace and the administrator interface are separate
        applications that share one data layer. The first link above opens the
        marketplace; the second opens its administrator.
      </p>
    `,
  },
  {
    id: 'hr-tech',
    head: 'Chapter III &middot; Plate 02',
    folio: '14',
    html: `
      <div class="plate">
        <p class="plate__title">
          <span>HR Tech Solutions</span>
          <span class="plate__index">Plate 02 &mdash; Team application</span>
        </p>
        <p class="plate__text">
          A workforce management project covering employee information,
          performance reviews and other HR functions. I worked on employee
          management and performance review features, including the back end
          APIs and their front end integration.
        </p>
        <ul class="plate__tags">
          <li>JavaScript</li>
          <li>Node.js</li>
          <li>Express</li>
          <li>MySQL</li>
          <li>REST APIs</li>
        </ul>
        <ul class="plate__links">
          <li><a href="${LINKS.hrTech}" rel="noopener noreferrer">Open the demo</a></li>
        </ul>
      </div>
      <h4>My contribution</h4>
      <ul>
        <li>Worked on employee and performance review back end functionality.</li>
        <li>Used Express routes, controllers and models to organise the application.</li>
        <li>Connected front end interfaces to API endpoints during development.</li>
        <li>Worked with MySQL queries and authentication middleware.</li>
        <li>Collaborated through shared branches and team integration.</li>
      </ul>
      <p>
        The public website demonstrates the front end. The Express and MySQL
        back end is part of the development project and is not connected to the
        public demo.
      </p>
    `,
  },

  /* ---------- SPREAD 8 — frontend studies ---------- */
  {
    id: 'frontend-studies',
    head: 'Chapter III &middot; Collection B',
    folio: '15',
    html: `
      <div class="chapter-opener">
        <p class="chapter-opener__numeral">Collection B &mdash; Frontend studies</p>
        <h2 class="chapter-opener__title">Smaller experiments.<br />Important lessons.</h2>
        <p class="chapter-opener__sub">Before larger applications came smaller exercises in layout, responsiveness and interaction.</p>
      </div>
      <div class="plate">
        <p class="plate__title">
          <span>My Gallery</span>
          <span class="plate__index">Study 01 &mdash; Image presentation</span>
        </p>
        <p class="plate__text">
          An image gallery project focused on presenting a visual collection
          through structured layouts and navigation.
        </p>
        <ul class="plate__links">
          <li><a href="${LINKS.myGallery}" rel="noopener noreferrer">Open the project</a></li>
        </ul>
      </div>
      <div class="plate">
        <p class="plate__title">
          <span>AutoVault</span>
          <span class="plate__index">Study 02 &mdash; Product catalogue</span>
        </p>
        <p class="plate__text">
          A premium car-product catalogue exercise focused on product
          presentation, responsive layouts and clearer navigation.
        </p>
        <ul class="plate__links">
          <li><a href="${LINKS.autoVault}" rel="noopener noreferrer">Open the project</a></li>
        </ul>
      </div>
    `,
  },
  {
    id: 'frontend-studies-b',
    head: 'Chapter III &middot; Collection B',
    folio: '16',
    html: `
      <div class="plate">
        <p class="plate__title">
          <span>NovaTech</span>
          <span class="plate__index">Study 03 &mdash; Product showcase</span>
        </p>
        <p class="plate__text">
          A technology and gaming hardware showcase exploring responsive
          product grids, typography and image-led layouts.
        </p>
        <ul class="plate__links">
          <li><a href="${LINKS.novaTech}" rel="noopener noreferrer">Open the project</a></li>
        </ul>
      </div>
      <div class="plate">
        <p class="plate__title">
          <span>Booking Form</span>
          <span class="plate__index">Study 04 &mdash; Forms and interaction</span>
        </p>
        <p class="plate__text">
          A booking interface exercise exploring form structure, user input and
          the presentation of scheduling information.
        </p>
        <ul class="plate__links">
          <li><a href="${LINKS.booking}" rel="noopener noreferrer">Open the project</a></li>
        </ul>
      </div>
      <figure class="figure">
        <img src="images/previews/autovault.jpg" alt="Screenshot of the AutoVault product catalogue showing a grid of car parts" />
        <figcaption>AutoVault &mdash; the responsive product grid.</figcaption>
      </figure>
    `,
  },

  /* ---------- SPREAD 9 — Chapter IV, the illustrated pages ---------- */
  {
    id: 'chapter-iv',
    head: 'Chapter IV',
    folio: '17',
    html: `
      <div class="chapter-opener">
        <p class="chapter-opener__numeral">Chapter IV</p>
        <h2 class="chapter-opener__title">The Illustrated Pages</h2>
        <p class="chapter-opener__sub">Away from the keyboard, sometimes pencil and paper.</p>
      </div>
      <p class="dropcap">
        Drawing has been part of my creative life, but this portfolio is about my
        development journey. I chose a sketchbook page for the interior because
        it reflects how I approach building software: start with an idea,
        experiment, refine, and bring it to life.
      </p>
      <p>
        Drawing is a personal hobby and an occasional side practice, not the
        professional focus &mdash; the work at the centre of this book is
        software. A little graphite goes a long way, and it keeps the eye
        trained for composition and proportion.
      </p>
      <div class="ornament"><span>&#10013;</span></div>
    `,
  },
  {
    id: 'gallery-1',
    head: 'Chapter IV &middot; The gallery',
    folio: '18',
    html: `
      <h3>Studies on paper</h3>
      <figure class="figure figure--pair">
        <img src="projects/my-gallery/mountain-lake.jpg" alt="A mountain lake landscape reflected in still water" />
        <img src="projects/my-gallery/lake-bridge.jpg" alt="A bridge spanning a lake" />
        <figcaption>Lake and mountain &middot; a study in reflection, and a bridge across the water.</figcaption>
      </figure>
      <figure class="figure figure--pair">
        <img src="projects/my-gallery/sunrise.jpg" alt="Sunrise over Table Mountain in Cape Town" />
        <img src="projects/my-gallery/greatwall.jpg" alt="The Great Wall of China following a mountain ridge" />
        <figcaption>Table Mountain at sunrise &middot; the Great Wall following the ridge.</figcaption>
      </figure>
    `,
  },

  /* ---------- SPREAD 10 — the gallery continues, then Chapter V ---------- */
  {
    id: 'gallery-2',
    head: 'Chapter IV &middot; The gallery',
    folio: '19',
    html: `
      <figure class="figure figure--pair">
        <img src="projects/my-gallery/torii.jpg" alt="A torii gate with Mount Fuji in the background" />
        <img src="projects/my-gallery/rome.jpg" alt="The Colosseum in Rome" />
        <figcaption>The gate and the mountain &middot; history in stone.</figcaption>
      </figure>
      <figure class="figure figure--pair">
        <img src="projects/my-gallery/church.jpg" alt="Historic church architecture and stonework" />
        <img src="projects/my-gallery/city.jpg" alt="Tall buildings in a dense city skyline" />
        <figcaption>Symmetry and shadow &middot; lines reaching upward.</figcaption>
      </figure>
      <p>
        Twelve studies are collected in the gallery, spanning landscape,
        portrait and architecture. The sketch is never the final destination
        &mdash; in either medium.
      </p>
    `,
  },
  {
    id: 'chapter-v',
    head: 'Chapter V',
    folio: '20',
    html: `
      <div class="chapter-opener">
        <p class="chapter-opener__numeral">Chapter V</p>
        <h2 class="chapter-opener__title">The Commission</h2>
        <p class="chapter-opener__sub">Ideas become real through the work.</p>
      </div>
      <p class="dropcap">
        Whether you are looking for a junior developer, exploring a
        collaboration, or simply interested in one of the projects, I would be
        glad to hear from you. Good work often begins with a conversation.
      </p>
      <div class="plate">
        <p class="plate__title">
          <span>Say hello</span>
          <span class="plate__index">Note 01</span>
        </p>
        <p class="plate__text">
          The best place to reach me about junior developer roles, internships,
          professional opportunities and collaboration.
        </p>
        <ul class="plate__links">
          <li><a href="${LINKS.linkedin}" rel="noopener noreferrer">Message on LinkedIn</a></li>
        </ul>
      </div>
      <div class="plate">
        <p class="plate__title">
          <span>See the code</span>
          <span class="plate__index">Note 02</span>
        </p>
        <p class="plate__text">
          My repositories, project work and the code behind this development
          journey.
        </p>
        <ul class="plate__links">
          <li><a href="${LINKS.github}" rel="noopener noreferrer">Explore GitHub</a></li>
        </ul>
      </div>
    `,
  },

  /* ---------- SPREAD 11 — the closing letter ---------- */
  {
    id: 'letter',
    head: 'From the desk of Xabiso Phendu',
    folio: '21',
    html: `
      <h3>From the desk of Xabiso Phendu</h3>
      <p class="lede dropcap">
        Dear visitor, thank you for taking the time to open this book.
      </p>
      <p>
        I am a web developer based in Cape Town, South Africa. My journey into
        coding began at Life Choices Academy, where I started with no
        programming experience and gradually learned to build websites and
        applications. Today I am developing my skills in front end interfaces,
        back end APIs and databases.
      </p>
      <p>
        Working on team projects such as WeConnect and HR Tech Solutions has
        taught me how different parts of an application need to work together.
        I am interested in opportunities where I can contribute, learn from
        experienced developers and continue growing as a software developer.
      </p>
      <p>
        If you would like to discuss an opportunity, a collaboration or a
        project, please reach out through LinkedIn. A brief introduction and a
        little context are enough.
      </p>
      <p>
        This website does not collect or store contact messages, so you can
        reach me directly through my profile.
      </p>
      <p><em>Kind regards,<br />Xabiso Phendu<br />Web Developer &middot; Cape Town, South Africa</em></p>
    `,
  },
  {
    id: 'closing',
    head: 'Colossians 3:23',
    folio: '22',
    html: `
      <div class="title-page title-page--compact">
        ${CROSS}
        <h2 class="title-page__name" style="font-size:32px;">TECH'STAMENT</h2>
        <div class="title-page__rule"></div>
        <p class="title-page__sub">Christ in My Journey Through Code</p>
        <p class="title-page__author">Xabiso Phendu</p>
      </div>
      <div class="verse">
        &ldquo;And whatsoever ye do, do it heartily, as to the Lord, and not unto men.&rdquo;
        <span>Colossians 3:23 &mdash; KJV</span>
      </div>
      <p style="text-align:center; font-style:italic;">
        Here ends the testimony. The work continues.
      </p>
    `,
  },
];

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */

/** Total number of spreads in the book. */
export const SPREAD_COUNT = Math.ceil(PAGES.length / 2);

/** The chapter a given spread belongs to (or null). */
export function chapterForSpread(spread) {
  let found = null;
  for (const chapter of CHAPTERS) {
    if (chapter.spread <= spread) found = chapter;
  }
  return found;
}
