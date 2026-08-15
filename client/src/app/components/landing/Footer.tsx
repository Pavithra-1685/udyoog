import { useNavigate } from 'react-router';
import { footerData, navbarData } from '../../lib/landingData';

export default function Footer() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white text-black py-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Brand & Tagline Column */}
        <div className="md:col-span-5 space-y-6">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <img src="/logo/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
            <span className="text-2xl font-black tracking-wider text-black uppercase">{navbarData.brandName}</span>
            <div className="h-6 w-[1.5px] bg-gray-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1 text-[12px] font-bold">
              <span className="text-gray-400">by</span>
              <span className="text-[var(--gold-medium)] font-black tracking-wider uppercase">
                NARAATRAL
              </span>
            </div>
          </div>
          
          <h3 className="text-lg font-black text-gray-800">
            {footerData.tagline}
          </h3>
          <p className="text-xs text-gray-400 font-semibold leading-relaxed max-w-sm">
            {footerData.description}
          </p>
        </div>

        {/* Links Column 1: Platform */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-black">
            {footerData.columns.platform.title}
          </h4>
          <ul className="space-y-3">
            {footerData.columns.platform.links.map((link, idx) => (
              <li key={idx}>
                <button
                  onClick={() => scrollToSection(link.id)}
                  className="text-sm font-semibold text-gray-500 hover:text-black transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Links Column 2: Account */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-black">
            {footerData.columns.account.title}
          </h4>
          <ul className="space-y-3">
            {footerData.columns.account.links.map((link, idx) => (
              <li key={idx}>
                <button
                  onClick={() => navigate(link.path)}
                  className="text-sm font-semibold text-gray-500 hover:text-black transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Links Column 3: Support */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-black">
            {footerData.columns.support.title}
          </h4>
          <ul className="space-y-3">
            {footerData.columns.support.links.map((link, idx) => (
              <li key={idx}>
                {link.id ? (
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-sm font-semibold text-gray-500 hover:text-black transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-gray-500 hover:text-black cursor-pointer transition-colors">
                    {link.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-400">
        <div>{footerData.copyright}</div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500">{footerData.designedBy}</div>
      </div>
    </footer>
  );
}
