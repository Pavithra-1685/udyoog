import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import Navigation from '../../components/shared/Navigation';
import StudentAnalytics from '../../components/student/StudentAnalytics';
import MilestoneRoadmap from '../../components/student/MilestoneRoadmap';
import { supabase } from '../../../lib/supabase';
import { Loader2, BrainCircuit, LayoutDashboard, UserCircle, Settings, ArrowRight, Sparkles, TrendingUp, Award, Briefcase, MapPin, IndianRupee } from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          const [profileRes, jobsRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
            supabase.from('positions').select('*, companies(company_name)').eq('status', 'open').limit(3)
          ]);
          
          if (profileRes.data) {
            setProfile({ ...profileRes.data, email: user.email });
            if (!profileRes.data.graduation) {
              navigate('/profile');
            }
          }
          setActiveJobs(jobsRes.data || []);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#e0653b]" />
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
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#142361] to-[#e0653b] flex items-center justify-center text-white text-3xl font-bold">
                  {profile?.full_name?.charAt(0) || 'S'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#e0653b]" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#142361' }}>
                {profile?.full_name || 'Student Name'}
              </h2>
              <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest font-bold">
                {profile?.registration_no || 'Reg No Not Set'}
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/interview-prep')}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#142361] to-[#1d3080] text-white flex items-center justify-center gap-2 font-bold transition-all hover:shadow-lg shadow-[#142361]/20 group"
                >
                  <BrainCircuit className="w-5 h-5 text-[#e0653b] group-hover:scale-110 transition-transform" />
                  AI Interview Prep
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 font-semibold transition-all hover:bg-gray-50 text-[#142361]"
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
              className="backdrop-blur-lg bg-[#142361] rounded-3xl shadow-xl p-8 text-white"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-[#e0653b]" />
                <h3 className="text-lg font-bold">Career Readiness</h3>
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
                      className="h-full bg-[#e0653b]"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 leading-relaxed">
                  {completion === 100 
                    ? "Your profile is fully optimized! You're ready for top-tier opportunities."
                    : "Your professional presence is evolving. Complete your details to unlock full potential."}
                </p>
                
                <button 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 text-[#e0653b] text-sm font-bold uppercase tracking-widest hover:gap-3 transition-all"
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
              <h3 className="text-lg font-bold text-[#142361] mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#e0653b]" />
                Live Opportunities
              </h3>
              <div className="space-y-4">
                {activeJobs.length > 0 ? activeJobs.map((job) => (
                  <div key={job.id} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#142361]/10 transition-all cursor-default group">
                    <div className="text-xs font-bold text-[#e0653b] mb-1">{job.companies?.company_name}</div>
                    <div className="font-bold text-[#142361] group-hover:text-[#1d3080]">{job.role}</div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-2">
                      <MapPin className="w-3 h-3" /> {job.location || 'Remote'}
                      <span>•</span>
                      <IndianRupee className="w-3 h-3" /> {job.salary || 'Competitive'}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    No active jobs matching your profile yet.
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-12">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#142361' }}>Student Dashboard</h1>
                <p className="text-gray-500">Visualizing your professional trajectory.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                <Award className="w-5 h-5 text-[#e0653b]" />
                <span className="text-sm font-bold" style={{ color: '#142361' }}>Level {
                  [
                    completion === 100,
                    (profile?.projects?.length || 0) >= 3,
                    (parseFloat(profile?.cgpa || '0') >= 7.5)
                  ].filter(Boolean).length
                } Aspirant</span>
              </div>
            </header>

            <MilestoneRoadmap profile={profile} />

            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-[#142361] mb-6">Competency Insights</h3>
              <StudentAnalytics profile={profile} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
