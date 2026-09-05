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
  const parseInlineMarkdown = (text: string) => {
    if (!text) return null;
    
    // Clean up unbalanced markers like *text** -> **text**
    const cleanText = text
      .replace(/\*([^\*]+)\*\*/g, '**$1**')
      .replace(/\*\*([^\*]+)\*/g, '**$1**');

    const parts = cleanText.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-[#111111]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={i} className="italic text-gray-700">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const renderMarkdownTable = (tableLines: string[]) => {
    const parsedRows = tableLines
      .map(line =>
        line
          .split('|')
          .map(cell => cell.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      )
      .filter(row => row.length > 0);

    if (parsedRows.length === 0) return null;

    // Filter out separator row like ["---", "---", "---"]
    const dataRows = parsedRows.filter(row => !row.every(cell => /^[\s\-:]+$/.test(cell)));
    if (dataRows.length === 0) return null;

    const headers = dataRows[0];
    const bodyRows = dataRows.slice(1);

    return (
      <div className="overflow-x-auto my-4 rounded-2xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-[#111111] text-white border-b border-gray-800 uppercase tracking-widest text-[10px]">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-extrabold text-[var(--gold-medium)]">
                  {parseInlineMarkdown(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-amber-500/5 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-3 text-gray-800 leading-relaxed font-medium">
                    {parseInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Split summary into structured sections
  const lines = summary.split('\n');
  const sections: { title: string; content: (string | { type: 'table'; lines: string[] })[] }[] = [];
  
  let currentSection = {
    title: 'Executive Summary',
    content: [] as (string | { type: 'table'; lines: string[] })[]
  };
  
  let currentTableLines: string[] = [];

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      currentSection.content.push({ type: 'table', lines: [...currentTableLines] });
      currentTableLines = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushTable();
      return;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      currentTableLines.push(trimmed);
      return;
    } else {
      flushTable();
    }

    const isHeader =
      /^(?:\#+|\d+\.|\*+\d+\.|\*\*)\s*(Executive Summary|Strategic Timeline|Open Opportunities|Critical Next Steps|Key Insights|Potential Blockers|Engagement Overview|Action Items|Market Context|Recommendations|Summary)/i.test(trimmed) ||
      /^(\#+\s+|\*\*[\d\w\s]+[:\*\*])/i.test(trimmed);

    if (isHeader) {
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      const cleanTitle = trimmed
        .replace(/^[\#\*\s\d\.\-•]+/g, '')
        .replace(/[\*\#]+$/g, '')
        .replace(/:$/, '')
        .trim();

      currentSection = { title: cleanTitle || 'Overview', content: [] };
    } else {
      currentSection.content.push(line);
    }
  });

  flushTable();
  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  const getSectionBadge = (title: string, index: number) => {
    const lower = title.toLowerCase();
    const num = (index + 1).toString().padStart(2, '0');

    if (lower.includes('executive') || lower.includes('summary') || lower.includes('overview')) {
      return { 
        num,
        icon: <Sparkles className="w-4 h-4 text-amber-600" />, 
        bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
        borderAccent: 'border-l-4 border-l-amber-500'
      };
    }
    if (lower.includes('timeline') || lower.includes('history')) {
      return { 
        num,
        icon: <Calendar className="w-4 h-4 text-blue-600" />, 
        bg: 'bg-blue-50 text-blue-800 border-blue-200/80',
        borderAccent: 'border-l-4 border-l-blue-500'
      };
    }
    if (lower.includes('opportunity') || lower.includes('role') || lower.includes('open')) {
      return { 
        num,
        icon: <Briefcase className="w-4 h-4 text-emerald-600" />, 
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        borderAccent: 'border-l-4 border-l-emerald-500'
      };
    }
    if (lower.includes('next') || lower.includes('step') || lower.includes('action')) {
      return { 
        num,
        icon: <Target className="w-4 h-4 text-purple-600" />, 
        bg: 'bg-purple-50 text-purple-800 border-purple-200/80',
        borderAccent: 'border-l-4 border-l-purple-500'
      };
    }
    if (lower.includes('blocker') || lower.includes('critical') || lower.includes('risk')) {
      return { 
        num,
        icon: <ShieldAlert className="w-4 h-4 text-red-600" />, 
        bg: 'bg-red-50 text-red-800 border-red-200/80',
        borderAccent: 'border-l-4 border-l-red-500'
      };
    }
    return { 
      num,
      icon: <FileText className="w-4 h-4 text-gray-600" />, 
      bg: 'bg-gray-100 text-gray-800 border-gray-200',
      borderAccent: 'border-l-4 border-l-gray-400'
    };
  };

  return (
    <div className="space-y-6">
      {sections.map((sec, idx) => {
        const badge = getSectionBadge(sec.title, idx);
        return (
          <div
            key={idx}
            className={`p-6 rounded-3xl bg-white border border-gray-200/90 shadow-sm hover:shadow-md transition-all duration-200 ${badge.borderAccent}`}
          >
            <div className="flex items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${badge.bg}`}>
                  {badge.icon}
                </div>
                <h4 className="font-extrabold text-lg text-[#111111] tracking-tight">
                  {sec.title}
                </h4>
              </div>
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                Phase {badge.num}
              </span>
            </div>

            <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
              {sec.content.map((item, itemIdx) => {
                if (typeof item === 'object' && item.type === 'table') {
                  return <div key={itemIdx}>{renderMarkdownTable(item.lines)}</div>;
                }

                const lineStr = item as string;
                const trimmedP = lineStr.trim();
                const isBullet = /^[-\*•]\s/.test(trimmedP) || /^\*\d+\./.test(trimmedP) || /^\d+\.\s/.test(trimmedP);
                const cleanPara = trimmedP
                  .replace(/^[-\*•]\s*/, '')
                  .replace(/^\*\d+\.\s*/, '')
                  .replace(/^\d+\.\s*/, '');

                if (isBullet) {
                  return (
                    <div key={itemIdx} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-all">
                      <div className="w-2 h-2 rounded-full bg-[var(--gold-medium)] mt-1.5 shrink-0 shadow-xs" />
                      <div className="flex-1 text-gray-800 text-sm leading-relaxed">
                        {parseInlineMarkdown(cleanPara)}
                      </div>
                    </div>
                  );
                }
                return (
                  <p key={itemIdx} className="text-gray-800 leading-relaxed font-outfit">
                    {parseInlineMarkdown(cleanPara)}
                  </p>
                );
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
                        {' '}• Category: <span className="capitalize text-gray-700">{stage === 'existing_client' ? 'Existing Client' : stage === 'new_client' ? 'New Client' : stage}</span>
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
