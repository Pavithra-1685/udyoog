import { ArrowRight, Target, Search, BookOpen } from 'lucide-react';
import { heroData, aboutData } from '../../lib/landingData';

export default function CinematicSection() {
  const stepIcon = (i: number) => {
    if (i === 0) return <Target className="w-5 h-5 text-[#C66E00]" />;
    if (i === 1) return <Search className="w-5 h-5 text-[#C66E00]" />;
    return <BookOpen className="w-5 h-5 text-[#C66E00]" />;
  };

  return (
    <div id="home" className="w-full">
      {/* ── HERO SECTION ── */}
      <section 
        className="w-full min-h-[80vh] py-24 md:py-36 px-6 flex items-center bg-white text-black relative"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.03) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="max-w-3xl mx-auto w-full text-center space-y-8">

          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] sm:leading-[1.05] text-black uppercase">
            {heroData.heading.part1}<br />
            <span className="text-[#C66E00]">{heroData.heading.part2}</span><br />
            {heroData.heading.part3}<br />
            {heroData.heading.part4}
          </h1>
          
          <p className="text-sm sm:text-base text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            {heroData.description}
          </p>
          
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => {
                const el = document.getElementById('about');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 bg-[#C66E00] hover:bg-[#a55b00] text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(198,110,0,0.25)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {heroData.exploreBtnLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section 
        id="about" 
        className="w-full py-24 bg-[#fafafa] text-black px-6 border-t border-gray-100"
      >
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Details */}
          <div className="lg:col-span-6 space-y-6">

            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-black">
              {aboutData.heading}
            </h2>
            
            <div className="space-y-4">
              <p className="text-sm sm:text-base text-gray-600 font-semibold leading-relaxed max-w-xl">
                {aboutData.desc1}
              </p>
              <p className="text-xs sm:text-sm text-[#C66E00] font-bold leading-relaxed max-w-xl">
                {aboutData.desc2}
              </p>
            </div>
          </div>
          
          {/* Right Column: Steps Cards Stack */}
          <div className="lg:col-span-6 space-y-4">
            {aboutData.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-150 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-200"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shadow-sm shrink-0 border border-gray-200 text-[#C66E00]">
                  {stepIcon(idx)}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-black leading-tight">{step.label}</h4>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-normal">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
