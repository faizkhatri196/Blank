import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  fraction?: string; // e.g., '14 / 20'
  icon?: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'info';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  fraction,
  icon,
  tone = 'default',
}) => {
  const toneClasses = {
    default: 'bg-white border-slate-200 text-slate-900',
    success: 'bg-emerald-50/50 border-emerald-200 text-emerald-950',
    warning: 'bg-amber-50/50 border-amber-200 text-amber-950',
    info: 'bg-sky-50/50 border-sky-200 text-sky-950',
  };

  return (
    <div className={`p-4 rounded-xl border shadow-xs ${toneClasses[tone]} transition-all`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 break-words leading-tight min-w-0 flex-1">
          {title}
        </span>
        {icon && <div className="text-slate-400 shrink-0 mt-0.5">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {fraction && (
          <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono shrink-0">
            {fraction}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{subtitle}</p>}
    </div>
  );
};

