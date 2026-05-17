import { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

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
  const [activityText, setActivityText] = useState('');
  const [actionOwner, setActionOwner] = useState('');
  const [helpRequired, setHelpRequired] = useState('');

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-2xl border border-gray-200/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-lg border-b border-gray-200/50 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl" style={{ color: '#142361' }}>
              Add Activity
            </h2>
            <p className="text-sm text-gray-600">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" style={{ color: '#142361' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date (Locked to Today) */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#142361' }}>
              Activity Date
            </label>
            <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-bold flex items-center gap-2">
               {new Date().toLocaleDateString('en-CA')}
            </div>
          </div>

          {/* Activity Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm" style={{ color: '#142361' }}>
                Activity Details
              </label>
              <span
                className={`text-xs ${remainingChars < 100 ? 'text-red-500' : 'text-gray-500'}`}
              >
                {remainingChars} characters remaining
              </span>
            </div>
            <textarea
              value={activityText}
              onChange={(e) => setActivityText(e.target.value.slice(0, 8000))}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50 resize-none"
              rows={8}
              placeholder=""
              required
            />
          </div>

          {/* Action Owner */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#142361' }}>
              Action Owner
            </label>
            <input
              type="text"
              value={actionOwner}
              onChange={(e) => setActionOwner(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
              placeholder=""
            />
          </div>

          {/* Help Required */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#142361' }}>
              Help Required (Optional)
            </label>
            <textarea
              value={helpRequired}
              onChange={(e) => setHelpRequired(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50 resize-none"
              rows={3}
              placeholder=""
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#e0653b' }}
            >
              Save Activity
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border transition-all hover:bg-gray-50"
              style={{ borderColor: '#142361', color: '#142361' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
