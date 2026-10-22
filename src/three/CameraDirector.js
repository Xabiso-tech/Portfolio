/* ==========================================================
   TECH'STAMENT — THE CAMERA DIRECTOR

   The camera is never driven directly by the application. It is
   driven by named shots, each of which is a point to look at, a
   direction to look from, and the points that have to fit inside
   the frame. Moving between two shots is a single eased tween of
   both the position and the look-at point, which is what makes the
   camera feel like one continuous piece of photography rather than
   a series of cuts.

   Shots
   -----
     cover     close over the closed cover, the lettering legible
     reveal    pulled back, the whole book on the wooden table
     opening   following the cover as it swings open
     spread    looking down on the open spread, ready to read

   FRAMING
   -------
   The open book is more than twice as wide as the closed one, and
   a phone is a fraction of the width of a desktop. Rather than
   hand-tuning a position for every shape of screen, each shot
   declares the points it must contain and the camera works out
   how far back it has to stand for them to fit. The framing is
   recalculated whenever the window changes shape.

   The maths
   ---------
   Moving a point into normalised device coordinates is a matrix
   multiplication, but the distance that puts the point at a given
   size on screen is not a simple inverse of that: the projection
   is not linear in the distance. The distance is therefore found
   by iteration — measure how far the points reach, step back by
   the difference, and measure again. Two dozen passes are always
   enough, and they cost microseconds.
   ========================================================== */

import * as THREE from 'three';
import { gsap } from 'gsap';

export class CameraDirector {
  constructor(camera) {
    this.camera = camera;
    this.shots = new Map();

    /* The live position and look-at point. Everything is tweened
       through this object so the camera never jumps. */
    this.state = {
      px: 0, py: 0, pz: 0,
      tx: 0, ty: 0, tz: 0,
    };

    this.tween = null;
    this.idle = true;
    this.currentShot = null;
    this._scratch = new THREE.Vector3();
  }

  /**
   * Register a named shot.
   *
   * @param {string} name
   * @param {object} shot
   * @param {THREE.Vector3} shot.target the point the camera looks at
   * @param {THREE.Vector3} shot.direction the direction it looks from
   * @param {THREE.Vector3[]} shot.points the points that must fit
   * @param {number} [shot.fill] how much of the frame to fill
   */
  addShot(name, shot) {
    this.shots.set(name, {
      fill: 0.9,
      ...shot,
      target: shot.target.clone(),
      direction: shot.direction.clone().normalize(),
      points: shot.points.map((point) => point.clone()),
    });
    return this;
  }

  /**
   * Work out how far back the camera has to stand for a shot's
   * points to sit inside the frame.
   *
   * @param {object} shot
   * @returns {{position: THREE.Vector3, target: THREE.Vector3, distance: number}}
   */
  solve(shot) {
    const { target, direction, points, fill } = shot;

    let distance = 6;

    for (let pass = 0; pass < 24; pass += 1) {
      this.camera.position.copy(target).addScaledVector(direction, distance);
      this.camera.lookAt(target);
      this.camera.updateMatrixWorld();
      this.camera.updateProjectionMatrix();

      let reach = 0;

      for (const point of points) {
        this._scratch.copy(point).project(this.camera);
        reach = Math.max(reach, Math.abs(this._scratch.x), Math.abs(this._scratch.y));
      }

      if (reach < 1e-4) break;

      const step = reach / fill;
      distance *= 1 + (step - 1) * 0.85;

      if (Math.abs(step - 1) < 0.002) break;
    }

    return {
      position: target.clone().addScaledVector(direction, distance),
      target: target.clone(),
      distance,
    };
  }

  /**
   * Move to a named shot.
   *
   * @param {string} name
   * @param {number} duration seconds
   * @param {object} [options] gsap options
   * @returns {Promise<void>} resolves when the move has finished
   */
  moveTo(name, duration = 2, options = {}) {
    const shot = this.shots.get(name);
    if (!shot) return Promise.resolve();

    this.currentShot = name;

    const solution = this.solve(shot);

    this.tween?.kill();

    if (duration <= 0) {
      this.apply(solution);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.tween = gsap.to(this.state, {
        px: solution.position.x,
        py: solution.position.y,
        pz: solution.position.z,
        tx: solution.target.x,
        ty: solution.target.y,
        tz: solution.target.z,
        duration,
        ease: 'power2.inOut',
        onComplete: () => {
          /* The window may have changed shape while the camera was
             travelling, so the landing position is checked once
             more before the shot is considered arrived at. */
          this.reframe({ force: true });
          resolve();
        },
        ...options,
      });
    });
  }

  /**
   * Jump straight to a named shot with no transition.
   *
   * @param {string} name
   */
  snap(name) {
    const shot = this.shots.get(name);
    if (!shot) return;

    this.currentShot = name;
    this.tween?.kill();
    this.tween = null;
    this.apply(this.solve(shot));
  }

  /** Copy a solved shot onto the live state. */
  apply(solution) {
    this.state.px = solution.position.x;
    this.state.py = solution.position.y;
    this.state.pz = solution.position.z;
    this.state.tx = solution.target.x;
    this.state.ty = solution.target.y;
    this.state.tz = solution.target.z;
  }

  /**
   * Re-frame the current shot for the present shape of the window.
   * While the camera is travelling the tween is left alone: it will
   * land on a solution computed for the previous aspect, and the
   * next resize will correct it.
   *
   * @param {object} [options]
   * @param {boolean} [options.force] re-frame even mid-tween
   */
  reframe({ force = false } = {}) {
    if (!this.currentShot) return;

    if (!force && this.tween && this.tween.isActive()) return;

    const shot = this.shots.get(this.currentShot);
    if (!shot) return;

    this.apply(this.solve(shot));
  }

  /**
   * Project a world point into CSS pixels within the canvas.
   *
   * @param {THREE.Vector3} point
   * @param {number} width  css pixels
   * @param {number} height css pixels
   */
  screenPoint(point, width, height) {
    const projected = point.clone().project(this.camera);
    return {
      x: (projected.x * 0.5 + 0.5) * width,
      y: (-projected.y * 0.5 + 0.5) * height,
    };
  }

  /**
   * Write the current state onto the camera, adding the slow
   * idle drift that keeps the shot alive.
   */
  update(elapsed) {
    const drift = this.idle ? 0.006 : 0;

    const dx = Math.sin(elapsed * 0.21) * drift;
    const dy = Math.cos(elapsed * 0.17) * drift * 0.6;
    const dz = Math.cos(elapsed * 0.13) * drift;

    this.camera.position.set(
      this.state.px + dx,
      this.state.py + dy,
      this.state.pz + dz
    );

    this._target = this._target || new THREE.Vector3();
    this._target.set(
      this.state.tx + dx * 0.5,
      this.state.ty + dy * 0.5,
      this.state.tz + dz * 0.5
    );

    this.camera.lookAt(this._target);
  }

  dispose() {
    this.tween?.kill();
    this.shots.clear();
  }
}
