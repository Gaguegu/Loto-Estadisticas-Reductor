import React from 'react';
import { RefreshCw, GitCommit, Sparkles, X, ArrowUpRight } from 'lucide-react';
import { GitHubCommitInfo } from '../hooks/useAppUpdate';

interface UpdateNotificationBannerProps {
  hasUpdate: boolean;
  updateMessage: string;
  isUpdating: boolean;
  latestCommit: GitHubCommitInfo | null;
  onApplyUpdate: () => void;
  onDismiss: () => void;
  onOpenDetails: () => void;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  hasUpdate,
  updateMessage,
  isUpdating,
  latestCommit,
  onApplyUpdate,
  onDismiss,
  onOpenDetails,
}) => {
  if (!hasUpdate) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in slide-in-from-top-3 duration-300">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border-2 border-amber-400/80 ring-4 ring-amber-400/20 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md font-bold animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs sm:text-sm text-amber-300 tracking-tight">
                ¡NUEVA ACTUALIZACIÓN DISPONIBLE!
              </span>
              {latestCommit && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-white/15 px-2 py-0.5 rounded-md font-mono text-slate-200">
                  <GitCommit className="w-3 h-3 text-amber-400" />
                  {latestCommit.sha}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 mt-0.5 truncate">
              {updateMessage || 'Se han detectado cambios recientes en GitHub o en el servidor.'}
            </p>

            {latestCommit?.message && (
              <p className="text-[11px] text-amber-200/90 italic truncate">
                &ldquo;{latestCommit.message}&rdquo;
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          <button
            onClick={onOpenDetails}
            className="text-xs text-slate-300 hover:text-white px-2 py-1.5 rounded-lg transition hover:bg-white/10 inline-flex items-center gap-1"
            title="Ver detalles de la versión"
          >
            <span>Detalles</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onApplyUpdate}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Actualizando...' : 'Actualizar Ahora'}</span>
          </button>

          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Recordar más tarde"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
