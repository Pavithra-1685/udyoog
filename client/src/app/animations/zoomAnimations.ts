import { animate } from 'animejs';

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Hero scroll zoom and content transformation progress handler
export const updateHeroScrollZoom = (
  progress: number,
  elements: {
    backgroundImage: HTMLElement | null;
    mainImage: HTMLElement | null;
    careerElements: HTMLElement | null;
    udyogVisual: HTMLElement | null;
    content: HTMLElement | null;
    nextSectionIndicator?: HTMLElement | null;
  }
) => {
  if (prefersReducedMotion()) {
    // Fallback: simple fade operations
    if (elements.content) {
      elements.content.style.opacity = Math.max(0, 1 - progress / 0.5).toString();
    }
    if (elements.mainImage) {
      elements.mainImage.style.opacity = Math.max(0, 1 - progress / 0.8).toString();
    }
    return;
  }

  // Phase-based scaling and opacity updates
  // 0% -> scale 1.0, 25% -> 1.1, 50% -> 1.25, 75% -> 1.35, 100% -> 1.5
  let scale = 1.0;
  if (progress <= 0.25) {
    // 0% to 25%
    const t = progress / 0.25;
    scale = 1.0 + t * 0.1; // 1.0 -> 1.1
  } else if (progress <= 0.5) {
    // 25% to 50%
    const t = (progress - 0.25) / 0.25;
    scale = 1.1 + t * 0.15; // 1.1 -> 1.25
  } else if (progress <= 0.75) {
    // 50% to 75%
    const t = (progress - 0.5) / 0.25;
    scale = 1.25 + t * 0.15; // 1.25 -> 1.4
  } else {
    // 75% to 100%
    const t = (progress - 0.75) / 0.25;
    scale = 1.4 + t * 0.1; // 1.4 -> 1.5
  }

  // 1. Zoom main image
  if (elements.mainImage) {
    elements.mainImage.style.transform = `scale(${scale})`;
  }

  // 2. Zoom/fade background image slower (parallax zoom)
  if (elements.backgroundImage) {
    const bgScale = 1.0 + progress * 0.2; // 1.0 -> 1.2
    elements.backgroundImage.style.transform = `scale(${bgScale})`;
    elements.backgroundImage.style.opacity = Math.max(0.1, 0.4 - progress * 0.3).toString();
  }

  // 3. Hero content fade out and slide upward (0 -> 75%)
  if (elements.content) {
    const textOpacity = Math.max(0, 1 - progress / 0.65);
    const textTranslateY = -progress * 150; // slide up
    elements.content.style.opacity = textOpacity.toString();
    elements.content.style.transform = `translateY(${textTranslateY}px)`;
    elements.content.style.pointerEvents = textOpacity < 0.1 ? 'none' : 'auto';
  }

  // 4. Secondary career elements disperse / move away (0 -> 75%)
  if (elements.careerElements) {
    const elemOpacity = Math.max(0, 1 - progress / 0.5);
    const disperseTranslateX = progress * 100;
    elements.careerElements.style.opacity = elemOpacity.toString();
    elements.careerElements.style.transform = `translateX(${disperseTranslateX}px) scale(${1 - progress * 0.2})`;
  }

  // 5. Udyog logo visual moves back/zooms and fades
  if (elements.udyogVisual) {
    const logoOpacity = Math.max(0.05, 0.25 - progress * 0.2);
    const logoScale = 1.0 + progress * 0.4;
    elements.udyogVisual.style.opacity = logoOpacity.toString();
    elements.udyogVisual.style.transform = `scale(${logoScale})`;
  }
};

// About section image zoom effect based on scroll entry
export const animateAboutImageZoom = (imageEl: HTMLElement, progress: number) => {
  if (prefersReducedMotion()) {
    imageEl.style.transform = 'scale(1)';
    return;
  }
  // Progress is from 0 (not in viewport) to 1 (passed through viewport)
  // Scale range: 0.9 -> 1.0 (as it enters) -> 1.08 (as user continues scrolling)
  let scale = 0.9;
  if (progress <= 0.3) {
    const t = progress / 0.3;
    scale = 0.9 + t * 0.1; // 0.9 -> 1.0
  } else {
    const t = (progress - 0.3) / 0.7;
    scale = 1.0 + t * 0.08; // 1.0 -> 1.08
  }
  imageEl.style.transform = `scale(${scale})`;
};
