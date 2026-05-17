import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, RefreshCcw, ArrowLeft, Loader2, Trophy, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import Navigation from '../../components/shared/Navigation';
import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = new Groq({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true,
});

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function InterviewPrep() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
        setProfile(data);
        
        // Start conversation
        startInterview(data);
      } else {
        navigate('/');
      }
    };
    init();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async (studentProfile: any) => {
    setIsTyping(true);
    const initialMessage = `Hello ${studentProfile?.full_name || 'there'}! I am your AI Interview Coach. I've reviewed your profile, specifically your projects in ${studentProfile?.branch || 'your field'}. Are you ready to start a mock interview for a position related to your tech stack? We'll go through 5 technical questions.`;
    setMessages([{ role: 'assistant', content: initialMessage }]);
    setIsTyping(false);
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
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a Senior Technical Interviewer from a top tech company. 
            The student's profile: Name: ${profile?.full_name}, Branch: ${profile?.branch}, Projects: ${JSON.stringify(profile?.projects || [])}, Skills: ${JSON.stringify(profile?.skills || [])}.
            Your goal is to conduct a mock interview. 
            Keep your responses professional and challenging. 
            After 5 questions, provide a summary score out of 10 and feedback.`
          },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
      });

      const aiResponse = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Groq Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection to AI lost. Please check your API key." }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation userEmail={userEmail} />
      
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-64px)]">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student-dashboard')}
              className="p-2 hover:bg-white rounded-xl transition-colors text-gray-500 hover:text-[#142361]"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#142361] flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-[#e0653b]" />
                AI Interview Prep
              </h1>
              <p className="text-sm text-gray-500">Practicing with your technical stack</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#e0653b]" />
            <span className="text-xs font-bold text-[#142361] uppercase tracking-widest">Active Session</span>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col mb-4">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {messages.map((msg, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                    ${msg.role === 'assistant' ? 'bg-[#142361] text-white' : 'bg-[#e0653b] text-white'}
                  `}>
                    {msg.role === 'assistant' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div className={`p-4 rounded-3xl text-sm leading-relaxed
                    ${msg.role === 'assistant' 
                      ? 'bg-gray-50 text-[#142361] border border-gray-100 rounded-tl-none' 
                      : 'bg-[#142361] text-white rounded-tr-none shadow-lg'}
                  `}>
                    {msg.role === 'assistant' ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#142361] text-white flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-3xl rounded-tl-none border border-gray-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response here..."
                disabled={isLoading}
                className="w-full pl-6 pr-14 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#142361] focus:border-transparent outline-none transition-all shadow-inner bg-white"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-[#e0653b] text-white rounded-xl hover:bg-[#c95a34] transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-[#e0653b]/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
