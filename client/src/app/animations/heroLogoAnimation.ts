import { animate, createTimeline } from 'animejs';

const TOTAL_FRAMES = 40;
const FRAME_PATH   = (n: number) =>
  `/assets/ezgif-frame-${String(n).padStart(3, '0')}.jpg`;

/* ── Cover-draw helper ───────────────────────────────────────────── */
export function drawFrame(
  canvas: HTMLCanvasElement,
  images: HTMLImageElement[],
  frameIndex: number          // 1-based
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const img = images[frameIndex - 1];
  if (!img?.complete || !img.naturalWidth) return;

  const { width: cw, height: ch } = canvas;
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = cw / ch;
  let dw = cw, dh = ch, ox = 0, oy = 0;
  if (ir > cr) { dw = ch * ir; ox = (cw - dw) / 2; }
  else          { dh = cw / ir; oy = (ch - dh) / 2; }

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, ox, oy, dw, dh);
}

/* ── Preloader ───────────────────────────────────────────────────── */
export function preloadLogoFrames(
  onFirst: () => void,
  onAll: () => void
): HTMLImageElement[] {
  const images: HTMLImageElement[] = [];
  let loadedCount = 0;

  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = FRAME_PATH(i);
    const idx = i;
    img.onload = () => {
      loadedCount++;
      if (idx === 1) onFirst();
      if (loadedCount === TOTAL_FRAMES) onAll();
    };
    images.push(img);
  }
  return images;
}

/* ═══════════════════════════════════════════════════════════════════
   SINGLE-CLICK FULL SEQUENCE
   One click → zoom in → scrub 1→40 → scrub 40→1 (return) → zoom out
   Blocked while playing so rapid clicks don't stack
   ═══════════════════════════════════════════════════════════════════ */
let isPlaying = false;

export function animateFullSequence(
  canvas: HTMLCanvasElement,
  canvasWrap: HTMLElement,
  images: HTMLImageElement[],
  reducedMotion: boolean,
  onFrameChange: (f: number) => void,
  onComplete: () => void
): void {
  if (isPlaying) return;
  isPlaying = true;

  if (reducedMotion) {
    // Instant: show frame 40 briefly then return to 1
    drawFrame(canvas, images, TOTAL_FRAMES);
    onFrameChange(TOTAL_FRAMES);
    setTimeout(() => {
      drawFrame(canvas, images, 1);
      onFrameChange(1);
      isPlaying = false;
      onComplete();
    }, 200);
    return;
  }

  const fwd  = { frame: 1 };   // forward: 1 → 40
  const back = { frame: TOTAL_FRAMES }; // return: 40 → 1

  const tl = createTimeline({ defaults: { ease: 'easeInOutCubic' } });

  /* ── Phase 1: Subtle zoom IN (0 ms) ──────────────────────────── */
  tl.add(canvasWrap, {
    scale: [1, 1.05],
    duration: 500,
    ease: 'easeInCubic',
  }, 0);

  /* ── Phase 2: Scrub forward 1 → 40 (0 ms, runs with zoom) ────── */
  tl.add(fwd, {
    frame: TOTAL_FRAMES,
    duration: 2200,
    ease: 'easeInOutSine',
    onUpdate: () => {
      const f = Math.round(fwd.frame);
      drawFrame(canvas, images, f);
      onFrameChange(f);
    },
  }, 0);

  /* ── Phase 3: Scrub RETURN 40 → 1 (starts at 2200 ms) ─────────── */
  tl.add(back, {
    frame: 1,
    duration: 1600,
    ease: 'easeInOutCubic',
    onUpdate: () => {
      const f = Math.round(back.frame);
      drawFrame(canvas, images, f);
      onFrameChange(f);
    },
  }, 2200);

  /* ── Phase 4: Zoom OUT (starts at 2200 ms, runs with return) ──── */
  tl.add(canvasWrap, {
    scale: [1.05, 1],
    duration: 1600,
    ease: 'easeOutExpo',
  }, 2200);

  /* ── Done ─────────────────────────────────────────────────────── */
  tl.then(() => {
    drawFrame(canvas, images, 1);
    onFrameChange(1);
    isPlaying = false;
    onComplete();
  });
}

/* ═══════════════════════════════════════════════════════════════════
   ENTRANCE — canvas fades + scales in from slightly small
   ═══════════════════════════════════════════════════════════════════ */
export function runHeroCanvasEntrance(
  canvasWrap: HTMLElement,
  canvas: HTMLCanvasElement,
  images: HTMLImageElement[],
  reducedMotion: boolean
): void {
  // Always draw frame 1 — static until user clicks
  drawFrame(canvas, images, 1);

  if (reducedMotion) {
    canvasWrap.style.opacity = '1';
    canvasWrap.style.transform = 'scale(1)';
    return;
  }

  // Just fade the wrapper in — no frame movement
  const tl = createTimeline({ defaults: { ease: 'easeOutExpo' } });
  tl.add(canvasWrap, {
    opacity: [0, 1],
    scale: [1.03, 1],
    duration: 1100,
  });
}


/* ═══════════════════════════════════════════════════════════════════
   IDLE AUTO-PLAY — slowly cycles through all 40 frames back and forth
   ═══════════════════════════════════════════════════════════════════ */
export function runHeroIdleLoop(
  canvas: HTMLCanvasElement,
  images: HTMLImageElement[],
  reducedMotion: boolean,
  onFrameUpdate: (f: number) => void
): () => void {
  if (reducedMotion) return () => {};

  const frameObj = { frame: 1 };

  const anim = animate(frameObj, {
    frame: TOTAL_FRAMES,
    duration: 8000,
    ease: 'linear',
    loop: true,
    alternate: true,
    onUpdate: () => {
      const f = Math.round(frameObj.frame);
      drawFrame(canvas, images, f);
      onFrameUpdate(f);
    },
  });

  return () => anim.cancel();
}

export { TOTAL_FRAMES };
