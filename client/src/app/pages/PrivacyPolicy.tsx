import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowLeft, Lock, Eye, Database, Server, UserCheck, BarChart3, Key, FileCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#c66e00] selection:text-white">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <img src="/logo/logo.png" alt="UDYOOG Logo" className="w-8 h-8 object-contain" />
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-wide text-gray-900">UDYOOG</span>
                <div className="h-4 w-[1px] bg-gray-300" />
                <span className="text-[10px] font-bold text-gray-500">
                  Career Pathway Ecosystem
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f1e6] border border-[#c66e00]/30 text-[#c66e00] text-xs font-black uppercase tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>Data Protection & Privacy Policy</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#111111] mb-4">
            Privacy Policy & Data Governance
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto font-medium">
            Effective Date: January 1, 2026 • Security Architecture Compliance (ISO/IEC 27001)
          </p>
        </motion.div>

        <div className="space-y-12 text-gray-700 text-sm leading-relaxed border-t border-gray-100 pt-10">
          
          {/* SECTION 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--gold-medium)]" />
              1. Preamble & Scope of Policy
            </h2>
            <p>
              This Privacy Policy details how <strong>UDYOOG</strong> ("Platform", "we", "us") collects, processes, stores, and protects personal, academic, and professional data. We are committed to transparency and stringent data protection standards for all student candidates, faculty coordinators, university administrators, and corporate recruiters.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--gold-medium)]" />
              2. Categories of Information Collected
            </h2>
            <p>To operate our career discovery and placement engine, we collect the following data types:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <h3 className="font-bold text-[#111111] mb-1">A. Personal Identifiers</h3>
                <p className="text-gray-600">Full name, institutional email address, primary contact phone number, roll number/SIF identifier, and profile avatar.</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <h3 className="font-bold text-[#111111] mb-1">B. Academic & Skill Records</h3>
                <p className="text-gray-600">Cumulative GPA (CGPA), semester-wise CGPA trends, department branch, graduation year, verified skills, and portfolio links (GitHub, LinkedIn).</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <h3 className="font-bold text-[#111111] mb-1">C. Application & Placement Logs</h3>
                <p className="text-gray-600">Active job applications, faculty candidate mapping history, shortlist notifications, interview round statuses, and placement outcome logs.</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <h3 className="font-bold text-[#111111] mb-1">D. System & Analytics Logs</h3>
                <p className="text-gray-600">AI interview practice transcripts, readiness index computation metrics, system access logs, and session tokens.</p>
              </div>
            </div>
          </section>

          {/* SECTION 3: ANALYTICS & DATA PROCESSING */}
          <section className="space-y-4 bg-[#fbfbfa] p-6 sm:p-8 rounded-3xl border border-[var(--gold-medium)]/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--gold-gradient)]/10 text-[var(--gold-medium)] rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#111111]">
                  3. Analytics Processing & Algorithm Utilization
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  How Profile Data Is Processed for Placement & Skill Analysis
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed">
              Data collected on UDYOOG is processed dynamically by our analytics engine for the following automated operational purposes:
            </p>

            <ul className="space-y-2 text-xs list-disc pl-5">
              <li>
                <strong>Automated Job Matching & Eligibility Filters:</strong> Student academic records (CGPA, branch, passout year) are matched automatically against employer job posting criteria to instantly determine application eligibility.
              </li>
              <li>
                <strong>Individual Skill Benchmark Analysis:</strong> Verified candidate skills are processed against industry hiring targets (Data Structures, Web/App Dev, SQL/Database, Problem Solving, System Design) to calculate readiness scores and highlight skill gaps.
              </li>
              <li>
                <strong>Aggregated Institutional Reporting:</strong> Student data is aggregated into anonymized statistics displayed on Faculty Dashboards to track department verification rates and placement conversion funnels.
              </li>
              <li>
                <strong>Zero Third-Party Data Selling:</strong> We do <u>NOT</u> sell, lease, or trade personal data or analytics records to advertising brokers or external data aggregators under any circumstances.
              </li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[var(--gold-medium)]" />
              4. Authorized Data Sharing & Recipient Roles
            </h2>
            <p>Information sharing is strictly restricted to authorized entities within the placement workflow:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>Institutional Placement Coordinators:</strong> Faculty members have access to student profiles, CGPA records, and skill details for verification and mapping purposes.
              </li>
              <li>
                <strong>Verified Corporate Recruiters:</strong> Employer accounts receive applicant profiles, contact information, and portfolio links strictly for positions applied to by the candidate.
              </li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <Server className="w-5 h-5 text-[var(--gold-medium)]" />
              5. Data Security, Row-Level Policies & Storage
            </h2>
            <p>
              UDYOOG employs enterprise-grade infrastructure. Database records are secured using Supabase Authentication, SSL/TLS data transmission encryption, and strict database Row-Level Security (RLS) policies ensuring users can only access authorized data slices.
            </p>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[var(--gold-medium)]" />
              6. User Data Rights & Portability
            </h2>
            <p>
              Users retain ownership of their academic profile data. You have the right to inspect your profile records, request correction of inaccurate data, or request profile archiving by contacting your institutional placement administration.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-gray-50 border border-gray-200/60 mt-10">
            <h3 className="font-bold text-[#111111] mb-2">Privacy Officer Contact</h3>
            <p className="text-xs text-gray-500">
              For questions concerning data governance, RLS policies, or compliance, contact our Data Protection Office at <a href="mailto:privacy@udyoog.com" className="text-[var(--gold-medium)] font-bold hover:underline">privacy@udyoog.com</a>.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-xs text-gray-400 font-medium">
        © 2026 UDYOOG. All rights reserved.
      </footer>
    </div>
  );
}
