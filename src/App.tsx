/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GameType, LotteryDraw, PeriodFilterState, ReductionGuarantee, ReductionResult } from './types';
import { getStoredDraws, saveStoredDraws, resetStoredDraws } from './data/historicalDraws';
import {
  countMissingDraws,
  synchronizeDatabase,
  getAutoSyncPreference,
  setAutoSyncPreference,
  exportDatabaseToJson,
} from './utils/syncDatabase';
import { calculateLotteryStats, filterDraws, getPresetDates, DEFAULT_PRICES } from './utils/lotteryStats';
import { generateReducedColumns } from './utils/reductions';
import { Header } from './components/Header';
import { PeriodFilter } from './components/PeriodFilter';
import { StatsTable } from './components/StatsTable';
import { ReductionSelector } from './components/ReductionSelector';
import { ColumnsViewer } from './components/ColumnsViewer';
import { PrintSlip } from './components/PrintSlip';
import { DrawsHistoryModal } from './components/DrawsHistoryModal';
import { SavedCombinationsModal } from './components/SavedCombinationsModal';
import { UserManualModal } from './components/UserManualModal';
import { PrintManual } from './components/PrintManual';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { useAppUpdate } from './hooks/useAppUpdate';
import { getSavedCombinations } from './utils/savedCombinations';
import { SavedCombination } from './types';
import { Sparkles, Info, HelpCircle, ArrowDown, CheckCircle2, RefreshCw, X, AlertTriangle, FolderHeart } from 'lucide-react';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameType>('primitiva');
  const [allDraws, setAllDraws] = useState<LotteryDraw[]>(() => getStoredDraws());
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSavedCombinationsModalOpen, setIsSavedCombinationsModalOpen] = useState(false);
  const [savedCombinationsCount, setSavedCombinationsCount] = useState(() => getSavedCombinations().length);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'slip' | 'manual'>('slip');

  // Application auto-update and GitHub synchronization hook
  const {
    hasUpdate: hasAppUpdate,
    isChecking: isCheckingAppUpdate,
    checkForUpdates,
    applyUpdate,
    dismissNotification: dismissUpdateNotification,
  } = useAppUpdate();

  const handleCheckForUpdates = async () => {
    const res = await checkForUpdates(true);
    if (!res.hasUpdate) {
      setSyncToast({
        show: true,
        title: 'Aplicación al día',
        message: 'No hay actualizaciones pendientes.',
        type: 'info',
      });
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => getAutoSyncPreference());
  const [syncToast, setSyncToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Period filter state (default to 6 months)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterState>(() => {
    const dates = getPresetDates('6m');
    return {
      preset: '6m',
      startDate: dates.startDate,
      endDate: dates.endDate,
    };
  });

  // Price per bet (user configurable per game)
  const [gamePrices, setGamePrices] = useState<Record<GameType, number>>({
    primitiva: DEFAULT_PRICES.primitiva,
    bonoloto: DEFAULT_PRICES.bonoloto,
    euromillones: DEFAULT_PRICES.euromillones,
  });

  // Selection state
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [guarantee, setGuarantee] = useState<ReductionGuarantee>('guarantee_5');

  // Reduction result state
  const [reductionResult, setReductionResult] = useState<ReductionResult | null>(null);

  const columnsRef = useRef<HTMLDivElement>(null);

  // Missing draws count across all games
  const missingInfo = useMemo(() => {
    return countMissingDraws(allDraws);
  }, [allDraws]);

  // Handle manual or automatic database synchronization
  const handleSyncDatabase = (isAuto = false) => {
    if (isSyncing) return;
    setIsSyncing(true);

    setTimeout(() => {
      try {
        const result = synchronizeDatabase(allDraws);
        setAllDraws(result.updatedDraws);
        saveStoredDraws(result.updatedDraws);
        setIsSyncing(false);

        if (result.removedFutureCount > 0) {
          setSyncToast({
            show: true,
            title: 'Sorteos futuros corregidos',
            message: `Se han corregido ${result.removedFutureCount} sorteo(s) con fecha no celebrada o futura. La base de datos ahora contiene exclusivamente sorteos oficiales celebrados.`,
            type: 'success',
          });
        } else if (result.addedCount > 0) {
          setSyncToast({
            show: true,
            title: isAuto ? 'Sincronización oficial completada' : '¡Base de datos actualizada!',
            message: `Se han incorporado ${result.addedCount} sorteos oficiales verificados (Primitiva: +${result.addedByGame.primitiva}, Bonoloto: +${result.addedByGame.bonoloto}, Euromillones: +${result.addedByGame.euromillones}).`,
            type: 'success',
          });
        } else {
          if (!isAuto) {
            setSyncToast({
              show: true,
              title: 'Base de datos al día',
              message: 'Tu base de datos ya contiene todos los sorteos oficiales celebrados de Loterías y Apuestas del Estado. Los sorteos de hoy se celebran por la noche (21:30h/21:40h).',
              type: 'info',
            });
          }
        }
      } catch (err) {
        console.error('Error during database sync', err);
        setIsSyncing(false);
        setSyncToast({
          show: true,
          title: 'Error de actualización',
          message: 'No se pudo sincronizar la base de datos local. Por favor inténtalo de nuevo.',
          type: 'error',
        });
      }
    }, 400);
  };

  // Auto-sync on startup if enabled and missing draws are detected
  useEffect(() => {
    if (autoSyncEnabled) {
      const pending = countMissingDraws(allDraws);
      if (pending.totalMissing > 0) {
        handleSyncDatabase(true);
      }
    }
  }, []);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (syncToast?.show) {
      const timer = setTimeout(() => {
        setSyncToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [syncToast]);

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    setAutoSyncPreference(enabled);
  };

  const handleExportDatabase = () => {
    exportDatabaseToJson(allDraws);
  };

  const handleImportDatabase = (importedDraws: LotteryDraw[]) => {
    setAllDraws(importedDraws);
    saveStoredDraws(importedDraws);
    setSyncToast({
      show: true,
      title: 'Importación exitosa',
      message: `Se han restaurado e importado ${importedDraws.length} sorteos a la memoria local.`,
      type: 'success',
    });
  };

  // Save draws to localStorage whenever they change
  useEffect(() => {
    saveStoredDraws(allDraws);
  }, [allDraws]);

  // Filter draws for active game and date range and optional day of week
  const filteredDraws = useMemo(() => {
    return filterDraws(
      allDraws,
      activeGame,
      periodFilter.startDate,
      periodFilter.endDate,
      periodFilter.selectedDay
    );
  }, [allDraws, activeGame, periodFilter.startDate, periodFilter.endDate, periodFilter.selectedDay]);

  const totalGameDraws = useMemo(() => {
    return allDraws.filter((d) => d.game === activeGame).length;
  }, [allDraws, activeGame]);

  // Calculate statistics for numbers
  const numberStats = useMemo(() => {
    return calculateLotteryStats(filteredDraws, activeGame, false);
  }, [filteredDraws, activeGame]);

  // Calculate statistics for stars (Euromillones only)
  const starStats = useMemo(() => {
    if (activeGame !== 'euromillones') return [];
    return calculateLotteryStats(filteredDraws, activeGame, true);
  }, [filteredDraws, activeGame]);

  // Automatically initialize selected numbers with Top N on game change or stats update
  useEffect(() => {
    const targetCount = activeGame === 'euromillones' ? 10 : 12;
    const topNums = numberStats.slice(0, targetCount).map((s) => s.number);
    setSelectedNumbers(topNums);

    if (activeGame === 'euromillones') {
      const topStars = starStats.slice(0, 5).map((s) => s.number);
      setSelectedStars(topStars);
    } else {
      setSelectedStars([]);
    }

    // Auto-generate initial reduction
    const currentPrice = gamePrices[activeGame];
    const initialResult = generateReducedColumns(
      topNums,
      activeGame,
      guarantee,
      activeGame === 'euromillones' ? starStats.slice(0, 5).map((s) => s.number) : [],
      currentPrice
    );
    setReductionResult(initialResult);
  }, [activeGame, numberStats, starStats]);

  // Handlers for toggling numbers
  const handleToggleNumber = (num: number) => {
    const maxPicks = activeGame === 'euromillones' ? 10 : 12;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length < maxPicks) {
        setSelectedNumbers([...selectedNumbers, num]);
      }
    }
  };

  const handleToggleStar = (star: number) => {
    if (selectedStars.includes(star)) {
      setSelectedStars(selectedStars.filter((s) => s !== star));
    } else {
      if (selectedStars.length < 5) {
        setSelectedStars([...selectedStars, star]);
      }
    }
  };

  const handleSelectTopN = (count: number) => {
    const top = numberStats.slice(0, count).map((s) => s.number);
    setSelectedNumbers(top);
  };

  const handleSelectTopStars = (count: number) => {
    const top = starStats.slice(0, count).map((s) => s.number);
    setSelectedStars(top);
  };

  const handleClearSelection = () => {
    setSelectedNumbers([]);
    if (activeGame === 'euromillones') {
      setSelectedStars([]);
    }
  };

  const handleSelectGame = (game: GameType) => {
    setActiveGame(game);
    // Reset day filter to 'all' on game switch
    setPeriodFilter((prev) => ({ ...prev, selectedDay: 'all' }));
  };

  const handleChangePrice = (price: number) => {
    setGamePrices((prev) => ({ ...prev, [activeGame]: price }));
  };

  // Generate reduction
  const handleGenerateReduction = () => {
    const currentPrice = gamePrices[activeGame];
    const result = generateReducedColumns(
      selectedNumbers,
      activeGame,
      guarantee,
      selectedStars,
      currentPrice
    );
    setReductionResult(result);

    // Smooth scroll down to columns
    setTimeout(() => {
      columnsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePrint = () => {
    setPrintMode('slip');
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const handlePrintManual = () => {
    setPrintMode('manual');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintMode('slip');
      }, 500);
    }, 60);
  };

  const handleAddDraw = (newDraw: LotteryDraw) => {
    setAllDraws((prev) => [newDraw, ...prev]);
  };

  const handleResetDraws = () => {
    if (
      window.confirm(
        '¿Deseas restaurar la base de datos a los sorteos oficiales verificados de Loterías y Apuestas del Estado? Se corregirán posibles datos simulados o fechas erróneas.'
      )
    ) {
      const reset = resetStoredDraws();
      setAllDraws(reset);
      setSyncToast({
        show: true,
        title: 'Sorteos oficiales restaurados',
        message:
          'Base de datos restablecida correctamente con los sorteos oficiales verificados de Loterías y Apuestas del Estado.',
        type: 'success',
      });
    }
  };

  const handleLoadCombination = (combo: SavedCombination) => {
    setActiveGame(combo.game);
    setSelectedNumbers(combo.selectedNumbers);
    setSelectedStars(combo.selectedStars || []);
    setGuarantee(combo.guarantee);

    // Auto-generate reduction result with this combination
    const currentPrice = gamePrices[combo.game] || DEFAULT_PRICES[combo.game];
    const result = generateReducedColumns(
      combo.selectedNumbers,
      combo.game,
      combo.guarantee,
      combo.selectedStars,
      currentPrice
    );
    setReductionResult(result);
    setIsSavedCombinationsModalOpen(false);

    setSyncToast({
      show: true,
      title: 'Combinación cargada',
      message: `Se ha cargado "${combo.name}" con ${result.columnsCount} columnas (${result.totalCost.toFixed(2)} €).`,
      type: 'success',
    });
    setTimeout(() => setSyncToast(null), 4000);

    setTimeout(() => {
      columnsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Screen Layout (hidden when printing) */}
      <div className="no-print flex-1 flex flex-col">
        {/* Sticky Header */}
        <Header
          activeGame={activeGame}
          onSelectGame={handleSelectGame}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          totalDrawsInGame={totalGameDraws}
          onSyncDatabase={handleSyncDatabase}
          isSyncing={isSyncing}
          missingDrawsCount={missingInfo.totalMissing}
          onOpenSavedCombinations={() => {
            setSavedCombinationsCount(getSavedCombinations().length);
            setIsSavedCombinationsModalOpen(true);
          }}
          savedCombinationsCount={savedCombinationsCount}
          onOpenManual={() => setIsManualModalOpen(true)}
          hasAppUpdate={hasAppUpdate}
          isCheckingAppUpdate={isCheckingAppUpdate}
          onApplyUpdate={applyUpdate}
          onCheckUpdates={handleCheckForUpdates}
        />

        {/* Main Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Active Game Notice Banner */}
          <div
            className={`rounded-2xl p-4 sm:p-5 shadow-md border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              activeGame === 'primitiva'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400 text-white shadow-emerald-900/15'
                : activeGame === 'bonoloto'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 border-blue-400 text-white shadow-blue-900/15'
                : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-amber-300 text-slate-950 shadow-amber-900/15'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm shrink-0 shadow-md border ${
                  activeGame === 'primitiva'
                    ? 'bg-white text-emerald-950 border-white'
                    : activeGame === 'bonoloto'
                    ? 'bg-white text-blue-950 border-white'
                    : 'bg-white text-amber-950 border-white'
                }`}
              >
                {activeGame === 'primitiva' ? 'PR' : activeGame === 'bonoloto' ? 'BN' : 'EM'}
              </span>
              <div>
                <h2
                  className={`text-sm sm:text-base font-black flex items-center gap-2 ${
                    activeGame === 'euromillones' ? 'text-slate-950' : 'text-white'
                  }`}
                >
                  <span>
                    {activeGame === 'primitiva'
                      ? 'Lotería Primitiva (Lunes, Jueves y Sábado)'
                      : activeGame === 'bonoloto'
                      ? 'Bonoloto (Sorteo Diario de Lunes a Domingo)'
                      : 'Euromillones (Martes y Viernes - 5 Números y 2 Estrellas)'}
                  </span>
                </h2>
                <p
                  className={`text-xs ${
                    activeGame === 'primitiva'
                      ? 'text-emerald-100'
                      : activeGame === 'bonoloto'
                      ? 'text-blue-100'
                      : 'text-amber-950/85 font-medium'
                  }`}
                >
                  {activeGame === 'primitiva'
                    ? 'Analiza los 12 números más repetidos y redúcelos con garantía oficial al 5, 4 o 3.'
                    : activeGame === 'bonoloto'
                    ? 'Misma mecánica que La Primitiva a precio más económico (0,50 €).'
                    : 'Selección de 10 números y 5 estrellas más repetidos con garantía al 4 o 3.'}
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 self-start sm:self-auto text-xs font-semibold px-4 py-2 rounded-full border-2 border-white/90 shadow-md ring-2 ring-white/30 backdrop-blur-xs transition-all ${
                activeGame === 'primitiva'
                  ? 'bg-emerald-950/50 text-white'
                  : activeGame === 'bonoloto'
                  ? 'bg-blue-950/50 text-white'
                  : 'bg-white/85 text-slate-950'
              }`}
            >
              <span className={activeGame === 'euromillones' ? 'text-slate-700 font-bold' : 'text-white/90 font-medium'}>
                Precio oficial:
              </span>
              <strong
                className={`font-mono text-sm font-black ${
                  activeGame === 'euromillones' ? 'text-slate-950' : 'text-white'
                }`}
              >
                {gamePrices[activeGame].toFixed(2)} €
              </strong>
            </div>
          </div>

          {/* 1. Period Filter */}
          <PeriodFilter
            filter={periodFilter}
            onChangeFilter={setPeriodFilter}
            filteredDrawsCount={filteredDraws.length}
            totalDrawsCount={totalGameDraws}
            activeGame={activeGame}
            onSyncDatabase={handleSyncDatabase}
            isSyncing={isSyncing}
            missingDrawsCount={missingInfo.totalMissing}
          />

          {/* 2. Statistical Table with Day-by-Day Breakdown */}
          <StatsTable
            game={activeGame}
            stats={numberStats}
            starStats={starStats}
            selectedNumbers={selectedNumbers}
            onToggleNumber={handleToggleNumber}
            selectedStars={selectedStars}
            onToggleStar={handleToggleStar}
            onSelectTopN={handleSelectTopN}
            onSelectTopStars={handleSelectTopStars}
            onClearSelection={handleClearSelection}
            selectedDay={periodFilter.selectedDay || 'all'}
            onSelectDay={(day) => setPeriodFilter((prev) => ({ ...prev, selectedDay: day }))}
          />

          {/* 3. Reduction Selector & Price Configuration */}
          <ReductionSelector
            game={activeGame}
            selectedNumbers={selectedNumbers}
            selectedStars={selectedStars}
            guarantee={guarantee}
            onChangeGuarantee={setGuarantee}
            pricePerBet={gamePrices[activeGame]}
            onChangePricePerBet={handleChangePrice}
            onGenerate={handleGenerateReduction}
            onSelectQuickCount={handleSelectTopN}
          />

          {/* 4. Generated Columns & Cost Summary */}
          <div ref={columnsRef}>
            {reductionResult && (
              <ColumnsViewer
                result={reductionResult}
                allDraws={allDraws}
                onPrint={handlePrint}
                onAddDraw={handleAddDraw}
                onSavedCombination={() => setSavedCombinationsCount(getSavedCombinations().length)}
                onSyncDatabase={() => handleSyncDatabase(false)}
                isSyncingDatabase={isSyncing}
              />
            )}
          </div>

          {/* 5. Educational / Advice Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300/40">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span>¿Cómo funcionan las combinaciones reducidas en la Lotería?</span>
            </div>
            <p className="leading-relaxed">
              Jugar una combinación directa de 12 números en La Primitiva o Bonoloto supondría{' '}
              <strong>924 apuestas (924,00 € en Primitiva)</strong>. Con el{' '}
              <strong className="text-slate-900">sistema reducido oficial al 5</strong>, juegas los mismos 12 números en solo{' '}
              <strong className="text-emerald-700">64 apuestas (64,00 €)</strong>. Si la combinación ganadora de 6 números está entre
              tus 12 elegidos, tienes garantizado al <strong>100% al menos un premio de 5 aciertos</strong>,
              y un porcentaje de posibilidad de obtener el premio de 6 aciertos, ahorrándote más del 93% del coste.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-slate-700">
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  activeGame === 'primitiva'
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300/40 shadow-xs'
                    : 'bg-emerald-50/40 border-emerald-200/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <strong className="text-emerald-950 font-bold">La Primitiva</strong>
                  {activeGame === 'primitiva' && (
                    <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded-sm">
                      ACTIVO
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">
                  Sorteos: Lunes, Jueves y Sábado. 6 de 49 + Complementario y Reintegro. Precio base: 1,00 €.
                </p>
              </div>

              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  activeGame === 'bonoloto'
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300/40 shadow-xs'
                    : 'bg-blue-50/40 border-blue-200/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <strong className="text-blue-950 font-bold">Bonoloto</strong>
                  {activeGame === 'bonoloto' && (
                    <span className="text-[10px] font-extrabold bg-blue-600 text-white px-1.5 py-0.2 rounded-sm">
                      ACTIVO
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">
                  Sorteos: Todos los días (Lunes a Domingo). 6 de 49 + Complementario y Reintegro. Precio base: 0,50 €.
                </p>
              </div>

              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  activeGame === 'euromillones'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
                    : 'bg-amber-50/40 border-amber-200/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <strong className="text-amber-950 font-bold">Euromillones</strong>
                  {activeGame === 'euromillones' && (
                    <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-sm">
                      ACTIVO
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">
                  Sorteos: Martes y Viernes. 5 números (1-50) + 2 estrellas (1-12). Precio base: 2,50 €.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-[#06152B] via-[#0B254E] to-[#06152B] border-t border-amber-400/20 py-4 mt-8 text-center text-xs text-slate-300">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-[10px] tracking-wider uppercase">
                ANSAMA
              </span>
              <p className="text-slate-300">
                LotoEstadísticas &amp; Reductor &bull; Optimizado para Web, Móvil e Impresión PDF
              </p>
            </div>
            <p className="text-slate-400">
              Loterías y Apuestas del Estado &bull; Juega con responsabilidad
            </p>
          </div>
        </footer>

        {/* History Modal */}
        <DrawsHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          game={activeGame}
          draws={allDraws}
          onAddDraw={handleAddDraw}
          onResetDraws={handleResetDraws}
          onSyncDatabase={handleSyncDatabase}
          isSyncing={isSyncing}
          missingDrawsCount={missingInfo.totalMissing}
          autoSyncEnabled={autoSyncEnabled}
          onToggleAutoSync={handleToggleAutoSync}
          onExportDatabase={handleExportDatabase}
          onImportDatabase={handleImportDatabase}
        />

        {/* Saved Combinations (Peñas) Modal */}
        <SavedCombinationsModal
          isOpen={isSavedCombinationsModalOpen}
          onClose={() => {
            setIsSavedCombinationsModalOpen(false);
            setSavedCombinationsCount(getSavedCombinations().length);
          }}
          onLoadCombination={handleLoadCombination}
          activeGame={activeGame}
          onCountChange={setSavedCombinationsCount}
        />

        {/* User Manual & Technical Guide Modal */}
        <UserManualModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          onPrintManual={handlePrintManual}
        />
      </div>

      {/* Simple Floating Notification when an update is pending */}
      <UpdateNotificationBanner
        hasUpdate={hasAppUpdate}
        isUpdating={isCheckingAppUpdate}
        onApplyUpdate={applyUpdate}
        onDismiss={dismissUpdateNotification}
      />

      {/* Floating Toast Notification for Database Synchronization */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full sm:w-auto animate-in slide-in-from-bottom-4 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 text-white ${
              syncToast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/50 shadow-emerald-950/40'
                : syncToast.type === 'error'
                ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/40'
                : 'bg-slate-900 border-blue-500/50 shadow-blue-950/40'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                syncToast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : syncToast.type === 'error'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {syncToast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : syncToast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold text-white tracking-tight">{syncToast.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{syncToast.message}</p>
            </div>

            <button
              onClick={() => setSyncToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Printable Components (rendered ONLY when printing / PDF export) */}
      {printMode === 'slip' && reductionResult && <PrintSlip result={reductionResult} />}
      {printMode === 'manual' && <PrintManual />}
    </div>
  );
}
