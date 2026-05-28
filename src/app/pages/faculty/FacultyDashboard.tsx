import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Search, Users, BarChart3, TrendingUp, UserCheck, UserX, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import { toast } from 'sonner';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'skilled' | 'incomplete'>('all');
  const [stats, setStats] = useState({
    totalStudents: 0,
    skilledStudents: 0,
    unskilledStudents: 0
  });
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initFaculty = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || '');
      
      const { data: students, count: total } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'student')
        .order('full_name', { ascending: true });
      
      if (students) {
        setAllStudents(students);
        const skilled = students.filter(s => s.skills && s.skills.length > 0).length;
        setStats({
          totalStudents: total || 0,
          skilledStudents: skilled,
          unskilledStudents: (total || 0) - skilled
        });
      }
      setIsLoading(false);
    };
    initFaculty();
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      // Find the student by sif no, reg no, or name
      const student = allStudents.find(s => 
        s.full_name?.toLowerCase() === searchQuery.trim().toLowerCase() || 
        (s.sif_no || s.registration_no)?.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (student) {
        navigate(`/faculty/student/${student.user_id}`);
      } else {
        toast?.error?.('Student not found') || alert('Student not found');
      }
    }
  };

  const filteredStudents = allStudents.filter(s => {
    // First apply search filter
    const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.sif_no || s.registration_no)?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Then apply category filter
    if (filterMode === 'skilled') return s.skills && s.skills.length > 0;
    if (filterMode === 'incomplete') return !s.skills || s.skills.length === 0;
    return true;
  });

  const filterLabel = filterMode === 'all' ? 'All Students' : filterMode === 'skilled' ? 'Skills Verified' : 'Portfolio Incomplete';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={userEmail} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#142361]">Faculty Control Center</h1>
            <p className="text-gray-500">Managing student pathways</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            icon={Users} 
            label="Enrolled Students" 
            value={stats.totalStudents} 
            color="blue" 
            isActive={filterMode === 'all'}
            onClick={() => setFilterMode('all')}
          />
          <StatCard 
            icon={UserCheck} 
            label="Skills Verified" 
            value={stats.skilledStudents} 
            color="green"
            isActive={filterMode === 'skilled'}
            onClick={() => setFilterMode('skilled')}
          />
          <StatCard 
            icon={UserX} 
            label="Portfolio Incomplete" 
            value={stats.unskilledStudents} 
            color="orange"
            isActive={filterMode === 'incomplete'}
            onClick={() => setFilterMode('incomplete')}
          />
        </div>

        {/* Expanded Student Registry and Lookup Container */}
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-[#142361] mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#e0653b]" />
              Student Lookup
            </h2>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search by Name or SIF No..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#e0653b] focus:border-transparent outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#142361] text-white rounded-xl hover:bg-[#1d3080] transition-colors"
              >
                Search
              </button>
            </form>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#142361] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#e0653b]" />
                Student Directory
                {filterMode !== 'all' && (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ml-2 ${
                    filterMode === 'skilled' 
                      ? 'bg-green-50 text-green-600 border-green-200' 
                      : 'bg-orange-50 text-orange-600 border-orange-200'
                  }`}>
                    {filterLabel}
                    <button 
                      onClick={() => setFilterMode('all')} 
                      className="ml-1.5 hover:opacity-70 transition-opacity inline"
                      title="Clear filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </h2>
              <span className="text-xs font-bold text-gray-400 uppercase font-mono">{filteredStudents.length} Students</span>
            </div>
            
            <div className="overflow-hidden">
              {isLoading ? (
                <div className="py-20 text-center text-gray-400">Loading directory...</div>
              ) : filteredStudents.length > 0 ? (
                <div className="grid gap-4">
                  {filteredStudents.map((student) => (
                    <motion.div 
                      key={student.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 rounded-2xl transition-all group cursor-pointer"
                      onClick={() => navigate(`/faculty/student/${student.user_id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#142361] font-bold border border-gray-100 shadow-sm">
                          {student.full_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#142361] group-hover:text-[#e0653b] transition-colors">{student.full_name}</div>
                          <div className="text-xs text-gray-500 font-mono">
                            SIF: {student.sif_no || student.registration_no} • {student.home_location || 'Not Specified'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                           <div className="text-sm font-bold text-[#142361]">{student.cgpa || '0.0'} CGPA</div>
                           <div className="hidden sm:flex gap-1 mt-1">
                            {student.skills?.slice(0, 3).map((skill: any) => (
                              <span key={typeof skill === 'string' ? skill : skill.name} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
                                {typeof skill === 'string' ? skill : skill.name}
                              </span>
                            ))}
                            {(!student.skills || student.skills.length === 0) && (
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-500 text-[10px] font-bold rounded uppercase">
                                No Skills
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#e0653b] transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400">No students found.</div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, isActive, onClick }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div 
      className={`bg-white p-8 rounded-3xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'border-[#e0653b] ring-2 ring-[#e0653b]/10' : 'border-gray-100 hover:border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-4 shadow-inner`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="text-3xl font-black text-[#142361]">{value}</div>
      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
