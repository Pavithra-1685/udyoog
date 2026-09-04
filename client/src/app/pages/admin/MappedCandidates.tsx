import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, User, Briefcase, Trash2, ArrowUpRight, CheckCircle2, AlertCircle, RefreshCw, Filter, Search, Users, X, MapPin } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import { toast, Toaster } from 'sonner';

export default function MappedCandidates() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('jobId');

  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'faculty' | 'student'>('faculty');
  const [userId, setUserId] = useState<string | null>(null);
  const [mappings, setMappings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [combinedData, setCombinedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New features state
  const [viewMode, setViewMode] = useState<'individual' | 'job_wise'>('individual');
  const [selectedJobForModal, setSelectedJobForModal] = useState<any | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState(jobIdParam || 'all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch in parallel to prevent join errors and ensure maximum robustness
      const [mappingRes, studentRes, jobRes] = await Promise.all([
        supabase.from('mapped_candidates').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('positions').select('*, companies(company_name)')
      ]);

      if (mappingRes.error) throw mappingRes.error;
      if (studentRes.error) throw studentRes.error;
      if (jobRes.error) throw jobRes.error;

      setMappings(mappingRes.data || []);
      setStudents(studentRes.data || []);
      setJobs(jobRes.data || []);
    } catch (err: any) {
      console.error('Data fetch error:', err.message);
      toast.error('Database sync failed. Check mapped_candidates table existence.');
    } finally {
      setIsLoading(false);
    }
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
          navigate('/student-dashboard');
          return;
        }
      } else {
        navigate('/');
        return;
      }
      await fetchData();
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (selectedJobForModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedJobForModal]);

  // Combine data whenever mappings, students, or jobs change
  useEffect(() => {
    if (mappings.length >= 0 && students.length > 0 && jobs.length > 0) {
      const combined = mappings.map(m => {
        const student = students.find(s => s.user_id === m.student_id);
        const job = jobs.find(j => j.id === m.position_id);
        return {
          ...m,
          student,
          job
        };
      }).filter(item => item.student && item.job); // Ensure both exist
      setCombinedData(combined);
    }
  }, [mappings, students, jobs]);

  const handleStatusChange = async (mappingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('mapped_candidates')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', mappingId);

      if (error) throw error;
      toast.success(`Pipeline stage updated to ${newStatus.toUpperCase()}`);
      
      // Update locally
      setMappings(prev => prev.map(m => m.id === mappingId ? { ...m, status: newStatus } : m));
    } catch (err: any) {
      toast.error('Failed to update stage: ' + err.message);
    }
  };

  const handleUnmap = async (mappingId: string) => {
    if (!window.confirm('Remove this student from the job? This will reset their assignment.')) return;
    try {
      const { error } = await supabase
        .from('mapped_candidates')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
      toast.success('Candidate unmapped successfully.');
      
      // Update locally
      setMappings(prev => prev.filter(m => m.id !== mappingId));
    } catch (err: any) {
      toast.error('Failed to unmap: ' + err.message);
    }
  };

  // Pipeline stats
  const stats = {
    total: combinedData.length,
    interviewing: combinedData.filter(c => c.status === 'interviewing').length,
    offers: combinedData.filter(c => c.status === 'offered').length,
    placed: combinedData.filter(c => c.status === 'placed').length,
    rejected: combinedData.filter(c => c.status === 'rejected').length,
  };

  // Filters logic for Individual view
  const filteredMappings = combinedData.filter(item => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const studentName = (item.student?.full_name || '').toLowerCase();
    const studentReg = (item.student?.sif_no || item.student?.registration_no || '').toLowerCase();
    const jobRole = (item.job?.role || '').toLowerCase();
    const companyName = (item.job?.companies?.company_name || '').toLowerCase();
    const textMatches = studentName.includes(query) || studentReg.includes(query) || jobRole.includes(query) || companyName.includes(query);

    // Job filter
    const jobMatches = jobFilter === 'all' || item.position_id === jobFilter;

    // Status filter
    const statusMatches = statusFilter === 'all' || item.status === statusFilter;

    return textMatches && jobMatches && statusMatches;
  });

  // Filtered jobs logic for Job Wise View
  const filteredJobs = jobs.filter(j => {
    const query = searchQuery.toLowerCase();
    const roleMatches = (j.role || '').toLowerCase().includes(query);
    const companyMatches = (j.companies?.company_name || '').toLowerCase().includes(query);
    const textMatches = roleMatches || companyMatches;

    const jobMatches = jobFilter === 'all' || j.id === jobFilter;
    return textMatches && jobMatches;
  });

  const getStatusColor = (status: string) => {
    const colors: any = {
      mapped: 'bg-gray-50 text-[#111111] border-gray-200',
      applied: 'bg-gray-50 text-indigo-600 border-indigo-200',
      interviewing: 'bg-[#f4f1e6] text-[var(--gold-medium)] border-[var(--gold-medium)]/40',
      offered: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      placed: 'bg-gray-50 text-[#111111] border-gray-200',
      rejected: 'bg-rose-50 text-rose-600 border-rose-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={userEmail} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#111111]">Candidate Placements & Pipeline</h1>
            <p className="text-gray-500 font-medium font-outfit">Track mapped talent across interview and offer stages</p>
          </div>
          
          {/* SREE Style View Switcher */}
          <div className="flex bg-gray-100 border border-gray-200 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                viewMode === 'individual'
                  ? 'bg-white text-[#111111] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Individual View
            </button>
            <button
              onClick={() => setViewMode('job_wise')}
              className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                viewMode === 'job_wise'
                  ? 'bg-white text-[#111111] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Job-Wise View
            </button>
          </div>
        </header>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Mapped" value={stats.total} color="blue" />
          <StatCard label="Interviewing" value={stats.interviewing} color="amber" />
          <StatCard label="Offers Out" value={stats.offers} color="indigo" />
          <StatCard label="Successfully Placed" value={stats.placed} color="green" />
          <StatCard label="Rejected / Closed" value={stats.rejected} color="rose" />
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search candidate, Roll No, job..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-semibold text-sm text-[#111111] focus:ring-2 focus:ring-[var(--gold-medium)]"
            >
              <option value="all">All Jobs & Openings</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.role} @ {j.companies?.company_name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              disabled={viewMode === 'job_wise'}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-semibold text-sm text-[#111111] focus:ring-2 focus:ring-[var(--gold-medium)] ${
                viewMode === 'job_wise' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="all">All Pipeline Stages</option>
              <option value="mapped">Mapped</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="placed">Placed / Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Tabular or Grid Content based on viewMode */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-20 text-center text-gray-400 font-medium shadow-sm">Syncing placement data...</div>
        ) : viewMode === 'individual' ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredMappings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="p-5 text-xs font-black uppercase text-gray-400 tracking-wider">Candidate</th>
                      <th className="p-5 text-xs font-black uppercase text-gray-400 tracking-wider">Assigned Role</th>
                      <th className="p-5 text-xs font-black uppercase text-gray-400 tracking-wider">CGPA / Branch</th>
                      <th className="p-5 text-xs font-black uppercase text-gray-400 tracking-wider">Mapping Source</th>
                      <th className="p-5 text-xs font-black uppercase text-gray-400 tracking-wider">Pipeline Stage</th>
                      <th className="p-5 text-xs font-black uppercase text-gray-400 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMappings.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/40 transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-[#111111] shadow-inner">
                              {item.student?.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-[#111111] group-hover:text-[var(--gold-medium)] transition-all cursor-pointer" onClick={() => navigate(`/faculty/student/${item.student?.sif_no || item.student?.registration_no}`)}>
                                {item.student?.full_name}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">{item.student?.sif_no || item.student?.registration_no}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-5">
                          <div>
                            <div className="font-bold text-[#111111]">{item.job?.role}</div>
                            <div className="text-xs text-[var(--gold-medium)] font-semibold">{item.job?.companies?.company_name}</div>
                          </div>
                        </td>

                        <td className="p-5">
                          <div>
                            <div className="text-sm font-black text-[#111111]">{item.student?.cgpa || '0.0'} CGPA</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">{item.student?.branch || 'General'}</div>
                          </div>
                        </td>

                        <td className="p-5">
                          {(() => {
                            const source = item.mapped_by_role || 'admin';
                            let colorClass = 'bg-gray-50 text-[#111111] border-gray-200';
                            let displayLabel = 'Admin';
                            
                            if (source === 'faculty') {
                              colorClass = 'bg-[#f4f1e6] text-[var(--gold-medium)] border-[var(--gold-medium)]/40';
                              displayLabel = 'Faculty';
                            } else if (source === 'student') {
                              colorClass = 'bg-purple-50 text-purple-600 border-purple-200';
                              displayLabel = 'Applied (Self)';
                            }
                            
                            return (
                              <span className={`px-2.5 py-1 text-[10px] font-black uppercase border rounded-full ${colorClass}`}>
                                {displayLabel}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className={`px-3 py-1.5 border text-xs font-extrabold rounded-full outline-none cursor-pointer uppercase ${getStatusColor(item.status)}`}
                            >
                              <option value="mapped">Mapped</option>
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offered">Offered</option>
                              <option value="placed">Placed</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </td>

                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/faculty/student/${item.student?.sif_no || item.student?.registration_no}`)}
                              className="p-2 text-gray-400 hover:text-[#111111] hover:bg-gray-50 rounded-lg transition-all"
                              title="View Student Profile"
                            >
                              <ArrowUpRight className="w-4.5 h-4.5" />
                            </button>
                            {(userRole === 'admin' || userRole === 'faculty') ? (
                              <button
                                onClick={() => handleUnmap(item.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove Mapping"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="p-2 text-gray-200 cursor-not-allowed"
                                title="Only Admin or Faculty can unmap this candidate"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-gray-400 font-medium">
                No placements match the current selection filter.
              </div>
            )}
          </div>
        ) : (
          /* Job Wise View Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const jobMappings = combinedData.filter(m => m.position_id === job.id);
                return (
                  <motion.div
                    key={job.id}
                    layoutId={`job-card-${job.id}`}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-[10px] px-2.5 py-0.5 bg-[var(--gold-gradient)]/5 text-[var(--gold-medium)] border border-[var(--gold-medium)]/20 rounded font-black uppercase tracking-wider">
                            {job.companies?.company_name || 'Company'}
                          </span>
                          <h4 className="text-lg font-black text-[#111111] mt-1.5">{job.role}</h4>
                        </div>
                        <button
                          onClick={() => setSelectedJobForModal(job)}
                          className="p-2.5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-[var(--gold-gradient)]/10 hover:border-[var(--gold-medium)]/20 text-[#111111] hover:text-[var(--gold-medium)] transition-all"
                          title="View Candidates"
                        >
                          <Users className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2 mt-4 text-xs font-semibold text-gray-500">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>Package: <strong className="text-gray-700">{job.package || 'Competitive'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>Location: <strong className="text-gray-700">{job.location || 'Flexible'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
                        jobMappings.length > 0 
                          ? 'bg-gray-50 text-[#111111] border border-gray-200' 
                          : 'bg-gray-50 text-gray-400 border border-gray-100'
                      }`}>
                        <Users className="w-3.5 h-3.5" />
                        {jobMappings.length} Mapped {jobMappings.length === 1 ? 'Candidate' : 'Candidates'}
                      </span>

                      <button
                        onClick={() => setSelectedJobForModal(job)}
                        className="text-xs font-bold text-[var(--gold-medium)] hover:text-[#111111] flex items-center gap-1 transition-colors"
                      >
                        Pipeline Details &rarr;
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center text-gray-400 font-medium bg-white rounded-3xl shadow-sm">
                No active openings found matching your search.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Candidate Mappings details Overlay Modal */}
      {selectedJobForModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJobForModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col z-[10000] my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <div>
                  <span className="text-[10px] px-2.5 py-0.5 bg-[var(--gold-gradient)]/5 text-[var(--gold-medium)] border border-[var(--gold-medium)]/20 rounded font-black uppercase tracking-wider">
                    {selectedJobForModal.companies?.company_name}
                  </span>
                  <h3 className="text-xl font-black text-[#111111] mt-1.5 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[var(--gold-medium)]" />
                    {selectedJobForModal.role} Pipeline
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedJobForModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {(() => {
                  const jobMappings = combinedData.filter(m => m.position_id === selectedJobForModal.id);
                  return jobMappings.length > 0 ? (
                    <div className="space-y-4">
                      {jobMappings.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 hover:bg-white hover:shadow-md border border-gray-200/40 hover:border-gray-200 rounded-2xl transition-all gap-4"
                        >
                          {/* Student identity details */}
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-[#111111] border border-gray-100 shadow-sm">
                              {item.student?.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-[#111111] hover:text-[var(--gold-medium)] cursor-pointer transition-colors" onClick={() => {
                                setSelectedJobForModal(null);
                                navigate(`/faculty/student/${item.student?.sif_no || item.student?.registration_no}`);
                              }}>
                                {item.student?.full_name}
                              </div>
                              <div className="text-xs text-gray-500 font-mono flex flex-wrap items-center gap-2 mt-0.5">
                                <span className="bg-white px-2 py-0.5 rounded border border-gray-100 font-black">
                                  ROLL NO: {item.student?.sif_no || item.student?.registration_no}
                                </span>
                                <span>•</span>
                                <span>{item.student?.branch || 'CSE'} Department</span>
                              </div>
                            </div>
                          </div>

                          {/* CGPA and Pipeline selector controls */}
                          <div className="flex flex-wrap items-center sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                            <div className="text-left sm:text-right pr-2">
                              <div className="text-sm font-black text-[#111111]">{item.student?.cgpa || '0.0'} CGPA</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Academic Grade</div>
                            </div>

                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className={`px-3 py-2 border text-xs font-extrabold rounded-full outline-none cursor-pointer uppercase ${getStatusColor(item.status)}`}
                            >
                              <option value="mapped">Mapped</option>
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offered">Offered</option>
                              <option value="placed">Placed</option>
                              <option value="rejected">Rejected</option>
                            </select>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedJobForModal(null);
                                  navigate(`/faculty/student/${item.student?.sif_no || item.student?.registration_no}`);
                                }}
                                className="p-2 text-gray-400 hover:text-[#111111] hover:bg-gray-50 rounded-xl transition-all"
                                title="View Profile"
                              >
                                <ArrowUpRight className="w-4.5 h-4.5" />
                              </button>

                              {(userRole === 'admin' || userRole === 'faculty') ? (
                                <button
                                  onClick={() => handleUnmap(item.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Remove Mapping"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="p-2 text-gray-200 cursor-not-allowed"
                                  title="Only Admin or Faculty can unmap"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-gray-400 font-medium">
                      No candidates mapped to this opening yet.
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50/50 shrink-0">
                <button
                  onClick={() => setSelectedJobForModal(null)}
                  className="px-6 py-2.5 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md cursor-pointer"
                  style={{ backgroundColor: 'var(--gold-medium)' }}
                >
                  Close Pipeline
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      <Toaster position="top-right" />
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  const configs: any = {
    blue: 'bg-gray-50 text-[#111111] border-blue-100',
    amber: 'bg-[#f4f1e6] text-[var(--gold-medium)] border-amber-100',
    indigo: 'bg-gray-50 text-indigo-600 border-gray-100',
    green: 'bg-gray-50 text-[#111111] border-green-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className={`p-5 rounded-3xl border bg-white ${configs[color] || 'bg-gray-50 border-gray-100'} shadow-sm`}>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mt-1 truncate">{label}</div>
    </div>
  );
}





