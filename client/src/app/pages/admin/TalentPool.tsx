import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, User, Target, ChevronRight, Filter, Star, Zap, GraduationCap, MapPin, Briefcase, IndianRupee, Layers, Check, Sparkles, X, PlusCircle, UserCheck, Github, Linkedin, LayoutDashboard, FileText, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import { toast, Toaster } from 'sonner';

export default function TalentPool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlJobId = searchParams.get('jobId');

  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'faculty' | 'student'>('faculty');
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection states for comparison
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Active assignment selection state
  const [activeCandidateToAssign, setActiveCandidateToAssign] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studentRes, jobRes, mappingRes] = await Promise.all([
        supabase.from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('full_name'),
        supabase.from('positions').select('*, companies(company_name)').eq('status', 'open'),
        supabase.from('mapped_candidates').select('*')
      ]);

      if (studentRes.error) throw studentRes.error;
      if (jobRes.error) throw jobRes.error;
      if (mappingRes.error) throw mappingRes.error;

      setStudents(studentRes.data || []);
      const activeJobsList = jobRes.data || [];
      setActiveJobs(activeJobsList);
      setMappings(mappingRes.data || []);

      // If jobId is present in URL query, set it as selected job
      if (urlJobId) {
        const foundJob = activeJobsList.find(j => j.id === urlJobId);
        if (foundJob) setSelectedJob(foundJob);
      } else if (activeJobsList.length > 0) {
        setSelectedJob(activeJobsList[0]);
      }
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      toast.error('Failed to load talent pool details.');
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
  }, [navigate, urlJobId]);

  useEffect(() => {
    if (selectedStudent && selectedJob) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedStudent, selectedJob]);

  const calculateMatch = (student: any, job: any) => {
    if (!student || !job) return 0;
    
    let skillsScore = 0; // out of 50
    let academicScore = 0; // out of 30
    let branchScore = 0; // out of 20

    // 1. SKILLS MATCH (50 points maximum)
    const studentSkills = (student.skills || []).map((s: any) => {
      const name = typeof s === 'string' ? s : (s.name || '');
      const level = typeof s === 'string' ? 'Intermediate' : (s.level || 'Intermediate');
      return { name: name.toLowerCase().trim(), level };
    }).filter((s: any) => s.name);

    if (studentSkills.length > 0) {
      const jobText = [job.role, job.description || ''].join(' ').toLowerCase();
      
      let matches = 0;
      studentSkills.forEach((skill: any) => {
        if (jobText.includes(skill.name)) {
          const multiplier = skill.level === 'Expert' ? 1.5 : skill.level === 'Intermediate' ? 1.0 : 0.6;
          matches += multiplier;
        }
      });

      if (matches > 0) {
        skillsScore = Math.min((matches / Math.max(studentSkills.length * 0.4, 2)) * 50, 50);
      }
    }

    // 2. CGPA ELIGIBILITY (30 points maximum)
    const cgpaVal = parseFloat(student.cgpa || '0');
    if (cgpaVal >= 9.0) {
      academicScore = 30;
    } else if (cgpaVal >= 8.0) {
      academicScore = 26;
    } else if (cgpaVal >= 7.0) {
      academicScore = 20;
    } else if (cgpaVal >= 6.0) {
      academicScore = 14;
    } else if (cgpaVal > 0) {
      academicScore = 8;
    }

    // 3. DEPARTMENT / BRANCH SUITABILITY (20 points maximum)
    const branch = (student.branch || '').toLowerCase();
    const roleText = (job.role || '').toLowerCase();
    const descText = (job.description || '').toLowerCase();

    const isTechJob = roleText.includes('software') || roleText.includes('developer') || roleText.includes('web') || roleText.includes('frontend') || roleText.includes('backend') || roleText.includes('fullstack') || roleText.includes('coder') || roleText.includes('tech') || roleText.includes('it');
    const isCoreTechBranch = branch.includes('computer') || branch.includes('cse') || branch.includes('information') || branch.includes('it') || branch.includes('software');

    if (branch) {
      if (descText.includes(branch) || roleText.includes(branch)) {
        branchScore = 20;
      } else if (isTechJob && isCoreTechBranch) {
        branchScore = 18;
      } else if (isTechJob && (branch.includes('electronics') || branch.includes('ece') || branch.includes('electrical') || branch.includes('eee'))) {
        branchScore = 15;
      } else {
        branchScore = 12;
      }
    } else {
      branchScore = 10;
    }

    const finalScore = Math.round(skillsScore + academicScore + branchScore);
    return Math.min(Math.max(finalScore, 0), 100);
  };

  const handleMapCandidate = async (studentId: string, jobId: string) => {
    try {
      // Check if already mapped
      const isAlreadyMapped = mappings.some(m => m.student_id === studentId && m.position_id === jobId);
      if (isAlreadyMapped) {
        toast.info('This candidate is already mapped to this job.');
        return;
      }

      const { error } = await supabase
        .from('mapped_candidates')
        .insert([{
          student_id: studentId,
          position_id: jobId,
          status: 'mapped',
          mapped_by: userId,
          mapped_by_role: userRole
        }]);

      if (error) throw error;
      
      toast.success('Candidate mapped successfully!');
      
      // Refresh mappings
      const { data: updatedMappings } = await supabase.from('mapped_candidates').select('*');
      if (updatedMappings) setMappings(updatedMappings);

      setActiveCandidateToAssign(null);
    } catch (err: any) {
      toast.error('Failed to map candidate: ' + err.message);
    }
  };

  const handleUnmapCandidate = async (studentId: string, jobId: string) => {
    try {
      const mapping = mappings.find(m => m.student_id === studentId && m.position_id === jobId);
      if (!mapping) return;

      const { error } = await supabase
        .from('mapped_candidates')
        .delete()
        .eq('id', mapping.id);

      if (error) throw error;
      toast.success('Candidate unmapped.');
      
      // Refresh mappings
      setMappings(prev => prev.filter(m => m.id !== mapping.id));
    } catch (err: any) {
      toast.error('Operation failed: ' + err.message);
    }
  };

  // Admin delete student account permanently
  const handleAdminDeleteStudent = async (studentItem: any) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete student ${studentItem.full_name}?`)) return;
    if (!window.confirm(`This will destroy their Supabase authentication credentials and profile cascade. This action is irreversible. Press OK to finalize.`)) return;

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        p_user_id: studentItem.user_id
      });

      if (error) throw error;
      toast.success(`Successfully deleted student ${studentItem.full_name} and their credentials.`);
      
      // Refresh local list
      fetchData();
    } catch (err: any) {
      toast.error('Deletion failed: ' + err.message);
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    e.dataTransfer.setData('text/plain', studentId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = async (e: React.DragEvent, jobId: string) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('text/plain');
    if (studentId) {
      await handleMapCandidate(studentId, jobId);
    }
  };

  const filteredStudents = students.filter(s => {
    const query = searchQuery.toLowerCase();
    const name = (s.full_name || '').toLowerCase();
    const regNo = (s.sif_no || s.registration_no || '').toLowerCase();
    const branch = (s.branch || '').toLowerCase();
    const skillList = (s.skills || []).map((sk: any) => (typeof sk === 'string' ? sk : sk.name).toLowerCase()).join(' ');
    
    return name.includes(query) || regNo.includes(query) || branch.includes(query) || skillList.includes(query);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={userEmail} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#111111]">Smart Candidate Mapping</h1>
            <p className="text-gray-500 font-medium font-outfit">Drag-and-drop or select candidates to assign them to active roles</p>
          </div>
          <button
            onClick={() => navigate('/mapped-candidates')}
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-[#111111] font-bold shadow-sm hover:bg-gray-50 transition-all text-sm flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-[var(--gold-medium)]" />
            Pipeline Placements
          </button>
        </header>

        {/* Side-by-Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Active Jobs (Drop Targets) - span 4 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                <h3 className="font-extrabold text-[#111111] text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[var(--gold-medium)]" />
                  Active Job Roles
                </h3>
                <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-mono">
                  {activeJobs.length} open
                </span>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 mb-8 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <LayoutDashboard className="w-6 h-6 text-[#111111]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#111111] mb-1">Mapping Workspace</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-outfit">
                    Drag student cards into a job to map them, or select a job below to view side-by-side comparisons.
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {activeJobs.map(job => {
                  const isSelected = selectedJob?.id === job.id;
                  const mappedCount = mappings.filter(m => m.position_id === job.id).length;

                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, job.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                        isSelected 
                          ? 'border-[var(--gold-medium)] bg-[var(--gold-gradient)]/5 shadow-md shadow-[var(--gold-medium)]/5' 
                          : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] font-black uppercase text-[var(--gold-medium)] tracking-wider">
                            {job.companies?.company_name}
                          </span>
                          {mappedCount > 0 && (
                            <span className="text-[9px] font-black bg-gray-50 text-[#111111] px-2 py-0.5 rounded border border-blue-100 uppercase font-mono">
                              {mappedCount} Mapped
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[#111111] mt-1 truncate group-hover:text-[var(--gold-medium)] transition-colors">
                          {job.role}
                        </h4>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold mt-3 pt-2 border-t border-gray-100/50">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" /> {job.location || 'Remote'}
                        </span>
                        <span className="flex items-center gap-1 text-[#111111]">
                          <IndianRupee className="w-3 h-3 shrink-0 text-[var(--gold-medium)]" /> {job.salary || 'Salary N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {activeJobs.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    No active job listings.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Talent Directory & Search (Drag Sources) - span 8 */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search Bar */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search student by name, skill, branch, or Roll No..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none text-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 font-mono">
                {filteredStudents.length} Students Listed
              </span>
            </div>

            {/* Students List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="col-span-full py-20 text-center text-gray-400">Syncing student database...</div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const matchScore = calculateMatch(student, selectedJob);
                  const isAssignedToSelectedJob = mappings.some(m => m.student_id === student.user_id && m.position_id === selectedJob?.id);

                  return (
                    <div
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, student.user_id)}
                      key={student.user_id}
                      className={`bg-white p-5 rounded-3xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-lg flex flex-col justify-between ${
                        isAssignedToSelectedJob 
                          ? 'border-gray-200 bg-gray-50/20' 
                          : selectedStudent?.user_id === student.user_id
                            ? 'border-[var(--gold-medium)] shadow-md shadow-[var(--gold-medium)]/5'
                            : 'border-gray-100 hover:border-gray-200'
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#111111]/10 rounded-2xl flex items-center justify-center font-bold text-lg text-[#111111] shadow-inner">
                              {student.full_name?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-base text-[#111111] hover:text-[var(--gold-medium)] transition-all">
                                {student.full_name}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{student.sif_no || student.registration_no}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-right">
                            {selectedJob && (
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                                matchScore >= 80 
                                  ? 'bg-gray-50 text-[#111111] border-gray-200' 
                                  : matchScore >= 50
                                    ? 'bg-[#f4f1e6] text-[var(--gold-medium)] border-[var(--gold-medium)]/40'
                                    : matchScore > 0
                                      ? 'bg-gray-50 text-[#111111] border-gray-200'
                                      : 'bg-gray-50 text-gray-400 border-gray-200'
                              }`}>
                                {matchScore > 0 ? `${matchScore}% Match` : 'New'}
                              </span>
                            )}
                            
                            {userRole === 'admin' && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleAdminDeleteStudent(student);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete Student permanent credentials"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Social Links & Resume display on card */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {student.github_url && (
                            <a href={student.github_url} target="_blank" rel="noreferrer" className="p-1 hover:bg-gray-100 rounded text-gray-700 transition-all" onClick={e => e.stopPropagation()}>
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {student.linkedin_url && (
                            <a href={student.linkedin_url} target="_blank" rel="noreferrer" className="p-1 hover:bg-gray-50 rounded text-[#0077b5] transition-all" onClick={e => e.stopPropagation()}>
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {student.resume_url && (
                            <a 
                              href={student.resume_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-2 py-0.5 bg-gray-50 text-[#111111] hover:bg-gray-100 rounded-lg text-[9px] font-black uppercase flex items-center gap-0.5 border border-green-150 transition-all shadow-sm" 
                              title="Resume Link (DOCX / PDF)"
                              onClick={e => e.stopPropagation()}
                            >
                              <FileText className="w-3 h-3 text-[#111111]" /> Resume (DOCX/PDF)
                            </a>
                          )}
                        </div>

                        {/* Skills badges */}
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {student.skills?.slice(0, 4).map((skill: any) => (
                            <span key={typeof skill === 'string' ? skill : skill.name} className="px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 text-[9px] font-bold rounded uppercase">
                              {typeof skill === 'string' ? skill : skill.name}
                            </span>
                          ))}
                          {(!student.skills || student.skills.length === 0) && (
                            <span className="text-[10px] text-gray-400 italic">No skills listed</span>
                          )}
                        </div>
                      </div>

                      {/* Info & Mapping Controls */}
                      <div className="flex justify-between items-center text-xs text-gray-400 font-bold mt-4 pt-3 border-t border-gray-100/80">
                        <div className="flex items-center gap-1.5 font-medium text-gray-500">
                          <span>GPA: <strong className="text-[#111111] font-mono font-bold">{student.cgpa || '0.0'}</strong></span>
                          <span>•</span>
                          <span className="truncate max-w-[110px] font-semibold text-gray-600">{student.branch || 'General'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAssignedToSelectedJob ? (
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnmapCandidate(student.user_id, selectedJob.id);
                              }}
                              className="px-3.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
                              title="Remove candidate assignment"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                              <span>Remove</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (selectedJob) handleMapCandidate(student.user_id, selectedJob.id);
                                else toast.info('Please select a job first.');
                              }}
                              disabled={!selectedJob}
                              className="px-3.5 py-1.5 bg-[var(--gold-gradient)] text-[#111111] hover:opacity-95 border border-[var(--gold-medium)]/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
                              title="Map candidate to selected job"
                            >
                              <PlusCircle className="w-3.5 h-3.5 shrink-0 text-[#111111]" />
                              <span>Map</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center text-gray-400 font-medium">
                  No matching candidates listed in this department.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDE-BY-SIDE DRAP/MODAL DRAWER: COMPARISON SCREEN */}
        {selectedJob && selectedStudent && createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStudent(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
              />
              
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative w-full max-w-6xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col z-[10000] my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-4 sm:p-5 bg-[#111111] text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--gold-medium)]" />
                    <span className="font-extrabold text-sm uppercase tracking-widest">Side-By-Side Smart Match Profile</span>
                  </div>
                  
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-[var(--gold-medium)] tracking-wider hidden sm:inline">Smart match compatibility score</span>
                      <span className="bg-gray-800 text-white font-black text-xs px-3 py-1 rounded-full font-mono border border-gray-700">
                        {calculateMatch(selectedStudent, selectedJob)}% Match
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content - Side-by-Side columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-y-auto p-6 gap-6 flex-1 custom-scrollbar">
                  
                  {/* Left Side: Job opening info */}
                  <div className="space-y-4 pr-0 md:pr-4">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <Briefcase className="w-4.5 h-4.5 text-[var(--gold-medium)]" />
                      Job Opportunity Details
                    </div>

                    <div>
                      <span className="text-xs font-black text-[var(--gold-medium)] uppercase">
                        {selectedJob.companies?.company_name}
                      </span>
                      <h4 className="text-2xl font-black text-[#111111]">{selectedJob.role}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-500 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{selectedJob.location || 'Remote'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#111111]">
                        <IndianRupee className="w-4 h-4 text-[var(--gold-medium)] shrink-0" />
                        <span>{selectedJob.salary || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requirements & Description</div>
                      <p className="text-xs text-gray-600 italic leading-relaxed border-l-4 border-gray-100 pl-3">
                        &quot;{selectedJob.description || 'No detailed instructions listed.'}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Student Profile Details */}
                  <div className="space-y-4 pl-0 md:pl-4 pt-4 md:pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <User className="w-4.5 h-4.5 text-[#111111]" />
                        Candidate Talent Profile
                      </div>
                      
                      {/* GitHub & LinkedIn & Resume Links */}
                      <div className="flex items-center gap-2">
                        {selectedStudent.github_url && (
                          <a 
                            href={selectedStudent.github_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                            title="GitHub Profile"
                          >
                            <Github className="w-4 h-4 text-black" />
                          </a>
                        )}
                        {selectedStudent.linkedin_url && (
                          <a 
                            href={selectedStudent.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 text-blue-700 rounded-lg transition-all"
                            title="LinkedIn Profile"
                          >
                            <Linkedin className="w-4 h-4 text-[#0077b5]" />
                          </a>
                        )}
                        {selectedStudent.resume_url && (
                          <a 
                            href={selectedStudent.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 text-[#111111] rounded-lg transition-all border border-gray-200 flex items-center gap-1 text-xs font-bold shadow-sm"
                            title="Resume Document (DOCX / PDF)"
                          >
                            <FileText className="w-4 h-4 text-[#111111]" /> Resume
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 text-[#111111] font-black rounded-xl flex items-center justify-center text-lg uppercase shadow-sm">
                        {selectedStudent.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xl font-extrabold text-[#111111]">{selectedStudent.full_name}</h4>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          ROLL NO: {selectedStudent.sif_no || selectedStudent.registration_no} • {selectedStudent.branch || 'General'}
                        </div>
                      </div>
                    </div>

                    {/* CGPA, Hometown and Preferred Location */}
                    <div className="grid grid-cols-3 gap-3 text-xs font-bold bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                      <div>
                        <span className="text-gray-400 text-[8px] uppercase tracking-wider block">CGPA</span>
                        <span className="text-sm text-[#111111] font-black block mt-0.5 font-mono">{selectedStudent.cgpa || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[8px] uppercase tracking-wider block">Hometown</span>
                        <span className="text-xs text-[#111111] font-bold block mt-0.5 truncate" title={selectedStudent.home_location || 'Not Specified'}>
                          {selectedStudent.home_location || 'Not Specified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[8px] uppercase tracking-wider block">Preferred</span>
                        <span className="text-xs text-[#111111] font-bold block mt-0.5 truncate" title={Array.isArray(selectedStudent.preferred_locations) ? selectedStudent.preferred_locations.join(', ') : 'Open/Remote'}>
                          {Array.isArray(selectedStudent.preferred_locations) && selectedStudent.preferred_locations.length > 0 
                            ? selectedStudent.preferred_locations.join(', ') 
                            : 'Open/Remote'}
                        </span>
                      </div>
                    </div>

                    {/* Skills section */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Skills</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStudent.skills?.map((skill: any) => {
                          const name = typeof skill === 'string' ? skill : skill.name;
                          const level = typeof skill === 'object' ? skill.level : '';
                          return (
                            <span key={name} className="px-2.5 py-0.5 bg-gray-50 text-[#111111] border border-gray-200 text-[9px] font-bold rounded-full uppercase flex items-center gap-1 shadow-xs font-outfit">
                              {name} {level && <span className="opacity-50 text-[7px]">({level})</span>}
                            </span>
                          );
                        })}
                        {(!selectedStudent.skills || selectedStudent.skills.length === 0) && (
                          <span className="text-[10px] text-gray-400 italic">No skills listed.</span>
                        )}
                      </div>
                    </div>

                    {/* Recent project section */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Project Experience</div>
                      {selectedStudent.projects && selectedStudent.projects.length > 0 ? (
                        (() => {
                          const recentProj = selectedStudent.projects[selectedStudent.projects.length - 1];
                          return (
                            <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100/50 space-y-1.5 shadow-xs">
                              <h5 className="font-extrabold text-xs text-[#111111]">{recentProj.name}</h5>
                              <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">{recentProj.description}</p>
                              {recentProj.tech && recentProj.tech.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {recentProj.tech.map((t: string) => (
                                    <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-[#111111] text-[8px] font-black uppercase rounded">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <p className="text-xs text-gray-400 italic">No project listings added yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer mapping controls */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      navigate(`/faculty/student/${selectedStudent.sif_no || selectedStudent.registration_no}`);
                    }}
                    className="text-[#111111] font-extrabold text-xs hover:underline flex items-center gap-1.5"
                  >
                    View Complete Portfolio <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                    {userRole === 'admin' && (
                      <button
                        onClick={async () => {
                          await handleAdminDeleteStudent(selectedStudent);
                          setSelectedStudent(null);
                        }}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-xl font-bold text-xs shadow-sm transition-all uppercase flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Student
                      </button>
                    )}
                    
                    {mappings.some(m => m.student_id === selectedStudent.user_id && m.position_id === selectedJob.id) ? (
                      <button
                        onClick={() => handleUnmapCandidate(selectedStudent.user_id, selectedJob.id)}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-red-700 transition-all uppercase"
                      >
                        Unmap Candidate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMapCandidate(selectedStudent.user_id, selectedJob.id)}
                        className="px-5 py-2.5 text-white rounded-xl font-bold text-xs shadow-md hover:opacity-90 transition-all uppercase flex items-center gap-1.5 cursor-pointer"
                        style={{ backgroundColor: 'var(--gold-medium)' }}
                      >
                        <UserCheck className="w-4 h-4" /> Map Candidate to Job
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}

      </main>
      <Toaster position="top-right" />
    </div>
  );
}





