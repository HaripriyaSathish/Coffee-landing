'use client';

import { Component, Fragment } from 'react';

const MAX_RETRIES = 3;

/**
 * Catches errors from a 3D canvas (no WebGL, GPU blocked, context lost) so the rest of the banner
 * keeps working. A lost graphics context is usually temporary, so it first remounts the canvas a few
 * times (quietly, after a short pause); only if that keeps failing does it render `fallback`.
 */
export default class SafeCanvas extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, attempt: 0, gaveUp: false };
    this.timer = null;
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    const next = this.state.attempt + 1;
    if (next <= MAX_RETRIES) {
      console.warn(`[3D] restarting after error (${next}/${MAX_RETRIES}):`, error?.message || error);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.setState({ failed: false, attempt: next }), 700 * next);
    } else {
      console.warn('[3D disabled]', error?.message || error);
      this.setState({ gaveUp: true });
      this.props.onError?.();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  componentDidMount() {
    // no WebGL at all (blocked GPU, some in-app browsers): show the fallback straight away instead of
    // letting the renderer throw an uncaught error and leave an empty box
    if (!hasWebGL()) {
      this.setState({ gaveUp: true });
      this.props.onError?.();
    }
  }

  render() {
    if (this.state.gaveUp) return this.props.fallback ?? null;
    if (this.state.failed) return null; // brief pause before the next attempt
    // a new key gives the canvas a fresh WebGL context on every retry
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}

/** True when the browser can create a WebGL context at all. */
let webglSupport; // checked once: each probe creates a (throwaway) GPU context
export function hasWebGL() {
  if (typeof window === 'undefined') return true;
  if (webglSupport === undefined) {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      webglSupport = !!gl;
      gl?.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context right away
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}
