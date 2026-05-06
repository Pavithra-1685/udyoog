import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { LayoutDashboard, BarChart3, User, Archive, LogOut, Sparkles } from 'lucide-react';
import tuLogo from 'logo/tu.png';

interface NavigationProps {
  userEmail: string;
  onGenerateSummary?: () => void;
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

  const handleLogout = () => {
    localStorage.removeItem('careerPathway_auth');
    navigate('/');
  };

  return (
    <div className="sticky top-0 z-40 glass">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + University Branding */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => navigate('/dashboard')}
          >
            <motion.img
              src={tuLogo}
              alt="Takshishila University"
              className="h-12 w-12 object-contain"
              whileHover={{ rotate: 8, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <div className="leading-tight">
              <h1
                className="text-xl tracking-tight"
                style={{ color: '#142361', margin: 0, lineHeight: 1.2 }}
              >
                Takshishila University
              </h1>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#e0653b', margin: 0, lineHeight: 1.4 }}
              >
                Career Pathway Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Navigation Links */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                  style={{
                    backgroundColor: isActive ? '#e0653b' : 'transparent',
                    color: isActive ? 'white' : '#142361',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </motion.button>
              );
            })}


            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              title="Logout"
            >
              <LogOut className="w-5 h-5" style={{ color: '#142361' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
