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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
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

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-5 border-b border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
          S
        </div>
        <div>
          <div className="text-sm font-extrabold tracking-tight text-white">
            SERVORA
          </div>
          <div className="text-[10px] text-emerald-400 font-medium tracking-tight">AI-powered field service ops</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300">V0 Pilot Edition</div>
        <div className="text-[10px] text-slate-400 mt-0.5">Real Groundwork Verification</div>
      </div>
    </aside>
  );
};
