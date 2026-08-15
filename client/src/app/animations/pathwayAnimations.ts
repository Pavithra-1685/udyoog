import { createTimeline, stagger } from 'animejs';

export const animatePathway = (
  pathEl: SVGPathElement | null,
  nodesSelector: string
) => {
  const tl = createTimeline({
    defaults: {
      ease: 'inOutQuad',
      duration: 800
    }
  });

  // 1. Draw connecting SVG line if exists
  if (pathEl) {
    // Get total length of path
    const pathLength = pathEl.getTotalLength();
    pathEl.setAttribute('stroke-dasharray', pathLength.toString());
    pathEl.setAttribute('stroke-dashoffset', pathLength.toString());

    tl.add(pathEl, {
      strokeDashoffset: [pathLength, 0],
      duration: 1500,
      ease: 'inOutSine'
    });
  }

  // 2. Stagger reveal the pathway step nodes
  const nodes = document.querySelectorAll(nodesSelector);
  if (nodes.length > 0) {
    tl.add(Array.from(nodes), {
      opacity: [0, 1],
      scale: [0.8, 1],
      y: [20, 0],
      delay: stagger(150),
      duration: 600,
      ease: 'outBack'
    }, '-=1000'); // overlap with line drawing
  }

  return tl;
};
