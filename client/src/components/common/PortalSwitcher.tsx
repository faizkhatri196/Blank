import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Wrench, Building2, Film, ChevronDown, Check, ExternalLink } from 'lucide-react';

interface PortalOption {
  id: 'customer' | 'technician' | 'manager' | 'film';
  title: string;
  subtitle: string;
  path: string;
  loginPath: string;
  icon: React.ElementType;
  badgeColor: string;
}

const PORTALS: PortalOption[] = [
  {
    id: 'customer',
    title: 'Customer Portal',
    subtitle: 'Book service, track live technician GPS, view invoices',
    path: '/customer',
    loginPath: '/login?portal=customer',
    icon: User,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'technician',
    title: 'Field Technician',
    subtitle: 'Mobile job terminal, AI diagnostics & closeout reports',
    path: '/technician',
    loginPath: '/login?portal=technician',
    icon: Wrench,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'manager',
    title: 'Operations Manager',
    subtitle: 'Dispatch board, team telemetry, AI triage & company settings',
    path: '/manager',
    loginPath: '/login?portal=manager',
    icon: Building2,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'film',
    title: 'Launch Film (4K)',
    subtitle: 'Cinematic SaaS platform vision & architecture overview',
    path: '/brand-film',
    loginPath: '/brand-film',
    icon: Film,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
];

interface PortalSwitcherProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const PortalSwitcher: React.FC<PortalSwitcherProps> = ({ className = '', variant = 'light' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current active portal
  const currentPath = location.pathname;
  let activePortalId: 'customer' | 'technician' | 'manager' | 'film' = 'customer';
  if (currentPath.startsWith('/technician')) activePortalId = 'technician';
  else if (currentPath.startsWith('/manager')) activePortalId = 'manager';
  else if (currentPath.startsWith('/brand-film') || currentPath.startsWith('/film')) activePortalId = 'film';

  const activePortal = PORTALS.find((p) => p.id === activePortalId) || PORTALS[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isDark = variant === 'dark';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
          isDark
            ? 'bg-slate-800/90 text-slate-100 border-slate-700 hover:bg-slate-700 shadow-sm'
            : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <activePortal.icon className="w-3.5 h-3.5 text-indigo-500" />
        <span className="hidden xs:inline">Portal:</span>
        <span className="font-extrabold">{activePortal.title.replace(' Portal', '')}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 p-2 animate-fadeIn">
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Switch Platform Portal
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/portals');
                }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
              >
                <span>Directory</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Direct access to role-tailored workspaces
            </p>
          </div>

          <div className="py-1 space-y-1">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const isActive = portal.id === activePortalId;

              return (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(portal.path);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                    isActive
                      ? 'bg-indigo-50/80 border border-indigo-200/60 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">{portal.title}</span>
                      {isActive && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded-full">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                      {portal.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-1 pt-2 border-t border-slate-100 px-2 py-1 flex items-center justify-between text-[11px]">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/login');
              }}
              className="font-bold text-slate-600 hover:text-slate-900"
            >
              Sign In with different role →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
