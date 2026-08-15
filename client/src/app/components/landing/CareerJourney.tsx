import { useEffect, useRef } from 'react';
import { Target, CheckCircle2, AlertTriangle, BookOpen, FolderGit, ClipboardCheck, GraduationCap } from 'lucide-react';
import { careerJourneyData } from '../../lib/landingData';
import { attachScrollReveal } from '../../animations/scrollReveal';

export default function CareerJourney() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return attachScrollReveal(sectionRef.current, { threshold: 0.1, staggerDelay: 80 });
  }, []);

  const getStepIcon = (index: number) => {
    switch (index) {
      case 0: return Target;
      case 1: return CheckCircle2;
      case 2: return AlertTriangle;
      case 3: return BookOpen;
      case 4: return FolderGit;
      case 5: return ClipboardCheck;
      case 6: return GraduationCap;
      default: return Target;
    }
  };

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="py-20 bg-[#fafafa] text-black px-4 sm:px-6 md:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Block */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-black overflow-hidden py-1">
            <span className="reveal-heading inline-block opacity-100">{careerJourneyData.heading}</span>
          </h2>
          <p className="reveal-sub opacity-100 text-gray-500 font-semibold text-sm">
            {careerJourneyData.subheading}
          </p>
        </div>

        {/* Horizontal Flow Container */}
        <div className="relative w-full">
          {/* Horizontal Track Line */}
          <div
            className="absolute left-8 right-8 top-5 h-[2px] bg-gray-200/80 rounded hidden lg:block pointer-events-none"
            style={{ zIndex: 0 }}
          />

          <div
            className="flex flex-row overflow-x-auto lg:overflow-x-visible gap-4 pb-6 snap-x snap-mandatory no-scrollbar select-none"
            style={{ zIndex: 1 }}
          >
            {careerJourneyData.steps.map((step, index) => {
              const Icon = getStepIcon(index);
              return (
                <div
                  key={index}
                  className="reveal-item opacity-100 flex-shrink-0 lg:flex-1 min-w-[150px] sm:min-w-[170px] lg:min-w-0 snap-start flex flex-col items-center text-center space-y-3 relative"
                >
                  {/* Step Icon Bullet */}
                  <div
                    className="w-10 h-10 rounded-full bg-white text-[#c66e00] flex items-center justify-center z-10 shadow-sm border border-gray-100 relative transition-transform duration-300 hover:scale-105"
                  >
                    <Icon className="w-4 h-4" />
                    {/* Tiny Number Badge */}
                    <div className="absolute -top-1 -right-1 bg-gray-900 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-black font-mono">
                      {index + 1}
                    </div>
                  </div>

                  {/* Step Card Content */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm w-full space-y-1 hover:border-[#c66e00]/25 transition-all duration-300 min-h-[90px] flex flex-col justify-center">
                    <h3 className="text-[11px] font-black text-black leading-tight uppercase tracking-wider">{step.title}</h3>
                    <p className="text-[10px] text-gray-500 font-medium leading-snug">{step.desc}</p>
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
