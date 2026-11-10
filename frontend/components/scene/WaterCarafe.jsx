'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  seg, easeOut, easeIn, easeInOut, lerp,
  BOTTLE_Y_BREW, BOTTLE_HALF, POUR_START, POUR_END, bottleLevel,
} from './anim';
import Splash from './Splash';

// glass carafe profile [radius, height]
const CARAFE = [[0, 0], [0.3, 0], [0.34, 0.04], [0.36, 0.3], [0.33, 0.62], [0.22, 0.8], [0.17, 0.98], [0.2, 1.04]];
const WATER_IN = [[0, 0.04], [0.31, 0.04], [0.33, 0.3], [0.3, 0.6]];
const SPOUT = new THREE.Vector3(-0.21, 1.03, 0);
const TILT = 1.95;
const SEGS_Y = 48;
const SEGS_R = 18;

/**
 * A glass water carafe tilts in and pours cold water into the bottle.
 * The stream is a live, wobbling column of clear refractive water that arcs from the spout.
 */
export default function WaterCarafe({ progRef }) {
  const carafe = useRef();
  const inner = useRef();
  const stream = useRef();
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const carafeGeo = useMemo(() => new THREE.LatheGeometry(CARAFE.map(([r, y]) => new THREE.Vector2(r, y)), 64), []);
  const waterGeo = useMemo(() => new THREE.LatheGeometry(WATER_IN.map(([r, y]) => new THREE.Vector2(r, y)), 48), []);
  const streamGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, SEGS_R, SEGS_Y, true), []);
  const base = useMemo(() => streamGeo.attributes.position.array.slice(), [streamGeo]);

  const liquidTop = (v) => BOTTLE_Y_BREW - BOTTLE_HALF + bottleLevel(v);

  useFrame((state) => {
    const v = progRef.current.v;
    const t = state.clock.elapsedTime;
    const c = carafe.current;

    const enter = easeOut(seg(v, 1.98, 2.06));
    const tilt = easeInOut(seg(v, 2.04, 2.1)) * (1 - easeInOut(seg(v, 2.52, 2.6)));
    const leave = easeIn(seg(v, 2.58, 2.7));
    c.visible = enter > 0 && leave < 1;
    if (!c.visible) {
      stream.current.visible = false;
      return;
    }
    c.position.set(1.05 + (1 - enter) * 1.8 + leave * 2, 1.45 + (1 - enter) * 0.4 + leave * 0.6, 0);
    c.rotation.z = TILT * tilt;
    // water inside the carafe empties as it pours
    inner.current.scale.set(1, Math.max(0.02, 1 - seg(v, POUR_START, POUR_END) * 0.85), 1);

    /* ---------- the stream ---------- */
    const sIn = seg(v, POUR_START, POUR_START + 0.04);
    const sOut = seg(v, POUR_END - 0.04, POUR_END);
    const st = stream.current;
    st.visible = sIn > 0 && sOut < 1;
    if (!st.visible) return;

    tmp.copy(SPOUT);
    c.localToWorld(tmp);
    c.parent.worldToLocal(tmp);
    const top = tmp.clone();
    const bottomY = liquidTop(v);
    const fullLen = Math.max(0.05, top.y - bottomY);
    // stream grows from the spout, and at the end the tail falls away
    const headLen = fullLen * easeOut(sIn);
    const tailDrop = fullLen * easeIn(sOut);

    const arr = st.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      const bx = base[i];
      const by = base[i + 1]; // -0.5 (bottom) .. 0.5 (top)
      const bz = base[i + 2];
      const u = 0.5 - by; // 0 at the spout, 1 at the surface
      const y = top.y - tailDrop - u * Math.max(0.001, headLen - tailDrop);
      const uu = (top.y - y) / fullLen; // real position along the fall
      // parabolic arc from the spout towards the bottle centre
      const x = lerp(top.x, 0, 1 - (1 - uu) * (1 - uu));
      // water thins as it accelerates, with travelling ripples and a slight twist
      const radius = 0.045 * (1 - 0.45 * Math.sqrt(uu)) * (1 + 0.12 * Math.sin(uu * 38 - t * 30));
      const wob = 0.008 * Math.sin(uu * 14 + t * 20);
      arr[i] = x + bx * radius + wob;
      arr[i + 1] = y;
      arr[i + 2] = bz * radius + 0.006 * Math.cos(uu * 11 + t * 17);
    }
    st.geometry.attributes.position.needsUpdate = true;
    st.geometry.computeVertexNormals();
  });

  return (
    <>
      <group ref={carafe}>
        {/* clear glass carafe */}
        <mesh geometry={carafeGeo} castShadow>
          <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={0.08} ior={1.5} roughness={0.02} clearcoat={1} specularIntensity={1.4} envMapIntensity={2.6} side={THREE.DoubleSide} />
        </mesh>
        {/* water inside */}
        <group ref={inner}>
          <mesh geometry={waterGeo}>
            <meshPhysicalMaterial color="#dff3fb" transmission={1} thickness={0.4} ior={1.33} roughness={0.0} attenuationColor="#bfe3f0" attenuationDistance={1.2} envMapIntensity={2} />
          </mesh>
        </group>
        {/* cork handle band */}
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.27, 0.3, 0.12, 48, 1, true]} />
          <meshStandardMaterial color="#b88a5a" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* the pouring stream: clear, refractive, rippling */}
      <mesh ref={stream} geometry={streamGeo} frustumCulled={false}>
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={1}
          thickness={0.12}
          ior={1.33}
          roughness={0.0}
          clearcoat={1}
          clearcoatRoughness={0}
          specularIntensity={1.5}
          attenuationColor="#d8f0f8"
          attenuationDistance={1}
          envMapIntensity={3}
        />
      </mesh>

      {/* splash where the water hits */}
      <Splash
        progRef={progRef}
        color="#e8f7ff"
        size={0.03}
        getHit={(v) => {
          const k = seg(v, POUR_START + 0.03, POUR_START + 0.08) * (1 - seg(v, POUR_END - 0.06, POUR_END));
          return k > 0 ? { x: 0, y: liquidTop(v), z: 0, strength: k } : null;
        }}
      />
    </>
  );
}
