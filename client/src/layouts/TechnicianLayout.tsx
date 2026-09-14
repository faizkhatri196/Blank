import React from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, CheckCircle2, UserCheck, LogOut } from 'lucide-react';
import { DemoModeBanner } from '../components/common/DemoModeBanner';

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

  if (user.role !== 'TECHNICIAN') {
    return <Navigate to="/manager/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 pb-20">
      <DemoModeBanner />

      {/* High-contrast mobile top bar */}
      <header className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Field Technician App
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {user.name}
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main mobile workspace */}
      <main className="flex-1 p-4 max-w-lg w-full mx-auto">
        <Outlet />
      </main>

      {/* Fixed bottom navigation with large touch targets */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 max-w-lg mx-auto flex items-center justify-around py-2 shadow-lg">
        <NavLink
          to="/technician/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-4 rounded-xl font-bold text-[11px] transition-all ${
              isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Wrench className="w-5 h-5" />
          Active Jobs
        </NavLink>

        <NavLink
          to="/technician/jobs?status=COMPLETED"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-4 rounded-xl font-bold text-[11px] transition-all ${
              isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <CheckCircle2 className="w-5 h-5" />
          Completed
        </NavLink>

        <NavLink
          to="/technician/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-4 rounded-xl font-bold text-[11px] transition-all ${
              isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <UserCheck className="w-5 h-5" />
          My Profile
        </NavLink>
      </nav>
    </div>
  );
};
