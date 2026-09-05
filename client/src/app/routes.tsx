import { createBrowserRouter, useRouteError } from 'react-router';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Root from './pages/Root';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/admin/Dashboard';
import CompanyDetail from './pages/admin/CompanyDetail';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/student/StudentDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyAnalytics from './pages/faculty/FacultyAnalytics';
import FacultyStudentDetail from './pages/faculty/FacultyStudentDetail';
import Preview from './pages/Preview';
import InterviewPrep from './pages/student/InterviewPrep';
import TalentPool from './pages/admin/TalentPool';
import Jobs from './pages/admin/Jobs';
import MappedCandidates from './pages/admin/MappedCandidates';
import UserManagement from './pages/admin/UserManagement';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';
import RoleGuard from './components/shared/RoleGuard';

function GlobalErrorBoundary() {
  const error: any = useRouteError();
  const errorMsg = error?.message || error?.statusText || (typeof error === 'string' ? error : 'An unexpected rendering error occurred.');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-[#111111] mb-2">Something went wrong</h1>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed bg-gray-50 p-3 rounded-xl font-mono break-words border border-gray-200/60">
          {errorMsg}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-5 py-2.5 bg-[#111111] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-all cursor-pointer shadow-md"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    ErrorBoundary: GlobalErrorBoundary,
    children: [
      { index: true, Component: LandingPage },
      { path: 'auth', Component: Auth },
      { path: 'terms-of-service', Component: TermsOfService },
      { path: 'privacy-policy', Component: PrivacyPolicy },

      // Admin-only routes
      { path: 'dashboard', element: <RoleGuard allowedRoles={['admin']}><Jobs /></RoleGuard> },
      { path: 'companies', element: <RoleGuard allowedRoles={['admin']}><Dashboard /></RoleGuard> },
      { path: 'company/:id', element: <RoleGuard allowedRoles={['admin']}><CompanyDetail /></RoleGuard> },
      { path: 'users-management', element: <RoleGuard allowedRoles={['admin', 'faculty']}><UserManagement /></RoleGuard> },

      // Student-only routes
      { path: 'student-dashboard', element: <RoleGuard allowedRoles={['student']}><StudentDashboard /></RoleGuard> },
      { path: 'interview-prep', element: <RoleGuard allowedRoles={['student']}><InterviewPrep /></RoleGuard> },

      // Faculty-only routes
      { path: 'faculty-dashboard', element: <RoleGuard allowedRoles={['faculty']}><FacultyDashboard /></RoleGuard> },
      { path: 'faculty-analytics', element: <RoleGuard allowedRoles={['faculty']}><FacultyAnalytics /></RoleGuard> },
      { path: 'faculty/student/:id', element: <RoleGuard allowedRoles={['admin', 'faculty']}><FacultyStudentDetail /></RoleGuard> },

      // Shared routes (multiple roles)
      { path: 'analytics', element: <RoleGuard allowedRoles={['admin', 'student']}><Analytics /></RoleGuard> },
      { path: 'talent-pool', element: <RoleGuard allowedRoles={['admin', 'faculty']}><TalentPool /></RoleGuard> },
      { path: 'jobs', element: <RoleGuard allowedRoles={['admin', 'faculty', 'student']}><Jobs /></RoleGuard> },
      { path: 'mapped-candidates', element: <RoleGuard allowedRoles={['admin', 'faculty']}><MappedCandidates /></RoleGuard> },
      { path: 'profile', Component: Profile },
      { path: 'reset-password', Component: ResetPassword },
      { path: 'preview', Component: Preview },
      { path: '*', Component: NotFound },
    ],
  },
]);
