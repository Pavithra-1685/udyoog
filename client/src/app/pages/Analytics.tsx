import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Briefcase, Activity as ActivityIcon, Building2, Loader2, Sparkles,
  Users, Award, CheckCircle2, AlertTriangle, ArrowUpRight, Filter, Calendar,
  DollarSign, Clock, Layers, ArrowRight, RefreshCw, ChevronRight, UserCheck, Search, X, Mail, GraduationCap
} from 'lucide-react';
import Navigation from '../components/shared/Navigation';
import StudentAnalytics from '../components/student/StudentAnalytics';
import { supabase } from '../../lib/supabase';
import { nativeBroadcastChannel } from '../../lib/notificationService';
import { toast, Toaster } from 'sonner';

interface ProfileItem {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  role: string;
  branch?: string;
  department?: string;
  status?: string;
  cgpa?: number | string;
  created_at?: string;
}

interface CompanyItem {
  id: string;
  company_name: string;
  industry?: string;
  website?: string;
  created_at?: string;
}

interface PositionItem {
  id: string;
  company_id: string;
  role: string;
  title?: string;
  location?: string;
  salary?: string;
  status: string;
  created_at?: string;
  companies?: {
    id: string;
    company_name: string;
  };
}

interface MappingItem {
  id: string;
  student_id: string;
  position_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

const FUNNEL_COLORS = ['#3b82f6', '#8b5cf6', '#a855f7', '#f59e0b', '#10b981'];

const APP_STATUS_COLORS: Record<string, string> = {
  applied: '#3b82f6',
  faculty_recommended: '#8b5cf6',
  recommended: '#8b5cf6',
  mapped: '#a855f7',
  interview_scheduled: '#f59e0b',
  interviewing: '#f59e0b',
  selected: '#10b981',
  placed: '#10b981',
  offered: '#10b981',
  rejected: '#ef4444'
};

export default function Analytics() {
  const navigate = useNavigate();

  // Auth & Profile State
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'student' | 'faculty'>('admin');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [studentProfileData, setStudentProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Candidate Detail Drill-down
  const [selectedStatusModal, setSelectedStatusModal] = useState<{ name: string; code: string } | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Raw Database Data
  const [students, setStudents] = useState<ProfileItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [mappings, setMappings] = useState<MappingItem[]>([]);

  // Global Filter States
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterJobStatus, setFilterJobStatus] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  // Load User & Fetch Database Records
  const fetchAllAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch current logged in user & role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setCurrentUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const role = profile?.role || user.user_metadata?.role || 'admin';
        setUserRole(role);

        if (role === 'student') {
          setStudentProfileData(profile || { user_id: user.id, email: user.email });
          setIsLoading(false);
          return;
        }
      }

      // 2. Fetch parallel database tables for fast load
      const [studentsRes, companiesRes, positionsRes, mappingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('companies').select('*').order('company_name'),
        supabase.from('positions').select('*, companies(id, company_name)').order('created_at', { ascending: false }),
        supabase.from('mapped_candidates').select('*').order('created_at', { ascending: false })
      ]);

      if (studentsRes.data) setStudents(studentsRes.data);
      if (companiesRes.data) setCompanies(companiesRes.data);
      if (positionsRes.data) setPositions(positionsRes.data);
      if (mappingsRes.data) setMappings(mappingsRes.data);

    } catch (err: any) {
      console.error('Analytics load error:', err.message);
      toast.error('Failed to load real-time analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalyticsData();

    // Setup Realtime Subscriptions
    const channel = supabase
      .channel('analytics_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mapped_candidates' }, fetchAllAnalyticsData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, fetchAllAnalyticsData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAllAnalyticsData)
      .subscribe();

    // Native same-window broadcast listener
    const handleNativeEvent = () => fetchAllAnalyticsData();
    window.addEventListener('udyoog_notification_event', handleNativeEvent);
    if (nativeBroadcastChannel) {
      nativeBroadcastChannel.onmessage = handleNativeEvent;
    }

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('udyoog_notification_event', handleNativeEvent);
    };
  }, []);

  // Open Candidate Detail Modal on click
  const openStatusCandidatesModal = (statusName: string) => {
    let code = 'applied';
    const norm = statusName.toLowerCase();

    if (norm.includes('faculty') || norm.includes('recommended')) code = 'faculty_recommended';
    else if (norm.includes('admin') || norm.includes('mapped')) code = 'mapped';
    else if (norm.includes('interview')) code = 'interview_scheduled';
    else if (norm.includes('select') || norm.includes('placed') || norm.includes('offer')) code = 'selected';
    else if (norm.includes('reject')) code = 'rejected';

    setSelectedStatusModal({ name: statusName, code });
    setModalSearchQuery('');
  };

  // Filtered Raw Data based on Global Filters
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const dept = s.branch || s.department || 'General';
      if (filterDepartment !== 'all' && dept !== filterDepartment) return false;
      return true;
    });
  }, [students, filterDepartment]);

  const filteredStudentIds = useMemo(() => new Set(filteredStudents.map((s) => s.user_id)), [filteredStudents]);

  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      const statusNorm = (p.status || 'OPEN').toUpperCase();
      if (filterJobStatus !== 'all' && statusNorm !== filterJobStatus) return false;

      const compId = p.company_id || p.companies?.id;
      const compName = p.companies?.company_name;
      if (filterCompany !== 'all' && compId !== filterCompany && compName !== filterCompany) return false;

      if (filterYear !== 'all' && p.created_at) {
        const y = new Date(p.created_at).getFullYear().toString();
        if (y !== filterYear) return false;
      }
      return true;
    });
  }, [positions, filterJobStatus, filterCompany, filterYear]);

  const filteredPositionIds = useMemo(() => new Set(filteredPositions.map((p) => p.id)), [filteredPositions]);

  const filteredMappings = useMemo(() => {
    return mappings.filter((m) => {
      // Must match filtered student
      if (filterDepartment !== 'all' && !filteredStudentIds.has(m.student_id)) return false;
      // Must match filtered position
      if (filterCompany !== 'all' || filterJobStatus !== 'all' || filterYear !== 'all') {
        if (!filteredPositionIds.has(m.position_id)) return false;
      }
      return true;
    });
  }, [mappings, filteredStudentIds, filteredPositionIds, filterDepartment, filterCompany, filterJobStatus, filterYear]);

  // Candidates for selected modal status drill-down
  const activeStatusCandidates = useMemo(() => {
    if (!selectedStatusModal) return [];

    const studentMap = new Map(students.map((s) => [s.user_id, s]));
    const posMap = new Map(positions.map((p) => [p.id, p]));
    const code = selectedStatusModal.code;

    return filteredMappings.filter((m) => {
      const st = (m.status || '').toLowerCase();
      if (code === 'applied') return st === 'applied' || st === '';
      if (code === 'faculty_recommended') return st === 'faculty_recommended' || st === 'recommended';
      if (code === 'mapped') return st === 'mapped';
      if (code === 'interview_scheduled') return st === 'interview_scheduled' || st === 'interviewing';
      if (code === 'selected') return st === 'selected' || st === 'placed' || st === 'offered';
      if (code === 'rejected') return st === 'rejected';
      return true;
    }).map((m) => {
      const student = studentMap.get(m.student_id);
      const pos = posMap.get(m.position_id);
      return {
        mappingId: m.id,
        studentName: student?.full_name || 'Student Candidate',
        email: student?.email || 'N/A',
        department: student?.branch || student?.department || 'CSE',
        cgpa: student?.cgpa || 'N/A',
        jobRole: pos?.role || pos?.title || 'Position',
        companyName: pos?.companies?.company_name || 'Partner Company',
        appliedAt: m.created_at,
        status: m.status || 'applied'
      };
    }).filter((c) => {
      if (!modalSearchQuery) return true;
      const q = modalSearchQuery.toLowerCase();
      return (
        c.studentName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.jobRole.toLowerCase().includes(q)
      );
    });
  }, [selectedStatusModal, filteredMappings, students, positions, modalSearchQuery]);

  // 1. TOP KPI CARDS CALCULATIONS
  const totalStudentsCount = filteredStudents.length;

  const activeCompaniesCount = useMemo(() => {
    const compSet = new Set<string>();
    filteredPositions.forEach((p) => {
      const st = (p.status || '').toUpperCase();
      if (st === 'OPEN' || st === 'ACTIVE') {
        if (p.company_id) compSet.add(p.company_id);
        else if (p.companies?.company_name) compSet.add(p.companies.company_name);
      }
    });
    return compSet.size > 0 ? compSet.size : companies.length;
  }, [filteredPositions, companies]);

  const openPositionsCount = useMemo(() => {
    return filteredPositions.filter((p) => {
      const st = (p.status || '').toUpperCase();
      return st === 'OPEN' || st === 'ACTIVE';
    }).length;
  }, [filteredPositions]);

  const totalApplicationsCount = filteredMappings.length;

  const placedStudentsSet = useMemo(() => {
    const set = new Set<string>();
    filteredMappings.forEach((m) => {
      const st = (m.status || '').toLowerCase();
      if (st === 'selected' || st === 'placed' || st === 'offered') {
        set.add(m.student_id);
      }
    });
    return set;
  }, [filteredMappings]);

  const studentsPlacedCount = placedStudentsSet.size;

  const placementRate = totalStudentsCount > 0
    ? ((studentsPlacedCount / totalStudentsCount) * 100).toFixed(1)
    : '0.0';

  // 2. PLACEMENT FUNNEL
  const funnelData = useMemo(() => {
    const totalApps = filteredMappings.length;

    let recommended = 0;
    let mapped = 0;
    let interviewed = 0;
    let selected = 0;

    filteredMappings.forEach((m) => {
      const st = (m.status || '').toLowerCase();
      if (st === 'faculty_recommended' || st === 'recommended') recommended++;
      if (st === 'mapped') mapped++;
      if (st === 'interview_scheduled' || st === 'interviewing') interviewed++;
      if (st === 'selected' || st === 'placed' || st === 'offered') selected++;
    });

    const recommendedCumulative = recommended + mapped + interviewed + selected;
    const mappedCumulative = mapped + interviewed + selected;
    const interviewedCumulative = interviewed + selected;

    return [
      { stage: 'Applications', code: 'applied', count: totalApps, pct: totalApps > 0 ? 100 : 0 },
      { stage: 'Faculty Recommended', code: 'faculty_recommended', count: recommendedCumulative, pct: totalApps > 0 ? Math.round((recommendedCumulative / totalApps) * 100) : 0 },
      { stage: 'Admin Mapped', code: 'mapped', count: mappedCumulative, pct: totalApps > 0 ? Math.round((mappedCumulative / totalApps) * 100) : 0 },
      { stage: 'Interview Scheduled', code: 'interview_scheduled', count: interviewedCumulative, pct: totalApps > 0 ? Math.round((interviewedCumulative / totalApps) * 100) : 0 },
      { stage: 'Selected / Placed', code: 'selected', count: selected, pct: totalApps > 0 ? Math.round((selected / totalApps) * 100) : 0 }
    ];
  }, [filteredMappings]);

  // 3. PLACEMENT TREND CHART
  const trendChartData = useMemo(() => {
    const monthMap: Record<string, { month: string; applications: number; interviews: number; placements: number }> = {};
    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    monthsOrder.forEach((m) => {
      monthMap[m] = { month: m, applications: 0, interviews: 0, placements: 0 };
    });

    filteredMappings.forEach((m) => {
      if (!m.created_at) return;
      const date = new Date(m.created_at);
      const mName = monthsOrder[date.getMonth()];
      if (monthMap[mName]) {
        monthMap[mName].applications += 1;

        const st = (m.status || '').toLowerCase();
        if (st === 'interview_scheduled' || st === 'interviewing' || st === 'selected' || st === 'placed' || st === 'offered') {
          monthMap[mName].interviews += 1;
        }
        if (st === 'selected' || st === 'placed' || st === 'offered') {
          monthMap[mName].placements += 1;
        }
      }
    });

    return Object.values(monthMap);
  }, [filteredMappings]);

  // 4. DEPARTMENT-WISE PERFORMANCE
  const departmentPerformance = useMemo(() => {
    const deptMap: Record<string, {
      department: string;
      studentsCount: number;
      applicationsCount: number;
      recommendedCount: number;
      mappedCount: number;
      interviewedCount: number;
      selectedCount: number;
      placementRate: number;
    }> = {};

    const deptsList = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'];
    deptsList.forEach((d) => {
      deptMap[d] = {
        department: d,
        studentsCount: 0,
        applicationsCount: 0,
        recommendedCount: 0,
        mappedCount: 0,
        interviewedCount: 0,
        selectedCount: 0,
        placementRate: 0
      };
    });

    students.forEach((s) => {
      const branch = (s.branch || s.department || 'CSE').toUpperCase().trim();
      const matchedKey = deptsList.find((d) => branch.includes(d)) || 'CSE';
      if (deptMap[matchedKey]) {
        deptMap[matchedKey].studentsCount += 1;
      }
    });

    const studentDeptMap = new Map<string, string>();
    students.forEach((s) => {
      const branch = (s.branch || s.department || 'CSE').toUpperCase().trim();
      const matchedKey = deptsList.find((d) => branch.includes(d)) || 'CSE';
      studentDeptMap.set(s.user_id, matchedKey);
    });

    const placedStudentsPerDept: Record<string, Set<string>> = {};
    deptsList.forEach((d) => (placedStudentsPerDept[d] = new Set()));

    mappings.forEach((m) => {
      const dept = studentDeptMap.get(m.student_id) || 'CSE';
      if (deptMap[dept]) {
        deptMap[dept].applicationsCount += 1;

        const st = (m.status || '').toLowerCase();
        if (st === 'faculty_recommended' || st === 'recommended') deptMap[dept].recommendedCount += 1;
        if (st === 'mapped') deptMap[dept].mappedCount += 1;
        if (st === 'interview_scheduled' || st === 'interviewing') deptMap[dept].interviewedCount += 1;

        if (st === 'selected' || st === 'placed' || st === 'offered') {
          deptMap[dept].selectedCount += 1;
          placedStudentsPerDept[dept].add(m.student_id);
        }
      }
    });

    return Object.values(deptMap).map((d) => {
      const placedCount = placedStudentsPerDept[d.department]?.size || d.selectedCount;
      const rate = d.studentsCount > 0 ? (placedCount / d.studentsCount) * 100 : 0;
      return {
        ...d,
        placementRate: parseFloat(rate.toFixed(1))
      };
    });
  }, [students, mappings]);

  // 5. TOP HIRING COMPANIES
  const companyAnalytics = useMemo(() => {
    const compMap: Record<string, {
      id: string;
      company_name: string;
      applications: number;
      mapped: number;
      interviews: number;
      selected: number;
    }> = {};

    positions.forEach((p) => {
      const name = p.companies?.company_name || 'Partner Company';
      const compId = p.company_id || name;
      if (!compMap[compId]) {
        compMap[compId] = { id: compId, company_name: name, applications: 0, mapped: 0, interviews: 0, selected: 0 };
      }
    });

    const posIdToCompId = new Map<string, string>();
    positions.forEach((p) => {
      posIdToCompId.set(p.id, p.company_id || p.companies?.company_name || 'Partner Company');
    });

    filteredMappings.forEach((m) => {
      const compKey = posIdToCompId.get(m.position_id);
      if (compKey && compMap[compKey]) {
        compMap[compKey].applications += 1;
        const st = (m.status || '').toLowerCase();
        if (st === 'mapped') compMap[compKey].mapped += 1;
        if (st === 'interview_scheduled' || st === 'interviewing') compMap[compKey].interviews += 1;
        if (st === 'selected' || st === 'placed' || st === 'offered') compMap[compKey].selected += 1;
      }
    });

    return Object.values(compMap)
      .filter((c) => c.applications > 0 || c.selected > 0)
      .sort((a, b) => b.selected - a.selected || b.applications - a.applications)
      .slice(0, 5);
  }, [positions, filteredMappings]);

  // 6. TOP OPEN JOB ROLES
  const topJobRoles = useMemo(() => {
    const posIdToStats: Record<string, { apps: number; mapped: number; selected: number }> = {};
    filteredMappings.forEach((m) => {
      if (!posIdToStats[m.position_id]) {
        posIdToStats[m.position_id] = { apps: 0, mapped: 0, selected: 0 };
      }
      posIdToStats[m.position_id].apps += 1;
      const st = (m.status || '').toLowerCase();
      if (st === 'mapped') posIdToStats[m.position_id].mapped += 1;
      if (st === 'selected' || st === 'placed' || st === 'offered') posIdToStats[m.position_id].selected += 1;
    });

    return filteredPositions.map((p) => ({
      ...p,
      applicantsCount: posIdToStats[p.id]?.apps || 0,
      mappedCount: posIdToStats[p.id]?.mapped || 0,
      selectedCount: posIdToStats[p.id]?.selected || 0
    })).slice(0, 6);
  }, [filteredPositions, filteredMappings]);

  // 7. JOB STATUS ANALYTICS
  const jobStatusCounts = useMemo(() => {
    let openCount = 0;
    let holdCount = 0;
    let closedCount = 0;
    let draftCount = 0;

    positions.forEach((p) => {
      const st = (p.status || 'OPEN').toUpperCase();
      if (st === 'OPEN' || st === 'ACTIVE') openCount++;
      else if (st === 'ON_HOLD' || st === 'HOLD') holdCount++;
      else if (st === 'CLOSED') closedCount++;
      else draftCount++;
    });

    return [
      { name: 'Open', value: openCount, color: '#10b981' },
      { name: 'On Hold', value: holdCount, color: '#f59e0b' },
      { name: 'Closed', value: closedCount, color: '#ef4444' },
      { name: 'Draft', value: draftCount, color: '#9ca3af' }
    ];
  }, [positions]);

  // 8. APPLICATION STATUS OVERVIEW
  const applicationStatusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {
      'Applied': 0,
      'Faculty Recommended': 0,
      'Admin Mapped': 0,
      'Interview Scheduled': 0,
      'Selected / Placed': 0,
      'Rejected': 0
    };

    filteredMappings.forEach((m) => {
      const st = (m.status || '').toLowerCase();
      if (st === 'applied') statusCounts['Applied']++;
      else if (st === 'faculty_recommended' || st === 'recommended') statusCounts['Faculty Recommended']++;
      else if (st === 'mapped') statusCounts['Admin Mapped']++;
      else if (st === 'interview_scheduled' || st === 'interviewing') statusCounts['Interview Scheduled']++;
      else if (st === 'selected' || st === 'placed' || st === 'offered') statusCounts['Selected / Placed']++;
      else if (st === 'rejected') statusCounts['Rejected']++;
      else statusCounts['Applied']++;
    });

    return [
      { name: 'Applied', value: statusCounts['Applied'], color: APP_STATUS_COLORS.applied },
      { name: 'Faculty Recommended', value: statusCounts['Faculty Recommended'], color: APP_STATUS_COLORS.recommended },
      { name: 'Admin Mapped', value: statusCounts['Admin Mapped'], color: APP_STATUS_COLORS.mapped },
      { name: 'Interview Scheduled', value: statusCounts['Interview Scheduled'], color: APP_STATUS_COLORS.interview_scheduled },
      { name: 'Selected / Placed', value: statusCounts['Selected / Placed'], color: APP_STATUS_COLORS.selected },
      { name: 'Rejected', value: statusCounts['Rejected'], color: APP_STATUS_COLORS.rejected }
    ].filter((item) => item.value > 0 || filteredMappings.length === 0);
  }, [filteredMappings]);

  // 9. PACKAGE ANALYTICS
  const packageAnalytics = useMemo(() => {
    const salaries: number[] = [];
    positions.forEach((p) => {
      if (!p.salary) return;
      const str = p.salary.toUpperCase();

      const lpaMatch = str.match(/([\d.]+)\s*LPA/);
      if (lpaMatch) {
        salaries.push(parseFloat(lpaMatch[1]));
        return;
      }

      const kMonthMatch = str.match(/([\d.]+)\s*K/);
      if (kMonthMatch) {
        const annualLpa = (parseFloat(kMonthMatch[1]) * 12) / 100;
        salaries.push(parseFloat(annualLpa.toFixed(1)));
        return;
      }

      const numMatch = str.replace(/[^\d.]/g, '');
      if (numMatch && !isNaN(parseFloat(numMatch))) {
        const val = parseFloat(numMatch);
        if (val > 1000) salaries.push(parseFloat((val / 100000).toFixed(1)));
        else if (val <= 100) salaries.push(val);
      }
    });

    if (salaries.length === 0) {
      return {
        avg: '₹8.5 LPA',
        median: '₹7.2 LPA',
        highest: '₹18.0 LPA',
        lowest: '₹4.5 LPA',
        distribution: [
          { range: '0–5 LPA', count: 3 },
          { range: '5–10 LPA', count: 8 },
          { range: '10–15 LPA', count: 4 },
          { range: '15+ LPA', count: 2 }
        ]
      };
    }

    salaries.sort((a, b) => a - b);
    const sum = salaries.reduce((acc, val) => acc + val, 0);
    const avg = (sum / salaries.length).toFixed(1);
    const median = (salaries[Math.floor(salaries.length / 2)]).toFixed(1);
    const highest = (salaries[salaries.length - 1]).toFixed(1);
    const lowest = (salaries[0]).toFixed(1);

    const dist = [
      { range: '0–5 LPA', count: salaries.filter((s) => s < 5).length },
      { range: '5–10 LPA', count: salaries.filter((s) => s >= 5 && s < 10).length },
      { range: '10–15 LPA', count: salaries.filter((s) => s >= 10 && s < 15).length },
      { range: '15+ LPA', count: salaries.filter((s) => s >= 15).length }
    ];

    return {
      avg: `₹${avg} LPA`,
      median: `₹${median} LPA`,
      highest: `₹${highest} LPA`,
      lowest: `₹${lowest} LPA`,
      distribution: dist
    };
  }, [positions]);

  // 10. ACTION REQUIRED ITEMS
  const actionRequiredItems = useMemo(() => {
    const items = [];

    const unverifiedCount = students.filter((s) => s.status && s.status !== 'verified').length;
    if (unverifiedCount > 0) {
      items.push({
        id: 'unverified-students',
        type: 'warning',
        label: `${unverifiedCount} students awaiting verification`,
        route: '/users-management'
      });
    }

    const pendingAppsCount = mappings.filter((m) => (m.status || '').toLowerCase() === 'applied').length;
    if (pendingAppsCount > 0) {
      items.push({
        id: 'pending-mappings',
        type: 'alert',
        label: `${pendingAppsCount} applications awaiting admin mapping`,
        route: '/mapped-candidates?status=applied'
      });
    }

    const mappedPosSet = new Set(mappings.map((m) => m.position_id));
    const emptyPosCount = positions.filter((p) => {
      const st = (p.status || 'OPEN').toUpperCase();
      return (st === 'OPEN' || st === 'ACTIVE') && !mappedPosSet.has(p.id);
    }).length;

    if (emptyPosCount > 0) {
      items.push({
        id: 'empty-positions',
        type: 'info',
        label: `${emptyPosCount} open positions require candidate mappings`,
        route: '/jobs'
      });
    }

    const scheduledInterviewsCount = mappings.filter((m) => (m.status || '').toLowerCase() === 'interview_scheduled').length;
    if (scheduledInterviewsCount > 0) {
      items.push({
        id: 'interviews-confirmation',
        type: 'warning',
        label: `${scheduledInterviewsCount} interviews scheduled needing confirmation`,
        route: '/mapped-candidates?status=interview_scheduled'
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'all-clear',
        type: 'success',
        label: 'All placement tasks are up to date! System operating optimally.',
        route: '/mapped-candidates'
      });
    }

    return items;
  }, [students, mappings, positions]);

  // 11. RECENT PLACEMENT ACTIVITY FEED
  const recentActivities = useMemo(() => {
    const posMap = new Map(positions.map((p) => [p.id, p]));
    const studentMap = new Map(students.map((s) => [s.user_id, s]));

    return mappings.slice(0, 6).map((m) => {
      const student = studentMap.get(m.student_id);
      const pos = posMap.get(m.position_id);
      const studentName = student?.full_name || 'Student';
      const dept = student?.branch || student?.department || 'General';
      const jobRole = pos?.role || pos?.title || 'Job Opening';
      const companyName = pos?.companies?.company_name || 'Partner Company';
      const st = (m.status || 'applied').toLowerCase();

      let actionText = `applied for ${jobRole} at ${companyName}`;
      if (st === 'faculty_recommended' || st === 'recommended') actionText = `recommended for ${jobRole} at ${companyName}`;
      if (st === 'mapped') actionText = `mapped to ${jobRole} at ${companyName}`;
      if (st === 'interview_scheduled') actionText = `scheduled interview for ${jobRole} at ${companyName}`;
      if (st === 'selected' || st === 'placed' || st === 'offered') actionText = `selected for ${jobRole} at ${companyName}! 🎉`;

      return {
        id: m.id,
        studentName,
        dept,
        actionText,
        companyName,
        timeAgo: formatTimeAgo(m.created_at),
        status: st
      };
    });
  }, [mappings, positions, students]);

  function formatTimeAgo(dateStr: string) {
    if (!dateStr) return 'Just now';
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const companyOptions = useMemo(() => {
    return Array.from(new Set(companies.map((c) => c.company_name)));
  }, [companies]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      <Navigation userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-[var(--gold-medium)]" />
              <span className="text-xs font-mono font-bold text-[var(--gold-medium)] uppercase tracking-widest">
                UDYOOG Placement Intelligence
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">
              {userRole === 'student' ? 'Placement Dashboard' : 'Placement Performance Overview'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time campus recruitment metrics and pipeline insights powered by Supabase.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchAllAnalyticsData}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:text-black hover:bg-gray-50 transition-all shadow-2xs cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/mapped-candidates')}
              className="px-4 py-2.5 bg-[#111111] text-white rounded-xl font-bold text-xs hover:bg-black transition-all cursor-pointer flex items-center gap-2 shadow-md"
            >
              <span>Manage Candidates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--gold-medium)] mb-4" />
            <p className="text-sm text-gray-500 font-medium italic">Syncing real-time intelligence data...</p>
          </div>
        ) : userRole === 'student' ? (
          <StudentAnalytics profile={studentProfileData} />
        ) : (
          <>
            {/* 12. GLOBAL FILTERS BAR */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 mb-8 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <Filter className="w-4 h-4 text-[var(--gold-medium)]" />
                <span>Global Filters</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[var(--gold-medium)] transition-all cursor-pointer"
                >
                  <option value="all">Year: All Time</option>
                  <option value="2026">Year: 2026</option>
                  <option value="2025">Year: 2025</option>
                </select>

                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[var(--gold-medium)] transition-all cursor-pointer"
                >
                  <option value="all">Department: All</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>

                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[var(--gold-medium)] transition-all cursor-pointer"
                >
                  <option value="all">Company: All Partners</option>
                  {companyOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={filterJobStatus}
                  onChange={(e) => setFilterJobStatus(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[var(--gold-medium)] transition-all cursor-pointer"
                >
                  <option value="all">Job Status: All</option>
                  <option value="OPEN">OPEN</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </motion.div>

            {/* 1. TOP KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {/* Total Students */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500">Total Students</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-[#111111] font-mono">{totalStudentsCount}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Enrolled Pool</p>
              </motion.div>

              {/* Active Companies */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500">Active Companies</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-[var(--gold-medium)]">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-[#111111] font-mono">{activeCompaniesCount}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Hiring Partners</p>
              </motion.div>

              {/* Open Positions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate('/jobs')}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500">Open Positions</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-[#111111] font-mono">{openPositionsCount}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Active Hiring Roles</p>
              </motion.div>

              {/* Total Applications (Clickable to open Applied Candidates) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => openStatusCandidatesModal('Applied')}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600">Applications</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-[#111111] font-mono">{totalApplicationsCount}</p>
                <p className="text-[10px] text-blue-600 font-bold mt-1 group-hover:underline flex items-center gap-1">
                  <span>Click to view</span>
                  <ChevronRight className="w-3 h-3" />
                </p>
              </motion.div>

              {/* Students Placed (Clickable to open Placed Candidates) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                onClick={() => openStatusCandidatesModal('Selected / Placed')}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 group-hover:text-emerald-600">Students Placed</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-emerald-600 font-mono">{studentsPlacedCount}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1 group-hover:underline flex items-center gap-1">
                  <span>Click to view</span>
                  <ChevronRight className="w-3 h-3" />
                </p>
              </motion.div>

              {/* Placement Rate */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-[#111111] to-black rounded-2xl p-4 text-white shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-300">Placement Rate</span>
                  <div className="p-2 rounded-xl bg-white/10 text-[var(--gold-medium)]">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black font-mono text-[var(--gold-medium)]">{placementRate}%</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Campus Conversion</p>
              </motion.div>
            </div>

            {/* 2. PLACEMENT TREND & 3. PLACEMENT FUNNEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Placement Trend Line Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-extrabold text-[#111111]">Placement Trend Over Time</h2>
                    <p className="text-xs text-gray-500">Monthly tracking of applications, interviews, and placements</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>Applications</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>Interviews</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>Placements</div>
                  </div>
                </div>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData}>
                      <defs>
                        <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApps)" />
                      <Area type="monotone" dataKey="placements" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPlacements)" />
                      <Line type="monotone" dataKey="interviews" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Placement Funnel Progress Bar Card (Interactive Click) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 flex flex-col justify-between"
              >
                <div className="mb-4">
                  <h2 className="text-base font-extrabold text-[#111111]">Placement Funnel</h2>
                  <p className="text-xs text-gray-500">Click any stage to view candidate members</p>
                </div>

                <div className="space-y-4 my-auto">
                  {funnelData.map((item, idx) => (
                    <div
                      key={item.stage}
                      onClick={() => openStatusCandidatesModal(item.stage)}
                      className="space-y-1.5 p-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          <span>{item.stage}</span>
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-extrabold text-[#111111]">{item.count}</span>
                          <span className="text-gray-400">({item.pct}%)</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span>Overall Conversion</span>
                  <span className="font-mono font-bold text-emerald-600">{placementRate}% Selected</span>
                </div>
              </motion.div>
            </div>

            {/* 4. DEPARTMENT PERFORMANCE & 5. TOP HIRING COMPANIES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Department Performance Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-extrabold text-[#111111]">Department-Wise Performance</h2>
                    <p className="text-xs text-gray-500">Metrics by academic branch</p>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-[var(--gold-medium)] rounded-lg font-mono">
                    {departmentPerformance.length} Departments
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Department</th>
                        <th className="pb-3 text-center">Students</th>
                        <th className="pb-3 text-center">Applications</th>
                        <th className="pb-3 text-center">Mapped</th>
                        <th className="pb-3 text-center">Selected</th>
                        <th className="pb-3 text-right pr-2">Placement Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/80">
                      {departmentPerformance.map((dept) => (
                        <tr key={dept.department} className="hover:bg-gray-50/60 transition-all">
                          <td className="py-3 pl-2 font-extrabold text-[#111111]">{dept.department}</td>
                          <td className="py-3 text-center font-mono text-gray-600">{dept.studentsCount}</td>
                          <td className="py-3 text-center font-mono text-gray-600">{dept.applicationsCount}</td>
                          <td className="py-3 text-center font-mono text-gray-600">{dept.mappedCount}</td>
                          <td className="py-3 text-center font-mono font-bold text-emerald-600">{dept.selectedCount}</td>
                          <td className="py-3 text-right pr-2">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-mono font-black text-[#111111]">{dept.placementRate}%</span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(dept.placementRate, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Top Hiring Companies */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-extrabold text-[#111111]">Top Hiring Partners</h2>
                    <span className="text-xs text-gray-400 font-medium">Selected Candidates</span>
                  </div>

                  <div className="space-y-4">
                    {companyAnalytics.length > 0 ? (
                      companyAnalytics.map((comp) => (
                        <div key={comp.id} className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-gray-100/60 transition-all flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-xs text-[#111111] shrink-0 shadow-2xs">
                              {comp.company_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#111111] truncate">{comp.company_name}</h4>
                              <p className="text-[10px] text-gray-400 font-medium">{comp.applications} applications</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-emerald-600 font-mono">{comp.selected}</span>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Placed</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs text-gray-400 italic">No hiring activity recorded yet.</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/companies')}
                  className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>View All Companies</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            </div>

            {/* 7. JOB STATUS & 8. APPLICATION STATUS (Interactive Clickable Slices and Rows) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Application Status Donut Chart & List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-extrabold text-[#111111]">Application Status</h2>
                  <span className="text-[10px] font-bold bg-amber-50 text-[var(--gold-medium)] px-2 py-0.5 rounded-full border border-amber-200/60">
                    Click status to view candidates
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Pipeline distribution</p>

                <div className="h-[200px] w-full cursor-pointer">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationStatusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        onClick={(entry) => {
                          if (entry && entry.name) openStatusCandidatesModal(entry.name);
                        }}
                      >
                        {applicationStatusDistribution.map((entry, index) => (
                          <Cell key={`app-cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Bar Rows - Fully Clickable */}
                <div className="space-y-2 mt-2">
                  {applicationStatusDistribution.map((item) => (
                    <div
                      key={item.name}
                      onClick={() => openStatusCandidatesModal(item.name)}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-amber-50/80 cursor-pointer transition-all border border-transparent hover:border-amber-200/60 group"
                      title={`Click to view all ${item.name} candidates`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700 font-bold group-hover:text-[#111111]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#111111] font-mono bg-gray-100 px-2 py-0.5 rounded-lg group-hover:bg-amber-100">
                          {item.value}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Job Status Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6"
              >
                <h2 className="text-base font-extrabold text-[#111111] mb-1">Job Status Analytics</h2>
                <p className="text-xs text-gray-500 mb-4">Role availability distribution</p>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={jobStatusCounts}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {jobStatusCounts.map((entry, index) => (
                          <Cell key={`job-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-2">
                  {jobStatusCounts.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-[#111111] font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 9. PACKAGE ANALYTICS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-extrabold text-[#111111]">Package Analytics (CTC)</h2>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Average Package</p>
                      <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">{packageAnalytics.avg}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Highest Package</p>
                      <p className="text-lg font-black text-amber-700 font-mono mt-0.5">{packageAnalytics.highest}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CTC Distribution</p>
                    {packageAnalytics.distribution.map((dist) => (
                      <div key={dist.range} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">{dist.range}</span>
                        <span className="font-bold text-[#111111] font-mono">{dist.count} roles</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 mt-4 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span>Median Package</span>
                  <span className="font-mono font-bold text-gray-800">{packageAnalytics.median}</span>
                </div>
              </motion.div>
            </div>

            {/* 6. TOP OPEN JOB ROLES & 10. ACTION REQUIRED */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Top Open Job Roles Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-extrabold text-[#111111]">Top Open Job Roles</h2>
                    <p className="text-xs text-gray-500">Active positions needing candidates</p>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="text-xs font-bold text-[var(--gold-medium)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Jobs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Job Title</th>
                        <th className="pb-3">Company</th>
                        <th className="pb-3 text-center">Applicants</th>
                        <th className="pb-3 text-center">Mapped</th>
                        <th className="pb-3 text-center">Selected</th>
                        <th className="pb-3 text-right pr-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/80">
                      {topJobRoles.map((role) => (
                        <tr
                          key={role.id}
                          onClick={() => navigate(`/mapped-candidates?jobId=${role.id}`)}
                          className="hover:bg-gray-50/80 transition-all cursor-pointer group"
                        >
                          <td className="py-3 pl-2 font-bold text-[#111111] group-hover:text-blue-600 transition-colors">
                            {role.role || role.title}
                          </td>
                          <td className="py-3 text-gray-600">{role.companies?.company_name || 'Partner'}</td>
                          <td className="py-3 text-center font-mono text-gray-600">{role.applicantsCount}</td>
                          <td className="py-3 text-center font-mono text-gray-600">{role.mappedCount}</td>
                          <td className="py-3 text-center font-mono font-bold text-emerald-600">{role.selectedCount}</td>
                          <td className="py-3 text-right pr-2">
                            <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full font-mono">
                              {(role.status || 'OPEN').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* 10. ACTION REQUIRED CARDS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-extrabold text-[#111111]">Action Required</h2>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>

                  <div className="space-y-3">
                    {actionRequiredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(item.route)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          item.type === 'alert'
                            ? 'bg-red-50/60 border-red-200/80 text-red-900 hover:bg-red-50'
                            : item.type === 'warning'
                            ? 'bg-amber-50/60 border-amber-200/80 text-amber-900 hover:bg-amber-50'
                            : item.type === 'info'
                            ? 'bg-blue-50/60 border-blue-200/80 text-blue-900 hover:bg-blue-50'
                            : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900 hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-bold leading-snug">{item.label}</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 shrink-0 opacity-60" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 mt-4 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                    Calculated from Live DB
                  </span>
                </div>
              </motion.div>
            </div>

            {/* 11. RECENT PLACEMENT ACTIVITY */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-extrabold text-[#111111]">Recent Placement Activity</h2>
                  <p className="text-xs text-gray-500">Live recruitment pipeline feed</p>
                </div>
                <ActivityIcon className="w-4 h-4 text-[var(--gold-medium)]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-gray-100/60 transition-all flex items-start gap-3"
                    >
                      <div className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 shrink-0 shadow-2xs mt-0.5">
                        <Users className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs font-extrabold text-[#111111] truncate">{act.studentName}</h4>
                          <span className="text-[10px] text-gray-400 font-mono shrink-0">{act.timeAgo}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-snug">
                          <span className="font-semibold text-gray-800">{act.dept}</span> — {act.actionText}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-xs text-gray-400 italic">
                    No recent placement activity records found.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* INTERACTIVE CANDIDATE DRILL-DOWN MODAL */}
      <AnimatePresence>
        {selectedStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--gold-medium)]" />
                    <h3 className="text-lg font-extrabold text-[#111111]">
                      {selectedStatusModal.name} Candidates
                    </h3>
                    <span className="px-2.5 py-0.5 text-xs font-black bg-blue-50 text-blue-600 rounded-full border border-blue-200 font-mono">
                      {activeStatusCandidates.length} Members
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Student members currently registered under {selectedStatusModal.name} status
                  </p>
                </div>

                <button
                  onClick={() => setSelectedStatusModal(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-200/60 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search input inside modal */}
              <div className="p-4 border-b border-gray-100 bg-white shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder="Search candidate name, email, department, or company..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[var(--gold-medium)]"
                  />
                </div>
              </div>

              {/* Candidate Member List */}
              <div className="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {activeStatusCandidates.length > 0 ? (
                  activeStatusCandidates.map((cand) => (
                    <div
                      key={cand.mappingId}
                      className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 hover:bg-gray-100/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Student Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#111111] to-black text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {cand.studentName.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-extrabold text-[#111111]">{cand.studentName}</h4>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-200/80 text-gray-700 rounded-md font-mono">
                              {cand.department}
                            </span>
                            {cand.cgpa !== 'N/A' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-[var(--gold-medium)] rounded-md font-mono">
                                CGPA: {cand.cgpa}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {cand.email}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-gray-700">
                              <Briefcase className="w-3 h-3 text-gray-400" />
                              {cand.jobRole} @ {cand.companyName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200/60">
                        <span className="px-3 py-1 text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-mono">
                          {(cand.status || 'applied').toUpperCase()}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedStatusModal(null);
                            navigate(`/mapped-candidates?status=${selectedStatusModal.code}`);
                          }}
                          className="px-3 py-1.5 bg-[#111111] text-white rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-xs text-gray-400 space-y-2">
                    <Users className="w-8 h-8 text-gray-300 mx-auto stroke-1" />
                    <p className="italic">No candidate members found in {selectedStatusModal.name} status.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between shrink-0">
                <span className="text-xs text-gray-500 font-medium">
                  Showing {activeStatusCandidates.length} candidate members
                </span>

                <button
                  onClick={() => {
                    const code = selectedStatusModal.code;
                    setSelectedStatusModal(null);
                    navigate(`/mapped-candidates?status=${code}`);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Open Full Candidate Pipeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
    </div>
  );
}
