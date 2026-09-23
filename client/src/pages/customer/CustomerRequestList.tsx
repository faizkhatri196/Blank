import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  Sun,
  Wind,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  Inbox,
  MapPin,
  Calendar,
  XCircle,
  AlertCircle,
  RotateCcw,
  Loader2,
  ShieldCheck,
  Ban,
  Search,
} from 'lucide-react';
import { CustomerSafeTicket } from '../../types';
import {
  getStoredBookings,
  fetchCustomerTicketsResilient,
  saveTicketToStore,
  updateTicketStatusInStore,
  normalizeTicket,
} from '../../utils/customerTicketStore';

type TabType = 'ALL' | 'ACTIVE' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export const CustomerRequestList: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Initialize with cached bookings immediately for 0ms initial load
  const [tickets, setTickets] = useState<CustomerSafeTicket[]>(() => getStoredBookings());
  const [isLoading, setIsLoading] = useState<boolean>(() => getStoredBookings().length === 0);
  const [filterTab, setFilterTab] = useState<TabType>('ALL');

  // Cancel dialog state
  const [cancellingTicket, setCancellingTicket] = useState<CustomerSafeTicket | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Manual ticket track lookup
  const [manualTicketInput, setManualTicketInput] = useState<string>('');
  const [isLookingUpTicket, setIsLookingUpTicket] = useState<boolean>(false);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);

  const loadRequests = async (showSpinner = false) => {
    if (isAuthLoading) return;
    if (showSpinner || tickets.length === 0) {
      setIsLoading(true);
    }
    try {
      const freshTickets = await fetchCustomerTicketsResilient(user?.id);
      setTickets(freshTickets);
    } catch (err: any) {
      console.error('[CustomerRequestList] Failed to load requests:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user?.id, isAuthLoading]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      ALL: tickets.length,
      ACTIVE: tickets.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
      ACCEPTED: tickets.filter((t) => t.status === 'ACCEPTED').length,
      COMPLETED: tickets.filter((t) => t.status === 'COMPLETED').length,
      CANCELLED: tickets.filter((t) => t.status === 'CANCELLED').length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (filterTab === 'ACTIVE') return t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      if (filterTab === 'ACCEPTED') return t.status === 'ACCEPTED';
      if (filterTab === 'COMPLETED') return t.status === 'COMPLETED';
      if (filterTab === 'CANCELLED') return t.status === 'CANCELLED';
      return true;
    });
  }, [tickets, filterTab]);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingTicket || isSubmittingCancel) return;

    setIsSubmittingCancel(true);
    setCancelError(null);

    const cleanReason = cancelReason.trim() || 'Cancelled by customer';

    try {
      const res = await apiClient.post(`/customer-portal/requests/${cancellingTicket._id}/cancel`, {
        reason: cleanReason,
      });

      if (res.data.success && res.data.data) {
        saveTicketToStore(res.data.data);
      } else {
        updateTicketStatusInStore(cancellingTicket._id, 'CANCELLED', 'Cancelled by Customer', cleanReason);
      }
    } catch (err: any) {
      // Graceful offline fallback
      updateTicketStatusInStore(cancellingTicket._id, 'CANCELLED', 'Cancelled by Customer', cleanReason);
    } finally {
      // Update local state immediately
      setTickets((prev) =>
        prev.map((t) =>
          t._id === cancellingTicket._id
            ? { ...t, status: 'CANCELLED', customerStatusLabel: 'Cancelled by Customer', cancellationReason: cleanReason }
            : t
        )
      );
      setCancellingTicket(null);
      setCancelReason('');
      setIsSubmittingCancel(false);
    }
  };

  // Manual Ticket Tracking / Linking
  const handleManualLookup = async (e?: React.FormEvent, lookupId?: string) => {
    if (e) e.preventDefault();
    const targetId = (lookupId || manualTicketInput).trim();
    if (!targetId) return;

    setIsLookingUpTicket(true);
    setLookupFeedback(null);

    try {
      const res = await apiClient.get(`/customer-portal/requests/${targetId}`);
      if (res.data?.success && res.data.data?._id) {
        const saved = saveTicketToStore(res.data.data);
        setTickets((prev) => {
          const filtered = prev.filter((t) => t._id !== saved._id);
          return [saved, ...filtered];
        });
        setManualTicketInput('');
        setLookupFeedback(`Found booking #${saved.ticketNumber}! Added to your service history.`);
        setTimeout(() => setLookupFeedback(null), 4000);
      } else {
        setLookupFeedback('No service request found with this ID.');
      }
    } catch (err: any) {
      setLookupFeedback('Unable to find this request. Please check the ID or ticket number.');
    } finally {
      setIsLookingUpTicket(false);
    }
  };

  // Load a demo booking for quick test if user has empty history
  const handleLoadDemoBooking = async () => {
    await handleManualLookup(undefined, '6ab3453536130fcff950ce48');
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'ACCEPTED':
        return 'bg-teal-50 text-teal-700 border border-teal-200 ring-2 ring-teal-100/80';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'ON_THE_WAY':
      case 'ON_SITE':
      case 'DIAGNOSING':
      case 'REPAIRING':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Service History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full record of all your Solar & AC bookings, dispatch status, accepted jobs, and completed repairs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadRequests()}
            title="Refresh history"
            className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/customer/request')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Service Request</span>
          </button>
        </div>
      </div>

      {/* Track by Ticket ID / Link Booking Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs">
        <form onSubmit={handleManualLookup} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualTicketInput}
              onChange={(e) => setManualTicketInput(e.target.value)}
              placeholder="Track or link an existing booking (e.g. SOL-2026-0078 or ID)..."
              className="w-full px-3.5 py-2 pl-9 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={isLookingUpTicket || !manualTicketInput.trim()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            {isLookingUpTicket ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Find & Link</span>
          </button>
        </form>

        {lookupFeedback && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{lookupFeedback}</span>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/80 scrollbar-none">
        {(
          [
            { key: 'ALL', label: 'All History' },
            { key: 'ACTIVE', label: 'Active' },
            { key: 'ACCEPTED', label: 'Accepted' },
            { key: 'COMPLETED', label: 'Completed' },
            { key: 'CANCELLED', label: 'Cancelled / Rejected' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              filterTab === tab.key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                filterTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200/90 text-slate-700'
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Request Cards List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200/70 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {filterTab === 'ALL'
                ? 'No service history found'
                : `No ${filterTab.toLowerCase()} requests`}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              {filterTab === 'COMPLETED'
                ? 'You do not have any completed service records yet.'
                : filterTab === 'ACCEPTED'
                ? 'No requests have been accepted by a technician yet.'
                : filterTab === 'CANCELLED'
                ? 'You do not have any cancelled or rejected service requests.'
                : 'You have not booked any service requests yet on this device.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={() => navigate('/customer/request')}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              Book a Service
            </button>
            <button
              type="button"
              onClick={handleLoadDemoBooking}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Load Sample Booking
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const isDone = ticket.status === 'COMPLETED';
            const isAccepted = ticket.status === 'ACCEPTED';
            const isCancelled = ticket.status === 'CANCELLED';
            const canCancel = ['NEW', 'AI_ANALYZED', 'WAITING_FOR_ASSIGNMENT', 'ASSIGNED'].includes(
              ticket.status
            );

            return (
              <div
                key={ticket._id}
                onClick={() => navigate(`/customer/requests/${ticket._id}`)}
                className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-indigo-400/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                        ticket.serviceType === 'SOLAR'
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                      }`}
                    >
                      {ticket.serviceType === 'SOLAR' ? (
                        <Sun className="w-6 h-6" />
                      ) : (
                        <Wind className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          #{ticket.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusBadgeStyle(
                            ticket.status
                          )}`}
                        >
                          {ticket.customerStatusLabel}
                        </span>
                        {isAccepted && (
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Pro Confirmed</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors mt-1">
                        {ticket.problemCategory || 'Service Issue'}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {ticket.normalizedComplaint || ticket.rawComplaint}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px] mt-2 font-medium">
                        <span className="flex items-center gap-1 text-slate-600 font-semibold">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          {ticket.serviceLocation.city}{' '}
                          {ticket.serviceLocation.pincode
                            ? `(${ticket.serviceLocation.pincode})`
                            : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {ticket.approvedCompanyContact?.companyName && (
                          <span className="text-slate-400">
                            • Provider: {ticket.approvedCompanyContact.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {canCancel && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancellingTicket(ticket);
                          setCancelReason('');
                          setCancelError(null);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1"
                        title="Cancel this service request"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors">
                      <span>Track Status</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Rejection / Cancellation explanation banner if available */}
                {isCancelled && ticket.cancellationReason && (
                  <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5 text-[11px] text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Reason:</strong> {ticket.cancellationReason}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cancel Service Request</h3>
                  <span className="font-mono text-xs text-slate-400 font-bold">
                    #{cancellingTicket.ticketNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCancellingTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this service request? Once cancelled, the assigned
              team will be notified immediately.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for cancellation (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Problem resolved, rescheduling, or booked by mistake"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
              </div>

              {cancelError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingTicket(null)}
                  disabled={isSubmittingCancel}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Keep Request
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingCancel ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Confirm Cancellation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
