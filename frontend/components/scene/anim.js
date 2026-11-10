// Small easing / timeline helpers shared by the 3D scene.
// The whole banner animation is driven by one number `v` (0 → 6):
//   0–1 beans fall in · 1–2 beans are ground to powder · 2–3 powder steeps in cold water
//   3–4 bottle is capped & labelled · 4–5 ice + cold brew poured into a glass · 5–6 milk poured in
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const seg = (v, a, b) => clamp01((v - a) / (b - a));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const lerp = (a, b, t) => a + (b - a) * t;

// Deterministic pseudo-random so server/client and re-renders agree.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Scene layout constants (in scene-group units)
export const VORTEX_Y = 1.45; // where beans are ground
export const BOTTLE_Y_BREW = -0.55; // bottle centre while filling
export const BOTTLE_Y_FINAL = -0.1;
export const BOTTLE_HALF = 1.25; // bottle local origin is at its centre
export const MOUTH_LOCAL = 2.5; // mouth height measured from bottle bottom
export const FILL_MAX = 1.72; // liquid height when full (from bottom)

// Serving glass
export const TABLE_Y = -1.95;
export const CUP_X = 0.82;
export const CUP_H = 1.3;
export const CUP_FILL = 0.98; // liquid height in the glass when full
export const COFFEE_IN_CUP = 0.64; // cold brew height in the glass
export const MILK_IN_CUP = 0.32; // milk layer added on top
export const cupFill = (v) => easeInOut(seg(v, 4.47, 4.88));
export const milkFill = (v) => easeInOut(seg(v, 5.25, 5.78));

// Grinder machine (seed -> powder). Local origin = bottom of the body.
export const GRINDER_Y = 1.25; // body bottom (scene units)
export const HOPPER_BOTTOM = 1.5; // local y where the hopper meets the burr neck
export const HOPPER_TOP = 2.45;
export const hopperRadius = (yl) => 0.2 + (0.56 - 0.2) * Math.min(1, Math.max(0, (yl - HOPPER_BOTTOM) / (HOPPER_TOP - HOPPER_BOTTOM)));
export const SPOUT_Y = GRINDER_Y - 0.18; // world y where powder leaves the spout
export const GRIND_START = 1.1;
export const GRIND_END = 1.92;
// height of the coffee-powder bed inside the bottle (shared by bottle + falling powder)
export function groundsHeight(v) {
  const fillBed = easeOut(seg(v, GRIND_START + 0.1, GRIND_END + 0.05)) * 0.42; // powder piles up while grinding
  const squash = easeInOut(seg(v, 3.12, 3.4)); // plunger presses it flat
  const lifted = 1 - 0.6 * swirlAmount(v); // grounds lift off the bottom while the water swirls them
  return lerp(fillBed, 0.1, squash) * lifted * (1 - seg(v, 3.9, 4.05)); // filtered out before pouring
}

// Cold water pour + swirl (step 3)
export const POUR_START = 2.1;
export const POUR_END = 2.52;
export const waterFill = (v) => easeOut(seg(v, POUR_START, POUR_END + 0.08));
export const bottleLevel = (v) => 0.06 + waterFill(v) * (FILL_MAX - 0.06);
// 0 -> 1 -> 0: how strongly the grounds are swirling in the water
export const swirlAmount = (v) => easeInOut(seg(v, 2.16, 2.32)) * (1 - easeInOut(seg(v, 2.7, 2.95)));

// Ending: the finished cup turns on the turntable, then the camera rises overhead and two hands hold it
export const FINALE_START = 5; // seconds of turntable rotation before the camera rises
export const FINALE_RISE = 2.4; // seconds for the camera to glide overhead
