import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ExternalLink, Calendar, Users, Briefcase, ArrowRight, Sparkles, Loader2, X, FileText } from 'lucide-react';
import { generateProfessionalSummary } from '../../lib/ai';
import { toast } from 'sonner';

export interface Position {
  id: string;
  role: string;
  description: string;
  created_at: string;
}

export interface Activity {
  id: string;
  date: string;
  activity_text: string;
  action_owner: string;
  action_item?: string;
  help_required: string;
  created_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  stage: 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closure';
  priority: 'high' | 'medium' | 'low';
  primary_contact_name: string;
  primary_email: string;
  primary_phone?: string;
  company_website: string;
  positions: Position[];
  activities: Activity[];
  created_at: string;
}

interface CompanyCardProps {
  company: Company;
  onEdit: (company: Company) => void;
  onAddActivity: (companyId: string) => void;
}

const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

const stageColors = {
  'initiation': '#3b82f6',
  'planning': '#8b5cf6',
  'execution': '#e0653b',
  'monitoring': '#06b6d4',
  'closure': '#10b981',
};

export default function CompanyCard({ company, onEdit, onAddActivity }: CompanyCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const handleGenerateSummary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    try {
      const summary = await generateProfessionalSummary(company, company.activities);
      setAiSummary(summary);
      setShowSummaryModal(true);
      toast.success(`Analysis complete for ${company.company_name}`);
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed. Check API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden hover:shadow-[0_8px_32px_0_rgba(20,35,97,0.15)] transition-all duration-500"
      >
        {/* Header - Always Visible */}
        <div
          className="p-6 cursor-pointer relative"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Quick AI Button */}
          <button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="absolute top-6 right-16 p-2 rounded-xl bg-white/50 border border-gray-200 hover:bg-white transition-all group shadow-sm z-10"
            title="Generate AI Summary"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#e0653b]" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#e0653b] group-hover:scale-110 transition-transform" />
            )}
          </button>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-12">
              <h2 className="text-2xl mb-1" style={{ color: '#142361' }}>
                {company.company_name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{company.primary_contact_name}</span>
                </div>
                <span>{company.primary_email}</span>
                {company.primary_phone && <span>{company.primary_phone}</span>}
              </div>
            </div>

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-6 h-6" style={{ color: '#142361' }} />
            </motion.div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-white text-sm capitalize font-medium shadow-sm"
              style={{ backgroundColor: priorityColors[company.priority] }}
            >
              {company.priority} Priority
            </span>

            <span
              className="px-3 py-1 rounded-full text-white text-sm capitalize font-medium shadow-sm"
              style={{ backgroundColor: stageColors[company.stage] }}
            >
              {company.stage}
            </span>

            <span className="px-3 py-1 rounded-full bg-gray-100 text-sm flex items-center gap-1 font-medium text-gray-700">
              <Briefcase className="w-4 h-4" />
              {company.positions.length} {company.positions.length === 1 ? 'Position' : 'Positions'}
            </span>

            {company.company_website && (
              <a
                href={company.company_website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-sm flex items-center gap-1 hover:bg-gray-100 transition-colors"
                style={{ color: '#142361' }}
              >
                <ExternalLink className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border-t border-gray-200/50 p-6 space-y-6 bg-gray-50/30">
                {/* Positions */}
                {company.positions.length > 0 && (
                  <div>
                    <h3 className="text-xl mb-3 flex items-center gap-2" style={{ color: '#142361' }}>
                      <Briefcase className="w-5 h-5" />
                      Open Positions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {company.positions.map((position) => (
                        <div
                          key={position.id}
                          className="p-4 bg-white rounded-xl border border-gray-200/50 shadow-sm"
                        >
                          <h4 className="font-semibold mb-1" style={{ color: '#e0653b' }}>
                            {position.role}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{position.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {company.activities.length > 0 && (
                  <div>
                    <h3 className="text-xl mb-3 flex items-center gap-2" style={{ color: '#142361' }}>
                      <Calendar className="w-5 h-5" />
                      Engagement History
                    </h3>
                    <div className="space-y-3">
                      {company.activities.slice(0, 3).map((activity) => (
                        <div
                          key={activity.id}
                          className="p-4 bg-white rounded-xl border border-gray-200/50 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(activity.date).toLocaleDateString()}</span>
                            <span className="text-gray-300">•</span>
                            <span>{activity.action_owner}</span>
                          </div>
                          <p className="text-sm text-gray-700">{activity.activity_text}</p>
                        </div>
                      ))}
                      {company.activities.length > 3 && (
                        <button 
                          onClick={() => navigate(`/company/${company.id}`)}
                          className="text-sm font-medium text-[#e0653b] hover:underline flex items-center gap-1"
                        >
                          View all {company.activities.length} activities
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200/50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/company/${company.id}`);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 shadow-md"
                    style={{ backgroundColor: '#142361' }}
                  >
                    Manage Detailed File
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddActivity(company.id);
                    }}
                    className="px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 shadow-md"
                    style={{ backgroundColor: '#e0653b' }}
                  >
                    Log Activity
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(company);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 transition-all hover:bg-white bg-white/50 text-gray-700 font-medium shadow-sm"
                  >
                    Update Record
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* AI Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && aiSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSummaryModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#142361]/5">
                      <Sparkles className="w-6 h-6 text-[#e0653b]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold" style={{ color: '#142361' }}>
                        AI Strategic Analysis
                      </h3>
                      <p className="text-sm text-gray-500">{company.company_name} Engagement</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  <div className="prose prose-blue max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg">
                      {aiSummary}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Generated via Llama 3.3 Intelligence
                  </p>
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="px-6 py-2.5 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: '#142361' }}
                  >
                    Acknowledge Insights
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
