import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, User, Sparkles, RefreshCcw, ArrowLeft, Loader2, Trophy, 
  BrainCircuit, CheckCircle2, AlertCircle, Award, BookOpen, 
  Code, GraduationCap, Link2, ExternalLink, Calendar, Copy, Download,
  Layers, Lock, HelpCircle, Star, Github, Linkedin
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import Groq from 'groq-sdk';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = new Groq({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true,
});

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

interface Project {
  name: string;
  description: string;
  tech: string[];
}

export default function InterviewPrep() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [score, setScore] = useState<string | null>(null);
  const [profileAnalysisLoading, setProfileAnalysisLoading] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
        setProfile(data);
        
        // Start interview immediately reading the profile
        if (data) {
          startInterview(data);
        } else {
          setProfileAnalysisLoading(false);
          // Fallback greeting if no profile is found
          setMessages([{
            role: 'assistant',
            content: "Hello! I am your AI Interview Coach. I wasn't able to load a profile for you. Let's start by introducing yourself! Could you please share your name, degree, and what technical role or stack you'd like to practice for today?"
          }]);
        }
      } else {
        navigate('/');
      }
    };
    init();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startInterview = async (studentProfile: any) => {
    setProfileAnalysisLoading(true);
    setIsTyping(true);
    
    const hasSkills = studentProfile?.skills && studentProfile.skills.length > 0;
    const hasProjects = studentProfile?.projects && studentProfile.projects.length > 0;

    let initialSystemContent = '';
    
    if (hasSkills || hasProjects) {
      initialSystemContent = `You are a Senior Technical Interviewer from a top tech company (like Google, Meta, or Netflix).
      The student has loaded their career profile for a mock interview:
      - Name: ${studentProfile?.full_name || 'Candidate'}
      - Graduation/Degree: ${studentProfile?.graduation || 'B.Tech'}
      - Branch: ${studentProfile?.branch || 'Computer Science'}
      - CGPA: ${studentProfile?.cgpa || 'N/A'}
      - Skills: ${JSON.stringify(studentProfile?.skills || [])}
      - Projects: ${JSON.stringify(studentProfile?.projects || [])}

      Your task:
      1. Introduce yourself professionally as their AI Interview Coach.
      2. Express that you have successfully analyzed their student profile and highlight specific details: mention their degree/branch, name a few key skills they listed, and highlight at least one project by name and technology to prove you have fully read their background.
      3. Ask the very first technical question (Question 1 out of 5) tailored specifically to their top skills or projects. The question should be challenging and test conceptual depth or application (e.g., asking about architectural trade-offs, state management, or design patterns used in their listed project).
      4. Keep your response professional, focused, and concise. Do NOT ask multiple questions. Ask exactly ONE clear, open-ended technical question. Do not wait for them to say they are ready; start the interview immediately with this first question.`;
    } else {
      initialSystemContent = `You are a Senior Technical Interviewer from a top tech company.
      The student's profile is currently sparse:
      - Name: ${studentProfile?.full_name || 'Candidate'}
      - Graduation: ${studentProfile?.graduation || 'N/A'}
      - Branch: ${studentProfile?.branch || 'N/A'}

      Your task:
      1. Welcome the student warmly by name.
      2. Mention that their profile is missing specific skills and projects, but that you are happy to start anyway.
      3. Ask Question 1 of 5: Ask them to summarize their favorite technology stack, what projects they have worked on recently, or what specific role (e.g., Frontend React Engineer, Backend Python Developer) they want to target in this interview so you can tailor the next questions.`;
    }

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: initialSystemContent
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.75,
        max_tokens: 800,
      });

      const initialMessage = chatCompletion.choices[0]?.message?.content || `Hello ${studentProfile?.full_name || 'there'}! I am your AI Interview Coach. I've reviewed your profile in ${studentProfile?.branch || 'your field'}. Let's begin the mock interview. Could you explain the tech stack and architecture of your most significant project?`;
      
      setMessages([{ role: 'assistant', content: initialMessage }]);
      setCurrentQuestion(1);
      setInterviewComplete(false);
      setScore(null);
    } catch (error) {
      console.error('Groq initial prompt error:', error);
      setMessages([{
        role: 'assistant',
        content: `Hello ${studentProfile?.full_name || 'there'}! I am your AI Interview Coach. I've reviewed your profile in ${studentProfile?.branch || 'your field'}. Let's begin the mock interview with Question 1: Could you explain the design decisions and architectural challenges you faced in your primary project?`
      }]);
    } finally {
      setIsTyping(false);
      setProfileAnalysisLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const nextQuestion = currentQuestion + 1;
      let systemContent = '';

      if (nextQuestion <= 5) {
        systemContent = `You are a Senior Technical Interviewer from a top tech company.
        Student Profile:
        - Name: ${profile?.full_name}
        - Branch/Degree: ${profile?.graduation} in ${profile?.branch}
        - Skills: ${JSON.stringify(profile?.skills || [])}
        - Projects: ${JSON.stringify(profile?.projects || [])}

        The interview is currently on Question ${currentQuestion} of 5.
        The user has just answered Question ${currentQuestion}.
        
        Your tasks:
        1. Give a very brief, professional evaluation/feedback on their answer (1-2 sentences). Be constructive, highlighting any correct points or gently pointing out missing technical depth.
        2. Promptly ask Question ${nextQuestion} of 5. 
        3. This question must be a tailored technical question focusing on another skill they listed, or a follow-up about their project, or a foundational concept in their branch.
        4. Ask exactly ONE clear technical question. Keep it challenging yet professional.`;
      } else {
        systemContent = `You are a Senior Technical Interviewer from a top tech company.
        Student Profile:
        - Name: ${profile?.full_name}
        - Branch/Degree: ${profile?.graduation} in ${profile?.branch}
        - Skills: ${JSON.stringify(profile?.skills || [])}
        - Projects: ${JSON.stringify(profile?.projects || [])}

        The interview is now COMPLETE. The user has answered all 5 technical questions.
        
        Your tasks:
        1. Evaluate their final answer.
        2. Provide a comprehensive summary evaluation and score.
        3. Start your message with the exact string '🎉 INTERVIEW COMPLETED 🎉' (with the emojis) on the first line.
        4. In the remaining response, provide an in-depth feedback breakdown using standard Markdown headers exactly as specified below:
           - ### 🏆 Overall Score: [X/10] (Insert a numerical score from 1 to 10 here)
           - ### 💪 Key Strengths
             (List 2-3 specific technical or communication strengths they demonstrated)
           - ### 📈 Areas for Improvement
             (List 2-3 practical items they can improve, such as specific frameworks, theoretical knowledge, or design principles)
           - ### 🚀 Recommended Action Plan
             (Provide 3 actionable steps, e.g., topics to study, coding practices, or project additions to boost their profile)
        5. Maintain a professional, highly encouraging yet realistic tone.`;
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1200,
      });

      const aiResponse = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      if (nextQuestion <= 5) {
        setCurrentQuestion(nextQuestion);
      } else {
        setInterviewComplete(true);
        // Extract rating if possible
        const scoreMatch = aiResponse.match(/Overall Score:\s*\[?(\d+(\.\d+)?)\/10\]?/i);
        if (scoreMatch) {
          setScore(scoreMatch[1]);
        } else {
          const simpleScoreMatch = aiResponse.match(/(\d+(\.\d+)?)\s*\/\s*10/);
          if (simpleScoreMatch) setScore(simpleScoreMatch[1]);
        }
        
        // Trigger high-tech confetti
        triggerSuccessConfetti();
        toast.success("Interview completed! Read your evaluation report.");
      }
    } catch (error) {
      console.error('Groq Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection to AI lost. Please check your internet connection or API key." }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const triggerSuccessConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleRestart = () => {
    if (window.confirm("Are you sure you want to restart this interview session? This will clear current progress.")) {
      setMessages([]);
      setCurrentQuestion(1);
      setInterviewComplete(false);
      setScore(null);
      if (profile) {
        startInterview(profile);
      }
    }
  };

  const handleCopyReport = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      navigator.clipboard.writeText(lastMessage.content);
      toast.success("Evaluation report copied to clipboard!");
    }
  };

  const handleDownloadTranscript = () => {
    const transcriptText = messages.map(msg => {
      const roleStr = msg.role === 'user' ? 'Candidate' : 'AI Interview Coach';
      return `=========================================\n${roleStr}:\n=========================================\n${msg.content}\n\n`;
    }).join('\n');

    const header = `AI INTERVIEW COACH EVALUATION REPORT\nCandidate: ${profile?.full_name || 'N/A'}\nBranch: ${profile?.branch || 'N/A'}\nCGPA: ${profile?.cgpa || 'N/A'}\nDate: ${new Date().toLocaleDateString()}\n\n`;
    
    const blob = new Blob([header + transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile?.full_name?.replace(/\s+/g, '_') || 'Candidate'}_Interview_Prep_Report.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript report downloaded!");
  };

  // Quick helper to determine color of skill levels
  const getSkillBadgeColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'Intermediate': return 'bg-gray-50 text-blue-700 border-gray-200/50';
      default: return 'bg-[#f4f1e6] text-amber-700 border-[var(--gold-medium)]/40/50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navigation userEmail={userEmail} />
      
      {/* Background elegant gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-[#111111]/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-[var(--gold-gradient)]/5 blur-[100px]" />
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student-dashboard')}
              className="p-2.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95 text-gray-500 hover:text-[#111111]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#111111] tracking-tight flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-[var(--gold-medium)] animate-pulse" />
                AI Interview Prep
              </h1>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
                Role-Tailored Practice Powered by Llama 3.3
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black text-[#111111] uppercase tracking-wider">Coach Active</span>
            </div>
            
            {(messages.length > 0 || interviewComplete) && (
              <button 
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-100 rounded-2xl shadow-sm text-xs font-bold transition-all"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </header>

        {/* Dashboard/Chat Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch overflow-hidden min-h-0">
          
          {/* Left Sidebar: Profile Details & Progress */}
          <aside className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1">
            
            {/* Candidate Resume Ingest Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#111111]/5 to-transparent rounded-bl-full pointer-events-none" />
              
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[var(--gold-medium)]" />
                Ingested Profile Data
              </h3>

              {profileAnalysisLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-[#111111] animate-spin mb-3" />
                  <p className="text-xs font-semibold text-gray-500">AI is digesting your profile background...</p>
                </div>
              ) : profile ? (
                <div className="space-y-5">
                  
                  {/* Candidate Primary Info */}
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#111111] to-[#111111] flex items-center justify-center text-white text-lg font-black shadow-md shadow-[#111111]/10">
                      {profile.full_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#111111] text-base leading-tight">{profile.full_name}</h4>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">{profile.graduation} in {profile.branch}</p>
                    </div>
                  </div>

                  {/* GPA and Batch Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50/70 border border-gray-100 rounded-2xl text-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">CGPA</span>
                      <span className="text-base font-extrabold text-[#111111] mt-0.5 block">{profile.cgpa ? parseFloat(profile.cgpa).toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="p-3 bg-gray-50/70 border border-gray-100 rounded-2xl text-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Batch</span>
                      <span className="text-base font-extrabold text-[#111111] mt-0.5 block">{profile.batch || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Detected Skills</span>
                    {profile.skills && profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.slice(0, 8).map((skill: Skill, idx: number) => (
                          <span 
                            key={idx} 
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border ${getSkillBadgeColor(skill.level)}`}
                          >
                            {skill.name}
                          </span>
                        ))}
                        {profile.skills.length > 8 && (
                          <span className="px-2.5 py-1 text-[11px] font-bold rounded-xl border bg-gray-50 text-gray-500 border-gray-100">
                            +{profile.skills.length - 8} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No skills listed in profile.</p>
                    )}
                  </div>

                  {/* Highlighted Projects */}
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Analyzed Projects</span>
                    {profile.projects && profile.projects.length > 0 ? (
                      <div className="space-y-2">
                        {profile.projects.slice(0, 2).map((proj: Project, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50/60 border border-gray-100 rounded-2xl text-left hover:bg-gray-50 transition-colors">
                            <span className="font-extrabold text-xs text-[#111111] flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-[var(--gold-medium)]" />
                              {proj.name}
                            </span>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">{proj.description}</p>
                            {proj.tech && proj.tech.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {proj.tech.map((t, tIdx) => (
                                  <span key={tIdx} className="px-1.5 py-0.5 bg-white border border-gray-100 text-gray-500 text-[8px] font-bold rounded uppercase">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No projects listed in profile.</p>
                    )}
                  </div>

                  {/* Links Quick View */}
                  <div className="flex items-center gap-4 pt-1 text-gray-400 border-t border-gray-50">
                    <span className="text-[10px] font-black uppercase tracking-widest">Connectors:</span>
                    <div className="flex gap-2">
                      {profile.github_url && (
                        <a 
                          href={profile.github_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl hover:text-black border border-gray-100/50 transition-all"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a 
                          href={profile.linkedin_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 bg-gray-50 hover:bg-[#0a66c2]/10 rounded-xl hover:text-[#0a66c2] border border-gray-100/50 transition-all"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-4 text-center">
                  <AlertCircle className="w-8 h-8 text-[var(--gold-medium)] mx-auto mb-2" />
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    No active profile discovered. Please edit your Career Profile first.
                  </p>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="mt-3 text-xs font-bold text-[var(--gold-medium)] hover:underline"
                  >
                    Go to Profile Form
                  </button>
                </div>
              )}
            </div>

            {/* Session Progress Timeline */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex-1 flex flex-col min-h-[280px]">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
                Session Roadmap
              </h3>
              
              <div className="flex-1 flex flex-col justify-between space-y-4">
                {[
                  { step: 1, label: 'Profile Evaluation', desc: 'AI reviews resume stack' },
                  { step: 2, label: 'Technical Core', desc: 'Question 1 & 2' },
                  { step: 3, label: 'Deep Project Review', desc: 'Question 3 & 4' },
                  { step: 4, label: 'Behavioral & Scenarios', desc: 'Question 5' },
                  { step: 5, label: 'Performance Analytics', desc: 'Final feedback & grade' },
                ].map((item, index) => {
                  const isCompleted = interviewComplete || 
                    (item.step === 1 && messages.length > 0) ||
                    (item.step === 2 && currentQuestion > 2) ||
                    (item.step === 3 && currentQuestion > 4) ||
                    (item.step === 4 && currentQuestion > 5);
                    
                  const isActive = !isCompleted && (
                    (item.step === 1 && messages.length === 0) ||
                    (item.step === 2 && currentQuestion <= 2 && messages.length > 0) ||
                    (item.step === 3 && currentQuestion > 2 && currentQuestion <= 4) ||
                    (item.step === 4 && currentQuestion === 5) ||
                    (item.step === 5 && interviewComplete)
                  );

                  return (
                    <div key={index} className="flex items-start gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-300 relative
                          ${isCompleted 
                            ? 'bg-[#111111] border-[#111111] text-white' 
                            : isActive 
                              ? 'bg-[#f4f1e6] border-[var(--gold-medium)] text-[var(--gold-medium)] shadow-md shadow-[var(--gold-gradient)]/20 ring-4 ring-[var(--gold-medium)]/20 animate-pulse'
                              : 'bg-white border-gray-200 text-gray-400'
                          }
                        `}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                        </div>
                        {index < 4 && (
                          <div className={`w-0.5 h-10 mt-2 transition-all duration-300
                            ${isCompleted ? 'bg-[#111111]' : 'bg-gray-100'}
                          `} />
                        )}
                      </div>
                      <div className="pt-0.5">
                        <h4 className={`text-xs font-black uppercase tracking-wider leading-none transition-colors
                          ${isCompleted ? 'text-gray-500' : isActive ? 'text-[#111111]' : 'text-gray-400'}
                        `}>
                          {item.label}
                        </h4>
                        <p className={`text-[10px] font-semibold mt-1 transition-colors
                          ${isCompleted ? 'text-gray-400' : isActive ? 'text-gray-600' : 'text-gray-400'}
                        `}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* Right Column: Chat Dashboard & Completion Cards */}
          <main className="lg:col-span-8 flex flex-col min-h-[500px] bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
            
            {/* Top info-bar inside chat */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f4f1e6] flex items-center justify-center text-[var(--gold-medium)]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#111111]">AI Coach Evaluator</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {interviewComplete 
                        ? 'Session Terminated' 
                        : `Assessing Q${currentQuestion} of 5`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {!interviewComplete && messages.length > 0 && (
                <div className="px-3.5 py-1.5 bg-[#111111] text-white text-[11px] font-black rounded-xl uppercase tracking-widest shadow-inner shadow-[#111111]/10">
                  Question {currentQuestion} / 5
                </div>
              )}
            </div>

            {/* Chat Thread / Assessment Report */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              <AnimatePresence mode="popLayout">
                
                {/* Standard Message History */}
                {messages.map((msg, index) => {
                  const isCoach = msg.role === 'assistant';
                  
                  // Hide final feedback inside the chat bubble chain if we are going to show the rich card instead
                  if (interviewComplete && index === messages.length - 1) {
                    return null;
                  }

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={index}
                      className={`flex ${isCoach ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${isCoach ? '' : 'flex-row-reverse'}`}>
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-all
                          ${isCoach 
                            ? 'bg-[#111111] text-white border-[#111111]' 
                            : 'bg-[var(--gold-gradient)] text-white border-[var(--gold-medium)]/20 shadow-[var(--gold-gradient)]/20'
                          }
                        `}>
                          {isCoach ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        
                        <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm transition-all
                          ${isCoach 
                            ? 'bg-gray-50/80 text-[#111111] border border-gray-100 rounded-tl-none font-medium' 
                            : 'bg-[#111111] text-white rounded-tr-none shadow-md shadow-[var(--gold-gradient)]/20'
                          }
                        `}>
                          {isCoach ? (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Custom Typing / Processing Indicator */}
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-[#111111] text-white flex items-center justify-center border border-[#111111]">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                      <div className="bg-gray-50/80 p-4 rounded-3xl rounded-tl-none border border-gray-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[var(--gold-gradient)] rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[var(--gold-gradient)] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[var(--gold-gradient)] rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1.5">AI Coach is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Final Professional Feedback Board */}
                {interviewComplete && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="space-y-6 pt-4"
                  >
                    
                    {/* Celebration Trophy Banner */}
                    <div className="bg-gradient-to-r from-[#111111] to-[#111111] rounded-3xl p-6 text-white text-center relative overflow-hidden shadow-xl shadow-[#111111]/10">
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_30%_30%,var(--gold-medium)_0%,transparent_60%)]" />
                      <Trophy className="w-12 h-12 text-[var(--gold-medium)] mx-auto mb-3 animate-bounce" />
                      
                      <h2 className="text-xl font-black tracking-tight">Interview Evaluation Ready!</h2>
                      <p className="text-xs text-gray-300 font-semibold mt-1">
                        Congratulations! You've successfully finished all 5 questions.
                      </p>

                      {score && (
                        <div className="mt-5 inline-flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 min-w-[120px]">
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Calculated Score</span>
                          <span className="text-3xl font-black text-white mt-1">{score} <span className="text-sm font-semibold text-gray-300">/ 10</span></span>
                        </div>
                      )}
                    </div>

                    {/* Rich Breakdown Blocks */}
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-6 shadow-inner">
                      <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Detailed Performance Review</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleCopyReport}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </button>
                          <button 
                            onClick={handleDownloadTranscript}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gold-gradient)] text-white hover:bg-[#c95a34] rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </div>
                      </div>

                      {/* Render MD details nicely */}
                      <div className="prose prose-sm max-w-none text-[#111111] space-y-4">
                        {messages[messages.length - 1]?.content
                          .replace('🎉 INTERVIEW COMPLETED 🎉', '')
                          .split('###')
                          .filter(Boolean)
                          .map((chunk, chunkIdx) => {
                            const lines = chunk.trim().split('\n');
                            const title = lines[0].trim();
                            const body = lines.slice(1).join('\n').trim();
                            
                            let sectionIcon = <Award className="w-5 h-5 text-[var(--gold-medium)]" />;
                            if (title.toLowerCase().includes('strength')) {
                              sectionIcon = <Sparkles className="w-5 h-5 text-emerald-500" />;
                            } else if (title.toLowerCase().includes('improve')) {
                              sectionIcon = <AlertCircle className="w-5 h-5 text-[var(--gold-medium)]" />;
                            } else if (title.toLowerCase().includes('action')) {
                              sectionIcon = <Layers className="w-5 h-5 text-[#111111]" />;
                            }

                            return (
                              <div 
                                key={chunkIdx} 
                                className="bg-white border border-gray-100/80 p-5 rounded-2xl shadow-sm space-y-2 hover:shadow-md transition-all duration-300"
                              >
                                <h4 className="font-extrabold text-sm text-[#111111] flex items-center gap-2 border-b border-gray-50 pb-2 uppercase tracking-wide">
                                  {sectionIcon}
                                  {title}
                                </h4>
                                <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                                  {body}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Action buttons at bottom of completion */}
                    <div className="flex gap-4 pb-4">
                      <button 
                        onClick={handleRestart}
                        className="flex-1 py-4 bg-[#111111] text-white hover:bg-[#111111] rounded-2xl font-bold transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-[#111111]/10"
                      >
                        <RefreshCcw className="w-5 h-5" />
                        Restart New Interview
                      </button>
                      <button 
                        onClick={() => navigate('/student-dashboard')}
                        className="flex-1 py-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-2xl font-bold transition-all text-center flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                      </button>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Area */}
            {!interviewComplete && (
              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      profileAnalysisLoading 
                        ? "Ingesting resume, please wait..." 
                        : "Formulate your technical response..."
                    }
                    disabled={isLoading || profileAnalysisLoading}
                    className="w-full pl-6 pr-14 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#111111] focus:border-transparent outline-none transition-all shadow-inner bg-white text-sm text-[#111111]"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim() || profileAnalysisLoading}
                    className="absolute right-2.5 p-3 bg-[var(--gold-gradient)] text-white rounded-xl hover:bg-[#c95a34] transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-[var(--gold-gradient)]/20 hover:scale-105 active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                <p className="text-[10px] text-gray-400 font-bold text-center mt-2 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--gold-medium)]" />
                  Tip: Be detailed and explain specific design/coding details to score higher.
                </p>
              </form>
            )}

          </main>

        </div>
      </div>
    </div>
  );
}





