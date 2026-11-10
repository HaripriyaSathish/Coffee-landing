'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { beanBumpTexture } from './materials';
import { seg, easeOut, easeIn, lerp, rng, GRINDER_Y, HOPPER_BOTTOM, hopperRadius, GRIND_START, GRIND_END } from './anim';

/** Procedural roasted coffee bean: squashed ellipsoid with an S-shaped centre crease. */
export function makeBeanGeometry() {
  const g = new THREE.SphereGeometry(1, 64, 48);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // slightly egg-shaped and lumpy, like a real roasted bean
    const lump = 1 + 0.035 * Math.sin(v.x * 7 + v.y * 5) * Math.cos(v.z * 6 - v.y * 3);
    let x = v.x * 0.64 * lump * (1 + v.y * 0.06);
    const y = v.y * 0.88 * lump;
    let z = v.z * 0.52 * lump;
    if (z > 0) {
      z *= 0.5; // flat side
      const cx = 0.08 * Math.sin(v.y * 3.4);
      const groove = Math.exp(-Math.pow((x - cx) / 0.06, 2));
      z -= 0.2 * groove * (1 - Math.pow(Math.abs(v.y), 4));
      // the crease curls over at the ends
      x += 0.04 * groove * Math.sign(v.y) * Math.abs(v.y);
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

const COUNT = 34;

export default function Beans({ progRef }) {
  const mesh = useRef();
  const geometry = useMemo(makeBeanGeometry, []);
  const bump = useMemo(beanBumpTexture, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // natural roast variation: medium to dark (re-applied if the mesh is ever recreated)
  const paintRoast = (m) => {
    const roast = ['#3a1c0d', '#4a2513', '#5a2e16', '#2e160a', '#62361b'];
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) m.setColorAt(i, c.set(roast[i % roast.length]));
    m.instanceColor.needsUpdate = true;
    m.material.needsUpdate = true; // recompile with per-instance colours
    m.userData.painted = m.material;
  };
  useEffect(() => {
    if (mesh.current) paintRoast(mesh.current);
  }, []);

  const seeds = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: COUNT }, () => ({
      a: r() * Math.PI * 2,
      rad: 0.75 + r() * 1.0,
      yOff: (r() - 0.5) * 0.9,
      d: r(),
      sx: (r() - 0.5) * 5,
      sy: 4.5 + r() * 3,
      sz: (r() - 0.5) * 2,
      size: 0.16 + r() * 0.06,
      rx: r() * Math.PI * 2,
      ry: r() * Math.PI * 2,
      spin: 0.4 + r() * 1.2,
      fy: (r() - 0.5) * 2.8,
      hl: r(), // height in the hopper pile (0 = bottom)
      rr: Math.sqrt(r()), // radial position in the hopper
    }));
  }, []);

  useFrame((state) => {
    const v = progRef.current.v;
    const t = state.clock.elapsedTime;
    const m = mesh.current;
    if (!m) return;
    if (m.userData.painted !== m.material) paintRoast(m);

    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      // phase 0: seeds pour into the grinder hopper and settle into a pile
      const hy = HOPPER_BOTTOM + 0.1 + s.hl * 0.72; // resting height inside the hopper (local)
      const rr = s.rr * Math.max(0.02, hopperRadius(hy) - 0.11);
      const land = 0.42 + s.d * 0.38; // after the grinder has landed
      const fall = easeIn(seg(v, land, land + 0.32)); // gravity
      const bounce = v > land + 0.32 ? Math.sin(Math.min(1, (v - land - 0.32) * 10) * Math.PI) * 0.05 : 0;

      // phase 1: the burrs pull the pile down from the bottom up; seeds churn and disappear into the neck
      const g = easeIn(seg(v, GRIND_START + s.hl * 0.58, GRIND_START + s.hl * 0.58 + 0.22));
      const grinding = seg(v, GRIND_START, GRIND_START + 0.05) * (1 - seg(v, GRIND_END, GRIND_END + 0.05));
      const ang = s.a + g * 5 + grinding * t * 0.6;
      const yl = lerp(hy, HOPPER_BOTTOM - 0.05, g);
      const r2 = rr * (1 - g);
      const tx = Math.cos(ang) * r2 + Math.sin(t * 85 + i) * 0.01 * grinding;
      const tz = Math.sin(ang) * r2;
      const ty = GRINDER_Y + yl + bounce;

      let x = lerp(s.sx * 0.5, tx, fall);
      let y = lerp(s.sy + 2, ty, fall);
      let z = lerp(s.sz * 0.3, tz, fall);
      let scale = s.size * 0.82 * (1 - g) * (v > s.d * 0.5 ? 1 : 0);

      // phase 3: beans come back as decoration orbiting the finished bottle
      const h = easeOut(seg(v, 3.25 + s.d * 0.45, 3.75 + s.d * 0.45));
      if (h > 0) {
        const fa = s.a + t * 0.22;
        const fr = (2.05 + s.rad * 0.5) * (0.35 + 0.65 * h);
        x = Math.cos(fa) * fr;
        z = Math.sin(fa) * fr * 0.55;
        y = s.fy + Math.sin(t * 0.9 + s.a) * 0.12;
        scale = s.size * h * 0.95;
      }

      dummy.position.set(x, y, z);
      dummy.rotation.set(s.rx + t * s.spin, s.ry + t * s.spin * 0.7, t * 0.3);
      dummy.scale.setScalar(Math.max(scale, 0.00001));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, COUNT]} castShadow frustumCulled={false}>
      {/* oily roasted sheen */}
      <meshPhysicalMaterial roughness={0.42} clearcoat={0.7} clearcoatRoughness={0.28} sheen={0.4} sheenColor="#a0603a" bumpMap={bump} bumpScale={1.2} />
    </instancedMesh>
  );
}
