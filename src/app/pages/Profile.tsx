import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { User, Mail, Calendar, Save, Lock, Eye, EyeOff, Loader2, Briefcase } from 'lucide-react';
import Navigation from '../components/shared/Navigation';
import StudentProfileForm from '../components/student/StudentProfileForm';
import { supabase } from '../../lib/supabase';
import { toast, Toaster } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'student' | 'faculty'>('admin');
  const [regNo, setRegNo] = useState('');
  const [profileData, setProfileData] = useState<any>(null);
  const [joinDate, setJoinDate] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchUserData = async () => {
    setIsInitialLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setJoinDate(new Date(user.created_at).toLocaleDateString());
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          setRole(profile.role || 'admin');
          setFullName(profile.full_name || '');
          setRegNo(profile.registration_no || '');
          setProfileData({ ...profile, email: user.email });
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          registration_no: role === 'faculty' ? regNo : undefined
        })
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;
      
      toast.success('Profile updated!');
      fetchUserData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#e0653b]" />
          <p className="text-gray-500 font-medium italic">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation userEmail={userEmail} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#142361' }}>
              {role === 'student' ? 'Student Portfolio' : role === 'faculty' ? 'Faculty Profile' : 'Profile Settings'}
            </h1>
            <p className="text-gray-500">
              Manage your professional presence and security.
            </p>
          </header>

          <div className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-xl border border-gray-200/50 p-6 sm:p-10 mb-8">
            {role === 'student' ? (
              <StudentProfileForm initialData={profileData} onSave={fetchUserData} />
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <h3 className="text-xl font-semibold mb-6" style={{ color: '#142361' }}>
                  {role === 'faculty' ? 'Faculty Information' : 'Admin Information'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#142361' }}>
                      <User className="w-5 h-5" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                      placeholder="Enter full name"
                    />
                  </div>

                  {role === 'faculty' && (
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#142361' }}>
                        <Briefcase className="w-5 h-5" />
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                        placeholder="Enter employee ID"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#142361' }}>
                      <Mail className="w-5 h-5" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#142361' }}>
                      <Calendar className="w-5 h-5" />
                      Joined
                    </label>
                    <input
                      type="text"
                      value={joinDate}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#e0653b]/20"
                    style={{ backgroundColor: '#e0653b' }}
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Updating...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-xl border border-gray-200/50 p-6 sm:p-10 mb-12">
            <h3 className="text-xl font-semibold mb-6" style={{ color: '#142361' }}>
              Security
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#142361' }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                      required
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-start-1">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#142361' }}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                      required
                      minLength={8}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#142361' }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                      required
                      minLength={8}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#142361]/20"
                  style={{ backgroundColor: '#142361' }}
                >
                  <Lock className="w-5 h-5" />
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
