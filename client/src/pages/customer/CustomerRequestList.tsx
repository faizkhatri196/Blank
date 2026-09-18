import React, { useState, useEffect } from 'react';
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
  ArrowUpRight,
  MapPin,
  Calendar,
} from 'lucide-react';
import { CustomerSafeTicket } from '../../types';

export const CustomerRequestList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tickets, setTickets] = useState<CustomerSafeTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    async function loadRequests() {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/customer-portal/requests');
        if (res.data.success) {
          setTickets(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load customer requests:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRequests();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    if (filterTab === 'ACTIVE') return t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
    if (filterTab === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Service Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track active technician dispatches and view past service history.
          </p>
        </div>

        <button
          onClick={() => navigate('/customer/request')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Service Request</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterTab === tab
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'ALL' ? 'All Requests' : tab === 'ACTIVE' ? 'Active' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Request Cards List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200/70 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No service requests found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {filterTab === 'COMPLETED'
              ? 'You do not have any completed service records yet.'
              : 'You have not submitted any service requests yet.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/customer/request')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Request a Service
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const isDone = ticket.status === 'COMPLETED';

            return (
              <div
                key={ticket._id}
                onClick={() => navigate(`/customer/requests/${ticket._id}`)}
                className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-indigo-400/80 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                      ticket.serviceType === 'SOLAR'
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                        : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}
                  >
                    {ticket.serviceType === 'SOLAR' ? <Sun className="w-5 h-5" /> : <Wind className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        #{ticket.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {ticket.customerStatusLabel}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors mt-0.5">
                      {ticket.problemCategory || 'Service Issue'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px] mt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {ticket.serviceLocation.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 self-end sm:self-center shrink-0">
                  <span>View Status</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
