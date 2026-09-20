import React from 'react';

export interface ServoraLogoProps {
  variant?: 'full' | 'compact' | 'symbol' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  inverted?: boolean;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export const ServoraLogo: React.FC<ServoraLogoProps> = ({
  variant = 'compact',
  size = 'md',
  inverted = false,
  subtitle,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    xs: { icon: 'w-7 h-7', text: 'text-sm font-black', sub: 'text-[9px]' },
    sm: { icon: 'w-8 h-8', text: 'text-base font-black', sub: 'text-[10px]' },
    md: { icon: 'w-9 h-9', text: 'text-lg font-black', sub: 'text-xs' },
    lg: { icon: 'w-11 h-11', text: 'text-xl font-black', sub: 'text-xs' },
    xl: { icon: 'w-14 h-14', text: 'text-2xl sm:text-3xl font-black', sub: 'text-xs sm:text-sm' },
    hero: { icon: 'w-20 h-20 sm:w-24 sm:h-24', text: 'text-3xl sm:text-4xl font-black', sub: 'text-sm' },
  };

  const badgeSizeMap = {
    xs: 'w-10 h-10',
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-28 h-28 sm:w-32 sm:h-32',
    hero: 'w-32 h-32 sm:w-40 sm:h-40',
  };

  const { icon: iconClass, text: textClass, sub: subClass } = sizeMap[size] || sizeMap.md;

  if (variant === 'badge') {
    const badgeClass = badgeSizeMap[size] || badgeSizeMap.xl;
    return (
      <div
        onClick={onClick}
        className={`inline-flex flex-col items-center justify-center shrink-0 ${
          onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
        } ${className}`}
      >
        <div className="relative rounded-full p-1 bg-white shadow-xl ring-2 ring-slate-200/80 dark:ring-white/20 shrink-0">
          <img
            src="/servora-logo.png"
            alt="Servora - Smarter Field Service"
            className={`${badgeClass} aspect-square object-contain rounded-full`}
            loading="eager"
          />
        </div>
        {subtitle && (
          <span
            className={`mt-2 font-semibold tracking-wider uppercase text-xs ${
              inverted ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'symbol') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <div className="rounded-full bg-white p-0.5 shadow-2xs ring-1 ring-slate-200/80 dark:ring-white/20 shrink-0">
          <img
            src="/servora-logo.png"
            alt="Servora"
            className={`${iconClass} aspect-square object-contain rounded-full`}
            loading="eager"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 sm:gap-2.5 shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="rounded-full bg-white p-0.5 shadow-2xs ring-1 ring-slate-200/80 dark:ring-white/20 shrink-0 flex items-center justify-center">
        <img
          src="/servora-logo.png"
          alt="Servora"
          className={`${iconClass} aspect-square object-contain rounded-full`}
          loading="eager"
        />
      </div>
      <div className="flex flex-col leading-none shrink-0">
        <span
          className={`tracking-tight uppercase ${textClass} ${
            inverted ? 'text-white' : 'text-slate-900'
          }`}
        >
          SERVORA
        </span>
        {(variant === 'full' || subtitle) && (
          <span
            className={`font-semibold tracking-wider uppercase mt-0.5 ${subClass} ${
              inverted ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {subtitle || 'Smarter Field Service'}
          </span>
        )}
      </div>
    </div>
  );
};

