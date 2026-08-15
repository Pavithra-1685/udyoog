import { useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Toaster, toast } from 'sonner';

export default function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const isNavigating = useRef(false);

  const goTo = useCallback((path: string) => {
    if (location.pathname !== path) {
      isNavigating.current = true;
      navigate(path);
    }
  }, [navigate, location.pathname]);

  // Main route guard — reads from localStorage only (instant, no async)
  useEffect(() => {
    if (isNavigating.current) return;

    // Check for auth errors in URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorMsg = params.get('error_description');
      if (errorMsg) {
        toast.error(errorMsg.replace(/\+/g, ' '));
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    const savedAuth = localStorage.getItem('careerPathway_auth');
    const isPublicPage = location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/reset-password' || location.pathname === '/preview';

    if (!savedAuth && !isPublicPage) {
      goTo('/');
      return;
    }

    if (savedAuth && location.pathname === '/') {
      try {
        const parsed = JSON.parse(savedAuth);
        if (parsed.role === 'student') goTo('/student-dashboard');
        else if (parsed.role === 'faculty') goTo('/faculty-dashboard');
        else goTo('/dashboard');
      } catch {
        localStorage.removeItem('careerPathway_auth');
      }
      return;
    }

    // RBAC
    if (savedAuth && !isPublicPage) {
      try {
        const parsed = JSON.parse(savedAuth);
        if (parsed.role === 'student') {
          const allowed = ['/student-dashboard', '/profile', '/analytics', '/interview-prep', '/jobs'];
          if (!allowed.some(p => location.pathname.startsWith(p))) { goTo('/student-dashboard'); return; }
        } else if (parsed.role === 'faculty') {
          const allowed = ['/faculty-dashboard', '/faculty-analytics', '/analytics', '/profile', '/faculty/', '/talent-pool', '/jobs', '/mapped-candidates'];
          if (!allowed.some(p => location.pathname.startsWith(p))) { goTo('/faculty-dashboard'); return; }
        } else {
          const allowed = ['/dashboard', '/companies', '/analytics', '/profile', '/company/', '/talent-pool', '/faculty/', '/jobs', '/mapped-candidates', '/users-management'];
          if (!allowed.some(p => location.pathname.startsWith(p))) { goTo('/dashboard'); return; }
        }
      } catch {
        localStorage.removeItem('careerPathway_auth');
        goTo('/');
      }
    }
  }, [location.pathname, goTo]);

  useEffect(() => {
    isNavigating.current = false;
  }, [location.pathname]);

  // Auth listener — FAST: set localStorage from metadata immediately,
  // then sync role from DB in background without blocking navigation
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('careerPathway_auth');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      } else if (session) {
        const metaRole = session.user.user_metadata?.role || 'student';
        localStorage.setItem('careerPathway_auth', JSON.stringify({
          email: session.user.email,
          role: metaRole,
        }));

        // STEP 2: Silently sync the actual role from DB in background
        supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.role && profile.role !== metaRole) {
              localStorage.setItem('careerPathway_auth', JSON.stringify({
                email: session.user.email,
                role: profile.role,
              }));
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Toaster position="top-right" richColors />
      <Outlet />
    </>
  );
}
