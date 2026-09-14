import React from 'react';
import { ServiceType } from '../../types';
import { Sun, Wind } from 'lucide-react';

interface ServiceBadgeProps {
  serviceType: ServiceType;
  size?: 'sm' | 'md';
}

export const ServiceBadge: React.FC<ServiceBadgeProps> = ({ serviceType, size = 'sm' }) => {
  if (serviceType === 'SOLAR') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-amber-50 text-amber-800 border-amber-300 ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
        }`}
      >
        <Sun className={size === 'sm' ? 'w-3 h-3 text-amber-600' : 'w-4 h-4 text-amber-600'} />
        SOLAR
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-sky-50 text-sky-800 border-sky-300 ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
    >
      <Wind className={size === 'sm' ? 'w-3 h-3 text-sky-600' : 'w-4 h-4 text-sky-600'} />
      AC / HVAC
    </span>
  );
};
