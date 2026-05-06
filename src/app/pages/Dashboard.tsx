import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Filter, X } from 'lucide-react';
import Navigation from '../components/Navigation';
import CompanyCard, { type Company, type Activity } from '../components/CompanyCard';
import CompanyForm from '../components/CompanyForm';
import ActivityForm from '../components/ActivityForm';
import { supabase } from '../../lib/supabase';
import { generateProfessionalSummary } from '../../lib/ai';
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
      toast.error('Failed to sync with backend. Check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem('careerPathway_auth');
    if (savedAuth) {
      const { email } = JSON.parse(savedAuth);
      setUserEmail(email);
    }

    fetchCompanies();
  }, []);

  // Note: Persisting to Supabase via handlers below

  const handleAddCompany = async (companyData: any) => {
    try {
      // 1. Insert Company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert([{
          company_name: companyData.company_name,
          stage: companyData.stage,
          priority: companyData.priority,
          primary_contact_name: companyData.primary_contact_name,
          primary_email: companyData.primary_email,
          primary_phone: companyData.primary_phone,
          company_website: companyData.company_website,
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Insert Positions
      if (companyData.positions && companyData.positions.length > 0) {
        const positionsToInsert = companyData.positions.map((p: any) => ({
          company_id: newCompany.id,
          role: p.role,
          description: p.description,
        }));
        const { error: posError } = await supabase.from('positions').insert(positionsToInsert);
        if (posError) throw posError;
      }

      // 3. Insert Initial Activity
      if (companyData.initialActivity) {
        const { error: actError } = await supabase.from('activities').insert([{
          company_id: newCompany.id,
          activity_text: companyData.initialActivity.activity_text,
          action_owner: companyData.initialActivity.action_owner,
          action_item: companyData.initialActivity.action_item,
          help_required: companyData.initialActivity.help_required,
          date: companyData.initialActivity.date,
        }]);
        if (actError) throw actError;
      }

      toast.success('Company saved to database!');
      fetchCompanies(); // Refresh list
      setShowCompanyForm(false);
    } catch (error: any) {
      toast.error('Failed to save company: ' + error.message);
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
        .eq('id', companyData.id);

      if (error) throw error;
      toast.success('Company updated!');
      fetchCompanies();
      setEditingCompany(undefined);
    } catch (error: any) {
      toast.error('Update failed: ' + error.message);
    }
  };

  const handleAddActivity = async (activity: any) => {
    try {
      const { error } = await supabase.from('activities').insert([{
        company_id: activity.companyId,
        date: activity.date,
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



  return (
    <div className="min-h-screen bg-white">
      <Navigation userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold" style={{ color: '#142361' }}>
            Active Companies
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white transition-all hover:bg-gray-50 text-[#142361] font-semibold"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            <button
              onClick={() => setShowCompanyForm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white transition-all hover:opacity-90 shadow-md font-semibold"
              style={{ backgroundColor: '#e0653b' }}
            >
              <Plus className="w-5 h-5" />
              New Record
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden p-1"
            >
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-400">
                  Business Stage
                </label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-gray-50 font-medium"
                >
                  <option value="all">All Stages</option>
                  <option value="initiation">Initiation</option>
                  <option value="planning">Planning</option>
                  <option value="execution">Execution</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="closure">Closure</option>
                </select>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-400">
                  Priority Status
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-gray-50 font-medium"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Company List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#e0653b]" />
            <p className="text-gray-500 font-medium">Synchronizing with secure vault...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-12 max-w-md mx-auto">
              <h3 className="text-2xl mb-3" style={{ color: '#142361' }}>
                No Engagement Data
              </h3>
              <p className="text-gray-600 mb-6">
                Your pathway is currently empty. Add your first company to start tracking your professional journey.
              </p>
              <button
                onClick={() => setShowCompanyForm(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:opacity-90 mx-auto"
                style={{ backgroundColor: '#e0653b' }}
              >
                <Plus className="w-5 h-5" />
                Initialize First Entry
              </button>
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

      {/* Modals */}
      <AnimatePresence>
        {showCompanyForm && (
          <CompanyForm onClose={() => setShowCompanyForm(false)} onSubmit={handleAddCompany} />
        )}
        {editingCompany && (
          <CompanyForm
            company={editingCompany}
            onClose={() => setEditingCompany(undefined)}
            onSubmit={handleEditCompany}
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
