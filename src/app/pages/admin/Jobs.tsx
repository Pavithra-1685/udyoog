import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, MapPin, IndianRupee, Search, Plus, Edit2, Trash2, UserPlus, FileText, ChevronRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import { toast, Toaster } from 'sonner';

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
      const { error } = await supabase
        .from('mapped_candidates')
        .insert([{
          student_id: userId,
          position_id: jobId,
          status: 'applied',
          mapped_by: userId,
          mapped_by_role: 'student'
        }]);

      if (error) throw error;
      toast.success('Successfully applied! Your profile has been shared with the recruiters.');

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

  const getStatusBadge = (status: string) => {
    const configs: any = {
      open: 'bg-green-50 text-green-600 border-green-200',
      hold: 'bg-amber-50 text-amber-600 border-amber-200',
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
            <h1 className="text-3xl font-black text-[#142361]">
              {userRole === 'student' ? 'Career Pathway Center' : 'Corporate Job Roles'}
            </h1>
            <p className="text-gray-500 font-medium">
              {userRole === 'student'
                ? 'Browse corporate job roles and apply for active employment opportunities'
                : 'Manage and track active employment opportunities'}
            </p>
          </div>
          {userRole === 'admin' && (
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold transition-all hover:opacity-90 shadow-lg shadow-[#e0653b]/20"
              style={{ backgroundColor: '#e0653b' }}
            >
              <Plus className="w-5 h-5" />
              List New Job
            </button>
          )}
        </header>

        {/* Application Instructions Alert for Students */}
        {userRole === 'student' && (
          <div className="bg-gradient-to-r from-[#142361]/5 to-[#e0653b]/5 border-2 border-dashed border-[#e0653b]/30 p-6 rounded-3xl mb-8 flex items-start gap-4 shadow-sm backdrop-blur-sm">
            <AlertCircle className="w-6 h-6 text-[#e0653b] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-[#142361] text-sm md:text-base uppercase tracking-wider mb-1">Official Application Instructions</h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                If you would like to apply, please send your resume with the <strong className="text-[#142361]">job title and location</strong> as the subject line to <a href="mailto:shree.pop@takshashilauniv.ac.in" className="text-[#e0653b] font-bold hover:underline">shree.pop@takshashilauniv.ac.in</a>.
              </p>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">
                You can also map your talent profile directly to the opportunities below by clicking the <strong className="text-[#e0653b]">Apply Now</strong> button.
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
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e0653b] outline-none text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-sm text-[#142361] focus:ring-2 focus:ring-[#e0653b]"
            >
              <option value="all">All Locations</option>
              <option value="remote">Remote Roles</option>
              <option value="onsite">On-Site / Hybrid</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-sm text-[#142361] focus:ring-2 focus:ring-[#e0653b]"
            >
              <option value="all">All Statuses</option>
              <option value="open">Active Openings</option>
              <option value="hold">On Hold</option>
              <option value="close">Closed Listings</option>
            </select>
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
                    <div className="bg-[#e0653b]/10 px-3 py-1.5 rounded-lg border border-[#e0653b]/20">
                      <span className="text-[10px] font-black uppercase text-[#e0653b] tracking-wider">
                        {job.companies?.company_name || 'Direct Recruitment'}
                      </span>
                    </div>
                    <span className={`text-[10px] px-3 py-1.5 border font-black uppercase rounded-full shadow-sm ${getStatusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="space-y-5 mb-6 flex-1">
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role Title</h4>
                      <h3 className="font-extrabold text-2xl text-[#142361]">{job.role}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">Location</span>
                        </div>
                        <div className="font-bold text-[#142361] text-sm pl-5">{job.location || 'Remote'}</div>
                      </div>

                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <IndianRupee className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">Salary / Package</span>
                        </div>
                        <div className="font-bold text-[#142361] text-sm pl-5">{job.salary || 'Competitive'}</div>
                      </div>
                    </div>

                    <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/50">
                      <h4 className="text-[10px] font-bold text-[#142361]/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
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
                                    className="text-xs font-bold text-[#e0653b] hover:text-[#142361] ml-1.5 transition-colors focus:outline-none uppercase tracking-wider"
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
                                  className="text-xs font-bold text-[#e0653b] hover:text-[#142361] ml-1.5 transition-colors focus:outline-none uppercase tracking-wider"
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
                          <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#142361]/5 rounded-xl border border-[#142361]/10 shrink-0">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Match</span>
                            <span className="text-sm font-black text-[#142361]">{matchScore}%</span>
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
                              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-extrabold text-xs shadow-md shadow-[#e0653b]/10 hover:opacity-90 transition-all uppercase tracking-widest cursor-pointer"
                              style={{ backgroundColor: '#e0653b' }}
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
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-bold text-xs hover:bg-blue-100 transition-all"
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

                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(job)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Job"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
              className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#142361]">
                  {editingJob ? 'Edit Job Opening' : 'List New Job Role'}
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Select Company</label>
                  <select
                    value={formCompanyId}
                    onChange={(e) => setFormCompanyId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-medium text-sm text-[#142361] focus:ring-2 focus:ring-[#e0653b] outline-none"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[#e0653b] outline-none"
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
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[#e0653b] outline-none"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Salary / Package</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 LPA, 35k/mo"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[#e0653b] outline-none"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-medium text-sm text-[#142361] focus:ring-2 focus:ring-[#e0653b] outline-none"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[#e0653b] outline-none resize-none"
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex gap-3 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#e0653b] text-white rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-all disabled:opacity-50"
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
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
    </div>
  );
}
