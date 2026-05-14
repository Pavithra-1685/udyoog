import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, BarChart3, User, Archive, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import tuLogo from 'logo/tu.png';

interface NavigationProps {
  userEmail: string;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/archive', icon: Archive, label: 'Archive' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Navigation({ userEmail }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('careerPathway_auth');
    navigate('/');
  };

  return (
    <div className="sticky top-0 z-40 glass border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + University Branding */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => navigate('/dashboard')}
          >
            <motion.img
              src={tuLogo}
              alt="Takshashila University"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              whileHover={{ rotate: 8, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <div className="leading-tight">
              <h1
                className="text-lg sm:text-xl tracking-tight font-bold"
                style={{ color: '#142361', margin: 0, lineHeight: 1.2 }}
              >
                Takshashila
              </h1>
              <p
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#e0653b', margin: 0, lineHeight: 1.4 }}
              >
                Career Pathway
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium"
                  style={{
                    backgroundColor: isActive ? '#e0653b' : 'transparent',
                    color: isActive ? 'white' : '#142361',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all ml-4 text-gray-400"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-100 text-[#142361]"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left font-semibold"
                    style={{
                      backgroundColor: isActive ? '#e0653b' : 'transparent',
                      color: isActive ? 'white' : '#142361',
                    }}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Active Session
                </div>
                <div className="px-4 py-2 text-sm text-gray-600 truncate mb-4">
                  {userEmail}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl bg-red-50 text-red-600 font-bold"
                >
                  <LogOut className="w-6 h-6" />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
