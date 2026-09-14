import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { ServiceTicket } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ServiceBadge } from '../../components/common/ServiceBadge';
import { Wrench, Phone, MapPin, ArrowRight, Loader2, Clock, CheckCircle } from 'lucide-react';

export const TechnicianDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<ServiceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMyJobs() {
      try {
        const res = await apiClient.get('/tickets');
        setJobs(res.data.data.items);
      } catch (err) {
        console.error('Failed to load technician jobs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMyJobs();
  }, []);

  const activeJobs = jobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Assigned Field Jobs
          </h2>
          <p className="text-xs text-slate-500">
            {activeJobs.length} active service dispatch{activeJobs.length === 1 ? '' : 'es'} today
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
          {activeJobs.length}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span className="text-xs font-semibold">Loading assigned jobs...</span>
        </div>
      ) : activeJobs.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="text-sm font-bold text-slate-800">All Caught Up!</div>
          <p className="text-xs text-slate-500">
            You have no active pending dispatches. New jobs assigned by the service manager will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeJobs.map((job) => (
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
