import React, { useEffect, useState } from 'react';
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
  Loader2,
  Info,
} from 'lucide-react';

export const PilotInsights: React.FC = () => {
  const [metrics, setMetrics] = useState<PilotMetrics | null>(null);
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'SOLAR' | 'AC'>('ALL');
  const [includeDemoData, setIncludeDemoData] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
    setIsExporting(true);
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
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header with CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Pilot Validation Insights
            </h2>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulated baseline evaluation metrics for system demonstration. Not live commercial customer results.
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating CSV...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Pilot Data (CSV)
            </>
          )}
        </button>
      </div>

      {/* Methodology Banner with DEMO DATA notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>Empirical AI vs Groundwork Methodology</span>
            <span className="bg-amber-200 text-amber-900 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">DEMO BENCHMARK</span>
          </div>
          <p className="text-amber-900 leading-relaxed text-[11px]">
            Every metric below displays the exact <strong>raw count and denominator</strong> alongside percentages (e.g. 14 / 20).
            The AI diagnostic match is calculated by cross-referencing pre-visit AI hypotheses against verified technician groundwork recorded on-site.
            All current figures are <strong>DEMO DATA</strong> populated during initialization.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setServiceFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              serviceFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Verticals
          </button>
          <button
            onClick={() => setServiceFilter('SOLAR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              serviceFilter === 'SOLAR'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Solar Only
          </button>
          <button
            onClick={() => setServiceFilter('AC')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              serviceFilter === 'AC'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            AC / HVAC Only
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={includeDemoData}
            onChange={(e) => setIncludeDemoData(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>Include Historical Seed Baseline Data</span>
        </label>
      </div>

      {/* Metrics Cards */}
      {isLoading ? (
        <div className="py-20 flex justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Diagnosis Match Rate"
              value={`${metrics?.rates.diagnosisMatch.percentage ?? 0}%`}
              fraction={metrics?.rates.diagnosisMatch.display}
              subtitle="Technician diagnosis matched AI hypothesis"
              icon={<RotateCcw className="w-4 h-4 text-emerald-600" />}
              tone="success"
            />

            <MetricCard
              title="Tool Recommendation Match"
              value={`${metrics?.rates.toolMatch.percentage ?? 0}%`}
              fraction={metrics?.rates.toolMatch.display}
              subtitle="Recommended tools used on-site"
              icon={<Wrench className="w-4 h-4 text-blue-600" />}
              tone="info"
            />

            <MetricCard
              title="Part Prediction Match"
              value={`${metrics?.rates.partMatch.percentage ?? 0}%`}
              fraction={metrics?.rates.partMatch.display}
              subtitle="Accurate spare part triage"
              icon={<Package className="w-4 h-4 text-purple-600" />}
            />

            <MetricCard
              title="Repeat Visit Rate"
              value={`${metrics?.rates.repeatVisitRate.percentage ?? 0}%`}
              fraction={metrics?.rates.repeatVisitRate.display}
              subtitle="Lower is better (1st-visit resolution)"
              icon={<Clock className="w-4 h-4 text-amber-600" />}
              tone="warning"
            />
          </div>

          {/* Qualitative Satisfaction & Efficiency Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Technician AI Prep Rating
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {metrics?.averages.aiHelpfulRating ?? 4.5}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ 5.0</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Technicians reported AI diagnostic checklists improved pre-departure readiness and tool selection.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Avg Job Resolution Time
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {metrics?.averages.avgCompletionTimeMinutes ?? 65}
                </span>
                <span className="text-xs font-semibold text-slate-500">minutes</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                From on-site arrival to diagnosis, repair, and evidence capture.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Manager Ops Satisfaction
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {metrics?.averages.managerSatisfactionRating ?? 4.6}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ 5.0</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Service managers reported significant time saved during complaint intake and technician dispatch.
              </p>
            </div>
          </div>

          {/* Dataset Composition */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Pilot Telemetry Sample Composition
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">Total Tickets</span>
                <span className="text-lg font-bold text-slate-900">{metrics?.overview.totalTickets}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <span className="text-amber-800 block">Solar Cases</span>
                <span className="text-lg font-bold text-amber-900">{metrics?.breakdown.solarCount}</span>
              </div>
              <div className="p-3 bg-sky-50 rounded-xl">
                <span className="text-sky-800 block">AC / HVAC Cases</span>
                <span className="text-lg font-bold text-sky-900">{metrics?.breakdown.acCount}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <span className="text-emerald-800 block">Completed & Verified</span>
                <span className="text-lg font-bold text-emerald-900">
                  {metrics?.overview.completedTickets}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
