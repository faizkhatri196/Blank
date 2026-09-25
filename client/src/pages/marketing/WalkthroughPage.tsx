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
import { FAQAccordion } from '../../components/common/FAQAccordion';
import { ServoraLogo } from '../../components/common/ServoraLogo';

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
            <ServoraLogo variant="compact" inverted size="sm" subtitle="Product Walkthrough" />
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
            <span>3-Minute Y Combinator Demo Walkthrough</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            See how a service request moves through SERVORA in 3 minutes.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Experience the complete closed-loop lifecycle across all 3 personas: Customer Intake in Mandvi &bull; Manager 5-Factor Dispatch &bull; Field Technician Mobile Execution &bull; AI Ground-Truth Audit.
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

        {/* All 3 Core Dashboards: Professional Operational Walkthrough & Manual Testing Guide */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Role Isolation & Workflows</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              All 3 Core Dashboards Explained
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              SERVORA isolates operational capabilities into three distinct environments. Use the manual testing credentials below to experience the real software from each perspective.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Operations Manager Dashboard */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:border-amber-500/40 transition-all space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    Command Suite
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Operations Manager
                  </h3>
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">
                    Control Room & Central Dispatch
                  </p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Designed for operations leaders and dispatchers to triage incoming repair orders, dispatch qualified staff, and track field fleet execution in real time.
                  </p>
                </div>

                {/* Workflow Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">1</span>
                    <span><strong>Live Ticket Ingestion:</strong> Incoming requests appear instantly with AI fault structuring and severity rank.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">2</span>
                    <span><strong>5-Factor Dispatch:</strong> Match engine ranks technicians by proximity, skills, toolkit, and route workload.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">3</span>
                    <span><strong>Live Fleet Telemetry:</strong> View technician locations with validated coordinate freshness (Fresh, Warm, Stale).</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">4</span>
                    <span><strong>AI vs. Actual Audit:</strong> Compare initial AI predictions against physical field report multimeter readings.</span>
                  </div>
                </div>

                {/* Enterprise Access Badge */}
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between text-slate-400">
                  <span className="font-mono text-[11px]">Access Level</span>
                  <span className="text-amber-400 font-bold text-[11px] uppercase tracking-wider">Operations Command</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <Link
                  to="/manager/dashboard"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Launch Manager Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login?portal=manager"
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <span>Manager Sign In</span>
                </Link>
              </div>
            </div>

            {/* 2. Field Technician Mobile Terminal */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:border-emerald-500/40 transition-all space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    Field Terminal
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Field Technician
                  </h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    Mobile Execution & Diagnostics
                  </p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    High-contrast mobile interface for engineers on the road to navigate assigned jobs, follow diagnostic checklists, and log proof of work.
                  </p>
                </div>

                {/* Workflow Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">1</span>
                    <span><strong>Job Notification & Map:</strong> Receive instant dispatch alert with customer address and navigation links.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">2</span>
                    <span><strong>Strict Status Milestones:</strong> Single-tap progression: Accepted → On The Way → On Site with timestamp audit.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">3</span>
                    <span><strong>Technical Readings Log:</strong> Enter real electrical and pressure measurements (e.g. Voc voltage, refrigerant PSI).</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">4</span>
                    <span><strong>Photo Evidence & Signoff:</strong> Upload before-and-after photographic evidence to generate digital report.</span>
                  </div>
                </div>

                {/* Enterprise Access Badge */}
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between text-slate-400">
                  <span className="font-mono text-[11px]">Access Level</span>
                  <span className="text-emerald-400 font-bold text-[11px] uppercase tracking-wider">Field Engineer Mobile</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <Link
                  to="/technician/dashboard"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Launch Technician Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login?portal=technician"
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <span>Technician Sign In</span>
                </Link>
              </div>
            </div>

            {/* 3. Customer Portal & Tracking */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:border-indigo-500/40 transition-all space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                    Customer Experience
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Customer Portal
                  </h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                    Self-Service Discovery & Live Tracking
                  </p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Designed for facility owners and homeowners to book certified Solar & AC services, view technician progress, and access repair history.
                  </p>
                </div>

                {/* Workflow Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">1</span>
                    <span><strong>Location-First Discovery:</strong> Enter locality or use GPS. SERVORA checks coverage before showing service lines.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">2</span>
                    <span><strong>Transparent AI Triage:</strong> Customer picks visual symptom card; AI explains how the operations team interprets it.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">3</span>
                    <span><strong>Real-Time Tracking & SLA:</strong> Follow status milestones with ETA and masked company contact (protecting privacy).</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">4</span>
                    <span><strong>Verified Closeout & Review:</strong> Inspect digital completion report with photo evidence and submit rating.</span>
                  </div>
                </div>

                {/* Enterprise Access Badge */}
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between text-slate-400">
                  <span className="font-mono text-[11px]">Access Level</span>
                  <span className="text-indigo-400 font-bold text-[11px] uppercase tracking-wider">Client & Facility Portal</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <Link
                  to="/customer"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Launch Customer Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login?portal=customer"
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <span>Customer Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Platform FAQ */}
        <section className="pt-4">
          <FAQAccordion />
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
