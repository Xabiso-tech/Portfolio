/* ==========================================================
   TECH'STAMENT — THE BOOK SCENE

   Owns the renderer, the room, the camera and the animation
   that carries the visitor from darkness to the open book.

   THE SEQUENCE
   ------------
     1. darkness            the renderer is lit at zero exposure
     2. the light comes up  the lamp warms and the cover appears
     3. the cover           held long enough to read the lettering
     4. the pull-back       the whole book on its wooden table
     5. the opening         the cover swings on the spine hinge
     6. the spread          the camera looks down on the pages

   Every step is a promise, so the application controller can
   wait for the picture to settle before it does anything else.

   THE SHOTS
   ---------
   Each shot declares the points it must contain rather than a
   camera position, so the framing survives any shape of window.
   On a narrow screen the spread shot becomes a single-page shot,
   because a two-page spread on a phone is unreadably small.
   ========================================================== */

import * as THREE from 'three';
import { gsap } from 'gsap';

import { Bible, BOOK, PAGE_Y } from './Bible.js';
import { Lighting } from './Lighting.js';
import { DustMotes } from './DustMotes.js';
import { CameraDirector } from './CameraDirector.js';
import { createWoodMaps, createEnvironment } from './textures.js';

/** Below this width the reader is shown one page at a time. */
export const SINGLE_PAGE_BREAKPOINT = 860;

/** The names of the shots, in the order the story visits them. */
export const SHOT_NAMES = ['cover', 'reveal', 'opening', 'spread', 'spread-single'];

/**
 * The named shots. `direction` is the vector from the target to
 * the camera, so the elevation and the bearing of the shot are
 * read straight off it.
 *
 * Every shot is built from the geometry of the actual book, so the
 * framing is always correct: the close-up really does contain the
 * gilt board, and the reading shot really does contain the open
 * spread.
 */
export class BookScene {
  constructor(container, { reducedMotion = false } = {}) {
    this.container = container;
    this.reducedMotion = reducedMotion;
    this.isDestroyed = false;
    this.timelines = [];
    this.paused = false;

    /* ---- Renderer ------------------------------------------- */
    /* alpha: true keeps the canvas transparent so the room's
       CSS gradient shows through. There is never a visible
       rectangular edge where the canvas ends. */
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0;
    this.renderer.setClearColor(0x000000, 0);

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(this.renderer.domElement);

    /* ---- Scene ---------------------------------------------- */
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0507, 0.16);

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 60);
    this.director = new CameraDirector(this.camera);
    this.director.idle = !reducedMotion;

    /* A tiny picture of the room, so the gilt has something to
       reflect and reads as metal rather than as yellow paint. */
    this.environment = createEnvironment(this.renderer);
    this.scene.environment = this.environment.texture;

    /* ---- The room ------------------------------------------- */
    this.lighting = new Lighting(this.scene);
    this.buildTable();

    /* ---- The book ------------------------------------------- */
    this.bible = new Bible(this.renderer);
    this.scene.add(this.bible.group);

    this.dust = new DustMotes(this.scene);

    /* ---- The shots ------------------------------------------ */
    this.buildShots();

    this.clock = new THREE.Clock();
    this.elapsed = 0;

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);

    /* A hidden tab must not keep burning frames. */
    this.onVisibility = () => this.handleVisibility();
    document.addEventListener('visibilitychange', this.onVisibility);

    this.resize();
    this.director.snap('cover');
    this.animate();
  }

  /* ------------------------------------------------------------
     THE SHOTS
     ------------------------------------------------------------ */

  /**
   * Register the framed shots.
   *
   * Each shot declares the points it must contain rather than a
   * camera position, so the framing survives any shape of window.
   * On a narrow screen the spread shot becomes a single-page shot,
   * because a two-page spread on a phone is unreadably small.
   */
  buildShots() {
    const bible = this.bible;
    const { width } = BOOK;

    /* Close over the closed cover. Every line of lettering is
       inside the frame, and the light is nearly overhead so the
       type is not foreshortened into illegibility. */
    this.director.addShot('cover', {
      target: new THREE.Vector3(width / 2, bible.closedTop, 0),
      direction: new THREE.Vector3(0.14, 0.9, 0.41),
      points: bible.coverCorners(),
      fill: 0.86,
    });

    /* Pulled back: the book sits on a wooden table in a dark
       room, with the lamp throwing a long shadow. The book only
       fills part of the frame, because the room around it is the
       point of the shot. */
    this.director.addShot('reveal', {
      target: new THREE.Vector3(width / 2, 0.24, 0),
      direction: new THREE.Vector3(0.33, 0.62, 0.71),
      points: bible.bookCorners(),
      fill: 0.55,
    });

    /* Half way through the opening, when the cover is up in the
       air and the pages are just appearing. The frame has to hold
       the swinging board, the apex it reaches, and the open book
       it is falling towards. */
    this.director.addShot('opening', {
      target: new THREE.Vector3(0, 0.45, 0),
      direction: new THREE.Vector3(0.28, 0.66, 0.7),
      points: [...bible.bookCorners(), ...bible.swingApex(), ...bible.openCorners()],
      fill: 0.68,
    });

    /* Looking down on the open spread. */
    this.director.addShot('spread', {
      target: new THREE.Vector3(0, PAGE_Y, 0),
      direction: new THREE.Vector3(0, 0.927, 0.375),
      points: bible.openCorners(),
      fill: 0.92,
    });

    /* The same shot on a phone: one page, filling the frame. */
    this.director.addShot('spread-single', {
      target: new THREE.Vector3(width / 2, PAGE_Y, 0),
      direction: new THREE.Vector3(0, 0.927, 0.375),
      points: bible.pageQuad(),
      fill: 0.92,
    });

    return this;
  }

  /* ------------------------------------------------------------
     THE TABLE
     ------------------------------------------------------------ */

  buildTable() {
    const wood = createWoodMaps({ size: 1024, seed: 33 });
    wood.map.repeat.set(6, 6);
    wood.normalMap.repeat.set(6, 6);
    wood.ormMap.repeat.set(6, 6);

    this.woodMaps = wood;

    const material = new THREE.MeshStandardMaterial({
      map: wood.map,
      normalMap: wood.normalMap,
      roughnessMap: wood.ormMap,
      metalnessMap: wood.ormMap,
      color: 0x8a6a4e,
      roughness: 1,
      metalness: 1,
      envMapIntensity: 0.35,
    });

    const geometry = new THREE.BoxGeometry(24, 0.6, 24);
    const table = new THREE.Mesh(geometry, material);
    /* The surface of the table sits exactly at y = 0. */
    table.position.set(0, -0.3, 0);
    table.receiveShadow = true;
    this.scene.add(table);

    this.table = table;
  }

  /* ------------------------------------------------------------
     THE INTRO
     ------------------------------------------------------------ */

  /**
   * Play the cinematic opening: darkness, the lamp coming up on
   * the cover, a hold, and then the pull-back.
   *
   * @param {object} [options]
   * @param {Function} [options.onLight] called the moment the lamp
   *        starts to rise, so that the loading veil can be lifted
   *        exactly as the light appears
   */
  playIntro({ onLight = null } = {}) {
    if (this.isDestroyed) return Promise.resolve();

    this.director.snap('cover');
    this.lighting.aimAt(BOOK.width / 2, this.bible.closedTop - 0.05, 0);

    if (this.reducedMotion) {
      /* No cinematic movement: arrive at the reveal shot and
         let the light simply be there. */
      this.renderer.toneMappingExposure = 1.15;
      this.lighting.setLevel(1);
      this.director.snap('reveal');
      onLight?.();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this._introResolve = resolve;

      const timeline = gsap.timeline({
        onComplete: () => {
          this._introResolve = null;
          this._introTimeline = null;
          resolve();
        },
      });
      this._introTimeline = timeline;
      this.timelines.push(timeline);

      /* A beat of true darkness so the first light has weight. */
      timeline.to({}, { duration: 0.7 });

      /* The veil lifts as the lamp starts to rise, so the visitor
         watches the room appear rather than a finished picture. */
      timeline.add(() => onLight?.(), 0.4);

      /* The lamp warms up. The exposure and the key light come
         together, so the cover seems to be found rather than
         switched on. */
      timeline.to(this.renderer, {
        toneMappingExposure: 1.15,
        duration: 2.1,
        ease: 'power2.inOut',
      }, 0.45);

      timeline.to(this.lighting, {
        roomLevel: 1,
        duration: 2.1,
        ease: 'power2.inOut',
      }, 0.45);

      /* Hold on the cover so the lettering can be read. */
      timeline.to({}, { duration: 1.7 });

      /* The pull-back. */
      timeline.add(() => {
        this.director.moveTo('reveal', 3, { ease: 'power2.inOut' });
      });

      timeline.to({}, { duration: 3.2 });

      /* A last breath before the invitation appears. */
      timeline.to({}, { duration: 0.4 });
    });
  }

  /**
   * Stop the introduction where it stands.
   *
   * Somebody who cannot wait for the cinema must not be left with
   * a camera that keeps drifting afterwards, so the timeline is
   * killed and the promise is released at once.
   */
  cancelIntro() {
    this._introTimeline?.kill();
    this._introTimeline = null;

    if (this._introResolve) {
      const resolve = this._introResolve;
      this._introResolve = null;
      resolve();
    }
  }

  /* ------------------------------------------------------------
     OPENING THE BOOK
     ------------------------------------------------------------ */

  /**
   * Swing the front cover open on its spine hinge, then settle
   * the camera over the open spread.
   */
  open() {
    if (this.isDestroyed) return Promise.resolve();

    const duration = this.reducedMotion ? 0.01 : 2.6;
    const state = { open: 0 };

    /* The camera drifts back as the cover comes up, so that both
       halves of the book stay in frame. */
    this.director.moveTo('opening', duration * 0.8, { ease: 'power2.inOut' });

    this.lighting.aimAt(0, PAGE_Y, 0);

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        onComplete: () => {
          this.bible.setOpen(1);
          resolve();
        },
      });
      this.timelines.push(timeline);

      /* The cover rotates about the spine. The easing is
         deliberately slow at the start — the cover has to break
         the book's weight before it moves — and quick through
         the middle, where it is only falling. */
      timeline.to(state, {
        open: 1,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => this.bible.setOpen(state.open),
      }, 0);

      /* The pages are lit as they appear. */
      timeline.to(this.lighting, {
        pageLevel: 1,
        duration: duration * 0.55,
        ease: 'power2.out',
      }, duration * 0.4);
    }).then(() => this.director.moveTo(this.spreadShot, this.reducedMotion ? 0 : 1.4));
  }

  /* ------------------------------------------------------------
     THE SPREAD
     ------------------------------------------------------------ */

  /** True when the reader is shown one page at a time. */
  get isSinglePage() {
    return window.matchMedia(`(max-width: ${SINGLE_PAGE_BREAKPOINT}px)`).matches;
  }

  /** The name of the shot that frames the reading surface. */
  get spreadShot() {
    return this.isSinglePage ? 'spread-single' : 'spread';
  }

  /** The four world corners of the open spread. */
  spreadQuad() {
    return this.bible.spreadQuad();
  }

  /** The world corners of the right-hand page only (mobile). */
  pageQuad() {
    return this.bible.pageQuad();
  }

  /**
   * Project a world point to CSS pixels, in page coordinates.
   *
   * @param {THREE.Vector3} point
   * @returns {{x: number, y: number}}
   */
  screenPoint(point) {
    const rect = this.container.getBoundingClientRect();
    const projected = this.director.screenPoint(point, rect.width, rect.height);

    return {
      x: projected.x + rect.left,
      y: projected.y + rect.top,
    };
  }

  /**
   * The screen corners of the spread, ready to be handed to the
   * homography that lays the manuscript over the book.
   *
   * @param {boolean} single true for the one-page phone layout
   */
  spreadCorners(single = false) {
    const quad = single ? this.pageQuad() : this.spreadQuad();
    return quad.map((point) => this.screenPoint(point));
  }

  /* ------------------------------------------------------------
     THE READING ROOM
     ------------------------------------------------------------ */

  /**
   * Dim the room once the manuscript takes over, so the reading
   * surface is the brightest thing on screen while the book is
   * still faintly visible behind it.
   */
  dim(amount = 0.42) {
    return new Promise((resolve) => {
      gsap.to(this.renderer, {
        toneMappingExposure: amount,
        duration: this.reducedMotion ? 0.01 : 1.1,
        ease: 'power2.inOut',
        onComplete: resolve,
      });
    });
  }

  /* ------------------------------------------------------------
     FRAME
     ------------------------------------------------------------ */

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);

    /* The framing of every shot depends on the shape of the
       window, so the current shot is solved again. */
    this.director.reframe();
  }

  animate() {
    if (this.isDestroyed) return;

    /* A hidden tab must not burn frames: the loop keeps its place
       but stops drawing until the reader comes back. */
    if (this.paused) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
      return;
    }

    this.animationFrame = requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += delta;

    if (!this.reducedMotion) {
      this.dust.update(delta);
    }

    this.director.update(this.elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  /* ------------------------------------------------------------
     STAYING QUIET
     ------------------------------------------------------------ */

  /** Stop drawing. */
  pause() {
    this.paused = true;
  }

  /** Start drawing again. */
  resume() {
    if (!this.paused) return;
    this.paused = false;
    /* The clock has been running under the pause, so it is reset
       here or the first frame back would jump. */
    this.clock.getDelta();
  }

  /** React to the tab being hidden or shown. */
  handleVisibility() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  dispose() {
    this.isDestroyed = true;
    this.timelines.forEach((timeline) => timeline.kill());
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.director.dispose();
    this.dust.dispose();
    this.bible.dispose();
    this.lighting.dispose();
    this.table.geometry.dispose();
    this.table.material.dispose();
    Object.values(this.woodMaps).forEach((texture) => texture.dispose());
    this.environment?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

export { BOOK, PAGE_Y };
