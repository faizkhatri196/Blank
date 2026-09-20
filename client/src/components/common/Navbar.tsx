import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User as UserIcon, Sun, Wind, Layers, Menu } from 'lucide-react';
import { PortalSwitcher } from './PortalSwitcher';
import { ServoraLogo } from './ServoraLogo';

interface NavbarProps {
  onOpenMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileNav }) => {
  const { user, logout, activeServiceFilter, setActiveServiceFilter } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs max-w-full">
      {/* Left: Hamburger (mobile), Official Logo, Workspace info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Official Servora Logo (always present) */}
        <div className="shrink-0 flex items-center">
          <ServoraLogo variant="compact" size="xs" className="sm:hidden" />
          <ServoraLogo variant="compact" size="sm" className="hidden sm:flex" />
        </div>

        {/* Workspace Information */}
        <div className="min-w-0 border-l border-slate-200 pl-2 sm:pl-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[200px]">
              {user?.companyName || 'Operations HQ'}
            </span>
            <span className="hidden xs:inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 uppercase tracking-wider shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Operations Center</p>
        </div>

        {/* Global Vertical Filter (Desktop only; mobile uses Sidebar) */}
        {user?.role === 'SERVICE_MANAGER' && (
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs ml-2">
            <button
              onClick={() => setActiveServiceFilter('ALL')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                activeServiceFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ALL</span>
            </button>
            <button
              onClick={() => setActiveServiceFilter('SOLAR')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                activeServiceFilter === 'SOLAR'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>SOLAR</span>
            </button>
            <button
              onClick={() => setActiveServiceFilter('AC')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                activeServiceFilter === 'AC'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>AC</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Portal Switcher, User Profile, Sign Out */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Desktop Portal Switcher */}
        <div className="hidden sm:block">
          <PortalSwitcher />
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-2 text-right">
          <div className="hidden md:block">
            <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user?.name}</div>
            <div className="text-[10px] font-semibold text-slate-500">
              {user?.role === 'SERVICE_MANAGER' ? 'Service Manager' : 'Field Technician'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 font-bold text-xs shadow-2xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-slate-500" />}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};


