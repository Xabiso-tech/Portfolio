/* ==============================================================
   TECH'STAMENT — PROCEDURAL TEXTURE FOUNDRY

   Everything the Bible is made of is generated at runtime on a
   2D canvas. Nothing is downloaded, so the site has no image
   payload to wait for and no licensing questions.

   The module produces three kinds of map for every material:

     map        the albedo (base colour), stored as sRGB
     normalMap  the surface relief, derived from a height field
     ormMap     a packed texture:
                  R = ambient occlusion (unused for now)
                  G = roughness
                  B = metalness

   Three.js reads roughness from the green channel and metalness
   from the blue channel, so one packed map can drive both. That
   is what lets the gilt lettering on the cover behave like real
   metal while the leather around it stays matte.

   All three maps for one surface are painted from the same
   drawing routine, so they always line up pixel for pixel.
   ============================================================== */

import * as THREE from 'three';

/* ---------- small helpers ---------- */

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Deterministic pseudo random number generator.
 * A fixed seed keeps the leather grain identical on every load,
 * which matters because the cover art is part of the brand.
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds a 64x64 lattice of random values. Octaves are sampled
 * from this single lattice with a stride, which keeps the noise
 * seamlessly tileable no matter how many octaves are stacked.
 */
function makeLattice(size, seed) {
  const random = mulberry32(seed);
  const lattice = new Float32Array(size * size);
  for (let i = 0; i < lattice.length; i += 1) lattice[i] = random();
  return lattice;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Tileable value noise. `u` and `v` are in the 0..1 range.
 */
function valueNoise(lattice, latticeSize, u, v, frequency) {
  const stride = latticeSize / frequency;
  const x = u * frequency;
  const y = v * frequency;

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smoothstep(x - x0);
  const fy = smoothstep(y - y0);

  const ix0 = ((x0 % frequency) + frequency) % frequency;
  const iy0 = ((y0 % frequency) + frequency) % frequency;
  const ix1 = (ix0 + 1) % frequency;
  const iy1 = (iy0 + 1) % frequency;

  const gx = (ix) => Math.floor((ix * stride) % latticeSize);
  const gy = (iy) => Math.floor((iy * stride) % latticeSize);

  const a = lattice[gy(iy0) * latticeSize + gx(ix0)];
  const b = lattice[gy(iy0) * latticeSize + gx(ix1)];
  const c = lattice[gy(iy1) * latticeSize + gx(ix0)];
  const d = lattice[gy(iy1) * latticeSize + gx(ix1)];

  const top = a + (b - a) * fx;
  const bottom = c + (d - c) * fx;

  return top + (bottom - top) * fy;
}

/**
 * Fractal brownian motion height field, normalised to 0..1.
 * Used for leather grain, wood grain and paper fibre.
 */
export function fbmField(width, height, options = {}) {
  const {
    seed = 1,
    octaves = 5,
    frequency = 4,
    gain = 0.5,
    lacunarity = 2,
    latticeSize = 64,
  } = options;

  const lattice = makeLattice(latticeSize, seed);
  const field = new Float32Array(width * height);

  let amplitude = 1;
  let total = 0;
  let currentFrequency = frequency;

  for (let octave = 0; octave < octaves; octave += 1) {
    const clampedFrequency = Math.min(currentFrequency, latticeSize);
    for (let y = 0; y < height; y += 1) {
      const v = y / height;
      for (let x = 0; x < width; x += 1) {
        const u = x / width;
        field[y * width + x] +=
          valueNoise(lattice, latticeSize, u, v, clampedFrequency) * amplitude;
      }
    }
    total += amplitude;
    amplitude *= gain;
    currentFrequency *= lacunarity;
  }

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < field.length; i += 1) {
    if (field[i] < min) min = field[i];
    if (field[i] > max) max = field[i];
  }
  const span = max - min || 1;
  for (let i = 0; i < field.length; i += 1) field[i] = (field[i] - min) / span;

  return field;
}

/**
 * Converts a height field into a tangent space normal map.
 * The Sobel style gradient gives a believable soft relief.
 */
function normalMapFromHeight(height, width, heightIn, strength) {
  const canvas = createCanvas(width, heightIn);
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, heightIn);
  const data = image.data;

  const at = (x, y) => {
    const cx = (x + width) % width;
    const cy = (y + heightIn) % heightIn;
    return height[cy * width + cx];
  };

  for (let y = 0; y < heightIn; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx =
        (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
          at(x + 1, y - 1) - 2 * at(x + 1, y) - at(x + 1, y + 1)) * strength;

      const dy =
        (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
          at(x - 1, y + 1) - 2 * at(x, y + 1) - at(x + 1, y + 1)) * strength;

      const length = Math.sqrt(dx * dx + dy * dy + 1);
      const index = (y * width + x) * 4;

      data[index] = ((dx / length) * 0.5 + 0.5) * 255;
      data[index + 1] = ((dy / length) * 0.5 + 0.5) * 255;
      data[index + 2] = (1 / length) * 0.5 * 255 + 127.5;
      data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Reads a canvas back as a height field, using the red channel.
 * This is how the relief of the gilt lettering is recovered from the
 * artwork that was stamped into the height map.
 */
function heightFieldFromCanvas(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const context = canvas.getContext('2d');
  const data = context.getImageData(0, 0, width, height).data;

  const field = new Float32Array(width * height);
  for (let i = 0; i < field.length; i += 1) {
    field[i] = data[i * 4] / 255;
  }

  return field;
}

/** Writes a float field into a canvas as greyscale. */
function fieldToCanvas(field, width, height, tint) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);
  const data = image.data;

  for (let i = 0; i < field.length; i += 1) {
    const value = field[i] * 255;
    const index = i * 4;
    data[index] = value * (tint ? tint[0] : 1);
    data[index + 1] = value * (tint ? tint[1] : 1);
    data[index + 2] = value * (tint ? tint[2] : 1);
    data[index + 3] = 255;
  }

  context.putImageData(image, 0, 0);
  return canvas;
}

/* ---------- texture helpers ---------- */

function configureTexture(texture, { srgb = false, repeat = null, anisotropy = 8 } = {}) {
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  if (repeat) texture.repeat.set(repeat[0], repeat[1]);

  texture.needsUpdate = true;
  return texture;
}

/**
 * Packs roughness and metalness into one canvas.
 * `elements` is a list of rectangles painted with a given
 * roughness / metalness pair over a default.
 */
function packOrm(width, height, defaultRoughness, defaultMetalness) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  const paint = (r, g, b) => {
    context.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  };

  paint(1, defaultRoughness, defaultMetalness);
  context.fillRect(0, 0, width, height);

  return { canvas, context, paint };
}

/* ==============================================================
   LEATHER
   ============================================================== */

/**
 * Burgundy leather for the spine, the boards that are not the
 * gilt one, and the inner linings. The colour is mottled with
 * two noise octaves so the surface never reads as flat vinyl.
 */
export function createLeatherMaps(options = {}) {
  const {
    size = 512,
    seed = 7,
    base = '#431726',
    dark = '#2a0d16',
    light = '#5d2434',
    roughness = 0.86,
    repeat = [1, 1],
  } = options;

  const grain = fbmField(size, size, {
    seed,
    octaves: 6,
    frequency: 8,
    gain: 0.55,
  });

  const colourCanvas = createCanvas(size, size);
  const colourContext = colourCanvas.getContext('2d');
  colourContext.fillStyle = base;
  colourContext.fillRect(0, 0, size, size);

  const grainCanvas = fieldToCanvas(grain, size, size);
  colourContext.globalAlpha = 0.55;
  colourContext.globalCompositeOperation = 'overlay';
  colourContext.drawImage(grainCanvas, 0, 0);
  colourContext.globalAlpha = 1;
  colourContext.globalCompositeOperation = 'source-over';

  // A soft warm bloom towards the top left keeps the leather from
  // looking like it was lit by a single flat source.
  const bloom = colourContext.createRadialGradient(
    size * 0.32, size * 0.28, size * 0.05,
    size * 0.32, size * 0.28, size * 0.85
  );
  bloom.addColorStop(0, `${light}66`);
  bloom.addColorStop(1, `${dark}00`);
  colourContext.fillStyle = bloom;
  colourContext.fillRect(0, 0, size, size);

  const orm = packOrm(size, size, roughness, 0);
  orm.context.globalAlpha = 0.55;
  orm.context.drawImage(grainCanvas, 0, 0);
  orm.context.globalAlpha = 1;

  const normalCanvas = normalMapFromHeight(grain, size, size, 2.4);

  return {
    map: configureTexture(new THREE.CanvasTexture(colourCanvas), { srgb: true, repeat }),
    normalMap: configureTexture(new THREE.CanvasTexture(normalCanvas), { repeat }),
    ormMap: configureTexture(new THREE.CanvasTexture(orm.canvas), { repeat }),
  };
}

/* ==============================================================
   THE GILT COVER
   ============================================================== */

/**
 * Draws a line of text with manual letter spacing.
 *
 * Canvas `letterSpacing` is still unevenly supported, and the
 * title needs to be exact, so the characters are placed by hand.
 * If the line would run past `maxWidth` the type is reduced until
 * it fits, which keeps the cover lettering inside its frame at
 * every canvas size.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {string} text
 * @param {number} centreX
 * @param {number} y baseline
 * @param {number} tracking extra space between letters, in pixels
 * @param {object} font {weight, style, size, family}
 * @param {number} maxWidth the widest the line may be
 */
function drawTrackedText(context, text, centreX, y, tracking, font, maxWidth) {
  const characters = [...text];

  const applyFont = (size) => {
    context.font = `${font.style || 'normal'} ${font.weight || 400} ${Math.round(size)}px ${font.family}`;
  };

  applyFont(font.size);

  /* Measure, and shrink the type if the line is too wide. */
  let widths = characters.map((character) => context.measureText(character).width);
  let total =
    widths.reduce((sum, width) => sum + width, 0) +
    tracking * Math.max(0, characters.length - 1);

  if (maxWidth && total > maxWidth) {
    const scale = maxWidth / total;
    applyFont(font.size * scale);
    tracking *= scale;
    widths = characters.map((character) => context.measureText(character).width);
    total =
      widths.reduce((sum, width) => sum + width, 0) +
      tracking * Math.max(0, characters.length - 1);
  }

  let x = centreX - total / 2;
  const previousAlign = context.textAlign;
  context.textAlign = 'left';

  characters.forEach((character, index) => {
    context.fillText(character, x, y);
    x += widths[index] + tracking;
  });

  context.textAlign = previousAlign;
}

/** The typefaces used on the cover. */
const COVER_FONTS = {
  display: 'Cinzel, "Times New Roman", serif',
  literary: '"Cormorant Garamond", Georgia, serif',
  ui: 'Inter, "Segoe UI", sans-serif',
};

/**
 * The gold artwork of the front board. It is painted three times:
 * once into the colour map, once into the height map and once
 * into the packed roughness/metalness map. Because the same
 * routine draws all three, the gilding is always perfectly
 * registered with its own relief.
 *
 * The layout is written in proportions of the canvas, so the same
 * drawing reads correctly whatever resolution it is painted at.
 */
function drawGiltArtwork(context, width, height) {
  const centreX = width / 2;

  /* --- ornamental frame --- */

  const outerInset = width * 0.055;
  const innerInset = width * 0.082;

  context.lineWidth = Math.max(2, width * 0.004);
  context.strokeRect(outerInset, outerInset, width - outerInset * 2, height - outerInset * 2);

  context.lineWidth = Math.max(1, width * 0.0016);
  context.strokeRect(innerInset, innerInset, width - innerInset * 2, height - innerInset * 2);

  /* --- corner flourishes --- */

  const corner = (x, y, flipX, flipY) => {
    context.save();
    context.translate(x, y);
    context.scale(flipX, flipY);
    context.lineWidth = Math.max(1, width * 0.0022);
    context.beginPath();
    context.moveTo(0, width * 0.11);
    context.quadraticCurveTo(0, 0, width * 0.11, 0);
    context.stroke();
    context.beginPath();
    context.arc(width * 0.045, width * 0.045, width * 0.014, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  };

  corner(outerInset, outerInset, 1, 1);
  corner(width - outerInset, outerInset, -1, 1);
  corner(outerInset, height - outerInset, 1, -1);
  corner(width - outerInset, height - outerInset, -1, -1);

  /* --- the title --- */

  context.textAlign = 'center';
  context.textBaseline = 'middle';

  drawTrackedText(
    context,
    "TECH'STAMENT",
    centreX,
    height * 0.16,
    width * 0.006,
    { weight: 700, size: width * 0.105, family: COVER_FONTS.display },
    width * 0.86
  );

  /* --- rule beneath the title --- */

  const ruleY = height * 0.215;
  context.lineWidth = Math.max(1, width * 0.0018);
  context.beginPath();
  context.moveTo(centreX - width * 0.22, ruleY);
  context.lineTo(centreX - width * 0.032, ruleY);
  context.moveTo(centreX + width * 0.032, ruleY);
  context.lineTo(centreX + width * 0.22, ruleY);
  context.stroke();

  // Small diamond at the centre of the rule.
  context.beginPath();
  context.moveTo(centreX, ruleY - width * 0.012);
  context.lineTo(centreX + width * 0.012, ruleY);
  context.lineTo(centreX, ruleY + width * 0.012);
  context.lineTo(centreX - width * 0.012, ruleY);
  context.closePath();
  context.fill();

  /* --- the creative subtitle --- */

  drawTrackedText(
    context,
    'CHRIST IN MY JOURNEY THROUGH CODE',
    centreX,
    height * 0.248,
    width * 0.005,
    { style: 'italic', weight: 400, size: width * 0.031, family: COVER_FONTS.literary },
    width * 0.84
  );

  /* --- the cross --- */

  const crossCentreY = height * 0.45;
  const crossHeight = height * 0.21;
  const crossWidth = width * 0.056;
  const armWidth = crossHeight * 0.29;
  const crossTop = crossCentreY - crossHeight / 2;
  const crossBottom = crossCentreY + crossHeight / 2;

  // Celestial ring around the cross.
  context.lineWidth = Math.max(1, width * 0.0026);
  context.beginPath();
  context.arc(centreX, crossCentreY, crossHeight * 0.66, 0, Math.PI * 2);
  context.stroke();

  context.lineWidth = Math.max(1, width * 0.0013);
  context.beginPath();
  context.arc(centreX, crossCentreY, crossHeight * 0.71, 0, Math.PI * 2);
  context.stroke();

  // The cross itself, drawn as a single path so the gilding is
  // one continuous shape rather than two overlapping bars.
  context.beginPath();
  context.moveTo(centreX - crossWidth / 2, crossTop);
  context.lineTo(centreX + crossWidth / 2, crossTop);
  context.lineTo(centreX + crossWidth / 2, crossCentreY - armWidth / 2);
  context.lineTo(centreX + crossHeight * 0.19, crossCentreY - armWidth / 2);
  context.lineTo(centreX + crossHeight * 0.19, crossCentreY + armWidth / 2);
  context.lineTo(centreX + crossWidth / 2, crossCentreY + armWidth / 2);
  context.lineTo(centreX + crossWidth / 2, crossBottom);
  context.lineTo(centreX - crossWidth / 2, crossBottom);
  context.lineTo(centreX - crossWidth / 2, crossCentreY + armWidth / 2);
  context.lineTo(centreX - crossHeight * 0.19, crossCentreY + armWidth / 2);
  context.lineTo(centreX - crossHeight * 0.19, crossCentreY - armWidth / 2);
  context.lineTo(centreX - crossWidth / 2, crossCentreY - armWidth / 2);
  context.closePath();
  context.fill();

  /* --- the pillars --- */

  drawTrackedText(
    context,
    'FAITH  •  PURPOSE  •  CODE',
    centreX,
    height * 0.775,
    width * 0.012,
    { weight: 600, size: width * 0.031, family: COVER_FONTS.display },
    width * 0.8
  );

  /* --- the author --- */

  drawTrackedText(
    context,
    'XABISO PHENDU',
    centreX,
    height * 0.838,
    width * 0.016,
    { weight: 600, size: width * 0.044, family: COVER_FONTS.display },
    width * 0.8
  );

  drawTrackedText(
    context,
    'CAPE TOWN · SOUTH AFRICA',
    centreX,
    height * 0.888,
    width * 0.01,
    { weight: 400, size: width * 0.021, family: COVER_FONTS.ui },
    width * 0.7
  );
}

/**
 * Builds the complete material set for the gilt front board:
 * burgundy leather with real gold leaf on top of it.
 *
 * The canvas is portrait and in the same proportion as the board
 * it is painted on, so the lettering is never stretched.
 */
export function createCoverMaps(options = {}) {
  const { width = 1200, height = 1760, seed = 21 } = options;

  const grainWidth = 600;
  const grainHeight = 880;
  const grain = fbmField(grainWidth, grainHeight, {
    seed,
    octaves: 6,
    frequency: 10,
    gain: 0.55,
  });

  /* --- colour --- */

  const colourCanvas = createCanvas(width, height);
  const colourContext = colourCanvas.getContext('2d');

  colourContext.fillStyle = '#3d1420';
  colourContext.fillRect(0, 0, width, height);

  const grainCanvas = fieldToCanvas(grain, grainWidth, grainHeight);
  colourContext.globalAlpha = 0.6;
  colourContext.globalCompositeOperation = 'overlay';
  colourContext.drawImage(grainCanvas, 0, 0, width, height);
  colourContext.globalAlpha = 1;
  colourContext.globalCompositeOperation = 'source-over';

  // Deep shading towards the edges so the board looks domed.
  const vignette = colourContext.createRadialGradient(
    width * 0.5, height * 0.46, width * 0.18,
    width * 0.5, height * 0.5, height * 0.78
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(12,3,7,0.55)');
  colourContext.fillStyle = vignette;
  colourContext.fillRect(0, 0, width, height);

  /* --- gilt, with a stamped shadow and a highlight --- */

  colourContext.save();
  colourContext.translate(width * 0.004, height * 0.0035);
  colourContext.fillStyle = 'rgba(18,4,9,0.75)';
  colourContext.strokeStyle = 'rgba(18,4,9,0.75)';
  drawGiltArtwork(colourContext, width, height);
  colourContext.restore();

  colourContext.save();
  colourContext.translate(-width * 0.0025, -height * 0.0025);
  colourContext.fillStyle = 'rgba(255,226,168,0.30)';
  colourContext.strokeStyle = 'rgba(255,226,168,0.30)';
  drawGiltArtwork(colourContext, width, height);
  colourContext.restore();

  const goldGradient = colourContext.createLinearGradient(
    0, height * 0.08, width, height * 0.9
  );
  goldGradient.addColorStop(0, '#e8cd92');
  goldGradient.addColorStop(0.28, '#c8a25a');
  goldGradient.addColorStop(0.52, '#f0dcaa');
  goldGradient.addColorStop(0.74, '#b98f4c');
  goldGradient.addColorStop(1, '#d9bb7d');

  colourContext.fillStyle = goldGradient;
  colourContext.strokeStyle = goldGradient;
  drawGiltArtwork(colourContext, width, height);

  /* --- height --- */
  /* The relief is painted at half the colour resolution: it only has to
     carry the shape of the gilding, not the grain of the leather, and
     halving it keeps the normal-map pass fast enough to run while the
     loader is still showing. */

  const heightCanvas = createCanvas(grainWidth, grainHeight);
  const heightContext = heightCanvas.getContext('2d');
  heightContext.fillStyle = '#808080';
  heightContext.fillRect(0, 0, grainWidth, grainHeight);
  heightContext.globalAlpha = 0.55;
  heightContext.drawImage(grainCanvas, 0, 0);
  heightContext.globalAlpha = 1;
  heightContext.fillStyle = '#ffffff';
  heightContext.strokeStyle = '#ffffff';
  drawGiltArtwork(heightContext, grainWidth, grainHeight);

  /* The normal map is derived from the artwork itself, so the gilding
     catches the light exactly where it was stamped. */
  const normalCanvas = normalMapFromHeight(
    heightFieldFromCanvas(heightCanvas),
    grainWidth,
    grainHeight,
    1.6,
  );

  /* --- packed roughness / metalness --- */

  const orm = packOrm(grainWidth, grainHeight, 0.84, 0.0);
  orm.context.globalAlpha = 0.4;
  orm.context.drawImage(grainCanvas, 0, 0);
  orm.context.globalAlpha = 1;
  // The gilt is metal: low roughness, full metalness.
  orm.context.fillStyle = 'rgb(255, 70, 255)';
  orm.context.strokeStyle = 'rgb(255, 70, 255)';
  drawGiltArtwork(orm.context, grainWidth, grainHeight);

  return {
    map: configureTexture(new THREE.CanvasTexture(colourCanvas), { srgb: true, anisotropy: 16 }),
    normalMap: configureTexture(new THREE.CanvasTexture(normalCanvas), { anisotropy: 8 }),
    ormMap: configureTexture(new THREE.CanvasTexture(orm.canvas), { anisotropy: 8 }),
  };
}

/* ==============================================================
   WOOD
   ============================================================== */

/**
 * The table. Dark stained oak with long grain lines running
 * along the length of the book.
 */
export function createWoodMaps(options = {}) {
  const { size = 1024, seed = 33 } = options;

  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d');

  context.fillStyle = '#2a1810';
  context.fillRect(0, 0, size, size);

  const fibre = fbmField(size, size, {
    seed,
    octaves: 5,
    frequency: 3,
    gain: 0.5,
  });

  const fibreCanvas = fieldToCanvas(fibre, size, size);
  context.globalAlpha = 0.45;
  context.globalCompositeOperation = 'overlay';
  context.drawImage(fibreCanvas, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';

  // Grain lines: long horizontal strokes with a little wander.
  const random = mulberry32(seed + 5);
  for (let i = 0; i < 140; i += 1) {
    const y = random() * size;
    const thickness = 0.6 + random() * 2.4;
    const wobble = 6 + random() * 22;

    context.strokeStyle = `rgba(${12 + random() * 26}, ${6 + random() * 14}, ${3 + random() * 8}, ${0.18 + random() * 0.3})`;
    context.lineWidth = thickness;
    context.beginPath();
    context.moveTo(-20, y);
    for (let x = 0; x <= size + 20; x += 64) {
      context.lineTo(x, y + Math.sin((x / size) * Math.PI * 2 + i) * wobble * 0.1);
    }
    context.stroke();
  }

  const orm = packOrm(size, size, 0.82, 0.0);
  orm.context.globalAlpha = 0.35;
  orm.context.drawImage(fibreCanvas, 0, 0);
  orm.context.globalAlpha = 1;

  const normalCanvas = normalMapFromHeight(fibre, size, size, 1.1);

  return {
    map: configureTexture(new THREE.CanvasTexture(canvas), {
      srgb: true,
      repeat: [3, 3],
      anisotropy: 8,
    }),
    normalMap: configureTexture(new THREE.CanvasTexture(normalCanvas), { repeat: [3, 3] }),
    ormMap: configureTexture(new THREE.CanvasTexture(orm.canvas), { repeat: [3, 3] }),
  };
}

/* ==============================================================
   PAPER
   ============================================================== */

/**
 * The fore edge of the page block: warm ivory paper with the
 * fine striations of individual leaves and a gilded outer edge.
 */
export function createPageEdgeMaps(options = {}) {
  const { width = 256, height = 512, seed = 51 } = options;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.fillStyle = '#e6d6b4';
  context.fillRect(0, 0, width, height);

  const random = mulberry32(seed);
  for (let y = 0; y < height; y += 1) {
    const shade = 0.5 + random() * 0.5;
    context.fillStyle = `rgba(${Math.round(150 * shade)}, ${Math.round(126 * shade)}, ${Math.round(88 * shade)}, ${0.05 + random() * 0.16})`;
    context.fillRect(0, y, width, 1);
  }

  // Gilding along the outer edge of the block.
  const gild = context.createLinearGradient(0, 0, width, 0);
  gild.addColorStop(0, 'rgba(176,138,74,0)');
  gild.addColorStop(0.62, 'rgba(176,138,74,0.25)');
  gild.addColorStop(1, 'rgba(212,176,106,0.85)');
  context.fillStyle = gild;
  context.fillRect(0, 0, width, height);

  const orm = packOrm(width, height, 0.9, 0.0);
  orm.context.fillStyle = 'rgb(255, 90, 200)';
  orm.context.fillRect(width * 0.72, 0, width * 0.28, height);

  return {
    map: configureTexture(new THREE.CanvasTexture(canvas), { srgb: true, anisotropy: 8 }),
    ormMap: configureTexture(new THREE.CanvasTexture(orm.canvas), { anisotropy: 8 }),
  };
}

/**
 * The top of the page block and the endpaper inside the front
 * board: aged ivory with a faint foxing and a soft border.
 */
export function createPaperMaps(options = {}) {
  const { size = 512, seed = 77, tint = '#efe2c2', border = true } = options;

  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d');

  context.fillStyle = tint;
  context.fillRect(0, 0, size, size);

  const fibre = fbmField(size, size, { seed, octaves: 5, frequency: 6, gain: 0.55 });
  const fibreCanvas = fieldToCanvas(fibre, size, size);
  context.globalAlpha = 0.28;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(fibreCanvas, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';

  const random = mulberry32(seed + 3);
  for (let i = 0; i < 90; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 2 + random() * 16;
    context.fillStyle = `rgba(158,118,64,${0.02 + random() * 0.05})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  if (border) {
    context.strokeStyle = 'rgba(160,124,63,0.35)';
    context.lineWidth = Math.max(1, size * 0.006);
    context.strokeRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88);
  }

  const orm = packOrm(size, size, 0.94, 0.0);

  return {
    map: configureTexture(new THREE.CanvasTexture(canvas), { srgb: true, anisotropy: 8 }),
    ormMap: configureTexture(new THREE.CanvasTexture(orm.canvas), { anisotropy: 8 }),
  };
}

/**
 * The room as an environment map.
 *
 * Gold only looks like gold when it has something to reflect. This
 * paints a very small picture of the room — a warm lamp high on one
 * side, a cool bounce on the other, and darkness everywhere else —
 * and hands it to the renderer as a pre-filtered environment, so the
 * gilt on the cover catches a highlight instead of reading as flat
 * yellow paint.
 *
 * @param {THREE.WebGLRenderer} renderer
 * @returns {THREE.WebGLRenderTarget} the pre-filtered environment
 */
export function createEnvironment(renderer) {
  const width = 512;
  const height = 256;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  const room = context.createLinearGradient(0, 0, 0, height);
  room.addColorStop(0, '#2b1d15');
  room.addColorStop(0.42, '#150e0b');
  room.addColorStop(0.72, '#0a0605');
  room.addColorStop(1, '#050303');
  context.fillStyle = room;
  context.fillRect(0, 0, width, height);

  /* The lamp: high, warm, and to the left. */
  const lamp = context.createRadialGradient(
    width * 0.26, height * 0.14, 2,
    width * 0.26, height * 0.14, width * 0.19,
  );
  lamp.addColorStop(0, 'rgba(255,246,224,1)');
  lamp.addColorStop(0.28, 'rgba(255,214,152,0.6)');
  lamp.addColorStop(1, 'rgba(255,196,124,0)');
  context.fillStyle = lamp;
  context.fillRect(0, 0, width, height);

  /* A dim, cooler bounce from the far side of the room. */
  const bounce = context.createRadialGradient(
    width * 0.78, height * 0.42, 2,
    width * 0.78, height * 0.42, width * 0.16,
  );
  bounce.addColorStop(0, 'rgba(150,172,210,0.5)');
  bounce.addColorStop(1, 'rgba(120,140,180,0)');
  context.fillStyle = bounce;
  context.fillRect(0, 0, width, height);

  /* The warm pool of light on the table, below. */
  const table = context.createRadialGradient(
    width * 0.5, height * 0.92, 2,
    width * 0.5, height * 0.92, width * 0.3,
  );
  table.addColorStop(0, 'rgba(120,78,44,0.55)');
  table.addColorStop(1, 'rgba(80,50,30,0)');
  context.fillStyle = table;
  context.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const target = pmrem.fromEquirectangular(texture);

  pmrem.dispose();
  texture.dispose();

  return target;
}

/**
 * A soft round sprite used for the dust motes floating in the
 * light beam.
 */
export function createDustSprite(size = 64) {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(255, 232, 196, 1)');
  gradient.addColorStop(0.35, 'rgba(255, 226, 182, 0.45)');
  gradient.addColorStop(1, 'rgba(255, 220, 170, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
