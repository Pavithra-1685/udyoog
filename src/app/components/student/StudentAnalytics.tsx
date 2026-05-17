import { motion } from 'motion/react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { Award, Target, Zap, CheckCircle2, TrendingUp } from 'lucide-react';

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
  const skills = (profile?.skills as Skill[]) || [];
  
  const skillDistribution = [
    { name: 'Expert', value: skills.filter(s => s.level === 'Expert').length, color: LEVEL_COLORS.Expert },
    { name: 'Intermediate', value: skills.filter(s => s.level === 'Intermediate').length, color: LEVEL_COLORS.Intermediate },
    { name: 'Beginner', value: skills.filter(s => s.level === 'Beginner').length, color: LEVEL_COLORS.Beginner },
  ].filter(d => d.value > 0);

  const radarData = skills.slice(0, 6).map(s => ({
    subject: s.name,
    A: s.level === 'Expert' ? 100 : s.level === 'Intermediate' ? 66 : 33,
    fullMark: 100,
  }));

  // Calculate Readiness Score
  const fields = [
    profile?.full_name, profile?.phone, profile?.graduation, profile?.branch,
    profile?.github_url, profile?.linkedin_url, (profile?.skills?.length || 0) > 0
  ];
  const completionPercent = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const cgpaData = [1, 2, 3, 4, 5, 6, 7, 8].map(sem => ({
    name: `Sem ${sem}`,
    cgpa: parseFloat(profile?.semester_cgpa?.[`sem${sem}`]) || null
  })).filter(d => d.cgpa !== null);

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-6 flex items-center gap-4"
        >
          <div className="p-4 rounded-2xl bg-[#e0653b]/10">
            <Target className="w-8 h-8 text-[#e0653b]" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Readiness Score</p>
            <p className="text-3xl font-bold" style={{ color: '#142361' }}>{completionPercent}%</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-6 flex items-center gap-4"
        >
          <div className="p-4 rounded-2xl bg-[#142361]/10">
            <Award className="w-8 h-8 text-[#142361]" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Expert Skills</p>
            <p className="text-3xl font-bold" style={{ color: '#142361' }}>{skills.filter(s => s.level === 'Expert').length}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-6 flex items-center gap-4"
        >
          <div className="p-4 rounded-2xl bg-[#10b981]/10">
            <TrendingUp className="w-8 h-8 text-[#10b981]" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Overall CGPA</p>
            <p className="text-3xl font-bold" style={{ color: '#142361' }}>{profile?.cgpa || '0.0'}</p>
          </div>
        </motion.div>
      </div>

      {/* CGPA Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-8"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#142361' }}>
          <TrendingUp className="w-6 h-6 text-[#e0653b]" />
          Academic CGPA Trend
        </h3>
        {cgpaData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cgpaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
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
                  stroke="#e0653b" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#e0653b', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, fill: '#142361', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400 italic">
            Enter your semester-wise CGPA in the profile section to see your trend.
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Proficiencies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-8"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#142361' }}>
            <CheckCircle2 className="w-6 h-6 text-[#e0653b]" />
            Skill Proficiency
          </h3>
          {skills.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Proficiency"
                  dataKey="A"
                  stroke="#e0653b"
                  fill="#e0653b"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Add skills to see your proficiency map
            </div>
          )}
        </motion.div>

        {/* Level Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-lg border border-gray-200/50 p-8"
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: '#142361' }}>Level Distribution</h3>
          {skillDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No skills data available
            </div>
          )}
          <div className="flex justify-center gap-4 mt-4">
            {Object.entries(LEVEL_COLORS).map(([lvl, color]) => (
              <div key={lvl} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-medium text-gray-600">{lvl}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
