import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, User, Building2, Wrench } from 'lucide-react';

export const ProductWalkthrough: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
      <Link
        to="/walkthrough?role=customer"
        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col items-center gap-2 group"
      >
        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
          <User className="w-5 h-5" />
        </div>
        <span className="font-bold text-white text-sm">Customer Walkthrough</span>
        <span className="text-xs text-slate-400">Location, problem intake, and tracking</span>
        <span className="text-xs text-indigo-400 font-bold inline-flex items-center gap-1 mt-1">
          See How it Works <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>

      <Link
        to="/walkthrough?role=service"
        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col items-center gap-2 group"
      >
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
          <Building2 className="w-5 h-5" />
        </div>
        <span className="font-bold text-white text-sm">Service Business Walkthrough</span>
        <span className="text-xs text-slate-400">Queue, AI triage, and 5-factor dispatch</span>
        <span className="text-xs text-amber-400 font-bold inline-flex items-center gap-1 mt-1">
          See How it Works <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>

      <Link
        to="/walkthrough?role=professional"
        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col items-center gap-2 group"
      >
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
          <Wrench className="w-5 h-5" />
        </div>
        <span className="font-bold text-white text-sm">Professional Walkthrough</span>
        <span className="text-xs text-slate-400">Mobile terminal and trade telemetry</span>
        <span className="text-xs text-emerald-400 font-bold inline-flex items-center gap-1 mt-1">
          See How it Works <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </div>
  );
};
