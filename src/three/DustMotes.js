/* ==========================================================
   TECH'STAMENT — DUST IN THE LIGHT

   A slow drift of motes in the lamp's beam. They are the only
   thing in the room that moves while the visitor is deciding
   what to do, which stops the scene from feeling frozen.

   The particles are plain points on a small, slow orbit; there
   is no physics, and the whole system is skipped entirely when
   the visitor has asked for reduced motion.
   ========================================================== */

import * as THREE from 'three';

const COUNT = 420;

export class DustMotes {
  constructor(scene) {
    this.scene = scene;

    /* A soft round sprite, drawn once into a canvas. */
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,238,208,1)');
    gradient.addColorStop(0.35, 'rgba(255,226,180,0.55)');
    gradient.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const sprite = new THREE.CanvasTexture(canvas);
    sprite.colorSpace = THREE.SRGBColorSpace;

    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 1] = Math.random() * 3.4 + 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5.0;
      speeds[i] = 0.035 + Math.random() * 0.085;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      map: sprite,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);

    this.speeds = speeds;
    this.phases = phases;
    this.time = 0;
    this.sprite = sprite;
  }

  /** Advance the drift. */
  update(delta) {
    this.time += delta;

    const position = this.points.geometry.attributes.position;
    const array = position.array;

    for (let i = 0; i < COUNT; i += 1) {
      const index = i * 3;

      array[index + 1] += this.speeds[i] * delta;

      if (array[index + 1] > 3.6) {
        array[index + 1] = 0.05;
        array[index] = (Math.random() - 0.5) * 6.5;
        array[index + 2] = (Math.random() - 0.5) * 5.0;
      }

      /* A lazy horizontal sway. */
      const sway = Math.sin(this.time * 0.35 + this.phases[i]) * 0.0035;
      array[index] += sway;
      array[index + 2] += Math.cos(this.time * 0.28 + this.phases[i]) * 0.003;
    }

    position.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    this.material.dispose();
    this.sprite.dispose();
  }
}
