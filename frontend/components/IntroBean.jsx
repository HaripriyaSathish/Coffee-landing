'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { makeBeanGeometry } from './scene/Beans';
import { beanBumpTexture } from './scene/materials';

function Bean({ speed = 0.9 }) {
  const ref = useRef();
  const geometry = useMemo(makeBeanGeometry, []);
  const bump = useMemo(beanBumpTexture, []);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    ref.current.rotation.y += dt * speed;
    ref.current.rotation.x = 0.35 + Math.sin(t * 0.8) * 0.15;
    ref.current.position.y = Math.sin(t * 1.4) * 0.05;
  });
  return (
    <mesh ref={ref} geometry={geometry} rotation={[0.35, 0, 0.5]}>
      <meshPhysicalMaterial
        color="#4a2513"
        roughness={0.38}
        clearcoat={0.8}
        clearcoatRoughness={0.25}
        sheen={0.5}
        sheenColor="#b0703f"
        bumpMap={bump}
        bumpScale={1.4}
      />
    </mesh>
  );
}

/** A single real-looking roasted coffee bean for the brand intro. */
export default function IntroBean({ small = false }) {
  return (
    <Canvas dpr={small ? [1, 2] : [1, 2]} camera={{ position: [0, 0, small ? 2.3 : 3.2], fov: 35 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[2, 3, 3]} intensity={2.5} color="#ffe2c2" />
      <spotLight position={[-3, 2, -2]} angle={0.6} penumbra={1} intensity={40} color="#d39a5c" />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={3} position={[0, 3, 2]} scale={[6, 1.5, 1]} />
        <Lightformer form="rect" intensity={5} position={[-2.5, 0, 2]} rotation-y={Math.PI / 4} scale={[0.5, 5, 1]} />
        <Lightformer form="rect" intensity={5} position={[2.5, 0, 2]} rotation-y={-Math.PI / 4} scale={[0.5, 5, 1]} />
      </Environment>
      <Bean speed={small ? 0.5 : 0.9} />
    </Canvas>
  );
}
