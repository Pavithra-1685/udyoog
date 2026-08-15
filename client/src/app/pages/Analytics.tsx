import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Briefcase, Activity as ActivityIcon, Building2, Loader2, Sparkles } from 'lucide-react';
import Navigation from '../components/shared/Navigation';
import StudentAnalytics from '../components/student/StudentAnalytics';
import { supabase } from '../../lib/supabase';
import type { Company } from '../components/admin/CompanyCard';
import { toast, Toaster } from 'sonner';

const stageColors: Record<string, string> = {
  initiation: '#3b82f6',
  planning: '#8b5cf6',
  execution: 'var(--gold-medium)',
  monitoring: '#06b6d4',
  closure: '#10b981',
};

const priorityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

export default function Analytics() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'student' | 'faculty'>('admin');
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (profile) {
            setRole(profile.role || 'admin');
            setProfileData(profile);
          }
        }

        if (role !== 'student') {
          const { data, error } = await supabase
            .from('companies')
            .select('*, positions(*), activities(*)')
            .neq('stage', 'closure');
          
          if (error) throw error;
          setCompanies(data || []);
        }
      } catch (error: any) {
        toast.error('Failed to load analytics: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [role]);

  const totalCompanies = companies.length;
  const totalPositions = companies.reduce((sum, c) => sum + (c.positions?.length || 0), 0);
  const totalActivities = companies.reduce((sum, c) => sum + (c.activities?.length || 0), 0);

  const stageData = Object.keys(stageColors).map((stage) => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1),
    value: companies.filter((c) => c.stage === stage).length,
    color: stageColors[stage],
  }));

  const priorityData = Object.keys(priorityColors).map((priority) => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: companies.filter((c) => c.priority === priority).length,
    color: priorityColors[priority],
  }));

  const activityData = companies.map((c) => ({
    name: c.company_name.length > 15 ? c.company_name.slice(0, 15) + '...' : c.company_name,
    activities: c.activities?.length || 0,
  }));

  return (
    <div className="min-h-screen bg-white">
      <Navigation userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <header className="mb-10">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#111111' }}>
              {role === 'student' ? 'Udyoog Insights' : 'Analytics & Insights'}
            </h1>
            <p className="text-gray-500">
              {role === 'student' ? 'Visualizing your professional journey.' : 'Real-time performance metrics.'}
            </p>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-[var(--gold-medium)] mb-4" />
              <p className="text-gray-500 font-medium italic">Loading...</p>
            </div>
          ) : role === 'student' ? (
            <StudentAnalytics profile={profileData} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--gold-medium)20' }}>
                      <Building2 className="w-8 h-8" style={{ color: 'var(--gold-medium)' }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Companies</p>
                      <p className="text-3xl font-bold" style={{ color: '#111111' }}>
                        {totalCompanies}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#11111120' }}>
                      <Briefcase className="w-8 h-8" style={{ color: '#111111' }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Open Positions</p>
                      <p className="text-3xl font-bold" style={{ color: '#111111' }}>
                        {totalPositions}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#10b98120' }}>
                      <ActivityIcon className="w-8 h-8" style={{ color: '#10b981' }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Activities</p>
                      <p className="text-3xl font-bold" style={{ color: '#111111' }}>
                        {totalActivities}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-8"
                >
                  <h2 className="text-xl font-bold mb-6" style={{ color: '#111111' }}>
                    Stage Distribution
                  </h2>
                  {totalCompanies === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-gray-400 italic">No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stageData.filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-8"
                >
                  <h2 className="text-xl font-bold mb-6" style={{ color: '#111111' }}>
                    Priority Distribution
                  </h2>
                  {totalCompanies === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-gray-400 italic">No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={priorityData.filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-8"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#111111' }}>
                  <TrendingUp className="w-6 h-6 text-[var(--gold-medium)]" />
                  Engagement Frequency
                </h2>
                {totalCompanies === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-400 italic">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="activities" fill="var(--gold-medium)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}



