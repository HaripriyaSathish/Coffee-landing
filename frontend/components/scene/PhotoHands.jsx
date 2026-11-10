'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { easeOut, easeInOut, TABLE_Y, FINALE_START } from './anim';

/*
 * Two real hands from the Pexels photo "Two Person's Hand Holding White Mug Filled With Coffee"
 * by ge yonk (Pexels License). Cut out with scripts/cut-hands.cjs (rects below = public/images/hands.json).
 *
 * In the ending the camera looks straight down at the cup; these two photo layers lie flat around
 * it, at the same scale and position they had around the mug in the photo, and slide in along their
 * arms from opposite edges. They sit just below the cup's rim and are depth-tested, so the cup
 * always covers any part that would cross it: the fingers wrap around the cup, never over the foam.
 * Each hand casts a soft shadow (its own blurred outline) onto the table.
 */
const PHOTO_MUG = { x: 1276, y: 764, r: 175 }; // the photo mug's centre and outer radius (source pixels)
const CUP_RADIUS = 0.545 * 1.4; // our ceramic cup's outer radius at hero scale (scene units)
const PX = CUP_RADIUS / PHOTO_MUG.r; // scene units per source pixel
const HEIGHT = TABLE_Y + 0.75; // below the rim (~TABLE_Y + 1.85) so the cup hides any overlap
const SHADOW_OFFSET = [0.16, -0.7, 0.12]; // light comes from the upper left: shadow falls down-right
const SKIN_TONE = new THREE.Color(0.96, 0.88, 0.82); // match the warm studio light of the scene

const HANDS = [
  // cut-out rect in the source photo, and the direction it slides in from (image up = -z)
  { name: 'top', x: 778, y: 0, w: 499, h: 1022, from: [-0.25, -3.8], delay: 0 },
  { name: 'bottom', x: 706, y: 526, w: 915, h: 1074, from: [0.35, 4.0], delay: 0.35 },
];
const FILES = HANDS.flatMap((h) => [`/images/hand-${h.name}.png`, `/images/hand-${h.name}-shadow.png`]);

export default function PhotoHands({ progRef }) {
  const textures = useTexture(FILES);
  const hands = useRef([]);
  const shadows = useRef([]);

  const planes = useMemo(
    () =>
      HANDS.map((h, i) => {
        const tex = textures[i * 2];
        const shadowTex = textures[i * 2 + 1];
        [tex, shadowTex].forEach((t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
        });
        return {
          ...h,
          tex,
          shadowTex,
          cx: (h.x + h.w / 2 - PHOTO_MUG.x) * PX,
          cz: (h.y + h.h / 2 - PHOTO_MUG.y) * PX,
          sw: h.w * PX,
          sh: h.h * PX,
        };
      }),
    [textures]
  );

  useFrame(() => {
    const f = progRef.current.f || 0;
    planes.forEach((p, i) => {
      const m = hands.current[i];
      const s = shadows.current[i];
      if (!m || !s) return;
      // hands arrive once the camera is overhead, gliding in along their arms
      const k = Math.min(1, Math.max(0, (f - FINALE_START - 1.8 - p.delay) / 2.4));
      const e = easeOut(k);
      const x = p.cx + p.from[0] * (1 - e);
      const z = p.cz + p.from[1] * (1 - e);
      const breathe = Math.sin(f * 1.1 + i * 2) * 0.004 * e; // a hint of life while holding
      m.visible = s.visible = k > 0;
      m.position.set(x, HEIGHT + breathe, z);
      s.position.set(x + SHADOW_OFFSET[0], HEIGHT + SHADOW_OFFSET[1], z + SHADOW_OFFSET[2]);
      const o = easeInOut(Math.min(1, k * 2));
      m.material.opacity = o;
      s.material.opacity = o * 0.85;
    });
  });

  return planes.map((p, i) => (
    <group key={p.name}>
      {/* soft shadow on the table */}
      <mesh ref={(el) => (shadows.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[p.sw, p.sh]} />
        <meshBasicMaterial map={p.shadowTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* the hand: real photo pixels, unlit so the skin keeps its natural detail */}
      <mesh ref={(el) => (hands.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[p.sw, p.sh]} />
        <meshBasicMaterial map={p.tex} transparent alphaTest={0.02} depthWrite={false} toneMapped={false} color={SKIN_TONE} />
      </mesh>
    </group>
  ));
}

useTexture.preload(FILES);
