import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Briefcase, Activity as ActivityIcon, Building2, Loader2 } from 'lucide-react';
import Navigation from '../components/Navigation';
import { supabase } from '../../lib/supabase';
import type { Company } from '../components/CompanyCard';
import { toast, Toaster } from 'sonner';

const stageColors: Record<string, string> = {
  initiation: '#3b82f6',
  planning: '#8b5cf6',
  execution: '#e0653b',
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
        }

        const { data, error } = await supabase
          .from('companies')
          .select('*, positions(*), activities(*)');
        
        if (error) throw error;
        setCompanies(data || []);
      } catch (error: any) {
        toast.error('Failed to load analytics: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Calculate stats
  const totalCompanies = companies.length;
  const totalPositions = companies.reduce((sum, c) => sum + (c.positions?.length || 0), 0);
  const totalActivities = companies.reduce((sum, c) => sum + (c.activities?.length || 0), 0);

  // Stage distribution
  const stageData = Object.keys(stageColors).map((stage) => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1),
    value: companies.filter((c) => c.stage === stage).length,
    color: stageColors[stage],
  }));

  // Priority distribution
  const priorityData = Object.keys(priorityColors).map((priority) => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: companies.filter((c) => c.priority === priority).length,
    color: priorityColors[priority],
  }));

  // Activities per company
  const activityData = companies.map((c) => ({
    name: c.company_name.length > 15 ? c.company_name.slice(0, 15) + '...' : c.company_name,
    activities: c.activities?.length || 0,
  }));

  return (
    <div className="min-h-screen bg-white">
      <Navigation userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl mb-6" style={{ color: '#142361' }}>
            Analytics & Insights
          </h1>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-[#e0653b] mb-4" />
              <p className="text-gray-500">Aggregating engagement metrics...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#e0653b20' }}>
                      <Building2 className="w-8 h-8" style={{ color: '#e0653b' }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Companies</p>
                      <p className="text-3xl" style={{ color: '#142361' }}>
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
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#14236120' }}>
                      <Briefcase className="w-8 h-8" style={{ color: '#142361' }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Open Positions</p>
                      <p className="text-3xl" style={{ color: '#142361' }}>
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
                      <p className="text-3xl" style={{ color: '#142361' }}>
                        {totalActivities}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Stage Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-6"
                >
                  <h2 className="text-xl mb-4" style={{ color: '#142361' }}>
                    Stage Distribution
                  </h2>
                  {totalCompanies === 0 ? (
                    <p className="text-gray-500 text-center py-12">No data available</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stageData.filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
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

                {/* Priority Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-6"
                >
                  <h2 className="text-xl mb-4" style={{ color: '#142361' }}>
                    Priority Distribution
                  </h2>
                  {totalCompanies === 0 ? (
                    <p className="text-gray-500 text-center py-12">No data available</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={priorityData.filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
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

              {/* Activities per Company */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-6"
              >
                <h2 className="text-xl mb-4 flex items-center gap-2" style={{ color: '#142361' }}>
                  <TrendingUp className="w-6 h-6" />
                  Activities per Company
                </h2>
                {totalCompanies === 0 ? (
                  <p className="text-gray-500 text-center py-12">No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="activities" fill="#e0653b" />
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
