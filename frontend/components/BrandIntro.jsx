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
 * All motion is CSS (transform + opacity only). Browsers run these on the compositor thread, so the
 * intro stays perfectly smooth even while the main thread is busy loading and compiling the 3D scene.
 */
export default function BrandIntro({ brand, tagline, eyebrow, onDone, onExit }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const exitRef = useRef(onExit);
  exitRef.current = onExit;
  const timers = useRef([]);
  const fired = useRef({ done: false, exit: false });
  const [skipping, setSkipping] = useState(false);

  const done = useCallback(() => {
    if (fired.current.done) return;
    fired.current.done = true;
    doneRef.current?.();
  }, []);
  const exit = useCallback(() => {
    if (fired.current.exit) return;
    fired.current.exit = true;
    done(); // make sure the home page reveal has started
    exitRef.current?.();
  }, [done]);

  useEffect(() => {
    timers.current = [setTimeout(done, DONE_AT * 1000), setTimeout(exit, EXIT_AT * 1000)];
    return () => timers.current.forEach(clearTimeout);
  }, [done, exit]);

  const skip = useCallback(() => {
    if (fired.current.done) return; // already opening
    timers.current.forEach(clearTimeout);
    setSkipping(true);
    done();
    timers.current = [setTimeout(exit, SKIP_EXIT * 1000)];
  }, [done, exit]);

  useEffect(() => {
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [skip]);

  return (
    <div className={`intro${skipping ? ' is-skipping' : ''}`} aria-hidden="true" onClick={skip}>
      <div className="intro-top" />
      <div className="intro-bottom" />
      <div className="intro-inner">
        <div className="intro-logo intro-bean">
          <div className="intro-float">
            <SafeCanvas>
              <IntroBean />
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
