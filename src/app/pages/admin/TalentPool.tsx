import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Search, User, Target, ChevronRight, Filter, Star, Zap, GraduationCap, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import { toast, Toaster } from 'sonner';

export default function TalentPool() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || '');
      
      // Fetch students — use same query pattern as working Faculty dashboard
      const [studentRes, jobRes] = await Promise.all([
        supabase.from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('full_name'),
        supabase.from('positions').select('*, companies(company_name)').eq('status', 'open')
      ]);

      if (studentRes.error) {
        console.error('Talent pool fetch error:', studentRes.error);
        toast.error(`Failed to load talent: ${studentRes.error.message}`);
      }

      setStudents(studentRes.data || []);
      setActiveJobs(jobRes.data || []);
      setIsLoading(false);
    };
    init();
  }, []);

  const calculateMatch = (student: any, job: any) => {
    if (!student.skills || !job.role) return 0;
    const studentSkills = student.skills.map((s: any) => (typeof s === 'string' ? s : s.name).toLowerCase());
    const jobKeywords = [job.role, job.description].join(' ').toLowerCase();
    
    let matches = 0;
    studentSkills.forEach((skill: string) => {
      if (jobKeywords.includes(skill)) matches++;
    });

    const score = Math.min((matches / 3) * 100, 100); // 3 skills = 100% match
    return Math.round(score);
  };

  const filteredStudents = students.filter(s => {
    const query = searchQuery.toLowerCase();
    const name = (s.full_name || '').toLowerCase();
    const regNo = (s.registration_no || '').toLowerCase();
    const branch = (s.branch || '').toLowerCase();
    return name.includes(query) || regNo.includes(query) || branch.includes(query);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={userEmail} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#142361]">Smart Talent Pool</h1>
          <p className="text-gray-500 font-medium">Matching students with active opportunities</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters & Search */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-[#142361] mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#e0653b]" />
                Search Talent
              </h3>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Name, Reg No, or Branch..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e0653b] outline-none text-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Openings</p>
                {activeJobs.slice(0, 5).map(job => (
                  <div key={job.id} className="p-3 rounded-lg bg-gray-50 text-xs border border-transparent hover:border-[#e0653b]/20 transition-all cursor-default">
                    <div className="font-bold text-[#142361] truncate">{job.role}</div>
                    <div className="text-gray-500 truncate">{job.companies?.company_name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-6">
            {isLoading ? (
              <div className="py-20 text-center text-gray-400">Syncing talent pool...</div>
            ) : filteredStudents.length > 0 ? (
              <div className="grid gap-4">
                {filteredStudents.map((student) => {
                  // Find best match among jobs
                  const matches = activeJobs.map(j => ({ ...j, score: calculateMatch(student, j) }))
                    .sort((a, b) => b.score - a.score);
                  const bestMatch = matches[0];

                  return (
                    <motion.div
                      layout
                      key={student.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                      onClick={() => navigate(`/faculty/student/${student.user_id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#142361] border border-gray-100 shadow-inner group-hover:bg-[#142361] group-hover:text-white transition-all">
                          {student.full_name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-[#142361] group-hover:text-[#e0653b] transition-colors">
                            {student.full_name}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                              <GraduationCap className="w-3 h-3" /> {student.branch || 'General'}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                              <MapPin className="w-3 h-3" /> {student.home_location || 'Not Set'}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#142361] uppercase tracking-tighter">
                              <Zap className="w-3 h-3 text-[#e0653b]" /> CGPA: {student.cgpa || '0.0'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        {bestMatch && bestMatch.score > 0 && (
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <div className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100 uppercase">
                                {bestMatch.score}% Smart Match
                              </div>
                            </div>
                            <div className="text-xs font-bold text-[#142361] truncate max-w-[150px]">
                              {bestMatch.role}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">
                              @{bestMatch.companies?.company_name}
                            </div>
                          </div>
                        )}
                        <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-[#e0653b] transition-all" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 font-medium">
                No matching talent found for your search.
              </div>
            )}
          </div>
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
