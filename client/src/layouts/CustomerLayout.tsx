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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* ── Top Navigation Bar ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">

          {/* Logo */}
          <button 
            onClick={() => navigate('/customer')} 
            className="flex items-center focus:outline-none shrink-0"
            aria-label="Servora Home"
          >
            <ServoraLogo variant="compact" size="xs" className="xs:hidden" />
            <ServoraLogo variant="compact" size="sm" className="hidden xs:inline-flex" />
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
                      ? 'text-indigo-600 bg-indigo-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/walkthrough?role=customer"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>How It Works</span>
            </NavLink>
            <NavLink
              to="/walkthrough"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <PlayCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Walkthrough</span>
            </NavLink>
          </nav>

          {/* Desktop right section (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Location Pill — reactive */}
            <button
              onClick={() => navigate('/customer')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 shrink min-w-0"
              title="Change service location"
              aria-label={`Current location: ${displayCity || 'Select location'}`}
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate max-w-[120px] lg:max-w-[160px]">
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
                  aria-label="Sign out"
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
                <span>Sign In</span>
              </NavLink>
            )}
          </div>

          {/* Mobile right controls (visible ONLY on mobile < md) */}
          <div className="flex md:hidden items-center gap-1.5 shrink min-w-0">
            {/* Location Pill — compact, non-overflowing */}
            <button
              onClick={() => navigate('/customer')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200/90 shrink min-w-0"
              title="Change service location"
              aria-label={`Current location: ${displayCity || 'Select location'}`}
            >
              <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="truncate max-w-[70px] xs:max-w-[100px]">
                {displayCity || 'Location'}
              </span>
              <span className="text-[10px] text-indigo-600 font-bold shrink-0">
                {displayCity ? 'Change' : 'Set'}
              </span>
            </button>

            {/* Mobile Menu / Account button */}
            <button
              className="p-1.5 text-slate-700 active:bg-slate-100 rounded-xl border border-slate-200/90 transition-colors flex items-center justify-center shrink-0 min-h-[36px] min-w-[36px]"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation and account menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-slate-700" /> : <Menu className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl px-4 py-3.5 space-y-3 shadow-xl animate-fadeIn">
            {/* Account / User section */}
            {user ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Hi, {user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white text-rose-600 hover:bg-rose-50 active:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold shrink-0 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-indigo-950">Customer Account</p>
                  <p className="text-[11px] text-indigo-700">Sign in to track orders & tickets</p>
                </div>
                <NavLink
                  to="/login?portal=customer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </NavLink>
              </div>
            )}

            {/* Portal Switcher in Mobile Menu */}
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1 mb-2">
                Switch Portal
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/technician');
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 active:bg-emerald-50 transition-colors text-left flex flex-col gap-1"
                >
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Technician</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Field work terminal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/manager');
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 active:bg-amber-50 transition-colors text-left flex flex-col gap-1"
                >
                  <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Manager</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Operations dispatch</span>
                </button>
              </div>
            </div>

            {/* Navigation links */}
            <div className="pt-1 border-t border-slate-100 space-y-1">
              {navLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-700 hover:bg-slate-100 active:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{label}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
                </NavLink>
              ))}
              <NavLink
                to="/walkthrough?role=customer"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isActive ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-700 hover:bg-slate-100 active:bg-slate-100'
                  }`
                }
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>How Servora Works</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </NavLink>
              <NavLink
                to="/walkthrough"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isActive ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-700 hover:bg-slate-100 active:bg-slate-100'
                  }`
                }
              >
                <PlayCircle className="w-4 h-4 text-indigo-500" />
                <span>Product Walkthrough</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </NavLink>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      {/* pb-24 on mobile (space for bottom tab bar), py-6 on desktop */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-7 pb-28 sm:pb-10 overflow-x-hidden">
        <Outlet />
      </main>

      {/* ── Mobile Sticky Bottom Tab Bar (sm:hidden = hide on tablet+) ── */}
      <nav 
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 xs:px-4 py-1.5 flex items-center justify-between z-40 shadow-lg"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <NavLink
          to="/customer"
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] xs:text-[11px] font-semibold transition-colors min-w-0 ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 active:text-slate-600'
            }`
          }
        >
          <Home className="w-4 h-4 xs:w-5 xs:h-5 shrink-0" />
          <span className="truncate">Services</span>
        </NavLink>

        <NavLink
          to="/customer/requests"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] xs:text-[11px] font-semibold transition-colors min-w-0 ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 active:text-slate-600'
            }`
          }
        >
          <ClipboardList className="w-4 h-4 xs:w-5 xs:h-5 shrink-0" />
          <span className="truncate">My Requests</span>
        </NavLink>

        {/* Big central Book button — elevated, never overlapping sibling taps */}
        <div className="shrink-0 px-1 xs:px-2 -mt-5 flex flex-col items-center">
          <NavLink 
            to="/customer/request" 
            className="w-11 h-11 xs:w-12 xs:h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-transform"
            aria-label="Book new service request"
          >
            <Sparkles className="w-5 h-5 xs:w-6 xs:h-6 text-amber-300" />
          </NavLink>
          <span className="text-[10px] font-bold text-indigo-600 mt-0.5">Book</span>
        </div>

        <NavLink
          to="/customer/profile"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] xs:text-[11px] font-semibold transition-colors min-w-0 ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 active:text-slate-600'
            }`
          }
        >
          <UserIcon className="w-4 h-4 xs:w-5 xs:h-5 shrink-0" />
          <span className="truncate">Account</span>
        </NavLink>
      </nav>
    </div>
  );
};
