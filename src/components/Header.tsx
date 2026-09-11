import React from 'react';
import { GameType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { Database, Calendar, RefreshCw, FolderHeart, BookOpen } from 'lucide-react';
import ansamaLogo from '../assets/images/ansama_lottery_logo_1788692658153.jpg';

interface HeaderProps {
  activeGame: GameType;
  onSelectGame: (game: GameType) => void;
  onOpenHistory: () => void;
  totalDrawsInGame: number;
  onSyncDatabase: () => void;
  isSyncing: boolean;
  missingDrawsCount: number;
  onOpenSavedCombinations?: () => void;
  savedCombinationsCount?: number;
  onOpenManual?: () => void;
  hasAppUpdate?: boolean;
  isCheckingAppUpdate?: boolean;
  onApplyUpdate?: () => void;
  onCheckUpdates?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeGame,
  onSelectGame,
  onOpenHistory,
  totalDrawsInGame,
  onSyncDatabase,
  isSyncing,
  missingDrawsCount,
  onOpenSavedCombinations,
  savedCombinationsCount = 0,
  onOpenManual,
  hasAppUpdate = false,
  isCheckingAppUpdate = false,
  onApplyUpdate,
  onCheckUpdates,
}) => {
  const isEuro = activeGame === 'euromillones';

  const games: { id: GameType; name: string; subtitle: string; badge: string }[] = [
    {
      id: 'primitiva',
      name: 'La Primitiva',
      subtitle: 'Lun, Jue y Sáb',
      badge: '1,00 €',
    },
    {
      id: 'bonoloto',
      name: 'Bonoloto',
      subtitle: 'Diario (Lun a Dom)',
      badge: '0,50 €',
    },
    {
      id: 'euromillones',
      name: 'Euromillones',
      subtitle: 'Mar y Vie (5N + 2★)',
      badge: '2,50 €',
    },
  ];

  return (
    <header
      className={`border-b sticky top-0 z-40 shadow-lg transition-colors duration-300 ${
        activeGame === 'primitiva'
          ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 border-emerald-500/50 text-white'
          : activeGame === 'bonoloto'
          ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 border-blue-500/50 text-white'
          : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-amber-300 text-slate-950'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative group shrink-0">
              <img
                src={ansamaLogo}
                alt="ANSAMA Lotería"
                className={`w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-2xl shadow-md border p-0.5 ring-2 hover:scale-105 transition-all ${
                  isEuro
                    ? 'border-amber-600/50 bg-white/60 ring-amber-500/30'
                    : 'border-white/40 bg-white/20 ring-white/30'
                }`}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded-md border font-black text-[9px] sm:text-[10px] tracking-wider uppercase shadow-xs ${
                    isEuro
                      ? 'bg-white text-slate-950 border-white/80'
                      : 'bg-white/20 border-white/40 text-white'
                  }`}
                >
                  ANSAMA
                </span>
                <h1
                  className={`text-sm sm:text-lg font-black tracking-tight truncate ${
                    isEuro ? 'text-slate-950' : 'text-white'
                  }`}
                >
                  LotoEstadísticas{' '}
                  <span
                    className={
                      activeGame === 'primitiva'
                        ? 'text-emerald-200 font-extrabold'
                        : activeGame === 'bonoloto'
                        ? 'text-cyan-200 font-extrabold'
                        : 'text-amber-900 font-extrabold'
                    }
                  >
                    &amp; Reductor
                  </span>
                </h1>
              </div>
              <p
                className={`text-[10px] sm:text-xs truncate ${
                  activeGame === 'primitiva'
                    ? 'text-emerald-100'
                    : activeGame === 'bonoloto'
                    ? 'text-blue-100'
                    : 'text-amber-950/85 font-medium'
                }`}
              >
                Loterías y Apuestas del Estado &bull; Reducciones oficiales al 5, 4 y 3
              </p>
            </div>
          </div>

          {/* Desktop Right Actions (md: and up) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Sync Database Button */}
            <button
              id="header-sync-db-btn"
              onClick={onSyncDatabase}
              disabled={isSyncing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border shadow-xs cursor-pointer ${
                isEuro
                  ? 'bg-slate-950/15 hover:bg-slate-950/25 border-slate-950/30 text-slate-950'
                  : 'bg-white/20 hover:bg-white/30 border-white/35 text-white'
              } ${isSyncing ? 'opacity-75 cursor-wait' : ''}`}
              title={
                missingDrawsCount > 0
                  ? `Hay ${missingDrawsCount} sorteos oficiales pendientes. Pulsa para actualizar la base de datos.`
                  : 'Actualizar base de datos con los últimos sorteos oficiales de Loterías y Apuestas del Estado'
              }
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isSyncing
                    ? 'animate-spin'
                    : isEuro
                    ? 'text-slate-950'
                    : 'text-white'
                }`}
              />
              <span>{isSyncing ? 'Actualizando BD...' : 'Actualizar BD'}</span>
              {missingDrawsCount > 0 && !isSyncing && (
                <span
                  className={`font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-xs ${
                    isEuro
                      ? 'bg-slate-950 text-amber-300'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  +{missingDrawsCount}
                </span>
              )}
            </button>

            <button
              id="header-history-btn"
              onClick={onOpenHistory}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 shadow-xs ${
                isEuro
                  ? 'bg-slate-950/10 hover:bg-slate-950/20 border-slate-950/25 text-slate-950'
                  : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
              }`}
              title="Ver sorteos históricos o añadir nuevos"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Historial Sorteos</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold border ${
                  isEuro
                    ? 'bg-slate-950/15 text-slate-950 border-slate-950/20'
                    : 'bg-black/25 text-white border-white/20'
                }`}
              >
                {totalDrawsInGame}
              </span>
            </button>

            {onOpenSavedCombinations && (
              <button
                id="header-saved-combinations-btn"
                onClick={onOpenSavedCombinations}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 shadow-xs cursor-pointer ${
                  isEuro
                    ? 'bg-amber-950/15 hover:bg-amber-950/25 border-amber-950/25 text-slate-950'
                    : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
                }`}
                title="Mis Combinaciones y Peñas guardadas para jugar o comprobar"
              >
                <FolderHeart className="w-3.5 h-3.5 text-amber-300" />
                <span>Mis Peñas</span>
                {savedCombinationsCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold border ${
                      isEuro
                        ? 'bg-amber-400 text-slate-950 border-amber-500'
                        : 'bg-amber-400 text-slate-950 border-amber-300'
                    }`}
                  >
                    {savedCombinationsCount}
                  </span>
                )}
              </button>
            )}

            {onOpenManual && (
              <button
                id="header-user-manual-btn"
                onClick={onOpenManual}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 shadow-xs cursor-pointer ${
                  isEuro
                    ? 'bg-slate-950/10 hover:bg-slate-950/20 border-slate-950/25 text-slate-950'
                    : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
                }`}
                title="Manual de Usuario y Guía de Uso (Descargable en PDF)"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>Guía / Manual PDF</span>
              </button>
            )}

            {(onApplyUpdate || onCheckUpdates) && (
              <button
                id="header-app-update-btn"
                onClick={hasAppUpdate ? onApplyUpdate : onCheckUpdates}
                disabled={isCheckingAppUpdate}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 shadow-xs cursor-pointer ${
                  hasAppUpdate
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black border-white ring-2 ring-emerald-300/80 animate-pulse'
                    : isEuro
                    ? 'bg-slate-950/10 hover:bg-slate-950/20 border-slate-950/25 text-slate-950'
                    : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
                }`}
                title={
                  hasAppUpdate
                    ? 'Hay una actualización pendiente. Clic para actualizar ahora'
                    : 'Comprobar si hay actualizaciones'
                }
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isCheckingAppUpdate
                      ? 'animate-spin text-amber-300'
                      : hasAppUpdate
                      ? 'text-white'
                      : 'text-amber-300'
                  }`}
                />
                <span>
                  {isCheckingAppUpdate
                    ? 'Buscando...'
                    : hasAppUpdate
                    ? 'Actualizar'
                    : 'Actualizar'}
                </span>
                {hasAppUpdate && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
                  </span>
                )}
              </button>
            )}

            <PWAInstallButton />
          </div>

          {/* Mobile Priority Indicator (when app update is ready) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {hasAppUpdate && (
              <button
                type="button"
                id="mobile-priority-update-btn"
                onClick={onApplyUpdate}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-white shadow-md border border-white animate-pulse"
                title="Actualización pendiente de la aplicación. Pulsa para aplicar"
              >
                <RefreshCw className="w-3 h-3 text-white" />
                <span>Actualizar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Action Bar: 100% visible, 3-column grid, never overflows to the right */}
        <div className="grid grid-cols-3 gap-1.5 pb-2.5 md:hidden">
          {/* 1. Actualizar BD */}
          <button
            id="mobile-sync-db-btn"
            onClick={onSyncDatabase}
            disabled={isSyncing}
            className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold transition active:scale-95 border shadow-xs cursor-pointer ${
              isEuro
                ? 'bg-slate-950/15 hover:bg-slate-950/25 border-slate-950/30 text-slate-950'
                : 'bg-white/20 hover:bg-white/30 border-white/35 text-white'
            } ${isSyncing ? 'opacity-75 cursor-wait' : ''}`}
            title="Actualizar base de datos con los últimos sorteos"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 shrink-0 ${
                isSyncing
                  ? 'animate-spin'
                  : isEuro
                  ? 'text-slate-950'
                  : 'text-white'
              }`}
            />
            <span className="truncate">
              {isSyncing ? 'Cargando...' : 'Actualizar BD'}
            </span>
            {missingDrawsCount > 0 && !isSyncing && (
              <span
                className={`font-black text-[9px] px-1 py-0.2 rounded-full ${
                  isEuro ? 'bg-slate-950 text-amber-300' : 'bg-amber-400 text-slate-950'
                }`}
              >
                +{missingDrawsCount}
              </span>
            )}
          </button>

          {/* 2. Historial Sorteos */}
          <button
            id="mobile-history-btn"
            onClick={onOpenHistory}
            className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold border transition active:scale-95 shadow-xs cursor-pointer ${
              isEuro
                ? 'bg-slate-950/10 hover:bg-slate-950/20 border-slate-950/25 text-slate-950'
                : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
            }`}
            title="Ver sorteos históricos"
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Historial</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-bold border ${
                isEuro
                  ? 'bg-slate-950/15 text-slate-950 border-slate-950/20'
                  : 'bg-black/25 text-white border-white/20'
              }`}
            >
              {totalDrawsInGame}
            </span>
          </button>

          {/* 3. Mis Peñas */}
          <button
            id="mobile-saved-combinations-btn"
            onClick={onOpenSavedCombinations}
            className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold border transition active:scale-95 shadow-xs cursor-pointer ${
              isEuro
                ? 'bg-amber-950/15 hover:bg-amber-950/25 border-amber-950/25 text-slate-950'
                : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
            }`}
            title="Mis Peñas guardadas"
          >
            <FolderHeart className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Mis Peñas</span>
            {savedCombinationsCount > 0 && (
              <span
                className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-bold border ${
                  isEuro
                    ? 'bg-amber-400 text-slate-950 border-amber-500'
                    : 'bg-amber-400 text-slate-950 border-amber-300'
                }`}
              >
                {savedCombinationsCount}
              </span>
            )}
          </button>

          {/* 4. Guía / Manual PDF */}
          <button
            id="mobile-user-manual-btn"
            onClick={onOpenManual}
            className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold border transition active:scale-95 shadow-xs cursor-pointer ${
              isEuro
                ? 'bg-slate-950/10 hover:bg-slate-950/20 border-slate-950/25 text-slate-950'
                : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
            }`}
            title="Manual de Usuario y Guía de Uso"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Guía PDF</span>
          </button>

          {/* 5. Actualizar App (GitHub/PWA) */}
          {(onApplyUpdate || onCheckUpdates) && (
            <button
              id="mobile-app-update-btn"
              onClick={hasAppUpdate ? onApplyUpdate : onCheckUpdates}
              disabled={isCheckingAppUpdate}
              className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold border transition active:scale-95 shadow-xs cursor-pointer ${
                hasAppUpdate
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black border-white ring-2 ring-emerald-300/80 animate-pulse'
                  : isEuro
                  ? 'bg-slate-950/10 hover:bg-slate-950/20 border-slate-950/25 text-slate-950'
                  : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
              }`}
              title="Actualizar aplicación"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 shrink-0 ${
                  isCheckingAppUpdate
                    ? 'animate-spin text-amber-300'
                    : hasAppUpdate
                    ? 'text-white'
                    : 'text-amber-300'
                }`}
              />
              <span className="truncate">
                {isCheckingAppUpdate ? 'Buscando...' : hasAppUpdate ? '¡Actualizar!' : 'Actualizar App'}
              </span>
            </button>
          )}

          {/* 6. Instalar App */}
          <div className="flex items-center justify-center">
            <PWAInstallButton />
          </div>
        </div>

        {/* Game Navigation Selector */}
        <div className="pb-3 pt-1">
          <div
            className={`grid grid-cols-3 gap-2 p-1.5 rounded-2xl border shadow-inner transition-colors ${
              activeGame === 'primitiva'
                ? 'bg-emerald-950/40 border-emerald-400/30'
                : activeGame === 'bonoloto'
                ? 'bg-blue-950/40 border-blue-400/30'
                : 'bg-amber-600/25 border-amber-500/40'
            }`}
          >
            {games.map((g) => {
              const isActive = activeGame === g.id;
              return (
                <button
                  key={g.id}
                  id={`tab-game-${g.id}`}
                  onClick={() => onSelectGame(g.id)}
                  className={`flex flex-col sm:flex-row items-center sm:justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-slate-950 font-black shadow-lg border border-white ring-2 ring-white/60'
                      : isEuro
                      ? 'text-amber-950 hover:text-black hover:bg-black/10'
                      : 'text-white/85 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <div className="flex flex-col text-center sm:text-left">
                    <span className="truncate">{g.name}</span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-normal truncate ${
                        isActive
                          ? 'text-slate-600'
                          : isEuro
                          ? 'text-amber-950/75 font-medium'
                          : 'text-white/70'
                      }`}
                    >
                      {g.subtitle}
                    </span>
                  </div>
                  <span
                    className={`mt-1 sm:mt-0 text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                      isActive
                        ? 'bg-slate-100 text-slate-950 font-bold border border-slate-300'
                        : isEuro
                        ? 'bg-amber-600/30 text-amber-950 font-semibold border border-amber-700/20'
                        : 'bg-black/25 text-white/90 border border-white/15'
                    }`}
                  >
                    {g.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
