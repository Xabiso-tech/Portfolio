/* ==========================================================
   TECH'STAMENT — TURNING THE LEAVES

   A real book does not swap two pictures; it swings a leaf
   through the air on its spine, and the page underneath is
   revealed as the leaf rises. This module does the same thing
   with HTML elements and CSS 3-D transforms.

   HOW A FORWARD TURN WORKS
   ------------------------
   The leaf starts lying on the right half of the spread with
   the current right-hand page on its front. It rotates about
   its spine edge through 180°:

     · from 0° to 90° the front face is still towards the
       reader and the leaf lifts, uncovering the next right
       page that has been waiting underneath;
     · from 90° to 180° the back of the leaf faces up, and it
       settles onto the left half, showing the next left page.

   So the leaf's front carries the page that is leaving and the
   leaf's back carries the page that is arriving. When the
   animation ends the leaf is put away and the two page slots
   take over the job of showing the content.

   A BACKWARD TURN IS THE SAME THING IN REVERSE, with the leaf
   starting on the left.

   ON A PHONE
   ----------
   There is only ever one page on screen, so the leaf has
   nowhere to swing to. There the page is simply turned away
   and the next one turned in, which reads far better on a
   small screen than a leaf trying to find a second half.
   ========================================================== */

import { gsap } from 'gsap';

/** Build the DOM for one page. */
export function renderPage(face) {
  const article = document.createElement('article');
  article.className = 'page';
  article.dataset.pageId = face.id;
  article.setAttribute('aria-label', `Page ${face.folio || ''}`.trim());

  article.innerHTML = `
    <div class="page__frame" aria-hidden="true"></div>
    <div class="page__head">
      <span>${face.head || ''}</span>
      <span>TECH'STAMENT</span>
    </div>
    <div class="page__body">${face.html}</div>
    <div class="page__folio">${face.folio || ''}</div>
  `;

  return article;
}

export class PageTurn {
  /**
   * @param {object} options
   * @param {HTMLElement} options.book the .spread__book element
   * @param {Array} options.pages every page face, in order
   * @param {boolean} options.reducedMotion
   * @param {Function} options.onChange called with the new index
   */
  constructor({ book, pages, reducedMotion = false, onChange = () => {} }) {
    this.book = book;
    this.pages = pages;
    this.reducedMotion = reducedMotion;
    this.onChange = onChange;

    this.index = 0;
    this.mobileSide = 0;
    this.turning = false;

    this.build();
    // Manuscript calls show after storing this instance; callbacks need it.
  }

  /* ------------------------------------------------------------
     THE DOM
     ------------------------------------------------------------ */

  build() {
    this.leftSlot = document.createElement('div');
    this.leftSlot.className = 'page-slot page-slot--left';

    this.rightSlot = document.createElement('div');
    this.rightSlot.className = 'page-slot page-slot--right';

    this.leaf = document.createElement('div');
    this.leaf.className = 'leaf leaf--right';

    this.leafFront = document.createElement('div');
    this.leafFront.className = 'leaf__face leaf__face--front';

    this.leafBack = document.createElement('div');
    this.leafBack.className = 'leaf__face leaf__face--back';

    this.leafEdge = document.createElement('div');
    this.leafEdge.className = 'leaf__edge';

    this.leafShade = document.createElement('div');
    this.leafShade.className = 'leaf__shade';

    this.leaf.append(this.leafFront, this.leafBack, this.leafEdge, this.leafShade);

    this.book.append(this.leftSlot, this.rightSlot, this.leaf);

    this.leaf.style.opacity = '0';
    this.leaf.style.visibility = 'hidden';
  }

  /* ------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------ */

  /** The two page faces of a spread. */
  facesOf(spread) {
    return [
      this.pages[spread * 2] || null,
      this.pages[spread * 2 + 1] || null,
    ];
  }

  /** How many spreads there are. */
  get spreadCount() {
    return Math.ceil(this.pages.length / 2);
  }

  /** True when the viewport only has room for one page. */
  get isSingle() {
    return window.matchMedia('(max-width: 860px)').matches;
  }

  /* ------------------------------------------------------------
     SHOWING A SPREAD
     ------------------------------------------------------------ */

  /** Put a spread on screen with no animation. */
  show(spread) {
    this.index = spread;
    const [left, right] = this.facesOf(spread);

    this.leftSlot.replaceChildren(left ? renderPage(left) : '');
    const visible = this.isSingle ? (this.mobileSide ? right : left) : right;
    this.rightSlot.replaceChildren(visible ? renderPage(visible) : '');

    this.resetLeaf();
    this.onChange(this.index);
  }

  /** Park the leaf out of sight, ready for the next turn. */
  resetLeaf() {
    gsap.killTweensOf(this.leaf);
    gsap.set(this.leaf, {
      rotationY: 0,
      opacity: 0,
      visibility: 'hidden',
      zIndex: 4,
    });
    gsap.set(this.leafShade, { opacity: 0 });
    this.leaf.className = 'leaf leaf--right';
    gsap.set(this.leaf, { transformOrigin: 'left center' });

    /* No shadow is left lying on either page. */
    this.leftSlot.style.setProperty('--shadow', 0);
    this.rightSlot.style.setProperty('--shadow', 0);
  }

  /* ------------------------------------------------------------
     TURNING
     ------------------------------------------------------------ */

  /** Turn forwards one spread. */
  next() {
    if (this.turning) return Promise.resolve(false);
    if (this.isSingle) return this.turnSingle(1);
    if (this.index >= this.spreadCount - 1) return Promise.resolve(false);

    if (this.reducedMotion) {
      this.show(this.index + 1);
      return Promise.resolve(true);
    }

    if (this.isSingle) return this.turnSingle(1);

    const target = this.index + 1;
    const [nextLeft, nextRight] = this.facesOf(target);
    const [, currentRight] = this.facesOf(this.index);

    this.turning = true;

    /* The leaf takes the current right page on its front and
       the next left page on its back. */
    this.leaf.className = 'leaf leaf--right';
    this.leafFront.replaceChildren(currentRight ? renderPage(currentRight) : '');
    this.leafBack.replaceChildren(nextLeft ? renderPage(nextLeft) : '');

    /* The next right page is waiting underneath. */
    this.rightSlot.replaceChildren(nextRight ? renderPage(nextRight) : '');

    gsap.set(this.leaf, {
      rotationY: 0,
      opacity: 1,
      visibility: 'visible',
      transformOrigin: 'left center',
    });

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        onComplete: () => {
          /* The leaf has landed showing the next left page. Put
             the content in the slot and put the leaf away. */
          this.leftSlot.replaceChildren(nextLeft ? renderPage(nextLeft) : '');
          this.index = target;
          this.resetLeaf();
          this.turning = false;
          this.onChange(this.index);
          resolve(true);
        },
      });

      timeline.to(this.leaf, {
        rotationY: -180,
        duration: 1.05,
        ease: 'power2.inOut',
      }, 0);

      /* The shadow the leaf throws across the page underneath.
         The custom property is written by hand rather than handed
         to the animation library, so the CSS always receives a
         plain number it can use as an opacity. */
      const shadow = { value: 0.75 };

      timeline.to(shadow, {
        value: 0,
        duration: 1.05,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.rightSlot.style.setProperty('--shadow', shadow.value);
        },
      }, 0);

      /* A soft darkening on the leaf as it lifts away from the
         table, and a bright edge where the light catches the
         paper. */
      timeline.fromTo(this.leafShade,
        { opacity: 0 },
        { opacity: 0.55, duration: 0.5, ease: 'power2.out' },
        0
      );
      timeline.to(this.leafShade, {
        opacity: 0,
        duration: 0.55,
        ease: 'power2.in',
      }, 0.5);
    });
  }

  /** Turn back one spread. */
  prev() {
    if (this.turning) return Promise.resolve(false);
    if (this.isSingle) return this.turnSingle(-1);
    if (this.index <= 0) return Promise.resolve(false);

    if (this.reducedMotion) {
      this.show(this.index - 1);
      return Promise.resolve(true);
    }

    if (this.isSingle) return this.turnSingle(-1);

    const target = this.index - 1;
    const [prevLeft, prevRight] = this.facesOf(target);
    const [currentLeft] = this.facesOf(this.index);

    this.turning = true;

    /* The leaf starts on the left with the current left page on
       its front; its back is the right page of the spread we
       are returning to. */
    this.leaf.className = 'leaf leaf--left';
    this.leafFront.replaceChildren(currentLeft ? renderPage(currentLeft) : '');
    this.leafBack.replaceChildren(prevRight ? renderPage(prevRight) : '');

    gsap.set(this.leaf, {
      rotationY: 0,
      opacity: 1,
      visibility: 'visible',
      transformOrigin: 'right center',
    });

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        onComplete: () => {
          this.leftSlot.replaceChildren(prevLeft ? renderPage(prevLeft) : '');
          this.rightSlot.replaceChildren(prevRight ? renderPage(prevRight) : '');
          this.index = target;
          this.resetLeaf();
          this.turning = false;
          this.onChange(this.index);
          resolve(true);
        },
      });

      timeline.to(this.leaf, {
        rotationY: 180,
        duration: 1.05,
        ease: 'power2.inOut',
      }, 0);

      const shadow = { value: 0.75 };

      timeline.to(shadow, {
        value: 0,
        duration: 1.05,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.leftSlot.style.setProperty('--shadow', shadow.value);
        },
      }, 0);

      timeline.fromTo(this.leafShade,
        { opacity: 0 },
        { opacity: 0.5, duration: 0.5, ease: 'power2.out' },
        0
      );
      timeline.to(this.leafShade, {
        opacity: 0,
        duration: 0.55,
        ease: 'power2.in',
      }, 0.5);
    });
  }

  /* ------------------------------------------------------------
     SINGLE PAGE MODE
     ------------------------------------------------------------ */

  /**
   * The phone version of a turn: the page you are reading is
   * turned away and the next one is turned in.
   */
  turnSingle(direction) {
    // Visit both faces on phones while retaining shared spread indices.
    const face = this.index * 2 + this.mobileSide + direction;
    if (face < 0 || face >= this.pages.length) return Promise.resolve(false);
    const arrive = () => {
      this.mobileSide = face % 2;
      this.show(Math.floor(face / 2));
      this.turning = false;
    };
    if (this.reducedMotion) { arrive(); return Promise.resolve(true); }
    this.turning = true;
    return new Promise((resolve) => {
      gsap.to(this.rightSlot, {
        opacity: 0, x: direction * -20, duration: 0.18,
        onComplete: () => {
          arrive();
          this.turning = true;
          gsap.fromTo(this.rightSlot, { opacity: 0, x: direction * 20 }, {
            opacity: 1, x: 0, duration: 0.22,
            onComplete: () => { this.turning = false; resolve(true); },
          });
        },
      });
    });
  }

  /* ------------------------------------------------------------
     CHAPTER NAVIGATION
     ------------------------------------------------------------ */

  /** Jump straight to a spread, with a short fade if it is far away. */
  goTo(spread) {
    const target = Math.max(0, Math.min(this.spreadCount - 1, spread));

    if (this.turning) return Promise.resolve(false);
    if (this.isSingle) {
      this.mobileSide = 0;
      this.show(target);
      return Promise.resolve(true);
    }
    if (target === this.index) {
      return Promise.resolve(false);
    }

    if (this.reducedMotion || Math.abs(target - this.index) > 1) {
      this.show(target);
      return Promise.resolve(true);
    }

    if (target > this.index) return this.next();
    return this.prev();
  }

  dispose() {
    gsap.killTweensOf(this.leaf);
    gsap.killTweensOf(this.leftSlot);
    gsap.killTweensOf(this.rightSlot);
  }
}
