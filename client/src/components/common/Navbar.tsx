import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User as UserIcon, Sun, Wind, Layers } from 'lucide-react';
import { ServiceType } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, activeServiceFilter, setActiveServiceFilter } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            {user?.companyName || 'Demo Field Services'}
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Operations Center</p>
        </div>

        {/* Global Vertical Filter (Only show for manager) */}
        {user?.role === 'SERVICE_MANAGER' && (
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveServiceFilter('ALL')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeServiceFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              ALL
            </button>
            <button
              onClick={() => setActiveServiceFilter('SOLAR')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeServiceFilter === 'SOLAR'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              SOLAR
            </button>
            <button
              onClick={() => setActiveServiceFilter('AC')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeServiceFilter === 'AC'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              AC / HVAC
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-right">
          <div className="hidden md:block">
            <div className="text-xs font-bold text-slate-800">{user?.name}</div>
            <div className="text-[11px] font-medium text-slate-500">
              {user?.role === 'SERVICE_MANAGER' ? 'Service Manager' : 'Field Technician'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <UserIcon className="w-4 h-4" />
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
