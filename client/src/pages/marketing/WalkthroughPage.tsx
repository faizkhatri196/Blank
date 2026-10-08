import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Building2,
  Wrench,
  Shield,
  CheckCircle2,
  ChevronRight,
  LogIn,
  Sun,
  Wind,
  Droplet,
  Zap,
  Home as HomeIcon,
  Sparkles,
} from 'lucide-react';
import { ServoraLogo } from '../../components/common/ServoraLogo';

export type WalkthroughRole = 'customer' | 'service' | 'professional';

export const WalkthroughPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Normalize role from search params
  const rawRole = searchParams.get('role')?.toLowerCase() || 'customer';
  const activeRole: WalkthroughRole =
    rawRole === 'service' || rawRole === 'manager'
      ? 'service'
      : rawRole === 'professional' || rawRole === 'technician'
      ? 'professional'
      : 'customer';

  useEffect(() => {
    const titles: Record<WalkthroughRole, string> = {
      customer: 'How Servora Works for Customers | Servora',
      service: 'How Servora Works for Service Businesses | Servora',
      professional: 'How Servora Works for Professionals | Servora',
    };
    document.title = titles[activeRole];

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      const descriptions: Record<WalkthroughRole, string> = {
        customer:
          'See how customers discover verified local services, report problems, and track real-time field progress with Servora.',
        service:
          'See how service businesses manage request queues, review AI diagnostic summaries, and dispatch certified technicians with Servora.',
        professional:
          'See how field service professionals receive qualified jobs, execute trade-specific milestones, and submit verified physical readings with Servora.',
      };
      meta.setAttribute('content', descriptions[activeRole]);
    }
    window.scrollTo(0, 0);
  }, [activeRole]);

  const handleSelectRole = (role: WalkthroughRole) => {
    setSearchParams({ role });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* ── Top Header with Back Navigation ── */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/portals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Servora</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <Link to="/portals" className="hidden sm:flex items-center gap-2">
              <ServoraLogo variant="compact" inverted size="sm" subtitle="How Servora Works" />
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to={
                activeRole === 'customer'
                  ? '/login?portal=customer'
                  : activeRole === 'service'
                  ? '/login?portal=manager'
                  : '/login?portal=technician'
              }
              className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>
                {activeRole === 'customer'
                  ? 'Customer Login'
                  : activeRole === 'service'
                  ? 'Manager Sign In'
                  : 'Technician Sign In'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* ── Role Selector Tabs (3 Separate Roles) ── */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>ROLE-SPECIFIC WALKTHROUGH • NO LOGIN REQUIRED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl max-w-2xl mx-auto shadow-lg">
            {/* Customer Tab */}
            <button
              type="button"
              onClick={() => handleSelectRole('customer')}
              className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeRole === 'customer'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Customer</span>
            </button>

            {/* Service Business Tab */}
            <button
              type="button"
              onClick={() => handleSelectRole('service')}
              className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeRole === 'service'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Service Business</span>
            </button>

            {/* Professional Tab */}
            <button
              type="button"
              onClick={() => handleSelectRole('professional')}
              className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeRole === 'professional'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Professional</span>
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            1. CUSTOMER-ONLY WALKTHROUGH
        ══════════════════════════════════════════════════════════════════ */}
        {activeRole === 'customer' && (
          <div className="space-y-16 animate-in fade-in duration-200">
            {/* Hero Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                Customer Experience Walkthrough
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                How Servora Works for Customers
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Here is exactly what happens when YOU use Servora as a customer.
              </p>
            </div>

            {/* Customer Flow Diagram */}
            <div className="p-5 sm:p-6 bg-slate-900/80 rounded-3xl border border-slate-800 max-w-3xl mx-auto shadow-xl">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold block mb-3 text-center">
                Your Complete Service Journey
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Customer</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Choose Location</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">See Available Services</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Select Service</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Select Problem</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Describe Issue</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-lg">AI Understanding</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Submit Request</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Track Service Status</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg">Service Completed</span>
              </div>
            </div>

            {/* Customer Real Screenshots Walkthrough */}
            <div className="space-y-12">
              {/* Step 1: Location */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    REAL SERVORA CUSTOMER PORTAL
                  </span>
                  <span className="text-slate-400 text-xs">Step 01 • Location First</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/02_location_discovery.png"
                    alt="Customer Location and Coverage Check"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    1. Choose your location
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    The customer starts by providing their location. Servora checks which certified services and providers actively cover that specific area before booking.
                  </p>
                </div>
              </div>

              {/* Step 2: Available Services */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA CUSTOMER PORTAL
                  </span>
                  <span className="text-slate-400 text-xs">Step 02 • Trade Selection</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/03_service_selection.png"
                    alt="Customer Available Services Selection"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    2. See available services
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Servora shows only services genuinely available for your confirmed location (e.g. Solar, AC/HVAC, Plumbing, Electrical, Home Maintenance). You will never see services without active provider coverage.
                  </p>
                </div>
              </div>

              {/* Step 3: Select Problem */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA CUSTOMER PORTAL
                  </span>
                  <span className="text-slate-400 text-xs">Step 03 • Problem Categories</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/04_problem_category_intake.png"
                    alt="Customer Problem Category Selection"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    3. Select the problem you need help with
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Pick from curated problem categories calibrated to your selected trade (e.g. Pipe Leakage, Tap Repair, Drain Blockage) with clear guidance on photo evidence requirements.
                  </p>
                </div>
              </div>

              {/* Step 4: Describe Issue & AI Understanding */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA CUSTOMER PORTAL
                  </span>
                  <span className="text-slate-400 text-xs">Step 04 • Natural Language Intake</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/05_complaint_description.png"
                    alt="Customer Complaint Description Input"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    4. Describe the problem in your own words
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    You don't need to know the engineering diagnosis. Just describe what you are experiencing (e.g. "Water is leaking heavily from pipe below sink").
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    Servora AI structures the request and helps the service team prepare tools before the visit. (The professional performs the actual inspection and repair).
                  </p>
                </div>
              </div>

              {/* Step 5: Track Service Status */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA CUSTOMER PORTAL
                  </span>
                  <span className="text-slate-400 text-xs">Step 05 • Real-Time Tracking</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/15_ticket_tracking_live.png"
                    alt="Customer Live Ticket Tracking"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    5. Follow your service request to completion
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Track your request live across audited status milestones: Request Submitted → Under Review → Professional Assigned → Accepted → On The Way → Arrived / On Site → In Progress → Completed.
                  </p>
                </div>
              </div>
            </div>

            {/* Customer CTA */}
            <div className="p-8 sm:p-10 bg-indigo-950/40 rounded-3xl border border-indigo-900/60 text-center space-y-4">
              <h3 className="text-2xl font-black text-white">
                Ready to request a service?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Explore the Customer Portal directly or sign in with your customer account.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/customer"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <span>Launch Customer Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login?portal=customer"
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-indigo-400" />
                  <span>Customer Login</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            2. SERVICE BUSINESS / MANAGER-ONLY WALKTHROUGH
        ══════════════════════════════════════════════════════════════════ */}
        {activeRole === 'service' && (
          <div className="space-y-16 animate-in fade-in duration-200">
            {/* Hero Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                Service Business Operations Walkthrough
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                How Servora Works for Service Businesses
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Here is exactly what happens when YOU operate Servora as a service business.
              </p>
            </div>

            {/* Manager Flow Diagram */}
            <div className="p-5 sm:p-6 bg-slate-900/80 rounded-3xl border border-slate-800 max-w-3xl mx-auto shadow-xl">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold block mb-3 text-center">
                Operations Management Lifecycle
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Service Request Received</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Manager Reviews Request</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg">AI-Assisted Request Information</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Manager Assigns Professional</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Monitor Service</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Track Status</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-teal-950 text-teal-300 border border-teal-800 rounded-lg">Service Completed</span>
              </div>
            </div>

            {/* Manager Real Screenshots Walkthrough */}
            <div className="space-y-12">
              {/* Step 1: Central Operations Command Center */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    REAL SERVORA MANAGER DASHBOARD
                  </span>
                  <span className="text-slate-400 text-xs">Step 01 • Operations Queue</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/09_manager_command_center.png"
                    alt="Operations Command Center and Ticket Queue"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    1. Central requests queue & ticket triage
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Customer requests arrive into the Operations Command Center categorized by trade, customer locality, SLA priority, and status. Managers filter and inspect tickets across supported trade lines.
                  </p>
                </div>
              </div>

              {/* Step 2: AI-Assisted Request Information */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA MANAGER DASHBOARD
                  </span>
                  <span className="text-slate-400 text-xs">Step 02 • AI Pre-Dispatch Intelligence</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/06_ai_diagnostic_triage.png"
                    alt="AI Diagnostic Hypothesis and Symptoms"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    2. Manager reviews AI-assisted request information
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Managers review AI hypothesis confidence, symptom breakdowns, and probable root causes. This operational context allows dispatchers to triage jobs before allocating trucks and personnel.
                  </p>
                </div>
              </div>

              {/* Step 3: Capability Matching & Assignment */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA MANAGER DASHBOARD
                  </span>
                  <span className="text-slate-400 text-xs">Step 03 • 5-Factor Dispatch Engine</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/10_service_aware_matching.png"
                    alt="5-Factor Capability Dispatch"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    3. Manager assigns qualified professional
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Servora's 5-factor dispatch engine scores technicians by Trade Certification (mandatory gate), equipped tools, locality radius, and shift availability, ensuring only certified staff are assigned.
                  </p>
                </div>
              </div>

              {/* Step 4: Pre-Dispatch Tooling & Safety */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA MANAGER DASHBOARD
                  </span>
                  <span className="text-slate-400 text-xs">Step 04 • Pre-Dispatch Safety Check</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/07_ai_tools_and_safety.png"
                    alt="Recommended Tools and Life-Safety Protocols"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    4. Pre-dispatch equipment & life-safety review
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Managers verify mandatory tools (e.g. pressure gauges, 1000V insulated screwdrivers) and life-safety advisories (e.g. main breaker lockout, stopcock shutoff) before dispatching the technician.
                  </p>
                </div>
              </div>
            </div>

            {/* Manager CTA */}
            <div className="p-8 sm:p-10 bg-amber-950/40 rounded-3xl border border-amber-900/60 text-center space-y-4">
              <h3 className="text-2xl font-black text-white">
                Ready to operate your service business?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Sign in to the Operations Command Center to manage your team, tickets, and service areas.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/login?portal=manager"
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Manager Sign In</span>
                </Link>
                <Link
                  to="/onboarding"
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
                >
                  <span>Register Service Company →</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            3. PROFESSIONAL / TECHNICIAN-ONLY WALKTHROUGH
        ══════════════════════════════════════════════════════════════════ */}
        {activeRole === 'professional' && (
          <div className="space-y-16 animate-in fade-in duration-200">
            {/* Hero Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                Field Professional Operations Walkthrough
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                How Servora Works for Professionals
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Here is exactly what happens when YOU work through Servora as a professional.
              </p>
            </div>

            {/* Professional Flow Diagram */}
            <div className="p-5 sm:p-6 bg-slate-900/80 rounded-3xl border border-slate-800 max-w-3xl mx-auto shadow-xl">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block mb-3 text-center">
                Field Technician Job Lifecycle
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Receive Relevant Job</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Review Job Details</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Accept / Reject</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Travel / Arrive</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg">Perform Service</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Diagnosis / Readings / Photos</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg">Update Status</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-teal-950 text-teal-300 border border-teal-800 rounded-lg">Complete Job</span>
              </div>
            </div>

            {/* Service-Aware Specialized Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <Sun className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="font-bold text-white block">Solar Pro</span>
                <span className="text-[10px] text-slate-400">Voc / PV Strings</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <Wind className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <span className="font-bold text-white block">AC Pro</span>
                <span className="text-[10px] text-slate-400">Delta-T / PSI</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <Droplet className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <span className="font-bold text-white block">Plumber</span>
                <span className="text-[10px] text-slate-400">Joint Pressure</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <span className="font-bold text-white block">Electrician</span>
                <span className="text-[10px] text-slate-400">Voltage / Lockout</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <HomeIcon className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="font-bold text-white block">Home Maint</span>
                <span className="text-[10px] text-slate-400">Tiles / Dampness</span>
              </div>
            </div>

            {/* Professional Real Screenshots Walkthrough */}
            <div className="space-y-12">
              {/* Step 1: Mobile Terminal */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    REAL SERVORA TECHNICIAN TERMINAL
                  </span>
                  <span className="text-slate-400 text-xs">Step 01 • Job Terminal</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/11_technician_job_terminal.png"
                    alt="Technician Mobile Terminal with Assigned Ticket"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    1. Receive relevant job on your terminal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Professionals receive jobs matching their certified trade. The high-contrast terminal displays customer location, fault symptoms, and direct navigation links.
                  </p>
                </div>
              </div>

              {/* Step 2: Milestone Execution */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA TECHNICIAN TERMINAL
                  </span>
                  <span className="text-slate-400 text-xs">Step 02 • Milestone Progression</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/12_field_work_execution.png"
                    alt="Technician Milestone Advancement"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    2. Advance milestones with one tap
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Update your status with one tap on the road: Accepted → On The Way → Arrived / On Site → In Progress → Completed, automatically keeping dispatch and the customer informed.
                  </p>
                </div>
              </div>

              {/* Step 3: Trade Readings & Telemetry */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA TECHNICIAN TERMINAL
                  </span>
                  <span className="text-slate-400 text-xs">Step 03 • Empirical Field Readings</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/13_service_report_readings.png"
                    alt="Field Service Report and Physical Readings"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    3. Record trade-specific physical readings
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Record trade-calibrated empirical readings (e.g. DC Voc voltage for Solar, suction PSI for AC, pipe pressure for Plumbing, voltage for Electrical) and log replaced parts before completion.
                  </p>
                </div>
              </div>

              {/* Step 4: Completion & Verified History */}
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    REAL SERVORA TECHNICIAN TERMINAL
                  </span>
                  <span className="text-slate-400 text-xs">Step 04 • Completed Record</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/14_verified_service_history.png"
                    alt="Verified Service Record and Quality Benchmark"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    4. Complete job and create verified service record
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    The completed job generates a verified digital audit receipt with benchmarked diagnostics, parts warranty tracking, and customer signoff.
                  </p>
                </div>
              </div>
            </div>

            {/* Professional CTA */}
            <div className="p-8 sm:p-10 bg-emerald-950/40 rounded-3xl border border-emerald-900/60 text-center space-y-4">
              <h3 className="text-2xl font-black text-white">
                Ready to work as a service pro?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Sign in to your mobile technician terminal to access assigned tickets and navigation.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/login?portal=technician"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Technician Sign In</span>
                </Link>
                <Link
                  to="/technician/dashboard"
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
                >
                  <span>Open Technician Terminal →</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
        <p>© {new Date().getFullYear()} Servora Technologies. All rights reserved. Field Service Operations Platform.</p>
        <p className="text-[11px] text-slate-600">
          Real screenshots captured from Servora production environments. No mockups or stock photos.
        </p>
      </footer>
    </div>
  );
};
