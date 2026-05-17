import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, TrendingUp, Award, ArrowRight, 
  Settings, Eye, RefreshCw
} from 'lucide-react';
import Navigation from '../components/shared/Navigation';
import StudentAnalytics from '../components/student/StudentAnalytics';
import StudentProfileForm from '../components/student/StudentProfileForm';

// Mock data for preview
const MOCK_PROFILE = {
  full_name: 'Yuva Shankar',
  registration_no: '2021CSE108',
  email: 'yuva.shankar@example.com',
  phone: '+91 98765 43210',
  graduation: 'B.Tech',
  branch: 'AI & ML',
  home_location: 'Chennai, India',
  preferred_locations: ['Bangalore', 'Chennai', 'Remote'],
  github_url: 'https://github.com/yuva',
  linkedin_url: 'https://linkedin.com/in/yuva',
  leetcode_url: 'https://leetcode.com/yuva',
  skills: [
    { name: 'React', level: 'Expert' },
    { name: 'TypeScript', level: 'Expert' },
    { name: 'Node.js', level: 'Intermediate' },
    { name: 'Python', level: 'Intermediate' },
    { name: 'Tailwind CSS', level: 'Expert' },
    { name: 'Supabase', level: 'Beginner' }
  ]
};

export default function Preview() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Special Preview Banner */}
      <div className="bg-[#e0653b] text-white py-2 px-4 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.2em] sticky top-0 z-[60]">
        <Eye className="w-4 h-4" />
        Preview Mode — Live System Simulation
        <button 
          onClick={() => window.location.reload()}
          className="ml-4 flex items-center gap-1 hover:underline"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      <Navigation userEmail="preview@takshashila.edu" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Tab Switcher for Preview */}
        <div className="flex gap-4 mb-8 p-1 bg-gray-100 rounded-2xl w-fit mx-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-white shadow-md text-[#142361]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard View
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'profile' 
                ? 'bg-white shadow-md text-[#142361]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile Editor
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-xl border border-gray-200/50 p-8 text-center"
              >
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#142361] to-[#e0653b] flex items-center justify-center text-white text-3xl font-bold">
                    Y
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#e0653b]" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#142361' }}>{MOCK_PROFILE.full_name}</h2>
                <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest font-bold">
                  {MOCK_PROFILE.registration_no}
                </p>
                
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="w-full py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 font-semibold transition-all hover:bg-gray-50 text-[#142361]"
                >
                  <Settings className="w-4 h-4" />
                  Customize Profile
                </button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                      <span>85%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#e0653b] w-[85%]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Mock data showing how the dashboard tracks and visualizes professional growth.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-8">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: '#142361' }}>Student Dashboard</h1>
                  <p className="text-gray-500">Integrated analytics and tracking system.</p>
                </div>
              </header>

              <StudentAnalytics profile={MOCK_PROFILE} />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <header className="mb-8 text-center">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#142361' }}>Edit Profile</h1>
              <p className="text-gray-500">Previewing the profile customization interface.</p>
            </header>
            <div className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-xl border border-gray-200/50 p-6 sm:p-10">
              <StudentProfileForm 
                initialData={MOCK_PROFILE} 
                onSave={() => alert('Save simulated')} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
