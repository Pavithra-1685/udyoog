import { animate, stagger } from 'animejs';

export const observeAndAnimate = (
  selector: string,
  animationConfig: (el: HTMLElement) => void,
  options: IntersectionObserverInit = { threshold: 0.15 }
) => {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        animationConfig(element);
        obs.unobserve(element); // Animate once
      }
    });
  }, options);

  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => observer.observe(el));

  return observer;
};

// Reusable configurations
export const animateFadeUp = (el: HTMLElement) => {
  animate(el, {
    opacity: [0, 1],
    y: [50, 0],
    duration: 1000,
    ease: 'outCubic'
  });
};

export const animateStaggerChildren = (el: HTMLElement, childSelector: string) => {
  const children = el.querySelectorAll(childSelector);
  if (children.length > 0) {
    animate(children, {
      opacity: [0, 1],
      y: [30, 0],
      delay: stagger(150),
      duration: 800,
      ease: 'outCubic'
    });
  }
};

export const animateClipPathReveal = (el: HTMLElement) => {
  animate(el, {
    opacity: [0, 1],
    scale: [0.95, 1],
    duration: 1200,
    ease: 'outExpo'
  });
};
