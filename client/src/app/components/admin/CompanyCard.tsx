import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ExternalLink, Calendar, Users, Briefcase, ArrowRight, Sparkles, Loader2, FileText, MapPin, IndianRupee, Clock } from 'lucide-react';
import { generateProfessionalSummary } from '../../../lib/ai';
import { toast } from 'sonner';
import AiSummaryModal from './AiSummaryModal';

export interface Position {
  id: string;
  role: string;
  description: string;
  status: 'open' | 'close' | 'hold';
  location: string;
  salary: string;
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
  action_date?: string;
  action_item?: string;
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

export const formatStageLabel = (stage?: string) => {
  if (stage === 'new_client') return 'New Client';
  return 'Existing Client';
};

const stageColors: Record<string, string> = {
  'existing_client': 'var(--gold-medium)',
  'new_client': '#3b82f6',
};

const statusColors = {
  'open': 'bg-gray-100 text-[#111111] border-gray-200',
  'close': 'bg-red-100 text-red-700 border-red-200',
  'hold': 'bg-amber-100 text-amber-700 border-[var(--gold-medium)]/40',
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
      toast.success(`Analysis complete!`);
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed.');
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
        <div
          className="p-6 cursor-pointer relative"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-1 truncate" style={{ color: '#111111' }}>
                {company.company_name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Users className="w-4 h-4 shrink-0 text-gray-400" />
                  <span className="truncate">{company.primary_contact_name}</span>
                </div>
                <span className="truncate text-gray-500">{company.primary_email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-[var(--gold-medium)] transition-all group shadow-xs flex items-center gap-2 text-xs font-bold"
                title="Generate AI Strategic Summary"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--gold-medium)]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[var(--gold-medium)] group-hover:scale-110 transition-transform" />
                )}
                <span className="hidden sm:inline">AI Analysis</span>
              </button>

              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronDown className="w-5 h-5" style={{ color: '#111111' }} />
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-white text-sm capitalize font-medium shadow-sm"
              style={{ backgroundColor: priorityColors[company.priority] }}
            >
              {company.priority}
            </span>

            <span
              className="px-3 py-1 rounded-full text-white text-sm capitalize font-medium shadow-sm"
              style={{ backgroundColor: stageColors[company.stage] || 'var(--gold-medium)' }}
            >
              {formatStageLabel(company.stage)}
            </span>

            <span className="px-3 py-1 rounded-full bg-gray-100 text-sm flex items-center gap-1 font-medium text-gray-700">
              <Briefcase className="w-4 h-4" />
              {company.positions.length} Jobs
            </span>

            {company.company_website && (
              <a
                href={company.company_website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-sm flex items-center gap-1 hover:bg-gray-100 transition-colors"
                style={{ color: '#111111' }}
              >
                <ExternalLink className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border-t border-gray-200/50 p-6 space-y-6 bg-gray-50/30">
                {company.positions.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#111111' }}>
                      <Briefcase className="w-5 h-5 text-[var(--gold-medium)]" />
                      Job Openings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {company.positions.map((position) => (
                        <div
                          key={position.id}
                          className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-lg group-hover:text-[var(--gold-medium)] transition-colors" style={{ color: '#111111' }}>
                              {position.role}
                            </h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusColors[position.status || 'open']}`}>
                              {position.status || 'open'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{position.location || 'Remote'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <IndianRupee className="w-4 h-4" />
                              <span>{position.salary || 'N/A'}</span>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-2 italic">
                            "{position.description}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(company.action_item || company.action_date) && (
                  <div className="p-4 bg-[#111111]/5 rounded-2xl border border-[#111111]/10">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-[#111111] mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Next Action
                    </h4>
                    <p className="text-[#111111] font-medium">{company.action_item || 'Pending'}</p>
                    <p className="text-xs text-gray-500">{company.action_date ? new Date(company.action_date).toLocaleDateString() : 'TBD'}</p>
                  </div>
                )}

                {company.activities.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: '#111111' }}>
                      <Calendar className="w-5 h-5" />
                      Recent Logs
                    </h3>
                    <div className="space-y-3">
                      {company.activities.slice(0, 2).map((activity) => (
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
                      {company.activities.length > 2 && (
                        <button 
                          onClick={() => navigate(`/company/${company.id}`)}
                          className="text-sm font-medium text-[var(--gold-medium)] hover:underline flex items-center gap-1"
                        >
                          View history ({company.activities.length})
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200/50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/company/${company.id}`);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 shadow-md font-bold"
                    style={{ backgroundColor: 'var(--gold-medium)' }}
                  >
                    Deep Dive
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddActivity(company.id);
                    }}
                    className="px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 shadow-md"
                    style={{ backgroundColor: 'var(--gold-medium)' }}
                  >
                    New Activity
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(company);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 transition-all hover:bg-white bg-white/50 text-gray-700 font-medium shadow-sm"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AiSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        companyName={company.company_name}
        stage={company.stage}
        summary={aiSummary}
      />
    </>
  );
}




