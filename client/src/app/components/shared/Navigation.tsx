import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, BarChart3, User, LogOut, Menu, X, Users, Search, BrainCircuit, Briefcase, Layers } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface NavigationProps {
  userEmail: string;
}

export default function Navigation({ userEmail }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<'admin' | 'student' | 'faculty'>('admin');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('careerPathway_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) setRole(parsed.role);
      }
    } catch {}

    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          if (profile?.role) setRole(profile.role);
        }
      } catch (err) {
        console.error('Nav role fetch error:', err);
      }
    };
    fetchRole();
  }, []);

  const studentNavItems = [
    { path: '/student-dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/jobs', icon: Briefcase, label: 'Opportunities' },
    { path: '/profile', icon: User, label: 'Portfolio' },
    { path: '/analytics', icon: BarChart3, label: 'Progress' },
    { path: '/interview-prep', icon: BrainCircuit, label: 'AI Coach' },
  ];

  const facultyNavItems = [
    { path: '/faculty-dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/jobs', icon: Briefcase, label: 'Job Roles' },
    { path: '/mapped-candidates', icon: Layers, label: 'Placements' },
    { path: '/talent-pool', icon: Search, label: 'Talent Pool' },
    { path: '/faculty-analytics', icon: Users, label: 'Students' },
    { path: '/profile', icon: User, label: 'Account' },
  ];

  const adminNavItems = [
    { path: '/dashboard', icon: Briefcase, label: 'Open Positions' },
    { path: '/companies', icon: LayoutDashboard, label: 'Companies' },
    { path: '/mapped-candidates', icon: Layers, label: 'Placements' },
    { path: '/talent-pool', icon: Search, label: 'Talent Pool' },
    { path: '/users-management', icon: Users, label: 'Users' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Settings' },
  ];

  const navItems = role === 'student' ? studentNavItems : role === 'faculty' ? facultyNavItems : adminNavItems;
  const homeRoute = role === 'student' ? '/student-dashboard' : role === 'faculty' ? '/faculty-dashboard' : '/dashboard';
  const roleLabel = role === 'student' ? 'Student Portal' : role === 'faculty' ? 'Faculty Portal' : 'Admin Portal';

  const handleLogout = async () => {
    localStorage.removeItem('careerPathway_auth');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="sticky top-0 z-40 glass border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => navigate(homeRoute)}
          >
            <div className="flex items-center gap-2">
              <img src="/logo/logo.png" alt="UDYOOG Logo" className="w-8 h-8 object-contain" />
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-wide text-gray-900">
                    UDYOOG
                  </span>
                  <div className="h-4 w-[1px] bg-gray-300" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-500">
                    by <span className="text-[var(--gold-medium)]">NARAATRAL</span>
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--gold-medium)' }}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all font-bold text-xs lg:text-sm"
                  style={{
                    backgroundColor: isActive ? 'var(--gold-medium)' : 'transparent',
                    color: isActive ? 'white' : '#111111',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="p-2 hover:text-red-600 rounded-xl transition-all ml-2 text-gray-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-100 text-[#111111]"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100"
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
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left font-bold"
                    style={{
                      backgroundColor: isActive ? 'var(--gold-medium)' : 'transparent',
                      color: isActive ? 'white' : '#111111',
                    }}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="pt-4 mt-4 border-t border-gray-100">
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



