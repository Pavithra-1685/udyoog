import { useEffect, useRef } from 'react';
import { CheckCircle2, TrendingUp, Award, Users } from 'lucide-react';
import { animate } from 'animejs';
import { whyUdyogData } from '../../lib/landingData';
import { attachScrollReveal } from '../../animations/scrollReveal';

export default function WhyUdyog() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return attachScrollReveal(sectionRef.current, { threshold: 0.12, staggerDelay: 110 });
  }, []);

  const getFeatureIcon = (index: number) => {
    switch (index) {
      case 0:
        return CheckCircle2;
      case 1:
        return TrendingUp;
      case 2:
        return Award;
      case 3:
        return Users;
      default:
        return CheckCircle2;
    }
  };

  const handleCardMouseEnter = () => {};
  const handleCardMouseLeave = () => {};

  return (
    <section
      id="why-udyoog"
      ref={sectionRef}
      className="py-24 bg-white text-black px-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left Column: Why Udyoog Features */}
        <div className="lg:col-span-7 space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-black overflow-hidden py-1">
              <span className="reveal-heading inline-block opacity-100">{whyUdyogData.heading}</span>
            </h2>
            <p className="reveal-sub opacity-100 text-gray-500 font-semibold text-base">
              {whyUdyogData.subheading}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {whyUdyogData.features.map((feature, index) => {
              const Icon = getFeatureIcon(index);
              return (
                <div
                  key={index}
                  className="reveal-item border border-gray-150 space-y-3 p-5 rounded-2xl bg-gray-50 transition-all duration-300 origin-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 group"
                >
                  {/* Icon */}
                  <div className="icon-badge w-10 h-10 bg-white group-hover:bg-[#C66E00] group-hover:text-white rounded-xl flex items-center justify-center text-[var(--gold-medium)] origin-center shadow-sm transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Copy */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-black">{feature.title}</h3>
                    <p className="text-xs text-gray-400 font-bold">{feature.desc}</p>
                    <p className="text-[11px] text-gray-500 mt-2 font-medium leading-relaxed">{feature.subDesc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Text Summary Card */}
        <div className="lg:col-span-5 w-full mt-6 lg:mt-0">
          <div className="bg-gray-50 rounded-3xl p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                {whyUdyogData.summaryCard.badge}
              </span>
              <h3 className="text-xl font-black text-black">
                {whyUdyogData.summaryCard.title}
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              {whyUdyogData.summaryCard.desc}
            </p>
            <div className="p-4 bg-white rounded-2xl flex items-center justify-between shadow-sm">
              {whyUdyogData.summaryCard.stats.map((stat, sIdx) => (
                <div key={sIdx} className="text-center">
                  <div className="text-xl font-black text-[var(--gold-medium)]">{stat.value}</div>
                  <div className="text-[8px] font-black uppercase text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
