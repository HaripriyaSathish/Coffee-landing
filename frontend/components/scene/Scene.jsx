'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, ContactShadows, Sparkles, PerformanceMonitor } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette, Noise, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { lerp, easeInOut, TABLE_Y, FINALE_START, FINALE_RISE } from './anim';
import Beans from './Beans';
import Grinder from './Grinder';
import Powder from './Powder';
import Bottle from './Bottle';
import Cup from './Cup';
import WaterCarafe from './WaterCarafe';
import PhotoHands from './PhotoHands';

// Cinematic "camera" keyframes: at each v the shot zooms on a point of interest.
// [v, zoom, focusX, focusY, orbitY, tilt, pitch]  (pitch > 0 looks down onto the table)
const SHOTS = [
  [0.0, 1.05, 0.0, 2.9, -0.3, 0.0, 0], // seeds pouring into the hopper
  [0.9, 1.0, 0.0, 2.0, 0.2, 0.02, 0], // the whole grinder machine
  [1.5, 1.0, 0.0, 0.95, -0.2, -0.02, 0], // powder streaming from the spout into the bottle
  [2.15, 1.0, 0.0, 0.4, 0.0, 0.0, 0], // pull back for the cold water
  [2.9, 1.0, 0.0, -0.4, 0.2, 0.0, 0],
  [3.3, 1.15, 0.0, 0.4, -0.15, 0.02, 0], // close on the press
  [3.95, 1.05, 0.0, 0.0, 0.25, 0.0, 0.05], // hero spin
  [4.55, 0.92, 0.2, -0.6, -0.1, -0.02, 0.38], // bottle pours into the white cup (look in from above)
  [5.05, 1.08, 0.25, -0.15, 0.1, 0.0, 0.42], // the pitcher comes in with hot, steaming milk
  [5.42, 1.12, 0.2, -0.25, -0.05, 0.0, 0.45], // the slow hot-milk pour
  [5.74, 1.2, 0.05, -0.35, -0.1, 0.02, 0.55], // stirred, steam rising
  [6.0, 1.2, 0.0, -0.3, 0.0, 0.0, 0.62], // the finished cappuccino
];


function shotAt(v) {
  let i = 0;
  while (i < SHOTS.length - 2 && v > SHOTS[i + 1][0]) i++;
  const a = SHOTS[i];
  const b = SHOTS[i + 1];
  const t = easeInOut(Math.min(1, Math.max(0, (v - a[0]) / (b[0] - a[0]))));
  return a.map((x, k) => lerp(x, b[k], t));
}

/** Positions the whole scene (right side on desktop, top on mobile), runs the camera moves and pointer parallax. */
function Rig({ children, progRef }) {
  const group = useRef(); // composition position + scale
  const pivot = useRef(); // camera angles, rotating around the focus point
  const inner = useRef(); // shifts the scene so the focus point sits on the pivot
  const { viewport } = useThree();
  useFrame((state, dt) => {
    const p = progRef.current;
    // ending clock: runs once the whole process has finished
    p.f = p.v >= 5.99 ? (p.f || 0) + dt : 0;
    let [, zoom, fx, fy, orbit, tilt, pitch] = shotAt(p.v);
    // after the turntable, the camera glides overhead for the hands
    const fin = easeInOut(Math.min(1, Math.max(0, (p.f - FINALE_START) / FINALE_RISE)));
    zoom = lerp(zoom, 1.12, fin);
    fx = lerp(fx, 0, fin);
    fy = lerp(fy, -0.1, fin);
    orbit = lerp(orbit, 0, fin);
    tilt = lerp(tilt, 0, fin);
    pitch = lerp(pitch, 1.53, fin); // straight down, like the reference photo
    const g = group.current;
    const mobile = viewport.aspect < 0.95;
    const k = 1 - Math.exp(-dt * 3);
    // the full animation spans ~6.4 units tall and ~5.4 wide: fit it into the free area
    const fit = mobile
      ? Math.min(viewport.height * 0.55 / 6.4, viewport.width / 5.6)
      : Math.min(viewport.height * 1.0 / 5.2, (viewport.width * 0.6) / 4.6); // larger hero object on the right
    const ts = Math.min(1.2, fit) * zoom;
    const cx = mobile ? 0 : viewport.width * 0.24;
    const cy = mobile ? viewport.height * 0.2 : 0;
    // the focus point sits at the composition centre; all camera angles pivot around it
    const kc = 1 - Math.exp(-dt * 5);
    g.position.x = lerp(g.position.x, cx, kc);
    g.position.y = lerp(g.position.y, cy, kc);
    g.scale.setScalar(lerp(g.scale.x, ts, kc));
    const pv = pivot.current;
    pv.rotation.x = lerp(pv.rotation.x, pitch, k);
    pv.rotation.y = lerp(pv.rotation.y, orbit, k);
    pv.rotation.z = lerp(pv.rotation.z, tilt, k);
    const inn = inner.current;
    inn.position.x = lerp(inn.position.x, -fx, kc);
    inn.position.y = lerp(inn.position.y, -fy, kc);
  });
  return (
    <group ref={group}>
      <group ref={pivot}>
        <group ref={inner}>{children}</group>
      </group>
    </group>
  );
}

/** Dark studio: background + fog that follow the step colour, so the reflective table fades into it. */
function Studio({ bg }) {
  const { scene } = useThree();
  const target = useMemo(() => new THREE.Color(), []);
  const floorMat = useRef();
  useMemo(() => {
    scene.background = new THREE.Color(bg);
    scene.fog = new THREE.Fog(bg, 10, 22);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((_, dt) => {
    target.set(bg);
    const k = 1 - Math.exp(-dt * 2);
    scene.background.lerp(target, k);
    scene.fog.color.copy(scene.background);
    if (floorMat.current) floorMat.current.color.copy(scene.background).multiplyScalar(0.55);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TABLE_Y - 0.001, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshPhysicalMaterial
        ref={floorMat}
        color={bg}
        roughness={0.9}
        metalness={0}
        envMapIntensity={0}
      />
    </mesh>
  );
}

/**
 * Compiles every material once, up front (in the background where the GPU driver supports it),
 * including objects that are hidden until later steps. Without this, each new glass / metal / liquid
 * material compiles the first time it appears and the animation stalls.
 */
function Warmup({ onReady }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    // The EffectComposer draws the scene into an offscreen buffer, and three.js builds a different
    // shader for that than for the screen (no tone mapping, linear colour). Compiling against the
    // screen would warm up the wrong shaders, so compile and draw into an offscreen target instead.
    const rt = new THREE.WebGLRenderTarget(64, 64, { type: THREE.HalfFloatType });
    // shows every object and turns off frustum culling, so nothing is skipped by the main camera or
    // the shadow camera (a skipped object would still compile later, mid-animation)
    const showAll = () => {
      const hidden = [];
      const culled = [];
      scene.traverse((o) => {
        if (!o.visible) {
          hidden.push(o);
          o.visible = true;
        }
        if (o.frustumCulled) {
          culled.push(o);
          o.frustumCulled = false;
        }
      });
      return () => {
        hidden.forEach((o) => { o.visible = false; });
        culled.forEach((o) => { o.frustumCulled = true; });
      };
    };
    const id = setTimeout(async () => {
      const prev = gl.getRenderTarget();
      let restore = showAll();
      let job;
      try {
        gl.setRenderTarget(rt);
        job = gl.compileAsync ? gl.compileAsync(scene, camera) : (gl.compile(scene, camera), Promise.resolve());
      } catch {
        job = Promise.resolve();
      }
      gl.setRenderTarget(prev);
      restore();
      try { await job; } catch { /* ignore */ }
      if (cancelled) return;
      // one hidden frame with everything visible: uploads every texture and geometry, and builds the
      // shadow-map shaders, so nothing has to be prepared the first time it appears on screen
      restore = showAll();
      try {
        gl.setRenderTarget(rt);
        gl.render(scene, camera);
      } catch { /* ignore */ }
      gl.setRenderTarget(prev);
      restore();
      // let a couple of frames render so post-processing passes are compiled too
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!cancelled) onReady?.(); }));
    }, 80);
    return () => { cancelled = true; clearTimeout(id); rt.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function Scene({ progRef, flavor, brand, spinRef, bg = '#3a2414', onReady }) {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 900;
  // quality adapts to the computer: if frames drop, render a bit lighter instead of stuttering
  const [quality, setQuality] = useState(mobile ? 0.6 : 1);
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, mobile ? 1.25 : 1.5) * (0.65 + 0.35 * quality);
  // fixed: changing multisampling rebuilds the whole effect pipeline, which can make the browser drop the
  // WebGL context ("Cannot read properties of null (reading 'alpha')"). Only the resolution adapts.
  const msaa = mobile ? 0 : 2;
  return (
    <Canvas
      dpr={Math.max(0.75, dpr)}
      shadows="soft"
      camera={{ position: [0, 0.4, 8], fov: 32 }}
      gl={{ antialias: false, alpha: false, localClippingEnabled: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        // if the browser drops the GPU context (driver hiccup, too many tabs), allow it to be restored
        // instead of losing the 3D for good
        gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
      }}
    >
      <ambientLight intensity={0.25} />
      {/* key light, warm */}
      <directionalLight position={[3, 6, 5]} intensity={3} color="#ffe2c2" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0003} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
      {/* rim light from behind, picks out glass edges */}
      <spotLight position={[-4, 4, -5]} angle={0.5} penumbra={1} intensity={60} color={flavor.accent_color} />
      <spotLight position={[5, 3, -4]} angle={0.5} penumbra={1} intensity={40} color="#9fd4ff" />
      <spotLight position={[0, 6, -6]} angle={0.6} penumbra={1} intensity={70} color="#ffe9d2" />

      {/* studio reflections built in code, so no HDR file is downloaded */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#ffd8b0" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={2} color="#b8e2ff" position={[5, 0, 0]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={1.5} position={[0, 0, -5]} scale={3} />
        {/* tall softbox strips: the bright vertical highlights you see on glass in product shots */}
        <Lightformer form="rect" intensity={6} position={[-3.2, 0.5, 2]} rotation-y={Math.PI / 4} scale={[0.6, 7, 1]} />
        <Lightformer form="rect" intensity={6} position={[3.2, 0.5, 2]} rotation-y={-Math.PI / 4} scale={[0.6, 7, 1]} />
        <Lightformer form="rect" intensity={4} position={[0, 0.5, -4]} scale={[1.2, 7, 1]} />
      </Environment>

      {/* quality only ever steps down: every change resizes all the render buffers (a visible hitch),
          so going back up and down repeatedly made the animation stutter */}
      <PerformanceMonitor
        ms={500}
        iterations={6}
        bounds={(refresh) => (refresh > 90 ? [50, 80] : [40, 56])}
        onDecline={() => setQuality((q) => Math.max(0.4, q - 0.3))}
        flipflops={2}
        onFallback={() => setQuality(0.4)}
      />
      <Rig progRef={progRef}>
        <Beans progRef={progRef} />
        <Grinder progRef={progRef} accent={flavor.accent_color} />
        <Powder progRef={progRef} />
        <Bottle progRef={progRef} flavor={flavor} brand={brand} spinRef={spinRef} />
        <Cup progRef={progRef} flavor={flavor} spinRef={spinRef} />
        <WaterCarafe progRef={progRef} />
        <Suspense fallback={null}>
          <PhotoHands progRef={progRef} />
          {/* inside the same Suspense: warms up once the hand photos have loaded, so they are included */}
          <Warmup onReady={onReady} />
        </Suspense>
        <Sparkles count={40} scale={[6, 5, 3]} size={1.6} speed={0.3} opacity={0.35} color={flavor.accent_color} />
        <ContactShadows position={[0, TABLE_Y + 0.002, 0]} opacity={0.65} scale={7} blur={2.2} far={4} resolution={512} color="#000000" />
        <Studio bg={bg} />
      </Rig>

      {/* camera-lens finish: ambient occlusion, soft bloom on highlights, vignette, fine grain */}
      <EffectComposer multisampling={msaa}>
        <Bloom mipmapBlur intensity={0.35} luminanceThreshold={0.97} luminanceSmoothing={0.1} />
        <Vignette offset={0.3} darkness={0.45} />
        <Noise opacity={0.025} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
