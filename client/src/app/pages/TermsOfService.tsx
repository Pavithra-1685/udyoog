import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowLeft, FileText, Lock, Users, CheckCircle, BarChart3, Cpu, AlertCircle, Scale } from 'lucide-react';

export default function TermsOfService() {
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
            <FileText className="w-3.5 h-3.5" />
            <span>Official Legal Document</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#111111] mb-4">
            Terms of Service & Platform Agreement
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto font-medium">
            Effective Date: January 1, 2026 • Document Ref: LEGAL-TOS-2026-V3
          </p>
        </motion.div>

        <div className="space-y-12 text-gray-700 text-sm leading-relaxed border-t border-gray-100 pt-10">
          
          {/* SECTION 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--gold-medium)]" />
              1. Definitions & Legal Interpretation
            </h2>
            <p>
              This Terms of Service ("Agreement") constitutes a legally binding contract governing the access and usage of the <strong>UDYOOG</strong> platform ("Platform", "System", "we", "us").
            </p>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/60 space-y-2 text-xs">
              <p><strong>"Student User":</strong> Any enrolled candidate registered on the platform to build portfolios, discover career opportunities, and participate in placement drives.</p>
              <p><strong>"Faculty / Administrator":</strong> Institutional coordinators authorized to verify student skill credentials, manage drives, and view placement performance analytics.</p>
              <p><strong>"Recruiter / Employer":</strong> Authorized corporate representatives listing hiring drives, filtering candidate criteria, and extending employment offers.</p>
              <p><strong>"Analytics Engine":</strong> The computational system evaluating student readiness, CGPA trends, domain benchmarks, and eligibility criteria.</p>
            </div>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--gold-medium)]" />
              2. User Account Classifications & Integrity Guidelines
            </h2>
            <p>
              Access to UDYOOG is conditional upon strict compliance with role-specific obligations:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>Student Academic Integrity:</strong> Students warrant that all profile data—including Cumulative Grade Point Average (CGPA), semester grade history, branch designation, registration numbers, and technical skills—is 100% accurate and verifiable. Falsification of academic records will result in permanent platform ban and reporting to university administration.
              </li>
              <li>
                <strong>Faculty Authorization:</strong> Faculty accounts must restrict candidate mapping and skill verification strictly to verified institutional credentials.
              </li>
              <li>
                <strong>Recruiter Compliance:</strong> Employers must list legitimate internship and job opportunities adhering to equal opportunity hiring principles.
              </li>
            </ul>
          </section>

          {/* SECTION 3: ANALYTICS & COMPUTATION DISCLOSURE */}
          <section className="space-y-4 bg-[#fbfbfa] p-6 sm:p-8 rounded-3xl border border-[var(--gold-medium)]/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--gold-gradient)]/10 text-[var(--gold-medium)] rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#111111]">
                  3. Analytics, Evaluation Methodology & Algorithms
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Mandatory Disclosure of How Platform Analytics Are Calculated
                </p>
              </div>
            </div>

            <p>
              UDYOOG utilizes a real-time data engine to calculate student readiness, domain competencies, and institutional placement statistics. Users acknowledge and consent to the following computational methodologies:
            </p>

            <div className="space-y-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h3 className="font-extrabold text-[#111111] text-sm mb-1 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[var(--gold-medium)]" />
                  3.1 Profile Readiness Index Calculation
                </h3>
                <p>
                  The overall <strong>Readiness Score (%)</strong> is dynamically computed by evaluating profile completeness across 7 key parameters: Full Name, Phone Number, Graduation Year, Department Branch, GitHub Portfolio Link, LinkedIn Profile, and at least one Verified Technical Skill. Each completed parameter contributes to the cumulative readiness percentage displayed on student and faculty dashboards.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h3 className="font-extrabold text-[#111111] text-sm mb-1 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  3.2 Industry Skill Benchmark & Gap Analysis Engine
                </h3>
                <p className="mb-2">
                  The Industry Skill Benchmark graph evaluates candidate proficiency against standardized corporate hiring targets (Data Structures: 80%, Web/App Dev: 75%, SQL/Database: 70%, Problem Solving: 85%, System Design: 65%). Candidate scores are computed dynamically:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                  <li><strong>Data Structures:</strong> Evaluated at 85% if profile contains DSA/Data Structures skills; baseline 55%.</li>
                  <li><strong>Web / App Dev:</strong> Evaluated at 90% if profile contains React, JavaScript, or Web frameworks; baseline 45%.</li>
                  <li><strong>Database & SQL:</strong> Evaluated at 80% if profile contains SQL or Database skills; baseline 40%.</li>
                  <li><strong>Problem Solving:</strong> Evaluated at 88% if candidate possesses more than 3 verified skills; baseline 50%.</li>
                  <li><strong>System Design:</strong> Evaluated at 82% if candidate possesses at least one Expert-level skill; baseline 35%.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h3 className="font-extrabold text-[#111111] text-sm mb-1 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  3.3 Automated Eligibility Check Engine
                </h3>
                <p>
                  When a student views or applies for a placement drive, the system executes an instant eligibility check matching the candidate's CGPA, branch, and graduation year against the company's specified requirements. Application access is restricted automatically if criteria are not met.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h3 className="font-extrabold text-[#111111] text-sm mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  3.4 Institutional & Department Readiness Analytics
                </h3>
                <p>
                  Faculty Control Centers aggregate anonymized student data to calculate department-wise skill verification rates, branch readiness breakdowns (CSE, AI & DS, ECE, EEE/Mech), and placement pipeline conversion rates.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[var(--gold-medium)]" />
              4. Application Rules & Candidate Mapping Protocols
            </h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>Application Cap:</strong> To prevent candidate hoarding and ensure fair access, student accounts are restricted to a maximum of <strong>3 active pending job applications</strong> at any given time.
              </li>
              <li>
                <strong>Mapping Rights:</strong> Faculty candidate mapping creates an institutional recommendation. Final shortlisting remains at the sole discretion of the hiring company.
              </li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[var(--gold-medium)]" />
              5. Intellectual Property Rights
            </h2>
            <p>
              All software code, database architecture, user interface components, analytics algorithms, and branding assets of UDYOOG are the exclusive intellectual property of the platform operators. Data scraping, automated bot indexing, or unauthorized reverse-engineering is strictly prohibited under applicable cyber law.
            </p>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[var(--gold-medium)]" />
              6. Limitation of Liability & Warranties
            </h2>
            <p>
              UDYOOG provides placement workflow tools and analytics for educational and recruitment facilitation. While we strive for 100% platform uptime and accurate analytics computation, UDYOOG does not guarantee employment outcomes or offer guarantees for candidate selection.
            </p>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#111111]">
              7. Governing Law & Amendments
            </h2>
            <p>
              This Agreement shall be governed by and construed in accordance with applicable laws. We reserve the right to modify these terms periodically. Continued platform usage following published updates constitutes acceptance of revised terms.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-gray-50 border border-gray-200/60 mt-10">
            <h3 className="font-bold text-[#111111] mb-2">Legal Support Contact</h3>
            <p className="text-xs text-gray-500">
              For formal legal notices or questions regarding our analytics engine disclosures, email our legal team at <a href="mailto:legal@udyoog.com" className="text-[var(--gold-medium)] font-bold hover:underline">legal@udyoog.com</a>.
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
