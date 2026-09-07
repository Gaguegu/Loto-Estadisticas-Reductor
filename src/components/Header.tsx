import React from 'react';
import { GameType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { Database, Calendar, RefreshCw, FolderHeart } from 'lucide-react';
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
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative group shrink-0">
              <img
                src={ansamaLogo}
                alt="ANSAMA Lotería"
                className={`w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-2xl shadow-md border p-0.5 ring-2 hover:scale-105 transition-all ${
                  isEuro
                    ? 'border-amber-600/50 bg-white/60 ring-amber-500/30'
                    : 'border-white/40 bg-white/20 ring-white/30'
                }`}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded-md border font-black text-[10px] tracking-wider uppercase shadow-xs ${
                    isEuro
                      ? 'bg-white text-slate-950 border-white/80'
                      : 'bg-white/20 border-white/40 text-white'
                  }`}
                >
                  ANSAMA
                </span>
                <h1
                  className={`text-base sm:text-lg font-black tracking-tight truncate ${
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
                className={`text-[11px] sm:text-xs truncate ${
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

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Sync Database Button */}
            <button
              id="header-sync-db-btn"
              onClick={onSyncDatabase}
              disabled={isSyncing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 border shadow-xs ${
                isEuro
                  ? 'bg-slate-950/10 hover:bg-slate-950/20 border-slate-950/25 text-slate-950'
                  : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
              } ${isSyncing ? 'opacity-75 cursor-wait' : ''}`}
              title={
                missingDrawsCount > 0
                  ? `Hay ${missingDrawsCount} sorteos recientes disponibles. Haz clic para sincronizar la base de datos.`
                  : 'Sincronizar base de datos con los últimos sorteos oficiales'
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
              <span className="hidden sm:inline">
                {isSyncing ? 'Actualizando BD...' : 'Actualizar Base de Datos'}
              </span>
              <span className="sm:hidden">
                {isSyncing ? 'Actualizando...' : 'Actualizar BD'}
              </span>
              {missingDrawsCount > 0 && !isSyncing && (
                <span
                  className={`font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-xs ${
                    isEuro
                      ? 'bg-slate-950 text-amber-300'
                      : 'bg-white text-slate-900'
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
              <span className="hidden sm:inline">Historial Sorteos</span>
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
                <span className="hidden sm:inline">Mis Peñas</span>
                <span className="sm:hidden">Peñas</span>
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
