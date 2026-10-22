
import * as THREE from 'three';
import { gsap } from 'gsap';

/*
  TECH'STAMENT
  Cinematic Bible — refined introduction

  Darkness → illuminated leather cover →
  camera pullback → physical opening
*/

export class BookScene {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.isAnimating = false;
    this.isDestroyed = false;
    this.timelines = [];

    this.reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#030202');

    this.camera = new THREE.PerspectiveCamera(
      38, 1, 0.1, 100
    );

    // Begin above the leather cover.
    this.camera.position.set(0, 3.5, 0.4);
    this.cameraTarget = new THREE.Vector3(0, 0.3, 0);
    this.camera.lookAt(this.cameraTarget);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    );

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // True darkness at the beginning.
    this.renderer.toneMappingExposure = 0;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.container.appendChild(this.renderer.domElement);

    this.createMaterials();
    this.createLighting();
    this.createTable();

    this.book = new THREE.Group();
    this.scene.add(this.book);

    this.createBook();

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);

    this.resize();
    this.animate();
  }

  createMaterials() {
    const standard = (color, roughness, metalness = 0) =>
      new THREE.MeshStandardMaterial({
        color, roughness, metalness
      });

    this.leather = standard('#451321', 0.88);
    this.leatherEdge = standard('#240a13', 0.92);
    this.raisedLeather = standard('#542032', 0.9);
    this.gold = standard('#d5ae66', 0.27, 0.78);
    this.oldGold = standard('#96703a', 0.42, 0.62);
    this.paper = standard('#ebdbb8', 0.96);
    this.gilding = standard('#bd9856', 0.45, 0.46);
    this.wood = standard('#24130e', 0.88);

    this.ownedMaterials = [
      this.leather,
      this.leatherEdge,
      this.raisedLeather,
      this.gold,
      this.oldGold,
      this.paper,
      this.gilding,
      this.wood
    ];
  }

  createLighting() {
    // Lights remain ready; exposure controls the reveal.
    this.ambient = new THREE.AmbientLight('#ffe0b3', 0.65);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.SpotLight(
      '#ffd5a0',
      115,
      25,
      Math.PI / 3,
      0.65
    );

    this.keyLight.position.set(-3, 8, 4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    this.rimLight = new THREE.PointLight(
      '#d18a50', 24, 15
    );

    this.rimLight.position.set(4, 4, -3);
    this.scene.add(this.rimLight);
  }

  createTable() {
    const table = this.box(
      25, 0.5, 25,
      this.wood,
      0, -0.65, 0
    );

    table.receiveShadow = true;
    this.scene.add(table);
  }

  box(w, h, d, material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  createBook() {
    // Back leather cover.
    this.book.add(
      this.box(
        4.05, 0.14, 5.35,
        this.leather, 0, -0.35, 0
      )
    );

    // Thick gilded page block.
    this.book.add(
      this.box(
        3.72, 0.52, 5.04,
        [
          this.gilding,
          this.gilding,
          this.paper,
          this.paper,
          this.gilding,
          this.gilding
        ],
        0.05, 0, 0
      )
    );

    // Fine page-edge lines.
    for (let i = 0; i < 36; i++) {
      this.book.add(
        this.box(
          0.009, 0.003, 4.98,
          this.oldGold,
          1.918,
          -0.25 + i * 0.014,
          0
        )
      );
    }

    // Spine.
    this.book.add(
      this.box(
        0.33, 0.82, 5.32,
        this.leatherEdge,
        -1.94, 0, 0
      )
    );

    // Raised gold spine bands.
    [-1.95, -0.95, 0.95, 1.95].forEach(z => {
      this.book.add(
        this.box(
          0.35, 0.84, 0.055,
          this.oldGold,
          -1.94, 0, z
        )
      );
    });

    this.createFrontCover();
  }

  createFrontCover() {
    // The hinge rotates the cover and ALL its decorations.
    this.coverHinge = new THREE.Group();
    this.coverHinge.position.set(-1.9, 0.34, 0);
    this.book.add(this.coverHinge);

    this.coverHinge.add(
      this.box(
        4.05, 0.16, 5.35,
        this.leather,
        1.9, 0, 0
      )
    );

    // Raised leather panel.
    this.coverHinge.add(
      this.box(
        3.7, 0.016, 5,
        this.raisedLeather,
        1.9, 0.088, 0
      )
    );

    // Interior lining.
    this.coverHinge.add(
      this.box(
        3.75, 0.012, 5.05,
        this.leatherEdge,
        1.9, -0.087, 0
      )
    );

    this.createCoverFrame();
    this.createCoverCross();
    this.createPermanentCoverText();
  }

  createCoverFrame() {
    const y = 0.11;

    // Outer rectangular frame.
    [-2.28, 2.28].forEach(z => {
      this.coverHinge.add(
        this.box(
          3.28, 0.018, 0.035,
          this.gold, 1.9, y, z
        )
      );
    });

    [0.26, 3.54].forEach(x => {
      this.coverHinge.add(
        this.box(
          0.035, 0.018, 4.56,
          this.gold, x, y, 0
        )
      );
    });

    // Inner decorative frame.
    [-2.12, 2.12].forEach(z => {
      this.coverHinge.add(
        this.box(
          2.95, 0.012, 0.015,
          this.oldGold, 1.9, y, z
        )
      );
    });

    [0.43, 3.37].forEach(x => {
      this.coverHinge.add(
        this.box(
          0.015, 0.012, 4.24,
          this.oldGold, x, y, 0
        )
      );
    });

    // Ornamental corner medallions.
    for (const x of [0.43, 3.37]) {
      for (const z of [-2.12, 2.12]) {
        const ornament = new THREE.Mesh(
          new THREE.TorusGeometry(
            0.11, 0.016, 8, 32
          ),
          this.gold
        );

        ornament.rotation.x = Math.PI / 2;
        ornament.position.set(x, 0.125, z);

        this.coverHinge.add(ornament);
      }
    }
  }

  createCoverCross() {
    const cross = new THREE.Group();

    cross.position.set(1.9, 0.15, 0.3);

    cross.add(
      this.box(
        0.16, 0.045, 1.15,
        this.gold, 0, 0, 0
      )
    );

    cross.add(
      this.box(
        0.83, 0.045, 0.16,
        this.gold, 0, 0, -0.19
      )
    );

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.63, 0.023, 10, 64
      ),
      this.oldGold
    );

    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.025;
    cross.add(ring);

    this.coverHinge.add(cross);
  }

  createPermanentCoverText() {
    /*
      All words are painted onto ONE transparent
      texture attached to the leather cover.

      They never fade independently.
    */

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1536;

    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 1024, 1536);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const gold = '#efd19a';

    const write = (text, y, font, color = gold) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.fillText(text, 512, y, 850);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    };

    // The official title, permanently on the cover.
    write(
      "TECH'STAMENT",
      290,
      'bold 91px Georgia, serif'
    );

    write(
      'CHRIST IN MY JOURNEY THROUGH CODE',
      390,
      'italic 32px Georgia, serif',
      '#d6b67b'
    );

    // Central area deliberately left clear
    // for the raised gold cross.

    write(
      'FAITH  •  PURPOSE  •  CODE',
      1150,
      'bold 34px Georgia, serif'
    );

    write(
      'XABISO PHENDU',
      1260,
      'bold 53px Georgia, serif'
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(
      8,
      this.renderer.capabilities.getMaxAnisotropy()
    );

    const lettering = new THREE.Mesh(
      new THREE.PlaneGeometry(3.55, 5.05),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );

    // Lay the lettering flat on the upper leather face.
    lettering.rotation.x = -Math.PI / 2;
    lettering.position.set(1.9, 0.124, 0);

    this.coverHinge.add(lettering);
  }

  playIntro() {
    if (this.isDestroyed) return Promise.resolve();

    // Set an explicit initial state, including when the scene is replayed.
    this.camera.position.set(0, 3.5, 0.4);
    this.cameraTarget.set(0, 0.3, 0);
    this.book.rotation.y = 0;

    const finalPosition = { x: 0.4, y: 5.15, z: 6.55 };
    const finalTarget = { x: 0, y: 0, z: 0 };

    // Accessibility: avoid a prolonged reveal for reduced-motion visitors.
    if (this.reducedMotion) {
      this.renderer.toneMappingExposure = 1.25;
      this.camera.position.set(
        finalPosition.x,
        finalPosition.y,
        finalPosition.z
      );
      this.cameraTarget.set(
        finalTarget.x,
        finalTarget.y,
        finalTarget.z
      );
      this.book.rotation.y = -0.12;
      return Promise.resolve();
    }

    this.renderer.toneMappingExposure = 0;

    return new Promise(resolve => {
      const timeline = gsap.timeline({ onComplete: resolve });
      this.timelines.push(timeline);

      // 0.0–0.7s: allow the first dark frame to register.
      timeline.to({}, { duration: 0.7 });

      // 0.7–2.5s: reveal the same physical cover with warm light.
      timeline.to(this.renderer, {
        toneMappingExposure: 1.25,
        duration: 1.8,
        ease: 'power2.inOut'
      });

      // 2.5–3.3s: hold so the cover can be read.
      timeline.to({}, { duration: 0.8 });

      // 3.3–6.5s: a single, continuous pullback to the waiting shot.
      timeline.to(this.camera.position, {
        ...finalPosition,
        duration: 3.2,
        ease: 'power2.inOut'
      });

      timeline.to(this.cameraTarget, {
        ...finalTarget,
        duration: 3.2,
        ease: 'power2.inOut'
      }, '<');

      timeline.to(this.book.rotation, {
        y: -0.12,
        duration: 3.2,
        ease: 'power2.inOut'
      }, '<');

      // 6.5–7.0s: the final shot remains still before controls appear.
      timeline.to({}, { duration: 0.5 });
    });
  }

  open() {
    if (
      this.isOpen ||
      this.isAnimating ||
      this.isDestroyed
    ) {
      return Promise.resolve();
    }

    this.isAnimating = true;

    const duration = this.reducedMotion ? 0 : 2.8;

    return new Promise(resolve => {
      const timeline = gsap.timeline({
        onComplete: () => {
          this.isOpen = true;
          this.isAnimating = false;
          resolve();
        }
      });

      this.timelines.push(timeline);

      timeline.to(this.coverHinge.rotation, {
        z: Math.PI - 0.12,
        duration,
        ease: 'power2.inOut'
      });

      timeline.to(
        this.camera.position,
        {
          x: 0,
          y: 7.5,
          z: 5,
          duration: duration * 0.9,
          ease: 'power2.inOut'
        },
        0
      );
    });
  }

  close() {
    if (
      !this.isOpen ||
      this.isAnimating ||
      this.isDestroyed
    ) {
      return Promise.resolve();
    }

    this.isAnimating = true;

    const duration = this.reducedMotion ? 0 : 2;

    return new Promise(resolve => {
      const timeline = gsap.timeline({
        onComplete: () => {
          this.isOpen = false;
          this.isAnimating = false;
          resolve();
        }
      });

      this.timelines.push(timeline);

      timeline.to(this.coverHinge.rotation, {
        z: 0,
        duration,
        ease: 'power2.inOut'
      });
    });
  }

  animate() {
    if (this.isDestroyed) return;

    this.animationFrame = requestAnimationFrame(
      () => this.animate()
    );

    this.camera.lookAt(this.cameraTarget);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (!width || !height) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  destroy() {
    this.isDestroyed = true;

    this.timelines.forEach(timeline => timeline.kill());

    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.onResize);

    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    this.scene.traverse(object => {
      if (object.geometry) {
        geometries.add(object.geometry);
      }

      if (object.material) {
        const list = Array.isArray(object.material)
          ? object.material
          : [object.material];

        list.forEach(material => materials.add(material));
      }
    });

    materials.forEach(material => {
      if (material.map) textures.add(material.map);
      material.dispose();
    });

    geometries.forEach(geometry => geometry.dispose());
    textures.forEach(texture => texture.dispose());

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
