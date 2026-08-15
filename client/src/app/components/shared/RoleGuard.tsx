import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';

interface RoleGuardProps {
  allowedRoles: ('admin' | 'student' | 'faculty')[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }

        // Check role from profiles table (source of truth)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        const userRole = profile?.role || user.user_metadata?.role || 'admin';

        if (allowedRoles.includes(userRole)) {
          setIsAuthorized(true);
        } else {
          // Redirect to the correct dashboard based on role
          const redirectMap: Record<string, string> = {
            admin: '/dashboard',
            faculty: '/faculty-dashboard',
            student: '/student-dashboard',
          };
          navigate(redirectMap[userRole] || '/');
        }
      } catch {
        navigate('/');
      }
    };
    checkRole();
  }, [allowedRoles, navigate]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gold-medium)]"></div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}



