import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { PilotMetrics, ServiceTicket, Technician, ActiveFieldOperation, LocationFreshness } from '../../types';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ServiceBadge } from '../../components/common/ServiceBadge';
import {
  ClipboardList,
  UserCheck,
  CheckCircle2,
  Brain,
  RotateCcw,
  Plus,
  ArrowRight,
  Sun,
  Wind,
  Loader2,
  Navigation,
  MapPin,
  Clock,
  Radio,
  X,
  ExternalLink,
  Phone,
  Check,
  RefreshCw,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { activeServiceFilter } = useAuth();
  const [metrics, setMetrics] = useState<PilotMetrics | null>(null);
  const [recentTickets, setRecentTickets] = useState<ServiceTicket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [fieldOps, setFieldOps] = useState<{
    kpis: {
      activeServices: number;
      onTheWay: number;
      onSite: number;
      diagnosing: number;
      repairing: number;
      completedToday: number;
    };
    operations: ActiveFieldOperation[];
  } | null>(null);
  const [selectedOp, setSelectedOp] = useState<ActiveFieldOperation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingOps, setIsRefreshingOps] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, ticketsRes, techsRes, opsRes] = await Promise.all([
        apiClient.get(`/pilot/metrics?serviceType=${activeServiceFilter}`),
        apiClient.get(`/tickets?limit=8&serviceType=${activeServiceFilter}`),
        apiClient.get(`/technicians?serviceType=${activeServiceFilter}`),
        apiClient.get(`/field-operations/active?serviceType=${activeServiceFilter}`).catch(() => null),
      ]);

      setMetrics(metricsRes.data.data);
      setRecentTickets(ticketsRes.data.data.items);
      setTechnicians(techsRes.data.data);
      if (opsRes?.data?.data) {
        setFieldOps(opsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshingOps(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchDashboardData();
  }, [activeServiceFilter]);

  const handleRefreshOps = async () => {
    setIsRefreshingOps(true);
    try {
      const opsRes = await apiClient.get(`/field-operations/active?serviceType=${activeServiceFilter}`);
      if (opsRes?.data?.data) {
        setFieldOps(opsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to refresh field operations:', err);
    } finally {
      setIsRefreshingOps(false);
    }
  };

  const getFreshnessBadge = (freshness?: LocationFreshness) => {
    if (!freshness || freshness.level === 'UNAVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          UNAVAILABLE
        </span>
      );
    }
    if (freshness.level === 'FRESH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 -ml-2.5" />
          LIVE (&lt;2m)
        </span>
      );
    }
    if (freshness.level === 'WARM') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          RECENT (2-10m)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        STALE (&gt;10m)
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <span className="text-sm font-semibold">Loading operations telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Service Operations Dashboard
          </h2>
          <p className="text-xs text-slate-500">
            Real-time field operations, location telemetry, AI preparation & technician readiness
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshOps}
            disabled={isRefreshingOps}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOps ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh Telemetry
          </button>
          <Link
            to="/manager/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            + New Service Request
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (MongoDB Atlas Metrics) */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <MetricCard
          title="Open Requests"
          value={metrics?.overview.openTickets ?? 0}
          subtitle="Currently active in pipeline"
          icon={<ClipboardList className="w-4 h-4 text-amber-500" />}
          tone="warning"
        />
        <MetricCard
          title="Available Technicians"
          value={metrics?.overview.availableTechnicians ?? 0}
          fraction={`${metrics?.overview.availableTechnicians ?? 0}/${metrics?.overview.totalTechnicians ?? 0}`}
          subtitle="Ready for dispatch"
          icon={<UserCheck className="w-4 h-4 text-emerald-500" />}
          tone="success"
        />
        <MetricCard
          title="Completed Jobs"
          value={metrics?.overview.completedTickets ?? 0}
          subtitle="Groundwork verified"
          icon={<CheckCircle2 className="w-4 h-4 text-blue-500" />}
          tone="info"
        />
        <MetricCard
          title="AI Analyzed"
          value={metrics?.overview.aiAnalyzedTickets ?? 0}
          subtitle="Diagnostic checklists built"
          icon={<Brain className="w-4 h-4 text-purple-500" />}
        />
        <MetricCard
          title="Diagnosis Match"
          value={`${metrics?.rates.diagnosisMatch.percentage ?? 0}%`}
          fraction={metrics?.rates.diagnosisMatch.display}
          subtitle="AI vs Field Truth"
          icon={<RotateCcw className="w-4 h-4 text-emerald-600" />}
          tone="success"
        />
      </div>

      {/* REAL-TIME FIELD OPERATIONS SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-4 sm:p-6 rounded-2xl shadow-xl border border-emerald-900/40 space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Active Field Operations
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live field dispatches, real-time technician coordinates and milestone tracking
              </p>
            </div>
          </div>

          {/* Operational Quick Stats Strip (Responsive 3x2 on mobile, 6x1 on desktop) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full sm:w-auto">
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold truncate">Active</span>
              <span className="text-sm font-extrabold text-white">
                {fieldOps?.kpis.activeServices ?? 0}
              </span>
            </div>
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-800/40 text-center">
              <span className="text-[10px] text-cyan-300 block font-semibold truncate">En Route</span>
              <span className="text-sm font-extrabold text-cyan-200">
                {fieldOps?.kpis.onTheWay ?? 0}
              </span>
            </div>
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-amber-950/50 border border-amber-800/40 text-center">
              <span className="text-[10px] text-amber-300 block font-semibold truncate">On Site</span>
              <span className="text-sm font-extrabold text-amber-200">
                {fieldOps?.kpis.onSite ?? 0}
              </span>
            </div>
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-purple-950/50 border border-purple-800/40 text-center">
              <span className="text-[10px] text-purple-300 block font-semibold truncate">Diagnosing</span>
              <span className="text-sm font-extrabold text-purple-200">
                {fieldOps?.kpis.diagnosing ?? 0}
              </span>
            </div>
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-blue-950/50 border border-blue-800/40 text-center">
              <span className="text-[10px] text-blue-300 block font-semibold truncate">Repairing</span>
              <span className="text-sm font-extrabold text-blue-200">
                {fieldOps?.kpis.repairing ?? 0}
              </span>
            </div>
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
              <span className="text-[10px] text-emerald-300 block font-semibold truncate">Closed</span>
              <span className="text-sm font-extrabold text-emerald-200">
                {fieldOps?.kpis.completedToday ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Live Operations Cards Grid */}
        {(!fieldOps?.operations || fieldOps.operations.length === 0) ? (
          <div className="py-10 text-center bg-slate-800/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No field operations currently in transit or on site. Dispatched jobs will stream here automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {fieldOps.operations.map((op) => (
              <div
                key={op.ticketId}
                onClick={() => setSelectedOp(op)}
                className="bg-slate-800/90 hover:bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-emerald-500/60 transition-all cursor-pointer shadow-md hover:shadow-emerald-900/20 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-white">
                        {op.ticketNumber}
                      </span>
                      <ServiceBadge serviceType={op.serviceType} size="sm" />
                    </div>
                    {getFreshnessBadge(op.technician?.locationFreshness)}
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                      <span className="truncate">{op.customerName}</span>
                      <StatusBadge status={op.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {op.serviceLocation.area ? `${op.serviceLocation.area}, ` : ''}{op.serviceLocation.city}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-[11px]">
                      {op.technician ? op.technician.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-200">
                        {op.technician ? op.technician.name : 'Unassigned'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {op.technician ? op.technician.phone : 'Pending dispatch'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOp(op);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-[11px] font-bold transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SLIDE-OUT SERVICE DETAIL DRAWER */}
      {selectedOp && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="p-6 space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 font-mono">
                      {selectedOp.ticketNumber}
                    </span>
                    <ServiceBadge serviceType={selectedOp.serviceType} size="sm" />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Field Operation Real-Time Telemetry
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOp(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Freshness Strip */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Current Milestone
                  </span>
                  <StatusBadge status={selectedOp.status} size="sm" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 text-right">
                    Telemetry Freshness
                  </span>
                  {getFreshnessBadge(selectedOp.technician?.locationFreshness)}
                </div>
              </div>

              {/* Customer Contact */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer & Destination
                </span>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedOp.customerName}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{selectedOp.serviceLocation.address}</p>
                    <p className="text-xs text-slate-500">
                      {selectedOp.serviceLocation.area ? `${selectedOp.serviceLocation.area}, ` : ''}{selectedOp.serviceLocation.city}
                    </p>
                  </div>
                  {selectedOp.customerPhone && (
                    <a
                      href={`tel:${selectedOp.customerPhone}`}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 text-xs font-bold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  )}
                </div>
              </div>

              {/* Technician In Charge */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Field Technician In Charge
                </span>
                {selectedOp.technician ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{selectedOp.technician.name}</div>
                      <div className="text-xs text-slate-500">
                        {selectedOp.technician.phone}
                      </div>
                    </div>
                    <a
                      href={`tel:${selectedOp.technician.phone}`}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 text-xs font-bold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-1">
                    Technician dispatch pending.
                  </div>
                )}
              </div>

              {/* Coordinates & Location Telemetry */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">Device Location Telemetry</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedOp.technician?.currentLocation?.timestamp
                      ? new Date(selectedOp.technician.currentLocation.timestamp).toLocaleTimeString()
                      : 'No broadcast'}
                  </span>
                </div>

                {selectedOp.technician?.currentLocation?.latitude && selectedOp.technician?.currentLocation?.longitude ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Latitude</span>
                        <span className="font-bold text-white">{selectedOp.technician.currentLocation.latitude.toFixed(6)}</span>
                      </div>
                      <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Longitude</span>
                        <span className="font-bold text-white">{selectedOp.technician.currentLocation.longitude.toFixed(6)}</span>
                      </div>
                    </div>

                    <a
                      href={`https://maps.google.com/?q=${selectedOp.technician.currentLocation.latitude},${selectedOp.technician.currentLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Google Maps
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-2">
                    Technician has not broadcast device coordinates for this job yet.
                  </div>
                )}
              </div>

              {/* Milestone Timeline */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Milestone Progress
                </span>
                <div className="space-y-2">
                  {selectedOp.progressSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${
                        step.completed
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                          : step.current
                          ? 'bg-amber-50 border border-amber-300 text-amber-700 animate-pulse'
                          : 'bg-slate-100 border border-slate-200 text-slate-400'
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${step.completed ? 'text-slate-800' : step.current ? 'text-amber-700' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Latest Activity Note */}
              {selectedOp.latestActivity && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold">{selectedOp.latestActivity.action}</span>
                    <span className="text-[10px]">{new Date(selectedOp.latestActivity.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {selectedOp.latestActivity.note && (
                    <p className="text-slate-700 font-medium italic">"{selectedOp.latestActivity.note}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
              <Link
                to={`/manager/tickets/${selectedOp.ticketId}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center shadow-sm"
              >
                Open Full Ticket Console →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Service Vertical Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/50 to-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 uppercase">Solar Vertical Queue</div>
              <div className="text-xl font-black text-slate-900">
                {metrics?.breakdown.solarCount ?? 0} Tickets
              </div>
            </div>
          </div>
          <Link
            to="/manager/tickets?serviceType=SOLAR"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            View Solar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50/50 to-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-sky-900 uppercase">AC / HVAC Queue</div>
              <div className="text-xl font-black text-slate-900">
                {metrics?.breakdown.acCount ?? 0} Tickets
              </div>
            </div>
          </div>
          <Link
            to="/manager/tickets?serviceType=AC"
            className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1"
          >
            View AC <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Live Ticket Pipeline + Technician Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Live Service Queue</h3>
            <Link
              to="/manager/tickets"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentTickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No tickets in queue. Click "+ New Service Request" to create one.
              </div>
            ) : (
              recentTickets.map((t) => (
                <Link
                  key={t._id}
                  to={`/manager/tickets/${t._id}`}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900">{t.ticketNumber}</span>
                      <ServiceBadge serviceType={t.serviceType} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate">{t.complaint}</p>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>{t.customerId?.name || 'Customer'}</span>
                      <span>•</span>
                      <span>{t.customerId?.city || 'City'}</span>
                      {t.assignedTechnicianId && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            Tech: {t.assignedTechnicianId.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Technician Status Roster */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900">Technician Roster</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {technicians.filter((tc) => tc.availability === 'AVAILABLE').length} Available
              </span>
              <Link
                to="/manager/technicians"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                + Add Tech
              </Link>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {technicians.map((tech) => (
              <div
                key={tech._id}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {tech.name}
                    <span className="text-[10px] font-normal text-slate-500">
                      ({tech.experienceYears}y exp)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tech.serviceTypes.map((st) => (
                      <span
                        key={st}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          st === 'SOLAR'
                            ? 'bg-amber-100 text-amber-800'
                            : st === 'AC'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {st}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {tech.serviceAreas[0]}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    tech.availability === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : tech.availability === 'BUSY'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {tech.availability}
                </span>
              </div>
            ))}
          </div>

          <Link
            to="/manager/technicians"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-center text-emerald-600 hover:text-emerald-700 block"
          >
            Manage Technicians & Skills →
          </Link>
        </div>
      </div>
    </div>
  );
};

