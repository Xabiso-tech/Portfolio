/* ==========================================================
   TECH'STAMENT — THE MANUSCRIPT

   The reading half of the experience. It owns the page slots,
   the contents panel, the toolbar and the keyboard, and it is
   also the element that gets laid over the open book while
   the camera is still on it.

   TWO LAYOUTS
   -----------
   On a wide screen the book shows two pages at once, exactly
   like a real spread. On a phone it shows one page and turns
   them one at a time.

   THE HANDOFF
   -----------
   `project()` takes the four corners of the physical spread as
   the camera sees them and lays the manuscript over them with
   a homography. `flatten()` then eases that transform into the
   flat, straight-on reading layout.

   CONTINUOUS READING
   ------------------
   Turning leaves is a lovely way to read and a poor way to
   navigate with a screen reader, on a phone, or with one hand.
   The continuous mode lays every page out in one long column
   that scrolls, with the same typography and the same words.
   It is the same manuscript, read differently.
   ========================================================== */

import { gsap } from 'gsap';
import { PageTurn, renderPage } from './PageTurn.js';
import { flatLayout, matrixToString, lerpMatrix, projectOntoSpread } from './SpreadProjection.js';

export class Manuscript {
  constructor({ pages, chapters, reducedMotion = false, onChange = () => {} }) {
    this.pages = pages;
    this.chapters = chapters;
    this.reducedMotion = reducedMotion;
    this.onChange = onChange;

    this.root = document.querySelector('#manuscript');
    this.spread = document.querySelector('#spread');
    this.backdrop = document.querySelector('.manuscript__backdrop');
    this.indicator = document.querySelector('#page-indicator');
    this.prevButton = document.querySelector('#page-prev');
    this.nextButton = document.querySelector('#page-next');
    this.contentsToggle = document.querySelector('#toggle-contents');
    this.contentsPanel = document.querySelector('#contents-panel');
    this.contentsList = document.querySelector('#contents-list');
    this.contentsClose = document.querySelector('#contents-close');
    this.continuousToggle = document.querySelector('#toggle-continuous');

    this.designWidth = 1200;
    this.designHeight = 900;
    this.projected = null;
    this.flat = null;
    this.continuousMode = false;
  }

  /* ------------------------------------------------------------
     SET UP
     ------------------------------------------------------------ */

  mount() {
    this.book = document.createElement('div');
    this.book.className = 'spread__book';
    this.spread.replaceChildren(this.book);

    /* The continuous column: every page, in order, once. */
    this.continuous = document.createElement('div');
    this.continuous.className = 'continuous';
    this.continuous.id = 'continuous';
    this.continuous.hidden = true;
    this.root?.appendChild(this.continuous);

    this.turner = new PageTurn({
      book: this.book,
      pages: this.pages,
      reducedMotion: this.reducedMotion,
      onChange: (index) => {
        this.updateIndicator(index);
        this.updateButtons(index);
        this.onChange(index);
      },
    });

    this.buildContinuous();
    this.buildContents();
    this.registerEvents();

    this.layout();
    this.turner.show(0);
  }

  /** The design size of the spread, which depends on the layout. */
  get design() {
    const single = window.matchMedia('(max-width: 860px)').matches;
    return single
      ? { width: 480, height: 720 }
      : { width: 1200, height: 900 };
  }

  /* ------------------------------------------------------------
     THE CONTINUOUS COLUMN
     ------------------------------------------------------------ */

  buildContinuous() {
    if (!this.continuous) return;

    const pages = this.pages.map((face) => {
      const wrapper = document.createElement('article');
      wrapper.className = 'continuous__page';
      wrapper.dataset.pageId = face.id;
      wrapper.appendChild(renderPage(face));
      return wrapper;
    });

    this.continuous.replaceChildren(...pages);
  }

  /**
   * Switch between the turned-page book and the continuous column.
   *
   * @param {boolean} on
   */
  setContinuous(on) {
    const next = Boolean(on);
    if (next === this.continuousMode) return;

    this.continuousMode = next;
    if (!next) this.turner.show(this.index);
    this.updateButtons(this.index);
    this.updateIndicator(this.index);

    this.root?.classList.toggle('is-continuous', next);
    this.spread.hidden = next;
    if (this.continuous) this.continuous.hidden = !next;

    this.continuousToggle?.setAttribute('aria-pressed', next ? 'true' : 'false');
    this.continuousToggle?.setAttribute(
      'aria-label',
      next ? 'Switch back to the paged book' : 'Read as one continuous column'
    );

    if (next) {
      this.scrollToSpread(this.turner.index, 'auto');
    } else {
      this.layout();
    }
  }

  toggleContinuous() {
    this.setContinuous(!this.continuousMode);
  }

  /** Move the continuous column to the current spread. */
  scrollToSpread(spread, behavior = 'smooth') {
    if (!this.continuous) return;

    const target = this.continuous.children[spread * 2];
    if (!target) return;

    target.scrollIntoView({
      behavior: this.reducedMotion ? 'auto' : behavior,
      block: 'start',
    });
  }

  /* ------------------------------------------------------------
     THE CONTENTS PANEL
     ------------------------------------------------------------ */

  buildContents() {
    if (!this.contentsList) return;

    const items = this.chapters.map((chapter) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'contents__link';

      const label = document.createElement('span');
      label.textContent = `${chapter.numeral} — ${chapter.title}`;

      const folio = document.createElement('span');
      folio.className = 'contents__folio';
      folio.textContent = chapter.folio || '·';

      button.append(label, folio);
      button.addEventListener('click', () => {
        this.closeContents();
        this.goToChapter(chapter);
      });

      item.appendChild(button);
      return item;
    });

    this.contentsList.replaceChildren(...items);
  }

  registerEvents() {
    this.prevButton?.addEventListener('click', () => this.prev());
    this.nextButton?.addEventListener('click', () => this.next());

    this.contentsToggle?.addEventListener('click', () => this.toggleContents());
    this.contentsClose?.addEventListener('click', () => this.closeContents());

    this.continuousToggle?.addEventListener('click', () => this.toggleContinuous());

    this.onKeyDown = (event) => {
      if (!this.isOpen) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (!this.contentsPanel.hidden) {
        if (event.key === 'Escape') { event.preventDefault(); this.closeContents(); }
        if (event.key === 'Tab') {
          const buttons = [...this.contentsPanel.querySelectorAll('button')];
          const first = buttons[0], last = buttons.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
          }
        }
        return;
      }
      if (this.continuousMode && /^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End)$/.test(event.key)) return;
      const target = event.target;
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          event.preventDefault();
          this.next();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault();
          this.prev();
          break;
        case 'Home':
          event.preventDefault();
          this.goToSpread(0);
          break;
        case 'End':
          event.preventDefault();
          this.goToSpread(this.turner.spreadCount - 1);
          break;
        case 'Escape':
          this.closeContents();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', this.onKeyDown);

    this.onResize = () => {
      this.layout();
      if (!this.turner.turning) this.turner.show(this.index);
    };
    window.addEventListener('resize', this.onResize);

    /* A swipe turns the page, the way a thumb does it. */
    this.onTouchStart = (event) => {
      if (event.touches.length !== 1) return;
      this.touchStart = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    };

    this.onTouchEnd = (event) => {
      if (!this.touchStart) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - this.touchStart.x;
      const dy = touch.clientY - this.touchStart.y;
      this.touchStart = null;

      /* Only a clear sideways swipe counts, and it has to be more
         horizontal than vertical so a scroll is never mistaken for
         a page turn. */
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return;

      if (dx < 0) this.next();
      else this.prev();
    };

    this.root?.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.root?.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  /* ------------------------------------------------------------
     READING
     ------------------------------------------------------------ */

  get isOpen() {
    return this.root && !this.root.hasAttribute('hidden');
  }

  get index() {
    return this.turner ? this.turner.index : 0;
  }

  next() {
    if (this.continuousMode) {
      const target = Math.min(this.index + 1, this.turner.spreadCount - 1);
      return this.goToSpread(target);
    }
    return this.turner.next();
  }

  prev() {
    if (this.continuousMode) {
      const target = Math.max(this.index - 1, 0);
      return this.goToSpread(target);
    }
    return this.turner.prev();
  }

  goToSpread(spread) {
    if (this.continuousMode) {
      const target = Math.max(0, Math.min(this.turner.spreadCount - 1, spread));
      if (target === this.index) return Promise.resolve(false);

      this.turner.index = target;
      this.scrollToSpread(target);
      this.updateIndicator(target);
      this.updateButtons(target);
      this.onChange(target);
      return Promise.resolve(true);
    }

    return this.turner.goTo(spread);
  }

  goToChapter(chapter) {
    const result = this.goToSpread(chapter.spread);
    if (this.turner.isSingle && !this.continuousMode) {
      this.turner.mobileSide = chapter.side || 0;
      this.turner.show(chapter.spread);
    }
    return result;
  }

  updateButtons(index) {
    const face = index * 2 + (this.turner?.mobileSide || 0);
    const single = this.turner?.isSingle && !this.continuousMode;
    if (this.prevButton) this.prevButton.disabled = single ? face <= 0 : index <= 0;
    if (this.nextButton) {
      this.nextButton.disabled = single ? face >= this.pages.length - 1 : index >= this.turner.spreadCount - 1;
    }
  }

  updateIndicator(index) {
    if (!this.indicator) return;

    const left = this.pages[index * 2];
    const right = this.pages[index * 2 + 1];

    const chapter = this.chapters
      .filter((entry) => entry.spread <= index)
      .pop();

    const numeral = chapter ? chapter.numeral.replace('Chapter ', '') : '';
    const folio = this.turner?.isSingle && !this.continuousMode
      ? (this.turner.mobileSide ? right?.folio : left?.folio)
      : right?.folio || left?.folio;

    this.indicator.textContent = [numeral, folio ? `Page ${folio}` : '']
      .filter(Boolean)
      .join('  ·  ');
  }

  /* ------------------------------------------------------------
     THE CONTENTS PANEL
     ------------------------------------------------------------ */

  toggleContents() {
    if (!this.contentsPanel) return;

    const open = this.contentsPanel.hasAttribute('hidden');
    if (open) {
      this.contentsPanel.removeAttribute('hidden');
      this.contentsToggle?.setAttribute('aria-expanded', 'true');
      this.spread.inert = true;
      this.continuous.inert = true;
      this.contentsPanel.querySelector('button')?.focus();
    } else {
      this.closeContents();
    }
  }

  closeContents() {
    if (!this.contentsPanel) return;
    const wasOpen = !this.contentsPanel.hidden;
    this.contentsPanel.setAttribute('hidden', '');
    this.spread.inert = false;
    this.continuous.inert = false;
    if (wasOpen) this.contentsToggle?.focus();
    this.contentsToggle?.setAttribute('aria-expanded', 'false');
  }

  /* ------------------------------------------------------------
     LAYOUT
     ------------------------------------------------------------ */

  /**
   * Compute the flat reading layout and apply it, unless the
   * manuscript is currently projected onto the book.
   */
  layout() {
    const design = this.design;
    this.designWidth = design.width;
    this.designHeight = design.height;

    this.flat = flatLayout(
      design.width,
      design.height,
      window.innerWidth,
      window.innerHeight,
      parseFloat(getComputedStyle(this.root).paddingTop) + 16
    );

    if (!this.projected && !this.continuousMode) {
      this.spread.style.transform = matrixToString(this.flat);
    }
  }

  /**
   * Lay the manuscript over the physical spread.
   *
   * @param {Array<{x: number, y: number}>} corners the four
   *        screen corners of the spread, in CSS pixels
   */
  project(corners) {
    const design = this.design;
    this.designWidth = design.width;
    this.designHeight = design.height;

    const matrix = projectOntoSpread(corners, design.width, design.height);
    this.projected = matrix;
    this.spread.style.transform = matrixToString(matrix);
  }

  /**
   * Ease the projected manuscript into the flat reading layout.
   */
  flatten(duration = 1.25) {
    if (this.continuousMode) {
      this.layout();
      return Promise.resolve();
    }

    if (!this.projected) {
      this.layout();
      return Promise.resolve();
    }

    const from = this.projected.slice();
    const to = this.flat.slice();

    return new Promise((resolve) => {
      const proxy = { t: 0 };

      gsap.to(proxy, {
        t: 1,
        duration: this.reducedMotion ? 0.01 : duration,
        ease: 'power3.inOut',
        onUpdate: () => {
          this.spread.style.transform = matrixToString(
            lerpMatrix(from, to, proxy.t)
          );
        },
        onComplete: () => {
          this.projected = null;
          this.spread.style.transform = matrixToString(to);
          resolve();
        },
      });
    });
  }

  /** Show the manuscript. */
  reveal() {
    this.root?.removeAttribute('hidden');
    document.body.classList.add('is-reading');
  }

  /**
   * Fade in the dark room behind the pages.
   *
   * While the manuscript is lying on the open book there is no
   * backdrop at all, so that the pages look like paper on a table
   * and the real book can be seen around them. Once the pages have
   * flattened out into a reading surface, the room darkens down
   * behind them and the book becomes a shape in the shadows.
   */
  settle() {
    if (!this.backdrop) return;

    gsap.to(this.backdrop, {
      opacity: 1,
      duration: this.reducedMotion ? 0.01 : 1.2,
      ease: 'power2.inOut',
    });
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);
    this.root?.removeEventListener('touchstart', this.onTouchStart);
    this.root?.removeEventListener('touchend', this.onTouchEnd);
    this.turner?.dispose();
  }
}
