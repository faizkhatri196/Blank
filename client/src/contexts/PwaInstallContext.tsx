import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaInstallContextType {
  isInstallable: boolean;
  isNativePromptAvailable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDismissed: boolean;
  installedJustNow: boolean;
  installApp: () => Promise<boolean>;
  dismissPrompt: () => void;
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  checkIsStandalone: () => boolean;
}

const DISMISS_DURATION_DAYS = 7;
const DISMISS_STORAGE_KEY = 'servora_pwa_dismissed_until';

const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined);

export const PwaInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installedJustNow, setInstalledJustNow] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  // Platform detection
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) && !(window as any).MSStream;

  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  // Check standalone mode across Chromium, Safari iOS, Android TWA
  const checkIsStandalone = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isStandaloneWindowOverlay = window.matchMedia('(display-mode: window-controls-overlay)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isTwa = document.referrer.startsWith('android-app://');

    return Boolean(isStandaloneMedia || isStandaloneWindowOverlay || isIOSStandalone || isTwa);
  }, []);

  // Initialize status on mount
  useEffect(() => {
    const standalone = checkIsStandalone();
    setIsInstalled(standalone);

    // Check dismissal persistence
    const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (dismissedUntil) {
      const expiration = parseInt(dismissedUntil, 10);
      if (Date.now() < expiration) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_STORAGE_KEY);
        setIsDismissed(false);
      }
    }

    // Listen for display-mode changes (e.g. user installs or launches installed app)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Capture native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar on mobile so our custom banner has full control
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstalledJustNow(true);
      setShowInstructions(false);
      localStorage.removeItem(DISMISS_STORAGE_KEY);

      // Auto-hide installed toast after 5s
      setTimeout(() => {
        setInstalledJustNow(false);
      }, 5000);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkIsStandalone]);

  // Install trigger
  const installApp = async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);

        if (outcome === 'accepted') {
          setIsInstalled(true);
          return true;
        }
        return false;
      } catch (err) {
        console.error('[PWA] Error invoking native install prompt:', err);
        return false;
      }
    }

    // If native prompt unavailable on iOS or other browsers, show manual instructions
    setShowInstructions(true);
    return false;
  };

  // Dismiss banner
  const dismissPrompt = () => {
    setIsDismissed(true);
    const expiresAt = Date.now() + DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, expiresAt.toString());
    } catch (_e) {}
  };

  const isNativePromptAvailable = Boolean(deferredPrompt);
  // Installable if not already installed, and either native prompt is ready OR platform supports manual installation (like iOS Safari)
  const isInstallable = !isInstalled && (isNativePromptAvailable || isIOS);

  return (
    <PwaInstallContext.Provider
      value={{
        isInstallable,
        isNativePromptAvailable,
        isInstalled,
        isIOS,
        isAndroid,
        isDismissed,
        installedJustNow,
        installApp,
        dismissPrompt,
        showInstructions,
        setShowInstructions,
        checkIsStandalone,
      }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
};

export const usePwaInstall = () => {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error('usePwaInstall must be used within a PwaInstallProvider');
  }
  return context;
};
