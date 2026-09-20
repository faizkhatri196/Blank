import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  User,
  Wrench,
  Building2,
  CheckCircle2,
  Info,
  MapPin,
  Phone,
} from 'lucide-react';
import { saveCustomerLocation } from '../../utils/customerLocation';
import { ServoraLogo } from '../../components/common/ServoraLogo';

type PortalRole = 'customer' | 'technician' | 'manager';

export const Login: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Selected portal tab (default to customer or from URL param)
  const initialPortal = (searchParams.get('portal') as PortalRole) || 'customer';
  const [activePortal, setActivePortal] = useState<PortalRole>(
    ['customer', 'technician', 'manager'].includes(initialPortal) ? initialPortal : 'customer'
  );

  const isSessionExpired = searchParams.get('session_expired') === 'true';

  // Mode: LOGIN or SIGNUP (Customer signup or Manager company signup)
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Common Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Customer Signup form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Company Signup form state
  const [companyName, setCompanyName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState<'SOLAR' | 'AC/HVAC' | 'BOTH'>('SOLAR');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(localStorage.getItem('servora_api_url') || '');
  const [apiSavedNotice, setApiSavedNotice] = useState(false);

  // Sync active portal with URL search param
  const handleSelectPortal = (portal: PortalRole) => {
    setActivePortal(portal);
    setError(null);
    setMode('LOGIN');
    setSearchParams({ portal });
  };

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customApiUrl.trim()) {
      localStorage.setItem('servora_api_url', customApiUrl.trim());
      setApiSavedNotice(true);
      setError(null);
      setTimeout(() => setApiSavedNotice(false), 3000);
    }
  };

  // Standard Login submit
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email: email.trim(), password });
      const { token, user } = res.data.data;
      login(token, user);

      if (user.role === 'SERVICE_MANAGER') {
        navigate('/manager/dashboard');
      } else if (user.role === 'CUSTOMER') {
        navigate('/customer');
      } else {
        navigate('/technician/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Customer Signup submit
  const handleSubmitCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupPassword !== confirmPassword) {
      setError("Passwords don't match. Please check and try again.");
      return;
    }

    if (!customerCity.trim()) {
      setError('Please enter your city to create your customer account.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/customer-signup', {
        name: customerName.trim(),
        email: signupEmail.trim(),
        phone: customerPhone.trim(),
        password: signupPassword,
        city: customerCity.trim(),
        address: customerAddress.trim(),
      });

      const { token, user } = res.data.data;
      login(token, user);
      saveCustomerLocation({ city: customerCity.trim(), area: customerAddress.trim() }, user.id);
      navigate('/customer');
    } catch (err: any) {
      setError(err.message || 'Unable to create customer account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Company Manager Signup submit
  const handleSubmitCompanySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupPassword !== confirmPassword) {
      setError("Passwords don't match. Please check and try again.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/signup', {
        companyName: companyName.trim(),
        managerName: managerName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        confirmPassword,
        phone: phone.trim(),
        serviceType,
      });

      const { token, user } = res.data.data;
      login(token, user);
      navigate('/manager/dashboard');
    } catch (err: any) {
      setError(err.message || 'Unable to create company workspace. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center px-4 mb-6 flex flex-col items-center">
        <ServoraLogo variant="badge" inverted size="xl" />
        <div className="mt-4 flex items-center justify-center gap-2">
          <Link
            to="/portals"
            className="text-[11px] font-semibold text-slate-300 hover:text-white underline"
          >
            Browse All 3 Portals Directory
          </Link>
          <span className="text-slate-600">•</span>
          <Link
            to="/walkthrough"
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Product Walkthrough
          </Link>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
        {/* Session Expired Notice */}
        {isSessionExpired && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5 shadow-sm">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Your previous session has timed out. Please sign in with your account to continue.</span>
          </div>
        )}

        {/* Portal Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mb-4 shadow-lg backdrop-blur-md">
          {/* Customer Tab */}
          <button
            type="button"
            onClick={() => handleSelectPortal('customer')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activePortal === 'customer'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="truncate">Customer</span>
          </button>

          {/* Technician Tab */}
          <button
            type="button"
            onClick={() => handleSelectPortal('technician')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activePortal === 'technician'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span className="truncate">Technician</span>
          </button>

          {/* Operations Manager Tab */}
          <button
            type="button"
            onClick={() => handleSelectPortal('manager')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activePortal === 'manager'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="truncate">Manager</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white py-6 px-4 xs:px-6 sm:px-9 shadow-2xl rounded-3xl border border-slate-100 max-w-full">
          {/* Role Header Banner */}
          <div className="mb-5 pb-4 border-b border-slate-100">
            {activePortal === 'customer' && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Customer Experience Portal
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Homeowner / Facility</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 leading-snug">
                  {mode === 'LOGIN' ? 'Sign In to Customer Portal' : 'Create Customer Account'}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {mode === 'LOGIN'
                    ? 'Track service requests, live technician GPS ETA, and digital completion reports.'
                    : 'Set up your customer account for rapid repair booking and tracking.'}
                </p>
              </div>
            )}

            {activePortal === 'technician' && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Field Engineer Mobile Terminal
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Field Service Pro</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 leading-snug">Technician Sign In</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Access assigned job tickets, GPS navigation, AI diagnostic aids, and submit reports.
                </p>
              </div>
            )}

            {activePortal === 'manager' && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    Company Operations Suite
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Company Dispatch & HQ</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 leading-snug">
                  {mode === 'LOGIN' ? 'Operations Manager Sign In' : 'Register Service Company'}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {mode === 'LOGIN'
                    ? 'Automated 5-factor dispatching, team telemetry, and AI diagnosis confidence auditing.'
                    : 'Register your service company workspace and configure service areas.'}
                </p>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>

              {error.includes('Unable to reach Servora backend') && (
                <div className="mt-2 pt-2 border-t border-red-200/80">
                  <span className="font-bold block text-red-900 mb-1">
                    Backend Service Connection:
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="https://servora-1-o7dc.onrender.com"
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrl(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-red-300 rounded-lg text-xs bg-white text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveApiUrl}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                    >
                      Connect
                    </button>
                  </div>
                  {apiSavedNotice && (
                    <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                      ✓ Backend connected! Please click sign in again.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Container */}
          {mode === 'LOGIN' ? (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      activePortal === 'customer'
                        ? 'name@example.com'
                        : activePortal === 'technician'
                        ? 'tech@service.com'
                        : 'manager@company.com'
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-2 py-3 px-4 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] ${
                  activePortal === 'customer'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : activePortal === 'technician'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to{' '}
                    {activePortal === 'customer'
                      ? 'Customer Portal'
                      : activePortal === 'technician'
                      ? 'Technician Terminal'
                      : 'Operations Suite'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Bottom Actions based on active portal */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-center text-xs">
                {activePortal === 'customer' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('SIGNUP');
                        setError(null);
                      }}
                      className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      New customer? Create Customer Account →
                    </button>
                    <Link
                      to="/customer"
                      className="text-slate-500 hover:text-slate-800 hover:underline text-[11px]"
                    >
                      Or browse & book services without signing in →
                    </Link>
                  </>
                )}

                {activePortal === 'technician' && (
                  <p className="text-[11px] text-slate-400">
                    Technician accounts are provisioned by company dispatchers. Contact your manager if you need login access.
                  </p>
                )}

                {activePortal === 'manager' && (
                  <Link
                    to="/onboarding"
                    className="font-bold text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    New service company? Complete Guided Onboarding →
                  </Link>
                )}
              </div>
            </form>
          ) : activePortal === 'customer' ? (
            /* Customer Signup Form */
            <form onSubmit={handleSubmitCustomerSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Pooja Patel"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    City / Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Enter your city"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Street Address (Optional)
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="e.g. Flat 402, Shivalik Residency"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Customer Account...
                  </>
                ) : (
                  <>
                    Create Customer Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800 hover:underline"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          ) : (
            /* Manager Company Signup */
            <form onSubmit={handleSubmitCompanySignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Company / Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Solar Solutions"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Manager Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Rajesh Mehta"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="manager@company.com"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-amber-600 hover:bg-amber-700 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Workspace...
                  </>
                ) : (
                  <>
                    Create Service Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800 hover:underline"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Enterprise Field Service Platform • Protected by Servora Auth Guard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
