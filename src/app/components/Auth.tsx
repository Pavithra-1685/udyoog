import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import tuLogo from 'logo/tu.png';

interface AuthProps {
  onLogin: (email: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: '', color: '' };
    if (pass.length < 6) return { strength: 25, label: 'Weak', color: '#ef4444' };
    if (pass.length < 10) return { strength: 50, label: 'Fair', color: '#f59e0b' };
    if (pass.length < 14) return { strength: 75, label: 'Good', color: '#10b981' };
    return { strength: 100, label: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const resetRedirect = window.location.origin + '/reset-password';
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetRedirect,
        });
        if (error) throw error;
        toast.success('Password reset link has been dispatched! Please check your inbox and spam folder.');
        setMode('login');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        
        if (data.user && data.session) {
          toast.success('Account created and signed in!');
          onLogin(email);
        } else {
          toast.success('Account created! Please check your email to verify your account before logging in.');
          setMode('login');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message === 'Email not confirmed') {
            throw new Error('Please verify your email address before signing in. Check your inbox for the confirmation link.');
          }
          throw error;
        }
        if (data.user) {
          onLogin(data.user.email || email);
        }
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const { error } = await supabase.from('companies').select('id').limit(1);
      if (error && error.code !== 'PGRST116') throw error;
      toast.success('Secure connection to Takshishila Vault established.');
    } catch (error: any) {
      console.error('Connection Error:', error);
      toast.error('Connection Failed: ' + (error.message || 'Check your internet or Supabase URL.'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-2xl border border-gray-200/50 p-8">
          {/* University Branding */}
          <div className="text-center mb-8">
            <motion.img
              src={tuLogo}
              alt="Takshishila University"
              className="w-20 h-20 mx-auto mb-4 object-contain"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            />
            <h1 className="text-2xl mb-1" style={{ color: '#142361' }}>
              Takshishila University
            </h1>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em] mb-3"
              style={{ color: '#e0653b' }}
            >
              Career Pathway Center
            </p>
            <p className="text-gray-500 text-sm">
              {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {mode !== 'forgot' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl"
              >
                <button
                  onClick={() => setMode('login')}
                  className="flex-1 py-2 px-4 rounded-lg transition-all"
                  style={{
                    backgroundColor: mode === 'login' ? '#e0653b' : 'transparent',
                    color: mode === 'login' ? 'white' : '#142361',
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className="flex-1 py-2 px-4 rounded-lg transition-all"
                  style={{
                    backgroundColor: mode === 'signup' ? '#e0653b' : 'transparent',
                    color: mode === 'signup' ? 'white' : '#142361',
                  }}
                >
                  Sign Up
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                    placeholder=""
                    required
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                  placeholder=""
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                    placeholder=""
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>

                {mode === 'signup' && password.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${passwordStrength.strength}%` }}
                          style={{ backgroundColor: passwordStrength.color }}
                          className="h-full transition-all"
                        />
                      </div>
                      <span className="text-[10px] uppercase font-bold" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#e0653b' }}
            >
              {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          <div className="text-center mt-6">
            {mode === 'forgot' ? (
              <button
                onClick={() => setMode('login')}
                className="flex items-center gap-2 text-sm mx-auto hover:underline"
                style={{ color: '#142361' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            ) : (
              mode === 'login' && (
                <button
                  onClick={() => setMode('forgot')}
                  className="text-sm hover:underline"
                  style={{ color: '#142361' }}
                >
                  Forgot your password?
                </button>
              )
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
            <button
              onClick={testConnection}
              className="text-xs text-gray-400 hover:text-[#e0653b] transition-colors flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Check Infrastructure Status
            </button>
            <p className="text-[10px] text-gray-300 uppercase tracking-tighter">
              Protected by Takshishila Security Protocol
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
