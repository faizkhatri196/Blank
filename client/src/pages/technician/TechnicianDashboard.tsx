import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { ServiceTicket, ServiceType } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ServiceBadge } from '../../components/common/ServiceBadge';
import {
  Wrench,
  MapPin,
  ArrowRight,
  Loader2,
  CheckCircle,
  Sun,
  Wind,
  Droplet,
  Zap,
  Hammer,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface TradeConfig {
  title: string;
  badge: string;
  scope: string;
  tools: string;
  safety: string;
  icon: any;
  iconBg: string;
  textColor: string;
  borderColor: string;
}

const TRADE_CONFIGS: Record<string, TradeConfig> = {
  SOLAR: {
    title: 'Solar PV Engineering Terminal',
    badge: 'Certified Solar Field Specialist',
    scope: 'PV array generation, inverter error codes, DC string isolation & grounding verification',
    tools: 'High-Voltage DC Clamp Meter, MC4 Disconnect Tool, Calibrated Multimeter',
    safety: 'LOTO DC Disconnect & AC Isolator prior to opening electrical enclosures',
    icon: Sun,
    iconBg: 'bg-amber-100 text-amber-700',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200 bg-amber-50/50',
  },
  AC: {
    title: 'AC / HVAC Engineering Terminal',
    badge: 'Certified HVAC Field Specialist',
    scope: 'Refrigerant pressure, compressor amps, thermal performance & coil diagnostics',
    tools: 'Manifold Gauge Set, Micron Gauge, Electronic Leak Detector, Thermal Probe',
    safety: 'Recover refrigerant safely; discharge start/run capacitors before inspection',
    icon: Wind,
    iconBg: 'bg-cyan-100 text-cyan-700',
    textColor: 'text-cyan-800',
    borderColor: 'border-cyan-200 bg-cyan-50/50',
  },
  PLUMBING: {
    title: 'Plumbing Professional Terminal',
    badge: 'Certified Plumbing Professional',
    scope: 'Pipe leakage isolation, pressure testing, drainage blockages & fixture fitting',
    tools: 'Adjustable Pipe Wrenches, Pressure Test Rig, Drain Auger, Teflon Sealant',
    safety: 'Isolate main water supply cock before disconnecting fittings; test pressure slowly',
    icon: Droplet,
    iconBg: 'bg-blue-100 text-blue-700',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200 bg-blue-50/50',
  },
  ELECTRICAL: {
    title: 'Electrical Professional Terminal',
    badge: 'Certified Electrical Specialist',
    scope: 'Circuit diagnostics, MCB nuisance tripping, phase voltage & load balance',
    tools: '1000V Insulated Screwdrivers, True-RMS Multimeter, Non-Contact Voltage Detector',
    safety: 'Verify dead before touching exposed terminals; adhere strictly to CEA safety standards',
    icon: Zap,
    iconBg: 'bg-yellow-100 text-yellow-700',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200 bg-yellow-50/50',
  },
  HOME_MAINTENANCE: {
    title: 'Home Maintenance & Civil Terminal',
    badge: 'Certified Civil & Maintenance Professional',
    scope: 'Tile bed repair, waterproofing barrier, wall seepage, masonry & structural fitments',
    tools: 'Surface Moisture Meter, Spirit Level, Masonry Trowel, Tile Cutter',
    safety: 'Wear protective goggles and respirator during demolition, grinding, or chemical application',
    icon: Hammer,
    iconBg: 'bg-emerald-100 text-emerald-700',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-200 bg-emerald-50/50',
  },
};

export const TechnicianDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<ServiceTicket[]>([]);
  const [technicianProfile, setTechnicianProfile] = useState<any>(null);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [ticketsRes, techsRes] = await Promise.all([
          apiClient.get('/tickets'),
          apiClient.get('/technicians'),
        ]);

        setJobs(ticketsRes.data.data.items || []);
        if (techsRes.data.data && techsRes.data.data.length > 0) {
          setTechnicianProfile(techsRes.data.data[0]);
        }
      } catch (err) {
        console.error('Failed to load technician dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const serviceTypes: ServiceType[] = technicianProfile?.serviceTypes || [];
  const isMultiService = serviceTypes.length > 1;
  const primaryService = serviceTypes[0] || 'SOLAR';
  const activeTradeConfig = TRADE_CONFIGS[primaryService] || TRADE_CONFIGS.SOLAR;

  const activeJobs = jobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED');
  const filteredActiveJobs = selectedServiceFilter === 'ALL'
    ? activeJobs
    : activeJobs.filter((j) => j.serviceType === selectedServiceFilter);

  return (
    <div className="space-y-4">
      {/* Service-Aware Professional Terminal Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${isMultiService ? 'bg-indigo-100 text-indigo-700' : activeTradeConfig.iconBg}`}>
            {isMultiService ? (
              <Layers className="w-6 h-6" />
            ) : (
              <activeTradeConfig.icon className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {isMultiService ? 'Multi-Trade Field Professional Terminal' : activeTradeConfig.title}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {isMultiService ? `${serviceTypes.length} Active Trades` : activeTradeConfig.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {technicianProfile?.name ? `${technicianProfile.name} • ` : ''}
              {activeJobs.length} active service dispatch{activeJobs.length === 1 ? '' : 'es'} in assigned queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            {activeJobs.length}
          </div>
        </div>
      </div>

      {/* Trade-Specific Professional Scope & Safety Card */}
      {!isMultiService && (
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${activeTradeConfig.borderColor}`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold uppercase tracking-wider text-[10px] ${activeTradeConfig.textColor}`}>
              Professional Operational Scope
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              Tooling: {activeTradeConfig.tools.split(',')[0]}
            </span>
          </div>
          <p className="text-slate-700 text-xs">
            {activeTradeConfig.scope}
          </p>
          <div className="pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span><strong>Safety Protocol:</strong> {activeTradeConfig.safety}</span>
          </div>
        </div>
      )}

      {/* Multi-Service Trade Selector Tabs */}
      {isMultiService && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            My Qualified Trades
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedServiceFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedServiceFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Trades ({activeJobs.length})
            </button>
            {serviceTypes.map((type) => {
              const count = activeJobs.filter((j) => j.serviceType === type).length;
              const cfg = TRADE_CONFIGS[type] || TRADE_CONFIGS.SOLAR;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedServiceFilter(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedServiceFilter === type
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <cfg.icon className="w-3.5 h-3.5" />
                  <span>{type.replace('_', ' ')}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Job Execution Queue */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span className="text-xs font-semibold">Loading assigned jobs...</span>
        </div>
      ) : filteredActiveJobs.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="text-sm font-bold text-slate-800">
            {selectedServiceFilter === 'ALL' ? 'All Caught Up!' : `No Active ${selectedServiceFilter.replace('_', ' ')} Jobs`}
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedServiceFilter === 'ALL'
              ? 'You have no active pending dispatches. New jobs assigned by the service manager will appear here.'
              : `You have no pending requests in ${selectedServiceFilter.replace('_', ' ')}. Check other verticals or wait for dispatch.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActiveJobs.map((job) => (
            <Link
              key={job._id}
              to={`/technician/jobs/${job._id}/execute`}
              className="block bg-white p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 shadow-sm active:scale-[0.99] transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">{job.ticketNumber}</span>
                  <ServiceBadge serviceType={job.serviceType} size="sm" />
                </div>
                <PriorityBadge priority={job.priority} />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800 line-clamp-2">"{job.complaint}"</p>
                {job.errorCode && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Code: {job.errorCode}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{job.customerId?.name}</span>
                  <StatusBadge status={job.status} size="sm" />
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{job.customerId?.address}, {job.customerId?.city}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50/50 p-2.5 rounded-xl">
                <span>Start / Continue Fieldwork</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
