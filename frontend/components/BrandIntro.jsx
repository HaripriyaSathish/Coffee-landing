'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import SafeCanvas from './SafeCanvas';

const IntroBean = dynamic(() => import('./IntroBean'), { ssr: false });

// timeline (seconds) — must match the CSS animation delays in globals.css (.intro …)
const DONE_AT = 5.4; // curtains are opening: start the home page reveal + the coffee process
const EXIT_AT = 6.85; // curtains fully open: remove the intro

/**
 * Branding intro that plays before the coffee-making animation: the 3D bean glides in, the brand name
 * rises letter by letter, the tagline fades up, then the curtains part to reveal the banner.
 *
 * All motion is CSS (transform + opacity only). Browsers run these on the compositor thread, so the
 * intro stays perfectly smooth even while the main thread is busy loading and compiling the 3D scene.
 */
export default function BrandIntro({ brand, tagline, eyebrow, onDone, onExit }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  useEffect(() => {
    const t1 = setTimeout(() => doneRef.current?.(), DONE_AT * 1000);
    const t2 = setTimeout(() => exitRef.current?.(), EXIT_AT * 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="intro" aria-hidden="true">
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
