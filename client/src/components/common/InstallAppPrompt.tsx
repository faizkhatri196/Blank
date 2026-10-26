import React, { useEffect } from 'react';
import { usePwaInstall } from '../../contexts/PwaInstallContext';
import { Download, X, Share2, PlusSquare, CheckCircle2, Laptop, Smartphone, HelpCircle } from 'lucide-react';

export const InstallAppPrompt: React.FC = () => {
  const {
    isInstallable,
    isNativePromptAvailable,
    isInstalled,
    isIOS,
    isDismissed,
    installedJustNow,
    installApp,
    dismissPrompt,
    showInstructions,
    setShowInstructions,
  } = usePwaInstall();

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showInstructions) {
        setShowInstructions(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInstructions, setShowInstructions]);

  // If already installed and not showing recent install toast, render nothing
  if (isInstalled && !installedJustNow) {
    return null;
  }

  return (
    <>
      {/* ── Success Toast: Just Installed ── */}
      {installedJustNow && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 animate-slideUp flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-bold text-white">Servora Installed!</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Launch Servora anytime from your home screen or application launcher.
            </p>
          </div>
        </div>
      )}

      {/* ── First Visit Non-Intrusive Installation Banner ── */}
      {isInstallable && !isDismissed && !isInstalled && (
        <aside
          role="region"
          aria-label="Install Servora Application"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:bottom-5 sm:max-w-md z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-xl ring-1 ring-black/5 animate-slideUp"
        >
          <div className="flex items-start gap-3.5">
            {/* App Icon */}
            <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 shadow-sm shrink-0 flex items-center justify-center">
              <img
                src="/servora-logo.png"
                alt="Servora Logo"
                className="w-10 h-10 object-contain rounded-lg"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Install Servora
                </h3>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                  App
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Install Servora for fast, one-tap access to your service requests and operations dashboard.
              </p>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => installApp()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
                </button>

                {!isNativePromptAvailable && !isIOS && (
                  <button
                    type="button"
                    onClick={() => setShowInstructions(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>How to install</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>

            {/* Dismiss ✕ Button */}
            <button
              type="button"
              onClick={dismissPrompt}
              aria-label="Dismiss installation prompt"
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* ── Platform-Specific Manual Installation Instructions Modal ── */}
      {showInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-instructions-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 p-1 flex items-center justify-center shrink-0">
                  <img src="/servora-logo.png" alt="Servora" className="w-8 h-8 object-contain rounded-md" />
                </div>
                <div>
                  <h3 id="pwa-instructions-title" className="text-base font-bold text-slate-900">
                    Install Servora App
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isIOS ? 'Instructions for iPhone & iPad (Safari)' : 'Manual Browser Installation'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Close instructions dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Steps */}
            <div className="py-5 space-y-4">
              {isIOS ? (
                /* iOS Safari instructions */
                <>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Apple Safari doesn't allow one-click install buttons, but you can install Servora in 3 quick taps:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div className="text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Tap the Share button</span>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                          <span>Look for the</span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-[11px] text-indigo-600">
                            <Share2 className="w-3 h-3" /> Share
                          </span>
                          <span>icon at the bottom of Safari.</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div className="text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Select "Add to Home Screen"</span>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                          <span>Scroll down and tap</span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-[11px] text-indigo-600">
                            <PlusSquare className="w-3 h-3" /> Add to Home Screen
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div className="text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Tap "Add" in top-right</span>
                        <p className="text-slate-500 mt-0.5">
                          Servora will appear as a standalone app on your home screen.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Desktop / Alternative browser instructions */
                <>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Install Servora as a standalone desktop application in your browser:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                        <Laptop className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Address Bar Install Icon</span>
                        <p className="text-slate-500 mt-0.5">
                          In Google Chrome, Microsoft Edge, or Brave, click the install icon (🖥️ or ⊕) on the right side of the URL address bar.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Browser Menu (⋮ or ⋯)</span>
                        <p className="text-slate-500 mt-0.5">
                          Open your browser settings menu, select <strong>"Install Servora"</strong> or <strong>"Apps" → "Install this site as an app"</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
