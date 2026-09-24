import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCustomerLocation } from '../contexts/LocationContext';
import { Sparkles, MapPin, ClipboardList, Home, User as UserIcon, LogIn, LogOut, PlayCircle, Menu, X, ChevronRight } from 'lucide-react';
import { ServoraLogo } from '../components/common/ServoraLogo';
import { PortalSwitcher } from '../components/common/PortalSwitcher';

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { location } = useCustomerLocation(); // ← Reactive: updates when CustomerHome saves
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayCity = location?.city || null;

  const navLinks = [
    { to: '/customer', label: 'Services', icon: Home, end: true },
    { to: '/customer/requests', label: 'My Requests', icon: ClipboardList, end: false },
    { to: '/customer/profile', label: 'Account', icon: UserIcon, end: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* ── Top Navigation Bar ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">

          {/* Logo */}
          <button onClick={() => navigate('/customer')} className="flex items-center focus:outline-none shrink-0">
            <ServoraLogo variant="compact" size="sm" />
          </button>

          {/* Desktop nav links (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/walkthrough"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <PlayCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Walkthrough</span>
            </NavLink>
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Location Pill — reactive */}
            <button
              onClick={() => navigate('/customer')}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] sm:text-xs font-semibold transition-colors border border-slate-200 shrink min-w-0"
              title="Change service location"
            >
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[140px]">
                {displayCity || 'Select Location'}
              </span>
              <span className="text-[10px] text-indigo-600 font-bold ml-0.5 underline shrink-0">
                {displayCity ? 'Change' : 'Set'}
              </span>
            </button>

            <PortalSwitcher />

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                <span className="text-xs font-semibold text-slate-700 hidden lg:inline-block">
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
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sign In</span>
              </NavLink>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-md">
            {navLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
              </NavLink>
            ))}
            <NavLink
              to="/walkthrough"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <PlayCircle className="w-4 h-4 text-indigo-500" />
              <span>Walkthrough</span>
              <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
            </NavLink>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      {/* pb-24 on mobile (space for bottom tab bar), py-6 on desktop */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 sm:py-7 pb-28 sm:pb-10">
        <Outlet />
      </main>

      {/* ── Mobile Sticky Bottom Tab Bar (sm:hidden = hide on tablet+) ── */}
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

        {/* Big central Book button */}
        <NavLink to="/customer/request" className="flex flex-col items-center -mt-5">
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
