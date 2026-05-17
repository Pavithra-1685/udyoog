import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Archive as ArchiveIcon, RotateCcw, Loader2 } from 'lucide-react';
import Navigation from '../../components/shared/Navigation';
import CompanyCard, { type Company } from '../../components/admin/CompanyCard';
import { supabase } from '../../../lib/supabase';
import { toast, Toaster } from 'sonner';

export default function Archive() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [archivedCompanies, setArchivedCompanies] = useState<Company[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchArchivedCompanies = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*, positions(*), activities(*)')
        .eq('stage', 'closure')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArchivedCompanies(data || []);
      setCompanies(data || []);
    } catch (error: any) {
      toast.error('Failed to load archive: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedCompanies();
  }, []);

  const handleRestore = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ stage: 'planning' })
        .eq('id', companyId);

      if (error) throw error;
      
      toast.success('Company restored!');
      fetchArchivedCompanies();
    } catch (error: any) {
      toast.error('Restore failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <ArchiveIcon className="w-8 h-8" style={{ color: '#142361' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#142361' }}>
              Archived Records
            </h1>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-[#e0653b] mb-4" />
              <p className="text-gray-500 font-medium italic">Loading archive...</p>
            </div>
          ) : archivedCompanies.length === 0 ? (
            <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
              <ArchiveIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl mb-3" style={{ color: '#142361' }}>
                No Archived Records
              </h2>
              <p className="text-gray-600">
                Closed records will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {archivedCompanies.map((company) => (
                <div 
                  key={company.id} 
                  className="bg-gray-50/50 rounded-2xl border border-gray-200 overflow-hidden"
                >
                  <CompanyCard
                    company={company}
                    onEdit={() => {}}
                    onAddActivity={() => {}}
                  />
                  <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleRestore(company.id)}
                      className="flex items-center gap-2 px-6 py-2 rounded-xl text-white transition-all hover:opacity-90 shadow-md"
                      style={{ backgroundColor: '#10b981' }}
                    >
                      <RotateCcw className="w-5 h-5" />
                      Restore to Pathway
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
