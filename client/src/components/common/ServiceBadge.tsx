import React from 'react';
import { ServiceType } from '../../types';
import { Sun, Wind, Droplet, Zap, Wrench, Home } from 'lucide-react';

interface ServiceBadgeProps {
  serviceType: ServiceType;
  size?: 'sm' | 'md';
}

export const ServiceBadge: React.FC<ServiceBadgeProps> = ({ serviceType, size = 'sm' }) => {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  switch (serviceType) {
    case 'SOLAR':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-amber-50 text-amber-800 border-amber-300 ${paddingClass}`}>
          <Sun className={`${iconSize} text-amber-600`} />
          SOLAR
        </span>
      );

    case 'AC':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-sky-50 text-sky-800 border-sky-300 ${paddingClass}`}>
          <Wind className={`${iconSize} text-sky-600`} />
          AC / HVAC
        </span>
      );

    case 'PLUMBING':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-blue-50 text-blue-800 border-blue-300 ${paddingClass}`}>
          <Droplet className={`${iconSize} text-blue-600`} />
          PLUMBING
        </span>
      );

    case 'HOME_MAINTENANCE':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-emerald-50 text-emerald-800 border-emerald-300 ${paddingClass}`}>
          <Wrench className={`${iconSize} text-emerald-600`} />
          HOME REPAIR
        </span>
      );

    case 'ELECTRICAL':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-yellow-50 text-yellow-800 border-yellow-300 ${paddingClass}`}>
          <Zap className={`${iconSize} text-yellow-600`} />
          ELECTRICAL
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-slate-50 text-slate-800 border-slate-300 ${paddingClass}`}>
          <Wrench className={`${iconSize} text-slate-600`} />
          {serviceType}
        </span>
      );
  }
};

