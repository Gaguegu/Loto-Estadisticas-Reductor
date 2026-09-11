import React from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateNotificationBannerProps {
  hasUpdate: boolean;
  isUpdating: boolean;
  onApplyUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  hasUpdate,
  isUpdating,
  onApplyUpdate,
  onDismiss,
}) => {
  if (!hasUpdate) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 animate-in slide-in-from-bottom-4 duration-300 max-w-sm w-[90%] sm:w-auto">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
            Hay una actualización pendiente
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onApplyUpdate}
            disabled={isUpdating}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            title="Actualizar la aplicación ahora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
