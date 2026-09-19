import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MapPin,
  ClipboardList,
  Wrench,
  Building2,
  User,
  Radio,
  Clock,
  FileCheck2,
  Star,
  ChevronRight,
  PlayCircle,
  LogIn,
} from 'lucide-react';
import { ProductWalkthrough } from '../../components/walkthrough/ProductWalkthrough';

export const WalkthroughPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'SERVORA Product Walkthrough | AI-Powered Field Service Operations';
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'See how SERVORA connects customers, managers, and field service professionals from service request to completion.'
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link to="/portals" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1">
                SERVORA
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block sm:inline sm:ml-1.5 sm:border-l sm:border-slate-800 sm:pl-1.5">
                Product Walkthrough
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              to="/portals"
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors hidden sm:inline-block px-3 py-1.5"
            >
              Back to Portals
            </Link>
            <Link
              to="/login"
              className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Start Testing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16 sm:space-y-20">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <PlayCircle className="w-4 h-4" />
            <span>End-to-End Operational Lifecycle</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            See how a service request moves through SERVORA.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            From the first customer location check to field technician execution and AI verification, experience how SERVORA connects the entire service operation.
          </p>
        </section>

        {/* Video Player Component */}
        <section className="max-w-4xl mx-auto w-full">
          <ProductWalkthrough showChapters={true} />
        </section>

        {/* What You'll See Section */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              What you'll see in the workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              The exact 6-step lifecycle executed during real testing in the deployed software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Step 01 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-black text-indigo-400 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                    01
                  </span>
                  <MapPin className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Customer Request
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  The customer enters their service location. SERVORA checks which certified services are actually available in that specific city or pin.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Location-first availability check</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Problem catalog & photo upload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>AI-assisted triage explanation</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-black text-amber-400 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                    02
                  </span>
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Manager Operations
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  The company operations manager receives the request instantly, examines the AI triage breakdown, and dispatches an available professional.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Instant dispatch dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>AI urgency & required parts review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Single-click technician assignment</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-black text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    03
                  </span>
                  <Wrench className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Technician Execution
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  The field technician accepts the job on their mobile terminal and progresses step-by-step through the formal execution state machine.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Accepted → On The Way → On Site</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Electrical readings & multimeter logs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Work closeout photo report</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 04 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-black text-blue-400 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                    04
                  </span>
                  <Radio className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Field Operations & Telemetry
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Managers monitor active field fleet progress and live location telemetry. Coordinate freshness is strictly categorized to prevent stale data.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Freshness tiers: Fresh, Warm, Stale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>No stale coordinates called "Live"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Real-time ETA and travel updates</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 05 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-black text-purple-400 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
                    05
                  </span>
                  <FileCheck2 className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Completion & Ground Truth
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Once repairs conclude, SERVORA records actual field findings and allows managers to compare initial AI predictions with physical reality.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>Immutable field completion log</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>AI Prediction vs. Actual field audit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>Parts consumed & labor validation</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 06 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-black text-yellow-400 px-2.5 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                    06
                  </span>
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Customer Feedback
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Customers follow technician milestones in real-time and provide star ratings and written reviews upon job completion.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Privacy-safe tracking interface</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Internal notes & match scores hidden</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Direct customer rating & review</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testing Flow Quick Guide */}
        <section className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400">
              Tester Roadmap
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Testing flow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              The operational pipeline you will experience during manual testing:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-2.5 text-xs font-semibold">
            {[
              'Customer',
              'Select Location',
              'Select Available Service',
              'Create Request',
              'Manager Reviews',
              'Manager Assigns Technician',
              'Technician Executes Service',
              'Customer Tracks Progress',
              'Service Completed',
              'Customer Feedback',
            ].map((step, idx, arr) => (
              <React.Fragment key={step}>
                <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                  {step}
                </span>
                {idx < arr.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Role-Based Explanation Cards */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Role-Based Workspaces
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              SERVORA provides three distinct, specialized portals. Each role sees only what they need to operate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Role */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">CUSTOMER</h3>
                <p className="text-xs font-semibold text-indigo-400 mb-4">
                  Request and track service.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Location',
                    'Service discovery',
                    'Problem selection',
                    'Photos',
                    'AI understanding',
                    'Request tracking',
                    'Feedback',
                  ].map((feat) => (
                    <span
                      key={feat}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Manager Role */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">MANAGER</h3>
                <p className="text-xs font-semibold text-amber-400 mb-4">
                  Operate your service business.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Requests',
                    'Dispatch',
                    'Technicians',
                    'Active field operations',
                    'Coverage',
                    'Service history',
                    'AI vs Actual',
                    'Feedback',
                  ].map((feat) => (
                    <span
                      key={feat}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Technician Role */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">TECHNICIAN</h3>
                <p className="text-xs font-semibold text-emerald-400 mb-4">
                  Execute service in the field.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Assigned jobs',
                    'Job status',
                    'Location',
                    'Diagnosis',
                    'Photos',
                    'Readings',
                    'Parts',
                    'Service report',
                  ].map((feat) => (
                    <span
                      key={feat}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tester Call to Action */}
        <section className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ready to test SERVORA?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Experience the complete customer → manager → technician workflow with active accounts in the deployed environment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Start Testing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/portals"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <span>Back to SERVORA Portals</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SERVORA. Enterprise Field Service Operations Infrastructure.</p>
      </footer>
    </div>
  );
};
