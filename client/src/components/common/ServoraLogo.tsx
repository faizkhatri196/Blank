import React from 'react';

export interface ServoraLogoProps {
  variant?: 'full' | 'compact' | 'symbol';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
    xs: { icon: 'w-5 h-5', text: 'text-xs', sub: 'text-[9px]' },
    sm: { icon: 'w-6 h-6', text: 'text-sm', sub: 'text-[10px]' },
    md: { icon: 'w-8 h-8', text: 'text-base sm:text-lg', sub: 'text-[10px] sm:text-[11px]' },
    lg: { icon: 'w-10 h-10', text: 'text-lg sm:text-xl', sub: 'text-xs' },
    xl: { icon: 'w-14 h-14', text: 'text-2xl sm:text-3xl', sub: 'text-xs sm:text-sm' },
  };

  const { icon: iconClass, text: textClass, sub: subClass } = sizeMap[size];

  if (variant === 'symbol') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <img
          src="/servora-logo.png"
          alt="Servora"
          className={`${iconClass} rounded-full object-contain shadow-xs`}
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src="/servora-logo.png"
        alt="Servora"
        className={`${iconClass} rounded-full object-contain shrink-0 shadow-xs`}
      />
      <div className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight uppercase ${textClass} ${
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
