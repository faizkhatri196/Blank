import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User as UserIcon, Sun, Wind, Layers, Menu } from 'lucide-react';

interface NavbarProps {
  onOpenMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileNav }) => {
  const { user, logout, activeServiceFilter, setActiveServiceFilter } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Hamburger Button */}
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            aria-label="Open sidebar menu"
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${user?.isPilotCompany ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`}></span>
              <span className="truncate max-w-[130px] sm:max-w-[200px]">
                {user?.companyName || 'Demo Field Services'}
              </span>
            </h1>
            {user?.isPilotCompany ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Real Pilot
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300 uppercase tracking-wider">
                Demo Data
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Operations Center</p>
        </div>

        {/* Global Vertical Filter (Only show for manager) */}
        {user?.role === 'SERVICE_MANAGER' && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveServiceFilter('ALL')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] sm:text-xs transition-all ${
                activeServiceFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">ALL</span>
            </button>
            <button
              onClick={() => setActiveServiceFilter('SOLAR')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] sm:text-xs transition-all ${
                activeServiceFilter === 'SOLAR'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">SOLAR</span>
            </button>
            <button
              onClick={() => setActiveServiceFilter('AC')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] sm:text-xs transition-all ${
                activeServiceFilter === 'AC'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">AC</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-right">
          <div className="hidden md:block">
            <div className="text-xs font-bold text-slate-800">{user?.name}</div>
            <div className="text-[11px] font-medium text-slate-500">
              {user?.role === 'SERVICE_MANAGER' ? 'Service Manager' : 'Field Technician'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
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

