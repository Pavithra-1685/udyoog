import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { supabase } from '../../lib/supabase';

export default function Root() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncAuth = async () => {
      // 1. Get current Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Sync Supabase session to local state
        localStorage.setItem('careerPathway_auth', JSON.stringify({ email: session.user.email }));
      }

      const savedAuth = localStorage.getItem('careerPathway_auth');
      const isPublicPage = location.pathname === '/' || location.pathname === '/reset-password';

      // 2. Redirect logic
      if (!savedAuth && !isPublicPage) {
        navigate('/');
      }

      if (savedAuth && location.pathname === '/') {
        navigate('/dashboard');
      }
    };

    syncAuth();

    // Listen for auth state changes (like clicking a verification link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        localStorage.setItem('careerPathway_auth', JSON.stringify({ email: session.user.email }));
        if (location.pathname === '/') {
          navigate('/dashboard');
        }
      } else {
        localStorage.removeItem('careerPathway_auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return <Outlet />;
}
