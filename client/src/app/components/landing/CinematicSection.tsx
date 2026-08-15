import { useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Target, Search, BookOpen } from 'lucide-react';
import { animate } from 'animejs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { heroData, aboutData } from '../../lib/landingData';

gsap.registerPlugin(ScrollTrigger);

// Play the full image sequence from frame 8 to 79.
const ACTIVE_FRAME_NUMBERS = Array.from({ length: 72 }, (_, index) => index + 8);
const TOTAL_FRAMES = ACTIVE_FRAME_NUMBERS.length;
// A shorter pinned range makes each wheel/trackpad movement advance the
// sequence more while the interpolated renderer keeps that movement smooth.
const SCROLL_VH = 420;

const pad = (n: number) => String(n).padStart(3, '0');
const frameSrc = (n: number) => `/assets/ezgif-frame-${pad(n)}.jpg`;

function smoothStep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export default function CinematicSection() {
  const outerRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const homeRef   = useRef<HTMLDivElement>(null);
  const aboutRef  = useRef<HTMLDivElement>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<boolean[]>(Array(TOTAL_FRAMES).fill(false));
  const dprRef    = useRef(1);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  // ── Draw cover-fit image onto canvas ─────────────────────────────
  const drawCover = useCallback((
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    w: number, h: number
  ) => {
    const ar = img.naturalWidth / img.naturalHeight;
    const cr = w / h;
    let dw = w, dh = h, ox = 0, oy = 0;
    if (ar > cr) {
      dw = h * ar;
      // On mobile / portrait displays, align image right to keep the student visible.
      if (w < 768) {
        ox = w - dw;
      } else {
        ox = (w - dw) / 2;
      }
    }
    else          { dh = w / ar; oy = (h - dh) / 2; }
    ctx.drawImage(img, ox, oy, dw, dh);
  }, []);

  const render = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = dprRef.current;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const raw   = Math.min(Math.max(progress * (TOTAL_FRAMES - 1), 0), TOTAL_FRAMES - 1);
    // The source images already contain the motion. Blending adjacent frames
    // creates double faces/hands, so render the closest complete image only.
    const frame = Math.round(raw);
    const image = imagesRef.current[frame];
    const hasFrame = Boolean(image && loadedRef.current[frame]);

    // Keep the previous draw while a requested frame is still loading. Clearing
    // first produces a visible white/blank flash during a quick wheel gesture.
    if (hasFrame) {
      ctx.clearRect(0, 0, w, h);
    }

    if (hasFrame && image) {
      ctx.globalAlpha = 1;
      drawCover(ctx, image, w, h);
    }
    ctx.globalAlpha = 1;

    // Content cross-dissolve: Home fades out and slides up (38%→52%), About fades in and slides up (48%→62%)
    // This MUST run on all devices (mobile, tablet, desktop) to ensure text shows/hides correctly on scroll.
    if (homeRef.current) {
      const op = 1 - smoothStep(0.38, 0.52, progress);
      homeRef.current.style.opacity = String(op);
      homeRef.current.style.pointerEvents = op < 0.05 ? 'none' : 'auto';
      // Smooth slide-up translation as it fades out
      const yTrans = -24 * smoothStep(0.38, 0.52, progress);
      homeRef.current.style.transform = `translateY(${yTrans}px)`;
    }
    if (aboutRef.current) {
      const op = smoothStep(0.48, 0.62, progress);
      aboutRef.current.style.opacity = String(op);
      aboutRef.current.style.pointerEvents = op < 0.05 ? 'none' : 'auto';
      // Smooth slide-up translation from below as it fades in
      const yTrans = 24 * (1 - smoothStep(0.48, 0.62, progress));
      aboutRef.current.style.transform = `translateY(${yTrans}px)`;
    }
  }, [drawCover]);

  // ── Resize canvas ─────────────────────────────────────────────────
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr); }
  }, []);

  // ── Preload all 79 frames ─────────────────────────────────────────
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const idx = i;
      img.onload = () => {
        loadedRef.current[idx] = true;
        if (idx === 0) resize();
        // Refresh the frame currently being approached as soon as it arrives.
        render(currentProgressRef.current);
      };
      img.src = frameSrc(ACTIVE_FRAME_NUMBERS[i]);
      imgs.push(img);
    }
    imagesRef.current = imgs;
  }, [render, resize]);

  // ── ScrollTrigger — native sticky + progress reading ─────────────
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    resize();
    window.addEventListener('resize', resize);

    // Reduced motion: skip animation
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let trigger: ScrollTrigger | undefined;
    let animationFrame = 0;
    let previousTime = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min((now - previousTime) / 1000, 0.064);
      previousTime = now;

      // Time-based damping gives mouse wheels and high-resolution trackpads the
      // same controlled, cinematic response without overshoot. We use -6 for smoother deceleration.
      const damping = prefersReduced ? 1 : 1 - Math.exp(-6 * elapsed);
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const next = current + (target - current) * damping;

      currentProgressRef.current = Math.abs(target - next) < 0.00005 ? target : next;
      render(currentProgressRef.current);
      animationFrame = requestAnimationFrame(tick);
    };

    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();

      trigger = ScrollTrigger.create({
        trigger: outer,
        start: 'top top',
        end: 'bottom bottom',   // full scroll distance of outer div
        invalidateOnRefresh: true,
        onUpdate: (self) => { targetProgressRef.current = self.progress; },
      });
      targetProgressRef.current = trigger.progress;
      currentProgressRef.current = trigger.progress;
      render(trigger.progress);
      animationFrame = requestAnimationFrame(tick);
    }, 80);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(animationFrame);
      trigger?.kill();
      window.removeEventListener('resize', resize);
    };
  }, [render, resize]);

  // ── Hero text entrance ────────────────────────────────────────────
  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll('.hero-headline, .hero-desc, .hero-ctas')
    ) as HTMLElement[];
    if (items.length) {
      animate(items, {
        opacity: [0, 1], translateY: [28, 0],
        delay: (_: HTMLElement, i: number) => 200 + i * 140,
        duration: 900, ease: 'easeOutCubic',
      });
    }
  }, []);

  const onEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const arr = btn.querySelector<HTMLElement>('.cta-arrow');
    animate(btn, { scale: 1.05, y: -2, backgroundColor: '#a55b00', duration: 260, ease: 'outQuad' });
    if (arr) animate(arr, { x: 5, duration: 240, ease: 'outQuad' });
  };
  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const arr = btn.querySelector<HTMLElement>('.cta-arrow');
    animate(btn, { scale: 1, y: 0, backgroundColor: '#C66E00', duration: 260, ease: 'outQuad' });
    if (arr) animate(arr, { x: 0, duration: 240, ease: 'outQuad' });
  };

  const stepIcon = (i: number) => {
    if (i === 0) return <Target   className="w-4 h-4 text-[#C66E00]" />;
    if (i === 1) return <Search   className="w-4 h-4 text-[#C66E00]" />;
    return             <BookOpen className="w-4 h-4 text-[#C66E00]" />;
  };

  return (
    /* Outer container — 700 vh tall; CSS sticky inside handles pinning */
    <div
      ref={outerRef}
      id="cinematic-container"
      style={{ height: `${SCROLL_VH}vh` }}
      className="relative w-full"
    >
      {/* Sticky viewport — stays at top while outer scrolls */}
      <div className="sticky top-0 w-full h-screen overflow-hidden" style={{ zIndex: 1 }}>

        {/* Background canvas — frames render here */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none select-none"
          style={{ zIndex: 0 }}
        />

        <style>{`
          .cinematic-vignette {
            background: linear-gradient(to right,
              rgba(255,255,255,0.92) 0%,
              rgba(255,255,255,0.65) 35%,
              rgba(255,255,255,0.15) 68%,
              transparent 100%);
          }
        `}</style>

        {/* Responsive vignette for text readability */}
        <div className="cinematic-vignette absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />

        {/* ── HOME content (frames 01–40, progress 0→0.5) ── */}
        <div
          id="home"
          ref={homeRef}
          className="absolute inset-0 flex items-center
                     pt-20 pb-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
          style={{ zIndex: 10 }}
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-xl space-y-4 md:space-y-8">
              <h1 className="hero-headline opacity-0 text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                             font-black tracking-tight leading-[0.9] text-black uppercase">
                {heroData.heading.part1}<br />
                <span className="text-[#C66E00]">{heroData.heading.part2}</span><br />
                {heroData.heading.part3}<br />
                {heroData.heading.part4}
              </h1>
              <p className="hero-desc opacity-0 text-xs xs:text-sm sm:text-base text-gray-600 font-medium max-w-md leading-relaxed">
                {heroData.description}
              </p>
              <div className="hero-ctas opacity-0 flex items-center gap-4 pt-1 sm:pt-2">
                <button
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                  style={{ backgroundColor: '#C66E00', transform: 'scale(1)' }}
                  className="px-6 py-3 sm:px-7 sm:py-3.5 text-white rounded-xl font-bold text-xs sm:text-sm
                             flex items-center gap-2.5 cursor-pointer origin-center
                             shadow-[0_4px_18px_rgba(198,110,0,0.35)]"
                >
                  {heroData.exploreBtnLabel}
                  <span className="cta-arrow flex items-center">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ABOUT content (frames 41–79, progress 0.5→1) ── */}
        <div
          id="about"
          ref={aboutRef}
          className="absolute inset-0 flex items-center
                     pt-20 pb-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
          style={{ zIndex: 10, opacity: 0, pointerEvents: 'none' }}
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-xl space-y-4 md:space-y-8">
              <h2 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-black">
                {aboutData.heading}
              </h2>
              <div className="space-y-2 md:space-y-3">
                <p className="text-xs xs:text-sm sm:text-base text-gray-600 font-semibold leading-relaxed max-w-xl">
                  {aboutData.desc1}
                </p>
                <p className="text-[10px] xs:text-xs sm:text-sm text-[#C66E00] font-bold leading-relaxed max-w-xl">
                  {aboutData.desc2}
                </p>
              </div>
              <div className="space-y-2 md:space-y-3 pt-1 md:pt-2 max-w-md">
                {aboutData.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2 sm:p-3 rounded-xl
                               bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white flex items-center justify-center
                                    shadow-sm shrink-0 border border-gray-200">
                      {stepIcon(idx)}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-[13px] font-black text-black leading-tight">{step.label}</h4>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 font-medium leading-tight">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
