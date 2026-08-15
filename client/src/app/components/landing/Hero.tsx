import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { animate } from 'animejs';
import { heroData } from '../../lib/landingData';

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  const onPrimaryEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const arrow = btn.querySelector<HTMLElement>('.cta-arrow');
    animate(btn,   { scale: 1.05, y: -2, backgroundColor: '#a55b00', duration: 260, ease: 'outQuad' });
    if (arrow) animate(arrow, { x: 5, duration: 240, ease: 'outQuad' });
  };
  const onPrimaryLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const arrow = btn.querySelector<HTMLElement>('.cta-arrow');
    animate(btn,   { scale: 1, y: 0, backgroundColor: '#C66E00', duration: 260, ease: 'outQuad' });
    if (arrow) animate(arrow, { x: 0, duration: 240, ease: 'outQuad' });
  };

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll('.hero-headline, .hero-desc, .hero-ctas')
    ) as HTMLElement[];
    if (items.length) {
      animate(items, {
        opacity:    [0, 1],
        translateY: [32, 0],
        delay: (_el: HTMLElement, i: number) => 200 + i * 140,
        duration: 950,
        ease: 'easeOutCubic',
      });
    }
  }, []);

  return (
    <>
      <style>{`
        #home button { cursor: pointer; }
        #home h1, #home p { cursor: default; }
      `}</style>

      <div
        id="home"
        ref={heroRef}
        className="relative w-full min-h-screen flex items-center
                   pt-24 pb-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-white text-black overflow-hidden"
      >
        {/* Subtle orange radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 75% 50%, rgba(198,110,0,0.05) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full" style={{ zIndex: 2 }}>
          <div className="max-w-2xl space-y-6 md:space-y-8">
            <h1
              className="hero-headline opacity-0 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5rem]
                         font-black tracking-tight leading-[0.9] text-black uppercase"
            >
              {heroData.heading.part1}<br />
              <span className="text-[#C66E00]">{heroData.heading.part2}</span><br />
              {heroData.heading.part3}
            </h1>

            <p className="hero-desc opacity-0 text-sm sm:text-base text-gray-500 font-medium max-w-md leading-relaxed">
              {heroData.description}
            </p>

            <div className="hero-ctas opacity-0 flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                onMouseEnter={onPrimaryEnter}
                onMouseLeave={onPrimaryLeave}
                style={{ backgroundColor: '#C66E00', transform: 'scale(1)' }}
                className="px-7 py-3.5 text-white rounded-xl font-bold text-sm
                           flex items-center gap-2.5 cursor-pointer origin-center
                           shadow-[0_4px_18px_rgba(198,110,0,0.35)]"
              >
                {heroData.exploreBtnLabel}
                <span className="cta-arrow flex items-center">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
