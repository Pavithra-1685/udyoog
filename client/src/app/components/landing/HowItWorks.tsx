import { useEffect, useRef } from 'react';
import { Target, Search, FileX, Map, GraduationCap } from 'lucide-react';
import { animate } from 'animejs';
import { howItWorksData } from '../../lib/landingData';
import { attachScrollReveal } from '../../animations/scrollReveal';

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return attachScrollReveal(sectionRef.current, { threshold: 0.1, staggerDelay: 100 });
  }, []);



  const getStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return Target;
      case 1:
        return Search;
      case 2:
        return FileX;
      case 3:
        return Map;
      case 4:
        return GraduationCap;
      default:
        return Target;
    }
  };

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const badge = card.querySelector('.icon-badge');
    const stepNum = card.querySelector('.step-num');

    animate(card, {
      scale: 1.04,
      y: -6,
      boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.06), 0 10px 15px -10px rgba(0, 0, 0, 0.04)',
      duration: 350,
      ease: 'outQuad'
    });

    if (badge) {
      animate(badge, {
        scale: 1.1,
        rotate: '-8deg',
        backgroundColor: '#C66E00',
        color: '#ffffff',
        duration: 350,
        ease: 'outQuad'
      });
    }

    if (stepNum) {
      animate(stepNum, {
        scale: 1.25,
        backgroundColor: '#a55b00',
        duration: 300,
        ease: 'outQuad'
      });
    }
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const badge = card.querySelector('.icon-badge');
    const stepNum = card.querySelector('.step-num');

    animate(card, {
      scale: 1.0,
      y: 0,
      boxShadow: 'none',
      duration: 350,
      ease: 'outQuad'
    });

    if (badge) {
      animate(badge, {
        scale: 1.0,
        rotate: '0deg',
        backgroundColor: '#f9fafb',
        color: '#C66E00',
        duration: 350,
        ease: 'outQuad'
      });
    }

    if (stepNum) {
      animate(stepNum, {
        scale: 1.0,
        backgroundColor: '#C66E00',
        duration: 300,
        ease: 'outQuad'
      });
    }
  };

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-24 bg-white text-black px-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Block */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-black overflow-hidden py-1">
            <span className="reveal-heading inline-block opacity-0">{howItWorksData.heading}</span>
          </h2>
          <p className="reveal-sub opacity-0 text-gray-500 font-semibold text-base">
            {howItWorksData.subheading}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {howItWorksData.steps.map((step, index) => {
            const Icon = getStepIcon(index);

            return (
              <div
                key={index}
                onMouseEnter={handleCardMouseEnter}
                onMouseLeave={handleCardMouseLeave}
                className="reveal-item opacity-0 bg-white rounded-3xl p-6 flex flex-col justify-between cursor-pointer origin-center shadow-sm"
                style={{ transform: 'scale(1) translateY(0px)' }}
              >
                <div className="space-y-4">
                  {/* Circular Icon */}
                  <div className="icon-badge w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[var(--gold-medium)] relative origin-center">
                    <Icon className="w-5 h-5" />
                    {/* Floating Step Number */}
                    <div className="step-num absolute -top-2 -right-2 bg-[#C66E00] w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black font-mono text-white origin-center">
                      {step.num}
                    </div>
                  </div>

                  {/* Step Text details */}
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-black">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
