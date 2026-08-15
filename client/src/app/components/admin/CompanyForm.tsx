import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2, Briefcase, MapPin, IndianRupee, Clock, FileText, Users, Sparkles } from 'lucide-react';
import type { Company, Position } from './CompanyCard';

interface CompanyFormProps {
  company?: Company;
  existingCompanies?: { id: string; name: string }[];
  isJobOnly?: boolean;
  onClose: () => void;
  onSubmit: (company: Partial<Company>) => void;
}

export default function CompanyForm({ company, existingCompanies, isJobOnly, onClose, onSubmit }: CompanyFormProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(company?.id || '');
  const [companyName, setCompanyName] = useState(company?.company_name || '');
  const [stage, setStage] = useState(company?.stage || 'initiation');
  const [priority, setPriority] = useState(company?.priority || 'medium');
  const [primaryContactName, setPrimaryContactName] = useState(company?.primary_contact_name || '');
  const [primaryEmail, setPrimaryEmail] = useState(company?.primary_email || '');
  const [primaryPhone, setPrimaryPhone] = useState(company?.primary_phone || '');
  const [companyWebsite, setCompanyWebsite] = useState(company?.company_website || '');
  
  const today = new Date().toLocaleDateString('en-CA');
  const [actionItem, setActionItem] = useState(company?.action_item || '');

  // Jobs (Positions)
  const [positions, setPositions] = useState<Partial<Position>[]>(
    isJobOnly ? [{ role: '', description: '', status: 'open', location: '', salary: '' }] : (company?.positions || [])
  );

  // Initial Activity Fields (Only for new companies)
  const [activityText, setActivityText] = useState('');
  const [actionOwner, setActionOwner] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const companyData: any = {
      id: isJobOnly ? selectedCompanyId : company?.id,
      company_name: companyName,
      stage,
      priority,
      primary_contact_name: primaryContactName,
      primary_email: primaryEmail,
      primary_phone: primaryPhone,
      company_website: companyWebsite,
      action_item: actionItem,
      positions: positions as Position[],
      isJobOnly,
    };

    // If it's a new company, we might include the initial activity
    if (!company && !isJobOnly && activityText) {
      companyData.initialActivity = {
        activity_text: activityText,
        action_owner: actionOwner
      };
    }

    onSubmit(companyData);
  };

  const addPosition = () => {
    setPositions([...positions, { 
      role: '', 
      description: '', 
      status: 'open', 
      location: '', 
      salary: '' 
    }]);
  };

  const removePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  const updatePosition = (index: number, field: keyof Position, value: string) => {
    const updated = [...positions];
    updated[index] = { ...updated[index], [field]: value };
    setPositions(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="backdrop-blur-lg bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-lg border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-[#111111]">
              {isJobOnly ? 'Add New Job Roles' : company ? 'Edit Company Profile' : 'Initialize New Company'}
            </h2>
            <p className="text-sm text-gray-500">
              {isJobOnly ? 'Expanding opportunities for existing clients' : 'Corporate Engagement & Job Management'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-[#111111]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {isJobOnly ? (
            <div className="space-y-6">
               <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-sm uppercase tracking-widest">
                <Users className="w-4 h-4" />
                Select Existing Company
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-[#111111]">Company Name</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none appearance-none cursor-pointer bg-white transition-all"
                  required
                >
                  <option value="">Choose a company...</option>
                  {existingCompanies?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {!existingCompanies?.length && (
                  <p className="text-xs text-red-500 mt-1 font-bold italic">No companies available. Please create a company first.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Section 1: Basic Company Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-sm uppercase tracking-widest">
                  <Plus className="w-4 h-4" />
                  Core Information
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[#111111]">Client Name / Company</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none transition-all"
                      placeholder="e.g. Google India"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[#111111]">Official Website</label>
                    <input
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[#111111]">Engagement Stage</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none appearance-none cursor-pointer bg-white transition-all"
                    >
                      <option value="initiation">Initiation</option>
                      <option value="planning">Planning</option>
                      <option value="execution">Execution</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="closure">Closure</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[#111111]">Priority Status</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none appearance-none cursor-pointer bg-white transition-all"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Person */}
              <div className="space-y-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-sm uppercase tracking-widest">
                  <Users className="w-4 h-4" />
                  Primary Contact
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[#111111]">Full Name</label>
                    <input
                      type="text"
                      value={primaryContactName}
                      onChange={(e) => setPrimaryContactName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[#111111]">Email Address</label>
                    <input
                      type="email"
                      value={primaryEmail}
                      onChange={(e) => setPrimaryEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[#111111]">Phone Number</label>
                    <input
                      type="tel"
                      value={primaryPhone}
                      onChange={(e) => setPrimaryPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section 3: Action Items (Locked to Today) */}
          <div className="space-y-6 pt-6 border-t border-gray-100 bg-gray-50/50 p-6 rounded-3xl">
            <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-sm uppercase tracking-widest">
              <Clock className="w-4 h-4" />
              Scheduling & Next Action
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-bold text-[#111111]">Action Date</label>
                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-bold flex items-center gap-2">
                   <Clock className="w-4 h-4 text-[var(--gold-medium)]" />
                   {today}
                </div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-bold text-[#111111]">Action Item Description</label>
                <input
                  type="text"
                  value={actionItem}
                  onChange={(e) => setActionItem(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none transition-all"
                  placeholder="e.g. Schedule first round of interviews"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Jobs Management */}
          <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-sm uppercase tracking-widest">
                <Briefcase className="w-4 h-4" />
                Job Roles
              </div>
              <button
                type="button"
                onClick={addPosition}
                className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Add Job
              </button>
            </div>

            <div className="grid gap-6">
              {positions.map((pos, idx) => (
                <div key={idx} className="relative p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-[var(--gold-medium)]/30 transition-all">
                  <button
                    type="button"
                    onClick={() => removePosition(idx)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Job Title</label>
                      <input
                        type="text"
                        value={pos.role}
                        onChange={(e) => updatePosition(idx, 'role', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-[var(--gold-medium)]"
                        placeholder="e.g. Frontend Intern"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Status</label>
                      <select
                        value={pos.status}
                        onChange={(e) => updatePosition(idx, 'status', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-[var(--gold-medium)] appearance-none cursor-pointer"
                      >
                        <option value="open">Open</option>
                        <option value="hold">Hold</option>
                        <option value="close">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Priority Location
                      </label>
                      <input
                        type="text"
                        value={pos.location}
                        onChange={(e) => updatePosition(idx, 'location', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-[var(--gold-medium)]"
                        placeholder="e.g. Bangalore (Manual Entry)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" /> Stipend / Salary
                      </label>
                      <input
                        type="text"
                        value={pos.salary}
                        onChange={(e) => updatePosition(idx, 'salary', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-[var(--gold-medium)]"
                        placeholder="e.g. 25k/mo or 8 LPA"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Job Description
                    </label>
                    <textarea
                      value={pos.description}
                      onChange={(e) => updatePosition(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-[var(--gold-medium)] resize-none"
                      rows={2}
                      placeholder="Briefly describe the role..."
                    />
                  </div>
                </div>
              ))}
              {positions.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400">
                  No job roles added yet.
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Initial Activity (Only for new companies) */}
          {!company && !isJobOnly && (
            <div className="space-y-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-sm uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                Quick Activity Log
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#111111]">Activity Detail</label>
                  <input
                    type="text"
                    value={activityText}
                    onChange={(e) => setActivityText(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none transition-all"
                    placeholder="e.g. Initial reach out email sent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#111111]">Action Owner</label>
                  <input
                    type="text"
                    value={actionOwner}
                    onChange={(e) => setActionOwner(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] outline-none transition-all"
                    placeholder="Admin Name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-4 pt-8 sticky bottom-0 bg-white py-4 border-t border-gray-100">
            <button
              type="submit"
              className="flex-1 py-4 bg-[var(--gold-gradient)] text-white rounded-2xl font-bold text-lg shadow-xl shadow-[var(--gold-gradient)]/20 hover:opacity-90 transition-all"
            >
              {isJobOnly ? 'Add Job Roles' : company ? 'Update Record' : 'Save Company & Jobs'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 border-2 border-gray-200 rounded-2xl font-bold text-[#111111] hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}




