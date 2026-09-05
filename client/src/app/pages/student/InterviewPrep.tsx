import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, User, Sparkles, RefreshCcw, ArrowLeft, Loader2, Trophy, 
  BrainCircuit, CheckCircle2, AlertCircle, Award, BookOpen, 
  Code, GraduationCap, Link2, ExternalLink, Calendar, Copy, Download,
  Layers, Lock, HelpCircle, Star, Github, Linkedin, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import { createGroqChatCompletion } from '../../../lib/ai';
import confetti from 'canvas-confetti';
import { toast, Toaster } from 'sonner';

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

/**
 * Strips raw markdown symbols (*, **, ***, ---, ___, #, ##, bullet points)
 * to ensure all AI responses render in clean, structured plain text.
 */
export function cleanMarkdownSymbols(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*{1,3}/g, '')            // Strip *, **, ***
    .replace(/_{1,3}/g, '')            // Strip _, __, ___
    .replace(/^[\s]*[#]{1,6}\s*/gm, '')   // Strip markdown header symbols
    .replace(/[-_]{3,}/g, '')          // Strip horizontal rule lines ---
    .replace(/^[\s]*[-*•]\s+/gm, '')   // Strip bullet symbols
    .replace(/[`~]/g, '')              // Strip backticks
    .trim();
}

/**
 * Formats multi-paragraph plain text into structured paragraphs and clean numbered lists
 */
function renderStructuredParagraphs(rawContent: string) {
  const cleaned = cleanMarkdownSymbols(rawContent);
  const paragraphs = cleaned.split('\n\n').filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n').filter(Boolean);
        
        // Check if paragraph contains numbered items like 1. 2. 3.
        const isNumberedList = lines.every(l => /^\d+[\.\)]\s+/.test(l.trim()));

        if (isNumberedList) {
          return (
            <div key={pIdx} className="space-y-2 my-2">
              {lines.map((line, lIdx) => {
                const match = line.trim().match(/^(\d+)[\.\)]\s+(.*)/);
                if (match) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/80 border border-gray-100 shadow-2xs">
                      <span className="w-5 h-5 rounded-lg bg-amber-50 text-[var(--gold-medium)] border border-amber-200/60 font-black text-xs flex items-center justify-center shrink-0">
                        {match[1]}
                      </span>
                      <span className="text-xs text-gray-800 font-medium leading-relaxed">{match[2]}</span>
                    </div>
                  );
                }
                return <p key={lIdx} className="text-xs text-gray-800 leading-relaxed">{line}</p>;
              })}
            </div>
          );
        }

        return (
          <p key={pIdx} className="text-xs text-gray-800 leading-relaxed font-normal">
            {para}
          </p>
        );
      })}
    </div>
  );
}

const FORMATTING_RULES = `
CRITICAL FORMATTING INSTRUCTIONS:
1. Do NOT use any markdown formatting symbols such as asterisks (*, **), underscores (_, __), hashtags (#, ##), horizontal lines (---, ___), or bullet characters (*, -, •).
2. Write all responses in clean, structured plain text paragraphs and numbered lists (1., 2., 3.).
3. Present section headings in UPPERCASE PLAIN TEXT (e.g. OVERALL EVALUATION, KEY STRENGTHS, AREAS FOR IMPROVEMENT, RECOMMENDED ACTION PLAN) without any symbols.
`;

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
        
        if (data) {
          startInterview(data);
        } else {
          setProfileAnalysisLoading(false);
          setMessages([{
            role: 'assistant',
            content: "Hello! I am your AI Interview Coach. I was not able to load a candidate profile for you. Let us start by introducing yourself! Could you please share your name, degree, and what technical role or stack you would like to practice for today?"
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
      3. Ask the very first technical question (Question 1 out of 5) tailored specifically to their top skills or projects. The question should be challenging and test conceptual depth or application.
      4. Keep your response professional, focused, and concise. Do NOT ask multiple questions. Ask exactly ONE clear, open-ended technical question. Do not wait for them to say they are ready; start the interview immediately with this first question.

      ${FORMATTING_RULES}`;
    } else {
      initialSystemContent = `You are a Senior Technical Interviewer from a top tech company.
      The student's profile is currently sparse:
      - Name: ${studentProfile?.full_name || 'Candidate'}
      - Graduation: ${studentProfile?.graduation || 'N/A'}
      - Branch: ${studentProfile?.branch || 'N/A'}

      Your task:
      1. Welcome the student warmly by name.
      2. Mention that their profile is missing specific skills and projects, but that you are happy to start anyway.
      3. Ask Question 1 of 5: Ask them to summarize their favorite technology stack, what projects they have worked on recently, or what specific role they want to target in this interview.

      ${FORMATTING_RULES}`;
    }

    try {
      const chatCompletion = await createGroqChatCompletion({
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

      const initialMessage = cleanMarkdownSymbols(
        chatCompletion.choices[0]?.message?.content || 
        `Hello ${studentProfile?.full_name || 'there'}! I am your AI Interview Coach. I have reviewed your profile in ${studentProfile?.branch || 'your field'}. Let us begin the mock interview with Question 1: Could you explain the tech stack and architecture of your primary project?`
      );
      
      setMessages([{ role: 'assistant', content: initialMessage }]);
      setCurrentQuestion(1);
      setInterviewComplete(false);
      setScore(null);
    } catch (error) {
      console.error('Groq initial prompt error:', error);
      setMessages([{
        role: 'assistant',
        content: `Hello ${studentProfile?.full_name || 'there'}! I am your AI Interview Coach. I have reviewed your profile in ${studentProfile?.branch || 'your field'}. Let us begin the mock interview with Question 1: Could you explain the design decisions and architectural challenges you faced in your primary project?`
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
        4. Ask exactly ONE clear technical question. Keep it challenging yet professional.

        ${FORMATTING_RULES}`;
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
        3. Start your message with the exact string 'INTERVIEW COMPLETED' on the first line.
        4. In the remaining response, provide an in-depth feedback breakdown using standard uppercase sections:
           OVERALL SCORE: [X/10] (Insert a numerical score from 1 to 10 here)
           
           KEY STRENGTHS
           (List 2-3 specific technical or communication strengths they demonstrated in numbered format 1., 2., 3.)
           
           AREAS FOR IMPROVEMENT
           (List 2-3 practical items they can improve in numbered format 1., 2., 3.)
           
           RECOMMENDED ACTION PLAN
           (Provide 3 actionable steps in numbered format 1., 2., 3.)

        ${FORMATTING_RULES}`;
      }

      const chatCompletion = await createGroqChatCompletion({
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          ...messages.map(m => ({ role: m.role as 'assistant' | 'user' | 'system', content: m.content })),
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1200,
      });

      const aiRaw = chatCompletion.choices[0]?.message?.content || "I am sorry, I could not process your response.";
      const aiResponse = cleanMarkdownSymbols(aiRaw);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      if (nextQuestion <= 5) {
        setCurrentQuestion(nextQuestion);
      } else {
        setInterviewComplete(true);
        // Extract rating score if present
        const scoreMatch = aiRaw.match(/Overall Score:\s*\[?(\d+(\.\d+)?)\/10\]?/i) || aiRaw.match(/(\d+(\.\d+)?)\s*\/\s*10/);
        if (scoreMatch) {
          setScore(scoreMatch[1]);
        }
        
        triggerSuccessConfetti();
        toast.success("Interview completed! Read your evaluation report.");
      }
    } catch (error) {
      console.error('Groq Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection to AI lost. Please check your internet connection." }]);
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
      navigator.clipboard.writeText(cleanMarkdownSymbols(lastMessage.content));
      toast.success("Evaluation report copied to clipboard!");
    }
  };

  const handleDownloadTranscript = () => {
    const transcriptText = messages.map(msg => {
      const roleStr = msg.role === 'user' ? 'Candidate' : 'AI Interview Coach';
      return `=========================================\n${roleStr}:\n=========================================\n${cleanMarkdownSymbols(msg.content)}\n\n`;
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

  // Helper to parse final evaluation report into structured cards
  const parseEvaluationReport = (rawText: string) => {
    const cleaned = cleanMarkdownSymbols(
      rawText
        .replace('INTERVIEW COMPLETED', '')
        .replace('🎉 INTERVIEW COMPLETED 🎉', '')
    );

    const sectionRegex = /(OVERALL SCORE|KEY STRENGTHS|AREAS FOR IMPROVEMENT|RECOMMENDED ACTION PLAN|STRENGTHS|IMPROVEMENT|ACTION PLAN)/gi;
    const matches = [...cleaned.matchAll(sectionRegex)];

    if (matches.length === 0) {
      return [{ title: 'SUMMARY EVALUATION', body: cleaned }];
    }

    const sections = [];
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const title = current[0].trim().toUpperCase();
      const startIndex = current.index! + current[0].length;
      const endIndex = i + 1 < matches.length ? matches[i + 1].index! : cleaned.length;
      let body = cleaned.substring(startIndex, endIndex).trim();

      if (body.startsWith(':')) body = body.substring(1).trim();

      sections.push({ title, body });
    }

    return sections;
  };

  const getSkillBadgeColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'Intermediate': return 'bg-blue-50 text-blue-700 border-blue-200/60';
      default: return 'bg-amber-50 text-[var(--gold-medium)] border-amber-200/60';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans pb-12">
      <Navigation userEmail={userEmail} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student-dashboard')}
              className="p-2.5 bg-white border border-gray-200/80 hover:bg-gray-100/60 rounded-2xl shadow-2xs transition-all text-gray-600 hover:text-[#111111] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[var(--gold-medium)]" />
                <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
                  AI Interview Coach
                </h1>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
                Structured Technical & Project Assessment
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {(messages.length > 0 || interviewComplete) && (
              <button 
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200/80 rounded-xl shadow-2xs text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </header>

        {/* Workspace Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-hidden min-h-0">
          
          {/* Left Sidebar: Profile Details & Progress */}
          <aside className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1">
            
            {/* Candidate Resume Ingest Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--gold-medium)]" />
                  <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">
                    Ingested Candidate Profile
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-[var(--gold-medium)] border border-amber-200/60 rounded-md font-mono">
                  Verified
                </span>
              </div>

              {profileAnalysisLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-[var(--gold-medium)] animate-spin mb-3" />
                  <p className="text-xs font-semibold text-gray-500">Ingesting candidate profile background...</p>
                </div>
              ) : profile ? (
                <div className="space-y-4">
                  {/* Candidate Primary Info */}
                  <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--gold-medium)] to-amber-700 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-sm">
                      {profile.full_name?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-[#111111] text-sm truncate">{profile.full_name}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{profile.graduation || 'B.Tech'} in {profile.branch || 'CSE'}</p>
                    </div>
                  </div>

                  {/* GPA and Batch Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CGPA</span>
                      <span className="text-sm font-extrabold text-[#111111] font-mono mt-0.5 block">{profile.cgpa ? parseFloat(profile.cgpa).toFixed(2) : 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Batch</span>
                      <span className="text-sm font-extrabold text-[#111111] font-mono mt-0.5 block">{profile.batch || '2026'}</span>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Detected Technical Skills</span>
                    {profile.skills && profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.slice(0, 8).map((skill: Skill, idx: number) => (
                          <span 
                            key={idx} 
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-xl border ${getSkillBadgeColor(skill.level)}`}
                          >
                            {skill.name}
                          </span>
                        ))}
                        {profile.skills.length > 8 && (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-xl border bg-gray-50 text-gray-500 border-gray-200/60">
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
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Analyzed Projects</span>
                    {profile.projects && profile.projects.length > 0 ? (
                      <div className="space-y-2">
                        {profile.projects.slice(0, 2).map((proj: Project, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl text-left">
                            <span className="font-extrabold text-xs text-[#111111] flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-[var(--gold-medium)]" />
                              {proj.name}
                            </span>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">{proj.description}</p>
                            {proj.tech && proj.tech.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {proj.tech.map((t, tIdx) => (
                                  <span key={tIdx} className="px-1.5 py-0.5 bg-white border border-gray-200/60 text-gray-600 text-[9px] font-mono font-bold rounded">
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

                  {/* Connectors */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Profiles:</span>
                    <div className="flex gap-2">
                      {profile.github_url && (
                        <a 
                          href={profile.github_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 hover:text-black border border-gray-200/60 transition-all"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a 
                          href={profile.linkedin_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 bg-gray-50 hover:bg-[#0a66c2]/10 rounded-xl text-gray-600 hover:text-[#0a66c2] border border-gray-200/60 transition-all"
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
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    No active profile discovered. Please edit your Career Profile first.
                  </p>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="mt-3 text-xs font-bold text-[var(--gold-medium)] hover:underline cursor-pointer"
                  >
                    Go to Profile Form
                  </button>
                </div>
              )}
            </div>

            {/* Session Progress Timeline */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 flex-1 flex flex-col min-h-[260px]">
              <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-4 pb-3 border-b border-gray-100">
                Session Roadmap
              </h3>
              
              <div className="flex-1 flex flex-col justify-between space-y-3">
                {[
                  { step: 1, label: 'Profile Evaluation', desc: 'Ingested resume & background' },
                  { step: 2, label: 'Technical Core', desc: 'Question 1 & 2' },
                  { step: 3, label: 'Deep Project Review', desc: 'Question 3 & 4' },
                  { step: 4, label: 'Architecture & Scenarios', desc: 'Question 5' },
                  { step: 5, label: 'Performance Analytics', desc: 'Structured final evaluation' },
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
                    <div key={index} className="flex items-start gap-3.5">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300
                          ${isCompleted 
                            ? 'bg-[var(--gold-medium)] text-white' 
                            : isActive 
                              ? 'bg-amber-50 border-2 border-[var(--gold-medium)] text-[var(--gold-medium)] font-black animate-pulse'
                              : 'bg-gray-100 text-gray-400'
                          }
                        `}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                        </div>
                        {index < 4 && (
                          <div className={`w-0.5 h-6 mt-1 transition-all duration-300 ${isCompleted ? 'bg-[var(--gold-medium)]' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className="pt-0.5">
                        <h4 className={`text-xs font-extrabold uppercase tracking-wider transition-colors ${isCompleted ? 'text-gray-700' : isActive ? 'text-[var(--gold-medium)]' : 'text-gray-400'}`}>
                          {item.label}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* Right Column: Chat Dashboard & Completion Cards */}
          <main className="lg:col-span-8 flex flex-col min-h-[520px] bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden relative">
            
            {/* Top info-bar inside chat */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[var(--gold-medium)] shadow-2xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#111111]">AI Interview Coach</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {interviewComplete 
                        ? 'Assessment Completed' 
                        : `Assessing Q${currentQuestion} of 5`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {!interviewComplete && messages.length > 0 && (
                <div className="px-3.5 py-1 bg-[var(--gold-medium)] text-white text-[11px] font-black rounded-xl uppercase tracking-widest font-mono shadow-2xs">
                  Question {currentQuestion} / 5
                </div>
              )}
            </div>

            {/* Chat Thread / Assessment Report */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-200">
              <AnimatePresence mode="popLayout">
                
                {/* Standard Message History */}
                {messages.map((msg, index) => {
                  const isCoach = msg.role === 'assistant';
                  
                  // Hide final feedback inside chat bubble chain if we render structured card below
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
                      <div className={`flex gap-3 max-w-[88%] ${isCoach ? '' : 'flex-row-reverse'}`}>
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all ${
                          isCoach 
                            ? 'bg-gradient-to-br from-[var(--gold-medium)] to-amber-700 text-white' 
                            : 'bg-[#111111] text-white'
                        }`}>
                          {isCoach ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        
                        {/* Content Card */}
                        <div className={`p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed transition-all shadow-2xs ${
                          isCoach 
                            ? 'bg-gray-50/90 text-gray-900 border border-gray-200/80 rounded-tl-xs' 
                            : 'bg-[#111111] text-white rounded-tr-xs shadow-md'
                        }`}>
                          {isCoach ? (
                            renderStructuredParagraphs(msg.content)
                          ) : (
                            <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Processing Indicator */}
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gold-medium)] to-amber-700 text-white flex items-center justify-center shadow-2xs">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                      <div className="bg-gray-50/90 p-4 rounded-3xl rounded-tl-xs border border-gray-200/80 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[var(--gold-medium)] rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[var(--gold-medium)] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[var(--gold-medium)] rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">AI Coach is evaluating...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Final Structured Feedback Cards */}
                {interviewComplete && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="space-y-6 pt-2"
                  >
                    {/* Trophy Banner */}
                    <div className="bg-gradient-to-r from-[#111111] via-[#222222] to-[#111111] rounded-3xl p-6 text-white text-center relative overflow-hidden shadow-xl">
                      <Trophy className="w-12 h-12 text-[var(--gold-medium)] mx-auto mb-3 animate-bounce" />
                      
                      <h2 className="text-xl font-extrabold tracking-tight">Interview Assessment Complete</h2>
                      <p className="text-xs text-gray-300 font-medium mt-1">
                        Congratulations! You have completed all 5 technical evaluation questions.
                      </p>

                      {score && (
                        <div className="mt-4 inline-flex flex-col items-center justify-center p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 min-w-[130px]">
                          <span className="text-[10px] font-extrabold text-amber-200 uppercase tracking-widest">Performance Score</span>
                          <span className="text-3xl font-black text-white font-mono mt-0.5">{score} <span className="text-xs font-semibold text-gray-300">/ 10</span></span>
                        </div>
                      )}
                    </div>

                    {/* Structured Evaluation Breakdown Cards */}
                    <div className="bg-gray-50/70 border border-gray-200/80 rounded-3xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                        <span className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">
                          Structured Performance Review
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleCopyReport}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                          <button 
                            onClick={handleDownloadTranscript}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gold-medium)] text-white hover:bg-[#a55b00] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>

                      {/* Render Each Evaluation Section in a Clean Structured Card */}
                      <div className="space-y-4">
                        {parseEvaluationReport(messages[messages.length - 1]?.content || '').map((section, sIdx) => {
                          const titleUpper = section.title.toUpperCase();
                          let sectionIcon = <Award className="w-4 h-4 text-[var(--gold-medium)]" />;
                          let badgeBg = 'bg-amber-50 text-[var(--gold-medium)] border-amber-200/60';

                          if (titleUpper.includes('STRENGTH')) {
                            sectionIcon = <Sparkles className="w-4 h-4 text-emerald-600" />;
                            badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
                          } else if (titleUpper.includes('IMPROVE')) {
                            sectionIcon = <AlertCircle className="w-4 h-4 text-amber-600" />;
                            badgeBg = 'bg-amber-50 text-amber-800 border-amber-200/60';
                          } else if (titleUpper.includes('ACTION')) {
                            sectionIcon = <Layers className="w-4 h-4 text-blue-600" />;
                            badgeBg = 'bg-blue-50 text-blue-700 border-blue-200/60';
                          }

                          return (
                            <div 
                              key={sIdx} 
                              className="bg-white border border-gray-200/80 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3"
                            >
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <h4 className="font-extrabold text-xs text-[#111111] flex items-center gap-2 uppercase tracking-wider">
                                  {sectionIcon}
                                  <span>{section.title}</span>
                                </h4>
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md font-mono border ${badgeBg}`}>
                                  {titleUpper.includes('SCORE') ? 'Rating' : 'Assessment'}
                                </span>
                              </div>

                              <div className="text-xs text-gray-700 leading-relaxed">
                                {renderStructuredParagraphs(section.body)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button 
                        onClick={handleRestart}
                        className="flex-1 py-3.5 bg-[var(--gold-medium)] text-white hover:bg-[#a55b00] rounded-2xl font-bold transition-all text-center flex items-center justify-center gap-2 shadow-md cursor-pointer text-xs uppercase tracking-wider"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        <span>Start New Assessment</span>
                      </button>
                      <button 
                        onClick={() => navigate('/student-dashboard')}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-2xl font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Return to Dashboard</span>
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Area */}
            {!interviewComplete && (
              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-gray-50/70 shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      profileAnalysisLoading 
                        ? "Ingesting resume profile background..." 
                        : "Formulate your technical response..."
                    }
                    disabled={isLoading || profileAnalysisLoading}
                    className="w-full pl-5 pr-14 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none transition-all bg-white text-xs sm:text-sm text-gray-900 font-medium placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim() || profileAnalysisLoading}
                    className="absolute right-2 p-2.5 rounded-xl bg-[var(--gold-medium)] hover:bg-[#a55b00] disabled:opacity-40 disabled:hover:bg-[var(--gold-medium)] text-white transition-all cursor-pointer shadow-2xs"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            )}

          </main>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
