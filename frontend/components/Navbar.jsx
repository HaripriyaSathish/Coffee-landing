'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import dynamic from 'next/dynamic';
import SafeCanvas from './SafeCanvas';

// realistic 3D roasted bean as the logo mark (flat icon shows while it loads)
const LogoBean = dynamic(() => import('./IntroBean'), { ssr: false, loading: () => <BeanLogo /> });

function BeanLogo() {
  return (
    <svg className="bean-logo" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <ellipse cx="16" cy="16" rx="10" ry="14" transform="rotate(28 16 16)" fill="var(--accent)" />
      <path d="M11 5 C 20 12, 12 20, 21 27" stroke="var(--cream)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Text that rolls to a copy of itself on hover. */
const Roll = ({ children }) => (
  <span className="roll"><span data-t={children}>{children}</span></span>
);

export default function Navbar({ settings, nav }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.nav-logo .ch', { yPercent: 120, opacity: 0, duration: 0.8, stagger: 0.05, delay: 0.2, ease: 'back.out(2)' });
      gsap.from('.logo-bean', { scale: 0, duration: 1.2, ease: 'back.out(1.6)' });
      gsap.from('.nav-links a', { y: -16, opacity: 0, duration: 0.6, stagger: 0.07, delay: 0.4, ease: 'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <header className={`nav ${open ? 'is-open' : ''}`} ref={ref}>
      <a href="#" className="nav-logo" aria-label={settings.brand_name}>
        <span className="logo-bean"><SafeCanvas fallback={<BeanLogo />}><LogoBean small /></SafeCanvas></span>
        <span>
          <b aria-hidden="true">{Array.from(settings.brand_name).map((c, i) => <span className="ch" key={i}>{c}</span>)}</b>
          <small>{settings.brand_tagline}</small>
        </span>
      </a>

      <nav className="nav-links" aria-label="Main">
        {nav.map((l, i) => (
          <a key={l.id ?? i} href={l.url} className={i === 0 ? 'active' : ''} onClick={() => setOpen(false)}>
            <Roll>{l.label}</Roll>
          </a>
        ))}
      </nav>

      <div className="nav-right">
        <button className="icon-btn magnetic" aria-label="Search" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </button>
        <button className="icon-btn cart magnetic" aria-label="Cart" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
          <i>2</i>
        </button>
        <a href={settings.nav_cta_url} className="btn-pill magnetic"><Roll>{settings.nav_cta_text}</Roll></a>
        <button className="burger" aria-label="Menu" aria-expanded={open} type="button" onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </div>
    </header>
  );
}
