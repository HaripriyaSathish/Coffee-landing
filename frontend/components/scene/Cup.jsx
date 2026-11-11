'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { brushedTexture } from './materials';
import * as THREE from 'three';
import {
  seg, easeOut, easeIn, easeInOut, easeBack, lerp,
  TABLE_Y, CUP_X, FINALE_START, COFFEE_IN_CUP, MILK_IN_CUP, cupFill, milkFill,
} from './anim';
import Splash, { pulse } from './Splash';
import Steam from './Steam';

// white ceramic mug profile [radius, height]: outer wall, rounded rim, inner wall, inner floor
const GLASS = [
  [0, 0], [0.38, 0], [0.45, 0.02], [0.49, 0.09], [0.515, 0.5], [0.535, 1.18], [0.545, 1.26], [0.54, 1.3],
  [0.525, 1.32], [0.505, 1.31], [0.495, 1.26], [0.485, 0.6], [0.455, 0.2], [0.42, 0.14], [0.3, 0.125], [0, 0.12],
];
const BASE = 0.12; // thick ceramic floor
const rAt = (h) => lerp(0.44, 0.49, Math.min(1, Math.max(0, (h - 0.16) / 1.1))) - 0.006; // inner radius at height h

// milk jug (pitcher) profile
const JUG = [[0, 0], [0.24, 0], [0.27, 0.04], [0.29, 0.2], [0.27, 0.48], [0.24, 0.6], [0.26, 0.64]];
const SPOUT = new THREE.Vector3(-0.3, 0.62, 0);
const LATTE_TINT = new THREE.Color('#c9a27c'); // cappuccino brown
// how much of the cappuccino colour is milk (LATTE_TINT) vs the flavour's own coffee colour.
// Kept under ~0.5 so switching flavours (Vanilla, Caramel…) visibly changes the drink.
const MILK_SHARE = 0.45;
const FOAM_TINT = 0.22; // how much the latte-art foam picks up the flavour colour
const WHITE = new THREE.Color('#ffffff');
const JUG_TILT = 1.72;

/** Realistic cappuccino surface seen from above: mottled crema, microfoam rim and one big latte-art heart. */
function foamTexture() {
  const S = 1024;
  const m = S / 2;
  const R = m * 0.985;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const rnd = (() => {
    let s = 11;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();

  // 1) crema base: caramel in the middle, deeper brown towards the cup wall
  const base = ctx.createRadialGradient(m, m * 1.04, 0, m, m, R);
  base.addColorStop(0, '#cf9d68');
  base.addColorStop(0.5, '#c28b56');
  base.addColorStop(0.82, '#a8703f');
  base.addColorStop(0.95, '#8d5a2f');
  base.addColorStop(1, '#7a4b26');
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(m, m, R, 0, Math.PI * 2);
  ctx.fill();

  // 2) mottled crema: soft lighter / darker blotches
  for (let i = 0; i < 120; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * R * 0.95;
    const x = m + Math.cos(a) * r;
    const y = m + Math.sin(a) * r;
    const size = 40 + rnd() * 90;
    const light = rnd() < 0.55;
    const g = ctx.createRadialGradient(x, y, 0, x, y, size);
    g.addColorStop(0, light ? 'rgba(232,190,140,0.12)' : 'rgba(110,64,30,0.09)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
  }

  // 3) creamy microfoam ring where the foam meets the cup wall
  ctx.save();
  ctx.filter = 'blur(6px)';
  ctx.strokeStyle = 'rgba(236,205,166,0.85)';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(m, m, R - 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // scale the art up around the centre so it fills the cup like a real pour
  ctx.save();
  ctx.translate(m, m);
  ctx.scale(1.32, 1.32);
  ctx.translate(-m, -m + 18);

  // 4) one big latte-art heart: smooth glossy microfoam, soft edges melting into the crema
  const heartPath = (sc, dy = 0) => {
    const top = m - 150 * sc + dy;
    const tip = m + 205 * sc + dy;
    ctx.beginPath();
    ctx.moveTo(m, tip);
    ctx.bezierCurveTo(m - 175 * sc, m + 95 * sc + dy, m - 300 * sc, m - 20 * sc + dy, m - 255 * sc, m - 135 * sc + dy);
    ctx.bezierCurveTo(m - 215 * sc, m - 235 * sc + dy, m - 70 * sc, m - 250 * sc + dy, m, top);
    ctx.bezierCurveTo(m + 70 * sc, m - 250 * sc + dy, m + 215 * sc, m - 235 * sc + dy, m + 255 * sc, m - 135 * sc + dy);
    ctx.bezierCurveTo(m + 300 * sc, m - 20 * sc + dy, m + 175 * sc, m + 95 * sc + dy, m, tip);
    ctx.closePath();
  };
  ctx.save();
  // soft halo where the foam meets the crema
  ctx.filter = 'blur(7px)';
  heartPath(1.025, 3);
  ctx.fillStyle = 'rgba(226,190,148,0.4)';
  ctx.fill();
  // the heart itself
  ctx.filter = 'blur(2.5px)';
  heartPath(1, 0);
  const hg = ctx.createRadialGradient(m - 40, m - 60, 20, m, m, 300);
  hg.addColorStop(0, '#fffaf2');
  hg.addColorStop(0.7, '#fbf1e2');
  hg.addColorStop(1, '#f1dfc6');
  ctx.fillStyle = hg;
  ctx.fill();
  // a faint inner ring left by the pour (real hearts are rarely perfectly flat white)
  ctx.filter = 'blur(5px)';
  heartPath(0.62, 26);
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(214,170,122,0.1)';
  ctx.stroke();
  // glossy highlight on the fresh microfoam
  ctx.filter = 'blur(22px)';
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(m - 95, m - 110, 70, 46, -0.5, 0, Math.PI * 2);
  ctx.ellipse(m + 85, m - 115, 58, 38, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5) the pull-through: a thin crema line from the cleft into the tip, trailing out of the heart
  ctx.save();
  ctx.filter = 'blur(1.6px)';
  for (let k = 0; k < 70; k++) {
    const t = k / 69;
    ctx.fillStyle = `rgba(200,146,92,${0.18 + t * 0.4})`; // fades in towards the tip
    ctx.beginPath();
    ctx.arc(m + Math.sin(t * 3.2) * 1.5, m + 40 + t * 200, 3.6 * (1 - t * 0.6) + 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 6) a few tiny bubbles at the bottom of the stem, like a real pour
  for (let i = 0; i < 14; i++) {
    const x = m - 26 + rnd() * 52;
    const y = m + 238 + rnd() * 26;
    const r = 2 + rnd() * 4.5;
    ctx.fillStyle = 'rgba(120,78,40,0.55)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,236,0.9)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // end of the scaled latte art

  // 7) fine microfoam grain: a few thousand tiny dots (cheap — no per-pixel loop on the main thread)
  for (let i = 0; i < 6000; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * R;
    const light = rnd() < 0.5;
    ctx.fillStyle = light ? 'rgba(255,248,236,0.18)' : 'rgba(90,52,24,0.14)';
    ctx.fillRect(m + Math.cos(a) * r, m + Math.sin(a) * r, 1.6, 1.6);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Layer of liquid inside the glass, from height a to b. */
function layerGeometry() {
  const g = new THREE.CylinderGeometry(1, 1, 1, 48, 1, false);
  g.translate(0, 0.5, 0);
  return g;
}

export default function Cup({ progRef, flavor, spinRef }) {
  const turnRef = useRef({ angle: 0, speed: 0 });
  const group = useRef();
  const coffeeL = useRef();
  const cloudL = useRef();
  const milkL = useRef();
  const straw = useRef();
  const jug = useRef();
  const milkStream = useRef();

  const glassGeo = useMemo(() => new THREE.LatheGeometry(GLASS.map(([r, y]) => new THREE.Vector2(r, y)), 64), []);
  const jugGeo = useMemo(() => new THREE.LatheGeometry(JUG.map(([r, y]) => new THREE.Vector2(r, y)), 48), []);
  const layerGeo = useMemo(layerGeometry, []);
  const brushed = useMemo(brushedTexture, []);
  const foamTex = useMemo(foamTexture, []);
  const foam = useRef();
  const steamCup = useRef({ y: 1, r: 0.4, k: 0 });
  const steamJug = useRef({ y: 0.66, r: 0.2, k: 0 });
  const streamGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.035, 0.028, 1, 16, 1, true);
    g.translate(0, -0.5, 0);
    return g;
  }, []);
  const coffee = useMemo(() => new THREE.Color(flavor.liquid_color), []); // eslint-disable-line react-hooks/exhaustive-deps
  const target = useMemo(() => new THREE.Color(), []);
  const milk = useMemo(() => new THREE.Color('#ffffff'), []);
  const latte = useMemo(() => new THREE.Color(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const setLayer = (mesh, a, b) => {
    const h = Math.max(0.0001, b - a);
    mesh.visible = b - a > 0.002;
    mesh.position.y = a;
    mesh.scale.set(rAt(b), h, rAt(b));
  };

  useFrame((state, dt) => {
    const v = progRef.current.v;
    const t = state.clock.elapsedTime;
    const g = group.current;

    // glass slides in from the right before the pour
    const cin = easeOut(seg(v, 3.85, 4.15));
    g.visible = cin > 0.001;
    if (!g.visible) return;
    // once the bottle leaves, the cup moves to centre stage and grows into the hero
    const hero = easeInOut(seg(v, 4.9, 5.1));
    g.position.set(lerp(lerp(3.4, CUP_X, cin), 0, hero), TABLE_Y, 0);
    g.scale.setScalar(lerp(1, 1.4, hero));
    // after all the steps the cup turns slowly like a product on a turntable:
    // the speed eases up gently and then stays constant, so the motion is always smooth
    const turn = turnRef.current;
    const f = progRef.current.f || 0;
    const ending = f > FINALE_START; // camera going overhead, hands about to arrive
    const targetSpeed = v >= 5.99 && !ending ? 0.38 : 0;
    turn.speed += (targetSpeed - turn.speed) * (1 - Math.exp(-dt * 1.2));
    turn.angle += turn.speed * dt;
    if (v < 5.9) {
      turn.angle = 0; // replay starts from the front again
      turn.lock = null;
    }
    const spinning = (1 - cin) * -0.6 - 0.3 * hero + turn.angle;
    if (ending && turn.lock == null) {
      // ease to the nearest angle where the handle points to the lower-left, like the photo
      const want = -1.98;
      let d = (want - spinning) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      turn.from = spinning;
      turn.lock = spinning + d;
    }
    g.rotation.y = turn.lock == null ? spinning : lerp(turn.from, turn.lock, easeInOut(Math.min(1, (f - FINALE_START) / 1.8)));

    target.set(flavor.liquid_color);
    coffee.lerp(target, 1 - Math.exp(-dt * 3));

    /* ----- liquid layers ----- */
    const cf = cupFill(v) * COFFEE_IN_CUP;
    const mf = milkFill(v);
    // hot white milk sits on top, then is stirred until the whole cup is one cappuccino colour
    const mix = easeInOut(seg(v, 5.72, 5.98));
    const coffeeTop = BASE + cf;
    const milkTop = coffeeTop + mf * MILK_IN_CUP;
    latte.copy(coffee).lerp(LATTE_TINT, MILK_SHARE); // milk + this flavour's cold brew

    // the milky cloud sinks from the top to the bottom of the glass as it mixes
    const cloudBottom = lerp(coffeeTop - 0.08 * mf, BASE, mix);
    setLayer(coffeeL.current, BASE, Math.max(BASE, cloudBottom));
    coffeeL.current.visible = cloudBottom > BASE + 0.002;
    coffeeL.current.material.color.copy(coffee).lerp(latte, mix * 0.6);
    setLayer(cloudL.current, cloudBottom, lerp(coffeeTop + mf * MILK_IN_CUP * 0.5, milkTop, mix));
    cloudL.current.visible = mf > 0.01;
    cloudL.current.material.color.copy(coffee).lerp(milk, 0.35).lerp(latte, mix);
    cloudL.current.material.opacity = lerp(0.8, 1, mix) * mf;
    setLayer(milkL.current, lerp(coffeeTop + mf * MILK_IN_CUP * 0.35, milkTop, mix), milkTop);
    milkL.current.visible = mf > 0.01 && mix < 0.99;
    milkL.current.material.color.copy(milk).lerp(latte, mix);
    const liquidTop = mf > 0.01 ? milkTop : coffeeTop;
    const fo = foam.current;
    fo.visible = mix > 0.01;
    fo.position.y = liquidTop + 0.004;
    fo.scale.setScalar(rAt(liquidTop));
    fo.material.opacity = Math.min(1, mix * 1.3);
    // the foam/crema takes on the flavour colour too (it is what you see from above at the end)
    fo.material.color.copy(WHITE).lerp(coffee, FOAM_TINT);
    fo.material.emissive.copy(WHITE).lerp(latte, FOAM_TINT);
    fo.rotation.z = 0.4; // turn the heart towards the viewer

    // hot drink: steam rises from the cup as the hot milk goes in, and keeps rising afterwards
    steamCup.current.y = liquidTop + 0.05;
    steamCup.current.r = rAt(liquidTop) * 0.8;
    // fainter still once the camera is overhead, so the heart is never hidden
    steamCup.current.k = easeInOut(seg(v, 5.24, 5.6)) * (1 - 0.5 * easeInOut(Math.min(1, Math.max(0, (f - FINALE_START) / 2))));

    /* ----- milk jug ----- */
    const jIn = easeOut(seg(v, 5.08, 5.18));
    const jTilt = easeInOut(seg(v, 5.16, 5.25)) * (1 - easeInOut(seg(v, 5.74, 5.82)));
    const jOut = easeIn(seg(v, 5.82, 5.94));
    const j = jug.current;
    j.visible = jIn > 0 && jOut < 1;
    j.position.set(0.56 + (1 - jIn) * 1.4 + jOut * 1.6, 2.0 + (1 - jIn) * 0.6 + jOut * 0.5, 0);
    j.rotation.z = JUG_TILT * jTilt;
    steamJug.current.k = jIn * (1 - jOut) * 0.8; // the hot milk in the pitcher steams too

    const sIn = seg(v, 5.23, 5.27);
    const sOut = seg(v, 5.72, 5.78);
    const ms = milkStream.current;
    ms.visible = sIn > 0 && sOut < 1;
    if (ms.visible) {
      tmp.copy(SPOUT);
      j.localToWorld(tmp);
      g.worldToLocal(tmp);
      const len = Math.max(0.001, tmp.y - liquidTop);
      ms.position.set(tmp.x, tmp.y - len * easeIn(sOut), tmp.z);
      ms.scale.set(1, Math.max(0.001, len * easeOut(sIn) * (1 - sOut)), 1);
    }

    /* ----- straw ----- */
    // drops in, stirs the milk in circles, then rests against the rim
    const st = easeBack(seg(v, 5.72, 5.79));
    straw.current.visible = seg(v, 5.72, 5.79) > 0;
    const stir = seg(v, 5.77, 5.98);
    const stirAmp = Math.sin(stir * Math.PI) * 0.13; // ramps in and out
    const ang = stir * Math.PI * 2 * 3.5;
    // the straw lifts out before the hands come in
    const strawOut = 0;
    if (f > FINALE_START - 0.6) straw.current.visible = false; // removed before the camera rises
    straw.current.position.set(
      0.16 + Math.cos(ang) * stirAmp - stirAmp,
      0.85 + (1 - st) * 1.8 + strawOut * 3,
      -0.05 + Math.sin(ang) * stirAmp
    );
  });

  return (
    <group ref={group}>
      {/* liquid */}
      <mesh ref={coffeeL} geometry={layerGeo} renderOrder={1}>
        <meshPhysicalMaterial roughness={0.15} clearcoat={0.5} />
      </mesh>
      <mesh ref={cloudL} geometry={layerGeo} renderOrder={1}>
        <meshStandardMaterial roughness={0.3} transparent depthWrite={false} />
      </mesh>
      <mesh ref={milkL} geometry={layerGeo} renderOrder={1}>
        <meshStandardMaterial roughness={0.35} />
      </mesh>

      {/* cappuccino foam with latte art */}
      <mesh ref={foam} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <circleGeometry args={[1, 64]} />
        <meshPhysicalMaterial map={foamTex} emissiveMap={foamTex} emissive="#ffffff" emissiveIntensity={0.22} roughness={0.5} clearcoat={0.35} clearcoatRoughness={0.3} envMapIntensity={0.35} transparent />
      </mesh>

      {/* steam above the hot cappuccino */}
      <Steam source={steamCup} count={14} rise={1.3} size={0.6} />

      {/* straw */}
      <mesh ref={straw} rotation={[0.05, 0, -0.22]}>
        <cylinderGeometry args={[0.035, 0.035, 1.9, 20]} />
        <meshStandardMaterial color={flavor.accent_color} roughness={0.35} />
      </mesh>

      {/* mug handle */}
      <mesh position={[0.5, 0.7, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <torusGeometry args={[0.29, 0.075, 24, 48, Math.PI]} />
        <meshPhysicalMaterial color="#f7f4ef" roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.1} />
      </mesh>

      {/* glazed white ceramic mug */}
      <mesh geometry={glassGeo} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f7f4ef" roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} sheen={0.3} sheenColor="#ffffff" envMapIntensity={1.1} side={THREE.DoubleSide} />
      </mesh>

      {/* stainless-steel barista milk pitcher */}
      <group ref={jug}>
        <mesh geometry={jugGeo} castShadow>
          <meshPhysicalMaterial color="#d9d6d0" metalness={1} roughness={0.22} roughnessMap={brushed} clearcoat={0.6} clearcoatRoughness={0.15} envMapIntensity={1.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.27, 0.58, 0]} rotation={[0, 0, 0.9]}>
          <coneGeometry args={[0.07, 0.16, 24, 1, true]} />
          <meshPhysicalMaterial color="#d9d6d0" metalness={1} roughness={0.2} clearcoat={0.6} side={THREE.DoubleSide} />
        </mesh>
        <Steam source={steamJug} count={10} rise={0.8} size={0.45} />
        <mesh position={[0.29, 0.32, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.14, 0.03, 16, 32, Math.PI]} />
          <meshPhysicalMaterial color="#cfcbc4" metalness={1} roughness={0.28} roughnessMap={brushed} />
        </mesh>
      </group>

      {/* splashes where the streams hit */}
      <Splash
        progRef={progRef}
        color={flavor.accent_color}
        getHit={(v) => {
          // splashes while the coffee pours
          const k = pulse(v, 4.48, 4.86);
          return k > 0 ? { x: 0, y: BASE + cupFill(v) * COFFEE_IN_CUP, z: 0, strength: k } : null;
        }}
      />
      <Splash
        progRef={progRef}
        color="#ffffff"
        size={0.04}
        getHit={(v) => {
          const k = pulse(v, 5.25, 5.78);
          return k > 0 ? { x: 0, y: BASE + COFFEE_IN_CUP + milkFill(v) * MILK_IN_CUP, z: 0, strength: k } : null;
        }}
      />

      {/* milk stream */}
      <mesh ref={milkStream} geometry={streamGeo}>
        <meshStandardMaterial color="#f6efe6" roughness={0.3} />
      </mesh>
    </group>
  );
}
