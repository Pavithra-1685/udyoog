import { createBrowserRouter } from 'react-router';
import Root from './pages/Root';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CompanyDetail from './pages/CompanyDetail';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Archive from './pages/Archive';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Auth },
      { path: 'dashboard', Component: Dashboard },
      { path: 'company/:id', Component: CompanyDetail },
      { path: 'analytics', Component: Analytics },
      { path: 'profile', Component: Profile },
      { path: 'archive', Component: Archive },
      { path: 'reset-password', Component: ResetPassword },
      { path: '*', Component: NotFound },
    ],
  },
]);
