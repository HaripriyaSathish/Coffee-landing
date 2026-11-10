'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

let smokeTex = null;
/** Soft, wispy vapour puff (drawn once, shared by every steam source). */
function smokeTexture() {
  if (smokeTex) return smokeTex;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // several overlapping soft blobs make an irregular, cloud-like puff instead of a perfect circle
  for (let i = 0; i < 14; i++) {
    const x = S / 2 + (rnd() - 0.5) * 46;
    const y = S / 2 + (rnd() - 0.5) * 46;
    const r = 18 + rnd() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.16 + rnd() * 0.14})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }
  smokeTex = new THREE.CanvasTexture(c);
  smokeTex.colorSpace = THREE.SRGBColorSpace;
  return smokeTex;
}

/**
 * Rising steam from a hot drink. `source` is a ref holding { y, r, k }:
 * the height to rise from, the radius it rises over, and the strength (0 = none, 1 = full).
 * Puffs rise slowly, curl, widen and fade; they always face the camera so they read from any angle.
 */
export default function Steam({ source, count = 24, rise = 1.4, size = 0.8 }) {
  const puffs = useMemo(() => {
    const tex = smokeTexture();
    let seed = count * 13 + 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: count }, () => {
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, color: '#f3ece4' });
      const sprite = new THREE.Sprite(mat);
      sprite.renderOrder = 30;
      return {
        sprite,
        offset: rnd(),
        speed: 0.16 + rnd() * 0.1, // slow: real steam drifts lazily
        angle: rnd() * Math.PI * 2,
        radius: 0.72 + rnd() * 0.32, // rises near the rim, so the latte art in the middle stays clear
        swirl: (rnd() - 0.5) * 1.6,
        grow: 0.7 + rnd() * 0.6,
        spin: (rnd() - 0.5) * 0.6,
      };
    });
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { y, r, k } = source.current;
    puffs.forEach((p) => {
      const life = (t * p.speed + p.offset) % 1; // 0 = just left the surface, 1 = gone
      const a = p.angle + life * p.swirl * 3 + Math.sin(t * 0.7 + p.offset * 6) * 0.3;
      const rad = r * p.radius * (1 - life * 0.15) + life * 0.1;
      const sp = p.sprite;
      sp.position.set(
        Math.cos(a) * rad + Math.sin(t * 0.9 + p.offset * 9) * 0.05 * life,
        y + life * rise,
        Math.sin(a) * rad
      );
      const s = size * (0.35 + life * p.grow);
      sp.scale.set(s, s * 1.25, 1);
      // fade in just above the surface, fade out as it disperses
      // faint, thin vapour: just visible, never a fog over the drink
      sp.material.opacity = k * 0.13 * Math.sin(life * Math.PI) * (1 - life * 0.35);
      sp.material.rotation = p.spin * t;
      sp.visible = k > 0.01;
    });
  });

  return (
    <group>
      {puffs.map((p, i) => (
        <primitive key={i} object={p.sprite} />
      ))}
    </group>
  );
}
