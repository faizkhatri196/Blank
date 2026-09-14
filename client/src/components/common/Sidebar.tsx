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
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();
  const isManager = user?.role === 'SERVICE_MANAGER';

  const managerLinks = [
    { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/tickets', label: 'Service Tickets', icon: ClipboardList },
    { to: '/manager/technicians', label: 'Technicians', icon: Users },
    { to: '/manager/customers', label: 'Customers & Assets', icon: Building2 },
    { to: '/manager/pilot-insights', label: 'Pilot Insights', icon: BarChart3 },
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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-900/30">
            S
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              SERVORA
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                V0
              </span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium tracking-tight">
              AI-powered field service ops
            </div>
          </div>
        </div>

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
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Version */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-300">V0 Pilot Edition</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Demo
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          Real Groundwork Verification
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

