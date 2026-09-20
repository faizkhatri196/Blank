import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
  Settings,
  Wrench,
  CheckCircle2,
  UserCheck,
  X,
  FileCheck2,
  Sun,
  Wind,
  Layers,
} from 'lucide-react';
import { ServoraLogo } from './ServoraLogo';
import { PortalSwitcher } from './PortalSwitcher';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, activeServiceFilter, setActiveServiceFilter } = useAuth();
  const isManager = user?.role === 'SERVICE_MANAGER';

  const showTestModules = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('test') === 'true'
  );

  const managerLinks = [
    { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/tickets', label: 'Service Tickets', icon: ClipboardList },
    { to: '/manager/technicians', label: 'Technicians', icon: Users },
    { to: '/manager/customers', label: 'Customers & Assets', icon: Building2 },
    { to: '/manager/pilot-insights', label: 'Pilot Insights', icon: BarChart3 },
    ...(showTestModules ? [{ to: '/manager/crt-validation', label: 'CRT Validation', icon: FileCheck2, badge: 'CRT' }] : []),
    { to: '/manager/settings', label: 'System Settings', icon: Settings },
  ];

  const technicianLinks = [
    { to: '/technician/dashboard', label: "Today's Jobs", icon: Wrench },
    { to: '/technician/jobs?status=COMPLETED', label: 'Completed Jobs', icon: CheckCircle2 },
    { to: '/technician/profile', label: 'Profile & Status', icon: UserCheck },
  ];

  const links = isManager ? managerLinks : technicianLinks;

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <ServoraLogo variant="full" inverted size="sm" />

        {/* Close Button for Mobile Drawer */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mobile-only Portal & Filter Section */}
      <div className="p-3 border-b border-slate-800 space-y-2 md:hidden">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Portals & Scope
        </div>
        <PortalSwitcher />

        {isManager && (
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setActiveServiceFilter('ALL')}
              className={`flex-1 py-1 text-center font-bold text-[11px] rounded-lg transition-all ${
                activeServiceFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setActiveServiceFilter('SOLAR')}
              className={`flex-1 py-1 text-center font-bold text-[11px] rounded-lg transition-all ${
                activeServiceFilter === 'SOLAR'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SOLAR
            </button>
            <button
              onClick={() => setActiveServiceFilter('AC')}
              className={`flex-1 py-1 text-center font-bold text-[11px] rounded-lg transition-all ${
                activeServiceFilter === 'AC'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AC
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{link.label}</span>
              {(link as any).badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 font-mono">
                  {(link as any).badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Status */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-300">SERVORA Platform</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
            Online
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          Field Operations Infrastructure
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 shrink-0 border-r border-slate-800">
        {content}
      </aside>

      {/* Mobile Drawer (Slide-out with backdrop) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 border-r border-slate-800 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

