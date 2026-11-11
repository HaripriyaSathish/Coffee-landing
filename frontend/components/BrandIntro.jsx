'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import SafeCanvas from './SafeCanvas';

const IntroBean = dynamic(() => import('./IntroBean'), { ssr: false });

// timeline (seconds) — must match the CSS animation delays in globals.css (.intro …)
const DONE_AT = 5.4; // curtains are opening: start the home page reveal + the coffee process
const EXIT_AT = 6.85; // curtains fully open: remove the intro
const SKIP_EXIT = 0.9; // when skipped: time for the quick curtain opening (.intro.is-skipping)

/**
 * Branding intro that plays before the coffee-making animation: the 3D bean glides in, the brand name
 * rises letter by letter, the tagline fades up, then the curtains part to reveal the banner.
 * Tapping / clicking anywhere (or pressing a key) skips straight to the opening.
 *
 * All motion is CSS (transform + opacity only), and it only starts once `ready` is true (the 3D scene
 * has loaded and compiled its shaders). Loading the scene while the intro moved made it stutter even on
 * the compositor thread (shader compiling also blocks the GPU), so until then the curtains stay closed
 * with a small spinner. `gone` hides it after the curtains have opened; it stays mounted (bean paused)
 * because tearing down its 3D canvas caused a freeze right as the coffee process started.
 */
export default function BrandIntro({ brand, tagline, eyebrow, onDone, onExit, ready, gone }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const exitRef = useRef(onExit);
  exitRef.current = onExit;
  const timers = useRef([]);
  const fired = useRef({ done: false, exit: false });
  const wantSkip = useRef(false);
  const [running, setRunning] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [beanOff, setBeanOff] = useState(false);

  const done = useCallback(() => {
    if (fired.current.done) return;
    fired.current.done = true;
    setBeanOff(true); // the logo has faded out by now: stop drawing it
    doneRef.current?.();
  }, []);
  const exit = useCallback(() => {
    if (fired.current.exit) return;
    fired.current.exit = true;
    done(); // make sure the home page reveal has started
    exitRef.current?.();
  }, [done]);

  const open = useCallback(() => {
    // quick opening (skipped, or skipped while still loading)
    timers.current.forEach(clearTimeout);
    setSkipping(true);
    done();
    timers.current = [setTimeout(exit, SKIP_EXIT * 1000)];
  }, [done, exit]);

  // start the intro once the scene is ready (or open straight away if it was skipped while loading)
  useEffect(() => {
    if (!ready || running || fired.current.done) return undefined;
    if (wantSkip.current) {
      open();
      return undefined;
    }
    setRunning(true);
    timers.current = [setTimeout(done, DONE_AT * 1000), setTimeout(exit, EXIT_AT * 1000)];
    return undefined;
  }, [ready, running, done, exit, open]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const skip = useCallback(() => {
    if (fired.current.done) return; // already opening
    if (!ready) {
      wantSkip.current = true; // opens as soon as the scene is ready (opening earlier would stutter)
      return;
    }
    open();
  }, [ready, open]);

  useEffect(() => {
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [skip]);

  const cls = ['intro', running ? 'is-running' : 'is-waiting', skipping && 'is-skipping', gone && 'is-gone'];
  return (
    <div className={cls.filter(Boolean).join(' ')} aria-hidden="true" onClick={skip}>
      <div className="intro-top" />
      <div className="intro-bottom" />
      <p className="intro-loading"><span />Brewing</p>
      <div className="intro-inner">
        <div className="intro-logo intro-bean">
          <div className="intro-float">
            <SafeCanvas>
              <IntroBean paused={beanOff || gone} />
            </SafeCanvas>
          </div>
        </div>
        <h2 className="intro-brand">
          {Array.from(brand).map((c, i) => (
            <span className="intro-ch" key={i} style={{ '--i': i }}>
              {c}
            </span>
          ))}
        </h2>
        <span className="intro-line" />
        <p className="intro-sub" style={{ '--i': 0 }}>{tagline}</p>
        <p className="intro-sub small" style={{ '--i': 1 }}>{eyebrow}</p>
      </div>
    </div>
  );
}
