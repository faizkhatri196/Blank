import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { ServiceTicket, ServiceType, TicketStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ServiceBadge } from '../../components/common/ServiceBadge';
import { Search, Plus, Filter, Loader2 } from 'lucide-react';

export const Tickets: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const serviceType = searchParams.get('serviceType') || '';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    async function loadTickets() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (serviceType) queryParams.set('serviceType', serviceType);
        if (status) queryParams.set('status', status);
        if (search) queryParams.set('search', search);

        const res = await apiClient.get(`/tickets?${queryParams.toString()}`);
        setTickets(res.data.data.items);
        setTotal(res.data.data.total);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTickets();
  }, [serviceType, status, search]);

  const handleFilterChange = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Service Tickets ({total})
          </h2>
          <p className="text-xs text-slate-500">
            Lifecycle monitoring, AI diagnostic preparation & fieldwork status
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ticket #, customer, complaint..."
            value={search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">All Services</option>
            <option value="SOLAR">Solar Only</option>
            <option value="AC">AC / HVAC Only</option>
          </select>

          <select
            value={status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="AI_ANALYZED">AI Analyzed</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ON_SITE">On Site</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex items-center justify-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
            <span className="text-xs font-semibold">Loading tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No service tickets matched your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Customer & Location</th>
                  <th className="py-3.5 px-4">Complaint</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Technician</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{ticket.ticketNumber}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <ServiceBadge serviceType={ticket.serviceType} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{ticket.customerId?.name}</div>
                      <div className="text-[11px] text-slate-400">{ticket.customerId?.city}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-slate-700 truncate">{ticket.complaint}</p>
                      {ticket.errorCode && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                          {ticket.errorCode}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    <td className="py-3.5 px-4">
                      {ticket.assignedTechnicianId ? (
                        <span className="font-semibold text-emerald-800">
                          {ticket.assignedTechnicianId.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={ticket.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/manager/tickets/${ticket._id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold transition-all"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
