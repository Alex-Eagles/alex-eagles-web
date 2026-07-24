/**
 * WebGLBoundary — catches 3D failures and hands over to the 2D timeline.
 *
 * ─── WHY THIS IS NOT OPTIONAL ───────────────────────────────────────────────
 * WebGL fails in ways ordinary React code does not. A phone under memory
 * pressure can have its GPU context taken away mid-session; a driver can
 * reject a shader that compiles fine everywhere else; a browser extension or
 * privacy mode can block the context entirely. None of these are bugs we can
 * fix from here, and all of them are invisible to a normal try/catch because
 * they surface during render.
 *
 * Without a boundary, any of them takes down the whole React tree — the
 * visitor gets a blank page, not just a missing animation. With one, the worst
 * case is that they read the team's history as a clean vertical timeline and
 * never know anything was supposed to be different.
 *
 * This is a class component because error boundaries have no hooks equivalent;
 * `componentDidCatch` has no functional counterpart in React 18.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rendered instead of `children` once something has gone wrong. */
  fallback: ReactNode;
  /** Notifies the parent so it can stop trying to mount the 3D scene. */
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
}

export default class WebGLBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logged rather than swallowed: a silent fallback would hide a real,
    // fixable bug behind a graceful degradation forever.
    console.error("History 3D scene failed, falling back to timeline:", error, info);
    this.props.onError?.(error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
