import { useEffect, useRef } from 'react';

type Phase = 'idle' | 'seeking' | 'answered';

interface Mote {
  /** Distance from the centre (0–1 of the sphere), polar angle, longitude, and turning speed. */
  r: number;
  phi: number;
  a: number;
  w: number;
  size: number;
  hue: 'gold' | 'violet' | 'teal' | 'white';
}

const COLORS: Record<Mote['hue'], string> = { gold: '255, 214, 140', violet: '176, 150, 255', teal: '120, 214, 230', white: '255, 250, 240' };
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A living crystal ball: a sphere of deep night glass with a slow nebula of light turning inside it.
 * Touch it and the light gathers under your finger; hold it and the swirl quickens; while the Oracle
 * reads, the nebula spins into a vortex; with the answer, a warm core of light stays lit.
 */
export function CrystalOrb({ phase, quiet = false, onHoldChange }: { phase: Phase; quiet?: boolean; onHoldChange?: (holding: boolean) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ phase, quiet, touch: null as null | { x: number; y: number }, hold: 0, spin: 1, glow: 0.25 });
  state.current.phase = phase;
  state.current.quiet = quiet;

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const s = cv.clientWidth;
      cv.width = s * dpr;
      cv.height = s * dpr;
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(cv);

    const hues: Mote['hue'][] = ['gold', 'gold', 'violet', 'teal', 'white'];
    // A loose galaxy: most light in a tilted swirl, the rest scattered through the whole sphere.
    const motes: Mote[] = Array.from({ length: 190 }, (_, i) => ({
      r: Math.cbrt(Math.random()) * 0.86,
      phi: i % 3 === 0 ? Math.acos(2 * Math.random() - 1) : Math.PI / 2 + (Math.random() - 0.5) * 0.7,
      a: Math.random() * Math.PI * 2,
      w: (0.1 + Math.random() * 0.3) * (i % 9 === 0 ? -1 : 1),
      size: 0.6 + Math.random() * 1.8,
      hue: hues[i % hues.length],
    }));
    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = state.current;
      const W = cv.width;
      const R = W / 2;
      // Spin and glow ease toward the phase's target.
      const targetSpin = st.phase === 'seeking' ? 7 : 1 + st.hold * 5 + (st.touch ? 1.5 : 0);
      const targetGlow = st.phase === 'answered' ? 1 : st.phase === 'seeking' ? 0.6 + 0.3 * Math.sin(now / 160) : 0.22 + st.hold * 0.5;
      st.spin += (targetSpin - st.spin) * Math.min(1, dt * 3);
      st.glow += (targetGlow - st.glow) * Math.min(1, dt * 2.5);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, W);
      ctx.save();
      ctx.beginPath();
      ctx.arc(R, R, R - 1, 0, Math.PI * 2);
      ctx.clip();

      // Deep glass.
      const base = ctx.createRadialGradient(R * 0.7, R * 0.6, R * 0.05, R, R, R);
      base.addColorStop(0, '#2c3f86');
      base.addColorStop(0.45, '#141f52');
      base.addColorStop(1, '#050817');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, W);

      // A soft nebula cloud that drifts.
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) {
        const t = now / 9000 + k * 2.1;
        const cx = R + Math.cos(t * st.spin * 0.6) * R * 0.28;
        const cy = R + Math.sin(t * st.spin * 0.5) * R * 0.22;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.75);
        const c = k === 0 ? '120, 90, 220' : k === 1 ? '60, 150, 200' : '200, 120, 160';
        g.addColorStop(0, `rgba(${c}, 0.22)`);
        g.addColorStop(1, `rgba(${c}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, W);
      }

      // Motes of light orbiting in 3D, pulled toward a finger.
      for (const m of motes) {
        m.a += m.w * st.spin * dt;
        // Rotate around a tilted axis, then project.
        const sx = Math.sin(m.phi) * Math.cos(m.a) * m.r;
        const sy = Math.cos(m.phi) * m.r;
        const sz = Math.sin(m.phi) * Math.sin(m.a) * m.r;
        const tilt = 0.45;
        const x3 = sx;
        const y3 = sy * Math.cos(tilt) - sz * Math.sin(tilt);
        const z3 = sy * Math.sin(tilt) + sz * Math.cos(tilt);
        let x = R + x3 * R;
        let y = R + y3 * R;
        if (st.touch) {
          const dx = st.touch.x * W - x;
          const dy = st.touch.y * W - y;
          const pull = 0.35 / (1 + (dx * dx + dy * dy) / (R * R * 0.08));
          x += dx * pull;
          y += dy * pull;
        }
        const depth = (z3 + 1) / 2;
        // Keep the middle clear while words are showing.
        const middle = st.quiet ? Math.min(1, Math.abs(y - R) / (R * 0.38)) : 1;
        const alpha = (0.2 + depth * 0.7) * (0.25 + 0.75 * middle);
        const s = m.size * dpr * (0.7 + depth * 0.7);
        ctx.fillStyle = `rgba(${COLORS[m.hue]}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }

      // The core: a warm light that rises with the answer.
      const core = ctx.createRadialGradient(R, R * 1.02, 0, R, R, R * 0.7);
      core.addColorStop(0, `rgba(255, 224, 160, ${0.55 * st.glow})`);
      core.addColorStop(0.5, `rgba(240, 180, 100, ${0.18 * st.glow})`);
      core.addColorStop(1, 'rgba(240, 180, 100, 0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, W, W);

      // Glass: dark rim, bright fresnel edge, refracted light pooling at the bottom.
      ctx.globalCompositeOperation = 'source-over';
      const rim = ctx.createRadialGradient(R, R, R * 0.72, R, R, R);
      rim.addColorStop(0, 'rgba(0,0,0,0)');
      rim.addColorStop(0.85, 'rgba(4, 6, 20, 0.35)');
      rim.addColorStop(0.97, 'rgba(170, 200, 255, 0.28)');
      rim.addColorStop(1, 'rgba(230, 240, 255, 0.5)');
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, W, W);
      const pool = ctx.createRadialGradient(R, R * 1.75, 0, R, R * 1.75, R * 0.6);
      pool.addColorStop(0, `rgba(255, 210, 140, ${0.25 + 0.3 * st.glow})`);
      pool.addColorStop(1, 'rgba(255, 210, 140, 0)');
      ctx.fillStyle = pool;
      ctx.fillRect(0, 0, W, W);
      ctx.restore();

      if (!reduced()) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, []);

  // Holding the ball builds the swirl; letting go settles it.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const st = state.current;
      st.hold = st.touch ? Math.min(1, st.hold + 0.02) : Math.max(0, st.hold - 0.04);
      raf = requestAnimationFrame(tick);
    };
    if (!reduced()) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const at = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  return (
    <canvas
      ref={canvas}
      className="crystal-canvas"
      aria-hidden="true"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        state.current.touch = at(e);
        onHoldChange?.(true);
      }}
      onPointerMove={(e) => {
        if (state.current.touch) state.current.touch = at(e);
      }}
      onPointerUp={() => {
        state.current.touch = null;
        onHoldChange?.(false);
      }}
      onPointerCancel={() => {
        state.current.touch = null;
        onHoldChange?.(false);
      }}
    />
  );
}
