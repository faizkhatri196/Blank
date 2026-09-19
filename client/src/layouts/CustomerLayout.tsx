import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, MapPin, ClipboardList, Home, User as UserIcon, LogIn, LogOut } from 'lucide-react';
import { DemoModeBanner } from '../components/common/DemoModeBanner';
import { PortalSwitcher } from '../components/common/PortalSwitcher';
import { getCustomerSavedLocation } from '../utils/customerLocation';

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Retrieve user-scoped selected location (null for new customer)
  const savedLocation = getCustomerSavedLocation(user?.id);
  const displayCity = savedLocation ? savedLocation.city : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Consumer Navigation */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer')}
              className="flex items-center gap-2 group text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1">
                  SERVORA
                </span>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Field Service Operations</p>
              </div>
            </button>
          </div>

          {/* Location Quick Pill */}
          <button
            onClick={() => navigate('/customer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
            title="Change service location"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span className="truncate max-w-[120px] sm:max-w-none">
              {displayCity || 'Select Location'}
            </span>
            <span className="text-[10px] text-indigo-600 font-bold ml-0.5 underline">
              {displayCity ? 'Change' : 'Set Area'}
            </span>
          </button>

          {/* Portal Switcher & User Auth */}
          <div className="flex items-center gap-2">
            <PortalSwitcher />

            {user ? (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
                <span className="text-xs font-semibold text-slate-700 hidden md:inline-block">
                  Hi, {user.name.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NavLink
                to="/login?portal=customer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 sm:py-7 pb-24 sm:pb-12">
        <Outlet />
      </main>

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-6 flex items-center justify-around z-40 shadow-lg">
        <NavLink
          to="/customer"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Services</span>
        </NavLink>

        <NavLink
          to="/customer/requests"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <ClipboardList className="w-5 h-5" />
          <span>My Requests</span>
        </NavLink>

        <NavLink
          to="/customer/request"
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-transform active:scale-95">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <span className="text-[10px] font-bold text-indigo-600 mt-1">Book</span>
        </NavLink>

        <NavLink
          to="/customer/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <UserIcon className="w-5 h-5" />
          <span>Account</span>
        </NavLink>
      </nav>
    </div>
  );
};
