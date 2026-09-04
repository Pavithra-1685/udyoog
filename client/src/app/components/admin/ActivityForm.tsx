import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, FileText, User, HelpCircle, Sparkles } from 'lucide-react';

interface ActivityFormProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSubmit: (activity: {
    companyId: string;
    activity_text: string;
    action_owner: string;
    help_required: string;
  }) => void;
}

export default function ActivityForm({ companyId, companyName, onClose, onSubmit }: ActivityFormProps) {
  const [mounted, setMounted] = useState(false);
  const [activityText, setActivityText] = useState('');
  const [actionOwner, setActionOwner] = useState('');
  const [helpRequired, setHelpRequired] = useState('');

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      setMounted(false);
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityText.trim()) return;

    onSubmit({
      companyId,
      activity_text: activityText,
      action_owner: actionOwner,
      help_required: helpRequired,
    });
  };

  const remainingChars = 8000 - activityText.length;
  const today = new Date().toLocaleDateString('en-CA');

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col z-[10000] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[var(--gold-medium)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Log Corporate Activity
                </h2>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  {companyName}
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

          {/* Form */}
          <form id="activity-form" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Activity Date
              </label>
              <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-semibold text-sm shadow-xs flex items-center gap-2">
                {today}
              </div>
            </div>

            {/* Activity Text */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Activity Details <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs font-mono font-medium ${remainingChars < 100 ? 'text-red-500' : 'text-gray-400'}`}>
                  {remainingChars} chars remaining
                </span>
              </div>
              <textarea
                value={activityText}
                onChange={(e) => setActivityText(e.target.value.slice(0, 8000))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none text-sm font-medium text-gray-900 resize-none transition-all shadow-xs"
                rows={6}
                placeholder="Detail meeting notes, call updates, or strategic progress..."
                required
              />
            </div>

            {/* Action Owner */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" />
                Action Owner
              </label>
              <input
                type="text"
                value={actionOwner}
                onChange={(e) => setActionOwner(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none text-sm font-medium text-gray-900 transition-all shadow-xs"
                placeholder="e.g. Admin / Placement Manager"
              />
            </div>

            {/* Help Required */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-gray-400" />
                Help Required (Optional)
              </label>
              <textarea
                value={helpRequired}
                onChange={(e) => setHelpRequired(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none text-sm font-medium text-gray-900 resize-none transition-all shadow-xs"
                rows={3}
                placeholder="Specify any escalation or assistance needed..."
              />
            </div>
          </form>

          {/* Sticky Actions Footer */}
          <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="activity-form"
              className="px-8 py-2.5 bg-[var(--gold-medium)] text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all cursor-pointer"
              style={{ background: 'var(--gold-gradient)' }}
            >
              Save Activity Log
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
