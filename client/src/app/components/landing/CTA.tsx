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

  const handleBtnMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const arrow = btn.querySelector('.cta-arrow');

    animate(btn, {
      scale: 1.05,
      y: -2,
      backgroundColor: '#a55b00',
      boxShadow: '0 20px 25px -5px rgba(198, 110, 0, 0.15), 0 10px 10px -5px rgba(198, 110, 0, 0.1)',
      duration: 300,
      ease: 'outQuad'
    });

    if (arrow) {
      animate(arrow, {
        x: 6,
        duration: 300,
        ease: 'outQuad'
      });
    }
  };

  const handleBtnMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const arrow = btn.querySelector('.cta-arrow');

    animate(btn, {
      scale: 1.0,
      y: 0,
      backgroundColor: '#C66E00',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      duration: 300,
      ease: 'outQuad'
    });

    if (arrow) {
      animate(arrow, {
        x: 0,
        duration: 300,
        ease: 'outQuad'
      });
    }
  };

  return (
    <section ref={sectionRef} className="relative py-28 bg-white text-black px-6 flex flex-col justify-center items-center text-center overflow-hidden">
      <div className="max-w-3xl mx-auto z-10 space-y-8">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-black overflow-hidden py-1">
          <span className="reveal-heading inline-block opacity-0">{ctaData.heading}</span>
        </h2>
        <p className="reveal-sub opacity-0 text-gray-500 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
          {ctaData.description}
        </p>

        <div className="pt-4">
          <button
            onClick={() => navigate('/auth')}
            onMouseEnter={handleBtnMouseEnter}
            onMouseLeave={handleBtnMouseLeave}
            className="reveal-item opacity-0 px-8 py-4 bg-[var(--gold-medium)] text-white rounded-xl font-black flex items-center justify-center gap-2 mx-auto cursor-pointer origin-center transition-shadow"
            style={{ transform: 'scale(1) translateY(0px)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          >
            {ctaData.btnLabel}
            <div className="cta-arrow flex items-center justify-center">
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
