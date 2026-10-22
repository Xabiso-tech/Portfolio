/* ==========================================================
   TECH'STAMENT — THE PHYSICAL BIBLE

   The book is built from a handful of primitives, but the way
   they are arranged matters a great deal.

   THE GEOMETRY
   ------------
   One world unit is roughly eight centimetres, so the finished
   book is about 21 by 29 centimetres with a six centimetre
   spine — the proportions of a real hardback Bible.

        the spine           the rounded back of the book sits at
                            x = 0 and bulges towards -X.
        the fore-edge       x = BOOK.width
        head and tail      z = -1 and z = +1

   THE HINGE
   ---------
   The front board does not spin on an arbitrary axis. It turns
   about the spine axis, which is the line where the rounded
   spine meets the middle of the block, half way up the thickness
   of the book:

        y = 0.30   (BOOK.hingeY)

   Because the hinge is exactly half the book's thickness, a
   180 degree turn carries the front board down onto the table
   beside the back board — it does not float in the air and it
   does not sink through the wood.

   THE BLOCK
   ---------
   The leaves are modelled as two halves of a real block, joined
   at the fold:

        lower half   stays on the right when the book is opened
        upper half   travels with the front board and lands on
                     the left at exactly the same height

   which is why the open book shows two page surfaces at one
   level, with a gutter between them.

   THE SPINE
   ---------
   The rounded spine is a half cylinder around the hinge axis.
   As the book opens it closes up into a narrow ridge, exactly
   as the spine of a real book collapses, and the ridge becomes
   the gutter of the open spread.
   ========================================================== */

import * as THREE from 'three';
import {
  createLeatherMaps,
  createCoverMaps,
  createPageEdgeMaps,
  createPaperMaps,
} from './textures.js';

/**
 * The dimensions of the book in world units.
 */
export const BOOK = {
  /** From the spine to the fore-edge. */
  width: 1.3333,
  /** From the head to the tail. */
  depth: 2.0,

  /** The thickness of one board. */
  boardThickness: 0.08,
  /** The thickness of one half of the block of leaves. */
  leafThickness: 0.22,

  /** The spine axis: the hinge the front board turns about. */
  hingeY: 0.30,

  /** The radius of the rounded spine. */
  spineRadius: 0.30,

  /** The gap at the gutter when the book is open. */
  gutter: 0.02,
};

/* The height of the reading surface: the top of the block of
   leaves, on both sides of the open book. */
export const PAGE_Y = BOOK.boardThickness + BOOK.leafThickness;

/* The depth of the block of leaves: slightly less than the
   boards, so the page edges sit inside the covers. */
const LEAF_DEPTH = BOOK.depth - 0.08;

export class Bible {
  constructor(renderer) {
    this.renderer = renderer;
    this.group = new THREE.Group();
    this.materials = {};
    this.textures = [];
    this.geometries = [];

    this.openAmount = 0;

    this.createMaterials();
    this.createBook();
    this.createContactShadow();
  }

  /* ---------- materials ---------- */

  createMaterials() {
    const leather = createLeatherMaps({ size: 512, seed: 7 });
    const cover = createCoverMaps({ width: 1200, height: 1760, seed: 21 });
    const pageEdge = createPageEdgeMaps({ width: 256, height: 512 });
    const paper = createPaperMaps({ size: 512, seed: 77, border: false });
    const endpaper = createPaperMaps({ size: 512, seed: 91, border: true });

    this.textures.push(
      ...Object.values(leather),
      ...Object.values(cover),
      ...Object.values(pageEdge),
      ...Object.values(paper),
      ...Object.values(endpaper),
    );

    /* Plain leather for the boards and the spine. */
    this.materials.leather = new THREE.MeshStandardMaterial({
      map: leather.map,
      normalMap: leather.normalMap,
      roughnessMap: leather.ormMap,
      metalnessMap: leather.ormMap,
      roughness: 1,
      metalness: 1,
      normalScale: new THREE.Vector2(0.7, 0.7),
      envMapIntensity: 0.55,
    });

    /* A darker, rougher leather for the inside of the boards. */
    this.materials.lining = new THREE.MeshStandardMaterial({
      map: leather.map,
      normalMap: leather.normalMap,
      roughnessMap: leather.ormMap,
      metalnessMap: leather.ormMap,
      color: new THREE.Color('#7a5a63'),
      roughness: 1,
      metalness: 1,
      envMapIntensity: 0.3,
    });

    /* The gilt front board: leather with real gold leaf on it. */
    this.materials.cover = new THREE.MeshStandardMaterial({
      map: cover.map,
      normalMap: cover.normalMap,
      roughnessMap: cover.ormMap,
      metalnessMap: cover.ormMap,
      roughness: 1,
      metalness: 1,
      normalScale: new THREE.Vector2(0.55, 0.55),
      envMapIntensity: 1.15,
    });

    /* The gilt edge of the block of leaves. */
    this.materials.pageEdge = new THREE.MeshStandardMaterial({
      map: pageEdge.map,
      roughnessMap: pageEdge.ormMap,
      metalnessMap: pageEdge.ormMap,
      roughness: 1,
      metalness: 1,
      envMapIntensity: 0.8,
    });

    /* The leaves themselves. */
    this.materials.paper = new THREE.MeshStandardMaterial({
      map: paper.map,
      roughnessMap: paper.ormMap,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.5,
    });

    /* The endpaper inside the front board. */
    this.materials.endpaper = new THREE.MeshStandardMaterial({
      map: endpaper.map,
      roughnessMap: endpaper.ormMap,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.4,
    });

    /* The spine is seen from the inside as well as the outside, so
       it gets its own double-sided copy rather than making every
       board in the book double-sided. */
    this.materials.spine = this.materials.leather.clone();
    this.materials.spine.side = THREE.DoubleSide;
    this.materials.spine.envMapIntensity = 0.45;
  }

  /* ---------- helpers ---------- */

  track(geometry) {
    this.geometries.push(geometry);
    return geometry;
  }

  mesh(geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /* ---------- the book ---------- */

  createBook() {
    this.book = new THREE.Group();
    this.group.add(this.book);

    this.createBackBoard();
    this.createFrontBoard();
    this.createSpine();
  }

  /** The board that stays on the table, and the lower half of the block. */
  createBackBoard() {
    const { width, depth, boardThickness, leafThickness, gutter } = BOOK;

    const board = this.mesh(
      this.track(new THREE.BoxGeometry(width, boardThickness, depth)),
      this.materials.leather,
    );
    board.position.set(width / 2, boardThickness / 2, 0);
    this.book.add(board);

    /* The lower half of the block of leaves. It never moves: when
       the book is opened these are the pages on the right. */
    const blockWidth = width - gutter * 2;

    const leaves = this.mesh(
      this.track(new THREE.BoxGeometry(blockWidth, leafThickness, LEAF_DEPTH)),
      this.materials.paper,
    );
    leaves.position.set(
      width / 2,
      boardThickness + leafThickness / 2,
      0,
    );
    this.book.add(leaves);

    this.addForeEdge(this.book, leaves.position.y, 0);
  }

  /**
   * The gilt fore-edge of the block of leaves. It is a separate
   * slab so that the stacked-leaf texture can run across the edge
   * of the paper, and it is very slightly uneven, the way the
   * edge of a block of real paper is.
   */
  addForeEdge(parent, centreY, centreZ) {
    const { width, leafThickness, gutter } = BOOK;

    const thickness = 0.055;
    const geometry = this.track(
      new THREE.BoxGeometry(thickness, leafThickness, LEAF_DEPTH, 1, 1, 28),
    );

    /* Push the outer edge in and out by a fraction of a millimetre. */
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      if (x < thickness / 2 - 0.0001) continue;

      const z = position.getZ(i);
      const wobble =
        Math.sin(z * 2.3) * 0.004 + Math.sin(z * 5.7 + 1.1) * 0.002;
      position.setX(i, x + wobble);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();

    const edge = this.mesh(geometry, this.materials.pageEdge);
    edge.position.set(width - gutter - thickness / 2 + 0.005, centreY, centreZ);
    parent.add(edge);

    return edge;
  }

  /**
   * The front board, the upper half of the block of leaves and the
   * gilt face. All three live under one group, which is pinned to
   * the spine axis: that group is what turns when the book opens.
   */
  createFrontBoard() {
    const { width, depth, boardThickness, leafThickness, hingeY, gutter } = BOOK;

    this.hinge = new THREE.Group();
    this.hinge.position.set(0, hingeY, 0);
    this.book.add(this.hinge);

    /* The upper half of the block of leaves. Closed it sits on top
       of the lower half; open it lies on the left, at the same
       height, so both page surfaces are level. */
    const blockWidth = width - gutter * 2;

    const leaves = this.mesh(
      this.track(new THREE.BoxGeometry(blockWidth, leafThickness, LEAF_DEPTH)),
      this.materials.paper,
    );
    leaves.position.set(width / 2, leafThickness / 2, 0);
    this.hinge.add(leaves);

    this.addForeEdge(this.hinge, leafThickness / 2, 0);

    /* The front board. */
    const boardCentreY =
      boardThickness + leafThickness * 2 - hingeY + boardThickness / 2;

    const board = this.mesh(
      this.track(new THREE.BoxGeometry(width, boardThickness, depth)),
      this.materials.leather,
    );
    board.position.set(width / 2, boardCentreY, 0);
    this.hinge.add(board);

    /* The gilt face: a plane sitting on the board. The artwork is
       baked into the cover maps, so the lettering is physically
       part of the leather and cannot drift away from it. */
    const gilt = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(width - 0.08, depth - 0.16)),
      this.materials.cover,
    );
    gilt.rotation.x = -Math.PI / 2;
    gilt.position.set(
      width / 2,
      boardCentreY + boardThickness / 2 + 0.002,
      0,
    );
    gilt.receiveShadow = true;
    this.hinge.add(gilt);

    /* The endpaper on the inside of the board. */
    const endpaper = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(width - 0.1, depth - 0.14)),
      this.materials.endpaper,
    );
    endpaper.rotation.x = Math.PI / 2;
    endpaper.position.set(
      width / 2,
      boardCentreY - boardThickness / 2 - 0.002,
      0,
    );
    endpaper.receiveShadow = true;
    this.hinge.add(endpaper);
  }

  /**
   * The rounded spine. It is a half cylinder around the hinge
   * axis, bulging towards -X, and it closes up into a narrow
   * ridge as the book opens.
   */
  createSpine() {
    const { depth, spineRadius, hingeY } = BOOK;

    /* CylinderGeometry is built around the Y axis; laying it down
       along Z makes the arc read as a section of a rounded spine.
       The theta range covers the half that faces away from the
       fore-edge. */
    const geometry = this.track(
      new THREE.CylinderGeometry(
        spineRadius,
        spineRadius,
        depth + 0.04,
        48,
        1,
        false,
        Math.PI,
        Math.PI,
      ),
    );
    geometry.rotateX(Math.PI / 2);

    const spine = this.mesh(geometry, this.materials.spine);
    spine.position.set(0, hingeY, 0);
    this.book.add(spine);

    this.spine = spine;
  }

  /**
   * The contact shadow: a soft dark patch on the table directly
   * beneath the book. The shadow map handles the directional
   * light, but this guarantees the book never looks like it is
   * hovering, even for the first few frames.
   */
  createContactShadow() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
      size / 2, size / 2, size * 0.05,
      size / 2, size / 2, size * 0.5,
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0.72)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.32)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.textures.push(texture);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });

    this.shadowMaterial = material;

    const plane = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(3.4, 3.6)),
      material,
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(BOOK.width / 2 - 0.08, 0.004, 0);
    plane.renderOrder = -1;
    this.group.add(plane);

    this.contactShadow = plane;
  }

  /* ---------- the opening ---------- */

  /**
   * Open the book.
   *
   * @param {number} amount 0 = closed, 1 = fully open
   */
  setOpen(amount) {
    const a = THREE.MathUtils.clamp(amount, 0, 1);
    this.openAmount = a;

    /* The front board turns about the spine axis. */
    this.hinge.rotation.z = a * Math.PI;

    /* The spine closes up into a gutter. */
    const scale = 1 - 0.82 * a;
    this.spine.scale.set(scale, scale, 1);
  }

  /* ---------- the spread ---------- */

  /**
   * The height of the closed book: the top of the gilt front board.
   * This is the surface the lettering is stamped into.
   *
   * The front board rides on the hinge group, so the closed height is
   * the board thickness plus the whole block of leaves, twice over:
   * once for the lower half of the block and once for the upper half
   * that travels with the board.
   */
  get closedTop() {
    return PAGE_Y * 2 + 0.002;
  }

  /**
   * The four corners of the gilt front board, seen from above.
   *
   * These are the points the camera has to keep inside the frame
   * during the close-up, so that every line of lettering is legible.
   */
  coverCorners() {
    const { width, depth } = BOOK;

    const halfWidth = (width - 0.08) / 2;
    const halfDepth = (depth - 0.16) / 2;
    const centreX = width / 2;
    const y = this.closedTop;

    return [
      new THREE.Vector3(centreX - halfWidth, y, -halfDepth),
      new THREE.Vector3(centreX + halfWidth, y, -halfDepth),
      new THREE.Vector3(centreX + halfWidth, y, halfDepth),
      new THREE.Vector3(centreX - halfWidth, y, halfDepth),
    ];
  }

  /**
   * The eight corners of the closed book: the leather block that
   * sits on the table, spine bulge included.
   */
  bookCorners() {
    const { width, depth, spineRadius } = BOOK;

    const top = this.closedTop;
    const points = [];

    [spineRadius * -1, width].forEach((x) => {
      [0, top].forEach((y) => {
        [-depth / 2, depth / 2].forEach((z) => {
          points.push(new THREE.Vector3(x, y, z));
        });
      });
    });

    return points;
  }

  /**
   * The four corners of the open spread, in the order the design
   * rectangle uses: far-left, far-right, near-right, near-left.
   */
  openCorners() {
    const { width, gutter } = BOOK;
    const half = width - gutter;
    const z = LEAF_DEPTH / 2;

    return [
      new THREE.Vector3(-half, PAGE_Y, -z),
      new THREE.Vector3(half, PAGE_Y, -z),
      new THREE.Vector3(half, PAGE_Y, z),
      new THREE.Vector3(-half, PAGE_Y, z),
    ];
  }

  /**
   * The highest points the front board reaches on its swing through
   * the air. The camera has to be far enough back to keep them in
   * frame while the cover is standing on end.
   */
  swingApex() {
    const { width, depth, hingeY } = BOOK;

    const radius = Math.hypot(width - 0.04, this.closedTop - hingeY);
    const z = (depth - 0.16) / 2;

    return [
      new THREE.Vector3(0, hingeY + radius, -z),
      new THREE.Vector3(0, hingeY + radius, z),
    ];
  }

  /**
   * The four world corners of the open spread, ordered to match
   * the design rectangle of the manuscript:
   *
   *   far-left, far-right, near-right, near-left
   *
   * "Far" is the end of the book away from the reader.
   */
  spreadQuad() {
    return this.openCorners();
  }

  /**
   * The four world corners of the right-hand page alone, which is
   * what a phone shows.
   */
  pageQuad() {
    const { width, gutter } = BOOK;
    const half = width - gutter;
    const z = LEAF_DEPTH / 2;

    return [
      new THREE.Vector3(gutter, PAGE_Y, -z),
      new THREE.Vector3(half, PAGE_Y, -z),
      new THREE.Vector3(half, PAGE_Y, z),
      new THREE.Vector3(gutter, PAGE_Y, z),
    ];
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.textures.forEach((texture) => texture.dispose());
    Object.values(this.materials).forEach((material) => material.dispose());
    this.shadowMaterial?.dispose();
  }
}
