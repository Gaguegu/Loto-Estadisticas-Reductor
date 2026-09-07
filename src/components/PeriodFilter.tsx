import React from 'react';
import { PeriodFilterState, GameType } from '../types';
import { getPresetDates, GAME_DRAW_DAYS } from '../utils/lotteryStats';
import { Calendar, Filter, Clock, RefreshCw, CalendarDays } from 'lucide-react';

interface PeriodFilterProps {
  filter: PeriodFilterState;
  onChangeFilter: (newFilter: PeriodFilterState) => void;
  filteredDrawsCount: number;
  totalDrawsCount: number;
  activeGame?: GameType;
  onSyncDatabase?: () => void;
  isSyncing?: boolean;
  missingDrawsCount?: number;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  filter,
  onChangeFilter,
  filteredDrawsCount,
  totalDrawsCount,
  activeGame = 'primitiva',
  onSyncDatabase,
  isSyncing = false,
  missingDrawsCount = 0,
}) => {
  const presets: { id: PeriodFilterState['preset']; label: string }[] = [
    { id: '1m', label: '1 Mes' },
    { id: '3m', label: '3 Meses' },
    { id: '6m', label: '6 Meses' },
    { id: '1y', label: '1 Año' },
    { id: '2y', label: '2 Años' },
    { id: 'all', label: 'Todo el Histórico' },
  ];

  const drawDays = GAME_DRAW_DAYS[activeGame] || [];
  const currentDay = filter.selectedDay || 'all';

  const handleSelectPreset = (preset: PeriodFilterState['preset']) => {
    const dates = getPresetDates(preset);
    onChangeFilter({
      ...filter,
      preset,
      startDate: dates.startDate,
      endDate: dates.endDate,
    });
  };

  const handleSelectDay = (day: string) => {
    onChangeFilter({
      ...filter,
      selectedDay: day,
    });
  };

  const handleStartDateChange = (val: string) => {
    onChangeFilter({
      ...filter,
      preset: 'custom',
      startDate: val,
    });
  };

  const handleEndDateChange = (val: string) => {
    onChangeFilter({
      ...filter,
      preset: 'custom',
      endDate: val,
    });
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border transition-colors ${
        activeGame === 'primitiva'
          ? 'border-emerald-200/90'
          : activeGame === 'bonoloto'
          ? 'border-blue-200/90'
          : 'border-amber-300/80'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl border shadow-2xs ${
              activeGame === 'primitiva'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                : activeGame === 'bonoloto'
                ? 'bg-blue-50 text-blue-800 border-blue-200/70'
                : 'bg-amber-50 text-amber-900 border-amber-300/70'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Periodo de Análisis Estadístico</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  activeGame === 'primitiva'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                    : activeGame === 'bonoloto'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300/60'
                    : 'bg-amber-100 text-amber-900 border border-amber-300/70'
                }`}
              >
                {activeGame === 'primitiva' ? 'Primitiva' : activeGame === 'bonoloto' ? 'Bonoloto' : 'Euromillones'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona el rango de fechas para calcular los números más repetidos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200/60">
            <Clock
              className={`w-3.5 h-3.5 ${
                activeGame === 'primitiva'
                  ? 'text-emerald-600'
                  : activeGame === 'bonoloto'
                  ? 'text-blue-600'
                  : 'text-amber-600'
              }`}
            />
            <span>
              <strong>{filteredDrawsCount}</strong> sorteos analizados {currentDay !== 'all' ? `(sólo ${currentDay}) ` : ''}de {totalDrawsCount} totales
            </span>
          </div>

          {onSyncDatabase && (
            <button
              id="filter-sync-database-btn"
              onClick={onSyncDatabase}
              disabled={isSyncing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 border ${
                missingDrawsCount > 0
                  ? activeGame === 'primitiva'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                    : activeGame === 'bonoloto'
                    ? 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100 shadow-xs'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              } ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
              title="Actualizar base de datos con los últimos sorteos"
            >
              <RefreshCw
                className={`w-3 h-3 ${
                  isSyncing
                    ? 'animate-spin'
                    : activeGame === 'primitiva'
                    ? 'text-emerald-600'
                    : activeGame === 'bonoloto'
                    ? 'text-blue-600'
                    : 'text-amber-600'
                }`}
              />
              <span>{isSyncing ? 'Actualizando...' : missingDrawsCount > 0 ? `Actualizar BD (+${missingDrawsCount})` : 'Actualizar'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset pills */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-500 mr-1 inline-flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Periodo rápido:
        </span>
        {presets.map((p) => {
          const isActive = filter.preset === p.id;
          return (
            <button
              key={p.id}
              id={`btn-preset-${p.id}`}
              onClick={() => handleSelectPreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                isActive
                  ? activeGame === 'primitiva'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs font-bold ring-2 ring-emerald-400/40 border border-emerald-500'
                    : activeGame === 'bonoloto'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xs font-bold ring-2 ring-blue-400/40 border border-blue-500'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-xs font-black ring-2 ring-amber-400/40 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Day of Week Filter Buttons */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-700 mr-1 inline-flex items-center gap-1">
          <CalendarDays
            className={`w-3.5 h-3.5 ${
              activeGame === 'primitiva'
                ? 'text-emerald-600'
                : activeGame === 'bonoloto'
                ? 'text-blue-600'
                : 'text-amber-600'
            }`}
          />
          Filtrar por día de sorteo:
        </span>

        {/* All Days button */}
        <button
          type="button"
          id="btn-day-filter-all"
          onClick={() => handleSelectDay('all')}
          className={`px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 border ${
            currentDay === 'all'
              ? activeGame === 'primitiva'
                ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs ring-2 ring-emerald-400/40'
                : activeGame === 'bonoloto'
                ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs ring-2 ring-blue-400/40'
                : 'bg-amber-400 text-slate-950 font-black border-amber-400 shadow-xs ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos los días
        </button>

        {/* Specific draw days for this game */}
        {drawDays.map((day) => {
          const isSelected = currentDay === day;
          return (
            <button
              key={day}
              type="button"
              id={`btn-day-filter-${day.toLowerCase()}`}
              onClick={() => handleSelectDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 border ${
                isSelected
                  ? activeGame === 'primitiva'
                    ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs ring-2 ring-emerald-400/40'
                    : activeGame === 'bonoloto'
                    ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs ring-2 ring-blue-400/40'
                    : 'bg-amber-400 text-slate-950 font-black border-amber-400 shadow-xs ring-2 ring-amber-400/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Sólo {day}
            </button>
          );
        })}

        {currentDay !== 'all' && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ml-1 ${
              activeGame === 'primitiva'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : activeGame === 'bonoloto'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            Mostrando los más repetidos de los sorteos del <strong>{currentDay}</strong>
          </span>
        )}
      </div>

      {/* Custom Date Range Inputs */}
      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-center">
        <div>
          <label htmlFor="filter-start-date" className="block text-xs font-medium text-slate-600 mb-1">
            Fecha inicial (Desde):
          </label>
          <input
            id="filter-start-date"
            type="date"
            value={filter.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className={`w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 ${
              activeGame === 'primitiva'
                ? 'focus:ring-emerald-500'
                : activeGame === 'bonoloto'
                ? 'focus:ring-blue-500'
                : 'focus:ring-amber-500'
            }`}
          />
        </div>

        <div>
          <label htmlFor="filter-end-date" className="block text-xs font-medium text-slate-600 mb-1">
            Fecha final (Hasta):
          </label>
          <input
            id="filter-end-date"
            type="date"
            value={filter.endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className={`w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 ${
              activeGame === 'primitiva'
                ? 'focus:ring-emerald-500'
                : activeGame === 'bonoloto'
                ? 'focus:ring-blue-500'
                : 'focus:ring-amber-500'
            }`}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-1 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
          <span className="font-semibold text-slate-700">Rango activo:</span>{' '}
          {new Date(filter.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
          &rarr;{' '}
          {new Date(filter.endDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
};
