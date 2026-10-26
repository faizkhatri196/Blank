import React from 'react';
import { usePwaInstall } from '../../contexts/PwaInstallContext';
import { Download, Sparkles } from 'lucide-react';

export interface InstallButtonProps {
  variant?: 'nav' | 'button' | 'dropdown';
  className?: string;
  showIcon?: boolean;
}

export const InstallButton: React.FC<InstallButtonProps> = ({
  variant = 'nav',
  className = '',
  showIcon = true,
}) => {
  const { isInstalled, isInstallable, installApp } = usePwaInstall();

  // If already running inside installed standalone PWA, hide the install button
  if (isInstalled || !isInstallable) {
    return null;
  }

  if (variant === 'dropdown') {
    return (
      <button
        type="button"
        onClick={() => installApp()}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/80 rounded-xl transition-colors ${className}`}
        aria-label="Install Servora App"
      >
        {showIcon && <Download className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
        <span>Install App</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => installApp()}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 active:bg-indigo-200/80 border border-indigo-200/90 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${className}`}
      aria-label="Install Servora App"
      title="Install Servora as an app on your device"
    >
      {showIcon && <Download className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
      <span>Install App</span>
    </button>
  );
};
