import { animate } from 'animejs';

/**
 * Premium Logo Assembly Animation
 * Sequence: Individual logo assets animate in, assemble, then settle
 * Uses easeOutExpo and easeOutCubic for smooth, professional feel
 */

export interface LogoAssemblyConfig {
  logoContainer: HTMLElement;
  logoAssets: HTMLElement[]; // Individual logo asset elements
  staggerDelay?: number;
  itemDuration?: number;
  reducedMotion?: boolean;
}

export const animateLogoAssembly = (config: LogoAssemblyConfig) => {
  const {
    logoContainer,
    logoAssets,
    staggerDelay = 120,
    itemDuration = 900,
    reducedMotion = false,
  } = config;

  if (!logoContainer || !logoAssets.length) return;

  // Set initial state - off-screen and transparent
  logoAssets.forEach((asset, i) => {
    asset.style.opacity = '0';
    asset.style.transform = 'scale(0.85) translateY(20px)';
  });

  if (reducedMotion) {
    // Instantly show all assets
    logoAssets.forEach((asset) => {
      asset.style.opacity = '1';
      asset.style.transform = 'scale(1) translateY(0)';
    });
    return;
  }

  // Animate each asset in sequence
  logoAssets.forEach((asset, i) => {
    // Stagger each asset's entrance
    setTimeout(() => {
      animate(asset, {
        opacity: [0, 1],
        scale: [0.85, 1],
        translateY: [20, 0],
        duration: itemDuration,
        ease: 'easeOutExpo',
      });
    }, i * staggerDelay);
  });

  // Emit signal when assembly is complete (all assets visible)
  const totalDelay = (logoAssets.length - 1) * staggerDelay + itemDuration;
  return totalDelay;
};

/**
 * Logo Idle Floating Animation
 * Subtle, almost invisible movement to make logo feel "alive"
 * Uses easeInOutSine for smooth, continuous motion
 */
export const animateLogoIdle = (
  logoContainer: HTMLElement,
  reducedMotion: boolean = false
) => {
  if (reducedMotion) return;

  const floatDuration = 4000; // 4 second cycle
  const floatDistance = 3; // pixels

  // Infinite floating loop
  animate(logoContainer, {
    translateY: [0, -floatDistance, 0],
    duration: floatDuration,
    ease: 'easeInOutSine',
    loop: true,
  });
};

/**
 * Mouse Parallax Effect
 * Logo responds subtly to cursor movement
 * Different assets move at different speeds for depth
 */
export interface ParallaxConfig {
  container: HTMLElement;
  assets: HTMLElement[];
  maxDistance?: number;
  smoothness?: number;
  reducedMotion?: boolean;
}

export const setupMouseParallax = (config: ParallaxConfig) => {
  const {
    container,
    assets,
    maxDistance = 10,
    smoothness = 0.08,
    reducedMotion = false,
  } = config;

  if (reducedMotion) return () => {};

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId: number;

  const handleMouseMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();

    // Check if mouse is in viewport and over container
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      return;
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Calculate normalized position (-1 to 1)
    const nx = ((e.clientX - cx) / (window.innerWidth / 2)) * maxDistance;
    const ny = ((e.clientY - cy) / (window.innerHeight / 2)) * (maxDistance * 0.8);

    targetX = Math.max(-maxDistance, Math.min(maxDistance, nx));
    targetY = Math.max(-maxDistance * 0.8, Math.min(maxDistance * 0.8, ny));
  };

  const tick = () => {
    // Smooth lerp to target
    currentX += (targetX - currentX) * smoothness;
    currentY += (targetY - currentY) * smoothness;

    // Apply parallax to assets at different depths
    assets.forEach((asset, i) => {
      const depth = (i + 1) / assets.length; // 0 to 1
      const scale = 3 + depth * 5; // Background: 3px, Foreground: 8px
      const x = currentX * depth * (scale / maxDistance);
      const y = currentY * depth * (scale / maxDistance);

      asset.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    rafId = requestAnimationFrame(tick);
  };

  window.addEventListener('mousemove', handleMouseMove);
  rafId = requestAnimationFrame(tick);

  // Return cleanup function
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    cancelAnimationFrame(rafId);
  };
};

/**
 * Scroll-Connected Logo Animation
 * Logo moves, scales, and fades as user scrolls
 * Communicates journey/progression
 */
export interface ScrollAnimationConfig {
  container: HTMLElement;
  triggerElement: HTMLElement;
  maxScroll?: number;
  reducedMotion?: boolean;
}

export const setupScrollAnimation = (config: ScrollAnimationConfig) => {
  const { container, triggerElement, maxScroll = window.innerHeight * 1.5, reducedMotion = false } = config;

  if (reducedMotion) return;

  const handleScroll = () => {
    const rect = triggerElement.getBoundingClientRect();
    const scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));

    // Apply transformations based on scroll progress
    const scale = 1 - scrollProgress * 0.15;
    const opacity = Math.max(0, 1 - scrollProgress * 1.8);
    const yOffset = scrollProgress * 50;
    const xOffset = scrollProgress * 30;

    container.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0) scale(${scale})`;
    container.style.opacity = opacity.toString();
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};
