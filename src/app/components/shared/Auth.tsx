import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface AuthProps {
  onLogin: (email: string, role?: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [role, setRole] = useState<'admin' | 'student' | 'faculty'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const facultyParam = params.get('faculty');
    const studentParam = params.get('student');
    const adminParam = params.get('admin');

    if (roleParam === 'faculty' || facultyParam === 'y') {
      setRole('faculty');
    } else if (roleParam === 'student' || studentParam === 'y') {
      setRole('student');
    } else if (roleParam === 'admin' || adminParam === 'y') {
      setRole('admin');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/reset-password` }
        );
        if (error) throw error;
        toast.success('Check your inbox for reset link.');
        setMode('login');
        return;
      }

      if (mode === 'signup') {
        if (!fullName.trim()) { toast.error('Name is required.'); return; }
        if (password.length < 6) { toast.error('Min. 6 chars for password.'); return; }
        if (role === 'student' && !regNo.trim()) { toast.error('Registration number is required.'); return; }
        if (role === 'faculty' && !regNo.trim()) { toast.error('Employee ID is required.'); return; }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role,
              registration_no: (role === 'student' || role === 'faculty') ? regNo.trim() : null,
            },
          },
        });

        if (error) throw error;

        // Handled by trigger
        toast.success('Account created!');
        if (data.session) {
          onLogin(email.trim().toLowerCase(), role);
        } else {
          setMode('login');
        }
        return;
      }

      let loginEmail = email.trim().toLowerCase();

      // If student or faculty and they provided a Reg No / Employee ID (regNo), try to resolve it.
      if (mode === 'login' && (role === 'student' || role === 'faculty') && regNo.trim()) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('registration_no', regNo.trim())
          .eq('role', role)
          .maybeSingle();
        
        if (profileData?.email) {
          loginEmail = profileData.email;
        } else if (!email.trim()) {
          throw new Error(`${role === 'student' ? 'Registration number' : 'Employee ID'} not recognized. Please provide your registered email.`);
        }
      }

      if (!loginEmail) {
        throw new Error('Please enter your email or registration number/employee ID.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Enforce role-based access control matching the database profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const actualRole = profile?.role || data.user.user_metadata?.role || 'student';

        if (actualRole !== role) {
          await supabase.auth.signOut();
          throw new Error(`Access denied. Your account is registered as a ${actualRole}. Please select the correct tab to log in.`);
        }

        toast.success('Welcome back!');
        onLogin(data.user.email || email, actualRole);
      }

    } catch (err: any) {
      toast.error(err.message || 'Auth failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e0653b]/50 bg-white transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8">
          <div className="text-center mb-8">
            <motion.img
              src="/logo/tu.png"
              alt="TU"
              className="w-16 h-16 mx-auto mb-4 object-contain"
            />
            <h1 className="text-2xl font-bold" style={{ color: '#142361' }}>Career Pathway</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-[#e0653b]">University Portal</p>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-4 mb-8">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
                {(['login', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all micro-btn ${mode === m ? 'active' : ''}`}
                    style={{
                      backgroundColor: mode === m ? '#e0653b' : 'transparent',
                      color: mode === m ? 'white' : '#6b7280',
                      boxShadow: mode === m ? '0 6px 24px 0 rgba(224,101,59,0.10)' : 'none',
                      transform: mode === m ? 'translateY(-2px) scale(1.04)' : 'none',
                    }}
                  >
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              <div className="flex gap-1 p-1 bg-gray-50 border border-gray-200 rounded-2xl">
                {(['admin', 'faculty', 'student'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all micro-btn ${role === r ? 'active' : ''}`}
                    style={{
                      backgroundColor: role === r ? '#142361' : 'transparent',
                      color: role === r ? 'white' : '#9ca3af',
                      boxShadow: role === r ? '0 6px 24px 0 rgba(20,35,97,0.10)' : 'none',
                      transform: role === r ? 'translateY(-2px) scale(1.04)' : 'none',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="Full Name"
                  required
                />
              </div>
            )}

            {(mode === 'signup' || mode === 'login') && (role === 'student' || role === 'faculty') && (
              <div className="relative">
                {role === 'student' ? <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /> : <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                <input
                  type="text"
                  value={regNo}
                  onChange={e => setRegNo(e.target.value)}
                  className={inputClass}
                  placeholder={role === 'student' ? 'Reg No' : 'Employee ID'}
                  required={mode === 'signup' || !email.trim()}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
                placeholder="Email"
                required={mode === 'signup' || !regNo.trim()}
              />
            </div>

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl text-white font-bold transition-all disabled:opacity-50 mt-2"
              style={{ backgroundColor: '#e0653b' }}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset')}
            </button>

            <div className="text-center">
              {mode === 'login' && (
                <button type="button" onClick={() => setMode('forgot')} className="text-sm text-gray-500 hover:underline">
                  Forgot password?
                </button>
              )}
              {mode === 'forgot' && (
                <button type="button" onClick={() => setMode('login')} className="flex items-center gap-1.5 text-sm text-gray-500 mx-auto">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
