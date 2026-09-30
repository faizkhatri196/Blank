import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, getAssetUrl } from '../../api/client';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Sun,
  Wind,
  Star,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Camera,
  AlertCircle,
  HelpCircle,
  Ban,
  X,
} from 'lucide-react';
import { CustomerSafeTicket } from '../../types';

export const CustomerRequestTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<CustomerSafeTicket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback Form State
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [onTime, setOnTime] = useState<boolean>(true);
  const [resolved, setResolved] = useState<boolean>(true);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // Cancellation State
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Changed my mind');
  const [customReason, setCustomReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const CANCELLATION_REASONS = [
    'Changed my mind',
    'Issue resolved',
    'Appointment no longer required',
    'Requested by mistake',
    'Other',
  ];

  // Poll ticket details every 12 seconds
  useEffect(() => {
    let isMounted = true;

    async function loadTicket() {
      if (!id) return;
      try {
        const res = await apiClient.get(`/customer-portal/requests/${id}`);
        if (res.data.success && isMounted) {
          setTicket(res.data.data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.error?.message || 'Failed to load request details.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTicket();
    const interval = setInterval(loadTicket, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  // Handle Feedback Submission
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isSubmittingFeedback) return;

    setIsSubmittingFeedback(true);
    try {
      const res = await apiClient.post(`/customer-portal/requests/${id}/feedback`, {
        rating,
        comment: feedbackComment,
        onTime,
        resolved,
      });

      if (res.data.success) {
        setFeedbackSuccess(true);
        setTicket(res.data.data);
      }
    } catch (err: any) {
      console.error('Feedback submission failed:', err);
      alert(err.response?.data?.error?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle Cancellation Submission
  const handleCancelRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isCancelling) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await apiClient.post(`/customer-portal/requests/${id}/cancel`, {
        reason: cancelReason,
        customReason: cancelReason === 'Other' ? customReason : undefined,
      });

      if (res.data.success) {
        setCancelSuccessMsg('Request cancelled successfully.');
        setTicket(res.data.data);
        setCancelModalOpen(false);
      }
    } catch (err: any) {
      console.error('Cancellation failed:', err);
      setCancelError(err.response?.data?.error?.message || 'Failed to cancel request. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Clock className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading service tracking...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto border border-slate-200 shadow-sm space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Request Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Unable to locate this service request.'}</p>
        <button
          onClick={() => navigate('/customer')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const isCompleted = ticket.status === 'COMPLETED';
  const isCancelled = ticket.status === 'CANCELLED';
  const canCancel = ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customer/requests')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Requests</span>
        </button>

        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              onClick={() => {
                setCancelError(null);
                setCancelModalOpen(true);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-xl transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Request</span>
            </button>
          )}

          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            #{ticket.ticketNumber}
          </span>
        </div>
      </div>

      {/* Cancellation Banner */}
      {isCancelled && (
        <div className="bg-rose-50/90 border-2 border-rose-200 rounded-3xl p-5 sm:p-6 text-rose-950 flex items-start gap-4 animate-fadeIn shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-rose-900 tracking-tight">
                Request Cancelled
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                CANCELLED
              </span>
            </div>
            <p className="text-xs text-rose-800">
              {ticket.cancellationReason
                ? `Reason: ${ticket.cancellationReason}`
                : 'This service request was cancelled.'}
            </p>
            {ticket.cancelledAt && (
              <p className="text-[11px] text-rose-700 pt-0.5">
                Cancelled on: {new Date(ticket.cancelledAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success Notification if just cancelled */}
      {cancelSuccessMsg && isCancelled && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {/* Main Status Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                ticket.serviceType === 'SOLAR'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-600'
              }`}
            >
              {ticket.serviceType === 'SOLAR' ? <Sun className="w-6 h-6" /> : <Wind className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {ticket.serviceType === 'SOLAR' ? 'Solar Service' : 'AC & HVAC Service'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCancelled
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : 'Active'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {ticket.problemCategory || 'Service Request'}
              </h1>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
            <p className="text-sm font-extrabold text-indigo-700 mt-0.5 flex items-center sm:justify-end gap-1.5">
              {!isCompleted && <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />}
              <span>{ticket.customerStatusLabel}</span>
            </p>
          </div>
        </div>

        {/* Location Snapshot Display */}
        <div className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {ticket.serviceLocation.address}, {ticket.serviceLocation.city}{' '}
            {ticket.serviceLocation.pincode ? `- ${ticket.serviceLocation.pincode}` : ''}
          </span>
        </div>
      </div>

      {/* Assigned Professional Card (Strict Privacy: Role only by default, Approved contact only) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 shrink-0 border border-white/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              Assigned Professional
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {ticket.assignedProfessionalName || ticket.assignedProfessionalRole || 'Service Professional Assigned'}
            </h3>
            <p className="text-xs text-slate-300 font-normal">
              Certified by Servora Operations • On-site tools & safety verified
            </p>
          </div>
        </div>

        {/* Contact Action: Only Approved Company Contact Number */}
        {ticket.approvedCompanyContact?.phone && (
          <a
            href={`tel:${ticket.approvedCompanyContact.phone}`}
            className="w-full sm:w-auto px-4 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Phone className="w-4 h-4 text-indigo-600" />
            <span>Contact Service Team</span>
          </a>
        )}
      </div>

      {/* Visual Service Progress Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Service Status Timeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time milestone updates from dispatch through completion.
          </p>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {ticket.customerTimeline.map((step, idx) => {
            const isDone = step.status === 'COMPLETED';
            const isCurrent = step.status === 'CURRENT';

            return (
              <div key={step.key} className="relative flex items-start gap-3.5 group">
                {/* Milestone Node */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse'
                      : 'bg-white border-2 border-slate-300 text-transparent'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs sm:text-sm font-bold ${
                        isDone ? 'text-slate-900' : isCurrent ? 'text-indigo-600 font-black' : 'text-slate-400 font-medium'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.timestamp && (
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complaint Understanding Details */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Reported Problem & Details</h3>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Operational Summary</span>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {ticket.normalizedComplaint}
          </p>
        </div>

        {ticket.photos.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Uploaded Evidence ({ticket.photos.length})</span>
            <div className="flex flex-wrap gap-2.5">
              {ticket.photos.map((url, i) => (
                <a
                  key={i}
                  href={getAssetUrl(url)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 block hover:opacity-90 transition-opacity shadow-2xs"
                >
                  <img src={getAssetUrl(url)} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FEEDBACK SECTION (Visible on Completion) */}
      {isCompleted && (
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 rounded-3xl p-6 sm:p-7 border border-indigo-100 shadow-xs space-y-4 animate-fadeIn">
          <div>
            <div className="flex items-center gap-1 text-amber-500 mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h3 className="text-lg font-black text-slate-900">How was your service?</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Your feedback directly powers Servora's AI quality validation loop.
            </p>
          </div>

          {ticket.feedback || feedbackSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Thank you! Your feedback has been recorded.</span>
              </p>
              <p className="text-emerald-800">
                Rating: {ticket.feedback?.rating || rating} / 5 Stars{' '}
                {ticket.feedback?.comment ? `• "${ticket.feedback.comment}"` : ''}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-4 pt-1">
              {/* Star Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Rate the overall experience:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">{rating} of 5 Stars</span>
                </div>
              </div>

              {/* Quick checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resolved}
                    onChange={(e) => setResolved(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700">Problem was completely resolved</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onTime}
                    onChange={(e) => setOnTime(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700">Service professional arrived on time</span>
                </label>
              </div>

              {/* Comments */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Optional comments or suggestions:
                </label>
                <textarea
                  rows={2}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share details about your experience..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <span>{isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-900 text-sm">Cancel Service Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Are you sure you want to cancel this service request?
            </p>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleCancelRequest} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Optional reason:
                </label>
                <div className="space-y-2">
                  {CANCELLATION_REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        cancelReason === r
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={r}
                        checked={cancelReason === r}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="text-indigo-600"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Short custom reason:
                  </label>
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Briefly state your reason..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Keep Request
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs active:scale-95"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
