import { animate } from 'animejs';

export interface ScrollRevealOptions {
  threshold?: number;
  staggerDelay?: number;
  itemDuration?: number;
}

/**
 * One-shot IntersectionObserver scroll reveal.
 * Uses Anime.js v4 API: animate(targets, properties)
 * Uses plain function delays — avoids stagger() API differences across v4 sub-versions.
 */
export function attachScrollReveal(
  el: HTMLElement | null,
  opts: ScrollRevealOptions = {}
): () => void {
  if (!el) return () => {};

  const {
    threshold = 0.12,
    staggerDelay = 100,
    itemDuration = 750,
  } = opts;

  const reduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // 1. Heading masked reveal
        const headings = Array.from(
          el.querySelectorAll('.reveal-heading')
        ) as HTMLElement[];
        headings.forEach((h, i) => {
          animate(h, {
            translateY: reduced ? [0, 0] : ['100%', '0%'],
            opacity: [0, 1],
            duration: reduced ? 200 : 900,
            delay: i * 120,
            ease: 'easeOutExpo',
          });
        });

        // 2. Subheadings / body text
        const subs = Array.from(
          el.querySelectorAll('.reveal-sub')
        ) as HTMLElement[];
        subs.forEach((s, i) => {
          animate(s, {
            translateY: reduced ? [0, 0] : [20, 0],
            opacity: [0, 1],
            duration: reduced ? 200 : 700,
            delay: 250 + i * 100,
            ease: 'easeOutCubic',
          });
        });

        // 3. Card / list items
        const items = Array.from(
          el.querySelectorAll('.reveal-item')
        ) as HTMLElement[];
        items.forEach((item, i) => {
          animate(item, {
            translateY: reduced ? [0, 0] : [28, 0],
            opacity: [0, 1],
            duration: itemDuration,
            delay: 350 + i * staggerDelay,
            ease: 'easeOutCubic',
          });
        });

        // 4. Visual / image assets
        const visuals = Array.from(
          el.querySelectorAll('.reveal-visual')
        ) as HTMLElement[];
        visuals.forEach((v, i) => {
          animate(v, {
            scale: reduced ? [1, 1] : [0.94, 1],
            opacity: [0, 1],
            duration: reduced ? 200 : 1100,
            delay: 100 + i * 150,
            ease: 'easeOutExpo',
          });
        });

        observer.unobserve(el);
      });
    },
    { threshold }
  );

  observer.observe(el);
  return () => observer.disconnect();
}
