import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Briefcase, MapPin, IndianRupee, Clock, FileText, Users, Sparkles, Building2, ChevronDown } from 'lucide-react';
import type { Company, Position } from './CompanyCard';

interface CompanyFormProps {
  company?: Company;
  existingCompanies?: { id: string; name: string }[];
  isJobOnly?: boolean;
  onClose: () => void;
  onSubmit: (company: Partial<Company>) => void;
}

export default function CompanyForm({ company, existingCompanies, isJobOnly, onClose, onSubmit }: CompanyFormProps) {
  const [mounted, setMounted] = useState(false);
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

        {/* Form Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-4xl max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col z-[10000] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs flex items-center justify-center">
                {isJobOnly ? (
                  <Briefcase className="w-6 h-6 text-[var(--gold-medium)]" />
                ) : (
                  <Building2 className="w-6 h-6 text-[var(--gold-medium)]" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {isJobOnly ? 'Add Job Roles to Company' : company ? 'Edit Company Profile' : 'Initialize New Company'}
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {isJobOnly ? 'Expand active opportunities for registered partners' : 'Corporate Engagement & Talent Management'}
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

          {/* Scrollable Form Content */}
          <form id="company-form" onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
            
            {isJobOnly ? (
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-xs uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  Target Company Selection
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Select Company <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none appearance-none cursor-pointer bg-white font-medium text-gray-800 transition-all shadow-xs pr-10"
                      required
                    >
                      <option value="">Choose a company from existing records...</option>
                      {existingCompanies?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {!existingCompanies?.length && (
                    <p className="text-xs text-red-500 mt-1 font-semibold italic">No active companies found. Please create a company first.</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Section 1: Core Company Info */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
                    <Building2 className="w-4 h-4" />
                    Core Company Details
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">Company Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none font-medium text-gray-800 transition-all shadow-xs"
                        placeholder="e.g. Google India"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">Official Website</label>
                      <input
                        type="url"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none font-medium text-gray-800 transition-all shadow-xs"
                        placeholder="https://company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">Engagement Stage</label>
                      <div className="relative">
                        <select
                          value={stage}
                          onChange={(e) => setStage(e.target.value as any)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none appearance-none cursor-pointer bg-white font-medium text-gray-800 transition-all shadow-xs pr-10"
                        >
                          <option value="initiation">Initiation</option>
                          <option value="planning">Planning</option>
                          <option value="execution">Execution</option>
                          <option value="monitoring">Monitoring</option>
                          <option value="closure">Closure</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">Priority Level</label>
                      <div className="relative">
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none appearance-none cursor-pointer bg-white font-medium text-gray-800 transition-all shadow-xs pr-10"
                        >
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact Person */}
                <div className="space-y-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
                    <Users className="w-4 h-4" />
                    Primary Contact Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">Contact Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={primaryContactName}
                        onChange={(e) => setPrimaryContactName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none font-medium text-gray-800 transition-all shadow-xs"
                        placeholder="e.g. Jane Doe"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">Email Address <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={primaryEmail}
                        onChange={(e) => setPrimaryEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none font-medium text-gray-800 transition-all shadow-xs"
                        placeholder="jane@company.com"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">Phone Number</label>
                      <input
                        type="tel"
                        value={primaryPhone}
                        onChange={(e) => setPrimaryPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none font-medium text-gray-800 transition-all shadow-xs"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Section 3: Action Items */}
            <div className="space-y-4 bg-gray-50/80 border border-gray-200/70 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                Scheduling & Next Action Item
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Action Date</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold flex items-center gap-2 shadow-xs text-sm">
                    <Clock className="w-4 h-4 text-[var(--gold-medium)] shrink-0" />
                    {today}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Action Description</label>
                  <input
                    type="text"
                    value={actionItem}
                    onChange={(e) => setActionItem(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none font-medium text-gray-800 transition-all shadow-xs text-sm"
                    placeholder="e.g. Follow up on interview shortlists"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Jobs Management */}
            <div className="space-y-5 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-xs uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" />
                  Job Openings ({positions.length})
                </div>
                <button
                  type="button"
                  onClick={addPosition}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111111] text-white rounded-xl text-xs font-bold hover:bg-gray-800 shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Role
                </button>
              </div>

              <div className="space-y-4">
                {positions.map((pos, idx) => (
                  <div key={idx} className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-4 hover:border-[var(--gold-medium)]/40 transition-all">
                    {/* Role Header Bar */}
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm text-gray-900">
                          {pos.role || 'New Opportunity'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removePosition(idx)}
                        className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-semibold border border-red-200/60"
                        title="Remove role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={pos.role}
                          onChange={(e) => updatePosition(idx, 'role', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[var(--gold-medium)] outline-none text-sm font-medium text-gray-900"
                          placeholder="e.g. Software Engineer Intern"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Opening Status</label>
                        <div className="relative">
                          <select
                            value={pos.status}
                            onChange={(e) => updatePosition(idx, 'status', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[var(--gold-medium)] outline-none appearance-none cursor-pointer text-sm font-medium text-gray-900 pr-9"
                          >
                            <option value="open">Open</option>
                            <option value="hold">On Hold</option>
                            <option value="close">Closed</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" /> Location
                        </label>
                        <input
                          type="text"
                          value={pos.location}
                          onChange={(e) => updatePosition(idx, 'location', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[var(--gold-medium)] outline-none text-sm font-medium text-gray-900"
                          placeholder="e.g. Bangalore / Remote"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5 text-gray-400" /> Stipend / CTC
                        </label>
                        <input
                          type="text"
                          value={pos.salary}
                          onChange={(e) => updatePosition(idx, 'salary', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[var(--gold-medium)] outline-none text-sm font-medium text-gray-900"
                          placeholder="e.g. ₹25,000/mo or 8 LPA"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-gray-400" /> Description
                      </label>
                      <textarea
                        value={pos.description}
                        onChange={(e) => updatePosition(idx, 'description', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[var(--gold-medium)] outline-none text-sm font-medium text-gray-900 resize-none"
                        rows={2}
                        placeholder="Key responsibilities and qualifications required..."
                      />
                    </div>
                  </div>
                ))}
                {positions.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
                    No active job roles specified. Click "Add Role" above to attach opportunities.
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Initial Activity (Only for new companies) */}
            {!company && !isJobOnly && (
              <div className="space-y-5 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-[var(--gold-medium)] font-bold text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
                  <Sparkles className="w-4 h-4" />
                  Initial Activity Log
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">Activity Summary</label>
                    <input
                      type="text"
                      value={activityText}
                      onChange={(e) => setActivityText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none font-medium text-gray-800 transition-all shadow-xs"
                      placeholder="e.g. Initial reach out call completed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">Action Owner</label>
                    <input
                      type="text"
                      value={actionOwner}
                      onChange={(e) => setActionOwner(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--gold-medium)] focus:border-transparent outline-none font-medium text-gray-800 transition-all shadow-xs"
                      placeholder="e.g. Admin / HR Lead"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Sticky Footer Bar */}
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
              form="company-form"
              className="px-8 py-2.5 bg-[var(--gold-medium)] text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              style={{ background: 'var(--gold-gradient)' }}
            >
              {isJobOnly ? 'Add Job Roles' : company ? 'Update Company' : 'Save Company Record'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
