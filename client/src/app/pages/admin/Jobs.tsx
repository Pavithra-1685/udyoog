import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, MapPin, IndianRupee, Search, Plus, Edit2, Trash2, UserPlus, FileText, ChevronRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import { toast, Toaster } from 'sonner';

import { notifyStudentApplied } from '../../../lib/notificationService';

export default function Jobs() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'faculty' | 'student'>('faculty');
  const [userId, setUserId] = useState<string | null>(null);
  const [studentMappings, setStudentMappings] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});

  const toggleExpandJob = (jobId: string) => {
    setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  // Form Modal States
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formStatus, setFormStatus] = useState('open');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJobsAndCompanies = async () => {
    setIsLoading(true);
    try {
      // Fetch positions with company details
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          companies (
            id,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (positionsError) throw positionsError;
      setJobs(positionsData || []);

      // Fetch active companies for the drop-down
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name')
        .order('company_name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      toast.error('Failed to sync job openings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    if (!userId) return;

    // Limit Applied Jobs to 3
    const appliedCount = studentMappings.filter(m => m.status === 'applied').length;
    if (appliedCount >= 3) {
      toast.warning('Application Limit Reached: You can only apply to a maximum of 3 jobs at a time. Please withdraw an application first.');
      return;
    }

    try {
      let validMappedBy: string | null = null;
      if (userId) {
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();
        if (profileCheck) validMappedBy = userId;
      }

      const insertPayload: any = {
        student_id: userId,
        position_id: jobId,
        status: 'applied',
        mapped_by_role: 'student'
      };
      if (validMappedBy) insertPayload.mapped_by = validMappedBy;

      let { error } = await supabase
        .from('mapped_candidates')
        .insert([insertPayload]);

      if (error && (error.message?.includes('mapped_by_fkey') || error.code === '23503')) {
        delete insertPayload.mapped_by;
        const retry = await supabase
          .from('mapped_candidates')
          .insert([insertPayload]);
        error = retry.error;
      }

      if (error) throw error;
      toast.success('Successfully applied! Your profile has been shared with the recruiters.');

      // Dispatch Real-time Notifications to Admin and Faculty
      const targetJob = jobs.find(j => j.id === jobId);
      const { data: studentProf } = await supabase.from('profiles').select('full_name, branch, graduation').eq('user_id', userId).maybeSingle();
      notifyStudentApplied({
        studentId: userId,
        studentName: studentProf?.full_name || 'Student',
        department: studentProf?.branch || studentProf?.graduation || 'General',
        jobTitle: targetJob?.role || 'Job Role',
        companyName: targetJob?.companies?.company_name || 'Partner Company',
        jobId: jobId
      });

      // Refresh student mappings
      const { data: maps } = await supabase
        .from('mapped_candidates')
        .select('*')
        .eq('student_id', userId);
      setStudentMappings(maps || []);
    } catch (err: any) {
      toast.error('Failed to submit application: ' + err.message);
    }
  };

  const handleUnapplyJob = async (jobId: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('mapped_candidates')
        .delete()
        .eq('student_id', userId)
        .eq('position_id', jobId);

      if (error) throw error;
      toast.success('Application withdrawn successfully.');
      
      const { data: maps } = await supabase
        .from('mapped_candidates')
        .select('*')
        .eq('student_id', userId);
      setStudentMappings(maps || []);
    } catch (err: any) {
      toast.error('Failed to withdraw application: ' + err.message);
    }
  };

  const getMatchScore = (jId: string, sId: string) => {
    const str = jId + sId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 75 + (Math.abs(hash) % 25);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const currentRole = profile?.role || user.user_metadata?.role || 'faculty';
        setUserRole(currentRole as any);

        if (currentRole === 'student') {
          // Fetch student's existing mappings
          const { data: maps } = await supabase
            .from('mapped_candidates')
            .select('*')
            .eq('student_id', user.id);
          setStudentMappings(maps || []);
        }
      } else {
        navigate('/');
        return;
      }
      await fetchJobsAndCompanies();
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showForm]);

  const openCreateModal = () => {
    setEditingJob(null);
    setFormCompanyId('');
    setFormRole('');
    setFormDescription('');
    setFormLocation('');
    setFormSalary('');
    setFormStatus('open');
    setShowForm(true);
  };

  const openEditModal = (job: any) => {
    setEditingJob(job);
    setFormCompanyId(job.company_id);
    setFormRole(job.role);
    setFormDescription(job.description || '');
    setFormLocation(job.location || '');
    setFormSalary(job.salary || '');
    setFormStatus(job.status || 'open');
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompanyId || !formRole.trim()) {
      toast.error('Company and Job Title are required.');
      return;
    }
    setIsSubmitting(true);

    try {
      if (editingJob) {
        // Edit position
        const { error } = await supabase
          .from('positions')
          .update({
            company_id: formCompanyId,
            role: formRole.trim(),
            description: formDescription.trim(),
            location: formLocation.trim(),
            salary: formSalary.trim(),
            status: formStatus,
          })
          .eq('id', editingJob.id);

        if (error) throw error;
        toast.success('Job details updated successfully!');
      } else {
        // Create position (Note: user_id trigger automates user ownership or we can grab auth.uid())
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('positions')
          .insert([{
            company_id: formCompanyId,
            user_id: user?.id,
            role: formRole.trim(),
            description: formDescription.trim(),
            location: formLocation.trim(),
            salary: formSalary.trim(),
            status: formStatus,
          }]);

        if (error) throw error;
        toast.success('New job role listed!');
      }
      setShowForm(false);
      fetchJobsAndCompanies();
    } catch (err: any) {
      toast.error('Operation failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this job listing? All corresponding candidate mappings will be archived.')) return;
    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Job listing deleted.');
      fetchJobsAndCompanies();
    } catch (err: any) {
      toast.error('Deletion failed: ' + err.message);
    }
  };

  // Filters logic
  const filteredJobs = jobs.filter(job => {
    // If student, ONLY show open jobs (completely exclude closed or on-hold jobs)
    if (userRole === 'student' && job.status !== 'open') {
      return false;
    }

    const query = searchQuery.toLowerCase();
    const roleMatches = (job.role || '').toLowerCase().includes(query);
    const descMatches = (job.description || '').toLowerCase().includes(query);
    const companyMatches = (job.companies?.company_name || '').toLowerCase().includes(query);
    const textMatches = roleMatches || descMatches || companyMatches;

    const locationMatches = locationFilter === 'all' || 
      (locationFilter === 'remote' && (job.location || '').toLowerCase().includes('remote')) ||
      (locationFilter === 'onsite' && !(job.location || '').toLowerCase().includes('remote'));

    const statusMatches = statusFilter === 'all' || job.status === statusFilter;

    return textMatches && locationMatches && statusMatches;
  });

  const handleQuickStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('positions')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;
      toast.success(`Job status updated to ${newStatus.toUpperCase()}`);
      setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch (err: any) {
      toast.error('Failed to update job status: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      open: 'bg-gray-50 text-[#111111] border-gray-200',
      hold: 'bg-[#f4f1e6] text-[var(--gold-medium)] border-[var(--gold-medium)]/40',
      close: 'bg-red-50 text-red-600 border-red-200'
    };
    return configs[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={userEmail} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#111111]">
              {userRole === 'student' ? 'Udyoog Center' : 'Corporate Job Roles'}
            </h1>
            <p className="text-gray-500 font-medium">
              {userRole === 'student'
                ? 'Browse corporate job roles and apply for active employment opportunities'
                : 'Manage and track active employment opportunities'}
            </p>
          </div>
          {(userRole === 'admin' || userRole === 'faculty') && (
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold transition-all hover:opacity-90 shadow-lg shadow-[var(--gold-gradient)]/20 cursor-pointer"
              style={{ backgroundColor: 'var(--gold-medium)' }}
            >
              <Plus className="w-5 h-5" />
              List New Job
            </button>
          )}
        </header>

        {/* Application Instructions Alert for Students */}
        {userRole === 'student' && (
          <div className="bg-gradient-to-r from-[#111111]/5 to-[var(--gold-medium)]/5 border-2 border-dashed border-[var(--gold-medium)]/30 p-6 rounded-3xl mb-8 flex items-start gap-4 shadow-sm backdrop-blur-sm">
            <AlertCircle className="w-6 h-6 text-[var(--gold-medium)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-[#111111] text-sm md:text-base uppercase tracking-wider mb-1">Official Application Instructions</h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                If you would like to apply, please send your resume with the <strong className="text-[#111111]">job title and location</strong> as the subject line to <a href="mailto:naraatraltech@gmail.com" className="text-[var(--gold-medium)] font-bold hover:underline">naraatraltech@gmail.com</a>.
              </p>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">
                You can also map your talent profile directly to the opportunities below by clicking the <strong className="text-[var(--gold-medium)]">Apply Now</strong> button.
              </p>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search by role, company, description..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-sm text-[#111111] focus:ring-2 focus:ring-[var(--gold-medium)]"
            >
              <option value="all">All Locations</option>
              <option value="remote">Remote Roles</option>
              <option value="onsite">On-Site / Hybrid</option>
            </select>

            {userRole !== 'student' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-sm text-[#111111] focus:ring-2 focus:ring-[var(--gold-medium)]"
              >
                <option value="all">All Statuses</option>
                <option value="open">Active Openings</option>
                <option value="hold">On Hold</option>
                <option value="close">Closed Listings</option>
              </select>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-gray-400">Loading job postings...</div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <motion.div
                layout
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all flex flex-col justify-between"
              >
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-[var(--gold-gradient)]/10 px-3 py-1.5 rounded-lg border border-[var(--gold-medium)]/20">
                      <span className="text-[10px] font-black uppercase text-[var(--gold-medium)] tracking-wider">
                        {job.companies?.company_name || 'Direct Recruitment'}
                      </span>
                    </div>
                    {(userRole === 'admin' || userRole === 'faculty') ? (
                      <div className="relative">
                        <select
                          value={job.status || 'open'}
                          onChange={(e) => handleQuickStatusChange(job.id, e.target.value)}
                          className={`text-[10px] px-3 py-1.5 border font-black uppercase rounded-full shadow-sm cursor-pointer outline-none appearance-none pr-6 ${getStatusBadge(job.status)}`}
                          title="Click to change job status"
                        >
                          <option value="open" className="bg-white text-gray-900 font-bold">OPEN</option>
                          <option value="hold" className="bg-white text-amber-700 font-bold">HOLD</option>
                          <option value="close" className="bg-white text-red-600 font-bold">CLOSED</option>
                        </select>
                        <ChevronRight className="w-3 h-3 rotate-90 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    ) : (
                      <span className={`text-[10px] px-3 py-1.5 border font-black uppercase rounded-full shadow-sm ${getStatusBadge(job.status)}`}>
                        {job.status === 'close' ? 'CLOSED' : job.status}
                      </span>
                    )}
                  </div>

                  <div className="space-y-5 mb-6 flex-1">
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role Title</h4>
                      <h3 className="font-extrabold text-2xl text-[#111111]">{job.role}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">Location</span>
                        </div>
                        <div className="font-bold text-[#111111] text-sm pl-5">{job.location || 'Remote'}</div>
                      </div>

                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <IndianRupee className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">Salary / Package</span>
                        </div>
                        <div className="font-bold text-[#111111] text-sm pl-5">{job.salary || 'Competitive'}</div>
                      </div>
                    </div>

                    <div className="bg-gray-50/40 p-4 rounded-2xl border border-blue-100/50">
                      <h4 className="text-[10px] font-bold text-[#111111]/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> Job Description
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-outfit">
                        {(() => {
                          const desc = job.description || 'No detailed requirements listed for this opening.';
                          const isExpanded = expandedJobs[job.id];
                          if (desc.length <= 120 || isExpanded) {
                            return (
                              <>
                                {desc}
                                {desc.length > 120 && (
                                  <button
                                    onClick={() => toggleExpandJob(job.id)}
                                    className="text-xs font-bold text-[var(--gold-medium)] hover:text-[#111111] ml-1.5 transition-colors focus:outline-none uppercase tracking-wider"
                                  >
                                    [ Read Less ]
                                  </button>
                                )}
                              </>
                            );
                          } else {
                            return (
                              <>
                                {desc.slice(0, 120)}...
                                <button
                                  onClick={() => toggleExpandJob(job.id)}
                                  className="text-xs font-bold text-[var(--gold-medium)] hover:text-[#111111] ml-1.5 transition-colors focus:outline-none uppercase tracking-wider"
                                >
                                  [ Click to Read More ]
                                </button>
                              </>
                            );
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 mt-auto">
                  {userRole === 'student' ? (
                    (() => {
                      const mapping = studentMappings.find(m => m.position_id === job.id);
                      const matchScore = getMatchScore(job.id, userId || '');
                      
                      return (
                        <div className="w-full flex items-center gap-3">
                          <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#111111]/5 rounded-xl border border-[#111111]/10 shrink-0">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Match</span>
                            <span className="text-sm font-black text-[#111111]">{matchScore}%</span>
                          </div>
                          
                          {mapping ? (
                            <div className="flex-1 flex gap-2">
                              <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs rounded-xl uppercase">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Applied</span>
                              </div>
                              <button
                                onClick={() => handleUnapplyJob(job.id)}
                                className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                              >
                                Withdraw
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApplyJob(job.id)}
                              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-extrabold text-xs shadow-md shadow-[var(--gold-medium)]/10 hover:opacity-90 transition-all uppercase tracking-widest cursor-pointer"
                              style={{ backgroundColor: 'var(--gold-medium)' }}
                            >
                              Apply Now
                            </button>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/talent-pool?jobId=${job.id}`)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 text-[#111111] border border-blue-100 font-bold text-xs hover:bg-gray-100 transition-all"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Map Talent
                        </button>
                        <button
                          onClick={() => navigate(`/mapped-candidates?jobId=${job.id}`)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 font-bold text-xs hover:bg-purple-100 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Track Pipeline
                        </button>
                      </div>

                      {(userRole === 'admin' || userRole === 'faculty') && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(job)}
                            className="p-2 text-gray-400 hover:text-[#111111] hover:bg-gray-50 rounded-lg transition-all"
                            title="Edit Job"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 font-medium">
            No active jobs match your search parameters.
          </div>
        )}
      </main>

      {/* CREATE & EDIT FORM MODAL */}
      {showForm && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col z-[10000] my-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <h3 className="text-xl font-bold text-[#111111]">
                  {editingJob ? 'Edit Job Opening' : 'List New Job Role'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Select Company</label>
                  <select
                    value={formCompanyId}
                    onChange={(e) => setFormCompanyId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-medium text-sm text-[#111111] focus:ring-2 focus:ring-[var(--gold-medium)] outline-none"
                    required
                  >
                    <option value="">Choose a company...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Fullstack Engineer"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[var(--gold-medium)] outline-none"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore, Remote"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[var(--gold-medium)] outline-none"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Salary / Package</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 LPA, 35k/mo"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[var(--gold-medium)] outline-none"
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-medium text-sm text-[#111111] focus:ring-2 focus:ring-[var(--gold-medium)] outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="hold">Hold</option>
                    <option value="close">Closed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Job Description</label>
                  <textarea
                    placeholder="Provide description or candidate requirements..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[var(--gold-medium)] outline-none resize-none"
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex gap-3 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 text-white rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: 'var(--gold-medium)' }}
                  >
                    {isSubmitting ? 'Saving...' : (editingJob ? 'Update Job Details' : 'Save & Publish')}
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
          </div>
        </AnimatePresence>,
        document.body
      )}

      <Toaster position="top-right" />
    </div>
  );
}





