import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Filter, X, Briefcase } from 'lucide-react';
import Navigation from '../../components/shared/Navigation';
import CompanyCard, { type Company, type Activity } from '../../components/admin/CompanyCard';
import CompanyForm from '../../components/admin/CompanyForm';
import ActivityForm from '../../components/admin/ActivityForm';
import { supabase } from '../../../lib/supabase';
import { generateProfessionalSummary } from '../../../lib/ai';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [activityFormCompany, setActivityFormCompany] = useState<{ id: string; name: string } | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select(`
          *,
          positions (*),
          activities (*)
        `)
        .neq('stage', 'closure')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error.message);
      toast.error(`Failed to load companies: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.role === 'student') {
          navigate('/student-dashboard');
          return;
        } else if (profile?.role === 'faculty') {
          navigate('/faculty-dashboard');
          return;
        }
      } else {
        navigate('/');
        return;
      }
      fetchCompanies();
    };
    initDashboard();
  }, [navigate]);

  const [showJobForm, setShowJobForm] = useState(false);

  const handleFormSubmit = async (formData: any) => {
    try {
      if (formData.isJobOnly) {
        // Add jobs to existing company
        if (formData.positions && formData.positions.length > 0) {
          const positionsToInsert = formData.positions.map((p: any) => ({
            company_id: formData.id,
            role: p.role,
            description: p.description,
            status: p.status,
            location: p.location,
            salary: p.salary
          }));
          const { error: posError } = await supabase.from('positions').insert(positionsToInsert);
          if (posError) throw posError;
          toast.success('New jobs added!');
        }
      } else if (formData.id) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            company_name: formData.company_name,
            stage: formData.stage,
            priority: formData.priority,
            primary_contact_name: formData.primary_contact_name,
            primary_email: formData.primary_email,
            primary_phone: formData.primary_phone,
            company_website: formData.company_website,
            action_item: formData.action_item,
          })
          .eq('id', formData.id);
        if (error) throw error;
        toast.success('Company updated!');
      } else {
        // Create new company
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert([{
            company_name: formData.company_name,
            stage: formData.stage,
            priority: formData.priority,
            primary_contact_name: formData.primary_contact_name,
            primary_email: formData.primary_email,
            primary_phone: formData.primary_phone,
            company_website: formData.company_website,
            action_item: formData.action_item,
          }])
          .select()
          .single();

        if (companyError) throw companyError;

        if (formData.positions && formData.positions.length > 0) {
          const positionsToInsert = formData.positions.map((p: any) => ({
            company_id: newCompany.id,
            role: p.role,
            description: p.description,
            status: p.status,
            location: p.location,
            salary: p.salary
          }));
          const { error: posError } = await supabase.from('positions').insert(positionsToInsert);
          if (posError) throw posError;
        }

        if (formData.initialActivity) {
          const { error: actError } = await supabase.from('activities').insert([{
            company_id: newCompany.id,
            activity_text: formData.initialActivity.activity_text,
            action_owner: formData.initialActivity.action_owner,
          }]);
          if (actError) throw actError;
        }
        toast.success('Company saved!');
      }

      fetchCompanies();
      setShowCompanyForm(false);
      setShowJobForm(false);
      setEditingCompany(undefined);
    } catch (error: any) {
      toast.error('Operation failed: ' + error.message);
    }
  };

  const handleAddActivity = async (activity: any) => {
    try {
      const { error } = await supabase.from('activities').insert([{
        company_id: activity.companyId,
        activity_text: activity.activity_text,
        action_owner: activity.action_owner,
        help_required: activity.help_required,
      }]);

      if (error) throw error;
      toast.success('Activity logged!');
      fetchCompanies();
      setActivityFormCompany(null);
    } catch (error: any) {
      toast.error('Failed to log activity: ' + error.message);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    if (stageFilter !== 'all' && company.stage !== stageFilter) return false;
    if (priorityFilter !== 'all' && company.priority !== priorityFilter) return false;
    return true;
  });

  const existingCompaniesList = companies.map(c => ({ id: c.id, name: c.company_name }));

  return (
    <div className="min-h-screen bg-white">
      <Navigation userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold" style={{ color: '#111111' }}>
            Active Companies
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white transition-all hover:bg-gray-50 text-[#111111] font-semibold"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            <button
              onClick={() => setShowJobForm(true)}
              disabled={companies.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#111111] bg-white transition-all hover:bg-gray-50 text-[#111111] font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Briefcase className="w-5 h-5" />
              Add Job
            </button>
            <button
              onClick={() => setShowCompanyForm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white transition-all hover:opacity-90 shadow-md font-bold"
              style={{ backgroundColor: 'var(--gold-medium)' }}
            >
              <Plus className="w-5 h-5" />
              New Company
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="mb-8 overflow-hidden"
            >
              <div className="backdrop-blur-lg bg-white/80 p-6 rounded-3xl border border-gray-200/50 shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#111111] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--gold-gradient)]" />
                    Business Stage
                  </label>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--gold-medium)] bg-white text-[#111111] font-medium transition-all shadow-sm cursor-pointer appearance-none"
                  >
                    <option value="all">All Stages</option>
                    <option value="initiation">Initiation</option>
                    <option value="planning">Planning</option>
                    <option value="execution">Execution</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="closure">Closure</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#111111] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#111111]" />
                    Priority Status
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--gold-medium)] bg-white text-[#111111] font-medium transition-all shadow-sm cursor-pointer appearance-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--gold-medium)]" />
            <p className="text-gray-500 font-medium">Loading...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-12 max-w-md mx-auto">
              <h3 className="text-2xl mb-3" style={{ color: '#111111' }}>
                No Engagement Data
              </h3>
              <p className="text-gray-600 mb-6">
                Your pathway is currently empty.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowCompanyForm(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:opacity-90 shadow-lg font-bold"
                  style={{ backgroundColor: 'var(--gold-medium)' }}
                >
                  <Plus className="w-5 h-5" />
                  New Company
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={(c) => setEditingCompany(c)}
                onAddActivity={(id) =>
                  setActivityFormCompany({ id, name: company.company_name })
                }
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCompanyForm && (
          <CompanyForm onClose={() => setShowCompanyForm(false)} onSubmit={handleFormSubmit} />
        )}
        {showJobForm && (
          <CompanyForm 
            isJobOnly 
            existingCompanies={existingCompaniesList}
            onClose={() => setShowJobForm(false)} 
            onSubmit={handleFormSubmit} 
          />
        )}
        {editingCompany && (
          <CompanyForm
            company={editingCompany}
            onClose={() => setEditingCompany(undefined)}
            onSubmit={handleFormSubmit}
          />
        )}
        {activityFormCompany && (
          <ActivityForm
            companyId={activityFormCompany.id}
            companyName={activityFormCompany.name}
            onClose={() => setActivityFormCompany(null)}
            onSubmit={handleAddActivity}
          />
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
    </div>
  );
}




