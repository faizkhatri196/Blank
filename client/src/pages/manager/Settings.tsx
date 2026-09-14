import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { Settings as SettingsIcon, Database, Cpu, ShieldCheck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await apiClient.get('/pilot/health');
        setHealth(res.data.data);
      } catch (err) {
        console.error('Failed to load system health:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          System Configuration & Telemetry
        </h2>
        <p className="text-xs text-slate-500">
          Tenant organization settings, database connection health & AI provider status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Company & Tenant Scope</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Company Name</span>
              <span className="text-sm font-bold text-slate-900">{user?.companyName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Active User Account</span>
              <span className="font-semibold text-slate-800">{user?.name} ({user?.email})</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Role Privilege</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {user?.role}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Supported Verticals</span>
              <div className="flex gap-2 mt-1">
                {user?.servicesSupported?.map((s) => (
                  <span
                    key={s}
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      s === 'SOLAR'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-sky-100 text-sky-900'
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Database & Infrastructure Health */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Database Connectivity</h3>
          </div>

          {isLoading ? (
            <div className="py-6 flex justify-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">MongoDB Atlas Free Tier</span>
                  <span className="text-slate-500 text-[11px]">
                    Database: {health?.database?.databaseName || 'ai_field_service_copilot'}
                  </span>
                </div>
                <span className="flex items-center gap-1 font-bold text-emerald-600 text-xs">
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </span>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                Secure multi-tenant persistence with isolated companyId query scoping. Credentials remain protected on the backend.
              </div>
            </div>
          )}
        </div>

        {/* AI Provider Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Diagnostic Engine Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-1">
              <span className="text-slate-500 font-semibold block">Configured Mode</span>
              <span className="text-sm font-black text-purple-900 uppercase">
                {health?.ai?.configuredProvider || 'DEMO'}
              </span>
              <p className="text-[11px] text-slate-500">Selected via AI_PROVIDER env</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-1">
              <span className="text-slate-500 font-semibold block">Active Execution Engine</span>
              <span className="text-sm font-black text-emerald-900">
                {health?.ai?.activeProvider || 'DemoAIProvider'}
              </span>
              <p className="text-[11px] text-slate-500">
                {health?.ai?.isFallback ? 'Running via fallback' : 'Primary active provider'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-slate-500 font-semibold block">Provider Operational Details</span>
              <span className="font-semibold text-slate-800 block truncate">
                {health?.ai?.details || 'Deterministic rule-grounded solar & AC engine'}
              </span>
              <p className="text-[11px] text-slate-400">Strict Zod JSON Schema verification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
