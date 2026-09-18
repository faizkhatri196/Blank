import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  // Only show demo helper if explicit URL query param ?demo=true is present (for internal tests)
  const isDemoDevMode = new URLSearchParams(window.location.search).get('demo') === 'true';

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup form state
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

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customApiUrl.trim()) {
      localStorage.setItem('servora_api_url', customApiUrl.trim());
      setApiSavedNotice(true);
      setError(null);
      setTimeout(() => setApiSavedNotice(false), 3000);
    }
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
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

  const handleSubmitSignup = async (e: React.FormEvent) => {
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
      if (err.message && err.message.includes('already exists')) {
        setError('An account with this email already exists.');
      } else if (err.message && err.message.includes('Unable to reach Servora backend')) {
        setError('Unable to create account. Please check the backend connection and try again.');
      } else {
        setError(err.message || 'Unable to create account. Please check the backend connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-lg">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          SERVORA
        </h1>
        <p className="mt-1.5 text-xs text-emerald-400 font-bold tracking-widest uppercase">
          AI-Powered Field Service Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {mode === 'LOGIN' ? 'Sign In to Your Workspace' : 'Create Service Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'LOGIN'
                ? 'Enter your authorized organization credentials to continue'
                : 'Set up your company workspace and manager account'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>

              {/* Seamless self-healing connect box when backend is waking up or on a new URL */}
              {error.includes('Unable to reach Servora backend') && (
                <div className="mt-2 pt-2 border-t border-red-200/80">
                  <span className="font-bold block text-red-900 mb-1">
                    Backend Service Connection:
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="https://servora-api.onrender.com"
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrl(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-red-300 rounded-lg text-xs bg-white text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveApiUrl}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                    >
                      Connect
                    </button>
                  </div>
                  {apiSavedNotice && (
                    <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                      ✓ Backend connected! Please click {mode === 'LOGIN' ? '"Sign In"' : '"Create Account"'} again.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
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
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Servora
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/onboarding"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  New service company? Complete Guided Onboarding →
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitSignup} className="space-y-3.5">
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
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
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
                    placeholder="e.g. Rahul Patel"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
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
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Service Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['SOLAR', 'AC/HVAC', 'BOTH'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setServiceType(type)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                        serviceType === type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Company Workspace...
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

          {/* Internal Debug/Demo panel ONLY visible when URL explicitly has ?demo=true */}
          {isDemoDevMode && (
            <div className="mt-6 pt-5 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Internal Quick-Fill (Test Mode Only)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@demo.com');
                    setPassword('Demo@12345');
                  }}
                  className="p-2 text-left rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-700 font-mono text-[11px]"
                >
                  Manager: manager@demo.com
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('technician@demo.com');
                    setPassword('Demo@12345');
                  }}
                  className="p-2 text-left rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-700 font-mono text-[11px]"
                >
                  Tech: technician@demo.com
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('customer@demo.com');
                    setPassword('Demo@12345');
                  }}
                  className="p-2 text-left rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-500 text-slate-700 font-mono text-[11px]"
                >
                  Customer: customer@demo.com
                </button>
              </div>
            </div>
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
