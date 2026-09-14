import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { Shield, Sun, Wind, Lock, Mail, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [envMode, setEnvMode] = useState<'PILOT' | 'DEMO'>('PILOT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      login(token, user);

      if (user.role === 'SERVICE_MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/technician/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          SERVORA
        </h1>
        <p className="mt-1.5 text-xs text-emerald-400 font-medium tracking-wide uppercase">
          AI-powered field service operations
        </p>

        {/* Environment Context Switcher */}
        <div className="mt-5 inline-flex p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setEnvMode('PILOT');
              setEmail('');
              setPassword('');
              setError(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              envMode === 'PILOT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            Real Client Pilot
          </button>
          <button
            type="button"
            onClick={() => {
              setEnvMode('DEMO');
              setEmail('');
              setPassword('');
              setError(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              envMode === 'DEMO'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Public Demo (Solar + AC)
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          
          {/* Active Environment Banner */}
          {envMode === 'PILOT' ? (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  REAL PILOT ENVIRONMENT
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  Gujarat Solar O&M Pilot • Isolated Tenant • Zero Demo Data
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <Sun className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  PUBLIC DEMO ENVIRONMENT
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  Interactive Demo Data • Solar & AC/HVAC Scenarios
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={envMode === 'PILOT' ? 'manager@pilot.com' : 'manager@demo.com'}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 py-2.5 px-4 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                envMode === 'PILOT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to {envMode === 'PILOT' ? 'Pilot' : 'Demo'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Helpers Separated by Environment */}
          {envMode === 'PILOT' ? (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pilot Tenant Accounts
                </span>
                <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded">
                  Password: Pilot@2026
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('manager@pilot.com', 'Pilot@2026')}
                  className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 transition-all group"
                >
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 flex items-center justify-between">
                    Pilot Manager
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">manager@pilot.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('tech@pilot.com', 'Pilot@2026')}
                  className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 transition-all group"
                >
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 flex items-center justify-between">
                    Pilot Technician
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">tech@pilot.com</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Demo Accounts
                </span>
                <span className="text-[10px] text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded">
                  Password: Demo@12345
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('manager@demo.com', 'Demo@12345')}
                  className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-amber-500 bg-slate-50/70 hover:bg-amber-50/40 transition-all group"
                >
                  <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Manager (Demo)</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">manager@demo.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('rahul@demo.com', 'Demo@12345')}
                  className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-amber-500 bg-slate-50/70 hover:bg-amber-50/40 transition-all group"
                >
                  <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Solar Tech (Demo)</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">rahul@demo.com</div>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
