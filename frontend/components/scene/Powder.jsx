'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  seg, easeIn, easeOut, lerp, rng,
  SPOUT_Y, GRIND_START, GRIND_END, BOTTLE_Y_BREW, BOTTLE_HALF, groundsHeight, swirlAmount, bottleLevel,
} from './anim';

const COUNT = 1100;
const FALL = 0.09; // time (in v units) a grain takes from the spout to the bed
const SWIRL_COUNT = 650; // grains that swirl in the water

/**
 * Fresh ground coffee: irregular grains that stream out of the grinder spout
 * into the cold-press bottle, plus fine dust that puffs out and drifts away.
 */
export default function Powder({ progRef }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);

  const seeds = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: COUNT }, () => ({
      b: GRIND_START + 0.06 + r() * (GRIND_END - GRIND_START - 0.08),
      a: r() * Math.PI * 2,
      rad: r(),
      size: 0.011 + r() * 0.014,
      dust: r() < 0.22, // fine dust instead of a falling grain
      rx: r() * 6, ry: r() * 6,
      vx: (r() - 0.5) * 1.4, vz: (r() - 0.5) * 1.4,
    }));
  }, []);

  const paint = (m) => {
    const tones = ['#4b2814', '#5c321a', '#3a1d0d', '#6b3d20', '#7a4826'];
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) m.setColorAt(i, c.set(tones[i % tones.length]));
    m.instanceColor.needsUpdate = true;
    m.material.needsUpdate = true;
    m.userData.painted = m.material;
  };

  useFrame((state) => {
    const v = progRef.current.v;
    const t = state.clock.elapsedTime;
    const m = mesh.current;
    if (!m) return;
    if (m.userData.painted !== m.material) paint(m);
    const swirl = swirlAmount(v);
    const active = (v > GRIND_START && v < GRIND_END + 0.4) || swirl > 0.001;
    m.visible = active;
    if (!active) return;

    const bedTop = BOTTLE_Y_BREW - BOTTLE_HALF + 0.07 + groundsHeight(v);
    const waterTop = BOTTLE_Y_BREW - BOTTLE_HALF + bottleLevel(v);
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const age = v - s.b;
      let scale = 0;
      if (age >= 0) {
        if (s.dust) {
          // dust drifts out from the spout and fades
          const k = Math.min(1, age / 0.35);
          dummy.position.set(
            Math.cos(s.a) * 0.08 + s.vx * 0.25 * easeOut(k),
            SPOUT_Y - 0.05 - 0.25 * k + Math.sin(t * 2 + s.a) * 0.02,
            Math.sin(s.a) * 0.08 + s.vz * 0.25 * easeOut(k)
          );
          scale = s.size * 0.55 * (1 - k);
        } else if (age < FALL) {
          const k = age / FALL;
          const spread = 0.025 + 0.11 * k * s.rad;
          dummy.position.set(
            Math.cos(s.a + k * 2) * spread,
            lerp(SPOUT_Y, bedTop, easeIn(k)),
            Math.sin(s.a + k * 2) * spread
          );
          scale = s.size;
        }
      }
      // the cold water lifts the grounds into a swirling vortex, then they settle back down
      if (swirl > 0.001 && i < SWIRL_COUNT) {
        const h = s.rad; // height in the vortex (0 bottom .. 1 top)
        const rise = Math.min(1, swirl * (1.2 - h * 0.4));
        const yy = lerp(bedTop, bedTop + h * Math.max(0, waterTop - bedTop - 0.08), rise);
        const ang = s.a + t * (3.4 - h * 1.6) + h * 4;
        const rad = (0.08 + 0.46 * Math.sqrt((i % 97) / 97)) * (0.55 + 0.45 * rise) * (1 - 0.25 * h);
        dummy.position.set(Math.cos(ang) * rad, yy + Math.sin(t * 3 + s.a) * 0.02, Math.sin(ang) * rad);
        scale = s.size * 1.35 * Math.min(1, swirl * 2);
      }
      if (scale <= 0) dummy.position.set(0, -999, 0);
      dummy.rotation.set(s.rx + t * 3, s.ry + t * 2, 0);
      dummy.scale.set(scale, scale * 0.7, scale * 0.85);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, COUNT]} frustumCulled={false} castShadow>
      <meshStandardMaterial roughness={0.92} metalness={0} />
    </instancedMesh>
  );
}

export { seg };
