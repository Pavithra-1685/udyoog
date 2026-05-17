import { createBrowserRouter } from 'react-router';
import Root from './pages/Root';
import Auth from './pages/Auth';
import Dashboard from './pages/admin/Dashboard';
import CompanyDetail from './pages/admin/CompanyDetail';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Archive from './pages/admin/Archive';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/student/StudentDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyAnalytics from './pages/faculty/FacultyAnalytics';
import FacultyStudentDetail from './pages/faculty/FacultyStudentDetail';
import Preview from './pages/Preview';
import InterviewPrep from './pages/student/InterviewPrep';
import TalentPool from './pages/admin/TalentPool';
import NotFound from './pages/NotFound';
import RoleGuard from './components/shared/RoleGuard';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Auth },

      // Admin-only routes
      { path: 'dashboard', element: <RoleGuard allowedRoles={['admin']}><Dashboard /></RoleGuard> },
      { path: 'company/:id', element: <RoleGuard allowedRoles={['admin']}><CompanyDetail /></RoleGuard> },
      { path: 'archive', element: <RoleGuard allowedRoles={['admin']}><Archive /></RoleGuard> },

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
      { path: 'profile', Component: Profile },
      { path: 'reset-password', Component: ResetPassword },
      { path: 'preview', Component: Preview },
      { path: '*', Component: NotFound },
    ],
  },
]);
