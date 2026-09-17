import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div className="flex items-center justify-center">
        <button
          id="pwa-install-btn"
          onClick={install}
          className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
          title="Instalar como app móvil o de escritorio"
        >
          <Download className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          <span className="truncate">Instalar App</span>
        </button>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <div className="flex items-center justify-center">
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">En iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 pb-[max(4.75rem,calc(env(safe-area-inset-bottom,0px)+2.5rem))] animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-white max-h-[calc(100dvh-6rem)] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-base text-white">Instalar en iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-xs text-slate-950">1</span>
                  <p>
                    Pulsa el icono de <strong className="text-amber-400 inline-flex items-center gap-1">Compartir <Share2 className="w-3.5 h-3.5 inline" /></strong> en la barra inferior de Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-xs text-slate-950">2</span>
                  <p>
                    Desliza hacia abajo y selecciona <strong className="text-amber-400 inline-flex items-center gap-1">Añadir a pantalla de inicio <PlusSquare className="w-3.5 h-3.5 inline" /></strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-xs text-slate-950">3</span>
                  <p>
                    Confirma pulsando <strong>Añadir</strong>. ¡Listo! Tendrás la aplicación en tu móvil como una app nativa.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
