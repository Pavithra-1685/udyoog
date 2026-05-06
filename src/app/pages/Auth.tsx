import { useNavigate } from 'react-router';
import AuthComponent from '../components/Auth';

export default function Auth() {
  const navigate = useNavigate();

  const handleLogin = (email: string) => {
    localStorage.setItem('careerPathway_auth', JSON.stringify({ email }));
    navigate('/dashboard');
  };

  return <AuthComponent onLogin={handleLogin} />;
}
