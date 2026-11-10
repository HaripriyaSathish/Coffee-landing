'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import Navbar from './Navbar';
import BrandIntro from './BrandIntro';
import SafeCanvas from './SafeCanvas';
import { SplitTitle, SplitWords, Scramble, CountUp, BgWord } from './AnimatedText';

const Scene = dynamic(() => import('./scene/Scene'), { ssr: false });

const TOTAL = 6; // number of animation steps
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const pad = (n) => String(n).padStart(2, '0');

export default function Banner({ data, live }) {
  const { settings, nav, flavors, steps } = data;

  const progRef = useRef({ v: 0 });
  const spinRef = useRef({ target: 0, drag: 0, vel: 0 });
  const tlRef = useRef(null);
  const fillRefs = useRef([]);
  const contentRef = useRef(null);
  const rootRef = useRef(null);
  const lastStep = useRef(-1);
  const drag = useRef({ on: false, x: 0 });

  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [intro, setIntro] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  // never wait forever: continue after 12s even on a very slow GPU
  useEffect(() => {
    const id = setTimeout(() => setSceneReady(true), 12000);
    return () => clearTimeout(id);
  }, []);
  const [flavorIdx, setFlavorIdx] = useState(0);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ state: 'idle', msg: '' });

  const flavor = flavors[flavorIdx] || flavors[0];
  const step = steps[stepIdx];

  /* ---------------- master timeline ---------------- */
  const onUpdate = useCallback(() => {
    const v = progRef.current.v;
    const idx = Math.min(TOTAL - 1, Math.floor(v));
    if (idx !== lastStep.current) {
      lastStep.current = idx;
      setStepIdx(idx);
    }
    fillRefs.current.forEach((el, i) => {
      if (el) el.style.transform = `scaleX(${Math.min(1, Math.max(0, v - i))})`;
    });
  }, []);

  const play = useCallback((from = 0) => {
    tlRef.current?.kill();
    setDone(false);
    progRef.current.v = from;
    lastStep.current = -1;
    onUpdate();
    const tl = gsap.timeline({ onUpdate, onComplete: () => setDone(true) });
    for (let i = from; i < TOTAL; i++) {
      tl.to(progRef.current, { v: i + 1, duration: steps[i].duration_sec, ease: 'none' });
    }
    tlRef.current = tl;
  }, [onUpdate, steps]);

  const skip = useCallback(() => {
    tlRef.current?.kill();
    tlRef.current = gsap.to(progRef.current, {
      v: TOTAL, duration: 1.4, ease: 'power2.inOut', onUpdate, onComplete: () => setDone(true),
    });
  }, [onUpdate]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // preview helper: ?at=4.5 freezes the animation at that point (0–6)
    const at = parseFloat(new URLSearchParams(window.location.search).get('at'));
    if (!Number.isNaN(at)) {
      progRef.current.v = Math.min(TOTAL, Math.max(0, at));
      onUpdate();
      if (at >= TOTAL) setDone(true);
      return undefined;
    }
    if (reduce) {
      progRef.current.v = TOTAL;
      onUpdate();
      setDone(true);
    } else {
      setIntro(true); // brand intro first; the process starts when it finishes
    }
    return () => tlRef.current?.kill();
  }, [onUpdate]);

  // the curtains are opening: start the process and reveal the home page like a camera focusing in
  const endIntro = useCallback(() => {
    // the opening is a CSS animation (.is-revealing in globals.css): it runs on the compositor
    // thread, so it stays smooth while the 3D scene renders its first frames
    rootRef.current?.classList.add('is-revealing');
    // start the process a beat later, once the opening is already moving
    setTimeout(() => play(0), 350);
  }, [play]);

  // curtains fully open: remove the intro
  const finishIntro = useCallback(() => setIntro(false), []);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.reveal',
        { y: 34, opacity: 0, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.85, stagger: 0.07, ease: 'power3.out' });
    }, contentRef);
    return () => ctx.revert();
  }, [stepIdx, done, flavorIdx]);

  /* ---------------- magnetic buttons ---------------- */
  useEffect(() => {
    const root = rootRef.current;
    const move = (e) => {
      const mag = e.target.closest?.('.magnetic, .btn-main, .switcher .arrow');
      root.querySelectorAll('.is-magnet').forEach((el) => {
        if (el !== mag) {
          el.classList.remove('is-magnet');
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        }
      });
      if (mag) {
        const r = mag.getBoundingClientRect();
        mag.classList.add('is-magnet');
        gsap.to(mag, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.3,
          y: (e.clientY - (r.top + r.height / 2)) * 0.4,
          duration: 0.4, ease: 'power3.out',
        });
      }
    };
    root.addEventListener('pointermove', move);
    return () => root.removeEventListener('pointermove', move);
  }, []);

  /* ---------------- interactions ---------------- */
  const changeFlavor = useCallback((dir) => {
    setFlavorIdx((i) => (i + dir + flavors.length) % flavors.length);
    spinRef.current.target += Math.PI * 2 * Math.sign(dir || 1);
    setForm({ state: 'idle', msg: '' });
  }, [flavors.length]);

  const pickFlavor = (i) => {
    if (i === flavorIdx) return;
    changeFlavor(i - flavorIdx);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (!done || e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') changeFlavor(1);
      if (e.key === 'ArrowLeft') changeFlavor(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, changeFlavor]);

  const onPointerDown = (e) => { drag.current = { on: true, x: e.clientX }; };
  const onPointerMove = (e) => {
    if (!drag.current.on) return;
    spinRef.current.vel = (e.clientX - drag.current.x) * 0.006;
    drag.current.x = e.clientX;
  };
  const onPointerUp = () => { drag.current.on = false; };

  const submit = async (e) => {
    e.preventDefault();
    setForm({ state: 'loading', msg: '' });
    try {
      const res = await fetch(`${API}/api/preorder.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, flavor_id: flavor.id }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Something went wrong.');
      setForm({ state: 'ok', msg: json.message || settings.form_success_text });
      setEmail('');
    } catch (err) {
      setForm({ state: 'err', msg: err.message === 'Failed to fetch' ? 'Server is offline. Start the PHP API and try again.' : err.message });
    }
  };

  /* ---------------- render ---------------- */
  const bg = done ? flavor.bg_color : step.bg_color;
  const bigWord = done ? flavor.name.split(' ')[0] : step.step_label;
  const headline = done ? flavor.headline : step.title;

  return (
    <section
      ref={rootRef}
      className={`banner ${done ? 'is-done' : 'is-playing'}`}
      style={{ '--bg': bg, '--accent': flavor.accent_color, '--label': flavor.label_color }}
      aria-label="ColdPress cold brew"
    >
      {/* background */}
      <div className="bg" aria-hidden="true">
        <div className="bg-glow g1" />
        <div className="bg-glow g2" />
        <div className="bg-glow g3" />
        <div className="bg-grid" />
        <BgWord word={bigWord} />
        <div className="bg-grain" />
      </div>

      {/* 3D */}
      <div
        className="canvas-wrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <SafeCanvas onError={onSceneReady}>
          <Scene progRef={progRef} flavor={flavor} brand={settings.brand_name} spinRef={spinRef} bg={bg} onReady={onSceneReady} />
        </SafeCanvas>
      </div>

      <Navbar settings={settings} nav={nav} />

      {/* copy */}
      <div className="content" ref={contentRef}>
        {!done ? (
          <div className="copy" key={`step-${stepIdx}`}>
            <span className="eyebrow reveal">
              <i className="pulse" /> <Scramble text={`Step ${pad(stepIdx + 1)} / ${pad(TOTAL)} · ${step.step_label}`} />
            </span>
            <SplitTitle text={headline} />
            <SplitWords text={step.description} />
          </div>
        ) : (
          <div className="copy" key={`flavor-${flavor.id}`}>
            <SplitTitle text={headline} delay={0.1} />
            <SplitWords text={flavor.description} delay={0.4} />

            <div className="meta reveal">
              <div className="price"><small>$</small><CountUp value={Number(flavor.price).toFixed(2)} duration={1.2} delay={0.5} /></div>
              <div className="meta-item"><small>Volume</small>{flavor.volume}</div>
              <div className="meta-item"><small>Caffeine</small>{flavor.caffeine}</div>
            </div>

            <form className="preorder reveal" onSubmit={submit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={settings.form_placeholder}
                aria-label="Email"
              />
              <button type="submit" className="btn-main" disabled={form.state === 'loading'}>
                {form.state === 'loading' ? 'Saving…' : settings.primary_cta_text}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
            {form.msg && <p className={`form-msg ${form.state}`} role="status">{form.msg}</p>}
          </div>
        )}
      </div>

      {/* bottom: process timeline + flavor switcher */}
      <div className="bottom">
        <ol className="process" aria-label="Brewing process">
          {steps.map((s, i) => (
            <li key={s.scene_key} className={i === stepIdx && !done ? 'current' : i < stepIdx || done ? 'past' : ''}>
              <button type="button" onClick={() => play(i)} aria-label={`Play from step ${i + 1}: ${s.step_label}`}>
                <span className="num">{pad(i + 1)}</span>
                <span className="lbl">{s.step_label}</span>
                <span className="bar"><span className="fill" ref={(el) => (fillRefs.current[i] = el)} /></span>
              </button>
            </li>
          ))}
          <li className="replay">
            <button type="button" onClick={() => play(0)} aria-label="Replay the brewing animation">↻ Replay</button>
          </li>
        </ol>

        <div className={`switcher ${done ? 'show' : ''}`} aria-hidden={!done}>
          <button type="button" className="arrow" onClick={() => changeFlavor(-1)} aria-label="Previous flavor" tabIndex={done ? 0 : -1}>←</button>
          <span className="flavor-label">Flavours</span>
          <div className="tabs">
            {flavors.map((f, i) => (
              <button
                type="button"
                key={f.id}
                className={i === flavorIdx ? 'on' : ''}
                style={{ '--c': f.liquid_color }}
                onClick={() => pickFlavor(i)}
                tabIndex={done ? 0 : -1}
              >
                <i aria-hidden="true" />{f.name}
              </button>
            ))}
          </div>
          <button type="button" className="arrow" onClick={() => changeFlavor(1)} aria-label="Next flavor" tabIndex={done ? 0 : -1}>→</button>
        </div>
      </div>

      {!live && <div className="offline">Demo content · PHP API offline</div>}
      {intro && (
        <BrandIntro
          brand={settings.brand_name}
          tagline={settings.brand_tagline}
          eyebrow={settings.eyebrow}
          onDone={endIntro}
          onExit={finishIntro}
          ready={sceneReady}
        />
      )}
    </section>
  );
}
