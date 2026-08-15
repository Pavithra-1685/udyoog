import { useEffect, useRef, useState } from 'react';
import { Target, Search, BookOpen } from 'lucide-react';
import { animate } from 'animejs';
import { aboutData } from '../../lib/landingData';

export default function About() {
  const sectionRef  = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const getStepIcon = (index: number) => {
    switch (index) {
      case 0: return <Target   className="w-4 h-4 text-[#C66E00]" />;
      case 1: return <Search   className="w-4 h-4 text-[#C66E00]" />;
      case 2: return <BookOpen className="w-4 h-4 text-[#C66E00]" />;
      default: return null;
    }
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reducedMotion) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const heading = el.querySelector('.about-heading') as HTMLElement | null;
          if (heading) {
            animate(heading, { opacity: [0, 1], translateY: [40, 0], duration: 1600, delay: 200, ease: 'easeOutExpo' });
          }

          (Array.from(el.querySelectorAll('.about-desc')) as HTMLElement[]).forEach((d, i) => {
            animate(d, { opacity: [0, 1], translateY: [20, 0], duration: 1400, delay: 500 + i * 200, ease: 'easeOutCubic' });
          });

          (Array.from(el.querySelectorAll('.about-step-card')) as HTMLElement[]).forEach((c, i) => {
            animate(c, { opacity: [0, 1], translateY: [18, 0], duration: 1200, delay: 800 + i * 180, ease: 'easeOutCubic' });
          });

          observerRef.current?.unobserve(el);
        });
      },
      { threshold: 0.05 }
    );

    observerRef.current.observe(el);
    return () => { observerRef.current?.disconnect(); };
  }, [reducedMotion]);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-16 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-white text-black overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Heading */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-black py-1">
            <span className="about-heading inline-block" style={{ opacity: 1 }}>
              {aboutData.heading}
            </span>
          </h2>

          <div className="space-y-3">
            <p
              className="about-desc text-sm sm:text-base text-gray-500 font-semibold leading-relaxed max-w-xl"
              style={{ opacity: 1 }}
            >
              {aboutData.desc1}
            </p>
            <p
              className="about-desc text-xs sm:text-sm text-[#C66E00] font-bold leading-relaxed max-w-xl"
              style={{ opacity: 1 }}
            >
              {aboutData.desc2}
            </p>
          </div>
        </div>

        {/* Key Steps */}
        <div className="space-y-3 pt-2 max-w-md">
          {aboutData.steps.map((step, idx) => (
            <div
              key={idx}
              className="about-step-card flex items-center gap-3 p-3
                         rounded-xl bg-gray-50 border border-gray-100
                         hover:bg-gray-100 transition-colors duration-300 shadow-sm"
              style={{ opacity: 1 }}
            >
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center
                              shadow-sm shrink-0 border border-gray-200">
                {getStepIcon(idx)}
              </div>
              <div>
                <h4 className="text-[13px] font-black text-black leading-tight">{step.label}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 font-medium leading-tight">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
