import React, { useState } from 'react';
import { Info, Key, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const DemoModeBanner: React.FC = () => {
  const { user } = useAuth();
  const [showCreds, setShowCreds] = useState(false);

  // Only show demo banner if explicitly requested via ?demo=true in URL (for internal testing)
  const isExplicitDemoParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true';
  if (!isExplicitDemoParam) {
    return null;
  }

  // If user is logged into the Pilot or Client workspace, do not show any simulated demo environment banner
  if (user?.isPilotCompany || user?.environmentContext === 'PILOT' || user?.environmentContext === 'CLIENT' || user?.companyName?.toLowerCase().includes('pilot')) {
    return null;
  }

  return (
    <div className="bg-amber-950/90 text-amber-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-amber-800/60">
      <div className="flex items-center gap-2">
        <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
          DEMO ENVIRONMENT
        </span>
        <span className="text-amber-100 font-medium">
          Do not use real customer data. Simulated operational workflow.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCreds(!showCreds)}
          className="flex items-center gap-1 text-amber-200 hover:text-white underline text-[11px]"
        >
          <Key className="w-3.5 h-3.5" />
          {showCreds ? 'Hide Demo Logins' : 'Demo Logins'}
        </button>
      </div>

      {showCreds && (
        <div className="w-full mt-2 pt-2 border-t border-amber-800/60 flex flex-wrap gap-4 text-[11px] text-amber-100 bg-slate-950/80 p-2.5 rounded-lg">
          <div>
            <span className="font-bold text-emerald-400">Manager:</span> manager@demo.com / Demo@12345
          </div>
          <div>
            <span className="font-bold text-amber-400">Technician:</span> technician@demo.com / Demo@12345
          </div>
          <div>
            <span className="text-slate-400">Specialists:</span> rahul@demo.com (Solar), vikram@demo.com (AC)
          </div>
        </div>
      )}
    </div>
  );
};
