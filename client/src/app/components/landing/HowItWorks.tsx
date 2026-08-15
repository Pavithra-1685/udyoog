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

  const handleCardMouseEnter = () => {};
  const handleCardMouseLeave = () => {};

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
            <span className="reveal-heading inline-block opacity-100">{howItWorksData.heading}</span>
          </h2>
          <p className="reveal-sub opacity-100 text-gray-500 font-semibold text-base">
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
                className="reveal-item bg-white border border-gray-150 rounded-3xl p-6 flex flex-col justify-between cursor-pointer origin-center shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-[#C66E00]/30 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {/* Circular Icon */}
                  <div className="icon-badge w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-[#C66E00] group-hover:text-white flex items-center justify-center text-[var(--gold-medium)] relative origin-center transition-all duration-350">
                    <Icon className="w-5 h-5" />
                    {/* Floating Step Number */}
                    <div className="step-num absolute -top-2 -right-2 bg-[#C66E00] group-hover:bg-[#a55b00] group-hover:scale-105 transition-all duration-350 w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black font-mono text-white origin-center">
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
