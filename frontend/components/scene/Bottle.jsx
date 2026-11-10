'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  seg, easeOut, easeIn, easeInOut, easeBack, lerp,
  BOTTLE_Y_BREW, BOTTLE_Y_FINAL, BOTTLE_HALF, MOUTH_LOCAL, FILL_MAX,
  TABLE_Y, COFFEE_IN_CUP, cupFill, groundsHeight, waterFill, bottleLevel,
} from './anim';

// [radius, height] from the bottle's bottom
const GLASS = [[0, 0], [0.5, 0], [0.58, 0.03], [0.62, 0.12], [0.63, 0.3], [0.63, 1.55], [0.6, 1.72], [0.5, 1.9], [0.36, 2.05], [0.29, 2.18], [0.28, 2.38], [0.31, 2.4], [0.31, 2.48], [0.27, 2.5]];
const LIQUID = [[0, 0.06], [0.47, 0.06], [0.56, 0.09], [0.595, 0.17], [0.6, 0.3], [0.6, 1.55], [0.57, 1.71], [0.47, 1.88], [0.34, 2.02], [0.26, 2.16], [0.25, 2.3]];

function radiusAt(profile, y) {
  for (let i = 1; i < profile.length; i++) {
    const [r0, y0] = profile[i - 1];
    const [r1, y1] = profile[i];
    if (y >= y0 && y <= y1 && y1 > y0) return lerp(r0, r1, (y - y0) / (y1 - y0));
  }
  return profile[profile.length - 1][0];
}

const lathe = (pts) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 72);
const WATER = new THREE.Color('#e6f1f2');
const MURKY = new THREE.Color('#5a3418');
const UP = new THREE.Vector3(0, 1, 0);
const GROUNDS_DRY = new THREE.Color('#8a5a34');
const GROUNDS_WET = new THREE.Color('#2b160a');


function groundsGeometry() {
  // bumpy powder bed (unit height, scaled per frame)
  const g = new THREE.CylinderGeometry(0.612, 0.6, 1, 64, 6, false);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y > 0.99) {
      const x = p.getX(i);
      const z = p.getZ(i);
      p.setY(i, 1 + Math.sin(x * 14) * Math.cos(z * 12) * 0.12 + 0.08 * (1 - Math.hypot(x, z) / 0.6));
    }
  }
  g.computeVertexNormals();
  return g;
}
const POUR_TILT = -1.9; // radians, mouth swings towards the glass
const TWO_PI = Math.PI * 2;

function drawLabel(ctx, brand, flavor) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = flavor.label_color;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.035})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  const cx = W / 2;
  ctx.fillStyle = flavor.accent_color;
  ctx.fillRect(0, 26, W, 10);
  ctx.fillRect(0, H - 36, W, 10);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1b0f08';
  ctx.font = '600 30px Inter, Arial, sans-serif';
  ctx.fillText('C O L D   P R E S S E D   ·   S M A L L   B A T C H', cx, 92);

  ctx.font = '800 118px Syne, "Arial Black", sans-serif';
  ctx.fillText(brand.toUpperCase(), cx, 210);

  ctx.font = 'italic 64px "Instrument Serif", Georgia, serif';
  ctx.fillStyle = flavor.accent_color;
  ctx.fillText(flavor.name, cx, 290);

  ctx.fillStyle = '#1b0f08';
  ctx.font = '600 28px Inter, Arial, sans-serif';
  ctx.fillText(`${flavor.volume}   ·   ${flavor.caffeine} CAFFEINE`, cx, 352);

  ctx.fillStyle = flavor.accent_color;
  [cx - 470, cx + 470].forEach((x) => {
    ctx.beginPath();
    ctx.ellipse(x, 180, 22, 32, 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Cold condensation beads that appear on the glass once the brew is chilled. */
function Condensation({ progRef }) {
  const mesh = useRef();
  const N = 70;
  const drops = useMemo(() => {
    const out = [];
    let s = 3;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      const y = 0.15 + r() * 1.5;
      out.push({ a: r() * Math.PI * 2, y, size: 0.012 + r() * 0.02, d: r(), rad: radiusAt(GLASS, y) + 0.008 });
    }
    return out;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const v = progRef.current.v;
    const t = state.clock.elapsedTime;
    const m = mesh.current;
    m.visible = v > 3.4;
    if (!m.visible) return;
    drops.forEach((d, i) => {
      const k = easeOut(seg(v, 3.5 + d.d * 0.6, 3.8 + d.d * 0.6));
      // a few beads slowly slide down
      const slide = i % 9 === 0 ? ((t * 0.05 + d.d) % 1) * 0.6 : 0;
      dummy.position.set(Math.sin(d.a) * d.rad, d.y - slide - BOTTLE_HALF, Math.cos(d.a) * d.rad);
      dummy.scale.set(d.size * k, d.size * k * 1.3, d.size * k * 0.6);
      dummy.lookAt(0, dummy.position.y, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} renderOrder={4} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshPhysicalMaterial color="#ffffff" transparent opacity={0.65} roughness={0} clearcoat={1} envMapIntensity={3} />
    </instancedMesh>
  );
}

export default function Bottle({ progRef, flavor, brand, spinRef }) {
  const group = useRef();
  const liquid = useRef();
  const surface = useRef();
  const label = useRef();
  const cap = useRef();
  const press = useRef();
  const water = useRef();
  const pour = useRef();
  const glassMat = useRef();
  const grounds = useRef();
  const groundsGeo = useMemo(groundsGeometry, []);

  const glassGeo = useMemo(() => lathe(GLASS), []);
  const liquidGeo = useMemo(() => lathe(LIQUID), []);
  const streamGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.05, 0.035, 1, 20, 1, true);
    g.translate(0, -0.5, 0); // top at origin so scale.y grows downward
    return g;
  }, []);
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);
  const coffee = useMemo(() => new THREE.Color(flavor.liquid_color), []); // eslint-disable-line react-hooks/exhaustive-deps
  const target = useMemo(() => new THREE.Color(), []);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), n: new THREE.Vector3(), q: new THREE.Quaternion() }), []);
  const spin = useRef(0);

  const labelCanvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 400;
    return c;
  }, []);
  const labelTex = useMemo(() => {
    const t = new THREE.CanvasTexture(labelCanvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [labelCanvas]);

  useEffect(() => {
    const ctx = labelCanvas.getContext('2d');
    const paint = () => {
      drawLabel(ctx, brand, flavor);
      labelTex.needsUpdate = true;
    };
    paint();
    document.fonts?.ready.then(paint);
  }, [flavor, brand, labelCanvas, labelTex]);

  useFrame((state, dt) => {
    const v = progRef.current.v;
    const t = state.clock.elapsedTime;
    const g = group.current;

    /* ---------- position / motion ---------- */
    const appear = easeBack(seg(v, 0.75, 1.05)); // waits under the grinder spout
    const toCenter = easeInOut(seg(v, 3.0, 3.5));
    const slide = easeInOut(seg(v, 4.15, 4.42)); // move up-left above the glass
    const tilt = easeInOut(seg(v, 4.38, 4.52)) * (1 - easeInOut(seg(v, 4.85, 5.0)));
    const exit = easeIn(seg(v, 4.9, 5.2)); // bottle's job is done: it leaves, the cup takes the stage
    g.visible = appear > 0.001 && exit < 1;

    const yCenter = lerp(BOTTLE_Y_BREW - 0.6 * (1 - appear), BOTTLE_Y_FINAL, toCenter);
    const bob = Math.sin(t * 1.3) * 0.05 * toCenter * (1 - slide);
    g.position.x = lerp(lerp(0, -0.46, slide), -4.2, exit);
    g.position.y = lerp(lerp(yCenter, 0.55, slide), 1.2, exit) + bob;
    g.scale.setScalar(Math.max(0.0001, lerp(0.6, 1, appear)));

    // spin: one turn while sealing + flavour changes + user drag; locked front-facing while pouring
    spin.current = lerp(spin.current, spinRef.current.target, 1 - Math.exp(-dt * 4));
    spinRef.current.drag += spinRef.current.vel;
    spinRef.current.vel *= 0.93;
    let ry = easeInOut(seg(v, 3.45, 4.0)) * TWO_PI + spin.current + spinRef.current.drag;
    const lock = seg(v, 3.95, 4.1) * (1 - seg(v, 4.95, 5.1));
    ry = lerp(ry, Math.round(ry / TWO_PI) * TWO_PI, lock);
    g.rotation.y = ry;
    g.rotation.z = POUR_TILT * tilt + Math.sin(t * 0.8) * 0.025 * toCenter * (1 - tilt);

    /* ---------- liquid ---------- */
    target.set(flavor.liquid_color);
    coffee.lerp(target, 1 - Math.exp(-dt * 3));
    const steep = easeInOut(seg(v, 2.25, 2.95)); // water turns murky as the grounds steep
    const pressed = easeInOut(seg(v, 3.1, 3.4)); // pressing leaves clear, rich cold brew
    const col = liquid.current.material.color;
    col.copy(WATER).lerp(MURKY, steep).lerp(coffee, pressed);
    // clear water first (you can see the grounds swirl), clouding into opaque decoction
    const lm = liquid.current.material;
    lm.opacity = lerp(0.1, 1, easeInOut(seg(v, 2.3, 3.0)));
    lm.depthWrite = lm.opacity > 0.98;
    lm.transparent = lm.opacity < 0.99; // solid once it is dark decoction
    surface.current.material.opacity = lm.opacity;
    surface.current.material.color.copy(col).multiplyScalar(1.12);

    const fill = waterFill(v);
    let level = bottleLevel(v);
    level = lerp(level, 0.95, easeInOut(seg(v, 4.45, 4.86))); // poured into the glass
    liquid.current.visible = fill > 0.002;
    surface.current.visible = fill > 0.002 && fill < 0.999 || (v > 4.3 && v < 4.75);

    // clip plane follows the bottle's own up axis, so the liquid stays inside when it tilts
    tmp.p.set(0, level - BOTTLE_HALF, 0);
    g.localToWorld(tmp.p);
    g.getWorldQuaternion(tmp.q);
    tmp.n.copy(UP).applyQuaternion(tmp.q).negate();
    clip.setFromNormalAndCoplanarPoint(tmp.n, tmp.p);

    surface.current.position.y = level - BOTTLE_HALF;
    const sr = radiusAt(LIQUID, level) * 0.99;
    surface.current.scale.set(sr, sr, 1);

    if (glassMat.current) glassMat.current.roughness = lerp(0.02, 0.08, steep); // frosty when cold

    /* ---------- cold-water pour (steep step) ---------- */
    const wIn = 0; // water now pours from the glass carafe (WaterCarafe.jsx)
    const wOut = seg(v, 2.82, 2.95);
    const w = water.current;
    w.visible = wIn > 0 && wOut < 1;
    if (w.visible) {
      const topY = 2.7;
      const bottomY = g.position.y - BOTTLE_HALF * g.scale.y + level * g.scale.y;
      w.position.set(g.position.x, topY - (topY - bottomY) * easeIn(wOut), 0);
      w.scale.set(1, Math.max(0.001, (topY - bottomY) * easeOut(wIn) * (1 - wOut)), 1);
      w.material.opacity = 0.55 * (1 - wOut);
    }

    /* ---------- cold press plunger ---------- */
    const pIn = easeOut(seg(v, 2.95, 3.1));
    const pDown = easeInOut(seg(v, 3.1, 3.4));
    const pUp = easeInOut(seg(v, 3.42, 3.6));
    const pr = press.current;
    pr.visible = pIn > 0 && pUp < 1;
    // disc height inside the bottle (local, from bottom)
    const bedH = groundsHeight(v);
    const discY = lerp(MOUTH_LOCAL + 0.9 * (1 - pIn), 0.08 + bedH, pDown * (1 - pUp)) + pUp * 1.6;
    pr.position.y = discY - BOTTLE_HALF;
    pr.scale.setScalar(Math.max(0.0001, pIn * (1 - pUp * 0.4)));

    /* ---------- coffee powder bed: settles while steeping, squashed by the press ---------- */
    const gb = grounds.current;
    gb.visible = bedH > 0.004;
    gb.position.y = 0.07 - BOTTLE_HALF;
    gb.scale.set(1, Math.max(0.0001, bedH), 1);
    gb.material.color.copy(GROUNDS_DRY).lerp(GROUNDS_WET, steep);
    gb.rotation.y = t * 0.2;

    /* ---------- cap: drops on, lifts off to pour, re-seats ---------- */
    const capOn = seg(v, 3.55, 3.85);
    const capOff = easeOut(seg(v, 4.12, 4.3)) * (1 - easeBack(seg(v, 4.85, 5.0)));
    cap.current.visible = capOn > 0 && capOff < 0.98;
    cap.current.position.y = MOUTH_LOCAL - BOTTLE_HALF - 0.02 + (1 - easeBack(capOn)) * 1.6 + capOff * 0.9;
    cap.current.rotation.y = capOff * 3;
    cap.current.scale.setScalar(Math.max(0.0001, 1 - capOff));

    /* ---------- label wraps on ---------- */
    const lab = easeBack(seg(v, 3.65, 3.95));
    label.current.visible = lab > 0.001;
    label.current.scale.set(1, Math.max(0.0001, lab), 1);
    label.current.material.opacity = Math.min(1, lab * 1.4);

    /* ---------- cold brew stream into the glass ---------- */
    const sIn = seg(v, 4.45, 4.5);
    const sOut = seg(v, 4.8, 4.88);
    const p = pour.current;
    p.visible = sIn > 0 && sOut < 1;
    if (p.visible) {
      tmp.p.set(0, MOUTH_LOCAL - BOTTLE_HALF + 0.02, 0);
      g.localToWorld(tmp.p);
      g.parent.worldToLocal(tmp.p);
      const cupTop = TABLE_Y + 0.07 + cupFill(v) * COFFEE_IN_CUP;
      const len = Math.max(0.001, tmp.p.y - cupTop);
      p.position.set(tmp.p.x, tmp.p.y - len * easeIn(sOut), tmp.p.z);
      p.scale.set(1.2, Math.max(0.001, len * easeOut(sIn) * (1 - sOut)), 1.2);
      p.material.color.copy(coffee).multiplyScalar(1.3);
    }
  });

  return (
    <>
      <group ref={group}>
        <group position={[0, -BOTTLE_HALF, 0]}>
          <mesh ref={liquid} geometry={liquidGeo} renderOrder={1}>
            <meshPhysicalMaterial color={flavor.liquid_color} roughness={0.12} clearcoat={0.35} clearcoatRoughness={0.1} envMapIntensity={0.3} transparent clippingPlanes={[clip]} side={THREE.FrontSide} />
          </mesh>
        </group>
        <mesh ref={surface} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
          <circleGeometry args={[1, 48]} />
          <meshStandardMaterial roughness={0.05} metalness={0.1} transparent />
        </mesh>

        {/* coffee powder bed */}
        <mesh ref={grounds} geometry={groundsGeo} renderOrder={1}>
          <meshStandardMaterial color="#8a5a34" roughness={0.95} />
        </mesh>

        {/* cold press plunger: rod + mesh disc */}
        <group ref={press}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.245, 0.245, 0.04, 48]} />
            <meshPhysicalMaterial color="#d4d0ca" metalness={1} roughness={0.18} clearcoat={0.8} clearcoatRoughness={0.1} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <torusGeometry args={[0.2, 0.012, 8, 48]} />
            <meshStandardMaterial color="#d39a5c" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 2.6, 16]} />
            <meshPhysicalMaterial color="#e2ded8" metalness={1} roughness={0.08} clearcoat={1} />
          </mesh>
          <mesh position={[0, 2.62, 0]}>
            <sphereGeometry args={[0.09, 24, 16]} />
            <meshPhysicalMaterial color="#17100c" roughness={0.3} metalness={0.7} clearcoat={0.8} clearcoatRoughness={0.2} />
          </mesh>
        </group>

        {/* real refractive glass: bends what is behind it, thick base, slight chromatic edge */}
        <mesh geometry={glassGeo} position={[0, -BOTTLE_HALF, 0]} renderOrder={3} castShadow>
          <meshPhysicalMaterial
            ref={glassMat}
            color="#ffffff"
            transparent
            opacity={0.1}
            roughness={0.02}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.02}
            specularIntensity={1.6}
            specularColor="#ffffff"
            ior={1.52}
            envMapIntensity={1.3}
            depthWrite={false}
          />
        </mesh>

        <Condensation progRef={progRef} />

        <mesh ref={label} position={[0, 0.95 - BOTTLE_HALF, 0]} rotation={[0, Math.PI, 0]} renderOrder={2}>
          <cylinderGeometry args={[0.638, 0.638, 0.92, 96, 1, true]} />
          <meshStandardMaterial map={labelTex} roughness={0.55} transparent />
        </mesh>

        <group ref={cap}>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.335, 0.335, 0.28, 64]} />
            <meshPhysicalMaterial color="#17100c" roughness={0.3} metalness={0.7} clearcoat={0.8} clearcoatRoughness={0.2} />
          </mesh>
          <mesh position={[0, 0.285, 0]}>
            <cylinderGeometry args={[0.32, 0.335, 0.02, 64]} />
            <meshStandardMaterial color={flavor.accent_color} roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      </group>

      {/* cold water stream (steep) */}
      <mesh ref={water} geometry={streamGeo} renderOrder={4}>
        <meshPhysicalMaterial color="#7fc8e3" transparent opacity={0.6} roughness={0.05} emissive="#5fa9c4" emissiveIntensity={0.25} depthWrite={false} />
      </mesh>

      {/* cold brew stream (serve) */}
      <mesh ref={pour} geometry={streamGeo} renderOrder={4}>
        <meshStandardMaterial roughness={0.15} metalness={0.05} />
      </mesh>
    </>
  );
}
