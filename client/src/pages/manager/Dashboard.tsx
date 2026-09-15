import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { PilotMetrics, ServiceTicket, Technician } from '../../types';
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
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { activeServiceFilter } = useAuth();
  const [metrics, setMetrics] = useState<PilotMetrics | null>(null);
  const [recentTickets, setRecentTickets] = useState<ServiceTicket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const [metricsRes, ticketsRes, techsRes] = await Promise.all([
          apiClient.get(`/pilot/metrics?serviceType=${activeServiceFilter}`),
          apiClient.get(`/tickets?limit=8&serviceType=${activeServiceFilter}`),
          apiClient.get(`/technicians?serviceType=${activeServiceFilter}`),
        ]);

        setMetrics(metricsRes.data.data);
        setRecentTickets(ticketsRes.data.data.items);
        setTechnicians(techsRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, [activeServiceFilter]);

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
            Real-time field operations, AI preparation & technician readiness
          </p>
        </div>

        <Link
          to="/manager/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          + New Service Request
        </Link>
      </div>

      {/* Primary KPI Grid (Directly from MongoDB Atlas) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <MetricCard
          title="Open Service Jobs"
          value={metrics?.overview.openTickets ?? 0}
          subtitle="Currently active in pipeline"
          icon={<ClipboardList className="w-4 h-4 text-amber-500" />}
          tone="warning"
        />
        <MetricCard
          title="Available Techs"
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
                      {t.isDemoData && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          DEMO
                        </span>
                      )}
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
                            : 'bg-sky-100 text-sky-800'
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
