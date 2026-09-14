import React from 'react';
import { TicketPriority } from '../../types';

interface PriorityBadgeProps {
  priority: TicketPriority;
}

const config: Record<TicketPriority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  HIGH: { label: 'High', className: 'bg-amber-50 text-amber-700 border-amber-200 font-medium' },
  URGENT: { label: 'Urgent', className: 'bg-red-50 text-red-700 border-red-200 font-semibold' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const item = config[priority] || config.MEDIUM;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${item.className}`}>
      {item.label}
    </span>
  );
};
