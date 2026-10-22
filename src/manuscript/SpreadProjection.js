/* ==========================================================
   TECH'STAMENT — SPREAD PROJECTION

   The readable manuscript is real HTML, but for the first few
   seconds it has to look as though it is printed on the pages
   of the physical book.

   That is achieved with a homography: a projective transform
   that maps the four corners of the manuscript's design
   rectangle onto the four corners of the open spread as the
   camera sees it. The result is written out as a CSS
   `matrix3d`, which is exactly the kind of transform CSS can
   express.

   The maths
   ---------
   A homography has eight degrees of freedom:

       u = (h0·x + h1·y + h2) / (h6·x + h7·y + 1)
       v = (h3·x + h4·y + h5) / (h6·x + h7·y + 1)

   Four point pairs give eight linear equations, which are
   solved here with plain Gaussian elimination — no library.

   CSS matrix3d is column-major:

       matrix3d(m11, m12, m13, m14,
                m21, m22, m23, m24,
                m31, m32, m33, m34,
                m41, m42, m43, m44)

   and the browser divides by w = m14·x + m24·y + m44, so the
   homography maps onto it directly.
   ========================================================== */

/* ------------------------------------------------------------
   SOLVING
   ------------------------------------------------------------ */

/**
 * Solve the eight unknowns of a homography from four point
 * correspondences.
 *
 * @param {Array<[number, number]>} source four [x, y] points
 * @param {Array<[number, number]>} target four [u, v] points
 * @returns {number[]} the eight parameters
 */
export function solveHomography(source, target) {
  /* Build the 8×8 system. */
  const matrix = [];
  const vector = [];

  for (let i = 0; i < 4; i += 1) {
    const [x, y] = source[i];
    const [u, v] = target[i];

    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    vector.push(u);

    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    vector.push(v);
  }

  return solveLinearSystem(matrix, vector);
}

/** Gaussian elimination with partial pivoting. */
function solveLinearSystem(matrix, vector) {
  const n = vector.length;

  for (let column = 0; column < n; column += 1) {
    /* Find the pivot. */
    let pivot = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) {
        pivot = row;
      }
    }

    if (Math.abs(matrix[pivot][column]) < 1e-12) {
      /* Singular: fall back to an affine transform, which is
         always good enough to keep the page readable. */
      return affineFallback(matrix, vector);
    }

    if (pivot !== column) {
      [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
      [vector[column], vector[pivot]] = [vector[pivot], vector[column]];
    }

    const pivotValue = matrix[column][column];

    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;

      const factor = matrix[row][column] / pivotValue;
      if (factor === 0) continue;

      for (let k = column; k < n; k += 1) {
        matrix[row][k] -= factor * matrix[column][k];
      }
      vector[row] -= factor * vector[column];
    }
  }

  return vector.map((value, index) => value / matrix[index][index]);
}

/** An affine solve used only if the homography is degenerate. */
function affineFallback(matrix, vector) {
  const reduced = [
    matrix[0].slice(0, 6), matrix[1].slice(0, 6), matrix[4].slice(0, 6),
    matrix[5].slice(0, 6),
  ];
  const rhs = [vector[0], vector[1], vector[4], vector[5]];

  const solution = solveLinearSystem(reduced, rhs);
  return [solution[0], solution[1], solution[2], solution[3], solution[4], solution[5], 0, 0];
}

/* ------------------------------------------------------------
   MATRICES
   ------------------------------------------------------------ */

/**
 * Turn the eight homography parameters into a CSS matrix3d.
 *
 * @param {number[]} h
 * @returns {number[]} sixteen matrix3d values
 */
export function homographyToMatrix(h) {
  const [h0, h1, h2, h3, h4, h5, h6, h7] = h;

  return [
    h0, h3, 0, h6,
    h1, h4, 0, h7,
    0, 0, 1, 0,
    h2, h5, 0, 1,
  ];
}

/** A plain scale-and-move matrix, used for the flat reading layout. */
export function affineMatrix(scale, translateX, translateY) {
  return [
    scale, 0, 0, 0,
    0, scale, 0, 0,
    0, 0, 1, 0,
    translateX, translateY, 0, 1,
  ];
}

/** Interpolate between two matrix3d arrays. */
export function lerpMatrix(a, b, t) {
  return a.map((value, index) => value + (b[index] - value) * t);
}

/** Format a matrix3d array as a CSS transform. */
export function matrixToString(matrix) {
  return `matrix3d(${matrix.map((value) => round(value)).join(', ')})`;
}

function round(value) {
  return Math.abs(value) < 1e-6 ? 0 : Math.round(value * 100000) / 100000;
}

/* ------------------------------------------------------------
   THE PUBLIC PIECE
   ------------------------------------------------------------ */

/**
 * Build the transform that lays the manuscript over the open
 * book.
 *
 * @param {Array<{x: number, y: number}>} screenCorners the four
 *        corners of the physical spread, in CSS pixels, ordered
 *        to match the design rectangle:
 *        far-left, far-right, near-right, near-left
 * @param {number} designWidth  the width of the design rectangle
 * @param {number} designHeight the height of the design rectangle
 * @returns {number[]} a matrix3d
 */
export function projectOntoSpread(screenCorners, designWidth, designHeight) {
  /* The design rectangle's corners, in the same order. The first
     two are the far edge (the top of the page as the reader sees
     it), the last two the near edge. */
  const source = [
    [0, 0],
    [designWidth, 0],
    [designWidth, designHeight],
    [0, designHeight],
  ];

  const target = screenCorners.map((corner) => [corner.x, corner.y]);

  const h = solveHomography(source, target);
  return homographyToMatrix(h);
}

/**
 * The transform for the flat, straight-on reading layout: the
 * design rectangle scaled to fit the available area and centred.
 *
 * @param {number} designWidth
 * @param {number} designHeight
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {number} offsetTop space reserved at the top
 */
export function flatLayout(designWidth, designHeight, viewportWidth, viewportHeight, offsetTop = 0) {
  const availableHeight = Math.max(120, viewportHeight - offsetTop);
  const scale = Math.min(
    viewportWidth / designWidth,
    availableHeight / designHeight
  );

  const translateX = (viewportWidth - designWidth * scale) / 2;
  const translateY = offsetTop + (availableHeight - designHeight * scale) / 2;

  return affineMatrix(scale, translateX, translateY);
}
