'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

/** Headline split into words + letters. Letters rise in; accent (every 2nd) words keep a gentle wave. */
export function SplitTitle({ text, className = 'title', delay = 0 }) {
  const ref = useRef(null);
  // split on spaces, and allow a line break after hyphens ("STONE-" / "GROUND")
  const words = text.split(' ').flatMap((w) => w.split(/(?<=-)(?=.)/));

  useLayoutEffect(() => {
    const el = ref.current;
    const ctx = gsap.context(() => {
      gsap.fromTo('.ch',
        { yPercent: 115, rotate: 10, opacity: 0 },
        { yPercent: 0, rotate: 0, opacity: 1, duration: 0.9, delay, stagger: 0.022, ease: 'power4.out' });
      const accent = el.querySelectorAll('.w:nth-child(2n) .ch');
      if (accent.length) {
        gsap.to(accent, {
          y: -5, duration: 1.1, ease: 'sine.inOut', delay: delay + 1,
          stagger: { each: 0.07, repeat: -1, yoyo: true },
        });
      }
    }, el);
    return () => ctx.revert();
  }, [text, delay]);

  return (
    <h1 className={className} ref={ref} aria-label={text}>
      {words.map((w, i) => (
        <span className={`w${w.endsWith('-') ? ' join' : ''}`} key={`${w}-${i}`} aria-hidden="true">
          <span>
            {Array.from(w).map((c, j) => <span className="ch" key={j}>{c}</span>)}
          </span>
        </span>
      ))}
    </h1>
  );
}

/** Paragraph that fades in word by word. */
export function SplitWords({ text, className = 'lede', delay = 0.25 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.lw',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, delay, stagger: 0.018, ease: 'power2.out' });
    }, ref);
    return () => ctx.revert();
  }, [text, delay]);
  return (
    <p className={className} ref={ref}>
      {text.split(' ').map((w, i) => <span className="lw" key={i}>{w} </span>)}
    </p>
  );
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/';

/** Text that "decodes" from random glyphs into the real text. */
export function Scramble({ text, duration = 900, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const shown = Math.floor(p * text.length);
      let out = text.slice(0, shown);
      for (let i = shown; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);
  return <span ref={ref} className={className} aria-label={text}>{text}</span>;
}

/** Counts the number inside a value like "18h", "100%", "4.99". */
export function CountUp({ value, duration = 1.4, delay = 0.2 }) {
  const ref = useRef(null);
  const str = String(value);
  useEffect(() => {
    const m = str.match(/^([^\d]*)([\d.,]+)(.*)$/);
    const el = ref.current;
    if (!m || !el) return undefined;
    const [, pre, num, post] = m;
    const target = parseFloat(num.replace(',', ''));
    const decimals = (num.split('.')[1] || '').length;
    const obj = { n: 0 };
    const tw = gsap.to(obj, {
      n: target, duration, delay, ease: 'power3.out',
      onUpdate: () => { el.textContent = `${pre}${obj.n.toFixed(decimals)}${post}`; },
    });
    return () => tw.kill();
  }, [str, duration, delay]);
  return <span ref={ref}>{str}</span>;
}

/** Big outlined background word: letters drop in each time the word changes. */
export function BgWord({ word }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.bl',
        { yPercent: 60, opacity: 0, rotateX: -80 },
        { yPercent: 0, opacity: 1, rotateX: 0, duration: 1.1, stagger: 0.04, ease: 'expo.out' });
    }, ref);
    return () => ctx.revert();
  }, [word]);
  const letters = (w, k) => Array.from(w).map((c, i) => <span className="bl" key={`${k}${i}`}>{c}</span>);
  return (
    <div className="bg-word" ref={ref}>
      <span>{letters(word, 'a')}</span>
      <span>{letters(word, 'b')}</span>
    </div>
  );
}
