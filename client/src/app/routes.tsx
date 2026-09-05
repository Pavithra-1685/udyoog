import { createBrowserRouter } from 'react-router';
import { AlertCircle } from 'lucide-react';
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
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-4 border border-red-100 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-[#111111] mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
        An unexpected error occurred while loading this page. Please refresh or return to the platform home.
      </p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 bg-[#111111] text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-all cursor-pointer shadow-md"
      >
        Return to Home
      </button>
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
