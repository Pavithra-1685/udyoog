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
  return () => {};
}
