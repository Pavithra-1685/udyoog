import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, User, Briefcase, Trash2, ArrowUpRight, CheckCircle2, AlertCircle, RefreshCw, Filter, Search } from 'lucide-react';
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

  // Filters logic
  const filteredMappings = combinedData.filter(item => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const studentName = (item.student?.full_name || '').toLowerCase();
    const studentReg = (item.student?.registration_no || '').toLowerCase();
    const jobRole = (item.job?.role || '').toLowerCase();
    const companyName = (item.job?.companies?.company_name || '').toLowerCase();
    const textMatches = studentName.includes(query) || studentReg.includes(query) || jobRole.includes(query) || companyName.includes(query);

    // Job filter
    const jobMatches = jobFilter === 'all' || item.position_id === jobFilter;

    // Status filter
    const statusMatches = statusFilter === 'all' || item.status === statusFilter;

    return textMatches && jobMatches && statusMatches;
  });

  const getStatusColor = (status: string) => {
    const colors: any = {
      mapped: 'bg-blue-50 text-blue-600 border-blue-200',
      applied: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      interviewing: 'bg-amber-50 text-amber-600 border-amber-200',
      offered: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      placed: 'bg-green-50 text-green-600 border-green-200',
      rejected: 'bg-rose-50 text-rose-600 border-rose-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={userEmail} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-[#142361]">Candidate Placements & Pipeline</h1>
          <p className="text-gray-500 font-medium">Track mapped talent across interview and offer stages</p>
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
              placeholder="Search candidate, reg no, job..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e0653b] outline-none text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-semibold text-sm text-[#142361] focus:ring-2 focus:ring-[#e0653b]"
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-semibold text-sm text-[#142361] focus:ring-2 focus:ring-[#e0653b]"
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

        {/* Mappings Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400">Syncing placement data...</div>
          ) : filteredMappings.length > 0 ? (
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
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-[#142361] shadow-inner">
                            {item.student?.full_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#142361] group-hover:text-[#e0653b] transition-all cursor-pointer" onClick={() => navigate(`/faculty/student/${item.student?.user_id}`)}>
                              {item.student?.full_name}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">{item.student?.registration_no}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-5">
                        <div>
                          <div className="font-bold text-[#142361]">{item.job?.role}</div>
                          <div className="text-xs text-[#e0653b] font-semibold">{item.job?.companies?.company_name}</div>
                        </div>
                      </td>

                      <td className="p-5">
                        <div>
                          <div className="text-sm font-black text-[#142361]">{item.student?.cgpa || '0.0'} CGPA</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">{item.student?.branch || 'General'}</div>
                        </div>
                      </td>

                      <td className="p-5">
                        {(() => {
                          const source = item.mapped_by_role || 'admin';
                          let colorClass = 'bg-blue-50 text-blue-600 border-blue-200';
                          let displayLabel = 'Admin';
                          
                          if (source === 'faculty') {
                            colorClass = 'bg-amber-50 text-amber-600 border-amber-200';
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
                            onClick={() => navigate(`/faculty/student/${item.student?.user_id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Student Profile"
                          >
                            <ArrowUpRight className="w-4.5 h-4.5" />
                          </button>
                          {(userRole === 'admin' || (userRole === 'faculty' && item.mapped_by_role === 'faculty' && item.mapped_by === userId)) ? (
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
                              title="Only Admin or the mapping Faculty can unmap this candidate"
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
            <div className="py-20 text-center text-gray-400 font-medium bg-white rounded-3xl">
              No placements match the current selection filter.
            </div>
          )}
        </div>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  const configs: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className={`p-5 rounded-3xl border bg-white ${configs[color] || 'bg-gray-50 border-gray-100'} shadow-sm`}>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mt-1 truncate">{label}</div>
    </div>
  );
}
