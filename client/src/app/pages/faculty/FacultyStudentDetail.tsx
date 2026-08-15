import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, User, Mail, GraduationCap, Award, BookOpen, BarChart3, MapPin, Globe, Linkedin, Github, Calendar, TrendingUp, Briefcase } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import StudentAnalytics from '../../components/student/StudentAnalytics';
import { toast, Toaster } from 'sonner';

export default function FacultyStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [positions, setPositions] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [isMappingLoading, setIsMappingLoading] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setUserId(user.id);
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
          .eq('sif_no', id)
          .maybeSingle();
        studentData = data;
      }
      
      if (studentData) {
        setStudent(studentData);
        
        // Fetch positions and student's mappings
        const [positionsRes, mappingsRes] = await Promise.all([
          supabase.from('positions').select('*, companies(company_name)').eq('status', 'open'),
          supabase.from('mapped_candidates').select('*').eq('student_id', studentData.user_id)
        ]);
        setPositions(positionsRes.data || []);
        setMappings(mappingsRes.data || []);
      }
      setIsLoading(false);
    };
    fetchStudent();
  }, [id]);

  const handleMap = async (positionId: string) => {
    if (!student || !userId) return;
    setIsMappingLoading(true);
    try {
      const { error } = await supabase
        .from('mapped_candidates')
        .insert([{
          student_id: student.user_id,
          position_id: positionId,
          status: 'mapped',
          mapped_by: userId,
          mapped_by_role: userRole
        }]);

      if (error) throw error;
      toast.success('Successfully mapped candidate to job!');
      
      // Refresh mappings
      const { data } = await supabase
        .from('mapped_candidates')
        .select('*')
        .eq('student_id', student.user_id);
      setMappings(data || []);
    } catch (err: any) {
      toast.error('Failed to map: ' + err.message);
    } finally {
      setIsMappingLoading(false);
    }
  };

  const handleUnmap = async (mappingId: string) => {
    setIsMappingLoading(true);
    try {
      const { error } = await supabase
        .from('mapped_candidates')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
      toast.success('Successfully unmapped candidate!');
      
      // Refresh mappings
      const { data } = await supabase
        .from('mapped_candidates')
        .select('*')
        .eq('student_id', student.user_id);
      setMappings(data || []);
    } catch (err: any) {
      toast.error('Failed to unmap: ' + err.message);
    } finally {
      setIsMappingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gold-medium)]"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-[#111111] mb-4">Student Not Found</h1>
        <button 
          onClick={() => navigate(userRole === 'admin' ? '/talent-pool' : '/faculty-dashboard')}
          className="flex items-center gap-2 text-[var(--gold-medium)] font-bold hover:underline"
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
          className="flex items-center gap-2 text-gray-500 hover:text-[#111111] transition-colors mb-8 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" /> {userRole === 'admin' ? 'Back to Talent Pool' : 'Back to Dashboard'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#111111]/10 rounded-full flex items-center justify-center text-[#111111] text-3xl font-bold mb-4">
                  {student.full_name?.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-[#111111] mb-1">{student.full_name}</h2>
                <p className="text-[var(--gold-medium)] font-mono text-sm font-bold mb-4">ROLL NO: {student.sif_no || student.registration_no}</p>
                
                <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                  {student.linkedin_url && (
                    <a href={student.linkedin_url} target="_blank" className="p-2 bg-gray-50 text-[#111111] rounded-lg hover:bg-gray-100 transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {student.github_url && (
                    <a href={student.github_url} target="_blank" className="p-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {student.resume_url && (
                    <a 
                      href={student.resume_url} 
                      target="_blank" 
                      className="px-3 py-1.5 bg-gray-50 text-[#111111] hover:bg-gray-100 rounded-lg border border-gray-200 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                      title="Google Drive Resume (DOCX)"
                    >
                      <Briefcase className="w-4 h-4 text-[#111111] animate-pulse" /> Resume
                    </a>
                  )}
                </div>

                <div className="w-full space-y-4 pt-6 border-t border-gray-100">
                  <InfoRow icon={MapPin} label="Home" value={student.home_location || 'Not Specified'} />
                  <InfoRow icon={Globe} label="Preferred" value={Array.isArray(student.preferred_locations) && student.preferred_locations.length > 0 ? student.preferred_locations.join(', ') : 'Any'} />
                  <InfoRow icon={GraduationCap} label="Branch" value={student.branch || 'General'} />
                  <InfoRow icon={Calendar} label="Batch" value={student.batch || 'Not Set'} />
                  <InfoRow icon={TrendingUp} label="CGPA" value={student.cgpa || '0.0'} />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-[#111111] mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--gold-medium)]" />
                Primary Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(student.skills) ? student.skills : []).map((skill: any) => (
                  <span key={typeof skill === 'string' ? skill : skill.name} className="px-3 py-1 bg-gray-50 text-[#111111] text-xs font-bold rounded-full border border-green-100 uppercase">
                    {typeof skill === 'string' ? skill : skill.name}
                  </span>
                ))}
                {(!Array.isArray(student.skills) || student.skills.length === 0) && (
                  <p className="text-gray-400 text-sm">No skills listed</p>
                )}
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-[#111111] mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[var(--gold-medium)]" />
                Job Placement Mapping
              </h3>
              
              {positions.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {positions.map((job) => {
                    const mapping = mappings.find(m => m.position_id === job.id);
                    const canUnmap = userRole === 'admin' || 
                      (userRole === 'faculty' && mapping?.mapped_by_role === 'faculty' && mapping?.mapped_by === userId);
                    
                    return (
                      <div key={job.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-black uppercase text-[var(--gold-medium)] tracking-wider">
                            {job.companies?.company_name}
                          </span>
                          <h4 className="font-bold text-sm text-[#111111] mt-0.5">{job.role}</h4>
                          <p className="text-[10px] text-gray-500 mt-1">{job.location || 'Remote'} • {job.salary || 'Competitive'}</p>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-200/50 flex items-center justify-between gap-2">
                          {mapping ? (
                            <>
                              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                                {mapping.status}
                              </span>
                              {canUnmap ? (
                                <button
                                  onClick={() => handleUnmap(mapping.id)}
                                  disabled={isMappingLoading}
                                  className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                >
                                  Unmap
                                </button>
                              ) : (
                                <span className="text-[8px] text-gray-400 font-medium">Mapped by {mapping.mapped_by_role || 'Admin'}</span>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleMap(job.id)}
                              disabled={isMappingLoading}
                              className="w-full py-1.5 bg-gray-50 text-[#111111] hover:bg-gray-100 font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center"
                            >
                              Map Candidate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">No active opportunities listed.</p>
              )}
            </section>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-[#111111] mb-8 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-[var(--gold-medium)]" />
                Competency Analytics
              </h3>
              <StudentAnalytics profile={student} />
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-[#111111] mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[var(--gold-medium)]" />
                Projects & Experience
              </h3>
              <div className="space-y-6">
                {(Array.isArray(student.projects) ? student.projects : []).map((project: any, index: number) => (
                  <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-[#111111] mb-2">{project.name}</h4>
                    <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(project.tech) && project.tech.map((t: string) => (
                        <span key={t} className="text-[10px] font-bold text-[#111111] uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {(!Array.isArray(student.projects) || student.projects.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl text-gray-400 italic">
                    No records found
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Toaster position="top-right" />
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
      <span className="font-bold text-[#111111] text-right break-words">{value}</span>
    </div>
  );
}




