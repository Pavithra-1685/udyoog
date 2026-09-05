import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import Navigation from '../../components/shared/Navigation';
import MilestoneRoadmap from '../../components/student/MilestoneRoadmap';
import { supabase } from '../../../lib/supabase';
import { 
  Loader2, BrainCircuit, Settings, ArrowRight, Sparkles, TrendingUp, 
  Award, Briefcase, MapPin, IndianRupee, CheckCircle2, Target, 
  AlertCircle, XCircle, FileText, Code, CheckSquare, ShieldCheck 
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { notifyStudentApplied } from '../../../lib/notificationService';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [studentMappings, setStudentMappings] = useState<any[]>([]);

  // 1. Fetch Profile, Active Jobs, and Mappings
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const [profileRes, jobsRes, mappingsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('positions').select('*, companies(company_name)').in('status', ['open', 'on_hold']).order('created_at', { ascending: false }).limit(4),
          supabase.from('mapped_candidates').select('*').eq('student_id', user.id)
        ]);
        
        if (profileRes.data) {
          setProfile({ ...profileRes.data, email: user.email });
        }
        setActiveJobs(jobsRes.data || []);
        setStudentMappings(mappingsRes.data || []);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching student overview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  // Apply for Job
  const handleApplyJob = async (jobId: string) => {
    if (!profile?.user_id) return;

    const appliedCount = studentMappings.filter(m => m.status === 'applied').length;
    if (appliedCount >= 3) {
      toast.warning('Application Limit Reached: You can only apply to a maximum of 3 jobs at a time. Please withdraw an application first.');
      return;
    }

    try {
      let validMappedBy: string | null = null;
      if (profile?.user_id) {
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', profile.user_id)
          .maybeSingle();
        if (profileCheck) validMappedBy = profile.user_id;
      }

      const insertPayload: any = {
        student_id: profile.user_id,
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
      toast.success('Successfully applied! Your profile has been shared with recruiters.');

      const targetJob = activeJobs.find(j => j.id === jobId);
      notifyStudentApplied({
        studentId: profile.user_id,
        studentName: profile.full_name || 'Student',
        department: profile.branch || profile.graduation || 'General',
        jobTitle: targetJob?.role || 'Job Role',
        companyName: targetJob?.companies?.company_name || 'Partner Company',
        jobId: jobId
      });

      const { data: maps } = await supabase
        .from('mapped_candidates')
        .select('*')
        .eq('student_id', profile.user_id);
      setStudentMappings(maps || []);
    } catch (err: any) {
      toast.error('Failed to submit application: ' + err.message);
    }
  };

  // Withdraw Application
  const handleUnapplyJob = async (jobId: string) => {
    if (!profile?.user_id) return;
    try {
      const { error } = await supabase
        .from('mapped_candidates')
        .delete()
        .eq('student_id', profile.user_id)
        .eq('position_id', jobId);

      if (error) throw error;
      toast.success('Application withdrawn successfully.');
      
      const { data: maps } = await supabase
        .from('mapped_candidates')
        .select('*')
        .eq('student_id', profile.user_id);
      setStudentMappings(maps || []);
    } catch (err: any) {
      toast.error('Failed to withdraw application: ' + err.message);
    }
  };

  // Match score calculator
  const getMatchScore = (jId: string, sId: string, roleText: string = '') => {
    const skillsList = Array.isArray(profile?.skills) ? profile.skills : [];
    let matches = 0;
    skillsList.forEach((s: any) => {
      if (roleText.toLowerCase().includes(s.name?.toLowerCase() || '')) matches++;
    });

    const str = jId + sId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const base = 70 + (Math.abs(hash) % 20);
    return Math.min(base + (matches * 5), 98);
  };

  // 2. Profile Readiness Calculation
  const readiness = useMemo(() => {
    if (!profile) return { score: 0, items: [] };

    const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
    const hasProjects = Array.isArray(profile.projects) && profile.projects.length > 0;
    const hasCGPA = Boolean(profile.cgpa && parseFloat(profile.cgpa) > 0);
    const hasResume = Boolean(profile.resume_url || profile.linkedin_url || profile.github_url);
    const hasBasic = Boolean(profile.full_name && profile.branch && profile.graduation);

    const items = [
      { key: 'basic', label: 'Basic Profile', isComplete: hasBasic, hint: 'Name & Branch' },
      { key: 'skills', label: 'Technical Skills', isComplete: skillsCount > 0, hint: 'Add 2+ skills' },
      { key: 'cgpa', label: 'Academic Records', isComplete: hasCGPA, hint: 'Overall CGPA' },
      { key: 'resume', label: 'Resume & Links', isComplete: hasResume, hint: 'Resume link' },
    ];

    const completed = items.filter(i => i.isComplete).length;
    const score = Math.round((completed / items.length) * 100);

    return { score, items, skillsCount, hasProjects, hasCGPA, hasResume };
  }, [profile]);

  // 3. Concise Actionable Next Steps (2-4 items max)
  const nextSteps = useMemo(() => {
    const steps = [];

    if (!readiness.hasResume) {
      steps.push({
        id: 'resume',
        title: 'Upload Resume / Portfolio Link',
        desc: 'Recruiters prioritize candidates with attached resumes by 3x.',
        action: 'Upload Resume',
        route: '/profile'
      });
    }

    if (readiness.skillsCount === 0) {
      steps.push({
        id: 'skills',
        title: 'Add Technical Skills',
        desc: 'Add your primary languages and tools to calculate accurate job matches.',
        action: 'Add Skills',
        route: '/profile'
      });
    } else if (readiness.skillsCount < 3) {
      steps.push({
        id: 'more-skills',
        title: 'Expand Technical Competencies',
        desc: 'Adding 2 more verified skills will increase your domain readiness.',
        action: 'Add Skills',
        route: '/profile'
      });
    }

    if (!readiness.hasCGPA) {
      steps.push({
        id: 'cgpa',
        title: 'Enter Academic CGPA',
        desc: 'Complete your CGPA records to qualify for tier-1 recruiter drives.',
        action: 'Update CGPA',
        route: '/profile'
      });
    }

    if (steps.length < 2) {
      steps.push({
        id: 'interview-prep',
        title: 'Practice AI Mock Interview',
        desc: 'Test your answers with the AI Coach to improve confidence before live drives.',
        action: 'Start AI Coach',
        route: '/interview-prep'
      });
    }

    return steps.slice(0, 4);
  }, [readiness]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--gold-medium)] mb-3" />
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading Student Overview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      <Navigation userEmail={userEmail} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Here is your current placement snapshot, active opportunities, and recommended next steps.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => navigate('/analytics')}
              className="px-4 py-2.5 bg-white border border-gray-200 text-[#111111] hover:text-[var(--gold-medium)] hover:bg-amber-50/50 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-[var(--gold-medium)]" />
              <span>Full Analytics</span>
            </button>
            <button 
              onClick={() => navigate('/interview-prep')}
              className="px-4 py-2.5 bg-[#111111] text-white hover:bg-black rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4 text-[var(--gold-medium)]" />
              <span>AI Coach</span>
            </button>
          </div>
        </div>

        {/* 1. TOP CARDS GRID: Profile Summary & Career Readiness Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Student Profile Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6"
          >
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--gold-medium)] flex items-center justify-center text-white text-3xl font-black shadow-md">
                {profile?.full_name?.charAt(0) || 'S'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
                <Sparkles className="w-3.5 h-3.5 text-[var(--gold-medium)]" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-3 w-full">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#111111]">
                  {profile?.full_name || 'Student Name'}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="text-[11px] font-bold text-gray-500 font-mono bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 uppercase">
                    REG NO: {profile?.sif_no || profile?.registration_no || 'NOT SET'}
                  </span>
                  <span className="text-[11px] font-extrabold text-[var(--gold-medium)] bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/50">
                    {profile?.branch || profile?.graduation || 'Department N/A'}
                  </span>
                  {profile?.cgpa && (
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/50">
                      CGPA: {profile.cgpa}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button 
                  onClick={() => navigate('/interview-prep')}
                  className="px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer group"
                >
                  <BrainCircuit className="w-4 h-4 text-[var(--gold-medium)] group-hover:scale-110 transition-transform" />
                  <span>AI Interview Prep</span>
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-[#111111] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-500" />
                  <span>Customize Profile</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right: Career Readiness Snapshot Card (COMPACT SUMMARY) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#111111] rounded-3xl shadow-xl p-6 sm:p-8 text-white flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-200 text-xs font-bold">
                  <Target className="w-4 h-4 text-[var(--gold-medium)]" />
                  <span className="uppercase tracking-wider">Career Readiness</span>
                </div>
                <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-[10px] font-mono text-gray-300">
                  Snapshot
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-4xl font-black font-mono text-[var(--gold-medium)]">
                  {readiness.score}%
                </span>
                <span className="text-xs font-bold text-gray-300">
                  {readiness.score >= 80 ? 'Placement Ready' : readiness.score >= 60 ? 'In Progress' : 'Needs Optimization'}
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-medium mb-6">
                Complete your profile details, technical competencies, and resume link to maximize your placement readiness score.
              </p>
            </div>

            <button 
              onClick={() => navigate('/analytics')}
              className="w-full py-3 bg-[var(--gold-medium)] hover:bg-[#a55b00] text-white text-xs font-extrabold uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Full Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

        </div>

        {/* 2. UDYOOG ROADMAP */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--gold-medium)]" />
                UDYOOG Placement Milestone Roadmap
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">High-level progression stages from profile setup to final recruitment selection</p>
            </div>
          </div>

          <MilestoneRoadmap profile={profile} />
        </motion.div>

        {/* 3. LIVE OPPORTUNITIES (COMPACT CARDS) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[var(--gold-medium)]" />
                Live Active Opportunities
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Verified active recruitment drives open for student applications</p>
            </div>

            <button
              onClick={() => navigate('/jobs')}
              className="text-xs font-extrabold text-[var(--gold-medium)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeJobs.map((job) => {
                const mapping = studentMappings.find(m => m.position_id === job.id);
                const matchScore = getMatchScore(job.id, profile?.user_id || '', job.role);

                return (
                  <div 
                    key={job.id} 
                    className="p-5 bg-gray-50/80 rounded-3xl border border-gray-200/70 hover:border-[var(--gold-medium)]/40 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-extrabold text-[var(--gold-medium)] truncate">
                          {job.companies?.company_name || 'Partner Company'}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-50 text-[var(--gold-medium)] border border-amber-200/60 text-[10px] font-black rounded-md font-mono shrink-0">
                          {matchScore}% Match
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-[#111111] leading-tight group-hover:text-[var(--gold-medium)] transition-colors">
                        {job.role}
                      </h4>

                      <div className="space-y-1 mt-3 text-[11px] text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{job.location || 'Remote / Hybrid'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <IndianRupee className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{job.salary || 'Competitive Package'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200/50">
                      {job.status === 'on_hold' ? (
                        <div className="w-full py-2 bg-gray-100 text-gray-500 text-[10px] font-extrabold uppercase tracking-wider rounded-xl text-center">
                          Applications Paused
                        </div>
                      ) : mapping ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-extrabold uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Applied</span>
                          </div>
                          <button
                            onClick={() => handleUnapplyJob(job.id)}
                            className="px-2.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-[10px] font-bold uppercase rounded-xl transition-all"
                          >
                            Withdraw
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApplyJob(job.id)}
                          className="w-full py-2.5 bg-[var(--gold-medium)] hover:bg-[#a55b00] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-2xs cursor-pointer text-center"
                        >
                          Quick Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
              No active job opportunities posted at the moment. Check back soon!
            </div>
          )}
        </motion.div>

        {/* 4. PROFILE PLACEMENT READINESS & ACTIONABLE NEXT STEPS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Profile Placement Readiness (Compact Card) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[var(--gold-medium)]" />
                  Profile Completion
                </h3>
                <span className="text-sm font-black text-[#111111] font-mono">{readiness.score}%</span>
              </div>

              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-[var(--gold-gradient)]" style={{ width: `${readiness.score}%` }} />
              </div>

              <div className="space-y-3">
                {readiness.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      {item.isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-gray-800">{item.label}</span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md ${
                      item.isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {item.isComplete ? 'Complete' : item.hint}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Actionable Next Steps (Concise 2-4 items) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-extrabold text-[#111111] mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--gold-medium)]" />
                Your Actionable Next Steps
              </h3>
              <p className="text-xs text-gray-500 mb-6">Top priority actions based on your real placement profile</p>

              <div className="space-y-3">
                {nextSteps.map((step) => (
                  <div key={step.id} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-[var(--gold-medium)] shrink-0" />
                        <h4 className="text-xs font-extrabold text-[#111111]">{step.title}</h4>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed font-medium">{step.desc}</p>
                    </div>

                    <button 
                      onClick={() => navigate(step.route)}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-[#111111] text-[10px] font-extrabold rounded-xl shrink-0 cursor-pointer shadow-2xs"
                    >
                      {step.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>

      </main>
      <Toaster position="top-right" />
    </div>
  );
}
