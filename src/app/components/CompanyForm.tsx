import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Company, Position } from './CompanyCard';

interface CompanyFormProps {
  company?: Company;
  onClose: () => void;
  onSubmit: (company: Partial<Company>) => void;
}

export default function CompanyForm({ company, onClose, onSubmit }: CompanyFormProps) {
  const [companyName, setCompanyName] = useState(company?.company_name || '');
  const [stage, setStage] = useState(company?.stage || 'initiation');
  const [priority, setPriority] = useState(company?.priority || 'medium');
  const [primaryContactName, setPrimaryContactName] = useState(company?.primary_contact_name || '');
  const [primaryEmail, setPrimaryEmail] = useState(company?.primary_email || '');
  const [primaryPhone, setPrimaryPhone] = useState(company?.primary_phone || '');
  const [companyWebsite, setCompanyWebsite] = useState(company?.company_website || '');
  const [positions, setPositions] = useState<Partial<Position>[]>(company?.positions || []);

  // Initial Activity Fields (Only for new companies)
  const [activityText, setActivityText] = useState('');
  const [actionOwner, setActionOwner] = useState('');
  const [actionItem, setActionItem] = useState('');
  const [helpRequired, setHelpRequired] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const companyData: any = {
      id: company?.id,
      company_name: companyName,
      stage,
      priority,
      primary_contact_name: primaryContactName,
      primary_email: primaryEmail,
      primary_phone: primaryPhone,
      company_website: companyWebsite,
      positions: positions as Position[],
    };

    // If it's a new company, we might include the initial activity
    if (!company && activityText) {
      companyData.initialActivity = {
        activity_text: activityText,
        action_owner: actionOwner,
        action_item: actionItem,
        help_required: helpRequired,
        date: new Date().toISOString().split('T')[0],
      };
    }

    onSubmit(companyData);
  };

  const addPosition = () => {
    setPositions([...positions, { role: '', description: '' }]);
  };

  const removePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  const updatePosition = (index: number, field: 'role' | 'description', value: string) => {
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-2xl border border-gray-200/50 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-lg border-b border-gray-200/50 p-6 flex items-center justify-between">
          <h2 className="text-2xl" style={{ color: '#142361' }}>
            {company ? 'Edit Company' : 'Add New Company'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" style={{ color: '#142361' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#142361' }}>
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
              placeholder=""
              required
            />
          </div>

          {/* Stage and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as Company['stage'])}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
              >
                <option value="initiation">Initiation</option>
                <option value="planning">Planning</option>
                <option value="execution">Execution</option>
                <option value="monitoring">Monitoring</option>
                <option value="closure">Closure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Company['priority'])}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                Primary Contact Name
              </label>
              <input
                type="text"
                value={primaryContactName}
                onChange={(e) => setPrimaryContactName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                placeholder=""
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                Primary Email
              </label>
              <input
                type="email"
                value={primaryEmail}
                onChange={(e) => setPrimaryEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                placeholder=""
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                Primary Phone
              </label>
              <input
                type="tel"
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                placeholder=""
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#142361' }}>
              Company Website (Optional)
            </label>
            <input
              type="url"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
              placeholder=""
            />
          </div>

          {/* Positions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm" style={{ color: '#142361' }}>
                Open Positions
              </label>
              <button
                type="button"
                onClick={addPosition}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#e0653b' }}
              >
                <Plus className="w-4 h-4" />
                Add Position
              </button>
            </div>

            <div className="space-y-3">
              {positions.map((position, index) => (
                <div key={index} className="p-4 bg-white/50 rounded-xl border border-gray-200/50">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={position.role || ''}
                        onChange={(e) => updatePosition(index, 'role', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white"
                        placeholder=""
                      />
                      <textarea
                        value={position.description || ''}
                        onChange={(e) => updatePosition(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white resize-none"
                        rows={2}
                        placeholder=""
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePosition(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {positions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No positions added yet. Click "Add Position" to get started.
                </p>
              )}
            </div>
          </div>

          {/* Initial Activity (Only for new companies) */}
          {!company && (
            <div className="pt-4 border-t border-gray-200/50 space-y-4">
              <h3 className="text-lg" style={{ color: '#142361' }}>
                Initial Activity Log
              </h3>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                  Activity Box
                </label>
                <textarea
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50 resize-none"
                  rows={3}
                  placeholder=""
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                    Action Item
                  </label>
                  <input
                    type="text"
                    value={actionItem}
                    onChange={(e) => setActionItem(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                    placeholder=""
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#142361' }}>
                  Help Required
                </label>
                <textarea
                  value={helpRequired}
                  onChange={(e) => setHelpRequired(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e0653b] bg-white/50 resize-none"
                  rows={2}
                  placeholder=""
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#e0653b' }}
            >
              {company ? 'Update Company' : 'Create Company'}
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
