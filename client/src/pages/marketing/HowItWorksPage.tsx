import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Sparkles,
  Shield,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Wrench,
  Building2,
  Clock,
  Compass,
  Zap,
  Sun,
  Wind,
  Droplet,
  Home as HomeIcon,
  Layers,
  Users,
  Check,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
} from 'lucide-react';
import { ServoraLogo } from '../../components/common/ServoraLogo';

export const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'How Servora Works | Real Product Walkthrough';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'See how Servora connects customer requests, location-first discovery, AI preparation, capability dispatch, and field execution in one operational workflow.'
      );
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* ── Top Header ── */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link to="/customer" className="flex items-center gap-2.5">
            <ServoraLogo variant="compact" inverted size="sm" subtitle="How Servora Works" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/customer"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors hidden sm:inline-block px-3 py-1.5"
            >
              Customer Portal
            </Link>
            <Link
              to="/walkthrough"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors hidden sm:inline-block px-3 py-1.5"
            >
              Interactive HUD
            </Link>
            <Link
              to="/customer"
              className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Explore Servora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center border-b border-slate-900">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-xs font-semibold mb-6">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>REAL SERVORA PRODUCT WORKFLOW • NO LOGIN REQUIRED</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
            How Servora Works
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From the first customer request to completed field service — Servora connects customers,
            service businesses, and service professionals in one operational workflow.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/customer"
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
            >
              <span>Explore Servora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#workflow"
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm transition-all"
            >
              See the Workflow ↓
            </a>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto text-left">
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Intake</span>
              <p className="text-sm font-extrabold text-white mt-1">Location-First</p>
              <span className="text-[11px] text-slate-400">Zero arbitrary city fallback</span>
            </div>
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Intelligence</span>
              <p className="text-sm font-extrabold text-white mt-1">Grounded AI</p>
              <span className="text-[11px] text-slate-400">Pre-dispatch tool triage</span>
            </div>
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matching</span>
              <p className="text-sm font-extrabold text-white mt-1">5-Factor Engine</p>
              <span className="text-[11px] text-slate-400">Trade-capability verified</span>
            </div>
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Field Execution</span>
              <p className="text-sm font-extrabold text-white mt-1">Audited Status</p>
              <span className="text-[11px] text-slate-400">Physical measurement signoff</span>
            </div>
          </div>
        </section>

        {/* ── WORKFLOW STAGES ── */}
        <div id="workflow" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">

          {/* ── SECTION 1: THE CUSTOMER ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <span>Stage 01</span>
                <span>•</span>
                <span>Customer Intake</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                1. A customer needs help
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                The customer starts by providing their location. Servora uses the customer's actual selected
                location to determine which services are available in that area. No account creation or login
                is required to discover service availability.
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-1 border-b border-slate-800">
                <span className="font-mono text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  REAL SERVORA — CUSTOMER PORTAL
                </span>
                <span className="text-[11px]">Desktop & Mobile Viewport</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <img
                  src="/showcase/01_customer_portal_home.png"
                  alt="Real Servora Customer Portal Homepage"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-slate-400 italic px-2">
                "Customers start by confirming where service is needed. The platform presents active service verticals
                calibrated to the verified locality."
              </p>
            </div>
          </section>

          {/* ── SECTION 2: LOCATION-FIRST DISCOVERY ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span>Stage 02</span>
                <span>•</span>
                <span>Geographic Validation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                2. Servora understands where the service is needed
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Service availability is determined by licensed provider coverage and active service configuration.
                Servora validates coordinates against administrative boundaries in real time. Invalid coordinates
                such as [0,0] are rejected, and the platform never silently substitutes an arbitrary city.
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-1 border-b border-slate-800">
                <span className="font-mono text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  REAL SERVORA — LOCATION VALIDATION
                </span>
                <span className="text-[11px]">Structured Geocoding Search</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <img
                  src="/showcase/02_location_discovery.png"
                  alt="Real Servora Location Search and Verification"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-slate-400 italic px-2">
                "Customer location → coverage boundary check → verified service availability. Prevents out-of-radius truck rolls."
              </p>
            </div>
          </section>

          {/* ── SECTION 3: SERVICE DISCOVERY ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <span>Stage 03</span>
                <span>•</span>
                <span>Trade Selection</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                3. Choose the service you actually need
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Customers see only the verified services actively supported by eligible providers in their
                exact locality. Servora isolates five independent trade verticals without cross-domain pollution:
                <strong className="text-white"> ☀️ Solar Energy</strong>,
                <strong className="text-white"> ❄️ AC / HVAC</strong>,
                <strong className="text-white"> 🔧 Plumbing</strong>,
                <strong className="text-white"> ⚡ Electrical</strong>, and
                <strong className="text-white"> 🏠 Home Maintenance</strong>.
                If a provider in the area only supports Home Maintenance, the customer portal strictly offers
                Home Maintenance — never falling back to unrelated global services.
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-1 border-b border-slate-800">
                <span className="font-mono text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  REAL SERVORA — SERVICE DISCOVERY
                </span>
                <span className="text-[11px]">Multi-Trade Service Cards</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <img
                  src="/showcase/03_service_selection.png"
                  alt="Real Servora Available Services Cards"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-slate-400 italic px-2">
                "Each service vertical presents certified provider counts, problem scopes, and instant booking paths."
              </p>
            </div>
          </section>

          {/* ── SECTION 4: DESCRIBE THE PROBLEM ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
                <span>Stage 04</span>
                <span>•</span>
                <span>Problem Intake</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                4. Tell Servora what is wrong
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                The customer does not need to know the technical engineering diagnosis. They choose a high-level
                problem category and describe the fault in normal, everyday language. Visual taxonomies and calibrated
                photo upload requirements guide the customer without friction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-4 space-y-3">
                <div className="text-[11px] font-mono text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  REAL SERVORA — CATEGORY TAXONOMY
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/04_problem_category_intake.png"
                    alt="Problem Category Selection"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Curated problem cards with calibrated photo requirement badges (Required vs Recommended).
                </p>
              </div>

              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-4 space-y-3">
                <div className="text-[11px] font-mono text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  REAL SERVORA — COMPLAINT DESCRIPTION
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/05_complaint_description.png"
                    alt="Customer Complaint Input"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Voice-assisted or text input capturing the real symptoms (e.g. "Water is leaking heavily from pipe below sink").
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION 5: AI UNDERSTANDS THE REQUEST ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 uppercase tracking-wider">
                <span>Stage 05</span>
                <span>•</span>
                <span>Grounded AI Preparation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                5. Servora AI prepares the job
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Servora normalizes unstructured complaints into operational intelligence before the technician
                ever leaves the workshop. The engine identifies candidate causes, required precision tools, candidate
                replacement components, and life-safety advisories.
              </p>
              <div className="p-3 bg-violet-950/40 border border-violet-800/60 rounded-2xl text-xs text-violet-200 mt-2">
                <span className="font-bold">Important Safeguard:</span> AI helps prepare and structure the job.
                The service professional performs the actual physical inspection and on-site repair.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-4 space-y-3">
                <div className="text-[11px] font-mono text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  REAL SERVORA — AI DIAGNOSTIC TRIAGE
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/06_ai_diagnostic_triage.png"
                    alt="AI Diagnostics and Confidence"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Confidence scores, probable root causes, and symptom breakdowns generated from complaint intake.
                </p>
              </div>

              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-4 space-y-3">
                <div className="text-[11px] font-mono text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  REAL SERVORA — RECOMMENDED TOOLS & SAFETY
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/07_ai_tools_and_safety.png"
                    alt="Recommended Tools and Safety Protocols"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Pre-dispatch tool forecasts (e.g. Pipe Wrench, Teflon Tape) and mandatory safety warnings (Stopcock shutoff).
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION 6: THE RIGHT SERVICE WORKFLOW ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
                <span>Stage 06</span>
                <span>•</span>
                <span>Dispatch Routing</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                6. The request reaches the right service workflow
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Requests are immediately structured as operational tickets with immutable location snapshots,
                trade categorization, and live status telemetry.
              </p>
            </div>

            {/* Visual Routing Diagram */}
            <div className="p-4 sm:p-6 bg-slate-900/90 rounded-3xl border border-slate-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-xs font-bold">
                <div className="p-3 bg-slate-800 rounded-xl w-full sm:w-auto">Customer Request</div>
                <ChevronRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />
                <div className="p-3 bg-slate-800 rounded-xl w-full sm:w-auto">Verified Location</div>
                <ChevronRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />
                <div className="p-3 bg-indigo-900/60 border border-indigo-700 text-indigo-300 rounded-xl w-full sm:w-auto">Service Type</div>
                <ChevronRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />
                <div className="p-3 bg-emerald-900/60 border border-emerald-700 text-emerald-300 rounded-xl w-full sm:w-auto">Eligible Provider</div>
                <ChevronRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />
                <div className="p-3 bg-slate-800 rounded-xl w-full sm:w-auto">Certified Tech</div>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-1 border-b border-slate-800">
                <span className="font-mono text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  REAL SERVORA — OPERATIONAL TICKET DETAIL
                </span>
                <span className="text-[11px]">Normalized Symptoms & Asset History</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <img
                  src="/showcase/08_ticket_normalized_view.png"
                  alt="Operational Ticket Detail"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* ── SECTION 7: BUSINESSES + INDEPENDENT PROFESSIONALS ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <span>Architecture</span>
                <span>•</span>
                <span>Workforce Models</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Built for service businesses and independent professionals
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Servora is architected to support both multi-staff field service businesses and solo licensed
                contractors within tenant-isolated workspaces.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Service Business (LIVE) */}
              <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-white">Service Businesses</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-extrabold uppercase font-mono">
                    LIVE IN SERVORA
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Service companies manage incoming queues, team rosters, shift schedules, capability matrixes,
                  and operational analytics through the Operations Command Center.
                </p>
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/09_manager_command_center.png"
                    alt="Operations Command Center"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">
                  REAL SERVORA — OPERATIONS COMMAND CENTER
                </span>
              </div>

              {/* Card 2: Independent Professional (ROADMAP) */}
              <div className="bg-slate-900/50 rounded-3xl border border-slate-800/60 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-bold text-white">Independent Professionals</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[10px] font-extrabold uppercase font-mono">
                      COMING NEXT / PLANNED
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Solo licensed electricians, plumbers, and HVAC technicians will receive jobs directly into
                    their personal trade terminal without requiring business management overhead.
                  </p>

                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Direct locality matching for verified trade certifications</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Self-managed radius and on-duty availability toggles</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Direct customer signoff and historical warranty receipts</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  * Note: Independent solo workspaces are on the product roadmap. Current production release
                  operates via verified service company workspaces.
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION 8: SERVICE-SPECIFIC PROFESSIONAL EXPERIENCE ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <span>Stage 07</span>
                <span>•</span>
                <span>Capability-Aware Matching</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Every professional works with the information relevant to their trade
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Servora's 5-factor matching engine evaluates certified capabilities. A Solar-only technician is
                strictly disqualified from Plumbing or Electrical tickets, preventing dangerous field errors.
                Every technician terminal dynamically adapts to the professional's trade — displaying domain-tailored
                diagnostic intelligence, precision tooling, and safety protocols for Plumbing, Electrical, Home Maintenance,
                Solar, or HVAC specialists.
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-1 border-b border-slate-800">
                <span className="font-mono text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  REAL SERVORA — 5-FACTOR CAPABILITY DISPATCH
                </span>
                <span className="text-[11px]">Match Score & Tool Checklist</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <img
                  src="/showcase/10_service_aware_matching.png"
                  alt="5-Factor Technician Capability Matching"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-slate-400 italic px-2">
                "Scores evaluate Trade Certification (Mandatory), Equipped Tools, Availability, Radius, and Past Rating."
              </p>
            </div>
          </section>

          {/* ── SECTION 9: FIELD EXECUTION ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span>Stage 08</span>
                <span>•</span>
                <span>Field Operations</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                From request to real field work
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Technicians use a high-contrast mobile terminal designed for outdoor sunlight. The job progresses
                through strict operational milestones with tamper-resistant audit timestamps:
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">ACCEPTED</span>
                <span>→</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800">ON THE WAY</span>
                <span>→</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800">ON SITE</span>
                <span>→</span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800">IN PROGRESS</span>
                <span>→</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">COMPLETED</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-4 space-y-3">
                <div className="text-[11px] font-mono text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  REAL SERVORA — TECHNICIAN WORK TERMINAL
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/11_technician_job_terminal.png"
                    alt="Technician Mobile Job Terminal"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Assigned ticket queue with customer location, contact link, and trade details.
                </p>
              </div>

              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-4 space-y-3">
                <div className="text-[11px] font-mono text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  REAL SERVORA — MILESTONE PROGRESSION
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/12_field_work_execution.png"
                    alt="Field Work Execution Milestones"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  One-tap milestone advancement keeping customers and dispatchers synchronized.
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION 10: SERVICE COMPLETION & HISTORY ── */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <span>Stage 09</span>
                <span>•</span>
                <span>Physical Proof & Telemetry</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                The job becomes part of the service history
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Before completion, technicians record trade-specific physical readings: DC Voc voltage and string current for Solar,
                temperature delta and suction PSI for AC, joint pressure test and pipe material for Plumbing, measured load and voltage
                for Electrical, or surface dampness and area square-footage for Home Maintenance. Servora benchmarks the actual on-site
                findings against the initial AI hypothesis to maintain empirical quality standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-4 space-y-3">
                <div className="text-[11px] font-mono text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  REAL SERVORA — PHYSICAL READINGS REPORT
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/13_service_report_readings.png"
                    alt="Field Service Report and Readings"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Physical readings, verified parts used, and field inspection checklist.
                </p>
              </div>

              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-3 sm:p-4 space-y-3">
                <div className="text-[11px] font-mono text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  REAL SERVORA — AI-VS-ACTUAL BENCHMARK
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src="/showcase/14_verified_service_history.png"
                    alt="AI vs Actual Benchmark Verification"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Ground truth verification: diagnostic match %, tool match %, and repeat visit tracking.
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION 11: HOW SERVORA CONNECTS EVERYTHING ── */}
          <section className="space-y-6 pt-6 border-t border-slate-900">
            <div className="space-y-2 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <span>Architecture</span>
                <span>•</span>
                <span>End-to-End Operating System</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                How Servora Connects Everything
              </h2>
              <p className="text-sm text-slate-300">
                A single unified data spine coordinating intake, operations, and fieldwork.
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 text-center">
              <div className="max-w-xl mx-auto font-mono text-xs sm:text-sm space-y-3 text-slate-300 leading-relaxed">
                <div className="p-3 bg-indigo-950/80 border border-indigo-800/80 rounded-xl text-indigo-200 font-bold">
                  CUSTOMER
                </div>
                <div className="text-slate-500">↓</div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  LOCATION VALIDATION
                </div>
                <div className="text-slate-500">↓</div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  AVAILABLE SERVICES (Solar • AC • Plumbing • Electrical • Civil)
                </div>
                <div className="text-slate-500">↓</div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  SERVICE REQUEST & COMPLAINT
                </div>
                <div className="text-slate-500">↓</div>
                <div className="p-3 bg-violet-950/80 border border-violet-800/80 rounded-xl text-violet-200 font-bold">
                  SERVORA GROUNDED AI (Tools • Safety • Root Causes)
                </div>
                <div className="text-slate-500">↓</div>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                    <span className="font-bold text-white block">SERVICE BUSINESS</span>
                    <span className="text-[11px] text-slate-400">Queue & Dispatch</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                    <span className="font-bold text-white block">PROFESSIONAL</span>
                    <span className="text-[11px] text-slate-400">Trade Execution</span>
                  </div>
                </div>
                <div className="text-slate-500">↓</div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  FIELD JOB (Accepted → Transit → On Site → Work)
                </div>
                <div className="text-slate-500">↓</div>
                <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-200 font-bold">
                  COMPLETED SERVICE HISTORY & BENCHMARK
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 12: TRADE SPECIFICS ── */}
          <section className="space-y-6">
            <div className="space-y-2 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Verified Trade Verticals
              </h2>
              <p className="text-sm text-slate-300">
                Configured with domain-specific diagnostic rules, safety checklists, and physical tools.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sun className="w-4 h-4" />
                  <span>Solar Energy</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inverter fault codes, zero power generation, DC open-circuit voltage (Voc), string current, and rooftop fall safety.
                </p>
              </div>

              <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <Wind className="w-4 h-4" />
                  <span>AC / HVAC</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Low cooling, water leakage, suction line pressure (PSI), delta-T temperature differential, and refrigerant leak detection.
                </p>
              </div>

              <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Droplet className="w-4 h-4" />
                  <span>Plumbing</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pipe bursts, P-trap leaks, water pump failures, pressure test verification, and main stopcock isolation advisories.
                </p>
              </div>

              <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Electrical</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  MCB tripping, switchboard sparking, 1000V insulated screwdrivers, breaker lockout/tagout, and continuity checks.
                </p>
              </div>

              <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2.5 sm:col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <HomeIcon className="w-4 h-4" />
                  <span>Home Maintenance / Civil</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Floor and wall tile replacement, wall seepage dampness, notched trowel adhesive spread, moisture meter testing, and dust mask precautions.
                </p>
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section className="p-8 sm:p-12 bg-indigo-950/40 rounded-3xl border border-indigo-900/60 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready to see Servora in action?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Explore the platform built to connect customer requests, service operations, and field professionals.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link
                to="/customer"
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <span>Try Servora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://www.linkedin.com/company/servoraaiop/"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm transition-all"
              >
                Connect on LinkedIn
              </a>
            </div>
          </section>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 Servora Technologies. All rights reserved. Field Service Operations Platform.</p>
        <p className="text-[11px] text-slate-600">
          Real screenshots captured from Servora production environments. No mockups or stock photos.
        </p>
      </footer>
    </div>
  );
};
