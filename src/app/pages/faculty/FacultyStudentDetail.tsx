import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, User, Mail, GraduationCap, Award, BookOpen, BarChart3, MapPin, Globe, Linkedin, Github, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import StudentAnalytics from '../../components/student/StudentAnalytics';

export default function FacultyStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserRole(profile?.role || user.user_metadata?.role || 'faculty');
      }

      let studentData = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '');

      if (isUuid) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', id)
          .maybeSingle();
        studentData = data;
      }

      if (!studentData) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('registration_no', id)
          .maybeSingle();
        studentData = data;
      }
      
      if (studentData) {
        setStudent(studentData);
      }
      setIsLoading(false);
    };
    fetchStudent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e0653b]"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-[#142361] mb-4">Student Not Found</h1>
        <button 
          onClick={() => navigate(userRole === 'admin' ? '/talent-pool' : '/faculty-dashboard')}
          className="flex items-center gap-2 text-[#e0653b] font-bold hover:underline"
        >
          <ArrowLeft className="w-5 h-5" /> {userRole === 'admin' ? 'Back to Talent Pool' : 'Back to Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={userEmail} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(userRole === 'admin' ? '/talent-pool' : '/faculty-dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#142361] transition-colors mb-8 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" /> {userRole === 'admin' ? 'Back to Talent Pool' : 'Back to Dashboard'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#142361]/10 rounded-full flex items-center justify-center text-[#142361] text-3xl font-bold mb-4">
                  {student.full_name?.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-[#142361] mb-1">{student.full_name}</h2>
                <p className="text-[#e0653b] font-mono text-sm font-bold mb-4">{student.registration_no}</p>
                
                <div className="flex gap-3 mb-6">
                  {student.linkedin_url && (
                    <a href={student.linkedin_url} target="_blank" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {student.github_url && (
                    <a href={student.github_url} target="_blank" className="p-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                </div>

                <div className="w-full space-y-4 pt-6 border-t border-gray-100">
                  <InfoRow icon={MapPin} label="Home" value={student.home_location || 'Not Specified'} />
                  <InfoRow icon={Globe} label="Preferred" value={student.preferred_locations?.length > 0 ? student.preferred_locations.join(', ') : 'Any'} />
                  <InfoRow icon={GraduationCap} label="Branch" value={student.branch || 'General'} />
                  <InfoRow icon={Calendar} label="Batch" value={student.batch || 'Not Set'} />
                  <InfoRow icon={TrendingUp} label="CGPA" value={student.cgpa || '0.0'} />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-[#142361] mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#e0653b]" />
                Primary Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {student.skills?.map((skill: any) => (
                  <span key={typeof skill === 'string' ? skill : skill.name} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase">
                    {typeof skill === 'string' ? skill : skill.name}
                  </span>
                ))}
                {(!student.skills || student.skills.length === 0) && (
                  <p className="text-gray-400 text-sm">No skills listed</p>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-[#142361] mb-8 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-[#e0653b]" />
                Competency Analytics
              </h3>
              <StudentAnalytics profile={student} />
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-[#142361] mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#e0653b]" />
                Projects & Experience
              </h3>
              <div className="space-y-6">
                {student.projects?.map((project: any, index: number) => (
                  <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-[#142361] mb-2">{project.name}</h4>
                    <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech?.map((t: string) => (
                        <span key={t} className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {(!student.projects || student.projects.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl text-gray-400 italic">
                    No records found
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start justify-between text-sm gap-4">
      <div className="flex items-center gap-2 text-gray-500 shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <span className="font-bold text-[#142361] text-right break-words">{value}</span>
    </div>
  );
}
