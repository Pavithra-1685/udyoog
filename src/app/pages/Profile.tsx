import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { User, Mail, Calendar, Save, Lock, Eye, EyeOff } from 'lucide-react';
import Navigation from '../components/Navigation';
import { supabase } from '../../lib/supabase';
import { toast, Toaster } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || '');
        setJoinDate(new Date(user.created_at).toLocaleDateString());
      } else {
        navigate('/');
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (error) throw error;
      toast.success('Profile updated successfully.');
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

  return (
    <div className="min-h-screen bg-white">
      <Navigation userEmail={userEmail} />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl mb-6" style={{ color: '#142361' }}>
            Profile Settings
          </h1>

          {/* Profile Information */}
          <div className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-6 sm:p-8 mb-6">
            <h3 className="text-lg mb-6" style={{ color: '#142361' }}>
              Personal Information
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm mb-2 flex items-center gap-2" style={{ color: '#142361' }}>
                  <User className="w-5 h-5" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                  placeholder=""
                />
              </div>

              <div>
                <label className="block text-sm mb-2 flex items-center gap-2" style={{ color: '#142361' }}>
                  <Mail className="w-5 h-5" />
                  Email
                </label>
                <input
                  type="email"
                  value={userEmail}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email is linked to your authentication account and cannot be changed here.</p>
              </div>

              <div>
                <label className="block text-sm mb-2 flex items-center gap-2" style={{ color: '#142361' }}>
                  <Calendar className="w-5 h-5" />
                  Member Since
                </label>
                <input
                  type="text"
                  value={joinDate}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#e0653b' }}
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-6 sm:p-12">
            <h3 className="text-lg mb-6" style={{ color: '#142361' }}>
              Security — Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#142361' }}>
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
                    placeholder=""
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

              <div>
                <label className="block text-sm mb-2" style={{ color: '#142361' }}>
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
                    placeholder=""
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters required.</p>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                  Confirm New Password
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
                    placeholder=""
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50"
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
