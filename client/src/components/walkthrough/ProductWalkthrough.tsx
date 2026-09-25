import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Video,
  Sparkles,
  Layers,
  ChevronRight,
  Building2,
  Wrench,
  User,
  Radio,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { WALKTHROUGH_CONFIG, WalkthroughChapter } from '../../config/walkthroughConfig';

interface ProductWalkthroughProps {
  videoUrl?: string;
  posterUrl?: string;
  showChapters?: boolean;
  className?: string;
}

type DashboardRole = 'MANAGER' | 'TECHNICIAN' | 'CUSTOMER';

interface DashboardWorkflowStep {
  stepNumber: number;
  timecode: string;
  title: string;
  badge: string;
  caption: string;
  operationalImpact: string;
  previewCard: {
    title: string;
    subtitle: string;
    status: string;
    details: Array<{ label: string; value: string }>;
  };
}

const DASHBOARD_WORKFLOWS: Record<DashboardRole, {
  name: string;
  roleTitle: string;
  icon: any;
  color: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  launchPath: string;
  demoAccount: { email: string; pass: string; role: string };
  steps: DashboardWorkflowStep[];
}> = {
  MANAGER: {
    name: 'Operations Manager',
    roleTitle: 'Enterprise Command Center',
    icon: Building2,
    color: 'amber',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/30',
    accentText: 'text-amber-400',
    launchPath: '/manager/dashboard',
    demoAccount: { email: 'manager@demo.com', pass: 'Demo@12345', role: 'Service Manager' },
    steps: [
      {
        stepNumber: 1,
        timecode: '01:20',
        title: 'Instant Ticket Intake & AI Triage',
        badge: 'Intake Automation',
        caption:
          'When a customer registers a fault, the manager dashboard instantly parses the incoming complaint, runs deterministic fault-tree triage, and highlights root causes.',
        operationalImpact: '94.2% automated symptom structuring with 0s latency',
        previewCard: {
          title: 'Ticket #SOL-2026-0082',
          subtitle: 'Solar Inverter Offline / Overheating',
          status: 'TRIAGED • HIGH PRIORITY',
          details: [
            { label: 'Customer Location', value: 'Machhipith, Mandvi (370465)' },
            { label: 'Root Cause Probability', value: 'Thermal Cutoff / IGBT Failure (88%)' },
            { label: 'Recommended Toolkit', value: 'Digital Multimeter, Clamp Meter, MC4 Wrench' },
          ],
        },
      },
      {
        stepNumber: 2,
        timecode: '02:45',
        title: '5-Factor Intelligent Dispatch',
        badge: 'Smart Dispatch',
        caption:
          'The manager reviews verified technicians ranked by real distance, vertical certification, required toolkit availability, and current job queue.',
        operationalImpact: 'Prevents misallocated dispatches and minimizes travel overhead',
        previewCard: {
          title: 'Match Engine Recommendation',
          subtitle: 'Candidate: Jay Dave (Solar & AC Certified)',
          status: 'OPTIMAL MATCH (96.4%)',
          details: [
            { label: 'Proximity Distance', value: '4.2 km from customer site' },
            { label: 'Skills & Tools', value: 'Inverter Repair, MC4, Thermal Meter' },
            { label: 'Queue Status', value: 'Available • Next in route' },
          ],
        },
      },
      {
        stepNumber: 3,
        timecode: '04:10',
        title: 'Live Telemetry & Fleet Telematics',
        badge: 'Fleet Telemetry',
        caption:
          'Managers track the real-time movement and status of dispatched field professionals with certified freshness tiers (Fresh, Warm, Stale).',
        operationalImpact: 'Zero ghost tracking with honest coordinate timestamps',
        previewCard: {
          title: 'Operations Fleet Telemetry',
          subtitle: '5 Active Units Across Kutch & Gujarat',
          status: 'LIVE TRACKING ACTIVE',
          details: [
            { label: 'Technician Jay Dave', value: 'On The Way (ETA: 12 mins)' },
            { label: 'Signal Freshness', value: 'FRESH (< 30s ago)' },
            { label: 'SLA Status', value: 'On-schedule (Target: 45m)' },
          ],
        },
      },
      {
        stepNumber: 4,
        timecode: '05:30',
        title: 'AI vs. Ground-Truth Audit Log',
        badge: 'Audit & Compliance',
        caption:
          'Upon job closeout, the manager reviews the physical multimeter readings, replaced parts, and field photos against initial AI predictions.',
        operationalImpact: '100% accountable audit trail with verifiable photo proof',
        previewCard: {
          title: 'Field Service Closeout Report',
          subtitle: 'Physical Verification Audit',
          status: 'COMPLETED & VERIFIED',
          details: [
            { label: 'Actual Finding', value: 'DC Isolator oxidation replaced' },
            { label: 'AI Accuracy Rating', value: 'Highly Accurate (4/5)' },
            { label: 'Customer Signoff', value: 'Digitally Captured & Invoiced' },
          ],
        },
      },
    ],
  },
  TECHNICIAN: {
    name: 'Field Technician',
    roleTitle: 'Mobile Execution Terminal',
    icon: Wrench,
    color: 'emerald',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    accentText: 'text-emerald-400',
    launchPath: '/technician/dashboard',
    demoAccount: { email: 'rahul@demo.com', pass: 'Demo@12345', role: 'Certified Field Tech' },
    steps: [
      {
        stepNumber: 1,
        timecode: '02:10',
        title: 'Mobile Job Alert & One-Touch Route',
        badge: 'Job Intake',
        caption:
          'Technician receives an instant notification on their mobile PWA with full customer context, verified address, and turn-by-turn navigation route.',
        operationalImpact: 'Eliminates phone tag and misdirected field dispatch',
        previewCard: {
          title: 'New Service Job Dispatched',
          subtitle: 'Machhipith, Mandvi • Rooftop Solar',
          status: 'ACTION REQUIRED • ACCEPT',
          details: [
            { label: 'Fault Description', value: '"Solar inverter offline since morning"' },
            { label: 'Customer Contact', value: 'Authorized Private Contact' },
            { label: 'Distance / ETA', value: '4.2 km / 14 mins drive' },
          ],
        },
      },
      {
        stepNumber: 2,
        timecode: '03:20',
        title: 'Strict Operational State Machine',
        badge: 'Milestone Execution',
        caption:
          'Technician transitions through strict status milestones: Accepted → On The Way → On Site. Each step logs timestamp and updates customer ETA.',
        operationalImpact: 'Immutable timestamps ensure SLA contract compliance',
        previewCard: {
          title: 'Job State: ON SITE',
          subtitle: 'Arrived at Customer Location',
          status: 'DIAGNOSIS IN PROGRESS',
          details: [
            { label: 'Travel Duration', value: '13 mins 42s' },
            { label: 'Customer Notified', value: 'Arrival SMS & Live App Badge' },
            { label: 'Checklist Step', value: '1 of 4: Physical Safety Check' },
          ],
        },
      },
      {
        stepNumber: 3,
        timecode: '04:40',
        title: 'Diagnostic Copilot & Readings Log',
        badge: 'Diagnostic Tools',
        caption:
          'The mobile copilot suggests targeted diagnostics (e.g. DC string voltage, insulation resistance) and lets the engineer log exact meter readings.',
        operationalImpact: 'Standardized field procedure with higher first-time fix rate',
        previewCard: {
          title: 'Electrical Diagnostics & Readings',
          subtitle: 'Multimeter & Inverter Telemetry',
          status: 'READINGS VERIFIED',
          details: [
            { label: 'Voc String 1', value: '382 V (Normal range: 350-420V)' },
            { label: 'Inverter Error Code', value: 'E-031 (DC Overvoltage Transient)' },
            { label: 'Remediation Taken', value: 'Cleaned contacts & replaced DC surge cartridge' },
          ],
        },
      },
      {
        stepNumber: 4,
        timecode: '06:00',
        title: 'Multi-Photo Evidence & Completion',
        badge: 'Digital Proof',
        caption:
          'Technician takes mandatory before-and-after photographic evidence, captures customer digital signoff, and closes the ticket in real time.',
        operationalImpact: 'Zero customer disputes with immutable photographic evidence',
        previewCard: {
          title: 'Digital Service Report Submitted',
          subtitle: 'Closeout Package Complete',
          status: 'JOB CLOSED • READY FOR INVOICE',
          details: [
            { label: 'Evidence Uploads', value: '2 High-Res Photos (Pre & Post)' },
            { label: 'Work Time', value: '42 mins on site' },
            { label: 'Warranty Card', value: 'Logged digitally in system' },
          ],
        },
      },
    ],
  },
  CUSTOMER: {
    name: 'Customer Portal',
    roleTitle: 'Self-Service & Live Tracking',
    icon: User,
    color: 'indigo',
    accentBg: 'bg-indigo-500/10',
    accentBorder: 'border-indigo-500/30',
    accentText: 'text-indigo-400',
    launchPath: '/customer',
    demoAccount: { email: 'customer@demo.com', pass: 'Demo@12345', role: 'Verified Customer' },
    steps: [
      {
        stepNumber: 1,
        timecode: '00:40',
        title: 'Location-First Service Discovery',
        badge: 'Smart Discovery',
        caption:
          'Homeowner enters their locality (e.g. Mandvi or Ahmedabad) or taps "Use My Location". SERVORA checks real operational radius before showing services.',
        operationalImpact: 'Zero false promises; only displays verified certified coverage',
        previewCard: {
          title: 'Coverage Verified: Mandvi (370465)',
          subtitle: '2 Certified Service Lines Available',
          status: 'COVERAGE CONFIRMED',
          details: [
            { label: 'Solar Energy', value: 'Certified Provider: Solar Pvt Ltd' },
            { label: 'AC & HVAC', value: 'Certified Provider: Apex Climate' },
            { label: 'Operational Radius', value: '25 km Active Fleet Coverage' },
          ],
        },
      },
      {
        stepNumber: 2,
        timecode: '01:50',
        title: 'Guided Problem Intake & AI Triage',
        badge: 'Visual Intake',
        caption:
          'Customer selects their symptom from visual problem cards and uploads photos. AI transparently summarizes the issue in clear plain language.',
        operationalImpact: 'Translates colloquial descriptions into exact engineering tickets',
        previewCard: {
          title: 'Problem: Inverter Not Generating',
          subtitle: 'Customer Message: "Generation bandh che"',
          status: 'AI OPERATIONAL SUMMARY CREATED',
          details: [
            { label: 'AI Summary', value: 'Solar inverter offline / zero AC output reported' },
            { label: 'Estimated Visit Window', value: 'Today • 2:00 PM - 4:00 PM' },
            { label: 'Photo Evidence', value: 'Attached 1 photo of display code' },
          ],
        },
      },
      {
        stepNumber: 3,
        timecode: '03:30',
        title: 'Live Tracking & Privacy Protection',
        badge: 'Live ETA',
        caption:
          'Customer follows technician status in real-time with digital ETA and contact masking. Personal address and phone numbers are safeguarded.',
        operationalImpact: 'Enterprise-grade privacy with real-time homeowner peace of mind',
        previewCard: {
          title: 'Tracking: Rahul S. is On The Way',
          subtitle: 'Estimated Arrival in 14 minutes',
          status: 'EN ROUTE TO SERVICE SITE',
          details: [
            { label: 'Assigned Specialist', value: 'Certified Solar Technician' },
            { label: 'Company Masked Call', value: '+91 79 4000 1234 (Verified)' },
            { label: 'Milestone Progress', value: 'Step 3 of 4: Traveling to Location' },
          ],
        },
      },
      {
        stepNumber: 4,
        timecode: '05:10',
        title: 'Verified Completion & 5-Star Feedback',
        badge: 'Customer Rating',
        caption:
          'Customer inspects the digital work certificate with before/after photos, confirms problem resolution, and submits verified feedback.',
        operationalImpact: 'Direct feedback loop drives continuous quality improvement',
        previewCard: {
          title: 'Service Completed Successfully',
          subtitle: 'Work Verified • Digital Receipt Ready',
          status: '5-STAR RATING SUBMITTED',
          details: [
            { label: 'Rating', value: '★★★★★ (5.0 / 5.0)' },
            { label: 'Customer Comment', value: '"Fast arrival, fixed inverter issue in 30 mins."' },
            { label: 'Digital Record', value: 'Permanently accessible in Portal' },
          ],
        },
      },
    ],
  },
};

export const ProductWalkthrough: React.FC<ProductWalkthroughProps> = ({
  videoUrl = WALKTHROUGH_CONFIG.videoUrl,
  posterUrl = WALKTHROUGH_CONFIG.posterUrl,
  showChapters = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeRole, setActiveRole] = useState<DashboardRole>('MANAGER');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const currentWorkflow = DASHBOARD_WORKFLOWS[activeRole];
  const activeStep = currentWorkflow.steps[currentStepIdx] || currentWorkflow.steps[0];

  // Auto-advance step every 5 seconds if playing
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % currentWorkflow.steps.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isAutoPlaying, currentWorkflow.steps.length]);

  // Reset step when role changes
  const handleSelectRole = (role: DashboardRole) => {
    setActiveRole(role);
    setCurrentStepIdx(0);
  };

  const handleCopyCredentials = (email: string, pass: string, roleKey: string) => {
    navigator.clipboard.writeText(`${email} / ${pass}`);
    setCopiedRole(roleKey);
    setTimeout(() => setCopiedRole(null), 2500);
  };

  const hasRealVideo = Boolean(videoUrl && videoUrl.trim().length > 0);

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* 3 Dashboard Role Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['MANAGER', 'TECHNICIAN', 'CUSTOMER'] as DashboardRole[]).map((r) => {
            const isSelected = activeRole === r;
            const wf = DASHBOARD_WORKFLOWS[r];
            const Icon = wf.icon;
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleSelectRole(r)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? wf.accentText : 'text-slate-500'
                  }`}
                />
                <span>{wf.name}</span>
                {isSelected && (
                  <span className={`w-1.5 h-1.5 rounded-full ${r === 'MANAGER' ? 'bg-amber-400' : r === 'TECHNICIAN' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Step Indicator & Controls */}
        <div className="flex items-center gap-2 px-2 text-xs">
          <button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700 font-medium"
            title={isAutoPlaying ? 'Pause Auto-Play' : 'Play Walkthrough'}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isAutoPlaying ? 'Pause' : 'Resume'}</span>
          </button>

          <span className="text-slate-500 font-mono text-[11px]">
            Step {currentStepIdx + 1} of {currentWorkflow.steps.length}
          </span>
        </div>
      </div>

      {/* Main Interactive Screen Walkthrough Simulation Container */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col justify-between">
        {hasRealVideo ? (
          /* REAL NATIVE VIDEO PLAYER (if hosted) */
          <div className="relative aspect-video bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl || undefined}
              controls
              playsInline
              className="w-full h-full object-contain"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        ) : (
          /* HIGH-FIDELITY LIVE DASHBOARD SIMULATION */
          <div className="p-5 sm:p-8 space-y-6 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950">
            {/* Simulation Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${currentWorkflow.accentBg} ${currentWorkflow.accentText} border ${currentWorkflow.accentBorder}`}>
                  {React.createElement(currentWorkflow.icon, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      LIVE WORKFLOW DEMONSTRATION
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {currentWorkflow.name} • {currentWorkflow.roleTitle}
                  </h3>
                </div>
              </div>

              {/* Direct Launch & Quick Demo Credentials */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCredentials(currentWorkflow.demoAccount.email, currentWorkflow.demoAccount.pass, activeRole)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700/80 flex items-center gap-1.5 transition-colors"
                  title="Copy demo login credentials"
                >
                  {copiedRole === activeRole ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[11px]">{currentWorkflow.demoAccount.email}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(currentWorkflow.launchPath)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span>Launch Live</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dashboard Simulated Screen Content Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: Visual Dashboard Screen Card */}
              <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between space-y-4 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {activeStep.timecode}
                    </span>
                    <span className="font-bold text-white text-xs truncate max-w-[200px] sm:max-w-none">
                      {activeStep.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {activeStep.badge}
                  </span>
                </div>

                {/* Simulated Screen Card */}
                <div className="bg-slate-950/80 rounded-xl p-4 sm:p-5 border border-slate-800/90 space-y-3 font-sans">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {activeStep.previewCard.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {activeStep.previewCard.subtitle}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      {activeStep.previewCard.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                    {activeStep.previewCard.details.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-900/60 border border-slate-850">
                        <span className="text-slate-400 text-[11px]">{item.label}</span>
                        <span className="font-semibold text-slate-200 text-xs text-right font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step Navigation Dots */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    {currentWorkflow.steps.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCurrentStepIdx(idx);
                          setIsAutoPlaying(false);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentStepIdx
                            ? 'w-6 bg-indigo-500'
                            : 'w-2 bg-slate-700 hover:bg-slate-600'
                        }`}
                        title={`Go to Step ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      disabled={currentStepIdx === 0}
                      onClick={() => {
                        setCurrentStepIdx((prev) => Math.max(0, prev - 1));
                        setIsAutoPlaying(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 font-semibold"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={currentStepIdx === currentWorkflow.steps.length - 1}
                      onClick={() => {
                        setCurrentStepIdx((prev) => Math.min(currentWorkflow.steps.length - 1, prev + 1));
                        setIsAutoPlaying(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Professional Narrative & Caption Box */}
              <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>PROFESSIONAL OPERATIONAL CAPTION</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                      "{activeStep.caption}"
                    </p>
                  </div>

                  {/* Operational Impact Badge */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-[10px] uppercase text-emerald-400">
                        Operational Result
                      </span>
                      <span className="text-xs font-medium text-emerald-200">
                        {activeStep.operationalImpact}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Link to Role */}
                <div className="pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate(currentWorkflow.launchPath)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 flex items-center justify-between transition-colors"
                  >
                    <span>Test {currentWorkflow.name} Directly</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapters / Operational Stages List */}
      {showChapters && (
        <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                Full Operational Lifecycle Stages
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">
              Select any stage to inspect the workflow
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {WALKTHROUGH_CONFIG.chapters.slice(0, 9).map((chapter, idx) => {
              return (
                <div
                  key={chapter.id}
                  className="text-left p-3 rounded-xl border transition-all flex items-start gap-3 bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                >
                  <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold shrink-0 mt-0.5 bg-slate-800 text-slate-400 border border-slate-700">
                    {chapter.timestamp}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {chapter.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {chapter.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

