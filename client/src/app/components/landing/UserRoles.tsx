import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { User, GraduationCap, ShieldAlert } from 'lucide-react';
import { animate } from 'animejs';
import { userRolesData } from '../../lib/landingData';
import { attachScrollReveal } from '../../animations/scrollReveal';

export default function UserRoles() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return attachScrollReveal(sectionRef.current, { threshold: 0.1, staggerDelay: 120 });
  }, []);

  const getRoleIcon = (index: number) => {
    switch (index) {
      case 0:
        return GraduationCap;
      case 1:
        return User;
      case 2:
        return ShieldAlert;
      default:
        return User;
    }
  };

  const handleCardMouseEnter = () => {};
  const handleCardMouseLeave = () => {};

  return (
    <section
      id="roles"
      ref={sectionRef}
      className="py-24 bg-white text-black px-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Block */}
        <div className="text-center space-y-4 max-w-5xl mx-auto overflow-hidden">
          <h2 className="text-[5.5vw] xs:text-[5vw] sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-black py-1">
            <span className="reveal-heading inline-block opacity-100 whitespace-nowrap">
              {userRolesData.heading.split(' ↔ ').map((part, index, arr) => (
                <span key={index} className="inline-block">
                  {part}
                  {index < arr.length - 1 && (
                    <span className="mx-1 sm:mx-3 md:mx-4 text-[#C66E00]">↔</span>
                  )}
                </span>
              ))}
            </span>
          </h2>
          <p className="reveal-sub opacity-100 text-gray-500 font-semibold text-xs sm:text-sm md:text-base max-w-xl mx-auto">
            {userRolesData.subheading}
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {userRolesData.roles.map((role, index) => {
            const Icon = getRoleIcon(index);

            return (
              <div
                key={index}
                className="reveal-item bg-white border border-gray-150 rounded-3xl p-8 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-[#C66E00]/30 transition-all duration-300 group"
              >
                <div className="space-y-6">
                  {/* Icon Badge */}
                  <div className="icon-badge w-12 h-12 bg-gray-50 group-hover:bg-[#C66E00] group-hover:text-white rounded-2xl flex items-center justify-center text-[var(--gold-medium)] origin-center transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Copy */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-[var(--gold-medium)] font-black uppercase tracking-widest">{role.title}</div>
                    <h3 className="text-xl font-black text-black">{role.tagline}</h3>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">{role.desc}</p>
                  </div>
                </div>

                {/* Navigation CTA */}
                <div className="pt-8">
                  <button
                    onClick={() => navigate('/auth')}
                    className="action-btn w-full py-3 bg-[var(--gold-medium)] group-hover:bg-[#a55b00] text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all duration-300 ease-out active:scale-98"
                  >
                    {role.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
