/**
 * CinematicScroll.tsx
 *
 * A scroll-scrubbed 79-frame canvas backdrop that lives BEHIND
 * both the Home and About foreground content.
 *
 * Architecture
 * ─────────────────────────────────────────────────────────────
 *  <outer wrapper>   — tall scroll container (pin height)
 *    <sticky viewport> — sticks to top, full-screen
 *      <canvas>        — z-index 0  (background layer)
 *      <content slot>  — z-index 10 (foreground HTML)
 *    </sticky viewport>
 *  </outer wrapper>
 *
 * The canvas renders one image per animation frame.
 * GSAP ScrollTrigger maps scroll progress → frameIndex (0..78).
 * Frames are lerp'd so transitions are never hard-cut.
 * Frame 1 is shown immediately on page load (before any scroll).
 */

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 79;

const pad = (n: number) => String(n).padStart(3, '0');
const frameSrc = (n: number) => `/assets/ezgif-frame-${pad(n)}.jpg`;

interface CinematicScrollProps {
  children: React.ReactNode;
  /** Total scrollable height as multiple of 100vh. Default 7 = 700vh. */
  scrollMultiplier?: number;
}

export default function CinematicScroll({
  children,
  scrollMultiplier = 7,
}: CinematicScrollProps) {
  const outerRef   = useRef<HTMLDivElement>(null);
  const stickyRef  = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  const imagesRef  = useRef<HTMLImageElement[]>([]);
  const loadedRef  = useRef<boolean[]>(Array(TOTAL_FRAMES).fill(false));

  const frameRef   = useRef<number>(0);
  const rafRef     = useRef<number>(0);
  const targetFRef = useRef<number>(0);

  // ── Draw a single frame ────────────────────────────────────────────
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clampedIndex = Math.min(Math.max(Math.round(index), 0), TOTAL_FRAMES - 1);
    const img = imagesRef.current[clampedIndex];
    if (!img || !loadedRef.current[clampedIndex]) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const ar = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;

    let dw = cw, dh = ch, ox = 0, oy = 0;
    if (ar > cr) { dw = ch * ar; ox = (cw - dw) / 2; }
    else          { dh = cw / ar; oy = (ch - dh) / 2; }

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, ox, oy, dw, dh);
  }, []);

  // ── Smooth lerp toward target frame ───────────────────────────────
  const rafLoop = useCallback(() => {
    const diff = targetFRef.current - frameRef.current;
    if (Math.abs(diff) > 0.25) {
      frameRef.current += diff * 0.16;
      drawFrame(frameRef.current);
      rafRef.current = requestAnimationFrame(rafLoop);
    } else {
      frameRef.current = targetFRef.current;
      drawFrame(frameRef.current);
    }
  }, [drawFrame]);

  // ── Resize canvas to full viewport (DPR-aware) ────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    // Reset transform on resize, then apply DPR scale
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    drawFrame(frameRef.current);
  }, [drawFrame]);

  // ── Preload all frames; draw frame 0 the instant it loads ─────────
  useEffect(() => {
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = frameSrc(i + 1);
      const idx = i;
      img.onload = () => {
        loadedRef.current[idx] = true;
        // As soon as frame 1 (index 0) is ready, paint it immediately
        // so the canvas is never blank at the start of the page.
        if (idx === 0) {
          resizeCanvas();   // ensure canvas dimensions are set first
          drawFrame(0);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;
  }, [drawFrame, resizeCanvas]);

  // ── GSAP ScrollTrigger ─────────────────────────────────────────────
  useEffect(() => {
    const outer  = outerRef.current;
    const sticky = stickyRef.current;
    if (!outer || !sticky) return;

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Wait one tick so the DOM is fully laid out before ScrollTrigger
    // calculates positions (important with pinned elements).
    const setupTimer = setTimeout(() => {
      ScrollTrigger.refresh();

      const st = ScrollTrigger.create({
        trigger: outer,
        // Start exactly when the top of the outer wrapper hits the
        // very top of the viewport (accounting for the fixed navbar
        // via CSS scroll-margin-top on the wrapper instead).
        start: 'top top',
        end: `+=${scrollMultiplier * 100}%`,
        scrub: 1.0,
        onUpdate: (self) => {
          const f = self.progress * (TOTAL_FRAMES - 1);
          targetFRef.current = Math.min(Math.max(f, 0), TOTAL_FRAMES - 1);
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(rafLoop);
        },
        // When scroll resets to 0 (e.g. page refresh), force frame 0
        onLeaveBack: () => {
          targetFRef.current = 0;
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(rafLoop);
        },
      });

      return () => st.kill();
    }, 50);

    return () => {
      clearTimeout(setupTimer);
      ScrollTrigger.getAll().forEach((s) => s.kill());
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scrollMultiplier, resizeCanvas, rafLoop]);

  return (
    <div
      ref={outerRef}
      id="story-container"
      style={{ height: `${scrollMultiplier * 100}vh` }}
      className="relative w-full"
    >
      {/* Sticky viewport — stays fixed at top while outer scrolls */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full h-screen overflow-hidden"
        style={{ zIndex: 1 }}
      >
        {/* ── Background canvas ── */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none select-none"
          style={{
            zIndex: 0,
            transformOrigin: 'center center',
          }}
        />

        {/* ── Left vignette for text readability ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background: `linear-gradient(
              to right,
              rgba(255,255,255,0.80) 0%,
              rgba(255,255,255,0.50) 30%,
              rgba(255,255,255,0.08) 60%,
              transparent 100%
            )`,
          }}
        />

        {/* ── Foreground content (Hero + About) ── */}
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{ zIndex: 10 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
