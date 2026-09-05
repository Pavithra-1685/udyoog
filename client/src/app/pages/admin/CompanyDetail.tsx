import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Users,
  Briefcase,
  Plus,
  Edit,
  Archive as ArchiveIcon,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Navigation from '../../components/shared/Navigation';
import ActivityForm from '../../components/admin/ActivityForm';
import CompanyForm from '../../components/admin/CompanyForm';
import AiSummaryModal from '../../components/admin/AiSummaryModal';
import { supabase } from '../../../lib/supabase';
import { generateProfessionalSummary } from '../../../lib/ai';
import { toast, Toaster } from 'sonner';
import type { Company } from '../../components/admin/CompanyCard';

const priorityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

const stageColors: Record<string, string> = {
  'existing_client': 'var(--gold-medium)',
  'new_client': '#3b82f6',
  'initiation': '#3b82f6',
  'planning': '#8b5cf6',
  'execution': 'var(--gold-medium)',
  'monitoring': '#06b6d4',
  'closure': '#10b981',
};

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const handleGenerateSummary = async () => {
    if (!company) return;
    setIsGenerating(true);
    try {
      const summary = await generateProfessionalSummary(company, company.activities || []);
      setAiSummary(summary);
      setShowSummaryModal(true);
      toast.success('Analysis complete!');
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchCompanyData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || '');

      const { data, error } = await supabase
        .from('companies')
        .select('*, positions(*), activities(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCompany(data);
    } catch (error: any) {
      toast.error('Failed to load company details: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [id]);

  const handleAddActivity = async (activity: any) => {
    try {
      const { error } = await supabase.from('activities').insert([{
        company_id: id,
        date: activity.date,
        activity_text: activity.activity_text,
        action_owner: activity.action_owner,
        action_item: activity.action_item,
        help_required: activity.help_required,
      }]);

      if (error) throw error;
      toast.success('Activity logged!');
      fetchCompanyData();
      setShowActivityForm(false);
    } catch (error: any) {
      toast.error('Failed to log activity: ' + error.message);
    }
  };

  const handleEditCompany = async (companyData: Partial<Company>) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: companyData.company_name,
          stage: companyData.stage,
          priority: companyData.priority,
          primary_contact_name: companyData.primary_contact_name,
          primary_email: companyData.primary_email,
          primary_phone: companyData.primary_phone,
          company_website: companyData.company_website,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Record updated.');
      fetchCompanyData();
      setShowEditForm(false);
    } catch (error: any) {
      toast.error('Update failed: ' + error.message);
    }
  };

  const handleArchive = async () => {
    if (!company) return;
    try {
      const { error } = await supabase
        .from('companies')
        .update({ stage: 'closure' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Engagement archived.');
      navigate('/archive');
    } catch (error: any) {
      toast.error('Archive failed: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation userEmail={userEmail} />
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--gold-medium)] mb-4" />
          <p className="text-gray-500 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation userEmail={userEmail} />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl mb-4" style={{ color: '#111111' }}>
            Company Not Found
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-xl text-white shadow-lg"
            style={{ backgroundColor: 'var(--gold-medium)' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <Navigation userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl border border-gray-200 transition-all hover:bg-gray-50 text-[#111111] font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-xl border border-gray-200/50 p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#111111' }}>
                  {company.company_name}
                </h1>
                <div 
                  className="px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: stageColors[company.stage] || 'var(--gold-medium)' }}
                >
                  {company.stage === 'existing_client' ? 'Existing Client' : company.stage === 'new_client' ? 'New Client' : company.stage}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--gold-medium)]" />
                  <span className="font-medium">{company.primary_contact_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">@</span>
                  <span>{company.primary_email}</span>
                </div>
                {company.primary_phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">#</span>
                    <span>{company.primary_phone}</span>
                  </div>
                )}
              </div>

              {company.company_website && (
                <a
                  href={company.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  style={{ color: 'var(--gold-medium)' }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Website
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-[var(--gold-medium)] font-bold transition-all shadow-xs"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                AI Analysis
              </button>
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 transition-all hover:bg-white bg-white/50 text-[#111111] font-semibold shadow-sm"
              >
                <Edit className="w-5 h-5" />
                Update
              </button>
              <button
                onClick={handleArchive}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold transition-all hover:bg-gray-200"
              >
                <ArchiveIcon className="w-5 h-5" />
                Archive
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-gray-400">Priority:</span>
              <span
                className="px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-widest shadow-sm"
                style={{ backgroundColor: priorityColors[company.priority] }}
              >
                {company.priority}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl p-8 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#111111' }}>
                  <Briefcase className="w-7 h-7 text-[var(--gold-medium)]" />
                  Opportunities ({company.positions.length})
                </h2>
              </div>
              {company.positions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500">No active positions recorded.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {company.positions.map((position) => (
                    <div key={position.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--gold-medium)' }}>{position.role}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{position.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-3xl p-8 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#111111' }}>
                  <Calendar className="w-7 h-7 text-[var(--gold-medium)]" />
                  Engagement Timeline
                </h2>
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold transition-all hover:opacity-90 shadow-md"
                  style={{ backgroundColor: 'var(--gold-medium)' }}
                >
                  <Plus className="w-5 h-5" />
                  New Entry
                </button>
              </div>
              {company.activities.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500">No history found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {company.activities
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((activity) => (
                      <div key={activity.id} className="relative pl-8 border-l-2 border-gray-100 pb-2">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[var(--gold-medium)]" />
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[var(--gold-medium)20] transition-colors">
                          <div className="flex flex-wrap items-center gap-3 mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <span className="text-[#111111]">{new Date(activity.date).toDateString()}</span>
                            <span>•</span>
                            <span>Recorded by: {activity.action_owner}</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed mb-4">{activity.activity_text}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            <section className="bg-white rounded-3xl p-8 border border-gray-200/50 shadow-lg">
              <h3 className="text-xl font-bold mb-6" style={{ color: '#111111' }}>Overview</h3>
              <div className="space-y-4">
                <div className="p-5 bg-gray-50 rounded-2xl">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Positions</p>
                  <p className="text-4xl font-black" style={{ color: 'var(--gold-medium)' }}>{company.positions.length}</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-2xl">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Logs</p>
                  <p className="text-4xl font-black" style={{ color: 'var(--gold-medium)' }}>{company.activities.length}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {showActivityForm && (
          <ActivityForm
            companyId={company.id}
            companyName={company.company_name}
            onClose={() => setShowActivityForm(false)}
            onSubmit={handleAddActivity}
          />
        )}
        {showEditForm && (
          <CompanyForm
            company={company}
            onClose={() => setShowEditForm(false)}
            onSubmit={handleEditCompany}
          />
        )}
      </AnimatePresence>

      <AiSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        companyName={company.company_name}
        stage={company.stage}
        summary={aiSummary}
      />

      <Toaster position="top-right" />
    </div>
  );
}



