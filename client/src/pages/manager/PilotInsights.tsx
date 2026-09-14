import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { PilotMetrics } from '../../types';
import { MetricCard } from '../../components/common/MetricCard';
import {
  BarChart3,
  Download,
  RotateCcw,
  Wrench,
  Package,
  Clock,
  ThumbsUp,
  Sun,
  Wind,
  Layers,
  FileSpreadsheet,
  FileText,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const PilotInsights: React.FC = () => {
  const { user } = useAuth();
  const isPilot = user?.isPilotCompany || false;

  const [metrics, setMetrics] = useState<any | null>(null);
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'SOLAR' | 'AC'>('ALL');
  const [includeDemoData, setIncludeDemoData] = useState(!isPilot);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingMD, setIsExportingMD] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true);
      try {
        const res = await apiClient.get(
          `/pilot/metrics?serviceType=${serviceFilter}&includeDemoData=${includeDemoData}`
        );
        setMetrics(res.data.data);
      } catch (err) {
        console.error('Failed to load pilot metrics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMetrics();
  }, [serviceFilter, includeDemoData]);

  const handleDownloadCSV = async () => {
    setIsExportingCSV(true);
    try {
      const response = await apiClient.get('/pilot/export.csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pilot-evaluation-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleDownloadMD = async () => {
    setIsExportingMD(true);
    try {
      const response = await apiClient.get('/pilot/export.md', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `REAL_PILOT_REPORT-${new Date().toISOString().split('T')[0]}.md`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExportingMD(false);
    }
  };

  const hasData = metrics && metrics.overview && metrics.overview.completedTickets > 0;

  return (
    <div className="space-y-6">
      {/* Top Header with Exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isPilot ? 'Real Pilot Operational Analytics' : 'Pilot Validation Insights'}
            </h2>
            {isPilot ? (
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                REAL PILOT ENVIRONMENT
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                DEMO DATA
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isPilot
              ? 'Empirical field analytics derived solely from active Gujarat Solar client pilot operations.'
              : 'Simulated baseline evaluation metrics for system demonstration. Not live commercial customer results.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadMD}
            disabled={isExportingMD}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            {isExportingMD ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating MD...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Export REAL_PILOT_REPORT.md
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={isExportingCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            {isExportingCSV ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Methodology Banner */}
      <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
        isPilot ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}>
        <Info className={`w-5 h-5 shrink-0 mt-0.5 ${isPilot ? 'text-emerald-700' : 'text-amber-700'}`} />
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>Empirical AI vs Groundwork Methodology</span>
            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold ${
              isPilot ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
            }`}>
              {isPilot ? 'REAL_PILOT DATASET' : 'DEMO BENCHMARK'}
            </span>
          </div>
          <p className="leading-relaxed text-[11px]">
            {isPilot ? (
              <>
                Metrics in this tenant reflect <strong>100% genuine operational tickets</strong> created by your team.
                Servora never fabricates artificial accuracy, ROI, or technician success rates. All statistics are verified against physical technician fieldwork reports.
              </>
            ) : (
              <>
                Every metric below displays the exact <strong>raw count and denominator</strong> alongside percentages (e.g. 14 / 20).
                All current figures are <strong>DEMO DATA</strong> populated during initialization.
              </>
            )}
          </p>
        </div>
      </div>

      {/* When in Pilot and no jobs completed: Clean Honest Empty State */}
      {isPilot && !hasData && !isLoading && (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            NO REAL PILOT DATA RECORDED YET
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your client pilot environment is active and 100% isolated. No simulated cases or demo customers are shown here. Real operational metrics (AI match accuracy, first-time fix rate, tool readiness) will calculate dynamically as technicians execute service tickets on site.
          </p>
          <div className="pt-2">
            <span className="inline-block bg-slate-100 text-slate-600 font-mono font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200">
              STATUS: INSUFFICIENT PILOT DATA (0 COMPLETED JOBS)
            </span>
          </div>
        </div>
      )}

      {/* Metrics Content (Visible if Demo or Pilot has completed jobs) */}
      {(!isPilot || hasData) && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Jobs"
              value={metrics?.overview?.totalTickets ?? 0}
              subtitle={`${metrics?.overview?.completedTickets ?? 0} completed • ${metrics?.overview?.openTickets ?? 0} active`}
              icon={<BarChart3 className="w-5 h-5 text-slate-400" />}
              tone="default"
            />
            <MetricCard
              title="AI / Actual Match"
              value={metrics?.rates?.diagnosisMatch?.display || '0%'}
              subtitle="Aligned preliminary hypotheses"
              icon={<ThumbsUp className="w-5 h-5 text-emerald-600" />}
              tone="success"
            />
            <MetricCard
              title="First-Time Fix Rate"
              value={`${100 - (metrics?.rates?.repeatVisitRate?.percentage ?? 0)}%`}
              subtitle="Zero repeat visits required"
              icon={<RotateCcw className="w-5 h-5 text-emerald-600" />}
              tone="success"
            />
            <MetricCard
              title="Tool Readiness"
              value={metrics?.rates?.toolMatch?.display || '0%'}
              subtitle="Technician had required tools"
              icon={<Wrench className="w-5 h-5 text-emerald-600" />}
              tone="success"
            />
          </div>

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Operational Alignment Breakdown
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Diagnostic Alignment Rate</span>
                  <span className="font-bold text-slate-900">{metrics?.rates?.diagnosisMatch?.display || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Tool Inventory Match</span>
                  <span className="font-bold text-slate-900">{metrics?.rates?.toolMatch?.display || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Spare Parts Accuracy</span>
                  <span className="font-bold text-slate-900">{metrics?.rates?.partMatch?.display || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Repeat Visit Incidence</span>
                  <span className="font-bold text-slate-900">{metrics?.rates?.repeatVisitRate?.display || '0'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Field Feedback & Satisfaction
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Average AI Utility Rating</span>
                  <span className="font-bold text-slate-900">{metrics?.averages?.aiHelpfulRating ? `${metrics.averages.aiHelpfulRating} / 5.0` : 'Not rated yet'}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Available Technicians</span>
                  <span className="font-bold text-slate-900">{metrics?.overview?.availableTechnicians ?? 0} of {metrics?.overview?.totalTechnicians ?? 0}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Economic ROI Impact</span>
                  <span className="font-bold text-slate-900">Not measured yet (requires client cost inputs)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
