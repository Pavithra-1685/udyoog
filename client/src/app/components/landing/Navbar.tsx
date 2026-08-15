import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Menu, X, ArrowRight } from 'lucide-react';
import { navbarData } from '../../lib/landingData';

interface NavbarProps {
  activeSection?: string;
}

export default function Navbar({ activeSection = 'home' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isDarkTheme = false;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 py-4 transition-colors duration-500"
        style={{
          background: isDarkTheme ? '#000000' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: isDarkTheme ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <img src="/logo/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
            <span className={`text-2xl font-black tracking-wider uppercase transition-colors duration-500 ${isDarkTheme ? 'text-white' : 'text-black'}`}>
              {navbarData.brandName}
            </span>
            <div className={`h-6 w-[1.5px] hidden sm:block transition-colors duration-500 ${isDarkTheme ? 'bg-white/15' : 'bg-black/15'}`} />
            <div className="hidden sm:flex items-center gap-1 text-[12px] font-bold">
              <span className={`transition-colors duration-500 ${isDarkTheme ? 'text-white/40' : 'text-black/40'}`}>by</span>
              <span className="text-[#c66e00] font-black tracking-wider uppercase">
                NARAATRAL
              </span>
            </div>
          </div>

          {/* Center Navigation links */}
          <div className="hidden md:flex items-center gap-8">
            {navbarData.menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`relative py-1 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors duration-500 ${
                    isActive
                      ? 'text-[#c66e00]'
                      : isDarkTheme
                      ? 'text-white/50 hover:text-[#c66e00]'
                      : 'text-black/60 hover:text-[#c66e00]'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#c66e00] rounded-full transition-transform duration-300 ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="px-5 py-2.5 bg-[#c66e00] hover:bg-[#a55b00] text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
            >
              {navbarData.getStartedLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-xl cursor-pointer transition-colors duration-500 ${
              isDarkTheme ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-black/5 text-black hover:bg-black/10'
            }`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-x-0 top-[69px] z-40 flex flex-col p-6 space-y-6 transition-colors duration-500"
          style={{
            background: isDarkTheme ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex flex-col gap-4 pb-6">
            {navbarData.menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-left text-base font-black uppercase tracking-widest transition-colors duration-500 ${
                    isActive
                      ? 'text-[#c66e00]'
                      : isDarkTheme
                      ? 'text-white/50'
                      : 'text-black/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/auth');
              }}
              className="w-full py-3 bg-[#C66E00] text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
            >
              {navbarData.getStartedLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
