import React from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, CheckCircle2, UserCheck, LogOut } from 'lucide-react';
import { PortalSwitcher } from '../components/common/PortalSwitcher';

export const TechnicianLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm font-bold">
        Loading Field Ops...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'CUSTOMER') {
    return <Navigate to="/customer" replace />;
  }

  if (user.role !== 'TECHNICIAN') {
    return <Navigate to="/manager/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900/5 sm:bg-slate-200/50 pb-20 items-center">
      <div className="w-full max-w-lg flex flex-col min-h-screen bg-slate-100 sm:shadow-xl sm:border-x sm:border-slate-300">
        {/* High-contrast mobile top bar */}
        <header className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>SERVORA</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                Field Pro
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {user.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PortalSwitcher variant="dark" />
            <button
              onClick={logout}
              title="Sign out"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main mobile workspace */}
        <main className="flex-1 p-3.5 sm:p-4 w-full">
          <Outlet />
        </main>

        {/* Fixed bottom navigation with large touch targets */}
        <nav className="fixed bottom-0 inset-x-0 sm:max-w-lg sm:mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around py-2 px-2 shadow-lg sm:border-x">
          <NavLink
            to="/technician/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl font-bold text-[11px] transition-all ${
                isActive ? 'text-emerald-700 bg-emerald-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Wrench className="w-5 h-5" />
            <span>Active Jobs</span>
          </NavLink>

          <NavLink
            to="/technician/jobs?status=COMPLETED"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl font-bold text-[11px] transition-all ${
                isActive ? 'text-emerald-700 bg-emerald-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Completed</span>
          </NavLink>

          <NavLink
            to="/technician/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl font-bold text-[11px] transition-all ${
                isActive ? 'text-emerald-700 bg-emerald-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <UserCheck className="w-5 h-5" />
            <span>My Profile</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

