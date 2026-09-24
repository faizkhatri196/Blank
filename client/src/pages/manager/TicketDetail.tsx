import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  ServiceTicket,
  AIAnalysis,
  ServiceReport,
  ServiceHistory,
  TechnicianMatchResult,
} from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ServiceBadge } from '../../components/common/ServiceBadge';
import { Modal } from '../../components/common/Modal';
import {
  Brain,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Wrench,
  Package,
  ShieldAlert,
  Clock,
  ArrowLeft,
  ChevronRight,
  Phone,
  MapPin,
  Camera,
  Activity,
  ThumbsUp,
  FileCheck,
  Edit3,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [asset, setAsset] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [serviceReport, setServiceReport] = useState<ServiceReport | null>(null);
  const [assetHistory, setAssetHistory] = useState<ServiceHistory[]>([]);
  const [recommendations, setRecommendations] = useState<TechnicianMatchResult[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editReviewModalOpen, setEditReviewModalOpen] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');
  const [assignmentError, setAssignmentError] = useState<{
    title: string;
    message: string;
    details?: {
      customerLocation?: string;
      technicianCoverage?: string;
      reason?: string;
    };
  } | null>(null);

  const loadTicket = async () => {
    try {
      const res = await apiClient.get(`/tickets/${id}`);
      const data = res.data.data;
      setTicket(data.ticket);
      setAsset(data.asset);
      setReview(data.review);
      setServiceReport(data.serviceReport);
      setAssetHistory(data.assetHistory || []);
      setManagerNotes(data.review?.managerNotes || '');
    } catch (err) {
      console.error('Failed to load ticket details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const handleAnalyzeAI = async () => {
    setIsAnalyzing(true);
    try {
      await apiClient.post(`/tickets/${id}/analyze`);
      await loadTicket();
    } catch (err: any) {
      alert(`AI Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFetchRecommendations = async () => {
    try {
      const res = await apiClient.get(`/tickets/${id}/recommended-technicians`);
      setRecommendations(res.data.data);
      setAssignModalOpen(true);
    } catch (err: any) {
      alert(`Failed to load matching: ${err.message}`);
    }
  };

  const handleAssignTechnician = async (technicianId: string) => {
    setIsAssigning(true);
    try {
      await apiClient.post(`/tickets/${id}/assign`, { technicianId });
      setAssignModalOpen(false);
      await loadTicket();
    } catch (err: any) {
      const errResponse = err.response?.data?.error;
      if (errResponse) {
        setAssignmentError({
          title:
            errResponse.code === 'SERVICE_AREA_MISMATCH'
              ? 'Technician Coverage Area Mismatch'
              : 'Assignment Validation Failed',
          message: errResponse.message || 'The selected technician cannot be assigned to this ticket.',
          details: errResponse.details,
        });
      } else {
        setAssignmentError({
          title: 'Assignment Failed',
          message: err.message || 'An unexpected error occurred while assigning technician.',
        });
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSaveReview = async () => {
    try {
      await apiClient.post(`/tickets/${id}/review`, {
        accepted: true,
        managerNotes,
      });
      setEditReviewModalOpen(false);
      await loadTicket();
    } catch (err: any) {
      alert(`Failed to save review: ${err.message}`);
    }
  };

  if (isLoading || !ticket) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <span className="text-xs font-semibold">Loading service ticket command center...</span>
      </div>
    );
  }

  const aiAnalysis: AIAnalysis | null = ticket.aiAnalysisId;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/manager/tickets"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {ticket.ticketNumber}
              </h2>
              <ServiceBadge serviceType={ticket.serviceType} size="sm" />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="text-xs text-slate-500">
              Created on {new Date(ticket.createdAt).toLocaleDateString()} by{' '}
              {ticket.createdBy?.name || 'Manager'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ticket.status === 'NEW' && (
            <button
              onClick={handleAnalyzeAI}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Ticket...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze with AI
                </>
              )}
            </button>
          )}

          {ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' && (
            <button
              onClick={handleFetchRecommendations}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {ticket.assignedTechnicianId ? 'Reassign Technician' : 'Recommend Technicians'}
            </button>
          )}
        </div>
      </div>

      {/* Grid: Left 2 Cols (Complaint & AI & Report) / Right 1 Col (Customer & Asset & Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION: Complaint & Symptoms */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Reported Problem</h3>
              <StatusBadge status={ticket.status} />
            </div>

            <div className="space-y-3">
              {ticket.rawComplaint && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Raw Customer Input (Unmodified)
                    </span>
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                      ORIGINAL
                    </span>
                  </div>
                  <p className="text-sm font-mono text-slate-800">
                    "{ticket.rawComplaint}"
                  </p>
                </div>
              )}

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    AI Normalized Operational Understanding
                  </span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                    NORMALIZED
                  </span>
                </div>
                <p className="text-sm text-slate-900 font-medium leading-relaxed">
                  {ticket.normalizedComplaint || ticket.complaint}
                </p>
              </div>
            </div>

            {/* UNKNOWN / NEEDS TRIAGE ALERT BANNER */}
            {(ticket.isUnknownTriage || aiAnalysis?.isUnknownTriage) && (
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 space-y-3 mt-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>UNKNOWN / NEEDS TRIAGE — DIAGNOSIS NOT CONFIRMED</span>
                </div>
                <p className="text-xs text-amber-800">
                  Customer provided a vague or non-technical symptom. Servora strictly avoids inventing a confirmed root cause without physical evidence.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      What Is Known
                    </span>
                    <ul className="text-xs text-slate-700 list-disc list-inside space-y-0.5">
                      {(aiAnalysis?.knownFacts?.length ? aiAnalysis.knownFacts : ["Customer reports solar system is not working or needs checking."]).map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      What Is Unknown
                    </span>
                    <ul className="text-xs text-slate-700 list-disc list-inside space-y-0.5">
                      {(aiAnalysis?.unknownFacts?.length ? aiAnalysis.unknownFacts : ["Exact equipment fault cannot be determined remotely."]).map((u: string, i: number) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {aiAnalysis?.missingInformation && aiAnalysis.missingInformation.length > 0 && (
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                      Missing Information / Questions to Ask Customer
                    </span>
                    <ul className="text-xs text-slate-700 list-disc list-inside space-y-0.5">
                      {aiAnalysis.missingInformation.map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-[11px] font-bold text-amber-900 bg-amber-100/70 p-2 rounded text-center tracking-wide uppercase border border-amber-200">
                  STATUS: DIAGNOSIS NOT CONFIRMED • TECHNICIAN VERIFICATION REQUIRED (VERIFY ON SITE)
                </div>
              </div>
            )}

            {ticket.symptoms && ticket.symptoms.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Reported Symptoms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ticket.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                  {ticket.errorCode && (
                    <span className="text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-300">
                      Error: {ticket.errorCode}
                    </span>
                  )}
                </div>
              </div>
            )}

            {ticket.photos && ticket.photos.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Customer Uploaded Photos
                </span>
                <div className="flex gap-2">
                  {ticket.photos.map((p, idx) => (
                    <a key={idx} href={p} target="_blank" rel="noreferrer">
                      <img
                        src={p}
                        alt="Customer site"
                        className="w-20 h-20 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION: AI Diagnostic Assistance Card */}
          {aiAnalysis ? (
            <div className="bg-gradient-to-br from-purple-50/40 via-white to-white p-6 rounded-2xl border-2 border-purple-200 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      AI Assistance Preparation
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {aiAnalysis.provider}
                      </span>
                    </h3>
                    <div className="text-[11px] text-purple-700 font-bold tracking-wide mt-0.5">
                      AI ASSISTANCE — VERIFY ON SITE
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEditReviewModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Manager Adjustments
                </button>
              </div>

              {/* Possible Issues */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Candidate Root Causes (Hypotheses)
                </span>
                <div className="space-y-2">
                  {aiAnalysis.possibleIssues.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.issue}</div>
                        <p className="text-xs text-slate-600 mt-0.5">{item.explanation}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                          item.probabilityLevel === 'HIGH'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : item.probabilityLevel === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.probabilityLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnostic Checklist */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Recommended Diagnostic Steps
                </span>
                <ul className="space-y-1.5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
                  {aiAnalysis.diagnosticSteps.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tools & Parts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <Wrench className="w-4 h-4 text-slate-500" />
                    Suggested Tools
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiAnalysis.recommendedTools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md"
                      >
                        {tool.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <Package className="w-4 h-4 text-slate-500" />
                    Potential Spare Parts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiAnalysis.possibleParts.length > 0 ? (
                      aiAnalysis.possibleParts.map((part, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-semibold bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200"
                        >
                          {part}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        No immediate part replacement suggested pre-dispatch
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Safety Warnings */}
              {aiAnalysis.safetyWarnings && aiAnalysis.safetyWarnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <div className="font-bold">Safety Precautions Required</div>
                    <ul className="list-disc list-inside space-y-0.5 mt-1 text-[11px]">
                      {aiAnalysis.safetyWarnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center space-y-3">
              <Brain className="w-8 h-8 text-purple-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">AI Diagnostic Triage Pending</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Run AI analysis to extract possible causes, build diagnostic checklist, and determine tool & part requirements before assigning a technician.
                </p>
              </div>
              <button
                onClick={handleAnalyzeAI}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Service Request...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze with AI Now
                  </>
                )}
              </button>
            </div>
          )}

          {/* SECTION: AI VS ACTUAL COMPARISON (When Job is Completed) */}
          {ticket.status === 'COMPLETED' && serviceReport && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pilot Groundwork Benchmark: AI vs Actual
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Comparing preliminary triage prediction against physical field findings
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  VERIFIED GROUNDWORK
                </span>
              </div>

              {/* Comparison Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
                    AI Suggested Hypothesis
                  </span>
                  <div className="text-xs font-bold text-slate-900">
                    {aiAnalysis?.possibleIssues[0]?.issue || 'N/A'}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {aiAnalysis?.possibleIssues[0]?.explanation || 'Preliminary rule hypothesis'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                    Actual Technician Field Diagnosis
                  </span>
                  <div className="text-xs font-bold text-slate-900">
                    {serviceReport.actualDiagnosis}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Work: {serviceReport.workPerformed}
                  </p>
                </div>
              </div>

              {/* Field Readings */}
              {serviceReport.readings && Object.keys(serviceReport.readings).length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Verified Field Measurements
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Object.entries(serviceReport.readings).map(([key, val]) => (
                      <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="font-bold text-slate-800">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parts & Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Parts Actually Installed:</span>
                  {serviceReport.partsUsed.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {serviceReport.partsUsed.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No parts consumed (Labor/cleaning only)</span>
                  )}
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">Technician AI Feedback:</span>
                  <span className="text-slate-700">
                    AI Rated:{' '}
                    <strong className="text-emerald-700">
                      {serviceReport.aiAccuracyRating || 5} / 5
                    </strong>{' '}
                    • {serviceReport.aiHelpful ? 'Helpful in field preparation' : 'Partial help'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column (Customer, Equipment, Timeline) */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customer Details
            </h4>
            <div>
              <div className="text-sm font-bold text-slate-900">{ticket.customerId?.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a href={`tel:${ticket.customerId?.phone}`} className="hover:underline font-medium">
                  {ticket.customerId?.phone}
                </a>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {(ticket as any).serviceLocation?.address || ticket.customerId?.address}, {(ticket as any).serviceLocation?.city || ticket.customerId?.city} {(ticket as any).serviceLocation?.pincode ? `(${(ticket as any).serviceLocation?.pincode})` : ''}
                </span>
              </div>
            </div>

            {/* Customer Feedback if provided */}
            {(ticket as any).customerFeedback && (
              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                  Customer Feedback:
                </span>
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <span className="text-amber-500">★ {(ticket as any).customerFeedback.rating}/5</span>
                  {(ticket as any).customerFeedback.resolved && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">Resolved</span>
                  )}
                  {(ticket as any).customerFeedback.onTime && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">On-Time</span>
                  )}
                </div>
                {(ticket as any).customerFeedback.comment && (
                  <p className="text-slate-600 italic">"{(ticket as any).customerFeedback.comment}"</p>
                )}
              </div>
            )}
          </div>

          {/* Asset Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Equipment Info
              </h4>
              <ServiceBadge serviceType={ticket.serviceType} size="sm" />
            </div>

            {ticket.serviceType === 'SOLAR' && asset ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Capacity:</span>
                  <span className="font-bold text-slate-800">{asset.capacityKW} kW</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Inverter:</span>
                  <span className="font-semibold text-slate-800">
                    {asset.inverterMake} {asset.inverterModel}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Serial:</span>
                  <span className="font-mono text-slate-700">{asset.inverterSerial || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-semibold text-slate-800">{asset.systemType}</span>
                </div>
              </div>
            ) : asset ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Brand / Model:</span>
                  <span className="font-bold text-slate-800">
                    {asset.brand} {asset.model}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tonnage:</span>
                  <span className="font-semibold text-slate-800">{asset.capacityTR} TR</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-semibold text-slate-800">{asset.acType}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Refrigerant:</span>
                  <span className="font-semibold text-slate-800">{asset.refrigerantType}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">No asset linked</div>
            )}
          </div>

          {/* Assigned Technician Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assigned Field Technician
            </h4>

            {ticket.assignedTechnicianId ? (
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1">
                <div className="text-xs font-bold text-emerald-900">
                  {ticket.assignedTechnicianId.name}
                </div>
                <div className="text-xs text-slate-600">
                  Phone: {ticket.assignedTechnicianId.phone}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  Status: {ticket.assignedTechnicianId.availability}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                No technician assigned yet.
                <button
                  onClick={handleFetchRecommendations}
                  className="block mx-auto mt-2 text-xs font-bold text-emerald-600 hover:underline"
                >
                  Recommend Top Match →
                </button>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Status Progression Timeline
            </h4>
            <div className="space-y-3 pl-2 border-l-2 border-slate-200 text-xs">
              {ticket.statusHistory &&
                ticket.statusHistory.map((item, idx) => (
                  <div key={idx} className="relative pl-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -left-[18px] top-1 border-2 border-white" />
                    <div className="font-bold text-slate-800">{item.status}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                    {item.note && <div className="text-[11px] text-slate-500">{item.note}</div>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Technician Recommendations (Deterministic 5-Factor Match) */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Technician Matching Recommendations (${ticket.serviceType})`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="font-semibold text-slate-700">Ticket Location: </span>
              <span className="font-bold text-slate-900">
                {ticket.serviceLocation?.city || (typeof ticket.customerId === 'object' ? ticket.customerId?.city : '') || 'Not specified'}
                {ticket.serviceLocation?.area ? ` (${ticket.serviceLocation.area})` : ''}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              5-Factor Match: Skill (40%), Tools (20%), Status (20%), Area (10%), Exp (10%)
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active technicians certified for {ticket.serviceType} found in the system.
              </div>
            ) : (
              recommendations.map((rec) => {
                const isEligible = rec.isEligible !== false;

                return (
                  <div
                    key={rec.technicianId}
                    className={`p-4 rounded-xl border transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isEligible
                        ? 'border-slate-200 hover:border-emerald-500 bg-white'
                        : 'border-amber-200 bg-amber-50/40 opacity-90'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{rec.technicianName}</span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
                          isEligible
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-amber-800 bg-amber-100 border-amber-300'
                        }`}>
                          {rec.score}% Match
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isEligible
                            ? 'text-emerald-700 bg-emerald-100 border border-emerald-300'
                            : 'text-amber-900 bg-amber-200 border border-amber-300'
                        }`}>
                          {isEligible ? '✓ Covers Service Area' : '⚠ Outside Coverage Area'}
                        </span>
                        <span className="text-[10px] text-slate-400">({rec.experienceYears}y exp)</span>
                      </div>

                      {/* Coverage summary */}
                      <div className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex flex-wrap gap-x-3 gap-y-1">
                        <span>
                          <strong>Coverage:</strong> {rec.technicianCoverageSummary || `${rec.coverageRadiusKm || 20}km radius`}
                        </span>
                        {rec.customerLocationSummary && (
                          <span className="text-slate-500">
                            <strong>Job:</strong> {rec.customerLocationSummary}
                          </span>
                        )}
                      </div>

                      {/* Ineligibility Reason */}
                      {!isEligible && (rec.ineligibilityReason || rec.coverageExplanation) && (
                        <div className="text-[11px] text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>{rec.ineligibilityReason || rec.coverageExplanation}</span>
                        </div>
                      )}

                      <div className="space-y-0.5 pt-0.5">
                        {rec.reasons.map((r, i) => (
                          <div key={i} className="text-[11px] text-slate-600 flex items-center gap-1">
                            <span className={isEligible ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                              {isEligible ? '✓' : '•'}
                            </span>{' '}
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAssignTechnician(rec.technicianId)}
                        disabled={isAssigning}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0 shadow-sm ${
                          isEligible
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {isAssigning
                          ? 'Assigning...'
                          : isEligible
                          ? 'Assign Job'
                          : 'Assign (Validate Area)'}
                      </button>
                      {!isEligible && (
                        <Link
                          to="/manager/technicians"
                          className="text-[10px] text-emerald-700 hover:underline font-semibold"
                        >
                          Edit Tech Coverage →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL: Structured Assignment Error */}
      <Modal
        isOpen={!!assignmentError}
        onClose={() => setAssignmentError(null)}
        title={assignmentError?.title || 'Assignment Failed'}
        maxWidth="md"
      >
        {assignmentError && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-950 text-sm">
                  {assignmentError.title}
                </h4>
                <p className="text-amber-900 leading-relaxed">
                  {assignmentError.message}
                </p>
              </div>
            </div>

            {assignmentError.details && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Coverage Diagnostics
                </h5>
                <div className="space-y-1 text-slate-700">
                  {assignmentError.details.customerLocation && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer Location:</span>
                      <span className="font-bold text-slate-900">
                        {assignmentError.details.customerLocation}
                      </span>
                    </div>
                  )}
                  {assignmentError.details.technicianCoverage && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Technician Coverage:</span>
                      <span className="font-bold text-slate-900">
                        {assignmentError.details.technicianCoverage}
                      </span>
                    </div>
                  )}
                  {assignmentError.details.reason && (
                    <div className="pt-1 text-[11px] text-rose-700 font-medium border-t border-slate-200">
                      Reason: {assignmentError.details.reason}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setAssignmentError(null);
                  setAssignModalOpen(true);
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50"
              >
                Choose Another Technician
              </button>
              <Link
                to="/manager/technicians"
                onClick={() => setAssignmentError(null)}
                className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
              >
                Edit Technician Coverage
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Manager AI Adjustments */}
      <Modal
        isOpen={editReviewModalOpen}
        onClose={() => setEditReviewModalOpen(false)}
        title="Manager Review & Adjustments"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            You can record operational notes or adjust technician instructions before dispatch. The original AI output remains immutable for audit comparison.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Manager Instructions / Notes to Technician
            </label>
            <textarea
              rows={4}
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              placeholder="e.g. Ensure customer is briefed about power interruption during testing; carry spare MC4 1000V connector pair."
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditReviewModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReview}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Save Adjustments
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
