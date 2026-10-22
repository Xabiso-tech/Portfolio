/* ==========================================================
   TECH'STAMENT — LIGHTING

   The room is lit by a single warm lamp above and to the left
   of the table, a dim bounce from the right so the shadow side
   of the book is not pure black, and a very low ambient wash.

   Everything starts dark. The introduction raises the exposure
   of the renderer from zero, then the individual lights fade up
   in turn, so the light arrives in the same order as the
   attention: first the cover, then the table, then the pages.
   ========================================================== */

import * as THREE from 'three';

export class Lighting {
  constructor(scene) {
    this.scene = scene;

    /* A whisper of ambience so nothing is ever a dead silhouette. */
    this.ambient = new THREE.AmbientLight(0xffd9b0, 0.06);
    scene.add(this.ambient);

    /* The lamp: warm, high and to the left. It casts the
       shadow of the book across the table. */
    this.key = new THREE.SpotLight(0xffd2a0, 0, 26, Math.PI / 4.4, 0.55, 1.4);
    this.key.position.set(-2.6, 5.4, 2.9);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 18;
    this.key.shadow.bias = -0.0016;
    this.key.shadow.normalBias = 0.02;
    scene.add(this.key);
    scene.add(this.key.target);

    /* A cool, dim bounce from the far side so the book's dark
       edges keep their shape against the dark room. */
    this.rim = new THREE.PointLight(0x7f93b5, 0, 16, 1.6);
    this.rim.position.set(3.4, 2.6, -3.2);
    scene.add(this.rim);

    /* A small warm lamp sitting low on the table, which is what
       makes the wood grain visible once the room comes up. */
    this.tableGlow = new THREE.PointLight(0xffb877, 0, 9, 1.8);
    this.tableGlow.position.set(-1.5, 0.55, 1.9);
    scene.add(this.tableGlow);

    /* The page light: a soft downward wash that only matters once
       the book is open and the manuscript is being read. */
    this.pageLight = new THREE.PointLight(0xffe7c2, 0, 7, 1.5);
    this.pageLight.position.set(0, 3.1, 0.4);
    scene.add(this.pageLight);

    this.baseIntensities = {
      ambient: 0.06,
      key: 90,
      rim: 9,
      tableGlow: 5.5,
      pageLight: 12,
    };

    /* Two values drive everything and both are meant to be
       tweened, so they are exposed as plain properties. */
    this._roomLevel = 0;
    this._pageLevel = 0;
  }

  /** How lit the room is, from 0 (dark) to 1 (fully revealed). */
  get roomLevel() {
    return this._roomLevel;
  }

  set roomLevel(value) {
    this._roomLevel = value;
    this.apply();
  }

  /** How strongly the open pages are lit, from 0 to 1. */
  get pageLevel() {
    return this._pageLevel;
  }

  set pageLevel(value) {
    this._pageLevel = value;
    this.apply();
  }

  /** Write the two levels onto the actual lights. */
  apply() {
    const t = THREE.MathUtils.clamp(this._roomLevel, 0, 1);
    const p = THREE.MathUtils.clamp(this._pageLevel, 0, 1);
    const b = this.baseIntensities;

    this.ambient.intensity = b.ambient * t;
    this.key.intensity = b.key * t;
    this.rim.intensity = b.rim * t;
    this.tableGlow.intensity = b.tableGlow * t;
    this.pageLight.intensity = b.pageLight * p;
  }

  /** Point the key light at a place on the table. */
  aimAt(x, y, z) {
    this.key.target.position.set(x, y, z);
    this.key.target.updateMatrixWorld();
  }

  /** Set every light's strength from a 0–1 "how lit is the room" value. */
  setLevel(level, { pages = 0 } = {}) {
    this._roomLevel = level;
    this._pageLevel = pages;
    this.apply();
  }

  dispose() {
    this.key.target.parent?.remove(this.key.target);
    this.scene.remove(this.ambient, this.key, this.key.target, this.rim, this.tableGlow, this.pageLight);
    this.key.dispose();
    this.rim.dispose();
    this.tableGlow.dispose();
    this.pageLight.dispose();
  }
}
