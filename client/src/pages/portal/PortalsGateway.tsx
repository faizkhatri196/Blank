import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Wrench, Building2, ArrowRight, CheckCircle2, Sparkles, LogIn, PlayCircle } from 'lucide-react';
import { ServoraLogo } from '../../components/common/ServoraLogo';

export const PortalsGateway: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-white flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <header className="max-w-6xl mx-auto w-full text-center mb-10 sm:mb-14 flex flex-col items-center">
        <ServoraLogo variant="badge" inverted size="xl" className="justify-center mb-3" />
        <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-normal">
          Select your designated portal below to access your role-tailored workspace.
        </p>
      </header>

      {/* 3 Core Portals Grid */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
        {/* 1. Customer Portal */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all group">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-black tracking-wider uppercase text-indigo-400 block mb-1">
              End-User & Facility
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Customer Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Designed for homeowners and commercial facility managers to book repairs, request maintenance, and track technicians in real-time.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Location-first service availability check</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Guided AI problem intake & photo triage</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Live technician GPS tracking & digital ETA</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Verified digital work completion reports</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5">
            <button
              onClick={() => navigate('/customer')}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Launch Customer Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/login?portal=customer"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>Customer Sign In</span>
            </Link>
          </div>
        </div>

        {/* 2. Field Technician Portal */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all group">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400 block mb-1">
              Field Engineer Mobile Terminal
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Technician Terminal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Tailored high-contrast mobile interface for field technicians on the road to navigate, diagnose, and close tickets.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Assigned job queue & one-touch navigation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI diagnostic aids & troubleshooting trees</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Status transitions (Accepted, On the Way, On Site)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>On-site multi-photo closeout report builder</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5">
            <button
              onClick={() => navigate('/technician/dashboard')}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Open Technician Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/login?portal=technician"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Technician Sign In</span>
            </Link>
          </div>
        </div>

        {/* 3. Operations / Company Manager Portal */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all group">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-black tracking-wider uppercase text-amber-400 block mb-1">
              Service Company HQ
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Operations Manager
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Command suite for service enterprise managers and dispatchers to orchestrate technicians, service lines, and metrics.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Central triage & 5-factor dispatch engine</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Multi-service area coverage management</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>AI diagnostic confidence vs. field audit verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Team live telemetry & field fleet monitoring</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5">
            <button
              onClick={() => navigate('/manager/dashboard')}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Enter Operations Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/login?portal=manager"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Manager Sign In</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/walkthrough"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-colors font-medium shadow-xs"
          >
            <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Product Walkthrough</span>
          </Link>
          <Link
            to="/onboarding"
            className="text-slate-300 hover:text-white font-medium hover:underline"
          >
            Register Service Company →
          </Link>
        </div>

        <p>© {new Date().getFullYear()} SERVORA. Enterprise Field Service Operations Infrastructure.</p>
      </footer>
    </div>
  );
};
