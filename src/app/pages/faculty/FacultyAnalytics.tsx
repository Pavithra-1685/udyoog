import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Users, ChevronRight, PieChart, Activity } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';

export default function FacultyAnalytics() {
  const [userEmail, setUserEmail] = useState('');
  const [skilledStudents, setSkilledStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAnalytics = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || '');

      const { data: students, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'student');
      
      if (students) {
        setTotalStudents(count || 0);
        setSkilledStudents(students.filter(s => s.skills && s.skills.length > 0));
      }
      setIsLoading(false);
    };
    initAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={userEmail} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#142361]">Student Performance Analytics</h1>
          <p className="text-gray-500">Real-time data on student skill acquisition.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <section className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-[#142361] mb-8 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#e0653b]" />
              Portfolio Readiness Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative w-64 h-64 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  <motion.circle 
                    cx="50" cy="50" r="40" fill="transparent" stroke="#e0653b" strokeWidth="12"
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * (skilledStudents.length / totalStudents || 0)) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                  <text x="50" y="50" textAnchor="middle" dy="0.3em" className="text-2xl font-black fill-[#142361]">
                    {Math.round((skilledStudents.length / totalStudents) * 100) || 0}%
                  </text>
                </svg>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-[#e0653b]"></div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#142361]">Skilled & Validated</div>
                    <div className="text-xs text-gray-400">At least one verified skill</div>
                  </div>
                  <div className="font-bold text-[#142361]">{skilledStudents.length}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#142361]">Draft Portfolios</div>
                    <div className="text-xs text-gray-400">Yet to record skills</div>
                  </div>
                  <div className="font-bold text-[#142361]">{totalStudents - skilledStudents.length}</div>
                </div>
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Healthy Progress</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#142361] p-8 rounded-3xl text-white shadow-xl shadow-[#142361]/20">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#e0653b]" />
              Key Metrics
            </h2>
            <div className="space-y-8">
              <div>
                <div className="text-xs opacity-60 uppercase tracking-widest mb-1">Total Reach</div>
                <div className="text-4xl font-black">{totalStudents}</div>
                <div className="text-xs opacity-60 mt-1">Students enrolled</div>
              </div>
              <div>
                <div className="text-xs opacity-60 uppercase tracking-widest mb-1">Avg Skill Count</div>
                <div className="text-4xl font-black">
                  {Math.round(skilledStudents.reduce((acc, s) => acc + (s.skills?.length || 0), 0) / skilledStudents.length) || 0}
                </div>
                <div className="text-xs opacity-60 mt-1">Skills per student</div>
              </div>
            </div>
          </section>
        </div>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-[#142361] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#e0653b]" />
              Skilled Student Directory
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full py-20 text-center text-gray-400">Loading directory...</div>
            ) : skilledStudents.length > 0 ? (
              skilledStudents.map((student) => (
                <div 
                  key={student.registration_no}
                  className="p-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-2xl transition-all flex items-center justify-between cursor-pointer group"
                  onClick={() => window.location.href = `/faculty/student/${student.registration_no}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-[#142361] shadow-sm">
                      {student.full_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[#142361] group-hover:text-[#e0653b] transition-colors">{student.full_name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{student.registration_no}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#e0653b] transition-all" />
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-gray-400">No skilled students found yet.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
