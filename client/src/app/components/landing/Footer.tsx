import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, ShieldCheck, Lock, Users, CheckCircle, Database, Server, UserCheck, BarChart3 } from 'lucide-react';
import { footerData, navbarData } from '../../lib/landingData';

export default function Footer() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="bg-white text-black py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand & Tagline Column */}
          <div className="md:col-span-5 space-y-6">
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <img src="/logo/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
              <span className="text-2xl font-black tracking-wider text-black uppercase">{navbarData.brandName}</span>
              <div className="h-6 w-[1.5px] bg-gray-200 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-1 text-[12px] font-bold">
                <span className="text-gray-400">by</span>
                <span className="text-[var(--gold-medium)] font-black tracking-wider uppercase">
                  NARAATRAL
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-black text-gray-800">
              {footerData.tagline}
            </h3>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed max-w-sm">
              {footerData.description}
            </p>
          </div>

          {/* Links Column 1: Platform */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-black">
              {footerData.columns.platform.title}
            </h4>
            <ul className="space-y-3">
              {footerData.columns.platform.links.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-sm font-semibold text-gray-500 hover:text-black transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Account */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-black">
              {footerData.columns.account.title}
            </h4>
            <ul className="space-y-3">
              {footerData.columns.account.links.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-sm font-semibold text-gray-500 hover:text-black transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3: Support */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-black">
              {footerData.columns.support.title}
            </h4>
            <ul className="space-y-3">
              {footerData.columns.support.links.map((link, idx) => {
                const isTerms = link.path === '/terms-of-service' || link.label.toLowerCase().includes('terms');
                const isPrivacy = link.path === '/privacy-policy' || link.label.toLowerCase().includes('privacy');

                return (
                  <li key={idx}>
                    {isTerms ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveModal('terms');
                        }}
                        className="text-sm font-semibold text-gray-500 hover:text-black transition-colors cursor-pointer text-left"
                      >
                        {link.label}
                      </button>
                    ) : isPrivacy ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveModal('privacy');
                        }}
                        className="text-sm font-semibold text-gray-500 hover:text-black transition-colors cursor-pointer text-left"
                      >
                        {link.label}
                      </button>
                    ) : link.path ? (
                      <button
                        type="button"
                        onClick={() => navigate(link.path)}
                        className="text-sm font-semibold text-gray-500 hover:text-black transition-colors cursor-pointer text-left"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <span className="text-sm font-semibold text-gray-500 hover:text-black cursor-pointer transition-colors">
                        {link.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-400">
          <div>{footerData.copyright}</div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500">{footerData.designedBy}</div>
        </div>
      </footer>

      {/* POP-UP BOX MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
              {/* Modal Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveModal(null)}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999]"
              />

              {/* Modal Content Window */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 z-[10000]"
              >
                {/* Modal Header */}
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#f4f1e6] border border-[#c66e00]/30 rounded-xl text-[var(--gold-medium)]">
                      {activeModal === 'terms' ? <FileText className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-[#111111]">
                        {activeModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                      </h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                        UDYOOG Ecosystem
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-2 rounded-xl text-gray-400 hover:text-[#111111] hover:bg-gray-200/60 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-gray-700 leading-relaxed">
                  {activeModal === 'terms' ? (
                    <>
                      <section className="space-y-2">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[var(--gold-medium)]" />
                          1. Platform Overview & Scope
                        </h3>
                        <p>
                          Welcome to <strong>UDYOOG</strong>, an integrated university placement and career operating system. By accessing or using the platform, student candidates, faculty coordinators, and corporate recruiters agree to these terms.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <Users className="w-4 h-4 text-[var(--gold-medium)]" />
                          2. User Account Classifications & Integrity
                        </h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Student Accounts:</strong> Must ensure 100% accuracy of CGPA, semester marks, verified skills, and academic registration credentials. Falsification will result in account revocation.</li>
                          <li><strong>Faculty & Coordinators:</strong> Responsible for verifying student skills, managing placement drives, and mapping candidates.</li>
                          <li><strong>Employers:</strong> Must list genuine opportunities and adhere to fair hiring standards.</li>
                        </ul>
                      </section>

                      <section className="space-y-3 bg-[#fbfbfa] p-5 rounded-2xl border border-[var(--gold-medium)]/30">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[var(--gold-medium)]" />
                          3. Analytics, Evaluation Methodology & Algorithms
                        </h3>
                        <p className="text-xs">
                          UDYOOG processes profile records dynamically to compute student readiness and placement statistics:
                        </p>
                        <div className="space-y-2 text-xs text-gray-600">
                          <p><strong>• Profile Readiness Score (%):</strong> Dynamically computed across 7 profile parameters (Name, Phone, Graduation Year, Branch, GitHub, LinkedIn, Verified Skills).</p>
                          <p><strong>• Industry Skill Benchmark Engine:</strong> Measures candidate competency in Data Structures, Web Dev, SQL, Problem Solving, and System Design against target hiring standards (65%–85%).</p>
                          <p><strong>• Automated Eligibility Filters:</strong> Real-time automated criteria checks comparing student CGPA and branch against company job requirements.</p>
                          <p><strong>• Institutional Metrics:</strong> Aggregates department-wise skill verification and hiring funnel statistics for faculty coordinators.</p>
                        </div>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[var(--gold-medium)]" />
                          4. Application Limits & Mapping Protocols
                        </h3>
                        <p>
                          Candidates are permitted a maximum of <strong>3 active pending job applications</strong> at a time to prevent candidate hoarding. Faculty candidate recommendations remain subject to final employer shortlisting.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[var(--gold-medium)]" />
                          5. Intellectual Property
                        </h3>
                        <p>
                          All platform code, user interface designs, AI preparation features, and logos are the sole intellectual property of UDYOOG by NARAATRAL. Data scraping or reverse-engineering is strictly prohibited.
                        </p>
                      </section>
                    </>
                  ) : (
                    <>
                      <section className="space-y-2">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[var(--gold-medium)]" />
                          1. Our Privacy Commitment
                        </h3>
                        <p>
                          At <strong>UDYOOG</strong>, we safeguard all student academic metrics, faculty logs, and recruiter details with privacy standards.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <Database className="w-4 h-4 text-[var(--gold-medium)]" />
                          2. Categories of Information Collected
                        </h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Identity & Contact:</strong> Full name, institutional email, phone, roll number/SIF.</li>
                          <li><strong>Academic Metrics:</strong> CGPA, branch, graduation year, verified skills, and portfolio links.</li>
                          <li><strong>Applications & Logs:</strong> Applied drives, candidate mapping logs, and AI interview prep transcripts.</li>
                        </ul>
                      </section>

                      <section className="space-y-2 bg-[#fbfbfa] p-5 rounded-2xl border border-[var(--gold-medium)]/30">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[var(--gold-medium)]" />
                          3. How Data & Analytics Are Used
                        </h3>
                        <p className="text-xs">
                          Profile data is utilized for automated job matching, skill gap analysis, and faculty department reports. <strong>We NEVER sell or monetize user data to third parties.</strong>
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <Server className="w-4 h-4 text-[var(--gold-medium)]" />
                          4. Data Security & Row-Level Access
                        </h3>
                        <p>
                          Database records are protected using Supabase Authentication, SSL encryption, and Row-Level Security (RLS) policies.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-extrabold text-[#111111] text-base flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-[var(--gold-medium)]" />
                          5. User Data Rights
                        </h3>
                        <p>
                          Users maintain full ownership over their profiles and may inspect, update, or request removal of their records via institutional coordinators.
                        </p>
                      </section>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

