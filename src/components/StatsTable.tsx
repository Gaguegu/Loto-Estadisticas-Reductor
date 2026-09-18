import React, { useState, useMemo, useEffect } from 'react';
import { GameType, NumberStat, SelectionCriterion } from '../types';
import { GAME_DRAW_DAYS } from '../utils/lotteryStats';
import {
  Trophy,
  Check,
  CheckSquare,
  Square,
  Star,
  HelpCircle,
  ArrowUpDown,
  Clock,
  Flame,
  Shuffle,
  Zap,
  Scale,
  SlidersHorizontal,
} from 'lucide-react';

interface StatsTableProps {
  game: GameType;
  stats: NumberStat[];
  starStats?: NumberStat[];
  selectedNumbers: number[];
  onToggleNumber: (num: number) => void;
  selectedStars: number[];
  onToggleStar: (star: number) => void;
  onSelectTopN: (count: number, specificNumbers?: number[]) => void;
  onSelectTopStars: (count: number) => void;
  onSelectTopDelay?: (count: number) => void;
  onSelectBalanced?: (count: number) => void;
  onSelectStreak?: (count: number) => void;
  onSelectTopStarsByCriterion?: (count: number, criterion: SelectionCriterion) => void;
  onClearSelection: () => void;
  onClearStars?: () => void;
  selectedDay?: string;
  onSelectDay?: (day: string) => void;
}

type SortMode = 'frequency' | 'delay_desc' | 'delay_asc' | 'streak' | 'number' | `day_${string}`;

export const StatsTable: React.FC<StatsTableProps> = ({
  game,
  stats,
  starStats,
  selectedNumbers,
  onToggleNumber,
  selectedStars,
  onToggleStar,
  onSelectTopN,
  onSelectTopStars,
  onSelectTopDelay,
  onSelectBalanced,
  onSelectStreak,
  onSelectTopStarsByCriterion,
  onClearSelection,
  onClearStars,
  selectedDay = 'all',
  onSelectDay,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'numbers' | 'stars'>('numbers');
  const [sortMode, setSortMode] = useState<SortMode>(() =>
    selectedDay && selectedDay !== 'all' ? (`day_${selectedDay}` as SortMode) : 'frequency'
  );
  const [starSelectCount, setStarSelectCount] = useState<number>(() =>
    selectedStars.length >= 2 && selectedStars.length <= 5 ? selectedStars.length : 5
  );

  // Synchronize internal sortMode with selectedDay prop if selectedDay changes externally
  useEffect(() => {
    if (selectedDay && selectedDay !== 'all') {
      setSortMode(`day_${selectedDay}` as SortMode);
    } else if (selectedDay === 'all' && sortMode.startsWith('day_')) {
      setSortMode('frequency');
    }
  }, [selectedDay]);

  const handleSelectDaySort = (day: string) => {
    const isCurrentlyActive = sortMode === `day_${day}`;
    if (isCurrentlyActive) {
      setSortMode('frequency');
      onSelectDay?.('all');
    } else {
      setSortMode(`day_${day}` as SortMode);
      onSelectDay?.(day);
    }
  };

  const handleFrequencySort = () => {
    setSortMode('frequency');
    onSelectDay?.('all');
  };

  const activeDayName = sortMode.startsWith('day_') ? sortMode.replace('day_', '') : null;

  const drawDays = GAME_DRAW_DAYS[game];
  const topTargetCount = game === 'euromillones' ? 10 : 12;

  // Sort numbers
  const sortedStats = useMemo(() => {
    const list = [...stats];
    if (sortMode.startsWith('day_')) {
      const targetDay = sortMode.replace('day_', '');
      return list.sort((a, b) => {
        const countA = a.byDay[targetDay] ?? 0;
        const countB = b.byDay[targetDay] ?? 0;
        if (countB !== countA) return countB - countA;
        if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
        return a.number - b.number;
      });
    }
    switch (sortMode) {
      case 'delay_desc':
        return list.sort((a, b) => (b.currentDelay ?? 0) - (a.currentDelay ?? 0) || a.number - b.number);
      case 'delay_asc':
        return list.sort((a, b) => (a.currentDelay ?? 0) - (b.currentDelay ?? 0) || a.number - b.number);
      case 'streak':
        return list.sort(
          (a, b) =>
            (b.streak ?? 0) - (a.streak ?? 0) ||
            (a.currentDelay ?? 0) - (b.currentDelay ?? 0) ||
            b.totalCount - a.totalCount ||
            a.number - b.number
        );
      case 'number':
        return list.sort((a, b) => a.number - b.number);
      case 'frequency':
      default:
        return list.sort((a, b) => b.totalCount - a.totalCount || a.number - b.number);
    }
  }, [stats, sortMode]);

  // Sort stars
  const sortedStarStats = useMemo(() => {
    const list = [...(starStats || [])];
    if (sortMode.startsWith('day_')) {
      const targetDay = sortMode.replace('day_', '');
      return list.sort((a, b) => {
        const countA = a.byDay[targetDay] ?? 0;
        const countB = b.byDay[targetDay] ?? 0;
        if (countB !== countA) return countB - countA;
        if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
        return a.number - b.number;
      });
    }
    switch (sortMode) {
      case 'delay_desc':
        return list.sort((a, b) => (b.currentDelay ?? 0) - (a.currentDelay ?? 0) || a.number - b.number);
      case 'delay_asc':
        return list.sort((a, b) => (a.currentDelay ?? 0) - (b.currentDelay ?? 0) || a.number - b.number);
      case 'streak':
        return list.sort(
          (a, b) =>
            (b.streak ?? 0) - (a.streak ?? 0) ||
            (a.currentDelay ?? 0) - (b.currentDelay ?? 0) ||
            b.totalCount - a.totalCount ||
            a.number - b.number
        );
      case 'number':
        return list.sort((a, b) => a.number - b.number);
      case 'frequency':
      default:
        return list.sort((a, b) => b.totalCount - a.totalCount || a.number - b.number);
    }
  }, [starStats, sortMode]);

  const displayedStats = showAll ? sortedStats : sortedStats.slice(0, topTargetCount);
  const maxFrequency = Math.max(...stats.map((s) => s.totalCount), 1);

  const isEuromillones = game === 'euromillones';

  // Selected numbers ordering mode: Defaults to 'frequency' (números que han salido más veces)
  const [selectedSortMode, setSelectedSortMode] = useState<'frequency' | 'table' | 'number'>('frequency');

  const statsByNumber = useMemo(() => {
    const map = new Map<number, NumberStat>();
    stats.forEach((s) => map.set(s.number, s));
    return map;
  }, [stats]);

  const starStatsByNumber = useMemo(() => {
    const map = new Map<number, NumberStat>();
    (starStats || []).forEach((s) => map.set(s.number, s));
    return map;
  }, [starStats]);

  const tableOrderMap = useMemo(() => {
    const map = new Map<number, number>();
    sortedStats.forEach((s, idx) => map.set(s.number, idx));
    return map;
  }, [sortedStats]);

  const tableStarOrderMap = useMemo(() => {
    const map = new Map<number, number>();
    sortedStarStats.forEach((s, idx) => map.set(s.number, idx));
    return map;
  }, [sortedStarStats]);

  // Sorted selected numbers: default by frequency (veces que han salido)
  const sortedSelectedNumbers = useMemo(() => {
    const copy = [...selectedNumbers];
    if (selectedSortMode === 'frequency') {
      return copy.sort((a, b) => {
        const countA = activeDayName
          ? (statsByNumber.get(a)?.byDay[activeDayName] ?? 0)
          : (statsByNumber.get(a)?.totalCount ?? 0);
        const countB = activeDayName
          ? (statsByNumber.get(b)?.byDay[activeDayName] ?? 0)
          : (statsByNumber.get(b)?.totalCount ?? 0);
        if (countB !== countA) return countB - countA;
        return a - b;
      });
    }
    if (selectedSortMode === 'table') {
      return copy.sort((a, b) => {
        const orderA = tableOrderMap.get(a) ?? 999;
        const orderB = tableOrderMap.get(b) ?? 999;
        return orderA - orderB;
      });
    }
    return copy.sort((a, b) => a - b);
  }, [selectedNumbers, statsByNumber, tableOrderMap, selectedSortMode, activeDayName]);

  // Sorted selected stars: default by frequency
  const sortedSelectedStars = useMemo(() => {
    const copy = [...selectedStars];
    if (selectedSortMode === 'frequency') {
      return copy.sort((a, b) => {
        const countA = activeDayName
          ? (starStatsByNumber.get(a)?.byDay[activeDayName] ?? 0)
          : (starStatsByNumber.get(a)?.totalCount ?? 0);
        const countB = activeDayName
          ? (starStatsByNumber.get(b)?.byDay[activeDayName] ?? 0)
          : (starStatsByNumber.get(b)?.totalCount ?? 0);
        if (countB !== countA) return countB - countA;
        return a - b;
      });
    }
    if (selectedSortMode === 'table') {
      return copy.sort((a, b) => {
        const orderA = tableStarOrderMap.get(a) ?? 999;
        const orderB = tableStarOrderMap.get(b) ?? 999;
        return orderA - orderB;
      });
    }
    return copy.sort((a, b) => a - b);
  }, [selectedStars, starStatsByNumber, tableStarOrderMap, selectedSortMode, activeDayName]);

  return (
    <div
      className={`bg-white rounded-2xl shadow-xs border transition-colors overflow-hidden ${
        game === 'primitiva'
          ? 'border-emerald-200/90'
          : game === 'bonoloto'
          ? 'border-blue-200/90'
          : 'border-amber-300/80'
      }`}
    >
      {/* Header & Quick Actions */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl border ${
                game === 'primitiva'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : game === 'bonoloto'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>
                  {isEuromillones
                    ? 'Estadísticas de Números y Estrellas Más Repetidos'
                    : `Top ${topTargetCount} Números Más Repetidos con Desglose por Días`}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    game === 'primitiva'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                      : game === 'bonoloto'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300/60'
                      : 'bg-amber-100 text-amber-900 border border-amber-300/70'
                  }`}
                >
                  {game === 'primitiva' ? 'Primitiva' : game === 'bonoloto' ? 'Bonoloto' : 'Euromillones'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {sortMode.startsWith('day_') ? (
                  <span className="font-semibold text-slate-800">
                    Orden activo: números más repetidos en sorteos del{' '}
                    <span className="underline decoration-2 underline-offset-2">{sortMode.replace('day_', '')}</span>{' '}
                    (con desglose real de todos los días)
                    <button
                      type="button"
                      onClick={() => setSortMode('frequency')}
                      className="ml-2 text-xs text-emerald-700 hover:text-emerald-900 underline font-normal cursor-pointer"
                    >
                      (Ver por Total Veces)
                    </button>
                  </span>
                ) : isEuromillones ? (
                  '10 números más repetidos y 5 estrellas más repetidas con desglose Martes y Viernes'
                ) : game === 'primitiva' ? (
                  'Desglose oficial por Lunes, Jueves y Sábado, y el Total de los 3 días'
                ) : (
                  'Desglose diario de Lunes a Domingo y el Total semanal'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isEuromillones && (
            <div className="inline-flex rounded-xl bg-slate-100 p-1 mr-1">
              <button
                onClick={() => setActiveTab('numbers')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'numbers'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Números (Top 10)
              </button>
              <button
                onClick={() => setActiveTab('stars')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'stars'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Estrellas (Top 5)
              </button>
            </div>
          )}

          {activeTab === 'numbers' ? (
            <>
              <button
                id="btn-select-top-exact"
                onClick={() => {
                  if (activeDayName) {
                    const topDayNums = sortedStats.slice(0, topTargetCount).map((s) => s.number);
                    onSelectTopN(topTargetCount, topDayNums);
                  } else {
                    onSelectTopN(topTargetCount);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 border ${
                  game === 'primitiva'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-500 shadow-emerald-900/10'
                    : game === 'bonoloto'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white border-blue-500 shadow-blue-900/10'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black border-amber-300 shadow-amber-900/10'
                }`}
                title={
                  activeDayName
                    ? `Selecciona los ${topTargetCount} números más repetidos en sorteos del ${activeDayName}`
                    : 'Selecciona los números que más veces han salido'
                }
              >
                <Flame className={`w-3.5 h-3.5 ${game === 'euromillones' ? 'text-slate-950' : 'text-white'}`} />
                <span>Top {topTargetCount} {activeDayName ? `de ${activeDayName}` : 'Frecuentes'}</span>
              </button>

              {onSelectTopDelay && (
                <button
                  id="btn-select-top-delay"
                  onClick={() => onSelectTopDelay(topTargetCount)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                  title="Selecciona los números que llevan más sorteos seguidos sin salir"
                >
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Top Atrasados</span>
                </button>
              )}

              {onSelectStreak && (
                <button
                  id="btn-select-streak"
                  onClick={() => onSelectStreak(topTargetCount)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border border-yellow-300"
                  title="Selecciona los números en racha que han salido más recientemente"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-600" />
                  <span>En Racha</span>
                </button>
              )}

              {onSelectBalanced && (
                <button
                  id="btn-select-balanced"
                  onClick={() => onSelectBalanced(topTargetCount)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200"
                  title="Selecciona combinación equilibrada: 50% números frecuentes + 50% números con atraso"
                >
                  <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mixto 50/50</span>
                </button>
              )}

              <button
                id="btn-clear-selection"
                onClick={onClearSelection}
                className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
              >
                Limpiar
              </button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Star count selector */}
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-amber-950">Elegir:</span>
                {[2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    id={`btn-star-count-${cnt}`}
                    type="button"
                    onClick={() => {
                      setStarSelectCount(cnt);
                      if (onSelectTopStarsByCriterion) {
                        onSelectTopStarsByCriterion(cnt, 'frequency');
                      } else {
                        onSelectTopStars(cnt);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                      starSelectCount === cnt
                        ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                        : 'text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {cnt} ★
                  </button>
                ))}
              </div>

              {/* Frecuentes */}
              <button
                id="btn-select-stars-freq"
                type="button"
                onClick={() => {
                  if (onSelectTopStarsByCriterion) {
                    onSelectTopStarsByCriterion(starSelectCount, 'frequency');
                  } else {
                    onSelectTopStars(starSelectCount);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition border border-amber-300 shadow-xs active:scale-95 cursor-pointer"
                title={
                  activeDayName
                    ? `Selecciona las ${starSelectCount} estrellas más repetidas en sorteos del ${activeDayName}`
                    : 'Selecciona las estrellas más frecuentes'
                }
              >
                <Flame className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Top {starSelectCount} {activeDayName ? `de ${activeDayName}` : 'Frecuentes'}</span>
              </button>

              {/* Mayor Atraso */}
              {onSelectTopStarsByCriterion && (
                <button
                  id="btn-select-stars-delay"
                  type="button"
                  onClick={() => onSelectTopStarsByCriterion(starSelectCount, 'delay_desc')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition border border-rose-200 shadow-xs active:scale-95 cursor-pointer"
                  title="Selecciona las estrellas con mayor atraso"
                >
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Atrasadas</span>
                </button>
              )}

              {/* En Racha */}
              {onSelectTopStarsByCriterion && (
                <button
                  id="btn-select-stars-streak"
                  type="button"
                  onClick={() => onSelectTopStarsByCriterion(starSelectCount, 'streak')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-yellow-900 text-xs font-bold transition border border-yellow-300 shadow-xs active:scale-95 cursor-pointer"
                  title="Selecciona las estrellas más calientes o en racha"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-600" />
                  <span>En Racha</span>
                </button>
              )}

              {/* Mixto 50/50 */}
              {onSelectTopStarsByCriterion && (
                <button
                  id="btn-select-stars-balanced"
                  type="button"
                  onClick={() => onSelectTopStarsByCriterion(starSelectCount, 'balanced')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition border border-indigo-200 shadow-xs active:scale-95 cursor-pointer"
                  title="Selecciona 50% estrellas frecuentes + 50% atrasadas"
                >
                  <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mixto 50/50</span>
                </button>
              )}

              {/* Limpiar Estrellas */}
              <button
                id="btn-clear-stars"
                type="button"
                onClick={() => (onClearStars ? onClearStars() : onClearSelection())}
                className="px-2 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
              >
                Limpiar Estrellas
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <span>{showAll ? `Ver solo Top ${topTargetCount}` : 'Ver todos'}</span>
          </button>
        </div>
      </div>

      {/* Sorting bar */}
      <div className="bg-slate-100/70 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-600">Ordenar tabla por:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleFrequencySort}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                sortMode === 'frequency'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-300 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Más Frecuentes
            </button>
            <button
              type="button"
              onClick={() => setSortMode('delay_desc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                sortMode === 'delay_desc'
                  ? 'bg-rose-600 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Mayor Atraso</span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode('delay_asc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                sortMode === 'delay_asc'
                  ? 'bg-emerald-600 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>En Racha / Recientes</span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode('streak')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                sortMode === 'streak'
                  ? 'bg-yellow-400 text-slate-950 font-black shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-3 h-3 text-yellow-600" />
              <span>En Racha (Calientes)</span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode('number')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                sortMode === 'number'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-300 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Número ({game === 'euromillones' ? (activeTab === 'stars' ? '1-12' : '1-50') : '1-49'})
            </button>

            {/* Sort by day buttons */}
            <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Por día:</span>
            {drawDays.map((day) => {
              const isDayActive = sortMode === `day_${day}`;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDaySort(day)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    isDayActive
                      ? game === 'primitiva'
                        ? 'bg-emerald-600 text-white shadow-2xs font-black'
                        : game === 'bonoloto'
                        ? 'bg-blue-600 text-white shadow-2xs font-black'
                        : 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={`Ordenar tabla por apariciones en sorteos del ${day}`}
                >
                  <span>{day}</span>
                  {isDayActive && <span>▼</span>}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline">
          {sortMode === 'delay_desc'
            ? 'Mostrando primero los que llevan más tiempo sin salir'
            : sortMode === 'delay_asc'
            ? 'Mostrando primero los que han salido en los sorteos más recientes'
            : sortMode === 'streak'
            ? 'Mostrando primero los que están en mayor racha consecutiva'
            : sortMode === 'number'
            ? 'Ordenados correlativamente por número'
            : sortMode.startsWith('day_')
            ? `Mostrando primero los más frecuentes en sorteos del ${sortMode.replace('day_', '')} (con desglose completo)`
            : 'Mostrando primero los de mayor número de apariciones totales'}
        </span>
      </div>

      {/* Selected Numbers Chip Summary Bar */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800">
              Tus Números Seleccionados ({selectedNumbers.length}
              {game === 'euromillones' ? ' de 5-10' : ' de 6-12'}):
            </span>

            {/* Quick selector for order of selected numbers */}
            {selectedNumbers.length > 1 && (
              <div className="inline-flex items-center rounded-lg bg-slate-200/80 p-0.5 text-[10px] font-semibold text-slate-600">
                <button
                  type="button"
                  id="btn-sort-selected-freq"
                  onClick={() => setSelectedSortMode('frequency')}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    selectedSortMode === 'frequency'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'hover:text-slate-900'
                  }`}
                  title="Ordenar tus números seleccionados de mayor a menor número de apariciones en los sorteos"
                >
                  <span>🔥 Más frecuentes {selectedSortMode === 'frequency' && '✓'}</span>
                </button>
                <button
                  type="button"
                  id="btn-sort-selected-num"
                  onClick={() => setSelectedSortMode('number')}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    selectedSortMode === 'number'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'hover:text-slate-900'
                  }`}
                  title="Ordenar tus números seleccionados correlativamente de menor a mayor (1-49)"
                >
                  <span>🔢 Numérico {selectedSortMode === 'number' && '✓'}</span>
                </button>
                <button
                  type="button"
                  id="btn-sort-selected-table"
                  onClick={() => setSelectedSortMode('table')}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    selectedSortMode === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'hover:text-slate-900'
                  }`}
                  title="Ordenar tus números seleccionados según el criterio activo de la tabla"
                >
                  <span>📊 Según tabla {selectedSortMode === 'table' && '✓'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {selectedNumbers.length === 0 ? (
              <span className="text-slate-400 italic">Ningún número elegido aún</span>
            ) : (
              sortedSelectedNumbers.map((num) => {
                const stat = statsByNumber.get(num);
                const dayCount = activeDayName ? stat?.byDay[activeDayName] ?? 0 : undefined;
                const totalCount = stat?.totalCount;
                const displayCount = activeDayName ? dayCount : totalCount;

                return (
                  <span
                    key={num}
                    onClick={() => onToggleNumber(num)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold cursor-pointer transition shadow-xs group ${
                      game === 'primitiva'
                        ? 'bg-emerald-600 text-white hover:bg-rose-600'
                        : game === 'bonoloto'
                        ? 'bg-blue-600 text-white hover:bg-rose-600'
                        : 'bg-amber-400 text-slate-950 font-black border border-amber-300 hover:bg-rose-500 hover:text-white'
                    }`}
                    title={`Número ${num}: ${
                      activeDayName
                        ? `Ha salido ${dayCount ?? 0} veces en sorteos del ${activeDayName} (${totalCount ?? 0} veces en total)`
                        : `Ha salido ${totalCount ?? 0} veces en los sorteos históricos`
                    }${stat?.percentage ? ` (${stat.percentage}%)` : ''}${
                      stat?.currentDelay !== undefined ? ` • Atraso actual: ${stat.currentDelay} sorteos` : ''
                    }. Click para quitar`}
                  >
                    <span>{num}</span>
                    {displayCount !== undefined && displayCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          game === 'euromillones'
                            ? 'bg-amber-500/40 text-slate-950 font-bold'
                            : 'bg-black/20 text-white font-medium'
                        }`}
                        title={
                          activeDayName
                            ? `${displayCount} veces en sorteos del ${activeDayName}`
                            : `Apariciones históricas: ${displayCount} veces`
                        }
                      >
                        {displayCount}v{activeDayName ? ` (${activeDayName.slice(0, 1)})` : ''}
                      </span>
                    )}
                    <span className="text-[10px] opacity-70 group-hover:opacity-100">&times;</span>
                  </span>
                );
              })
            )}
          </div>
        </div>

        {isEuromillones && (
          <div className="flex flex-wrap items-center gap-1.5 border-t md:border-t-0 pt-1.5 md:pt-0 border-slate-200">
            <span className="font-bold text-slate-700">Estrellas ({selectedStars.length}):</span>
            {selectedStars.length === 0 ? (
              <span className="text-slate-400 italic">Ninguna</span>
            ) : (
              sortedSelectedStars.map((star) => {
                const starStat = starStatsByNumber.get(star);
                const dayCount = activeDayName ? starStat?.byDay[activeDayName] ?? 0 : undefined;
                const totalCount = starStat?.totalCount;
                const displayCount = activeDayName ? dayCount : totalCount;

                return (
                  <span
                    key={star}
                    onClick={() => onToggleStar(star)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black cursor-pointer hover:bg-rose-500 hover:text-white transition shadow-xs group border border-amber-300"
                    title={`Estrella ${star}: ${
                      activeDayName
                        ? `Ha salido ${dayCount ?? 0} veces en sorteos del ${activeDayName} (${totalCount ?? 0} en total)`
                        : `Ha salido ${totalCount ?? 0} veces en total`
                    }. Click para quitar`}
                  >
                    <span>★ {star}</span>
                    {displayCount !== undefined && displayCount > 0 && (
                      <span className="text-[10px] px-1 py-0.2 rounded-full bg-amber-500/40 font-bold text-slate-950">
                        {displayCount}v{activeDayName ? ` (${activeDayName.slice(0, 1)})` : ''}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-800 group-hover:text-white">&times;</span>
                  </span>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Main Table View */}
      {activeTab === 'numbers' ? (
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[760px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <th className="py-3 px-3 w-12 min-w-[48px] max-w-[48px] text-center sticky left-0 z-30 bg-slate-100 shadow-[1px_0_0_0_#e2e8f0]">Sel.</th>
                <th className="py-3 px-3 w-12 min-w-[48px] max-w-[48px] text-center sticky left-12 z-30 bg-slate-100 shadow-[1px_0_0_0_#e2e8f0]">Rank</th>
                <th
                  onClick={() => setSortMode('number')}
                  title="Click para ordenar correlativamente por número (1-49)"
                  className="py-3 px-3 min-w-[110px] cursor-pointer hover:text-slate-950 transition select-none sticky left-24 z-30 bg-slate-100 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.12)] border-r border-slate-300/80"
                >
                  <div className="flex items-center gap-1 select-none pointer-events-none">
                    <span>Número</span>
                    {sortMode === 'number' && <span className="text-[10px]">▼</span>}
                  </div>
                </th>
                <th
                  onClick={handleFrequencySort}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Click para ordenar por Total Veces (todos los días)"
                  className={`py-3 px-3 text-center border-x font-bold transition cursor-pointer select-none ${
                    sortMode === 'frequency'
                      ? game === 'primitiva'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : game === 'bonoloto'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-200/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 select-none pointer-events-none">
                    <span>Total Veces</span>
                    {sortMode === 'frequency' && <span className="text-[10px]">▼</span>}
                  </div>
                </th>
                {drawDays.map((day) => {
                  const isDayActive = sortMode === `day_${day}`;
                  return (
                    <th
                      key={day}
                      onClick={() => handleSelectDaySort(day)}
                      onMouseDown={(e) => e.preventDefault()}
                      title={`Click para ordenar por apariciones de los sorteos del ${day} (conservando todos los datos)`}
                      className={`py-3 px-2 text-center font-semibold transition cursor-pointer select-none ${
                        isDayActive
                          ? game === 'primitiva'
                            ? 'bg-emerald-600 text-white font-black shadow-xs'
                            : game === 'bonoloto'
                            ? 'bg-blue-600 text-white font-black shadow-xs'
                            : 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/70 border-r border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 select-none pointer-events-none">
                        <span>{day}</span>
                        {isDayActive && <span className="text-[10px]">▼</span>}
                      </div>
                    </th>
                  );
                })}
                <th
                  onClick={() => setSortMode(sortMode === 'delay_desc' ? 'delay_asc' : 'delay_desc')}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Click para ordenar por Atraso (sorteos sin salir)"
                  className={`py-3 px-3 text-center transition cursor-pointer select-none ${
                    sortMode === 'delay_desc' || sortMode === 'delay_asc'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 select-none pointer-events-none">
                    <Clock
                      className={`w-3.5 h-3.5 ${
                        sortMode === 'delay_desc' || sortMode === 'delay_asc' ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span>Atraso</span>
                    {sortMode === 'delay_desc' && <span className="text-[10px]">▼</span>}
                    {sortMode === 'delay_asc' && <span className="text-[10px]">▲</span>}
                  </div>
                </th>
                <th className="py-3 px-3 text-right hidden sm:table-cell">Último Sorteo</th>
                <th className="py-3 px-3 w-28 hidden md:table-cell">Frecuencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStats.map((stat, idx) => {
                const isSelected = selectedNumbers.includes(stat.number);
                const isTopTarget = idx < topTargetCount;
                const rowBgColor = isSelected
                  ? game === 'primitiva'
                    ? 'bg-emerald-50'
                    : game === 'bonoloto'
                    ? 'bg-blue-50'
                    : 'bg-amber-50'
                  : 'bg-white';

                return (
                  <tr
                    key={stat.number}
                    id={`stat-row-${stat.number}`}
                    onClick={() => onToggleNumber(stat.number)}
                    className={`group cursor-pointer transition-colors ${
                      isSelected
                        ? game === 'primitiva'
                          ? 'bg-emerald-50/80 font-medium'
                          : game === 'bonoloto'
                          ? 'bg-blue-50/80 font-medium'
                          : 'bg-amber-50/80 font-medium'
                        : isTopTarget
                        ? 'hover:bg-slate-50/90'
                        : 'hover:bg-slate-50/70 text-slate-600'
                    }`}
                  >
                    {/* Checkbox (Sticky Left) */}
                    <td
                      className={`py-2.5 px-3 w-12 min-w-[48px] max-w-[48px] text-center sticky left-0 z-20 ${rowBgColor} group-hover:bg-slate-50 shadow-[1px_0_0_0_#e2e8f0] transition-colors`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleNumber(stat.number)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                          isSelected
                            ? game === 'primitiva'
                              ? 'bg-emerald-600 text-white border border-emerald-500 shadow-xs'
                              : game === 'bonoloto'
                              ? 'bg-blue-600 text-white border border-blue-500 shadow-xs'
                              : 'bg-amber-400 text-slate-950 border border-amber-400 font-black shadow-xs'
                            : 'border border-slate-300 hover:border-slate-400 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </td>

                    {/* Rank (Sticky Left) */}
                    <td
                      className={`py-2.5 px-3 w-12 min-w-[48px] max-w-[48px] text-center font-mono font-bold sticky left-12 z-20 ${rowBgColor} group-hover:bg-slate-50 shadow-[1px_0_0_0_#e2e8f0] transition-colors`}
                    >
                      {idx === 0 ? (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs shadow-xs border ${
                            game === 'primitiva'
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-300'
                              : game === 'bonoloto'
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-blue-300'
                              : 'bg-gradient-to-br from-amber-400 to-yellow-400 text-slate-950 border-amber-300'
                          }`}
                        >
                          1
                        </span>
                      ) : idx === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-900 font-bold text-xs border border-slate-300">
                          2
                        </span>
                      ) : idx === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-800 text-amber-100 font-bold text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">#{idx + 1}</span>
                      )}
                    </td>

                    {/* Ball & Number (Sticky Left) */}
                    <td
                      className={`py-2.5 px-3 min-w-[110px] sticky left-24 z-20 ${rowBgColor} group-hover:bg-slate-50 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.12)] border-r border-slate-300/80 transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shadow-xs border transition-all ${
                            isSelected
                              ? game === 'primitiva'
                                ? 'bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 text-white border-emerald-300 ring-2 ring-emerald-400/50 scale-105 shadow-md'
                                : game === 'bonoloto'
                                ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 text-white border-blue-300 ring-2 ring-blue-400/50 scale-105 shadow-md'
                                : 'bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black border-amber-200 ring-2 ring-amber-400/60 scale-105 shadow-md'
                              : isTopTarget
                              ? game === 'primitiva'
                                ? 'bg-white text-emerald-950 border-emerald-300/80 font-black shadow-2xs'
                                : game === 'bonoloto'
                                ? 'bg-white text-blue-950 border-blue-300/80 font-black shadow-2xs'
                                : 'bg-white text-amber-950 border-amber-300/80 font-black shadow-2xs'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {stat.number}
                        </div>
                        {isTopTarget && (
                          <span
                            className={`hidden sm:inline-block px-1.5 py-0.5 rounded-sm text-[10px] font-bold border ${
                              game === 'primitiva'
                                ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300/50'
                                : game === 'bonoloto'
                                ? 'bg-blue-100/90 text-blue-900 border-blue-300/50'
                                : 'bg-amber-100/90 text-amber-900 border-amber-300/50'
                            }`}
                          >
                            TOP {topTargetCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Appearances */}
                    <td
                      className={`py-2.5 px-3 text-center font-mono font-black text-sm sm:text-base border-x ${
                        game === 'primitiva'
                          ? 'bg-emerald-50/50 text-emerald-950 border-emerald-200/50'
                          : game === 'bonoloto'
                          ? 'bg-blue-50/50 text-blue-950 border-blue-200/50'
                          : 'bg-amber-50/50 text-amber-950 border-amber-200/50'
                      }`}
                    >
                      {stat.totalCount}
                      <span
                        className={`text-[10px] block font-normal ${
                          game === 'primitiva'
                            ? 'text-emerald-700'
                            : game === 'bonoloto'
                            ? 'text-blue-700'
                            : 'text-amber-800'
                        }`}
                      >
                        ({stat.percentage}%)
                      </span>
                    </td>

                    {/* Day-by-day Breakdown */}
                    {drawDays.map((day) => {
                      const count = stat.byDay[day] || 0;
                      const isDaySorted = sortMode === `day_${day}`;
                      return (
                        <td
                          key={day}
                          className={`py-2.5 px-2 text-center font-mono transition-colors ${
                            isDaySorted
                              ? game === 'primitiva'
                                ? 'bg-emerald-50 font-bold text-emerald-950 border-x border-emerald-200/80'
                                : game === 'bonoloto'
                                ? 'bg-blue-50 font-bold text-blue-950 border-x border-blue-200/80'
                                : 'bg-amber-50 font-bold text-amber-950 border-x border-amber-200/80'
                              : ''
                          }`}
                        >
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                              isDaySorted
                                ? game === 'primitiva'
                                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                                  : game === 'bonoloto'
                                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                  : 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                                : count > 0
                                ? 'bg-slate-100 text-slate-800'
                                : 'text-slate-300'
                            }`}
                          >
                            {count}
                          </span>
                        </td>
                      );
                    })}

                    {/* Current delay */}
                    <td className="py-2.5 px-3 text-center font-mono">
                      {stat.currentDelay === undefined ? (
                        <span className="text-slate-400 text-xs">-</span>
                      ) : stat.currentDelay === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <Flame className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                          <span>{stat.streak && stat.streak > 1 ? `Racha x${stat.streak}` : '¡Último!'}</span>
                        </span>
                      ) : stat.currentDelay >= 12 ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs"
                          title={`Lleva ${stat.currentDelay} sorteos sin salir (Máx histórico: ${stat.maxDelay ?? '-'} sorteos)`}
                        >
                          <Clock className="w-3 h-3 text-rose-600" />
                          <span>{stat.currentDelay} sort.</span>
                        </span>
                      ) : stat.currentDelay >= 6 ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200"
                          title={`Lleva ${stat.currentDelay} sorteos sin salir`}
                        >
                          <span>{stat.currentDelay} sort.</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs font-semibold">
                          {stat.currentDelay} <span className="text-[10px] text-slate-400 font-normal">sort.</span>
                        </span>
                      )}
                    </td>

                    {/* Last drawn */}
                    <td className="py-2.5 px-3 text-right text-xs text-slate-500 font-mono hidden sm:table-cell">
                      {stat.lastDrawnDate
                        ? new Date(stat.lastDrawnDate + 'T00:00:00').toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>

                    {/* Frequency progress bar */}
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            game === 'primitiva'
                              ? 'bg-emerald-600'
                              : game === 'bonoloto'
                              ? 'bg-blue-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${(stat.totalCount / maxFrequency) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Stars Table (for Euromillones) */
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[700px]">
            <thead>
              <tr className="bg-amber-50 text-amber-950 uppercase text-[11px] font-bold tracking-wider border-b border-amber-200">
                <th className="py-3 px-3 w-12 min-w-[48px] max-w-[48px] text-center sticky left-0 z-30 bg-amber-50 shadow-[1px_0_0_0_#fde68a]">Sel.</th>
                <th className="py-3 px-3 w-12 min-w-[48px] max-w-[48px] text-center sticky left-12 z-30 bg-amber-50 shadow-[1px_0_0_0_#fde68a]">Rank</th>
                <th
                  onClick={() => setSortMode('number')}
                  title="Click para ordenar correlativamente por estrella (1-12)"
                  className="py-3 px-3 min-w-[110px] cursor-pointer hover:text-amber-900 transition select-none sticky left-24 z-30 bg-amber-50 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.12)] border-r border-amber-300"
                >
                  <div className="flex items-center gap-1 select-none pointer-events-none">
                    <span>Estrella</span>
                    {sortMode === 'number' && <span className="text-[10px]">▼</span>}
                  </div>
                </th>
                <th
                  onClick={handleFrequencySort}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Click para ordenar por Total Veces (todos los días)"
                  className={`py-3 px-3 text-center border-x font-black transition cursor-pointer select-none ${
                    sortMode === 'frequency'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 select-none pointer-events-none">
                    <span>Total Veces</span>
                    {sortMode === 'frequency' && <span className="text-[10px]">▼</span>}
                  </div>
                </th>
                {drawDays.map((day) => {
                  const isDayActive = sortMode === `day_${day}`;
                  return (
                    <th
                      key={day}
                      onClick={() => handleSelectDaySort(day)}
                      onMouseDown={(e) => e.preventDefault()}
                      title={`Click para ordenar por apariciones de los sorteos del ${day}`}
                      className={`py-3 px-2 text-center font-semibold transition cursor-pointer select-none ${
                        isDayActive
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'text-amber-900 hover:bg-amber-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 select-none pointer-events-none">
                        <span>{day}</span>
                        {isDayActive && <span className="text-[10px]">▼</span>}
                      </div>
                    </th>
                  );
                })}
                <th
                  onClick={() => setSortMode(sortMode === 'delay_desc' ? 'delay_asc' : 'delay_desc')}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Click para ordenar por Atraso"
                  className={`py-3 px-3 text-center transition cursor-pointer select-none ${
                    sortMode === 'delay_desc' || sortMode === 'delay_asc'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'hover:bg-amber-100/80 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 select-none pointer-events-none">
                    <Clock className="w-3.5 h-3.5 text-amber-900/60" />
                    <span>Atraso</span>
                    {sortMode === 'delay_desc' && <span className="text-[10px]">▼</span>}
                    {sortMode === 'delay_asc' && <span className="text-[10px]">▲</span>}
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Último Sorteo</th>
                <th className="py-3 px-3 w-28 hidden md:table-cell">Frecuencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(sortedStarStats || []).map((stat, idx) => {
                const isSelected = selectedStars.includes(stat.number);
                const isTop5 = idx < 5;
                const starRowBg = isSelected ? 'bg-amber-100/90' : 'bg-white';

                return (
                  <tr
                    key={stat.number}
                    id={`stat-star-row-${stat.number}`}
                    onClick={() => onToggleStar(stat.number)}
                    className={`group cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-100/70 font-medium'
                        : isTop5
                        ? 'hover:bg-amber-50/50'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <td
                      className={`py-2.5 px-3 w-12 min-w-[48px] max-w-[48px] text-center sticky left-0 z-20 ${starRowBg} group-hover:bg-amber-50/60 shadow-[1px_0_0_0_#fde68a] transition-colors`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleStar(stat.number)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'border border-slate-300 hover:border-slate-400 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </td>

                    <td
                      className={`py-2.5 px-3 w-12 min-w-[48px] max-w-[48px] text-center font-mono font-bold sticky left-12 z-20 ${starRowBg} group-hover:bg-amber-50/60 shadow-[1px_0_0_0_#fde68a] transition-colors`}
                    >
                      <span className="text-slate-500 text-xs">#{idx + 1}</span>
                    </td>

                    <td
                      className={`py-2.5 px-3 min-w-[110px] sticky left-24 z-20 ${starRowBg} group-hover:bg-amber-50/60 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.12)] border-r border-amber-300 transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shadow-xs border transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300 scale-105'
                              : isTop5
                              ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          ★ {stat.number}
                        </div>
                        {isTop5 && (
                          <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-amber-200 text-amber-900">
                            TOP 5
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono font-black text-sm sm:text-base text-amber-950 bg-amber-50 border-x border-amber-200">
                      {stat.totalCount}
                      <span className="text-[10px] text-amber-700 block font-normal">
                        ({stat.percentage}%)
                      </span>
                    </td>

                    {drawDays.map((day) => {
                      const count = stat.byDay[day] || 0;
                      const isDaySorted = sortMode === `day_${day}`;
                      return (
                        <td
                          key={day}
                          className={`py-2.5 px-2 text-center font-mono transition-colors ${
                            isDaySorted ? 'bg-amber-50 font-bold border-x border-amber-200' : ''
                          }`}
                        >
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                              isDaySorted
                                ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {count}
                          </span>
                        </td>
                      );
                    })}

                    {/* Current delay for stars */}
                    <td className="py-2.5 px-3 text-center font-mono">
                      {stat.currentDelay === undefined ? (
                        <span className="text-slate-400 text-xs">-</span>
                      ) : stat.currentDelay === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-300">
                          <Flame className="w-3 h-3 text-amber-700 fill-amber-700" />
                          <span>¡Último!</span>
                        </span>
                      ) : stat.currentDelay >= 8 ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300"
                          title={`Lleva ${stat.currentDelay} sorteos sin salir`}
                        >
                          <Clock className="w-3 h-3 text-rose-600" />
                          <span>{stat.currentDelay} sort.</span>
                        </span>
                      ) : (
                        <span className="text-slate-700 text-xs font-semibold">
                          {stat.currentDelay} <span className="text-[10px] text-slate-400 font-normal">sort.</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right text-xs text-slate-500 font-mono">
                      {stat.lastDrawnDate
                        ? new Date(stat.lastDrawnDate + 'T00:00:00').toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>

                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{ width: `${(stat.totalCount / (maxFrequency || 1)) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
