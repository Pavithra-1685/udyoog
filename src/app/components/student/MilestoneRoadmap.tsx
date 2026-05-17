import { motion } from 'motion/react';
import { CheckCircle2, Circle, Star, Flag, Trophy, Target, BookOpen, GraduationCap } from 'lucide-react';

interface MilestoneRoadmapProps {
  profile: any;
}

export default function MilestoneRoadmap({ profile }: MilestoneRoadmapProps) {
  // Logic for milestones
  const fields = [
    profile?.full_name, profile?.phone, profile?.graduation, profile?.branch,
    profile?.github_url, profile?.linkedin_url, profile?.home_location,
    (profile?.skills?.length || 0) > 0
  ];
  const completionPercent = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const projectCount = profile?.projects?.length || 0;
  const cgpa = parseFloat(profile?.cgpa || '0');

  const milestones = [
    {
      id: 1,
      title: 'Profile Foundation',
      description: 'Complete 100% of your profile details',
      icon: CheckCircle2,
      isCompleted: completionPercent === 100,
      progress: completionPercent,
      target: '100%'
    },
    {
      id: 2,
      title: 'Project Builder',
      description: 'Add 3 or more technical projects',
      icon: BookOpen,
      isCompleted: projectCount >= 3,
      progress: Math.min((projectCount / 3) * 100, 100),
      target: '3 Projects'
    },
    {
      id: 3,
      title: 'Academic Excellence',
      description: 'Maintain an overall CGPA above 7.5',
      icon: GraduationCap,
      isCompleted: cgpa >= 7.5,
      progress: Math.min((cgpa / 7.5) * 100, 100),
      target: '7.5 CGPA'
    },
    {
      id: 4,
      title: 'Placement Ready',
      description: 'Unlock your professional certificate',
      icon: Trophy,
      isCompleted: completionPercent === 100 && projectCount >= 3 && cgpa >= 7.5,
      progress: 0,
      target: 'GOAL'
    }
  ];

  const currentLevel = milestones.filter(m => m.isCompleted).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#142361] flex items-center gap-2">
          <Flag className="w-6 h-6 text-[#e0653b]" />
          Career Pathway Roadmap
        </h3>
      </div>

      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-gray-100 rounded-full hidden sm:block" />
        
        <div className="grid grid-cols-1 gap-8">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            const isActive = milestone.isCompleted;
            
            return (
              <motion.div 
                key={milestone.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-6 group"
              >
                {/* Milestone Node */}
                <div className={`
                  relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500
                  ${isActive ? 'bg-[#142361] shadow-lg shadow-[#142361]/20 rotate-12' : 'bg-white border-2 border-gray-100 text-gray-300'}
                `}>
                  <Icon className={`w-7 h-7 ${isActive ? 'text-[#e0653b]' : ''}`} />
                  {isActive && (
                    <motion.div 
                      layoutId="check"
                      className="absolute -top-2 -right-2 bg-[#e0653b] text-white rounded-full p-1 shadow-md"
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </motion.div>
                  )}
                </div>

                {/* Content Card */}
                <div className={`
                  flex-1 p-6 rounded-3xl border transition-all duration-300
                  ${isActive ? 'bg-white border-[#142361]/10 shadow-md' : 'bg-gray-50/50 border-gray-100 opacity-60'}
                `}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className={`font-bold text-lg ${isActive ? 'text-[#142361]' : 'text-gray-400'}`}>
                        {milestone.title}
                      </h4>
                      <p className="text-sm text-gray-500">{milestone.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-[#e0653b]' : 'text-gray-300'}`}>
                        {milestone.target}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!milestone.isCompleted && milestone.id < 4 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                        <span>Progress</span>
                        <span>{Math.round(milestone.progress)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                          className="h-full bg-[#142361]/30"
                        />
                      </div>
                    </div>
                  )}

                  {milestone.isCompleted && (
                    <div className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-widest">
                      <Target className="w-4 h-4" />
                      Milestone Cleared
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
