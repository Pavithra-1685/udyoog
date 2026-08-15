import { createTimeline, stagger } from 'animejs';

export const animateHero = (targets: {
  logo: string | HTMLElement;
  navItems: string | HTMLElement[];
  headline: string | HTMLElement;
  description: string | HTMLElement;
  ctas: string | HTMLElement;
  video: string | HTMLElement;
}) => {
  const tl = createTimeline({
    defaults: {
      ease: 'outExpo',
      duration: 1000
    }
  });

  // 1. Logo fades in
  if (targets.logo) {
    tl.add(targets.logo, {
      opacity: [0, 1],
      y: [20, 0],
      duration: 800,
      ease: 'outCubic'
    });
  }

  // 2. Navbar elements stagger in
  if (targets.navItems && targets.navItems.length > 0) {
    tl.add(targets.navItems, {
      opacity: [0, 1],
      y: [-20, 0],
      delay: stagger(100),
      duration: 800
    }, '-=400');
  }

  // 3. Hero headline appears line by line
  if (targets.headline) {
    tl.add(targets.headline, {
      opacity: [0, 1],
      y: [40, 0],
      duration: 1000,
      ease: 'outExpo'
    }, '-=600');
  }

  // 4. Description fades upward
  if (targets.description) {
    tl.add(targets.description, {
      opacity: [0, 1],
      y: [20, 0],
      duration: 800
    }, '-=600');
  }

  // 5. CTA buttons appear
  if (targets.ctas) {
    tl.add(targets.ctas, {
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: 600
    }, '-=500');
  }

  // 6. Video begins its reveal
  if (targets.video) {
    tl.add(targets.video, {
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 1200,
      ease: 'outElastic(1, .8)'
    }, '-=400');
  }

  return tl;
};
