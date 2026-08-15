import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-2xl border border-gray-200/50 p-12 max-w-md">
          <h1 className="text-8xl mb-4" style={{ color: 'var(--gold-medium)' }}>
            404
          </h1>
          <h2 className="text-3xl mb-3" style={{ color: '#111111' }}>
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border transition-all hover:bg-gray-50"
              style={{ borderColor: '#111111', color: '#111111' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--gold-medium)' }}
            >
              <Home className="w-5 h-5" />
              Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



