import { useNavigate } from 'react-router';
import AuthComponent from '../components/shared/Auth';

export default function Auth() {
  const navigate = useNavigate();

  const handleLogin = (email: string, role?: string) => {
    localStorage.setItem('careerPathway_auth', JSON.stringify({ email, role }));
    
    if (role === 'student') {
      navigate('/student-dashboard');
    } else if (role === 'faculty') {
      navigate('/faculty-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return <AuthComponent onLogin={handleLogin} />;
}
