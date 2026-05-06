import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';

export default function Root() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check authentication
    const savedAuth = localStorage.getItem('careerPathway_auth');

    // If not authenticated and not on public pages, redirect to auth
    const isPublicPage = location.pathname === '/' || location.pathname === '/reset-password';
    if (!savedAuth && !isPublicPage) {
      navigate('/');
    }

    // If authenticated and on auth page, redirect to dashboard
    if (savedAuth && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [navigate, location.pathname]);

  return <Outlet />;
}
