import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle2,
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
  Laptop,
  Smartphone,
  Gauge,
  Camera,
  FileCheck2,
  SlidersHorizontal,
} from 'lucide-react';
import { WALKTHROUGH_CONFIG } from '../../config/walkthroughConfig';

interface ProductWalkthroughProps {
  videoUrl?: string;
  posterUrl?: string;
  showChapters?: boolean;
  className?: string;
}

export type YCAct = 'CUSTOMER' | 'MANAGER' | 'TECHNICIAN' | 'AUDIT';

export interface YCDemoMilestone {
  id: string;
  act: YCAct;
  actName: string;
  actBadge: string;
  actColor: string;
  startSec: number;
  endSec: number;
  timecode: string;
  title: string;
  route: string;
  viewportType: 'DESKTOP' | 'MOBILE';
  caption: string;
  operationalImpact: string;
  launchPath: string;
  previewCard: {
    badge: string;
    title: string;
    subtitle: string;
    status: string;
    metrics: Array<{ label: string; value: string; highlight?: boolean }>;
  };
}

export const YC_DEMO_MILESTONES: YCDemoMilestone[] = [
  // ACT 1: CUSTOMER (0:00 - 0:45)
  {
    id: 'm1-customer-location',
    act: 'CUSTOMER',
    actName: 'Customer Portal',
    actBadge: 'Act 1: Smart Intake',
    actColor: 'indigo',
    startSec: 0,
    endSec: 22,
    timecode: '00:00 - 00:22',
    title: 'Verified Location Check in Mandvi, Kutch',
    route: '/customer',
    viewportType: 'DESKTOP',
    caption:
      'Homeowner in Mandvi opens Servora. The platform verifies active field-service coverage in Mandvi (370465) within 25 km before displaying certified Solar EPC and AC/HVAC service lines.',
    operationalImpact: 'Zero false promises: only displays verified active operational coverage',
    launchPath: '/customer',
    previewCard: {
      badge: 'LOCATION VERIFIED',
      title: 'Mandvi, Kutch (PIN 370465)',
      subtitle: '2 Certified Service Companies Available',
      status: 'COVERAGE CONFIRMED',
      metrics: [
        { label: 'Active Territory', value: 'Mandvi Taluka & Coastal Belt' },
        { label: 'Service Lines', value: 'Rooftop Solar EPC • AC/HVAC' },
        { label: 'Available Units', value: '4 Dispatched Techs on Duty', highlight: true },
      ],
    },
  },
  {
    id: 'm2-customer-intake',
    act: 'CUSTOMER',
    actName: 'Customer Portal',
    actBadge: 'Act 1: Smart Intake',
    actColor: 'indigo',
    startSec: 22,
    endSec: 45,
    timecode: '00:22 - 00:45',
    title: 'Visual Problem Intake & AI Symptom Structuring',
    route: '/customer/request',
    viewportType: 'DESKTOP',
    caption:
      'The customer taps "Inverter Offline / Fault Code" and writes "Generation stopped since morning, error code E-031 blinking." Servora structures the complaint into an engineering-grade ticket.',
    operationalImpact: 'Translates colloquial descriptions into exact engineering tickets with zero latency',
    launchPath: '/customer/request',
    previewCard: {
      badge: 'AI INTAKE ANALYSIS',
      title: 'Ticket #SOL-2026-0082 Created',
      subtitle: 'Machhipith, Mandvi • Rooftop Solar',
      status: 'INSTANT TRIAGE COMPLETE',
      metrics: [
        { label: 'Symptom Reported', value: 'Solar inverter offline / zero output' },
        { label: 'Error Code', value: 'E-031 (DC Transient Surge)' },
        { label: 'Urgency Level', value: 'High • Immediate Dispatch Needed', highlight: true },
      ],
    },
  },

  // ACT 2: MANAGER (0:45 - 1:30)
  {
    id: 'm3-manager-triage',
    act: 'MANAGER',
    actName: 'Operations Command Center',
    actBadge: 'Act 2: HQ Dispatch',
    actColor: 'amber',
    startSec: 45,
    endSec: 67,
    timecode: '00:45 - 01:07',
    title: 'Real-Time Ticket Intake & AI Root-Cause Prediction',
    route: '/manager/tickets/SOL-2026-0082',
    viewportType: 'DESKTOP',
    caption:
      'The Operations Manager receives the complaint in real time. Servora’s diagnostic engine evaluates electrical telemetry, predicting an 88% probability of DC Isolator thermal cutoff or surge failure.',
    operationalImpact: 'Recommends exact diagnostic toolkit before any technician leaves the depot',
    launchPath: '/manager/dashboard',
    previewCard: {
      badge: 'ROOT CAUSE ANALYSIS',
      title: 'AI Diagnostic Hypothesis',
      subtitle: 'Probability Score: 88.4% Confidence',
      status: 'TRIAGED • HIGH PRIORITY',
      metrics: [
        { label: 'Predicted Defect', value: 'DC Isolator Oxidation / Cartridge Burnout' },
        { label: 'Required Toolkit', value: 'Digital Multimeter, Clamp Meter, MC4 Wrench', highlight: true },
        { label: 'Required Spares', value: '1000V DC Surge Cartridge (Type II)' },
      ],
    },
  },
  {
    id: 'm4-manager-dispatch',
    act: 'MANAGER',
    actName: 'Operations Command Center',
    actBadge: 'Act 2: HQ Dispatch',
    actColor: 'amber',
    startSec: 67,
    endSec: 90,
    timecode: '01:07 - 01:30',
    title: '5-Factor Intelligent Technician Match & One-Click Dispatch',
    route: '/manager/dashboard',
    viewportType: 'DESKTOP',
    caption:
      'The 5-factor dispatch engine matches Rahul Sharma as the optimal candidate (96.4% match): 4.2 km from customer in Mandvi, certified for solar inverters, carrying the required spares. Dispatched in 1 click.',
    operationalImpact: 'Prevents misallocated dispatches and cuts travel overhead by 34%',
    launchPath: '/manager/dashboard',
    previewCard: {
      badge: '5-FACTOR MATCH',
      title: 'Candidate: Rahul Sharma (Rank #1)',
      subtitle: 'Solar Inverter Level-2 Certified',
      status: 'DISPATCHED VIA PUSH ALERT',
      metrics: [
        { label: 'Distance from Site', value: '4.2 km (12 mins travel)', highlight: true },
        { label: 'Inventory Match', value: 'Cartridge & Multimeter Verified' },
        { label: 'Queue Status', value: 'Available • Optimal Route Slot' },
      ],
    },
  },

  // ACT 3: TECHNICIAN (1:30 - 2:20)
  {
    id: 'm5-tech-navigation',
    act: 'TECHNICIAN',
    actName: 'Technician Mobile Terminal',
    actBadge: 'Act 3: Field Execution',
    actColor: 'emerald',
    startSec: 90,
    endSec: 115,
    timecode: '01:30 - 01:55',
    title: 'Mobile Push Alert, One-Touch Navigation & En-Route Milestones',
    route: '/technician/jobs/SOL-2026-0082',
    viewportType: 'MOBILE',
    caption:
      'On his mobile terminal, technician Rahul taps "Accept Job" and advances to "On The Way". Turn-by-turn navigation guides him to Machhipith, Mandvi. The customer receives a live 14-min ETA update.',
    operationalImpact: 'Strict state-machine logging guarantees audit-compliant SLA timestamps',
    launchPath: '/technician/dashboard',
    previewCard: {
      badge: 'FIELD NAVIGATION',
      title: 'Job State: EN ROUTE (ETA: 14m)',
      subtitle: 'Destination: Machhipith, Mandvi',
      status: 'LIVE GPS SIGNAL: FRESH',
      metrics: [
        { label: 'Customer Privacy', value: 'Direct Phone Masked' },
        { label: 'Turn-by-Turn GPS', value: 'Optimized Coastal Highway Route' },
        { label: 'Arrival Milestone', value: 'Logged with Geofence Confirmation', highlight: true },
      ],
    },
  },
  {
    id: 'm6-tech-diagnosis',
    act: 'TECHNICIAN',
    actName: 'Technician Mobile Terminal',
    actBadge: 'Act 3: Field Execution',
    actColor: 'emerald',
    startSec: 115,
    endSec: 140,
    timecode: '01:55 - 02:20',
    title: 'On-Site Diagnostic Multimeter Log & Multi-Photo Verification',
    route: '/technician/jobs/SOL-2026-0082/execute',
    viewportType: 'MOBILE',
    caption:
      'Rahul arrives on site. Following the guided checklist, he tests the DC string, records Voc = 382V, replaces the burned DC surge cartridge, and uploads before-and-after photo evidence.',
    operationalImpact: 'Standardized field procedure drives first-time fix rate from 68% to 94%',
    launchPath: '/technician/dashboard',
    previewCard: {
      badge: 'MULTIMETER DATA LOG',
      title: 'Physical Ground-Truth Test',
      subtitle: 'String Voc = 382V (Normal Range)',
      status: 'REPAIR EXECUTED & PHOTO ATTACHED',
      metrics: [
        { label: 'Physical Finding', value: 'Blown DC Surge Cartridge Replaced' },
        { label: 'Time on Site', value: '28 minutes' },
        { label: 'Photo Evidence', value: '2 High-Res Photos Uploaded', highlight: true },
      ],
    },
  },

  // ACT 4: CLOSED-LOOP AUDIT (2:20 - 3:00)
  {
    id: 'm7-audit-verification',
    act: 'AUDIT',
    actName: 'Closed-Loop AI Audit',
    actBadge: 'Act 4: Ground Truth',
    actColor: 'sky',
    startSec: 140,
    endSec: 162,
    timecode: '02:20 - 02:42',
    title: 'AI vs. Ground-Truth Physical Audit Comparison',
    route: '/manager/pilot-insights',
    viewportType: 'DESKTOP',
    caption:
      'At HQ, the system closes the loop. It matches Rahul’s physical multimeter readings (Voc = 382V, replaced cartridge) against the initial AI hypothesis, logging a 5/5 accuracy score to retrain regional models.',
    operationalImpact: 'Creates an indisputable audit trail that eliminates warranty fraud and billing disputes',
    launchPath: '/manager/pilot-insights',
    previewCard: {
      badge: 'GROUND-TRUTH AUDIT',
      title: 'AI vs. Physical Verification',
      subtitle: 'Comparison: 100% Ground Truth Match',
      status: 'VERIFIED BY SYSTEM',
      metrics: [
        { label: 'Initial AI Guess', value: 'DC Isolator / Surge Failure (88%)' },
        { label: 'Field Physical Fix', value: 'Cartridge Burnout Confirmed' },
        { label: 'Model Retraining', value: 'Logged into Servora Neural Core', highlight: true },
      ],
    },
  },
  {
    id: 'm8-completion-wrap',
    act: 'AUDIT',
    actName: 'Closed-Loop AI Audit',
    actBadge: 'Act 4: Ground Truth',
    actColor: 'sky',
    startSec: 162,
    endSec: 180,
    timecode: '02:42 - 03:00',
    title: 'Digital Customer Signoff, Auto-Invoicing & 100% SLA Compliance',
    route: '/manager/dashboard',
    viewportType: 'DESKTOP',
    caption:
      'The customer digitally signs off on their phone. The digital work certificate and automated invoice are generated instantly. End-to-end service cycle completed in under 45 minutes.',
    operationalImpact: 'Zero paperwork, instant revenue collection, and 5-star customer satisfaction',
    launchPath: '/manager/dashboard',
    previewCard: {
      badge: 'LIFECYCLE COMPLETE',
      title: 'Ticket #SOL-2026-0082 Closed',
      subtitle: 'Total Turnaround: 42 mins (SLA: 120m)',
      status: 'INVOICE & WARRANTY ISSUED',
      metrics: [
        { label: 'Customer Rating', value: '★★★★★ 5.0 (Verified)' },
        { label: 'Warranty Card', value: 'Stored in Customer Digital Vault' },
        { label: 'SLA Performance', value: 'Target Met (Saved 78 mins)', highlight: true },
      ],
    },
  },
];

export const ProductWalkthrough: React.FC<ProductWalkthroughProps> = ({
  videoUrl = WALKTHROUGH_CONFIG.videoUrl,
  posterUrl = WALKTHROUGH_CONFIG.posterUrl,
  showChapters = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // 3-Minute Demo Timer State (0 to 180 seconds)
  const TOTAL_DURATION_SEC = 180;
  const [currentSec, setCurrentSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  // Derive active milestone from currentSec
  const currentMilestone =
    YC_DEMO_MILESTONES.find((m) => currentSec >= m.startSec && currentSec < m.endSec) ||
    YC_DEMO_MILESTONES[YC_DEMO_MILESTONES.length - 1];

  const currentMilestoneIdx = YC_DEMO_MILESTONES.findIndex((m) => m.id === currentMilestone.id);

  // Paced timer ticker
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1000 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentSec((prev) => {
        if (prev >= TOTAL_DURATION_SEC - 1) {
          return 0; // Loop back to start
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSeek = (targetSec: number) => {
    setCurrentSec(Math.min(TOTAL_DURATION_SEC - 1, Math.max(0, targetSec)));
  };

  const handleJumpToAct = (act: YCAct) => {
    const target = YC_DEMO_MILESTONES.find((m) => m.act === act);
    if (target) {
      setCurrentSec(target.startSec);
    }
  };

  const progressPercent = (currentSec / TOTAL_DURATION_SEC) * 100;
  const hasRealVideo = Boolean(videoUrl && videoUrl.trim().length > 0);

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* TOP CONTROLS & TIMELINE DOCK */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
        {/* Row 1: Header Badge + Act Jumper Tabs + Speed + Playback Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Live Simulator Status Badge */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  Y COMBINATOR 3-MINUTE DEMO RUNNER
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentMilestone.actBadge}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>{currentMilestone.title}</span>
              </h3>
            </div>
          </div>

          {/* Player Navigation Buttons */}
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700/80 text-xs">
              {[1.0, 1.5, 2.0].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded-lg font-mono font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Play / Pause Toggle */}
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Demo'}</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={() => {
                setCurrentSec(0);
                setIsPlaying(true);
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-colors"
              title="Restart 3-minute demo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: 4 Act Tabs for One-Touch Jumping */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { act: 'CUSTOMER', name: '1. Customer Intake', range: '0:00 - 0:45', color: 'indigo', icon: User },
              { act: 'MANAGER', name: '2. Manager Dispatch', range: '0:45 - 1:30', color: 'amber', icon: Building2 },
              { act: 'TECHNICIAN', name: '3. Field Execution', range: '1:30 - 2:20', color: 'emerald', icon: Wrench },
              { act: 'AUDIT', name: '4. AI Closed Loop', range: '2:20 - 3:00', color: 'sky', icon: ShieldCheck },
            ] as const
          ).map((item) => {
            const isActActive = currentMilestone.act === item.act;
            const Icon = item.icon;
            return (
              <button
                key={item.act}
                type="button"
                onClick={() => handleJumpToAct(item.act)}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                  isActActive
                    ? 'bg-slate-800/95 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      item.act === 'CUSTOMER'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : item.act === 'MANAGER'
                        ? 'bg-amber-500/10 text-amber-400'
                        : item.act === 'TECHNICIAN'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-sky-500/10 text-sky-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-bold truncate ${isActActive ? 'text-white' : 'text-slate-300'}`}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">{item.range}</p>
                  </div>
                </div>
                {isActActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Row 3: Interactive 3-Minute Progress Scrub Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-white font-bold">{formatTime(currentSec)}</span>
              <span>/ 03:00 (Total Demo)</span>
            </div>
            <span className="text-slate-500 text-[11px]">
              Milestone {currentMilestoneIdx + 1} of {YC_DEMO_MILESTONES.length}
            </span>
          </div>

          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              handleSeek(Math.round(clickPos * TOTAL_DURATION_SEC));
            }}
            className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative group"
            title="Click to seek anywhere in 3-minute video timeline"
          >
            {/* Act Markers */}
            <div className="absolute left-[25%] top-0 bottom-0 w-0.5 bg-slate-950 z-10 opacity-70" />
            <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-slate-950 z-10 opacity-70" />
            <div className="absolute left-[77.7%] top-0 bottom-0 w-0.5 bg-slate-950 z-10 opacity-70" />

            {/* Filled Progress Bar with Multi-Color Gradient */}
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-amber-500 via-emerald-500 to-sky-400 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* MAIN DEMO SCREEN & INTERACTIVE VIEWPORT */}
      <div className="relative w-full rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col justify-between">
        {hasRealVideo ? (
          /* NATIVE VIDEO PLAYER FALLBACK */
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
          /* HIGH-FIDELITY LIVE VIEWPORT SIMULATION (Desktop vs Mobile Frame) */
          <div className="p-5 sm:p-7 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 space-y-6">
            {/* Simulated OS Browser / Device Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              {/* Traffic Light Dots + Live Simulated Route */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                  <span className="text-emerald-400 font-bold">https://</span>
                  <span className="text-slate-300">servora.app</span>
                  <span className="text-indigo-400">{currentMilestone.route}</span>
                </div>
              </div>

              {/* Viewport Badge + Quick Credentials + Live Launch */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                  {currentMilestone.viewportType === 'MOBILE' ? (
                    <>
                      <Smartphone className="w-3 h-3 text-emerald-400" />
                      <span>Mobile PWA Viewport</span>
                    </>
                  ) : (
                    <>
                      <Laptop className="w-3 h-3 text-indigo-400" />
                      <span>Desktop Operations Viewport</span>
                    </>
                  )}
                </span>

                {/* Launch Module Button */}
                <button
                  type="button"
                  onClick={() => navigate(currentMilestone.launchPath)}
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all active:scale-95"
                >
                  <span>Launch Live</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* SCREEN VIEWPORT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* LEFT COLUMN: THE SIMULATED APPLICATION CARD */}
              <div
                className={`lg:col-span-7 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-inner transition-all ${
                  currentMilestone.viewportType === 'MOBILE'
                    ? 'bg-slate-900 border-emerald-500/30 ring-1 ring-emerald-500/20 max-w-md mx-auto w-full'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* Device Screen Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {currentMilestone.timecode}
                    </span>
                    <span className="font-bold text-white text-xs truncate">
                      {currentMilestone.actName}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      currentMilestone.act === 'CUSTOMER'
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                        : currentMilestone.act === 'MANAGER'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : currentMilestone.act === 'TECHNICIAN'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    {currentMilestone.previewCard.badge}
                  </span>
                </div>

                {/* Simulated Screen Card */}
                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800/90 space-y-3.5 font-sans">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-white tracking-tight">
                        {currentMilestone.previewCard.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {currentMilestone.previewCard.subtitle}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black font-mono tracking-wider uppercase bg-slate-900 text-slate-200 border border-slate-700 shrink-0">
                      {currentMilestone.previewCard.status}
                    </span>
                  </div>

                  {/* Metrics Table */}
                  <div className="pt-2 border-t border-slate-800/90 space-y-2 text-xs">
                    {currentMilestone.previewCard.metrics.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between py-1.5 px-3 rounded-xl border transition-all ${
                          item.highlight
                            ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
                            : 'bg-slate-900/60 border-slate-850 text-slate-300'
                        }`}
                      >
                        <span className="text-slate-400 text-[11px] font-medium">{item.label}</span>
                        <span
                          className={`font-semibold text-xs text-right font-mono ${
                            item.highlight ? 'text-indigo-300 font-bold' : 'text-slate-200'
                          }`}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestone Stepper Navigation Controls */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    {YC_DEMO_MILESTONES.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSeek(m.startSec)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentMilestoneIdx
                            ? 'w-6 bg-indigo-500 shadow-sm'
                            : 'w-2 bg-slate-700 hover:bg-slate-600'
                        }`}
                        title={`Jump to ${m.title}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      disabled={currentMilestoneIdx === 0}
                      onClick={() => {
                        const prevMilestone = YC_DEMO_MILESTONES[currentMilestoneIdx - 1];
                        if (prevMilestone) handleSeek(prevMilestone.startSec);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 font-semibold"
                    >
                      Prev Step
                    </button>
                    <button
                      type="button"
                      disabled={currentMilestoneIdx === YC_DEMO_MILESTONES.length - 1}
                      onClick={() => {
                        const nextMilestone = YC_DEMO_MILESTONES[currentMilestoneIdx + 1];
                        if (nextMilestone) handleSeek(nextMilestone.startSec);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 font-semibold"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: SYNCHRONIZED PROFESSIONAL CAPTION & VOICEOVER SCRIPT */}
              <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>SYNCHRONIZED VOICEOVER CAPTION</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentMilestone.caption);
                        setCopiedRole('caption');
                        setTimeout(() => setCopiedRole(null), 2000);
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      title="Copy script caption for your recording"
                    >
                      {copiedRole === 'caption' ? (
                        <span className="text-emerald-400 font-bold">Caption Copied!</span>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Caption</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Main Speech Caption Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 relative">
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-normal">
                      "{currentMilestone.caption}"
                    </p>
                  </div>

                  {/* Operational Impact Badge */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-[10px] uppercase text-emerald-400 tracking-wider">
                        Business & Defensibility Metric
                      </span>
                      <span className="text-xs font-semibold text-emerald-200 mt-0.5 block">
                        {currentMilestone.operationalImpact}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Callouts */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(currentMilestone.launchPath)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 flex items-center justify-between transition-colors"
                  >
                    <span>Test {currentMilestone.actName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHAPTER DIRECTORY TABLE */}
      {showChapters && (
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                3-Minute Demo Choreography Breakdown
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">
              Click any stage to scrub directly to that second
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {YC_DEMO_MILESTONES.map((m, idx) => {
              const isCurrent = m.id === currentMilestone.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSeek(m.startSec)}
                  className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                    isCurrent
                      ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-850 text-slate-300 border border-slate-700">
                      {m.timecode}
                    </span>
                    <span className="text-[9.5px] uppercase font-bold text-slate-400">
                      {m.actName.split(' ')[0]}
                    </span>
                  </div>

                  <div>
                    <p className={`text-xs font-bold leading-snug line-clamp-1 ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                      {m.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {m.caption}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
