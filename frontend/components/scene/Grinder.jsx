'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  seg, easeOut, easeIn, easeInOut, lerp,
  GRINDER_Y, HOPPER_BOTTOM, HOPPER_TOP, hopperRadius, GRIND_START, GRIND_END,
} from './anim';

/** Brushed-metal look: fine horizontal streaks used as a roughness map. */
function brushedTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6a6a6a';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * 512;
    const g = 90 + Math.random() * 70;
    ctx.strokeStyle = `rgba(${g},${g},${g},${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, y);
    ctx.lineTo(Math.random() * 512 + 80, y);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/**
 * Realistic burr grinder: smoked-glass hopper, brushed steel body, dial, LED ring,
 * burr neck and a spout underneath that feeds the cold-press bottle.
 * Appears with the seeds, vibrates while grinding, then lifts away.
 */
export default function Grinder({ progRef, accent }) {
  const group = useRef();
  const dial = useRef();
  const led = useRef();
  const burr = useRef();
  const brushed = useMemo(brushedTexture, []);

  const hopperGeo = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const y = HOPPER_BOTTOM + (i / 12) * (HOPPER_TOP - HOPPER_BOTTOM);
      pts.push(new THREE.Vector2(hopperRadius(y) + 0.02, y));
    }
    return new THREE.LatheGeometry(pts, 64);
  }, []);

  useFrame((state) => {
    const v = progRef.current.v;
    const t = state.clock.elapsedTime;
    const g = group.current;
    // glides down and settles softly (gentle overshoot), instead of dropping in
    const landT = seg(v, 0.0, 0.7);
    const appear = landT <= 0 ? 0 : 1 + 1.6 * Math.pow(landT - 1, 3) + 0.6 * Math.pow(landT - 1, 2);
    const leave = easeIn(seg(v, 1.95, 2.25));
    g.visible = appear > 0.001 && leave < 1;
    const grinding = seg(v, GRIND_START, GRIND_START + 0.05) * (1 - seg(v, GRIND_END, GRIND_END + 0.05));
    // motor vibration while grinding
    const shake = grinding * 0.012;
    g.position.set(
      Math.sin(t * 90) * shake,
      lerp(GRINDER_Y + 2.2, GRINDER_Y, appear) + leave * 3.2 + Math.cos(t * 77) * shake + Math.sin(t * 1.3) * 0.015 * (1 - grinding),
      0
    );
    g.rotation.y = lerp(-1.1, -0.25, easeInOut(landT)) + leave * 0.6;
    g.rotation.z = (1 - easeInOut(landT)) * 0.12;
    g.scale.setScalar(lerp(0.85, 1, easeInOut(landT)));
    dial.current.rotation.z = -easeInOut(seg(v, GRIND_START - 0.1, GRIND_START + 0.05)) * 2.2;
    led.current.material.emissiveIntensity = 0.2 + grinding * (2.5 + Math.sin(t * 12) * 0.4);
    burr.current.rotation.y += grinding * 0.6;
  });

  return (
    <group ref={group}>
      {/* body: brushed stainless shell */}
      <RoundedBox args={[1.05, 1.15, 0.9]} radius={0.12} smoothness={6} position={[0, 0.62, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#c9c6c1" metalness={1} roughness={0.32} roughnessMap={brushed} clearcoat={0.4} clearcoatRoughness={0.3} envMapIntensity={1.4} />
      </RoundedBox>
      {/* matte black front panel */}
      <RoundedBox args={[0.78, 0.86, 0.04]} radius={0.04} smoothness={4} position={[0, 0.66, 0.455]}>
        <meshStandardMaterial color="#141110" roughness={0.6} metalness={0.2} />
      </RoundedBox>
      {/* dial */}
      <group position={[0, 0.78, 0.49]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.21, 0.06, 64]} />
          <meshPhysicalMaterial color="#d8d5cf" metalness={1} roughness={0.18} clearcoat={1} />
        </mesh>
        <mesh ref={dial} position={[0, 0, 0.035]}>
          <boxGeometry args={[0.02, 0.15, 0.01]} />
          <meshStandardMaterial color="#1a1310" />
        </mesh>
        <mesh ref={led} position={[0, 0, -0.005]}>
          <torusGeometry args={[0.235, 0.008, 12, 64]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} toneMapped={false} />
        </mesh>
      </group>
      {/* brand plate */}
      <mesh position={[0, 0.36, 0.478]}>
        <boxGeometry args={[0.36, 0.05, 0.005]} />
        <meshStandardMaterial color={accent} metalness={0.9} roughness={0.25} />
      </mesh>

      {/* burr neck + lid of the burr chamber */}
      <mesh position={[0, 1.33, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.34, 0.2, 64]} />
        <meshPhysicalMaterial color="#2a2522" metalness={0.6} roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh ref={burr} position={[0, 1.46, 0]}>
        <cylinderGeometry args={[0.19, 0.22, 0.08, 24]} />
        <meshStandardMaterial color="#9a958e" metalness={1} roughness={0.3} flatShading />
      </mesh>

      {/* smoked glass hopper */}
      <mesh geometry={hopperGeo} renderOrder={3}>
        <meshPhysicalMaterial color="#5a3a26" transparent opacity={0.28} roughness={0.05} metalness={0} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} envMapIntensity={2} />
      </mesh>
      {/* hopper lid */}
      <mesh position={[0, HOPPER_TOP + 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.06, 64]} />
        <meshPhysicalMaterial color="#1a1512" roughness={0.4} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, HOPPER_TOP + 0.12, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.1, 32]} />
        <meshPhysicalMaterial color="#d0ccc5" metalness={1} roughness={0.2} />
      </mesh>

      {/* spout under the body */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 0.2, 32, 1, true]} />
        <meshPhysicalMaterial color="#bdb9b2" metalness={1} roughness={0.28} side={THREE.DoubleSide} />
      </mesh>
      {/* feet */}
      {[[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.0, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 16]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
