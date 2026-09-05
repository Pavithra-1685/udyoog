import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { 
  Award, Target, Zap, CheckCircle2, TrendingUp, AlertCircle, 
  Briefcase, Layers, MapPin, IndianRupee, Filter, Sparkles, 
  ArrowRight, ExternalLink, Check, Clock, UserCheck, Building, 
  Search, ShieldCheck, FileText, CheckSquare, XCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

interface StudentAnalyticsProps {
  profile: any;
}

const LEVEL_COLORS = {
  Expert: '#10b981',
  Intermediate: '#3b82f6',
  Beginner: '#f59e0b',
};

export default function StudentAnalytics({ profile }: StudentAnalyticsProps) {
  const navigate = useNavigate();
  const [studentMappings, setStudentMappings] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  const studentId = profile?.user_id;

  // 1. Fetch Real-time Supabase Application Mappings & Positions
  const fetchData = async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    try {
      const [mappingsRes, positionsRes] = await Promise.all([
        supabase
          .from('mapped_candidates')
          .select('*, positions(*, companies(company_name))')
          .eq('student_id', studentId),
        supabase
          .from('positions')
          .select('*, companies(company_name)')
          .in('status', ['open', 'on_hold'])
      ]);

      if (mappingsRes.data) setStudentMappings(mappingsRes.data);
      if (positionsRes.data) setActiveJobs(positionsRes.data);
    } catch (err) {
      console.error('Error loading student analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!studentId) return;

    // Real-time Subscriptions for Student Analytics
    const channel = supabase.channel(`student-analytics-${studentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mapped_candidates',
        filter: `student_id=eq.${studentId}`
      }, () => fetchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'positions'
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  // Extract skills safely
  const skills: Skill[] = useMemo(() => {
    if (!profile?.skills) return [];
    if (Array.isArray(profile.skills)) return profile.skills;
    return [];
  }, [profile?.skills]);

  // Filtered skills based on domain filter
  const filteredSkills = useMemo(() => {
    if (selectedDomain === 'all') return skills;
    return skills.filter(s => {
      const name = s.name?.toLowerCase() || '';
      if (selectedDomain === 'software') return name.includes('java') || name.includes('c++') || name.includes('python') || name.includes('dsa') || name.includes('algo') || name.includes('system');
      if (selectedDomain === 'web') return name.includes('react') || name.includes('js') || name.includes('html') || name.includes('node') || name.includes('css') || name.includes('web');
      if (selectedDomain === 'database') return name.includes('sql') || name.includes('mongo') || name.includes('postgres') || name.includes('db') || name.includes('data');
      if (selectedDomain === 'data') return name.includes('data') || name.includes('ai') || name.includes('ml') || name.includes('python') || name.includes('analytics');
      return true;
    });
  }, [skills, selectedDomain]);

  // 2. Calculate Career Readiness Score
  const readinessMetrics = useMemo(() => {
    let score = 0;

    // Academic Factor (max 25 pts)
    const cgpaVal = parseFloat(profile?.cgpa || '0');
    if (cgpaVal > 0) {
      score += Math.min(Math.round((cgpaVal / 10) * 25), 25);
    }

    // Skills Factor (max 25 pts)
    if (skills.length > 0) {
      const skillScore = Math.min(skills.length * 4, 15);
      const expertBonus = skills.filter(s => s.level === 'Expert').length * 4;
      const interBonus = skills.filter(s => s.level === 'Intermediate').length * 2;
      score += Math.min(skillScore + expertBonus + interBonus, 25);
    }

    // Profile Completeness (max 25 pts)
    const fields = [
      profile?.full_name, profile?.phone, profile?.graduation, profile?.branch,
      profile?.github_url, profile?.linkedin_url, profile?.resume_url, profile?.home_location
    ];
    const completedFields = fields.filter(Boolean).length;
    score += Math.round((completedFields / fields.length) * 25);

    // Application & Activity Factor (max 25 pts)
    const appCount = studentMappings.length;
    if (appCount > 0) score += 10;
    const shortlistedCount = studentMappings.filter(m => ['admin_mapped', 'faculty_recommended', 'interview', 'offer', 'placed'].includes(m.status)).length;
    if (shortlistedCount > 0) score += 15;

    const finalScore = Math.min(Math.max(score, 10), 100);

    let interpretation = "Add skills and complete your profile to boost your readiness score.";
    if (finalScore >= 85) {
      interpretation = "Exceptional readiness — your profile matches tier-1 recruitment standards!";
    } else if (finalScore >= 70) {
      interpretation = "Good readiness — strengthen System Design and Database skills to improve placement opportunities.";
    } else if (finalScore >= 50) {
      interpretation = "Moderate readiness — add 2+ technical skills and upload your resume to increase visibility.";
    }

    return { score: finalScore, interpretation };
  }, [profile, skills, studentMappings]);

  // 3. Academic CGPA Trend
  const cgpaData = useMemo(() => {
    const semKeys = ['sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6', 'sem7', 'sem8'];
    const data = semKeys.map((semKey, idx) => {
      const semNum = idx + 1;
      const rawVal = profile?.semester_cgpa?.[semKey];
      const val = parseFloat(rawVal);
      return {
        name: `Sem ${semNum}`,
        semNum,
        cgpa: !isNaN(val) && rawVal !== null && rawVal !== undefined && rawVal !== '' ? val : null
      };
    }).filter(d => d.cgpa !== null);

    if (selectedSemester !== 'all') {
      const targetSem = parseInt(selectedSemester);
      return data.filter(d => d.semNum <= targetSem);
    }

    return data;
  }, [profile?.semester_cgpa, selectedSemester]);

  // CGPA Insights
  const cgpaInsight = useMemo(() => {
    if (cgpaData.length < 2) return null;
    const first = cgpaData[0].cgpa;
    const last = cgpaData[cgpaData.length - 1].cgpa;
    const diff = (last - first).toFixed(2);
    const numDiff = parseFloat(diff);
    if (numDiff > 0) {
      return `Your CGPA improved by +${diff} compared with Sem 1.`;
    } else if (numDiff < 0) {
      return `Your CGPA shifted by ${diff} compared with Sem 1.`;
    }
    return `Your CGPA has remained consistently steady at ${last.toFixed(2)}.`;
  }, [cgpaData]);

  // 4. Skill Level Distribution (Donut Chart)
  const skillDistribution = useMemo(() => {
    return [
      { name: 'Expert', value: filteredSkills.filter(s => s && s.level === 'Expert').length, color: LEVEL_COLORS.Expert },
      { name: 'Intermediate', value: filteredSkills.filter(s => s && s.level === 'Intermediate').length, color: LEVEL_COLORS.Intermediate },
      { name: 'Beginner', value: filteredSkills.filter(s => s && s.level === 'Beginner').length, color: LEVEL_COLORS.Beginner },
    ].filter(d => d.value > 0);
  }, [filteredSkills]);

  // 5. Skill Proficiency Radar Data
  const radarData = useMemo(() => {
    return filteredSkills.slice(0, 6).map(s => {
      const name = s.name || 'Skill';
      const level = s.level;
      return {
        subject: name,
        A: level === 'Expert' ? 100 : level === 'Intermediate' ? 66 : 33,
        fullMark: 100,
      };
    });
  }, [filteredSkills]);

  // 6. Industry Skill Gap Analysis
  const skillGapData = useMemo(() => {
    const hasDSA = skills.some(s => s.name?.toLowerCase().includes('data') || s.name?.toLowerCase().includes('algo') || s.name?.toLowerCase().includes('dsa') || s.name?.toLowerCase().includes('c++'));
    const hasWeb = skills.some(s => s.name?.toLowerCase().includes('react') || s.name?.toLowerCase().includes('js') || s.name?.toLowerCase().includes('web') || s.name?.toLowerCase().includes('html') || s.name?.toLowerCase().includes('node'));
    const hasDB = skills.some(s => s.name?.toLowerCase().includes('sql') || s.name?.toLowerCase().includes('database') || s.name?.toLowerCase().includes('mongo') || s.name?.toLowerCase().includes('postgres'));
    const hasProblemSolving = skills.length >= 3;
    const hasSysDesign = skills.some(s => s.level === 'Expert' || s.name?.toLowerCase().includes('system') || s.name?.toLowerCase().includes('architecture'));

    const items = [
      { skill: 'Data Structures', YourLevel: hasDSA ? 85 : 55, IndustryTarget: 80 },
      { skill: 'Web / App Dev', YourLevel: hasWeb ? 90 : 45, IndustryTarget: 75 },
      { skill: 'Database & SQL', YourLevel: hasDB ? 80 : 40, IndustryTarget: 70 },
      { skill: 'Problem Solving', YourLevel: hasProblemSolving ? 85 : 50, IndustryTarget: 85 },
      { skill: 'System Design', YourLevel: hasSysDesign ? 80 : 35, IndustryTarget: 65 },
    ];

    return items.map(item => ({
      ...item,
      Gap: item.IndustryTarget - item.YourLevel
    })).sort((a, b) => b.Gap - a.Gap); // Sort by largest gap first
  }, [skills]);

  // Largest Gap Insight
  const largestGapInsight = useMemo(() => {
    if (skillGapData.length === 0) return null;
    const maxGapItem = skillGapData[0];
    if (maxGapItem.Gap > 0) {
      return `Your biggest improvement opportunity is ${maxGapItem.skill} (Gap: -${maxGapItem.Gap}pts).`;
    }
    return "Great job! Your skills meet or exceed all industry target standards.";
  }, [skillGapData]);

  // 7. Domain Readiness Calculations
  const domainReadiness = useMemo(() => {
    const count = skills.length;
    const cgpaNum = parseFloat(profile?.cgpa || '0');

    const softwareEng = Math.min(Math.round((count * 15) + (cgpaNum * 4)), 95);
    const webDev = Math.min(Math.round((skills.filter(s => ['react', 'js', 'javascript', 'node', 'html', 'css', 'web'].some(k => s.name?.toLowerCase().includes(k))).length * 25) + 30), 95);
    const dbBackend = Math.min(Math.round((skills.filter(s => ['sql', 'database', 'mongo', 'postgres', 'backend', 'api'].some(k => s.name?.toLowerCase().includes(k))).length * 30) + 25), 90);
    const dataAI = Math.min(Math.round((skills.filter(s => ['python', 'data', 'ai', 'ml', 'pandas', 'analytics'].some(k => s.name?.toLowerCase().includes(k))).length * 30) + (cgpaNum * 3)), 90);
    const problemSolving = Math.min(Math.round((count * 12) + (cgpaNum * 5)), 95);

    return [
      { domain: 'Software Engineering', score: Math.max(softwareEng, 25), color: '#c66e00' },
      { domain: 'Web Development', score: Math.max(webDev, 30), color: '#3b82f6' },
      { domain: 'Database / Backend', score: Math.max(dbBackend, 20), color: '#10b981' },
      { domain: 'Data & AI', score: Math.max(dataAI, 20), color: '#8b5cf6' },
      { domain: 'Problem Solving Index', score: Math.max(problemSolving, 35), color: '#ec4899' },
    ];
  }, [skills, profile?.cgpa]);

  // 8. Recommended Opportunities & Match Scoring
  const recommendedJobs = useMemo(() => {
    return activeJobs.map(job => {
      const mapping = studentMappings.find(m => m.position_id === job.id);
      
      // Calculate match percentage based on skills & role text
      const roleText = (job.role + ' ' + (job.description || '')).toLowerCase();
      let matchCount = 0;
      skills.forEach(s => {
        if (roleText.includes(s.name?.toLowerCase())) matchCount++;
      });
      
      let baseMatch = 65 + (matchCount * 8);
      if (profile?.cgpa && parseFloat(profile.cgpa) >= 8.0) baseMatch += 10;
      const matchScore = Math.min(baseMatch, 98);

      return {
        ...job,
        matchScore,
        mapping
      };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
  }, [activeJobs, studentMappings, skills, profile?.cgpa]);

  // 9. Placement Progress Timeline Milestone
  const placementMilestone = useMemo(() => {
    const statuses = studentMappings.map(m => m.status);
    
    const isSelected = statuses.includes('placed') || statuses.includes('selected') || profile?.placement_status?.toLowerCase() === 'placed';
    const isOffer = statuses.includes('offer');
    const isInterview = statuses.includes('interview');
    const isMapped = statuses.includes('admin_mapped') || statuses.includes('shortlisted');
    const isRecommended = statuses.includes('faculty_recommended');
    const isApplied = studentMappings.length > 0;

    let highestStage = 'Applied';
    if (isSelected) highestStage = 'Selected';
    else if (isOffer) highestStage = 'Offer';
    else if (isInterview) highestStage = 'Interview';
    else if (isMapped) highestStage = 'Admin Mapped';
    else if (isRecommended) highestStage = 'Faculty Recommended';

    const counts = {
      applied: studentMappings.length,
      recommended: studentMappings.filter(m => m.status === 'faculty_recommended').length,
      mapped: studentMappings.filter(m => ['admin_mapped', 'shortlisted'].includes(m.status)).length,
      interview: studentMappings.filter(m => m.status === 'interview').length,
      offer: studentMappings.filter(m => m.status === 'offer').length,
      selected: studentMappings.filter(m => ['placed', 'selected'].includes(m.status)).length,
    };

    return {
      highestStage,
      isApplied,
      isRecommended,
      isMapped,
      isInterview,
      isOffer,
      isSelected,
      counts
    };
  }, [studentMappings, profile?.placement_status]);

  // 10. Application Status Overview
  const applicationStatusOverview = useMemo(() => {
    const counts: Record<string, number> = {
      'Applied': 0,
      'Faculty Recommended': 0,
      'Admin Mapped': 0,
      'Interview Scheduled': 0,
      'Selected / Placed': 0,
      'Withdrawn / Rejected': 0
    };

    studentMappings.forEach(m => {
      if (m.status === 'applied') counts['Applied']++;
      else if (m.status === 'faculty_recommended') counts['Faculty Recommended']++;
      else if (m.status === 'admin_mapped' || m.status === 'shortlisted') counts['Admin Mapped']++;
      else if (m.status === 'interview') counts['Interview Scheduled']++;
      else if (m.status === 'placed' || m.status === 'selected') counts['Selected / Placed']++;
      else if (m.status === 'rejected' || m.status === 'withdrawn') counts['Withdrawn / Rejected']++;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [studentMappings]);

  // 11. Profile Readiness Checklist
  const profileReadinessItems = useMemo(() => {
    return [
      { key: 'details', label: 'Basic Profile Details', isComplete: Boolean(profile?.full_name && profile?.branch && profile?.graduation), hint: 'Add full name and department' },
      { key: 'skills', label: 'Technical Skills Ingested', isComplete: skills.length > 0, hint: 'Add 2+ technical skills' },
      { key: 'cgpa', label: 'Academic CGPA Record', isComplete: Boolean(profile?.cgpa && parseFloat(profile.cgpa) > 0), hint: 'Enter overall CGPA' },
      { key: 'projects', label: 'Project Portfolio', isComplete: Boolean(profile?.projects && profile.projects.length > 0), hint: 'Add key projects' },
      { key: 'resume', label: 'Resume & Professional Links', isComplete: Boolean(profile?.resume_url || profile?.github_url || profile?.linkedin_url), hint: 'Upload resume or LinkedIn link' },
    ];
  }, [profile, skills]);

  const profileReadinessPercent = useMemo(() => {
    const done = profileReadinessItems.filter(i => i.isComplete).length;
    return Math.round((done / profileReadinessItems.length) * 100);
  }, [profileReadinessItems]);

  // 12. Dynamic Next Steps Actionable Insights
  const actionableNextSteps = useMemo(() => {
    const steps = [];

    // Gap insight
    if (skillGapData.length > 0 && skillGapData[0].Gap > 0) {
      steps.push({
        type: 'warning',
        title: `Improve ${skillGapData[0].skill}`,
        desc: `Your current proficiency is ${skillGapData[0].YourLevel} vs industry target of ${skillGapData[0].IndustryTarget}. Practice relevant concepts.`,
        action: 'Practice'
      });
    }

    // CGPA strength/alert
    if (profile?.cgpa && parseFloat(profile.cgpa) >= 8.5) {
      steps.push({
        type: 'success',
        title: 'Strong Academic Performance',
        desc: `Your CGPA of ${profile.cgpa} qualifies you for top tier recruitment drives.`,
        action: 'Eligible'
      });
    }

    // Resume / Links check
    if (!profile?.resume_url && !profile?.linkedin_url) {
      steps.push({
        type: 'warning',
        title: 'Upload Resume / Connect Profiles',
        desc: 'Candidates with verified resumes get 3x higher faculty recommendations.',
        action: 'Update Profile'
      });
    }

    // Top Job Match
    if (recommendedJobs.length > 0 && recommendedJobs[0].matchScore >= 75) {
      steps.push({
        type: 'target',
        title: `Recommended: ${recommendedJobs[0].role} at ${recommendedJobs[0].companies?.company_name}`,
        desc: `You have a ${recommendedJobs[0].matchScore}% match based on your skills profile.`,
        action: 'View Opportunity'
      });
    }

    return steps;
  }, [skillGapData, profile, recommendedJobs]);

  const handleApplyJob = async (jobId: string) => {
    if (!studentId) return;
    try {
      const insertPayload: any = {
        student_id: studentId,
        position_id: jobId,
        status: 'applied',
        mapped_by_role: 'student'
      };

      const { error } = await supabase
        .from('mapped_candidates')
        .insert([insertPayload]);

      if (error) throw error;
      toast.success('Applied successfully!');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to submit application: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--gold-medium)]" />
          <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">
            Personal Career Intelligence
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Semester Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[var(--gold-medium)] cursor-pointer"
            >
              <option value="all">All Semesters</option>
              <option value="1">Sem 1</option>
              <option value="2">Sem 2</option>
              <option value="3">Sem 3</option>
              <option value="4">Sem 4</option>
              <option value="5">Sem 5</option>
              <option value="6">Sem 6</option>
              <option value="7">Sem 7</option>
              <option value="8">Sem 8</option>
            </select>
          </div>

          {/* Skill Domain Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[var(--gold-medium)] cursor-pointer"
            >
              <option value="all">All Skill Domains</option>
              <option value="software">Software Eng</option>
              <option value="web">Web Development</option>
              <option value="database">Database & SQL</option>
              <option value="data">Data & AI</option>
            </select>
          </div>
        </div>
      </div>

      {/* 1. TOP SUMMARY CARDS (6 Cards Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Readiness Score */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[var(--gold-medium)] flex items-center justify-center mx-auto mb-2 border border-amber-200/60">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Career Readiness</span>
          <span className="text-2xl font-black text-[#111111] font-mono mt-0.5 block">
            {readinessMetrics.score}%
          </span>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
            ↑ Verified
          </span>
        </motion.div>

        {/* CGPA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200/60">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Overall CGPA</span>
          <span className="text-2xl font-black text-[#111111] font-mono mt-0.5 block">
            {profile?.cgpa || '0.00'}
          </span>
          <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Out of 10.0
          </span>
        </motion.div>

        {/* Verified Skills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-200/60">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Verified Skills</span>
          <span className="text-2xl font-black text-[#111111] font-mono mt-0.5 block">
            {skills.length}
          </span>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
            {skills.filter(s => s.level === 'Expert').length} Expert
          </span>
        </motion.div>

        {/* Applications */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2 border border-purple-200/60">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Applications</span>
          <span className="text-2xl font-black text-[#111111] font-mono mt-0.5 block">
            {studentMappings.length}
          </span>
          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Active
          </span>
        </motion.div>

        {/* Shortlisted / Mapped */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 border border-indigo-200/60">
            <UserCheck className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Mapped / Shortlisted</span>
          <span className="text-2xl font-black text-[#111111] font-mono mt-0.5 block">
            {studentMappings.filter(m => ['admin_mapped', 'faculty_recommended', 'interview', 'offer', 'placed'].includes(m.status)).length}
          </span>
          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Shortlisted
          </span>
        </motion.div>

        {/* Placement Status */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[var(--gold-medium)] flex items-center justify-center mx-auto mb-2 border border-amber-200/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Placement Status</span>
          <span className="text-sm font-black text-[#111111] uppercase tracking-wide mt-1 block truncate">
            {profile?.placement_status || (studentMappings.some(m => m.status === 'placed') ? 'Placed' : 'In Progress')}
          </span>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Live Status
          </span>
        </motion.div>

      </div>

      {/* 2. CAREER READINESS SCORE BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#111111] via-[#1a1a1a] to-[#111111] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-bold border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold-medium)]" />
            <span>AI Placement Readiness Score</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Overall Readiness Index: <span className="text-[var(--gold-medium)]">{readinessMetrics.score}%</span>
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed font-medium">
            "{readinessMetrics.interpretation}"
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center min-w-[120px]">
            <span className="text-[10px] font-extrabold text-gray-300 uppercase tracking-widest block">Readiness</span>
            <span className="text-3xl font-black text-white font-mono mt-0.5 block">{readinessMetrics.score}%</span>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="px-5 py-3 bg-[var(--gold-medium)] hover:bg-[#a55b00] text-white text-xs font-extrabold uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Boost Score</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* 3. ACADEMIC PERFORMANCE (CGPA Trend) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--gold-medium)]" />
              Academic CGPA Trajectory
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Semester-wise academic performance trend analysis</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gray-50 border border-gray-200/80 rounded-2xl text-center">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Current CGPA</span>
              <span className="text-base font-black text-[#111111] font-mono">{profile?.cgpa || 'N/A'}</span>
            </div>
          </div>
        </div>

        {cgpaData.length > 0 ? (
          <div className="space-y-4">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cgpaData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cgpa" 
                    name="Semester CGPA"
                    stroke="var(--gold-medium)" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: 'var(--gold-medium)', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#111111', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {cgpaInsight && (
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/50 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                <Sparkles className="w-4 h-4 text-[var(--gold-medium)] shrink-0" />
                <span>{cgpaInsight}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[220px] bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-xs font-bold text-gray-500">No academic semester records found</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-xs">Add your semester-wise CGPA in the Career Profile section to view your trajectory graph.</p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-3 text-xs font-extrabold text-[var(--gold-medium)] hover:underline cursor-pointer"
            >
              Add Academic Records
            </button>
          </div>
        )}
      </motion.div>

      {/* 4 & 5. SKILL PROFICIENCY & LEVEL DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Skill Proficiency Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8"
        >
          <h3 className="text-lg font-extrabold text-[#111111] mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--gold-medium)]" />
            Skill Proficiency Analysis
          </h3>
          <p className="text-xs text-gray-500 mb-6">Radar visualization of your ingested technical competencies</p>

          {filteredSkills.length > 0 ? (
            <div className="space-y-6">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Proficiency Level"
                      dataKey="A"
                      stroke="var(--gold-medium)"
                      fill="var(--gold-medium)"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Skills Badge Cards */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {filteredSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
                      s.level === 'Expert' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                      s.level === 'Intermediate' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                      'bg-amber-50 text-amber-800 border-amber-200/60'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({s.level})</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[240px] bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center">
              <Award className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-600">Add skills to see your proficiency analysis.</p>
              <button
                onClick={() => navigate('/profile')}
                className="mt-3 text-xs font-extrabold text-[var(--gold-medium)] hover:underline cursor-pointer"
              >
                Go to Profile Form
              </button>
            </div>
          )}
        </motion.div>

        {/* Skill Level Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-extrabold text-[#111111] mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--gold-medium)]" />
              Skill Level Distribution
            </h3>
            <p className="text-xs text-gray-500 mb-6">Breakdown across Expert, Intermediate, and Beginner competencies</p>

            {skillDistribution.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={skillDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {skillDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-center gap-6 pt-2 border-t border-gray-100">
                  {skillDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-700">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span>{item.name}:</span>
                      <span className="font-mono text-[#111111]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[240px] bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400">No skills data available</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* 6 & 7. INDUSTRY SKILL GAP ANALYSIS & DOMAIN READINESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Industry Skill Benchmark & Gap Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <Zap className="w-5 h-5 text-[var(--gold-medium)]" />
                Industry Skill Gap Analysis
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Comparing your current skill levels with industry hiring standards</p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-[var(--gold-medium)] border border-amber-200/60 rounded-xl text-[10px] font-extrabold uppercase font-mono tracking-wider shrink-0">
              Hiring Benchmarks
            </span>
          </div>

          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={skillGapData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="skill" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="YourLevel" name="Your Level" fill="var(--gold-medium)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="IndustryTarget" name="Industry Target" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {largestGapInsight && (
            <div className="p-3.5 bg-gray-50 border border-gray-200/70 rounded-2xl text-xs font-semibold text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--gold-medium)] shrink-0" />
              <span>{largestGapInsight}</span>
            </div>
          )}
        </motion.div>

        {/* Domain Readiness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-extrabold text-[#111111] mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--gold-medium)]" />
              Domain Readiness Index
            </h3>
            <p className="text-xs text-gray-500 mb-6">Targeted readiness levels calculated across core tech domains</p>

            <div className="space-y-4">
              {domainReadiness.map((d, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#111111]">
                    <span>{d.domain}</span>
                    <span className="font-mono text-gray-700">{d.score}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${d.score}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-400 font-medium">
            Readiness indexes update dynamically as you add skills and CGPA records.
          </div>
        </motion.div>

      </div>

      {/* 9 & 10. PLACEMENT PROGRESS & APPLICATION STATUS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Placement Journey Milestone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--gold-medium)]" />
              My Placement Progress Journey
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Tracking your multi-stage candidate progression pipeline</p>
          </div>

          {/* Stepper Pipeline */}
          <div className="py-4">
            <div className="grid grid-cols-6 gap-2 text-center relative">
              
              {[
                { stage: 'Applied', isPassed: placementMilestone.isApplied },
                { stage: 'Faculty Recommended', isPassed: placementMilestone.isRecommended },
                { stage: 'Admin Mapped', isPassed: placementMilestone.isMapped },
                { stage: 'Interview', isPassed: placementMilestone.isInterview },
                { stage: 'Offer', isPassed: placementMilestone.isOffer },
                { stage: 'Selected', isPassed: placementMilestone.isSelected },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                    step.isPassed 
                      ? 'bg-[var(--gold-medium)] text-white ring-4 ring-amber-100' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}>
                    {step.isPassed ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider line-clamp-1 ${
                    step.isPassed ? 'text-[var(--gold-medium)]' : 'text-gray-400'
                  }`}>
                    {step.stage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Breakdown Counters */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2 border-t border-gray-100 text-center">
            <div className="p-2.5 bg-gray-50 rounded-2xl">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Applications</span>
              <span className="text-sm font-black text-[#111111] font-mono mt-0.5 block">{placementMilestone.counts.applied}</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-2xl">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Recommended</span>
              <span className="text-sm font-black text-[#111111] font-mono mt-0.5 block">{placementMilestone.counts.recommended}</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-2xl">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Mapped</span>
              <span className="text-sm font-black text-[#111111] font-mono mt-0.5 block">{placementMilestone.counts.mapped}</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-2xl">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Interviews</span>
              <span className="text-sm font-black text-[#111111] font-mono mt-0.5 block">{placementMilestone.counts.interview}</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-2xl">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Offers</span>
              <span className="text-sm font-black text-[#111111] font-mono mt-0.5 block">{placementMilestone.counts.offer}</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-2xl">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Selected</span>
              <span className="text-sm font-black text-emerald-600 font-mono mt-0.5 block">{placementMilestone.counts.selected}</span>
            </div>
          </div>
        </motion.div>

        {/* Application Status Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-extrabold text-[#111111] mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[var(--gold-medium)]" />
              Application Status Breakdown
            </h3>
            <p className="text-xs text-gray-500 mb-4">Distribution of your active submissions</p>

            {applicationStatusOverview.length > 0 ? (
              <div className="space-y-3">
                {applicationStatusOverview.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-700">{item.name}</span>
                    <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-xl text-xs font-black font-mono text-[#111111]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
                <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-500">You haven't applied to any opportunities yet.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* 8. RECOMMENDED OPPORTUNITIES (JOB MATCH / ELIGIBILITY) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[var(--gold-medium)]" />
              Recommended Opportunities for You
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Active hiring drives matched with your skills & eligibility</p>
          </div>
          <button
            onClick={() => navigate('/jobs')}
            className="text-xs font-bold text-[var(--gold-medium)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All Drives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recommendedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedJobs.map((job) => (
              <div 
                key={job.id} 
                className="p-5 bg-gray-50/80 rounded-3xl border border-gray-200/70 hover:border-[var(--gold-medium)]/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-extrabold text-[var(--gold-medium)] truncate">{job.companies?.company_name || 'Partner Company'}</span>
                    <span className="px-2 py-0.5 bg-amber-50 text-[var(--gold-medium)] border border-amber-200/60 text-[10px] font-black rounded-md font-mono shrink-0">
                      {job.matchScore}% Match
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
                  ) : job.mapping ? (
                    <div className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-extrabold uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Applied ({job.mapping.status})</span>
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
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-500">No matching opportunities found yet.</p>
          </div>
        )}
      </motion.div>

      {/* 11 & 12. PROFILE READINESS & ACTIONABLE NEXT STEPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Readiness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[var(--gold-medium)]" />
                Profile Placement Readiness
              </h3>
              <span className="text-sm font-black text-[#111111] font-mono">{profileReadinessPercent}%</span>
            </div>

            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-[var(--gold-gradient)]" style={{ width: `${profileReadinessPercent}%` }} />
            </div>

            <div className="space-y-3">
              {profileReadinessItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    {item.isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-gray-800">{item.label}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    item.isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {item.isComplete ? 'Complete' : item.hint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Your Next Steps */}
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
            <p className="text-xs text-gray-500 mb-6">Data-driven recommendations to accelerate your placement readiness</p>

            <div className="space-y-3">
              {actionableNextSteps.length > 0 ? (
                actionableNextSteps.map((step, idx) => (
                  <div key={idx} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {step.type === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-600" /> :
                         step.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                         <Target className="w-4 h-4 text-[var(--gold-medium)]" />}
                        <h4 className="text-xs font-extrabold text-[#111111]">{step.title}</h4>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed font-medium">{step.desc}</p>
                    </div>

                    <button 
                      onClick={() => navigate('/profile')}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-[#111111] text-[10px] font-extrabold rounded-xl shrink-0 cursor-pointer shadow-2xs"
                    >
                      {step.action}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-gray-400 italic">
                  Keep up the great work! Your career profile is fully optimized.
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>

    </div>
  );
}
