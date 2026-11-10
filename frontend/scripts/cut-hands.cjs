/**
 * Cuts the two hands out of the Pexels photo "Two Person's Hand Holding White Mug Filled With Coffee"
 * by ge yonk (https://www.pexels.com/photo/1150622/, Pexels License: free for commercial use).
 *
 * Output (transparent PNGs, with the arms' soft shadows turned into real shadows):
 *   public/images/hand-top.png     the hand reaching down from the top
 *   public/images/hand-bottom.png  the hand reaching up from the bottom
 *   assets-src/preview.jpg         both hands composited on the banner's brown, for checking
 *
 * Run: node scripts/cut-hands.cjs
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '../assets-src/pexels-1150622.jpg');
const OUT = path.join(__dirname, '../public/images');

// regions in the 2400x1600 source image
const MUG = { x: 1276, y: 764, r: 196 }; // the photo's own mug: only clearly-skin pixels survive inside it
const HANDLE = { x0: 1120, y0: 890, x1: 1250, y1: 1070 };
const JAR = { x: 1458, y: 372, r: 182, x0: 1280, y0: 190, x1: 1545, y1: 565 };
const JAR_SHADOW = { x0: 1200, y0: 180, x1: 1560, y1: 480 };

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const dist2 = (c, x, y) => (x - c.x) ** 2 + (y - c.y) ** 2;
// which hand a pixel belongs to: the top hand sits left of the mug, the bottom hand right of / below it
const isTopHand = (x, y) => y < 576 || (y < 960 && x < 1200);

async function blurMask(mask, W, H, sigma) {
  const u8 = Buffer.alloc(W * H);
  for (let i = 0; i < mask.length; i++) u8[i] = Math.round(Math.min(1, mask[i]) * 255);
  // extractChannel keeps the result single-channel (sharp would otherwise return sRGB)
  const out = await sharp(u8, { raw: { width: W, height: H, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
  const f = new Float32Array(W * H);
  for (let i = 0; i < f.length; i++) f[i] = out[i] / 255;
  return f;
}

async function main() {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const skin = new Float32Array(W * H);
  const shadow = new Float32Array(W * H);
  const blocked = new Uint8Array(W * H); // jar / mug / handle: nothing but strict skin allowed

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      const i = p * 3;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const warm = r >= g && g >= b - 4; // skin: red >= green >= blue

      const inJar = dist2(JAR, x, y) <= JAR.r ** 2 || inRect(JAR, x, y);
      if (inJar || (inRect(JAR_SHADOW, x, y) && x > 1235)) {
        blocked[p] = 1;
        continue;
      }
      const inMug = dist2(MUG, x, y) <= MUG.r ** 2;
      const inHandle = inRect(HANDLE, x, y);
      const jarEdge = x > 1160 && x < 1245 && y > 210 && y < 410; // glass reflection left of the jar
      if (inMug || inHandle || jarEdge) blocked[p] = 1;
      const strict = inMug || inHandle || jarEdge;

      // skin: warm, saturated, not too dark (strict inside the mug / handle areas)
      let s = warm && lum > 70 ? smooth(strict ? 30 : 20, strict ? 48 : 38, sat) : 0;
      // darker skin creases / shadowed palm (outside the mug only)
      if (!strict && warm && lum > 60 && lum < 130 && sat > 30) s = Math.max(s, 0.85); // real creases stay saturated; the table shadow does not
      // the pale fingernail on the lower hand's index finger (would read as table)
      if ((x - 1508) ** 2 + ((y - 772) * 1.15) ** 2 < 27 ** 2 && lum > 140) s = 1;
      skin[p] = s;

      if (!strict) {
        // fade the shadow out softly around the photo mug + handle and next to the jar (no hard edges)
        const dm = Math.sqrt(dist2(MUG, x, y));
        const jarFade = y < 500 ? smooth(1235, 1170, x) : 1;
        shadow[p] = smooth(234, 160, lum) * 0.8 * smooth(255, 340, dm) * jarFade;
      }
    }
  }

  const skinBlur = await blurMask(skin, W, H, 13); // fills nails / highlights surrounded by skin
  const skinEdge = await blurMask(skin, W, H, 0.8); // soft edge

  const layers = { top: Buffer.alloc(W * H * 4), bottom: Buffer.alloc(W * H * 4) };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (blocked[p] && skin[p] < 0.5) continue;
      // pull the edge in by a pixel so no table colour is left around the arms
      let s = smooth(0.3, 0.92, Math.max(skinEdge[p], skin[p]));
      if (!blocked[p] && skinBlur[p] > 0.5) s = 1;
      if (skinBlur[p] < 0.3) s *= smooth(0.1, 0.3, skinBlur[p]); // drop isolated specks of JPEG noise
      {
        // pale, colourless edge pixels are table, not skin (shadowed table next to the lower arm)
        const q = p * 3;
        const sat2 = Math.max(data[q], data[q + 1], data[q + 2]) - Math.min(data[q], data[q + 1], data[q + 2]);
        const lum2 = 0.299 * data[q] + 0.587 * data[q + 1] + 0.114 * data[q + 2];
        if (s < 0.999 && sat2 < 26 && lum2 > 150) s *= 0.15;
      }
      const sh = 0; // the photo table shadows are dropped; a clean soft shadow is generated below
      const a = Math.max(s, sh);
      if (a <= 0.01) continue;
      const i = p * 3;
      const o = p * 4;
      const k = s / a;
      const L = isTopHand(x, y) ? layers.top : layers.bottom;
      // un-mix the white table out of soft edge pixels (removes the pale halo)
      const c = [data[i], data[i + 1], data[i + 2]].map((v) => (s > 0.08 && s < 0.98 ? Math.min(255, Math.max(0, (v - (1 - s) * 238) / s)) : v));
      // shadows are a warm, very dark brown rather than pure black
      L[o] = Math.round(c[0] * k + 18 * (1 - k));
      L[o + 1] = Math.round(c[1] * k + 10 * (1 - k));
      L[o + 2] = Math.round(c[2] * k + 6 * (1 - k));
      L[o + 3] = Math.round(a * 255);
    }
  }

  const PAD = 70; // room for the soft shadow around each hand
  const meta = {};
  const full = {};
  for (const name of ['top', 'bottom']) {
    const L = layers[name];
    // bounding box of the hand
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (L[(y * W + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    const rect = { left: Math.max(0, x0 - PAD), top: Math.max(0, y0 - PAD) };
    rect.width = Math.min(W, x1 + PAD) - rect.left;
    rect.height = Math.min(H, y1 + PAD) - rect.top;
    full[name] = await sharp(L, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
    await sharp(full[name]).extract(rect).png({ compressionLevel: 9 }).toFile(path.join(OUT, `hand-${name}.png`));

    // soft shadow: the hand's own outline, blurred, dark warm brown
    const alpha = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) alpha[i] = L[i * 4 + 3];
    const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(16).extractChannel(0).raw().toBuffer();
    const sh = Buffer.alloc(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      sh[i * 4] = 14;
      sh[i * 4 + 1] = 8;
      sh[i * 4 + 2] = 4;
      sh[i * 4 + 3] = Math.round(blurred[i] * 0.62);
    }
    await sharp(sh, { raw: { width: W, height: H, channels: 4 } }).extract(rect).png({ compressionLevel: 9 }).toFile(path.join(OUT, `hand-${name}-shadow.png`));
    meta[name] = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
    console.log(`hand-${name}.png ${rect.width}x${rect.height} at source x=${rect.left} y=${rect.top}`);
  }
  // positions in the source photo, read by the scene (PhotoHands.jsx)
  fs.writeFileSync(path.join(OUT, 'hands.json'), JSON.stringify(meta, null, 2));

  const bg = await sharp({ create: { width: W, height: H, channels: 4, background: '#3a2414' } }).png().toBuffer();
  const comp = await sharp(bg).composite([{ input: full.top }, { input: full.bottom }]).png().toBuffer();
  await sharp(comp).resize(1200).jpeg({ quality: 85 }).toFile(path.join(__dirname, '../assets-src/preview.jpg'));
  console.log('preview written');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
