import { animate } from 'animejs';

/**
 * Premium Section Transition Animations
 * Handles smooth transitions between sections with masked reveals and staggered text
 */

export interface SectionTransitionConfig {
  triggerElement: HTMLElement;
  heading?: HTMLElement;
  body?: HTMLElement;
  subElements?: HTMLElement[];
  threshold?: number;
  reducedMotion?: boolean;
}

/**
 * Creates a masked clip-path reveal effect for headings
 * Heading slides up while revealing
 */
export const animateHeadingReveal = (
  heading: HTMLElement,
  duration: number = 1200,
  reducedMotion: boolean = false
) => {
  if (reducedMotion) {
    heading.style.opacity = '1';
    heading.style.clipPath = 'inset(0)';
    return;
  }

  // Initial state - clipped
  heading.style.clipPath = 'inset(0 0 100% 0)';
  heading.style.opacity = '0';

  // Animate reveal
  animate(heading, {
    opacity: [0, 1],
    duration: duration,
    ease: 'easeOutExpo',
  });

  // Animate clip-path reveal (bottom to top)
  const textHeight = heading.offsetHeight;
  animate(heading, {
    clipPath: ['inset(0 0 100% 0)', 'inset(0)'],
    duration: duration,
    ease: 'easeOutExpo',
  });
};

/**
 * Line-by-line text reveal
 * Each line of text appears with staggered animation
 */
export const animateLineByLineReveal = (
  container: HTMLElement,
  lineSelector: string = 'span', // selector for individual lines
  staggerDelay: number = 80,
  reducedMotion: boolean = false
) => {
  const lines = Array.from(container.querySelectorAll(lineSelector)) as HTMLElement[];

  if (reducedMotion) {
    lines.forEach((line) => {
      line.style.opacity = '1';
      line.style.transform = 'translateY(0)';
    });
    return;
  }

  lines.forEach((line, i) => {
    line.style.opacity = '0';
    line.style.transform = 'translateY(30px)';

    setTimeout(() => {
      animate(line, {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        ease: 'easeOutCubic',
      });
    }, i * staggerDelay);
  });
};

/**
 * Body text fade and slide reveal
 */
export const animateBodyReveal = (
  body: HTMLElement,
  duration: number = 900,
  delay: number = 200,
  reducedMotion: boolean = false
) => {
  if (reducedMotion) {
    body.style.opacity = '1';
    body.style.transform = 'translateY(0)';
    return;
  }

  body.style.opacity = '0';
  body.style.transform = 'translateY(20px)';

  setTimeout(() => {
    animate(body, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: duration,
      ease: 'easeOutCubic',
    });
  }, delay);
};

/**
 * Element list stagger animation
 * Multiple elements appear in sequence
 */
export const animateElementStagger = (
  elements: HTMLElement[],
  duration: number = 800,
  staggerDelay: number = 100,
  reducedMotion: boolean = false
) => {
  if (reducedMotion) {
    elements.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    });
    return;
  }

  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px) scale(0.95)';

    setTimeout(() => {
      animate(el, {
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.95, 1],
        duration: duration,
        ease: 'easeOutCubic',
      });
    }, i * staggerDelay);
  });
};

/**
 * Intersection Observer for triggering animations on scroll
 * Ensures animations only trigger when section is visible
 */
export const setupSectionAnimationTrigger = (
  config: SectionTransitionConfig
): (() => void) => {
  const {
    triggerElement,
    heading,
    body,
    subElements = [],
    threshold = 0.15,
    reducedMotion = false,
  } = config;

  const reduced =
    reducedMotion ||
    (typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false);

  let triggered = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || triggered) return;

        triggered = true;

        // Trigger heading animation
        if (heading) {
          animateHeadingReveal(heading, 1200, reduced);
        }

        // Trigger body animation
        if (body) {
          animateBodyReveal(body, 900, 200, reduced);
        }

        // Trigger sub-elements animation
        if (subElements.length > 0) {
          setTimeout(() => {
            animateElementStagger(subElements, 800, 100, reduced);
          }, 400);
        }

        observer.unobserve(triggerElement);
      });
    },
    { threshold }
  );

  observer.observe(triggerElement);

  return () => observer.disconnect();
};
