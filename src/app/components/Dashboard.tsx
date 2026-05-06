import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, LogOut, Filter, Sparkles } from 'lucide-react';
import CompanyCard, { type Company } from './CompanyCard';
import CompanyForm from './CompanyForm';
import ActivityForm from './ActivityForm';

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
  companies: Company[];
  onUpdateCompanies: (companies: Company[]) => void;
}

export default function Dashboard({ userEmail, onLogout, companies, onUpdateCompanies }: DashboardProps) {
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [activityFormCompany, setActivityFormCompany] = useState<{ id: string; name: string } | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleAddCompany = (companyData: Partial<Company>) => {
    const newCompany: Company = {
      id: Date.now().toString(),
      company_name: companyData.company_name!,
      stage: companyData.stage!,
      priority: companyData.priority!,
      primary_contact_name: companyData.primary_contact_name!,
      primary_email: companyData.primary_email!,
      company_website: companyData.company_website || '',
      positions: companyData.positions || [],
      activities: [],
      created_at: new Date().toISOString(),
    };
    onUpdateCompanies([...companies, newCompany]);
    setShowCompanyForm(false);
  };

  const handleEditCompany = (companyData: Partial<Company>) => {
    const updated = companies.map((c) =>
      c.id === companyData.id
        ? { ...c, ...companyData }
        : c
    );
    onUpdateCompanies(updated);
    setEditingCompany(undefined);
  };

  const handleAddActivity = (activity: {
    companyId: string;
    date: string;
    activity_text: string;
    action_owner: string;
    help_required: string;
  }) => {
    const updated = companies.map((c) =>
      c.id === activity.companyId
        ? {
            ...c,
            activities: [
              ...c.activities,
              {
                id: Date.now().toString(),
                ...activity,
                created_at: new Date().toISOString(),
              },
            ],
          }
        : c
    );
    onUpdateCompanies(updated);
    setActivityFormCompany(null);
  };

  const filteredCompanies = companies.filter((company) => {
    if (stageFilter !== 'all' && company.stage !== stageFilter) return false;
    if (priorityFilter !== 'all' && company.priority !== priorityFilter) return false;
    return true;
  });

  const handleGenerateSummary = () => {
    alert('AI Summary generation will be available once you connect the Groq API key.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl" style={{ color: '#142361' }}>
                Career Pathway Center
              </h1>
              <p className="text-sm text-gray-600">{userEmail}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateSummary}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#142361' }}
              >
                <Sparkles className="w-5 h-5" />
                AI Summary
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:bg-gray-50"
                style={{ borderColor: '#142361', color: '#142361' }}
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              <button
                onClick={() => setShowCompanyForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#e0653b' }}
              >
                <Plus className="w-5 h-5" />
                Add Company
              </button>
              <button
                onClick={onLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" style={{ color: '#142361' }} />
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
                className="mt-4 flex gap-4 overflow-hidden"
              >
                <div className="flex-1">
                  <label className="block text-sm mb-1" style={{ color: '#142361' }}>
                    Stage
                  </label>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white"
                  >
                    <option value="all">All Stages</option>
                    <option value="Initiation">Initiation</option>
                    <option value="Planning">Planning</option>
                    <option value="Execution">Execution</option>
                    <option value="Monitoring & Control">Monitoring & Control</option>
                    <option value="Closure">Closure</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm mb-1" style={{ color: '#142361' }}>
                    Priority
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white"
                  >
                    <option value="all">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredCompanies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-12 max-w-md mx-auto">
              <h2 className="text-2xl mb-3" style={{ color: '#142361' }}>
                No Companies Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start tracking your career opportunities by adding your first company.
              </p>
              <button
                onClick={() => setShowCompanyForm(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:opacity-90 mx-auto"
                style={{ backgroundColor: '#e0653b' }}
              >
                <Plus className="w-5 h-5" />
                Add Your First Company
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
          <CompanyForm
            onClose={() => setShowCompanyForm(false)}
            onSubmit={handleAddCompany}
          />
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
    </div>
  );
}
