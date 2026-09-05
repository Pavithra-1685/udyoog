import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import Navigation from '../../components/shared/Navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Briefcase, CheckCircle2, Clock, Layers, UserCheck, Award, 
  MapPin, IndianRupee, ArrowRight, Loader2, RefreshCw, XCircle, 
  Calendar, ChevronRight, Sparkles, Building, AlertCircle, FileText, CheckSquare
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface StudentProgressProps {
  profile?: any;
}

export default function StudentProgress({ profile: initialProfile }: StudentProgressProps) {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [mappings, setMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Student Profile and Application Mappings
  const fetchProgressData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUserEmail(user.email || '');

      let studentUser = profile;
      if (!studentUser?.user_id) {
        const { data: profRes } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        studentUser = profRes ? { ...profRes, email: user.email } : { user_id: user.id, email: user.email };
        setProfile(studentUser);
      }

      const { data: maps, error } = await supabase
        .from('mapped_candidates')
        .select('*, positions(*, companies(company_name))')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMappings(maps || []);
    } catch (err: any) {
      console.error('Error loading student progress:', err);
      toast.error('Failed to load placement progress data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();

    // Supabase Real-time listener for mapped_candidates
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`student-progress-realtime-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'mapped_candidates',
          filter: `student_id=eq.${user.id}`
        }, () => fetchProgressData())
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'positions'
        }, () => fetchProgressData())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtime();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, []);

  // Withdraw application action
  const handleWithdrawApplication = async (positionId: string) => {
    if (!profile?.user_id) return;
    try {
      const { error } = await supabase
        .from('mapped_candidates')
        .delete()
        .eq('student_id', profile.user_id)
        .eq('position_id', positionId);

      if (error) throw error;
      toast.success('Application withdrawn successfully.');
      fetchProgressData();
    } catch (err: any) {
      toast.error('Failed to withdraw application: ' + err.message);
    }
  };

  // 2. Placement Overview KPI Stats
  const overviewStats = useMemo(() => {
    let applied = 0;
    let recommended = 0;
    let mapped = 0;
    let interview = 0;
    let offers = 0;
    let selected = 0;
    let rejected = 0;
    let withdrawn = 0;

    mappings.forEach((m) => {
      const st = (m.status || '').toLowerCase();
      if (st === 'applied' || st === '') applied++;
      else if (st === 'faculty_recommended' || st === 'recommended') recommended++;
      else if (st === 'mapped') mapped++;
      else if (st === 'interview_scheduled' || st === 'interviewing') interview++;
      else if (st === 'offered') offers++;
      else if (st === 'selected' || st === 'placed') selected++;
      else if (st === 'rejected') rejected++;
      else if (st === 'withdrawn') withdrawn++;
      else applied++;
    });

    const totalApps = mappings.length;

    return {
      totalApps,
      applied,
      recommended,
      mapped,
      interview,
      offers,
      selected,
      rejected,
      withdrawn
    };
  }, [mappings]);

  // 3. Current Pipeline Stepper Stage
  const pipelineProgress = useMemo(() => {
    const stages = [
      { key: 'applied', label: 'Applied', icon: Briefcase },
      { key: 'recommended', label: 'Faculty Recommended', icon: UserCheck },
      { key: 'mapped', label: 'Admin Mapped', icon: Layers },
      { key: 'interview', label: 'Interview', icon: Calendar },
      { key: 'offer', label: 'Offer Received', icon: Award },
      { key: 'selected', label: 'Selected / Placed', icon: CheckCircle2 }
    ];

    let currentStepIndex = 0;
    if (overviewStats.selected > 0) currentStepIndex = 5;
    else if (overviewStats.offers > 0) currentStepIndex = 4;
    else if (overviewStats.interview > 0) currentStepIndex = 3;
    else if (overviewStats.mapped > 0) currentStepIndex = 2;
    else if (overviewStats.recommended > 0) currentStepIndex = 1;
    else if (overviewStats.totalApps > 0) currentStepIndex = 0;
    else currentStepIndex = -1;

    return { stages, currentStepIndex };
  }, [overviewStats]);

  // 4. Filter Active Offers / Placed Candidates
  const placementOffers = useMemo(() => {
    return mappings.filter(m => {
      const st = (m.status || '').toLowerCase();
      return st === 'selected' || st === 'placed' || st === 'offered';
    });
  }, [mappings]);

  // 5. Timeline Events
  const timelineEvents = useMemo(() => {
    return mappings.map(m => {
      const st = (m.status || '').toLowerCase();
      const company = m.positions?.companies?.company_name || 'Partner Company';
      const role = m.positions?.role || m.positions?.title || 'Job Opening';
      
      let title = `Applied for ${role} at ${company}`;
      let stageLabel = 'Applied';
      let icon = Briefcase;
      let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';

      if (st === 'faculty_recommended' || st === 'recommended') {
        title = `Faculty recommended for ${role} at ${company}`;
        stageLabel = 'Faculty Recommended';
        icon = UserCheck;
        badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
      } else if (st === 'mapped') {
        title = `Admin mapped to ${role} at ${company}`;
        stageLabel = 'Admin Mapped';
        icon = Layers;
        badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      } else if (st === 'interview_scheduled' || st === 'interviewing') {
        title = `Interview scheduled for ${role} at ${company}`;
        stageLabel = 'Interview Scheduled';
        icon = Calendar;
        badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      } else if (st === 'offered') {
        title = `Offer received for ${role} at ${company}!`;
        stageLabel = 'Offer Received';
        icon = Award;
        badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      } else if (st === 'selected' || st === 'placed') {
        title = `Selected for ${role} at ${company}!`;
        stageLabel = 'Selected / Placed';
        icon = CheckCircle2;
        badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      } else if (st === 'rejected') {
        title = `Application status updated for ${role} at ${company}`;
        stageLabel = 'Not Selected';
        icon = XCircle;
        badgeClass = 'bg-red-50 text-red-700 border-red-200';
      }

      return {
        id: m.id,
        title,
        company,
        role,
        date: m.updated_at || m.created_at,
        stageLabel,
        icon,
        badgeClass,
        rawStatus: st
      };
    });
  }, [mappings]);

  const formatTimelineDate = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--gold-medium)] mb-3" />
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Syncing Placement Progress...</p>
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
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[var(--gold-medium)]" />
              <span className="text-xs font-mono font-bold text-[var(--gold-medium)] uppercase tracking-wider">
                UDYOOG Placement Progress
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
              Placement Progression & Tracking
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Monitor your active applications, recruitment funnel stages, and placement offers in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchProgressData}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:text-[var(--gold-medium)] hover:bg-amber-50/60 transition-all shadow-2xs cursor-pointer"
              title="Refresh Progress Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 py-2.5 bg-[var(--gold-medium)] text-white hover:bg-[#a55b00] rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Explore Jobs</span>
            </button>
          </div>
        </div>

        {/* 1. PLACEMENT OVERVIEW (6 KEY STAT CARDS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Applications</span>
            <div className="text-2xl sm:text-3xl font-black text-[#111111] font-mono">{overviewStats.totalApps}</div>
            <span className="text-[10px] text-gray-500 mt-1 block">Active Drives</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-2xs">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">Faculty Recommended</span>
            <div className="text-2xl sm:text-3xl font-black text-purple-700 font-mono">{overviewStats.recommended}</div>
            <span className="text-[10px] text-purple-500 mt-1 block">Endorsed</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-2xs">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">Admin Mapped</span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">{overviewStats.mapped}</div>
            <span className="text-[10px] text-indigo-500 mt-1 block">Shortlisted</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Interviews</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">{overviewStats.interview}</div>
            <span className="text-[10px] text-amber-500 mt-1 block">In Progress</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Offers</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">{overviewStats.offers}</div>
            <span className="text-[10px] text-emerald-600 mt-1 block">Offer Letters</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Selected / Placed</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">{overviewStats.selected}</div>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Confirmed Placements</span>
          </div>
        </div>

        {/* 2. MY PLACEMENT PROGRESS JOURNEY (COMPLETE PIPELINE STEPPER) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--gold-medium)]" />
                My Placement Progress Journey
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Sequential recruitment pipeline progression for your applications</p>
            </div>

            <span className="text-xs font-mono font-bold text-[var(--gold-medium)] bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/60">
              Highest Stage: {pipelineProgress.currentStepIndex >= 0 ? pipelineProgress.stages[pipelineProgress.currentStepIndex].label : 'No Applications'}
            </span>
          </div>

          <div className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
              {pipelineProgress.stages.map((stage, idx) => {
                const Icon = stage.icon;
                const isPassed = idx <= pipelineProgress.currentStepIndex;
                const isCurrent = idx === pipelineProgress.currentStepIndex;

                return (
                  <div key={stage.key} className="flex flex-col items-center text-center space-y-3 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isCurrent 
                        ? 'bg-[var(--gold-medium)] text-white ring-4 ring-amber-100 shadow-md scale-105' 
                        : isPassed 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-xs font-extrabold ${isPassed ? 'text-[#111111]' : 'text-gray-400'}`}>
                        {stage.label}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        Step {idx + 1}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* 3. APPLICATION STATUS BREAKDOWN */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-4"
        >
          <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[var(--gold-medium)]" />
            Application Status Breakdown
          </h3>
          <p className="text-xs text-gray-500">Distribution of your active candidate mappings across supported platform statuses</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-center">
              <span className="text-[10px] font-bold text-blue-600 uppercase block">Applied</span>
              <span className="text-xl font-black text-blue-800 font-mono mt-0.5 block">{overviewStats.applied}</span>
            </div>
            <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 text-center">
              <span className="text-[10px] font-bold text-purple-600 uppercase block">Recommended</span>
              <span className="text-xl font-black text-purple-800 font-mono mt-0.5 block">{overviewStats.recommended}</span>
            </div>
            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-center">
              <span className="text-[10px] font-bold text-indigo-600 uppercase block">Mapped</span>
              <span className="text-xl font-black text-indigo-800 font-mono mt-0.5 block">{overviewStats.mapped}</span>
            </div>
            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">Interview</span>
              <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">{overviewStats.interview}</span>
            </div>
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Offer</span>
              <span className="text-xl font-black text-emerald-800 font-mono mt-0.5 block">{overviewStats.offers}</span>
            </div>
            <div className="p-3.5 bg-emerald-100/60 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Selected</span>
              <span className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">{overviewStats.selected}</span>
            </div>
            <div className="p-3.5 bg-red-50/60 rounded-2xl border border-red-100 text-center">
              <span className="text-[10px] font-bold text-red-600 uppercase block">Rejected</span>
              <span className="text-xl font-black text-red-800 font-mono mt-0.5 block">{overviewStats.rejected}</span>
            </div>
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Withdrawn</span>
              <span className="text-xl font-black text-gray-700 font-mono mt-0.5 block">{overviewStats.withdrawn}</span>
            </div>
          </div>
        </motion.div>

        {/* 4. OFFERS / PLACEMENT RESULT */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--gold-medium)]" />
              Offers & Placement Results
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              {placementOffers.length} Confirmed Results
            </span>
          </div>

          {placementOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {placementOffers.map((offer) => (
                <div 
                  key={offer.id}
                  className="p-6 bg-gradient-to-br from-emerald-900 via-emerald-800 to-[#111111] text-white rounded-3xl shadow-lg border border-emerald-700 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-widest font-mono">
                        {offer.positions?.companies?.company_name || 'Partner Company'}
                      </span>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider rounded-lg">
                        Selected & Placed
                      </span>
                    </div>

                    <h4 className="text-xl font-black text-white">
                      {offer.positions?.role || offer.positions?.title || 'Placement Offer'}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100 pt-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>{offer.positions?.location || 'Location Verified'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="w-4 h-4 text-emerald-400" />
                        <span>{offer.positions?.salary || 'Offered Compensation'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-200 font-mono">
                      Confirmed on {formatTimelineDate(offer.updated_at || offer.created_at)}
                    </span>
                    <button
                      onClick={() => navigate('/jobs')}
                      className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      View Role
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 space-y-2">
              <Award className="w-10 h-10 text-gray-300 mx-auto" />
              <h4 className="text-sm font-extrabold text-[#111111]">No Placement Offers Yet</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Continue building your portfolio, adding technical skills, and applying to active company drives to advance your recruitment pipeline.
              </p>
            </div>
          )}
        </motion.div>

        {/* 5. CURRENT APPLICATIONS TABLE / CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-8 bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[var(--gold-medium)]" />
                  Current Applications
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Active drive mappings and current status tracker</p>
              </div>

              <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-xl">
                {mappings.length} Records
              </span>
            </div>

            {mappings.length > 0 ? (
              <div className="space-y-3">
                {mappings.map((app) => {
                  const companyName = app.positions?.companies?.company_name || 'Partner Company';
                  const roleTitle = app.positions?.role || app.positions?.title || 'Job Opening';
                  const st = (app.status || 'applied').toLowerCase();

                  let statusText = 'Applied';
                  let statusColor = 'bg-blue-50 text-blue-700 border-blue-200';

                  if (st === 'faculty_recommended' || st === 'recommended') {
                    statusText = 'Faculty Recommended';
                    statusColor = 'bg-purple-50 text-purple-700 border-purple-200';
                  } else if (st === 'mapped') {
                    statusText = 'Admin Mapped';
                    statusColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  } else if (st === 'interview_scheduled' || st === 'interviewing') {
                    statusText = 'Interview Scheduled';
                    statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
                  } else if (st === 'offered') {
                    statusText = 'Offer Received';
                    statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  } else if (st === 'selected' || st === 'placed') {
                    statusText = 'Selected / Placed';
                    statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  } else if (st === 'rejected') {
                    statusText = 'Rejected';
                    statusColor = 'bg-red-50 text-red-700 border-red-200';
                  }

                  return (
                    <div 
                      key={app.id} 
                      className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[var(--gold-medium)]/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-sm text-[var(--gold-medium)] shrink-0 shadow-2xs">
                          {companyName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-[#111111]">{roleTitle}</h4>
                          <span className="text-xs font-bold text-[var(--gold-medium)]">{companyName}</span>
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                            <span>Applied: {formatTimelineDate(app.created_at)}</span>
                            {app.positions?.location && (
                              <>
                                <span>•</span>
                                <span>{app.positions.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${statusColor}`}>
                          {statusText}
                        </span>

                        {st === 'applied' && (
                          <button
                            onClick={() => handleWithdrawApplication(app.position_id)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 space-y-3">
                <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-500">You haven't submitted any job applications yet.</p>
                <button
                  onClick={() => navigate('/jobs')}
                  className="px-4 py-2 bg-[var(--gold-medium)] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#a55b00] transition-all cursor-pointer"
                >
                  Browse Available Jobs
                </button>
              </div>
            )}
          </motion.div>

          {/* 6. APPLICATION TIMELINE */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-4 bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6"
          >
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--gold-medium)]" />
                Application Timeline
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Chronological log of placement events</p>
            </div>

            {timelineEvents.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {timelineEvents.map((evt) => {
                  const Icon = evt.icon;
                  return (
                    <div key={evt.id} className="flex items-start gap-3 relative z-10 pl-1">
                      <div className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow-2xs flex items-center justify-center text-[var(--gold-medium)] shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-1 bg-gray-50/70 p-3 rounded-2xl border border-gray-100 flex-1">
                        <div className="text-xs font-bold text-[#111111] leading-snug">{evt.title}</div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1">
                          <span>{formatTimelineDate(evt.date)}</span>
                          <span className={`font-bold px-2 py-0.5 rounded-md border ${evt.badgeClass}`}>
                            {evt.stageLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                No timeline activity recorded yet.
              </div>
            )}
          </motion.div>

        </div>

      </main>
      <Toaster position="top-right" />
    </div>
  );
}
