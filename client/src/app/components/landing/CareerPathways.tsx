import { useEffect, useRef } from 'react';
import { Code2, Brain, Sparkles, Paintbrush, Cloud, Shield, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { animate } from 'animejs';
import { pathwaysData } from '../../lib/landingData';
import { attachScrollReveal } from '../../animations/scrollReveal';

export default function CareerPathways() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return attachScrollReveal(sectionRef.current, { threshold: 0.1, staggerDelay: 90 });
  }, []);

  // Exit fade scroll effect
  useEffect(() => {
    const handleScrollExit = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;

      // When the bottom of CareerPathways starts exiting the screen:
      if (rect.bottom > 0 && rect.bottom < viewH) {
        const opacity = Math.min(Math.max(rect.bottom / (viewH * 0.75), 0), 1);
        const contentEl = el.querySelector('.max-w-7xl') as HTMLElement;
        if (contentEl) {
          contentEl.style.opacity = opacity.toString();
          contentEl.style.transform = `scale(${0.98 + opacity * 0.02})`;
          contentEl.style.willChange = 'opacity, transform';
        }
      } else if (rect.bottom >= viewH) {
        const contentEl = el.querySelector('.max-w-7xl') as HTMLElement;
        if (contentEl) {
          contentEl.style.opacity = '1';
          contentEl.style.transform = 'scale(1)';
        }
      }
    };

    window.addEventListener('scroll', handleScrollExit, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollExit);
  }, []);

  const getRoleIcon = (index: number) => {
    switch (index) {
      case 0:
        return Code2;
      case 1:
        return Brain;
      case 2:
        return Sparkles;
      case 3:
        return Paintbrush;
      case 4:
        return Cloud;
      case 5:
        return Shield;
      default:
        return Code2;
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleCardMouseEnter = () => {};
  const handleCardMouseLeave = () => {};

  return (
    <section
      id="pathways"
      ref={sectionRef}
      className="py-24 bg-gray-50 text-black px-6 relative overflow-hidden"
    >
      {/* Scroll-scrubbed backdrop reveal background */}
      <div className="absolute inset-0 bg-white opacity-0 pointer-events-none transition-opacity duration-150" />

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 text-left max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-black overflow-hidden py-1">
              <span className="reveal-heading inline-block opacity-100">{pathwaysData.heading}</span>
            </h2>
            <p className="reveal-sub opacity-100 text-gray-500 font-semibold text-base">
              {pathwaysData.subheading}
            </p>
          </div>
        </div>

        {/* Career Cards Horizontal Row with Overlay Navigation Chevrons */}
        <div className="relative group/scroll px-4 -mx-4">
          {/* Left Chevron Navigation Button */}
          <button
            onClick={() => handleScroll('left')}
            className="p-3 bg-gray-50 hover:bg-gray-100 text-black rounded-full hidden md:flex items-center justify-center transition-all duration-300 shadow-sm active:scale-90 cursor-pointer absolute left-2 md:-left-8 lg:-left-12 top-1/2 -translate-y-1/2 z-20 border border-gray-100/50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Chevron Navigation Button */}
          <button
            onClick={() => handleScroll('right')}
            className="p-3 bg-gray-50 hover:bg-gray-100 text-black rounded-full hidden md:flex items-center justify-center transition-all duration-300 shadow-sm active:scale-90 cursor-pointer absolute right-2 md:-right-8 lg:-right-12 top-1/2 -translate-y-1/2 z-20 border border-gray-100/50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-8 pb-8 px-4 snap-x snap-mandatory scroll-smooth no-scrollbar select-none"
          >
          {pathwaysData.roles.map((role, index) => {
            const Icon = getRoleIcon(index);

            return (
              <div
                key={index}
                className="bg-white border border-gray-150 rounded-3xl p-8 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 origin-center min-w-[310px] sm:min-w-[350px] md:min-w-[380px] lg:min-w-[400px] flex-shrink-0 snap-start opacity-100 visible group"
              >
                <div className="space-y-6">
                  {/* Icon Badge */}
                  <div className="icon-badge w-12 h-12 bg-gray-50 group-hover:bg-[#C66E00] rounded-2xl flex items-center justify-center text-[var(--gold-medium)] group-hover:text-white transition-all duration-300 origin-center">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Text Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-black text-black">{role.title}</h3>
                    <p className="text-gray-500 text-xs font-semibold leading-relaxed">{role.desc}</p>
                    
                    {/* Skills tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {role.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="skill-tag px-2 py-0.5 bg-gray-50 group-hover:bg-gray-100 rounded-md text-[10px] font-black text-gray-500 transition-colors duration-300 origin-center"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
  );
}
