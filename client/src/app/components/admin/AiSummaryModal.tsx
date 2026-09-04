import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, FileText, Calendar, Briefcase, ArrowRight, Copy, Check, ShieldAlert, Target } from 'lucide-react';
import { toast } from 'sonner';

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  stage?: string;
  summary: string | null;
}

function FormattedAiContent({ summary }: { summary: string }) {
  // Split summary into structured sections based on numbers, markdown headers, or titles
  const lines = summary.split('\n');
  const sections: { title: string; content: string[] }[] = [];
  let currentSection = { title: 'Executive Summary', content: [] as string[] };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detect section headers like "1. Executive Summary", "### 2. Timeline", "**3. Roles**"
    const headerMatch = trimmed.match(/^(\#+|\d+\.|\*\*)\s*(Executive Summary|Strategic Timeline|Open Opportunities|Critical Next Steps|Key Insights|Potential Blockers|Engagement Overview|Action Items)/i);
    
    if (headerMatch || /^(\d+\.\s+[A-Z])/.test(trimmed)) {
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      const cleanTitle = trimmed
        .replace(/^(\#+|\d+\.|\*\*)\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/:$/, '');
      currentSection = { title: cleanTitle, content: [] };
    } else {
      currentSection.content.push(line);
    }
  });

  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  const getSectionBadge = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('executive') || lower.includes('summary') || lower.includes('overview')) {
      return { 
        icon: <Sparkles className="w-4 h-4 text-amber-600" />, 
        bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
        borderAccent: 'border-l-4 border-l-amber-500'
      };
    }
    if (lower.includes('timeline') || lower.includes('history')) {
      return { 
        icon: <Calendar className="w-4 h-4 text-blue-600" />, 
        bg: 'bg-blue-50 text-blue-800 border-blue-200/80',
        borderAccent: 'border-l-4 border-l-blue-500'
      };
    }
    if (lower.includes('opportunity') || lower.includes('role') || lower.includes('open')) {
      return { 
        icon: <Briefcase className="w-4 h-4 text-emerald-600" />, 
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        borderAccent: 'border-l-4 border-l-emerald-500'
      };
    }
    if (lower.includes('next') || lower.includes('step') || lower.includes('action')) {
      return { 
        icon: <Target className="w-4 h-4 text-purple-600" />, 
        bg: 'bg-purple-50 text-purple-800 border-purple-200/80',
        borderAccent: 'border-l-4 border-l-purple-500'
      };
    }
    if (lower.includes('blocker') || lower.includes('critical') || lower.includes('risk')) {
      return { 
        icon: <ShieldAlert className="w-4 h-4 text-red-600" />, 
        bg: 'bg-red-50 text-red-800 border-red-200/80',
        borderAccent: 'border-l-4 border-l-red-500'
      };
    }
    return { 
      icon: <FileText className="w-4 h-4 text-gray-600" />, 
      bg: 'bg-gray-100 text-gray-800 border-gray-200',
      borderAccent: 'border-l-4 border-l-gray-400'
    };
  };

  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-5">
      {sections.map((sec, idx) => {
        const badge = getSectionBadge(sec.title);
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all duration-200 ${badge.borderAccent}`}
          >
            <div className="flex items-center gap-3 mb-3 border-b border-gray-100 pb-3">
              <div className={`p-2 rounded-xl border flex items-center justify-center ${badge.bg}`}>
                {badge.icon}
              </div>
              <h4 className="font-bold text-base text-gray-900 tracking-tight">
                {sec.title}
              </h4>
            </div>
            <div className="space-y-2.5 text-gray-600 text-sm leading-relaxed">
              {sec.content.map((paragraph, pIdx) => {
                const trimmedP = paragraph.trim();
                const isBullet = trimmedP.startsWith('-') || trimmedP.startsWith('*') || trimmedP.startsWith('•');
                const cleanPara = isBullet ? trimmedP.replace(/^[-*•]\s*/, '') : trimmedP;

                if (isBullet) {
                  return (
                    <div key={pIdx} className="flex items-start gap-2.5 pl-1">
                      <span className="text-[var(--gold-medium)] font-bold text-base leading-none mt-1 shrink-0">•</span>
                      <span className="flex-1">{parseInlineMarkdown(cleanPara)}</span>
                    </div>
                  );
                }
                return <p key={pIdx}>{parseInlineMarkdown(cleanPara)}</p>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AiSummaryModal({
  isOpen,
  onClose,
  companyName,
  stage,
  summary,
}: AiSummaryModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, mounted]);

  if (!mounted) return null;

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('AI Analysis copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && summary && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-3xl max-h-[85vh] bg-gray-50 rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col z-[10000] my-auto"
          >
            {/* Header */}
            <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[var(--gold-medium)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                      AI Strategic Analysis
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                      Live Insights
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Target: <span className="font-semibold text-gray-800">{companyName}</span>
                    {stage && (
                      <>
                        {' '}• Category: <span className="capitalize text-gray-700">{stage}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
              <FormattedAiContent summary={summary} />
            </div>

            {/* Footer Bar */}
            <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center gap-2 transition-all shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Analysis'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-md cursor-pointer"
                style={{ backgroundColor: 'var(--gold-medium)' }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
