import { animate } from 'animejs';

/**
 * Character Asset Animation System
 * Handles character parallax, scroll movement, and subtle interactions
 */

export interface CharacterAnimationConfig {
  characterElement: HTMLElement;
  scrollTrigger?: HTMLElement;
  maxParallaxDistance?: number;
  reducedMotion?: boolean;
}

/**
 * Character entrance animation
 * Subtle scale and opacity reveal
 */
export const animateCharacterEntrance = (
  character: HTMLElement,
  delay: number = 400,
  duration: number = 1300,
  reducedMotion: boolean = false
) => {
  if (reducedMotion) {
    character.style.opacity = '1';
    character.style.transform = 'scale(1) translateX(0)';
    return;
  }

  character.style.opacity = '0';
  character.style.transform = 'scale(0.9) translateX(-30px)';

  setTimeout(() => {
    animate(character, {
      opacity: [0, 1],
      scale: [0.9, 1],
      translateX: [-30, 0],
      duration: duration,
      ease: 'easeOutExpo',
    });
  }, delay);
};

/**
 * Character parallax on mouse move
 * Subtle depth effect based on cursor position
 */
export const setupCharacterParallax = (config: CharacterAnimationConfig): (() => void) => {
  const { characterElement, maxParallaxDistance = 8, reducedMotion = false } = config;

  if (reducedMotion) {
    return () => {};
  }

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId: number;

  const handleMouseMove = (e: MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    // Normalized position
    const nx = ((e.clientX - cx) / cx) * maxParallaxDistance;
    const ny = ((e.clientY - cy) / cy) * (maxParallaxDistance * 0.6);

    targetX = nx;
    targetY = ny;
  };

  const tick = () => {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;

    characterElement.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    rafId = requestAnimationFrame(tick);
  };

  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  rafId = requestAnimationFrame(tick);

  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    cancelAnimationFrame(rafId);
  };
};

/**
 * Scroll-connected character animation
 * Character moves and responds to scroll progress
 */
export const setupCharacterScrollAnimation = (
  character: HTMLElement,
  triggerElement: HTMLElement,
  reducedMotion: boolean = false
): (() => void) => {
  if (reducedMotion) {
    return () => {};
  }

  const handleScroll = () => {
    const triggerRect = triggerElement.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - triggerRect.top) / window.innerHeight));

    // Character moves upward and slightly left as user scrolls
    const yOffset = progress * 40;
    const xOffset = progress * -20;
    const scale = 1 - progress * 0.08;
    const opacity = Math.max(0.7, 1 - progress * 0.3);

    character.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0) scale(${scale})`;
    character.style.opacity = opacity.toString();
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};

/**
 * Character idle float animation
 * Subtle up-down motion to show life
 */
export const animateCharacterIdle = (
  character: HTMLElement,
  reducedMotion: boolean = false
) => {
  if (reducedMotion) return;

  animate(character, {
    translateY: [0, -4, 0],
    duration: 3500,
    ease: 'easeInOutSine',
    loop: true,
  });
};

/**
 * Character entrance with stagger for multiple characters
 */
export const animateMultipleCharactersEntrance = (
  characters: HTMLElement[],
  staggerDelay: number = 150,
  reducedMotion: boolean = false
) => {
  if (reducedMotion) {
    characters.forEach((char) => {
      char.style.opacity = '1';
      char.style.transform = 'scale(1)';
    });
    return;
  }

  characters.forEach((character, i) => {
    character.style.opacity = '0';
    character.style.transform = 'scale(0.88) translateY(20px)';

    setTimeout(() => {
      animate(character, {
        opacity: [0, 1],
        scale: [0.88, 1],
        translateY: [20, 0],
        duration: 1000,
        ease: 'easeOutExpo',
      });
    }, i * staggerDelay);
  });
};

/**
 * Character mask/clip-path reveal
 * Reveals character from bottom or side
 */
export const animateCharacterMaskReveal = (
  character: HTMLElement,
  direction: 'top' | 'bottom' | 'left' | 'right' = 'bottom',
  duration: number = 1100,
  delay: number = 200,
  reducedMotion: boolean = false
) => {
  if (reducedMotion) {
    character.style.clipPath = 'inset(0)';
    character.style.opacity = '1';
    return;
  }

  const clipPaths = {
    top: { start: 'inset(100% 0 0 0)', end: 'inset(0)' },
    bottom: { start: 'inset(0 0 100% 0)', end: 'inset(0)' },
    left: { start: 'inset(0 100% 0 0)', end: 'inset(0)' },
    right: { start: 'inset(0 0 0 100%)', end: 'inset(0)' },
  };

  const { start, end } = clipPaths[direction];
  character.style.clipPath = start;
  character.style.opacity = '0';

  setTimeout(() => {
    character.style.opacity = '1';
    animate(character, {
      clipPath: [start, end],
      duration: duration,
      ease: 'easeOutExpo',
    });
  }, delay);
};
