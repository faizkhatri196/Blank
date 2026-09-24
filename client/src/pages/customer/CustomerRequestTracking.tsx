import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
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

        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          #{ticket.ticketNumber}
        </span>
      </div>

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
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {isCompleted ? 'Completed' : 'Active'}
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
            <span className="text-[11px] font-bold text-slate-400 uppercase">Uploaded Evidence</span>
            <div className="flex flex-wrap gap-2.5">
              {ticket.photos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 block hover:opacity-90 transition-opacity"
                >
                  <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
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
    </div>
  );
};
