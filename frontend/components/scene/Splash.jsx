'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rng, seg } from './anim';

const COUNT = 140;

/**
 * Looping droplet fountain shown while a stream hits the liquid.
 * `getHit(v)` returns { x, y, z } (local coords) or null when inactive.
 */
export default function Splash({ progRef, getHit, color = '#ffffff', size = 0.035 }) {
  const points = useRef();
  const seeds = useMemo(() => {
    const r = rng(99);
    return Array.from({ length: COUNT }, () => ({
      a: r() * Math.PI * 2,
      sp: 0.35 + r() * 0.7,
      up: 0.6 + r() * 1.1,
      off: r(),
    }));
  }, []);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);

  useFrame((state) => {
    const hit = getHit(progRef.current.v);
    const p = points.current;
    p.visible = !!hit;
    if (!hit) return;
    const t = state.clock.elapsedTime;
    const arr = p.geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const life = (t * 1.8 + s.off) % 1; // 0..1
      const r = s.sp * life * 0.45 * hit.strength;
      arr[i * 3] = hit.x + Math.cos(s.a) * r;
      arr[i * 3 + 1] = hit.y + (s.up * life - 2.2 * life * life) * 0.45 * hit.strength;
      arr[i * 3 + 2] = hit.z + Math.sin(s.a) * r;
    }
    p.geometry.attributes.position.needsUpdate = true;
    p.material.opacity = hit.strength;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={size} transparent depthWrite={false} sizeAttenuation />
    </points>
  );
}

export const pulse = (v, a, b) => {
  const k = seg(v, a, a + 0.05) * (1 - seg(v, b - 0.05, b));
  return k;
};
