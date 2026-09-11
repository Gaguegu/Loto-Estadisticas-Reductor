import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  GitBranch,
  GitCommit,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Trash2,
  ShieldCheck,
  Clock,
  Github,
  Save,
} from 'lucide-react';
import { GitHubCommitInfo } from '../hooks/useAppUpdate';
import { CURRENT_APP_VERSION } from '../config/version';

interface UpdateCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasUpdate: boolean;
  updateMessage: string;
  isChecking: boolean;
  lastChecked: Date | null;
  latestCommit: GitHubCommitInfo | null;
  githubRepo: string;
  onSetGithubRepo: (repo: string) => void;
  onCheckForUpdates: () => Promise<{ hasUpdate: boolean; message: string; commit?: GitHubCommitInfo }>;
  onApplyUpdate: () => void;
}

export const UpdateCenterModal: React.FC<UpdateCenterModalProps> = ({
  isOpen,
  onClose,
  hasUpdate,
  updateMessage,
  isChecking,
  lastChecked,
  latestCommit,
  githubRepo,
  onSetGithubRepo,
  onCheckForUpdates,
  onApplyUpdate,
}) => {
  const [repoInput, setRepoInput] = useState(githubRepo);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleManualCheck = async () => {
    setStatusFeedback('Comprobando actualizaciones en GitHub y en el servidor...');
    const res = await onCheckForUpdates();
    setStatusFeedback(res.message);
    setTimeout(() => {
      setStatusFeedback(null);
    }, 6000);
  };

  const handleSaveRepo = (e: React.FormEvent) => {
    e.preventDefault();
    onSetGithubRepo(repoInput);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 3000);
  };

  const handleForceCleanReload = () => {
    if (
      window.confirm(
        '¿Deseas vaciar la memoria caché del navegador y forzar la recarga completa desde GitHub? Tus peñas y combinaciones guardadas NO se borrarán.'
      )
    ) {
      if ('caches' in window) {
        window.caches.keys().then((keys) => {
          return Promise.all(keys.map((key) => window.caches.delete(key)));
        });
      }
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('_force', Date.now().toString());
        window.location.href = url.toString();
      }, 200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
                  Actualizaciones y GitHub
                </h3>
                <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                  v{CURRENT_APP_VERSION.version}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sincronización de cambios, control de versiones y caché PWA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm space-y-5">
          
          {/* Status Notification Card */}
          {hasUpdate ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-2 border-emerald-500/40 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-emerald-950 text-sm sm:text-base">
                    ¡Nueva versión lista para instalar!
                  </h4>
                  <p className="text-xs text-emerald-900/90 mt-1 leading-relaxed">
                    {updateMessage || 'Se han detectado nuevos commits o archivos actualizados.'}
                  </p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end">
                <button
                  onClick={onApplyUpdate}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Actualizar Aplicación Ahora</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    La aplicación está al día
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Estás ejecutando la versión más reciente ({CURRENT_APP_VERSION.version} - {CURRENT_APP_VERSION.buildDate}).
                  </p>
                </div>
              </div>

              <button
                onClick={handleManualCheck}
                disabled={isChecking}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
                <span className="hidden sm:inline">{isChecking ? 'Buscando...' : 'Buscar ahora'}</span>
                <span className="sm:hidden">Buscar</span>
              </button>
            </div>
          )}

          {/* Feedback Toast Banner */}
          {statusFeedback && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* GitHub Repository Config Section */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-900" />
                <span>Sincronización con Repositorio GitHub</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">REST API</span>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Indica tu repositorio de GitHub para que la aplicación consulte automáticamente si has subido nuevos cambios o commits.
            </p>

            <form onSubmit={handleSaveRepo} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="usuario/Loto-Estadisticas-Reductor"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>
            </form>

            {isSavedFeedback && (
              <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Repositorio configurado correctamente
              </p>
            )}

            {/* Latest commit details */}
            {latestCommit ? (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <GitCommit className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Último commit detectado:</span>
                  </span>
                  <a
                    href={latestCommit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-indigo-600 hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>{latestCommit.sha}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-800 font-medium italic">&ldquo;{latestCommit.message}&rdquo;</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <span>Por: {latestCommit.author}</span>
                  <span>{latestCommit.date}</span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Introduce tu usuario/repositorio para comprobar el historial de commits en directo.
              </div>
            )}
          </div>

          {/* Cache Cleaning & Force Refresh */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <span>Limpieza de Caché y Recarga Forzada</span>
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Si acabas de hacer un <em>push</em> a GitHub y tu navegador sigue mostrando una versión anterior guardada en caché, puedes forzar una recarga limpia inmediata.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleForceCleanReload}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition shadow-xs active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Limpiar Caché y Forzar Recarga</span>
              </button>
            </div>
          </div>

          {/* Last checked note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Última comprobación:{' '}
                {lastChecked ? lastChecked.toLocaleTimeString('es-ES') : 'Al iniciar la app'}
              </span>
            </span>
            <span>La app comprueba cambios cada 15 min</span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition active:scale-95 cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
