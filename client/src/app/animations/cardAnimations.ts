import { animate, stagger } from 'animejs';

export const animateCardHover = (
  cardEl: HTMLElement,
  arrowEl?: HTMLElement | null,
  tagsEl?: HTMLElement | null
) => {
  // Move card up
  animate(cardEl, {
    y: -8,
    borderColor: '#C66E00', // --gold-medium brand color
    duration: 300,
    ease: 'outQuad'
  });

  // Move arrow to the right
  if (arrowEl) {
    animate(arrowEl, {
      x: 6,
      color: '#C66E00',
      duration: 300,
      ease: 'outQuad'
    });
  }

  // Fade tags in/up slightly
  if (tagsEl && tagsEl.children.length > 0) {
    animate(Array.from(tagsEl.children), {
      y: [2, 0],
      opacity: [0, 1],
      delay: stagger(50),
      duration: 200,
      ease: 'outQuad'
    });
  }
};

export const animateCardUnhover = (
  cardEl: HTMLElement,
  arrowEl?: HTMLElement | null,
  tagsEl?: HTMLElement | null
) => {
  // Move card back
  animate(cardEl, {
    y: 0,
    borderColor: '#e5e7eb', // gray-200
    duration: 300,
    ease: 'outQuad'
  });

  // Move arrow back
  if (arrowEl) {
    animate(arrowEl, {
      x: 0,
      color: '#111111',
      duration: 300,
      ease: 'outQuad'
    });
  }
};
