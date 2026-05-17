import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, Search, Edit2, Trash2, Shield, X, Mail, Key, Hash, BookOpen, Star, GraduationCap, Briefcase } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import { toast, Toaster } from 'sonner';

export default function UserManagement() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'student' | 'faculty'>('student');
  const [isLoading, setIsLoading] = useState(true);

  // Modal form states
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'faculty' | 'student'>('student');
  const [formRegNo, setFormRegNo] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formCgpa, setFormCgpa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      toast.error('Failed to sync users database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        const currentRole = profile?.role || user.user_metadata?.role || 'faculty';
        if (currentRole !== 'admin') {
          navigate(currentRole === 'student' ? '/student-dashboard' : '/faculty-dashboard');
          return;
        }
      } else {
        navigate('/');
        return;
      }
      await fetchUsers();
    };
    init();
  }, [navigate]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole(activeTab); // Autofills current selected directory tab role
    setFormRegNo('');
    setFormBranch('');
    setFormCgpa('');
    setShowForm(true);
  };

  const openEditModal = (userItem: any) => {
    setEditingUser(userItem);
    setFormName(userItem.full_name || '');
    setFormEmail(userItem.email || '');
    setFormPassword('');
    setFormRole(userItem.role === 'faculty' ? 'faculty' : 'student');
    setFormRegNo(userItem.registration_no || '');
    setFormBranch(userItem.branch || '');
    setFormCgpa(userItem.cgpa || '');
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formRegNo.trim()) {
      toast.error('Name, Email, and Unique ID are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Edit User via admin RPC
        const { error: rpcError } = await supabase.rpc('admin_update_user', {
          p_user_id: editingUser.user_id,
          p_full_name: formName.trim(),
          p_role: formRole,
          p_reg_no: formRegNo.trim(),
          p_email: formEmail.trim().toLowerCase()
        });

        if (rpcError) throw rpcError;

        // Update secondary fields in profiles (CGPA, Branch)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            branch: formBranch.trim() || null,
            cgpa: formRole === 'student' ? (parseFloat(formCgpa) || 0) : null
          })
          .eq('user_id', editingUser.user_id);

        if (profileError) throw profileError;
        toast.success(`Profile for ${formName} successfully updated!`);
      } else {
        // Create User via admin RPC
        if (formPassword.length < 6) {
          toast.error('Password must be at least 6 characters.');
          setIsSubmitting(false);
          return;
        }

        const { data: newUserId, error: rpcError } = await supabase.rpc('admin_create_user', {
          p_email: formEmail.trim().toLowerCase(),
          p_password: formPassword,
          p_full_name: formName.trim(),
          p_role: formRole,
          p_reg_no: formRegNo.trim()
        });

        if (rpcError) throw rpcError;

        // If student, update additional fields
        if (newUserId && (formBranch || formCgpa)) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              branch: formBranch.trim() || null,
              cgpa: formRole === 'student' ? (parseFloat(formCgpa) || 0) : null
            })
            .eq('user_id', newUserId);

          if (profileError) throw profileError;
        }

        toast.success(`Account successfully provisioned for ${formName}!`);
      }
      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      toast.error('Operation failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userItem: any) => {
    if (userItem.role === 'admin') {
      toast.error('System admins cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you absolutely sure you want to permanently delete the profile and credentials of ${userItem.full_name}? This action is irreversible and cascades to all portfolios and mappings.`)) return;

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        p_user_id: userItem.user_id
      });

      if (error) throw error;
      toast.success('Account permanently deleted.');
      fetchUsers();
    } catch (err: any) {
      toast.error('Deletion failed: ' + err.message);
    }
  };

  // Filter students or faculty based on active tab
  const filteredUsers = users.filter(u => {
    if (u.role !== activeTab) return false;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const nameMatches = (u.full_name || '').toLowerCase().includes(query);
    const idMatches = (u.registration_no || '').toLowerCase().includes(query);
    const emailMatches = (u.email || '').toLowerCase().includes(query);

    return nameMatches || idMatches || emailMatches;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={userEmail} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Block matching SREE design */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#142361]">User Management</h1>
            <p className="text-gray-500">Provision and manage Faculty and Student portal profiles</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold transition-all hover:opacity-90 shadow-md hover:shadow-lg self-start md:self-auto"
            style={{ backgroundColor: '#e0653b' }}
          >
            <UserPlus className="w-5 h-5" />
            Provision Account
          </button>
        </header>

        {/* Directory Toggle Tabs matching SREE theme */}
        <div className="flex border-b border-gray-200 mb-8 gap-4">
          <button
            onClick={() => {
              setActiveTab('student');
              setSearchQuery('');
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 px-1 flex items-center gap-2 ${
              activeTab === 'student'
                ? 'border-[#e0653b] text-[#e0653b]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Directory
          </button>
          <button
            onClick={() => {
              setActiveTab('faculty');
              setSearchQuery('');
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 px-1 flex items-center gap-2 ${
              activeTab === 'faculty'
                ? 'border-[#e0653b] text-[#e0653b]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Faculty Directory
          </button>
        </div>

        {/* Search Panel matching Faculty Lookup exactly */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-[#142361] mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#e0653b]" />
              {activeTab === 'student' ? 'Student Lookup' : 'Faculty Lookup'}
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder={
                  activeTab === 'student'
                    ? 'Search by Student Name or Registration Number...'
                    : 'Search by Faculty Name or Employee Code...'
                }
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#e0653b] focus:border-transparent outline-none transition-all text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            </div>
          </section>
        </div>

        {/* Directory Items List in same UI cards alignment as Faculty Dashboard */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#142361] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#e0653b]" />
              {activeTab === 'student' ? 'Active Students Registry' : 'Academic Supervisors Registry'}
            </h2>
            <span className="text-xs font-bold text-gray-400 uppercase">
              {filteredUsers.length} {activeTab === 'student' ? 'Students' : 'Faculty'} Listed
            </span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 text-center text-gray-400">Loading directory...</div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((userItem) => (
                <div 
                  key={userItem.user_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 rounded-2xl transition-all group gap-4"
                >
                  {/* Left Identity Container */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold border border-gray-100 shadow-sm ${
                      activeTab === 'faculty' ? 'text-amber-500' : 'text-[#142361]'
                    }`}>
                      {userItem.full_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[#142361] group-hover:text-[#e0653b] transition-colors">
                        {userItem.full_name}
                      </div>
                      <div className="text-xs text-gray-500 font-mono flex flex-wrap items-center gap-2">
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-100 font-black">
                          {activeTab === 'student' ? 'REG NO:' : 'EMP CODE:'} {userItem.registration_no || 'N/A'}
                        </span>
                        <span>•</span>
                        <span>{userItem.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Details and Action Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    {activeTab === 'student' && (
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-bold text-[#142361]">{userItem.cgpa || '0.0'} CGPA</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {userItem.branch || 'CSE'} Department
                        </div>
                      </div>
                    )}

                    {activeTab === 'faculty' && (
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded font-black uppercase tracking-wider">
                          Faculty
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(userItem)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(userItem)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Remove Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-400">
                No matching accounts listed in this directory.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* CREATE & EDIT USER FORM MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#142361] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#e0653b]" />
                  {editingUser ? 'Edit Profile Details' : 'Provision Portal Account'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Dr. Shankar Narayana"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[#e0653b] outline-none"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="username@university.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[#e0653b] outline-none"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Password field only shown during creation */}
                {!editingUser && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Access Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[#e0653b] outline-none"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        required
                      />
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Role Assignment</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-medium text-sm text-[#142361] focus:ring-2 focus:ring-[#e0653b] outline-none"
                  >
                    <option value="student">Student Portal</option>
                    <option value="faculty">Faculty Portal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {formRole === 'faculty' ? 'Employee Code / ID' : 'Registration Number'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={formRole === 'faculty' ? 'e.g. EMP-9988' : 'e.g. RA2211003...'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[#e0653b] outline-none"
                      value={formRegNo}
                      onChange={(e) => setFormRegNo(e.target.value)}
                      required
                    />
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {formRole === 'student' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Department / Branch</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. CSE"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#e0653b] outline-none"
                          value={formBranch}
                          onChange={(e) => setFormBranch(e.target.value)}
                        />
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current CGPA</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          placeholder="e.g. 9.1"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#e0653b] outline-none"
                          value={formCgpa}
                          onChange={(e) => setFormCgpa(e.target.value)}
                        />
                        <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#e0653b] text-white rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : (editingUser ? 'Save Updates' : 'Provision User')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
    </div>
  );
}
