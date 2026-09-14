import React from 'react';
import { TicketStatus } from '../../types';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<TicketStatus, { label: string; bg: string; text: string; border: string }> = {
  NEW: { label: 'New Request', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  AI_ANALYZED: { label: 'AI Analyzed', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  WAITING_FOR_ASSIGNMENT: { label: 'Needs Assignment', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ASSIGNED: { label: 'Assigned', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  ACCEPTED: { label: 'Accepted', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  ON_THE_WAY: { label: 'On The Way', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  ON_SITE: { label: 'On Site', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  DIAGNOSING: { label: 'Diagnosing', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  REPAIRING: { label: 'Repairing', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  COMPLETED: { label: 'Completed', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const cfg = statusConfig[status] || { label: status, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
      {cfg.label}
    </span>
  );
};
