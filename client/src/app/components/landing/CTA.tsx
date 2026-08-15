import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { animate } from 'animejs';
import { ctaData } from '../../lib/landingData';
import { attachScrollReveal } from '../../animations/scrollReveal';

export default function CTA() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return attachScrollReveal(sectionRef.current, { threshold: 0.2 });
  }, []);

  const handleBtnMouseEnter = () => {};
  const handleBtnMouseLeave = () => {};

  return (
    <section ref={sectionRef} className="relative py-28 bg-white text-black px-6 flex flex-col justify-center items-center text-center overflow-hidden">
      <div className="max-w-3xl mx-auto z-10 space-y-8">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-black overflow-hidden py-1">
          <span className="reveal-heading inline-block opacity-100">{ctaData.heading}</span>
        </h2>
        <p className="reveal-sub opacity-100 text-gray-500 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
          {ctaData.description}
        </p>

        <div className="pt-4">
          <button
            onClick={() => navigate('/auth')}
            className="reveal-item opacity-100 px-8 py-4 bg-[var(--gold-medium)] hover:bg-[#a55b00] hover:scale-105 text-white rounded-xl font-black flex items-center justify-center gap-2 mx-auto cursor-pointer origin-center transition-all duration-300 shadow-md hover:shadow-lg active:scale-98 group"
          >
            {ctaData.btnLabel}
            <div className="cta-arrow flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
