import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { ServiceTicket, AIAnalysis } from '../../types';
import { ServiceBadge } from '../../components/common/ServiceBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUpload } from '../../components/common/FileUpload';
import {
  Wrench,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Brain,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Camera,
  ThumbsUp,
  Loader2,
  Check,
  Zap,
  Radio,
} from 'lucide-react';

export const JobExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [asset, setAsset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isBroadcastingLocation, setIsBroadcastingLocation] = useState(false);
  const [lastBroadcastTime, setLastBroadcastTime] = useState<string | null>(null);

  // Field Completion Form state
  const [actualDiagnosis, setActualDiagnosis] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  // Solar Readings
  const [dcVoltage, setDcVoltage] = useState('');
  const [acVoltage, setAcVoltage] = useState('');
  const [dcCurrent, setDcCurrent] = useState('');
  // AC Readings
  const [indoorTemp, setIndoorTemp] = useState('');
  const [grilleTemp, setGrilleTemp] = useState('');
  const [suctionPressure, setSuctionPressure] = useState('');
  const [operatingAmps, setOperatingAmps] = useState('');

  const [partsUsedInput, setPartsUsedInput] = useState('');
  const [toolsUsedInput, setToolsUsedInput] = useState('MULTIMETER, CLAMP_METER');
  const [beforePhoto, setBeforePhoto] = useState('');
  const [afterPhoto, setAfterPhoto] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [aiAccuracyRating, setAiAccuracyRating] = useState(5);
  const [wasAiSuggestionUseful, setWasAiSuggestionUseful] = useState<'YES' | 'PARTIALLY' | 'NO'>('YES');
  const [didTechnicianHaveRequiredTools, setDidTechnicianHaveRequiredTools] = useState<'YES' | 'NO'>('YES');
  const [wasSecondVisitRequired, setWasSecondVisitRequired] = useState<'YES' | 'NO'>('NO');
  const [secondVisitReason, setSecondVisitReason] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locationSharingNotice, setLocationSharingNotice] = useState<string | null>(null);

  const loadTicket = async () => {
    try {
      const res = await apiClient.get(`/tickets/${id}`);
      setTicket(res.data.data.ticket);
      setAsset(res.data.data.asset);
    } catch (err) {
      console.error('Failed to load job execution:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const broadcastLocation = async () => {
    if (!navigator.geolocation) {
      setLocationSharingNotice('Location sharing unavailable');
      return;
    }
    setIsBroadcastingLocation(true);
    setLocationSharingNotice(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await apiClient.patch('/technicians/me/location', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            activeTicketId: ticket?._id,
          });
          setLastBroadcastTime(new Date().toLocaleTimeString());
          setLocationSharingNotice(null);
        } catch (err: any) {
          console.error('Failed to broadcast location:', err);
        } finally {
          setIsBroadcastingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation error or permission denied:', err.message);
        setLocationSharingNotice('Location sharing unavailable');
        setIsBroadcastingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const handleAdvanceStatus = async (nextStatus: string, note?: string) => {
    setIsUpdatingStatus(true);
    try {
      await apiClient.patch(`/tickets/${id}/status`, { status: nextStatus, note });
      await loadTicket();
      if (['ON_THE_WAY', 'ON_SITE', 'DIAGNOSING', 'REPAIRING'].includes(nextStatus)) {
        broadcastLocation();
      }
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmittingReport(true);

    try {
      const partsUsed = partsUsedInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const toolsUsed = toolsUsedInput
        .split(',')
        .map((t) => t.trim().toUpperCase().replace(/\s+/g, '_'))
        .filter(Boolean);

      const readings: Record<string, any> = {};
      if (ticket?.serviceType === 'SOLAR') {
        if (dcVoltage) readings.dcVoltage = Number(dcVoltage);
        if (acVoltage) readings.acVoltage = Number(acVoltage);
        if (dcCurrent) readings.dcCurrent = Number(dcCurrent);
      } else {
        if (indoorTemp) readings.indoorTemp = Number(indoorTemp);
        if (grilleTemp) readings.grilleTemp = Number(grilleTemp);
        if (suctionPressure) readings.suctionPressurePSI = Number(suctionPressure);
        if (operatingAmps) readings.operatingCurrent = Number(operatingAmps);
      }

      await apiClient.post(`/service-reports/${id}`, {
        actualDiagnosis,
        workPerformed,
        readings,
        partsUsed,
        toolsUsed,
        beforePhotos: beforePhoto ? [beforePhoto] : [],
        afterPhotos: afterPhoto ? [afterPhoto] : [],
        technicianNotes,
        aiHelpful: aiAccuracyRating >= 3,
        aiAccuracyRating,
        aiUtilityRating: aiAccuracyRating,
        wasAiSuggestionUseful,
        didTechnicianHaveRequiredTools,
        wasSecondVisitRequired,
        secondVisitReason: wasSecondVisitRequired === 'YES' ? secondVisitReason : undefined,
        toolsHelpful: didTechnicianHaveRequiredTools === 'YES',
        partsHelpful: partsUsed.length > 0,
        additionalFeedback,
      });

      alert('Job completed successfully! Field report recorded.');
      navigate('/technician/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit completion report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading || !ticket) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <span className="text-xs font-semibold">Loading job execution terminal...</span>
      </div>
    );
  }

  const aiAnalysis: AIAnalysis | null = ticket.aiAnalysisId;

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/technician/dashboard"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Jobs
        </Link>
        <div className="flex items-center gap-2">
          <ServiceBadge serviceType={ticket.serviceType} size="sm" />
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </div>

      {/* Customer & Location Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">{ticket.customerId?.name}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {ticket.customerId?.address}, {ticket.customerId?.city}
              </span>
            </div>
          </div>

          <a
            href={`tel:${ticket.customerId?.phone}`}
            className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md active:scale-95 flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
        </div>

        {/* Equipment Mini Strip */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          {ticket.serviceType === 'SOLAR' && asset ? (
            <div>
              <span className="font-bold text-slate-800">
                {asset.capacityKW} kW • {asset.inverterMake} {asset.inverterModel}
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">
                Serial: {asset.inverterSerial || 'N/A'}
              </span>
            </div>
          ) : asset ? (
            <div>
              <span className="font-bold text-slate-800">
                {asset.brand} {asset.model} • {asset.capacityTR} TR ({asset.acType})
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">
                Gas: {asset.refrigerantType} | S/N: {asset.serialNumber || 'N/A'}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Complaint Box */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Customer Complaint
        </span>
        <p className="text-xs font-bold text-slate-900 leading-snug">"{ticket.complaint}"</p>
        {ticket.errorCode && (
          <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
            Reported Code: {ticket.errorCode}
          </div>
        )}
      </div>

      {/* STEPPED STATUS ACTION BAR (Sequential transitions) */}
      <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-800">Current Job Phase</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {ticket.status}
          </span>
        </div>

        {ticket.status === 'ASSIGNED' && (
          <button
            onClick={() => handleAdvanceStatus('ACCEPTED', 'Technician acknowledged dispatch')}
            disabled={isUpdatingStatus}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Accept This Dispatch
          </button>
        )}

        {ticket.status === 'ACCEPTED' && (
          <button
            onClick={() => handleAdvanceStatus('ON_THE_WAY', 'En route to customer site')}
            disabled={isUpdatingStatus}
            className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Start Journey (On The Way)
          </button>
        )}

        {ticket.status === 'ON_THE_WAY' && (
          <button
            onClick={() => handleAdvanceStatus('ON_SITE', 'Arrived at customer premises')}
            disabled={isUpdatingStatus}
            className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            Mark Arrived On Site
          </button>
        )}

        {ticket.status === 'ON_SITE' && (
          <button
            onClick={() => handleAdvanceStatus('DIAGNOSING', 'Beginning physical diagnosis & readings')}
            disabled={isUpdatingStatus}
            className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Wrench className="w-5 h-5" />
            Begin Physical Diagnosis
          </button>
        )}

        {ticket.status === 'DIAGNOSING' && (
          <button
            onClick={() => handleAdvanceStatus('REPAIRING', 'Beginning repair / component replacement')}
            disabled={isUpdatingStatus}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Wrench className="w-5 h-5" />
            Start Repair & Rectification
          </button>
        )}

        {ticket.status === 'COMPLETED' && (
          <div className="p-3 bg-green-50 text-green-800 font-bold text-center rounded-xl text-xs">
            Job is completed and ground truth recorded.
          </div>
        )}
      </div>

      {/* LIVE LOCATION TELEMETRY BROADCAST (Active jobs) */}
      {['ON_THE_WAY', 'ON_SITE', 'DIAGNOSING', 'REPAIRING'].includes(ticket.status) && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Field Location Sharing</span>
                  <span className={`w-2 h-2 rounded-full ${locationSharingNotice ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
                </div>
                <div className="text-[10px] text-slate-500">
                  {lastBroadcastTime
                    ? `Last broadcast: ${lastBroadcastTime}`
                    : locationSharingNotice
                    ? 'GPS unavailable — manual field reporting active'
                    : 'Coordinates shared on phase changes'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={broadcastLocation}
              disabled={isBroadcastingLocation}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
            >
              {isBroadcastingLocation ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Sync GPS
                </>
              )}
            </button>
          </div>

          {locationSharingNotice && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Location sharing unavailable. You can continue updating job status manually.</span>
            </div>
          )}
        </div>
      )}

      {/* AI ASSISTANCE PREPARATION CARD (High contrast for outdoors) */}
      {aiAnalysis && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4 border-2 border-purple-400">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <div>
                <h4 className="text-xs font-black tracking-wider text-purple-300">
                  AI ASSISTANCE — VERIFY ON SITE
                </h4>
                <div className="text-[10px] text-slate-400">Preliminary diagnostic hypothesis</div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
              {aiAnalysis.confidence} Confidence
            </span>
          </div>

          {/* Possible Causes */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Candidate Issues to Check First
            </span>
            <div className="space-y-1.5">
              {aiAnalysis.possibleIssues.map((iss, i) => (
                <div key={i} className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>{iss.issue}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200">
                      {iss.probabilityLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">{iss.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Steps */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Field Verification Steps
            </span>
            <div className="space-y-1 bg-slate-800/60 p-3 rounded-xl text-xs">
              {aiAnalysis.diagnosticSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-200 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tools & Parts Checklist */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
              <span className="font-bold text-slate-300 block mb-1">Tools Required:</span>
              <span className="text-slate-200">{aiAnalysis.recommendedTools.join(', ')}</span>
            </div>
            <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
              <span className="font-bold text-slate-300 block mb-1">Expected Parts:</span>
              <span className="text-purple-300">
                {aiAnalysis.possibleParts.length > 0 ? aiAnalysis.possibleParts.join(', ') : 'None expected'}
              </span>
            </div>
          </div>

          {/* Safety Alert */}
          {aiAnalysis.safetyWarnings.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Safety: </span>
                {aiAnalysis.safetyWarnings[0]}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FIELDWORK COMPLETION FORM (Active when on site or repairing) */}
      {(ticket.status === 'REPAIRING' || ticket.status === 'DIAGNOSING' || ticket.status === 'ON_SITE') && (
        <form
          onSubmit={handleSubmitCompletion}
          className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-xl space-y-4 text-xs"
        >
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Record Field Groundwork & Complete</h3>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
              * Required for closeout
            </span>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 font-semibold border border-red-200">
              {submitError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Actual Root Cause Diagnosis *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Loose DC MC4 connector at string combiner box causing open circuit."
              value={actualDiagnosis}
              onChange={(e) => setActualDiagnosis(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Work Performed & Remediation *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Replaced burnt MC4 connector pair, crimped with 1000V rated solar tool, verified continuity."
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
            />
          </div>

          {/* Service Specific Readings */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-700 block">
              {ticket.serviceType === 'SOLAR'
                ? 'Solar Array Electrical Readings'
                : ticket.serviceType === 'AC'
                ? 'HVAC Operating Temperatures & Pressure'
                : 'Service Specific Inspection & Technical Readings'}
            </span>

            {ticket.serviceType === 'SOLAR' ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">DC Volts (V)</label>
                  <input
                    type="number"
                    placeholder="e.g. 480"
                    value={dcVoltage}
                    onChange={(e) => setDcVoltage(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">AC Volts (V)</label>
                  <input
                    type="number"
                    placeholder="e.g. 235"
                    value={acVoltage}
                    onChange={(e) => setAcVoltage(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Current (A)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 14.5"
                    value={dcCurrent}
                    onChange={(e) => setDcCurrent(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
              </div>
            ) : ticket.serviceType === 'AC' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Indoor Temp (°C)</label>
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    value={indoorTemp}
                    onChange={(e) => setIndoorTemp(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Grille Temp (°C)</label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={grilleTemp}
                    onChange={(e) => setGrilleTemp(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Suction PSI</label>
                  <input
                    type="number"
                    placeholder="e.g. 125"
                    value={suctionPressure}
                    onChange={(e) => setSuctionPressure(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Running Amps (A)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 8.5"
                    value={operatingAmps}
                    onChange={(e) => setOperatingAmps(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                Inspection measurements recorded in technician completion notes and photos.
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Spare Parts Consumed (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. MC4 Connector Male/Female, 15A DC Fuse"
              value={partsUsedInput}
              onChange={(e) => setPartsUsedInput(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
            />
          </div>

          <div>
            <FileUpload
              label="Upload Completion Photo (Proof of work)"
              onUploadSuccess={(url) => setAfterPhoto(url)}
              onRemove={() => setAfterPhoto('')}
            />
          </div>

          {/* Pilot Feedback Section */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              Pilot Quality Feedback
            </span>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                AI Diagnostic Usefulness (1 to 5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setAiAccuracyRating(star)}
                    className={`flex-1 py-1.5 rounded-lg font-black text-xs transition-all ${
                      aiAccuracyRating === star
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {star} ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                Was the AI triage suggestion useful?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['YES', 'PARTIALLY', 'NO'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWasAiSuggestionUseful(opt)}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                      wasAiSuggestionUseful === opt
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                Did you have all required tools on first dispatch?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['YES', 'NO'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDidTechnicianHaveRequiredTools(opt)}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                      didTechnicianHaveRequiredTools === opt
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                Was a second visit required to resolve?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['YES', 'NO'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWasSecondVisitRequired(opt)}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                      wasSecondVisitRequired === opt
                        ? opt === 'YES'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {wasSecondVisitRequired === 'YES' && (
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Reason second visit was required *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inverter main board needed replacement; part not on truck"
                  value={secondVisitReason}
                  onChange={(e) => setSecondVisitReason(e.target.value)}
                  className="w-full border border-amber-300 rounded-lg p-2 text-xs bg-amber-50 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                Additional Field / Pilot Feedback
              </label>
              <textarea
                rows={2}
                placeholder="Notes on tool readiness, site access, customer clarity, etc."
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmittingReport}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmittingReport ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting Field Completion...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Submit Verified Completion Report
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
