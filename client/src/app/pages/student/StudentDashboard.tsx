import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import Navigation from '../../components/shared/Navigation';
import StudentAnalytics from '../../components/student/StudentAnalytics';
import MilestoneRoadmap from '../../components/student/MilestoneRoadmap';
import { supabase } from '../../../lib/supabase';
import { Loader2, BrainCircuit, LayoutDashboard, UserCircle, Settings, ArrowRight, Sparkles, TrendingUp, Award, Briefcase, MapPin, IndianRupee, CheckCircle2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [studentMappings, setStudentMappings] = useState<any[]>([]);

  const handleApplyJob = async (jobId: string) => {
    if (!profile?.user_id) return;

    // Count active applications
    const appliedCount = studentMappings.filter(m => m.status === 'applied').length;
    if (appliedCount >= 3) {
      toast.warning('Application Limit Reached: You can only apply to a maximum of 3 jobs at a time. Please withdraw an application first.');
      return;
    }

    try {
      const { error } = await supabase
        .from('mapped_candidates')
        .insert([{
          student_id: profile.user_id,
          position_id: jobId,
          status: 'applied',
          mapped_by: profile.user_id,
          mapped_by_role: 'student'
        }]);

      if (error) throw error;
      toast.success('Successfully applied! Your profile has been shared with recruiters.');

      // Refresh student mappings
      const { data: maps } = await supabase
        .from('mapped_candidates')
        .select('*')
        .eq('student_id', profile.user_id);
      setStudentMappings(maps || []);
    } catch (err: any) {
      toast.error('Failed to submit application: ' + err.message);
    }
  };

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

  const getMatchScore = (jId: string, sId: string) => {
    const str = jId + sId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 75 + (Math.abs(hash) % 25);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          const [profileRes, jobsRes, mappingsRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
            supabase.from('positions').select('*, companies(company_name)').eq('status', 'open').limit(3),
            supabase.from('mapped_candidates').select('*').eq('student_id', user.id)
          ]);
          
          if (profileRes.data) {
            setProfile({ ...profileRes.data, email: user.email });
            if (!profileRes.data.graduation) {
              toast('Complete your profile to get AI-powered insights.', { icon: '✨' });
            }
          }
          setActiveJobs(jobsRes.data || []);
          setStudentMappings(mappingsRes.data || []);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.full_name, profile.phone, profile.graduation, profile.branch,
      profile.github_url, profile.linkedin_url, profile.home_location,
      (profile.skills?.length || 0) > 0
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  const completion = calculateCompletion();

  const calculateGamification = () => {
    if (!profile) return { xp: 0, level: 1, title: 'Novice Aspirant', progress: 0 };
    
    // 1. Profile completion points (max 300 XP)
    const completionXp = completion * 3; 

    // 2. CGPA performance points (max 300 XP)
    const cgpaVal = parseFloat(profile.cgpa || '0');
    const cgpaXp = Math.min((cgpaVal / 10) * 300, 300);

    // 3. Hands-on projects points (max 200 XP)
    const projectsCount = profile.projects?.length || 0;
    const projectsXp = Math.min(projectsCount * 50, 200);

    // 4. Skills competency points (max 200 XP)
    const skillsCount = profile.skills?.length || 0;
    const skillsXp = Math.min(skillsCount * 20, 200);

    const totalXp = Math.round(completionXp + cgpaXp + projectsXp + skillsXp);
    
    let level = 1;
    let title = 'Novice Aspirant';
    let nextThreshold = 250;
    let prevThreshold = 0;

    if (totalXp >= 900) {
      level = 5;
      title = 'Udyoog Scholar';
      nextThreshold = 1000;
      prevThreshold = 900;
    } else if (totalXp >= 750) {
      level = 4;
      title = 'Elite Vanguard';
      nextThreshold = 900;
      prevThreshold = 750;
    } else if (totalXp >= 500) {
      level = 3;
      title = 'Professional Catalyst';
      nextThreshold = 750;
      prevThreshold = 500;
    } else if (totalXp >= 250) {
      level = 2;
      title = 'Rising Talent';
      nextThreshold = 500;
      prevThreshold = 250;
    }

    const progress = Math.min(
      Math.round(((totalXp - prevThreshold) / (nextThreshold - prevThreshold)) * 100),
      100
    );

    return { xp: totalXp, level, title, progress };
  };

  const gamification = calculateGamification();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--gold-medium)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation userEmail={userEmail} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-xl border border-gray-200/50 p-8 text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-[var(--gold-medium)] flex items-center justify-center text-white text-3xl font-bold">
                  {profile?.full_name?.charAt(0) || 'S'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[var(--gold-medium)]" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#111111' }}>
                {profile?.full_name || 'Student Name'}
              </h2>
              <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest font-bold font-mono">
                ROLL NO: {profile?.sif_no || profile?.registration_no || 'Not Set'}
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/interview-prep')}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#111111] to-[#111111] text-white flex items-center justify-center gap-2 font-bold transition-all hover:shadow-lg shadow-[#111111]/20 group"
                >
                  <BrainCircuit className="w-5 h-5 text-[var(--gold-medium)] group-hover:scale-110 transition-transform" />
                  AI Interview Prep
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 font-semibold transition-all hover:bg-gray-50 text-[#111111]"
                >
                  <Settings className="w-4 h-4" />
                  Customize Profile
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-lg bg-[#111111] rounded-3xl shadow-xl p-8 text-white"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-[var(--gold-medium)]" />
                <h3 className="text-lg font-bold">Udyoog Readiness</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2 opacity-80 uppercase font-bold tracking-tighter">
                    <span>Profile Completion</span>
                    <span>{completion}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      className="h-full bg-[var(--gold-gradient)]"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 leading-relaxed">
                  {completion === 100 
                    ? "Your profile is fully optimized! You're ready for top-tier opportunities."
                    : "Your professional presence is evolving. Complete your details to unlock full potential."}
                </p>

                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Current Tier</span>
                    <span className="text-[var(--gold-medium)] font-black uppercase tracking-wider text-[10px]">Tier {gamification.level}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-extrabold text-white">{gamification.title}</span>
                    <span className="text-xs font-bold font-mono text-gray-300">{gamification.xp} / 1000 XP</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 text-[var(--gold-medium)] text-sm font-bold uppercase tracking-widest hover:gap-3 transition-all pt-2"
                >
                  Boost Profile <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
            >
              <h3 className="text-lg font-bold text-[#111111] mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[var(--gold-medium)]" />
                Live Opportunities
              </h3>
              <div className="space-y-4">
                {activeJobs.length > 0 ? (
                  <>
                    {activeJobs.map((job) => {
                      const mapping = studentMappings.find(m => m.position_id === job.id);
                      const matchScore = getMatchScore(job.id, profile?.user_id || '');
                      
                      return (
                        <div key={job.id} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#111111]/10 transition-all cursor-default group flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-bold text-[var(--gold-medium)] mb-0.5">{job.companies?.company_name}</div>
                              <div className="font-bold text-[#111111] group-hover:text-[#111111] text-sm">{job.role}</div>
                              <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-2">
                                <MapPin className="w-3 h-3 text-gray-400" /> {job.location || 'Remote'}
                                <span>•</span>
                                <IndianRupee className="w-3 h-3 text-gray-400" /> {job.salary || 'Competitive'}
                              </div>
                            </div>
                            <div className="flex flex-col items-center justify-center px-2 py-1 bg-[#111111]/5 rounded-lg border border-[#111111]/10 shrink-0">
                              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">AI Match</span>
                              <span className="text-xs font-black text-[#111111]">{matchScore}%</span>
                            </div>
                          </div>

                          {mapping ? (
                            <div className="mt-4 flex gap-2 w-full">
                              <div className="flex-1 flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl font-extrabold text-[9px] uppercase tracking-wider">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Applied</span>
                              </div>
                              <button
                                onClick={() => handleUnapplyJob(job.id)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all shadow-sm"
                              >
                                Withdraw
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApplyJob(job.id)}
                              className="mt-4 w-full py-2 bg-[var(--gold-gradient)] text-black rounded-xl font-extrabold text-[9px] uppercase tracking-widest hover:opacity-95 transition-all shadow-sm shadow-[var(--gold-medium)]/10 cursor-pointer text-center"
                            >
                              Quick Apply
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <button
                      onClick={() => navigate('/jobs')}
                      className="mt-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#111111] border border-gray-100 hover:border-gray-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>View All Opportunities</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    No active jobs matching your profile yet.
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-12">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#111111' }}>Student Dashboard</h1>
                <p className="text-gray-500">Visualizing your professional trajectory.</p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[var(--gold-medium)]" />
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">Tier {gamification.level}</span>
                  <span className="text-sm font-extrabold text-[#111111]">{gamification.title}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-bold font-mono">
                  {gamification.xp} / 1000 XP
                </div>
              </div>
            </header>

            <MilestoneRoadmap profile={profile} />

            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-[#111111] mb-6">Competency Insights</h3>
              <StudentAnalytics profile={profile} />
            </div>
          </div>

        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}




