import React, { useState, useMemo, useEffect } from 'react';
import { ReductionResult, LotteryDraw } from '../types';
import { REDUCTION_PLANS } from '../utils/reductions';
import {
  Printer,
  Copy,
  Check,
  Download,
  Sparkles,
  Trophy,
  Award,
  Calendar,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Save,
  ChevronDown,
  ShieldCheck,
  FolderHeart,
  FileSpreadsheet,
  Coins,
  TrendingUp,
  TrendingDown,
  Scale,
  SlidersHorizontal,
  ChevronUp,
  Info,
  Sliders,
  FolderPlus,
  RefreshCw,
  Tag,
  Ticket,
} from 'lucide-react';
import { SaveCombinationDialog } from './SaveCombinationDialog';

interface ColumnsViewerProps {
  result: ReductionResult;
  allDraws?: LotteryDraw[];
  onPrint: () => void;
  onAddDraw?: (draw: LotteryDraw) => void;
  onSavedCombination?: () => void;
  onSyncDatabase?: () => Promise<void> | void;
  isSyncingDatabase?: boolean;
  onUpdateColumnReintegros?: (reintegros: Record<number, number | undefined>) => void;
}

type CheckerMode = 'none' | 'auto' | 'manual' | 'guarantee';

export const ColumnsViewer: React.FC<ColumnsViewerProps> = ({
  result,
  allDraws = [],
  onPrint,
  onAddDraw,
  onSavedCombination,
  onSyncDatabase,
  isSyncingDatabase = false,
  onUpdateColumnReintegros,
}) => {
  const [copied, setCopied] = useState(false);

  // Checker Mode: 'none' | 'auto' | 'manual' | 'guarantee'
  const [checkerMode, setCheckerMode] = useState<CheckerMode>('auto');

  // Filter draws for active game, sorted newest to oldest
  const gameDraws = useMemo(() => {
    return allDraws
      .filter((d) => d.game === result.game)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [allDraws, result.game]);

  // Automatic Mode: selected draw id
  const [selectedDrawId, setSelectedDrawId] = useState<string>(() => {
    return gameDraws.length > 0 ? gameDraws[0].id : '';
  });

  // Manual Mode state
  const [manualDate, setManualDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [manualNumbers, setManualNumbers] = useState<number[]>([]);
  const [manualComplementario, setManualComplementario] = useState<number | undefined>(undefined);
  const [manualReintegro, setManualReintegro] = useState<number | undefined>(undefined);
  const [manualStars, setManualStars] = useState<number[]>([]);
  const [manualQuickInput, setManualQuickInput] = useState<string>('');
  const [manualInputError, setManualInputError] = useState<string | null>(null);
  const [manualSaveSuccess, setManualSaveSuccess] = useState<boolean>(false);

  // Guarantee theoretical simulator state
  const [guaranteeTestDraw, setGuaranteeTestDraw] = useState<number[]>([]);

  // Columns filter and sorting in scrutiny (default to natural column order 1..N)
  const [hitsFilter, setHitsFilter] = useState<'all' | 'prizes_only' | 'reintegro' | number>('all');
  const [sortByHits, setSortByHits] = useState<boolean>(false);

  // Reintegro assigned to each column (for Primitiva and Bonoloto)
  const [columnReintegros, setColumnReintegros] = useState<Record<number, number | undefined>>(() => {
    const initial: Record<number, number | undefined> = {};
    result.columns.forEach((col) => {
      initial[col.id] = col.reintegro;
    });
    return initial;
  });

  const [bulkReintegro, setBulkReintegro] = useState<number | undefined>(undefined);
  const [reintegroMode, setReintegroMode] = useState<'by_boleto' | 'all'>('by_boleto');

  // Sync ONLY when a fresh reduction combination is generated (different columns length, game or first column ID)
  const prevColsSignature = useRef<string>(
    `${result.game}-${result.guarantee}-${result.columns.length}-${result.columns[0]?.id || 0}`
  );

  useEffect(() => {
    const currentSignature = `${result.game}-${result.guarantee}-${result.columns.length}-${result.columns[0]?.id || 0}`;
    if (prevColsSignature.current !== currentSignature) {
      prevColsSignature.current = currentSignature;
      const initial: Record<number, number | undefined> = {};
      result.columns.forEach((col) => {
        initial[col.id] = col.reintegro;
      });
      setColumnReintegros(initial);
      setBulkReintegro(undefined);
    }
  }, [result.game, result.guarantee, result.columns]);

  const handleSetAllReintegros = (reintegro: number) => {
    setBulkReintegro(reintegro);
    const updated: Record<number, number | undefined> = {};
    result.columns.forEach((col) => {
      updated[col.id] = reintegro;
    });
    setColumnReintegros(updated);
    if (onUpdateColumnReintegros) {
      onUpdateColumnReintegros(updated);
    }
  };

  // Set reintegro for an official 8-column ticket block (1-8, 9-16, 17-24...)
  const handleSetBoletoReintegro = (boletoIndex: number, reintegro: number) => {
    const startIdx = boletoIndex * 8;
    const endIdx = Math.min(startIdx + 8, result.columns.length);
    const updated: Record<number, number | undefined> = { ...columnReintegros };
    for (let i = startIdx; i < endIdx; i++) {
      const col = result.columns[i];
      if (col) {
        updated[col.id] = reintegro;
      }
    }
    setColumnReintegros(updated);
    setBulkReintegro(undefined);
    if (onUpdateColumnReintegros) {
      onUpdateColumnReintegros(updated);
    }
  };

  const handleClearBoletoReintegro = (boletoIndex: number) => {
    const startIdx = boletoIndex * 8;
    const endIdx = Math.min(startIdx + 8, result.columns.length);
    const updated: Record<number, number | undefined> = { ...columnReintegros };
    for (let i = startIdx; i < endIdx; i++) {
      const col = result.columns[i];
      if (col) {
        updated[col.id] = undefined;
      }
    }
    setColumnReintegros(updated);
    setBulkReintegro(undefined);
    if (onUpdateColumnReintegros) {
      onUpdateColumnReintegros(updated);
    }
  };

  const handleSetColumnReintegro = (colId: number, reintegro: number | undefined) => {
    const updated: Record<number, number | undefined> = {
      ...columnReintegros,
      [colId]: reintegro,
    };
    setColumnReintegros(updated);
    if (onUpdateColumnReintegros) {
      onUpdateColumnReintegros(updated);
    }
  };

  const handleSimulateBoletoReintegros = () => {
    const updated: Record<number, number | undefined> = {};
    let currentBoletoR = Math.floor(Math.random() * 10);
    result.columns.forEach((col, idx) => {
      if (idx > 0 && idx % 8 === 0) {
        currentBoletoR = Math.floor(Math.random() * 10);
      }
      updated[col.id] = currentBoletoR;
    });
    setColumnReintegros(updated);
    setBulkReintegro(undefined);
    if (onUpdateColumnReintegros) {
      onUpdateColumnReintegros(updated);
    }
  };

  const handleClearReintegros = () => {
    const cleared: Record<number, number | undefined> = {};
    result.columns.forEach((col) => {
      cleared[col.id] = undefined;
    });
    setColumnReintegros(cleared);
    setBulkReintegro(undefined);
    if (onUpdateColumnReintegros) {
      onUpdateColumnReintegros(cleared);
    }
  };

  // Favorites & Peña Save State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  // Quality & Equilibrium Filter State
  const [showQualityAnalysis, setShowQualityAnalysis] = useState(false);
  const [parityFilter, setParityFilter] = useState<'all' | string>('all');
  const [sumRangeFilter, setSumRangeFilter] = useState<'all' | 'optimo' | 'bajo' | 'alto'>('all');

  // Financial Balance (Inversión vs Premios) State
  const [showPrizeAdjuster, setShowPrizeAdjuster] = useState(false);
  const [customPrizeValues, setCustomPrizeValues] = useState<Record<string, number>>({});

  const plan = REDUCTION_PLANS[result.guarantee];
  const maxRequiredNumbers = result.game === 'euromillones' ? 5 : 6;
  const maxStars = 2;

  // Derive active scrutiny winning numbers based on mode
  const activeDrawInfo = useMemo(() => {
    if (checkerMode === 'none') {
      return null;
    }

    if (checkerMode === 'auto') {
      const draw = gameDraws.find((d) => d.id === selectedDrawId) || gameDraws[0];
      if (!draw) return null;
      return {
        isAuto: true,
        date: draw.date,
        dayOfWeek: draw.dayOfWeek,
        numbers: draw.numbers,
        complementario: draw.complementario,
        reintegro: draw.reintegro,
        stars: draw.stars,
        label: `Sorteo oficial del ${draw.dayOfWeek}, ${new Date(
          draw.date + 'T12:00:00Z'
        ).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}`,
      };
    }

    if (checkerMode === 'manual') {
      if (manualNumbers.length === 0) return null;
      const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = daysOfWeek[new Date(manualDate + 'T12:00:00Z').getDay()];
      return {
        isAuto: false,
        date: manualDate,
        dayOfWeek: dayName,
        numbers: manualNumbers,
        complementario: manualComplementario,
        reintegro: manualReintegro,
        stars: manualStars,
        label: `Sorteo manual (${dayName}, ${manualDate})`,
      };
    }

    if (checkerMode === 'guarantee') {
      if (guaranteeTestDraw.length === 0) return null;
      return {
        isAuto: false,
        date: '',
        dayOfWeek: '',
        numbers: guaranteeTestDraw,
        complementario: undefined,
        reintegro: undefined,
        stars: undefined,
        label: `Simulación teórica (${guaranteeTestDraw.length} números)`,
      };
    }

    return null;
  }, [
    checkerMode,
    selectedDrawId,
    gameDraws,
    manualDate,
    manualNumbers,
    manualComplementario,
    manualReintegro,
    manualStars,
    guaranteeTestDraw,
  ]);

  // Boletos list (blocks of 8 columns: 1-8, 9-16, 17-24...)
  const boletosList = useMemo(() => {
    const list: {
      boletoIndex: number;
      boletoNumber: number;
      startCol: number;
      endCol: number;
      columnsCount: number;
      columns: typeof result.columns;
      reintegro: number | 'mixed' | undefined;
      isWinning: boolean;
      winningColumnsCount: number;
    }[] = [];
    const total = Math.ceil(result.columns.length / 8);
    for (let b = 0; b < total; b++) {
      const startIdx = b * 8;
      const endIdx = Math.min(startIdx + 8, result.columns.length);
      const cols = result.columns.slice(startIdx, endIdx);
      const startCol = startIdx + 1;
      const endCol = endIdx;

      const firstR = cols.length > 0 ? columnReintegros[cols[0].id] : undefined;
      let isUniform = true;
      for (let i = 1; i < cols.length; i++) {
        if (columnReintegros[cols[i].id] !== firstR) {
          isUniform = false;
          break;
        }
      }

      const reintegroVal = isUniform ? firstR : 'mixed';
      const isWinning =
        activeDrawInfo?.reintegro !== undefined &&
        typeof reintegroVal === 'number' &&
        reintegroVal === activeDrawInfo.reintegro;

      const winningColumnsCount = cols.filter(
        (c) =>
          activeDrawInfo?.reintegro !== undefined &&
          columnReintegros[c.id] !== undefined &&
          columnReintegros[c.id] === activeDrawInfo.reintegro
      ).length;

      list.push({
        boletoIndex: b,
        boletoNumber: b + 1,
        startCol,
        endCol,
        columnsCount: cols.length,
        columns: cols,
        reintegro: reintegroVal,
        isWinning,
        winningColumnsCount,
      });
    }
    return list;
  }, [result.columns, columnReintegros, activeDrawInfo]);

  // Scrutiny calculation per column
  const evaluatedColumns = useMemo(() => {
    if (!activeDrawInfo || activeDrawInfo.numbers.length === 0) {
      return result.columns.map((col) => ({
        ...col,
        reintegro: columnReintegros[col.id],
        numberHits: 0,
        hitNumbers: [] as number[],
        hasComplementario: false,
        hasReintegro: false,
        starHits: 0,
        hitStars: [] as number[],
        isPrize: false,
        prizeCategory: '',
      }));
    }

    const winningSet = new Set<number>(activeDrawInfo.numbers);
    const winningStarsSet = new Set<number>(activeDrawInfo.stars || []);

    return result.columns.map((col) => {
      const hitNumbers = col.numbers.filter((n) => winningSet.has(n));
      const numberHits = hitNumbers.length;

      const hasComplementario =
        activeDrawInfo.complementario !== undefined &&
        col.numbers.includes(activeDrawInfo.complementario);

      const colReintegro = columnReintegros[col.id];
      const hasReintegro =
        result.game !== 'euromillones' &&
        colReintegro !== undefined &&
        activeDrawInfo.reintegro !== undefined &&
        colReintegro === activeDrawInfo.reintegro;

      const hitStars = col.stars ? col.stars.filter((s) => winningStarsSet.has(s)) : [];
      const starHits = hitStars.length;

      let isPrize = false;
      let prizeCategory = '';

      if (result.game === 'euromillones') {
        if (numberHits === 5 && starHits === 2) {
          isPrize = true;
          prizeCategory = '1ª Cat (5 + 2★)';
        } else if (numberHits === 5 && starHits === 1) {
          isPrize = true;
          prizeCategory = '2ª Cat (5 + 1★)';
        } else if (numberHits === 5 && starHits === 0) {
          isPrize = true;
          prizeCategory = '3ª Cat (5 + 0★)';
        } else if (numberHits === 4 && starHits === 2) {
          isPrize = true;
          prizeCategory = '4ª Cat (4 + 2★)';
        } else if (numberHits === 4 && starHits === 1) {
          isPrize = true;
          prizeCategory = '5ª Cat (4 + 1★)';
        } else if (numberHits === 3 && starHits === 2) {
          isPrize = true;
          prizeCategory = '6ª Cat (3 + 2★)';
        } else if (numberHits === 4 && starHits === 0) {
          isPrize = true;
          prizeCategory = '7ª Cat (4 + 0★)';
        } else if (numberHits === 2 && starHits === 2) {
          isPrize = true;
          prizeCategory = '8ª Cat (2 + 2★)';
        } else if (numberHits === 3 && starHits === 1) {
          isPrize = true;
          prizeCategory = '9ª Cat (3 + 1★)';
        } else if (numberHits === 3 && starHits === 0) {
          isPrize = true;
          prizeCategory = '10ª Cat (3 + 0★)';
        } else if (numberHits === 1 && starHits === 2) {
          isPrize = true;
          prizeCategory = '11ª Cat (1 + 2★)';
        } else if (numberHits === 2 && starHits === 1) {
          isPrize = true;
          prizeCategory = '12ª Cat (2 + 1★)';
        } else if (numberHits === 2 && starHits === 0) {
          isPrize = true;
          prizeCategory = '13ª Cat (2 + 0★)';
        } else {
          prizeCategory = `${numberHits} aciertos`;
        }
      } else {
        // Primitiva & Bonoloto
        if (numberHits === 6) {
          isPrize = true;
          prizeCategory = hasReintegro ? 'Esp. Cat (6 + R)' : '1ª Cat (6 Aciertos)';
        } else if (numberHits === 5 && hasComplementario) {
          isPrize = true;
          prizeCategory = '2ª Cat (5 + C)';
        } else if (numberHits === 5) {
          isPrize = true;
          prizeCategory = '3ª Cat (5 Aciertos)';
        } else if (numberHits === 4) {
          isPrize = true;
          prizeCategory = '4ª Cat (4 Aciertos)';
        } else if (numberHits === 3) {
          isPrize = true;
          prizeCategory = '5ª Cat (3 Aciertos)';
        } else if (hasReintegro) {
          isPrize = true;
          prizeCategory = 'Reintegro (Reembolso)';
        } else {
          prizeCategory = `${numberHits} aciertos`;
        }
      }

      return {
        ...col,
        reintegro: colReintegro,
        numberHits,
        hitNumbers,
        hasComplementario,
        hasReintegro,
        starHits,
        hitStars,
        isPrize,
        prizeCategory,
      };
    });
  }, [result, activeDrawInfo, columnReintegros]);

  // Summary counts of scrutiny
  const scrutinySummary = useMemo(() => {
    const hitsCountMap: Record<number, number> = {
      6: 0,
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
      0: 0,
    };
    let count5WithComplementary = 0;
    let reintegrosWonCount = 0;
    let totalPrizes = 0;
    let maxHits = 0;

    evaluatedColumns.forEach((col) => {
      if (col.numberHits > maxHits) maxHits = col.numberHits;
      hitsCountMap[col.numberHits] = (hitsCountMap[col.numberHits] || 0) + 1;
      if (col.numberHits === 5 && col.hasComplementario) {
        count5WithComplementary++;
      }
      if (col.hasReintegro) {
        reintegrosWonCount++;
      }
      if (col.isPrize) {
        totalPrizes++;
      }
    });

    return {
      hitsCountMap,
      count5WithComplementary,
      reintegrosWonCount,
      totalPrizes,
      maxHits,
    };
  }, [evaluatedColumns]);

  // Quality & Equilibrium Stats
  const qualityStats = useMemo(() => {
    const isEuro = result.game === 'euromillones';
    const optimalSumMin = isEuro ? 95 : 115;
    const optimalSumMax = isEuro ? 160 : 185;

    let minSum = Infinity;
    let maxSum = -Infinity;
    let totalSum = 0;
    const parityMap: Record<string, number> = {};
    const sumMap = {
      bajo: 0,
      optimo: 0,
      alto: 0,
    };

    result.columns.forEach((col) => {
      const even = col.numbers.filter((n) => n % 2 === 0).length;
      const odd = col.numbers.length - even;
      const parityKey = `${even}P - ${odd}I`;
      parityMap[parityKey] = (parityMap[parityKey] || 0) + 1;

      const sum = col.numbers.reduce((acc, n) => acc + n, 0);
      if (sum < minSum) minSum = sum;
      if (sum > maxSum) maxSum = sum;
      totalSum += sum;

      if (sum < optimalSumMin) {
        sumMap.bajo++;
      } else if (sum > optimalSumMax) {
        sumMap.alto++;
      } else {
        sumMap.optimo++;
      }
    });

    const avgSum = result.columns.length > 0 ? Math.round(totalSum / result.columns.length) : 0;
    const balancedParities = isEuro ? ['3P - 2I', '2P - 3I'] : ['3P - 3I', '4P - 2I', '2P - 4I'];
    const balancedCount = balancedParities.reduce((acc, k) => acc + (parityMap[k] || 0), 0);
    const optimalParityPercent =
      result.columns.length > 0 ? Math.round((balancedCount / result.columns.length) * 100) : 0;
    const optimalSumPercent =
      result.columns.length > 0 ? Math.round((sumMap.optimo / result.columns.length) * 100) : 0;

    return {
      parityMap,
      minSum: minSum === Infinity ? 0 : minSum,
      maxSum: maxSum === -Infinity ? 0 : maxSum,
      avgSum,
      optimalSumMin,
      optimalSumMax,
      sumMap,
      optimalParityPercent,
      optimalSumPercent,
    };
  }, [result]);

  // Financial Balance Calculation (Inversión vs Premios)
  const financialSummary = useMemo(() => {
    const DEFAULT_PRIZE_ESTIMATES: Record<string, Record<string, number>> = {
      primitiva: {
        '6 Aciertos': 1400000,
        '5 + C': 38000,
        '5 Aciertos': 2200,
        '4 Aciertos': 65,
        '3 Aciertos': 8,
        Reintegro: 1.0,
      },
      bonoloto: {
        '6 Aciertos': 350000,
        '5 + C': 12000,
        '5 Aciertos': 850,
        '4 Aciertos': 28,
        '3 Aciertos': 4,
        Reintegro: 0.5,
      },
      euromillones: {
        '1ª Cat (5 + 2★)': 40000000,
        '2ª Cat (5 + 1★)': 250000,
        '3ª Cat (5 + 0★)': 25000,
        '4ª Cat (4 + 2★)': 2500,
        '5ª Cat (4 + 1★)': 150,
        '6ª Cat (3 + 2★)': 75,
        '7ª Cat (4 + 0★)': 50,
        '8ª Cat (2 + 2★)': 20,
        '9ª Cat (3 + 1★)': 14,
        '10ª Cat (3 + 0★)': 10,
        '11ª Cat (1 + 2★)': 9,
        '12ª Cat (2 + 1★)': 7,
        '13ª Cat (2 + 0★)': 4,
      },
    };

    const defaultVals = DEFAULT_PRIZE_ESTIMATES[result.game] || {};
    const effectivePrices = { ...defaultVals, ...customPrizeValues };

    let totalWon = 0;
    const categoryBreakdown: Array<{
      category: string;
      count: number;
      amountPerPrize: number;
      totalCategory: number;
      key: string;
    }> = [];

    const prizeGroup: Record<string, number> = {};
    evaluatedColumns.forEach((c) => {
      if (c.isPrize && c.prizeCategory) {
        prizeGroup[c.prizeCategory] = (prizeGroup[c.prizeCategory] || 0) + 1;
      }
    });

    const reintegrosWonCount = evaluatedColumns.filter((c) => c.hasReintegro).length;
    const reintegroHit = reintegrosWonCount > 0;

    if (result.game === 'euromillones') {
      const euroCategories = [
        '1ª Cat (5 + 2★)',
        '2ª Cat (5 + 1★)',
        '3ª Cat (5 + 0★)',
        '4ª Cat (4 + 2★)',
        '5ª Cat (4 + 1★)',
        '6ª Cat (3 + 2★)',
        '7ª Cat (4 + 0★)',
        '8ª Cat (2 + 2★)',
        '9ª Cat (3 + 1★)',
        '10ª Cat (3 + 0★)',
        '11ª Cat (1 + 2★)',
        '12ª Cat (2 + 1★)',
        '13ª Cat (2 + 0★)',
      ];
      euroCategories.forEach((cat) => {
        const count = prizeGroup[cat] || 0;
        const val = effectivePrices[cat] ?? 0;
        if (count > 0 || customPrizeValues[cat] !== undefined) {
          const tot = count * val;
          totalWon += tot;
          categoryBreakdown.push({
            category: cat,
            count,
            amountPerPrize: val,
            totalCategory: tot,
            key: cat,
          });
        }
      });
    } else {
      const categories = [
        { cat: '1ª Cat (6 Aciertos)', key: '6 Aciertos' },
        { cat: '2ª Cat (5 + C)', key: '5 + C' },
        { cat: '3ª Cat (5 Aciertos)', key: '5 Aciertos' },
        { cat: '4ª Cat (4 Aciertos)', key: '4 Aciertos' },
        { cat: '5ª Cat (3 Aciertos)', key: '3 Aciertos' },
      ];
      categories.forEach(({ cat, key }) => {
        const count = prizeGroup[cat] || 0;
        const val = effectivePrices[key] ?? 0;
        if (count > 0 || customPrizeValues[key] !== undefined) {
          const tot = count * val;
          totalWon += tot;
          categoryBreakdown.push({
            category: cat,
            count,
            amountPerPrize: val,
            totalCategory: tot,
            key,
          });
        }
      });

      if (reintegrosWonCount > 0) {
        const reintegroVal = effectivePrices['Reintegro'] ?? result.pricePerBet;
        const reintegroTotal = reintegrosWonCount * reintegroVal;
        totalWon += reintegroTotal;
        categoryBreakdown.push({
          category: `Reintegro (R: ${activeDrawInfo?.reintegro})`,
          count: reintegrosWonCount,
          amountPerPrize: reintegroVal,
          totalCategory: reintegroTotal,
          key: 'Reintegro',
        });
      }
    }

    const netProfit = totalWon - result.totalCost;
    const roi = result.totalCost > 0 ? ((totalWon - result.totalCost) / result.totalCost) * 100 : 0;

    return {
      totalWon,
      invested: result.totalCost,
      netProfit,
      roi,
      categoryBreakdown,
      reintegroHit,
      reintegrosWonCount,
      effectivePrices,
    };
  }, [result, evaluatedColumns, activeDrawInfo, customPrizeValues]);

  // Visible and sorted columns according to user filter
  const displayedColumns = useMemo(() => {
    let list = [...evaluatedColumns];

    if (activeDrawInfo) {
      if (hitsFilter === 'prizes_only') {
        list = list.filter((c) => c.isPrize);
      } else if (hitsFilter === 'reintegro') {
        list = list.filter((c) => c.hasReintegro);
      } else if (typeof hitsFilter === 'number') {
        list = list.filter((c) => c.numberHits === hitsFilter);
      }
    }

    // Parity filter
    if (parityFilter !== 'all') {
      list = list.filter((c) => {
        const even = c.numbers.filter((n) => n % 2 === 0).length;
        const odd = c.numbers.length - even;
        return `${even}P - ${odd}I` === parityFilter;
      });
    }

    // Sum range filter
    if (sumRangeFilter !== 'all') {
      const isEuro = result.game === 'euromillones';
      const optMin = isEuro ? 95 : 115;
      const optMax = isEuro ? 160 : 185;
      list = list.filter((c) => {
        const sum = c.numbers.reduce((acc, n) => acc + n, 0);
        if (sumRangeFilter === 'optimo') return sum >= optMin && sum <= optMax;
        if (sumRangeFilter === 'bajo') return sum < optMin;
        if (sumRangeFilter === 'alto') return sum > optMax;
        return true;
      });
    }

    // Sorting: default to natural column order (Columna 01, Columna 02, Columna 03, ...)
    if (sortByHits && activeDrawInfo) {
      list.sort((a, b) => {
        if (b.numberHits !== a.numberHits) {
          return b.numberHits - a.numberHits;
        }
        if (b.starHits !== a.starHits) {
          return b.starHits - a.starHits;
        }
        if (b.hasComplementario !== a.hasComplementario) {
          return b.hasComplementario ? 1 : -1;
        }
        if (b.hasReintegro !== a.hasReintegro) {
          return b.hasReintegro ? 1 : -1;
        }
        return a.id - b.id;
      });
    } else {
      list.sort((a, b) => a.id - b.id);
    }

    return list;
  }, [evaluatedColumns, activeDrawInfo, hitsFilter, sortByHits, parityFilter, sumRangeFilter, result.game]);

  // Copy and TXT download
  const handleCopy = () => {
    const lines = result.columns.map((col) => {
      const numStr = col.numbers.map((n) => n.toString().padStart(2, '0')).join(' ');
      const starStr = col.stars ? ` [★ ${col.stars.join(' ')}]` : '';
      const r = columnReintegros[col.id];
      const rStr = r !== undefined ? ` [R: ${r}]` : '';
      return `Col ${col.id.toString().padStart(2, '0')}: ${numStr}${starStr}${rStr}`;
    });

    const textToCopy = `=== ${result.game.toUpperCase()} - SISTEMA REDUCIDO ===\nGarantía: ${plan.name}\nNúmeros jugados (${result.selectedNumbers.length}): ${result.selectedNumbers.join(', ')}\nTotal Apuestas: ${result.columnsCount} columnas\nPrecio Total: ${result.totalCost.toFixed(2)} €\n\n${lines.join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const lines = result.columns.map((col) => {
      const numStr = col.numbers.map((n) => n.toString().padStart(2, '0')).join(' ');
      const starStr = col.stars ? `  [Estrellas: ${col.stars.join(', ')}]` : '';
      const r = columnReintegros[col.id];
      const rStr = r !== undefined ? `  [Reintegro: ${r}]` : '';
      return `Apuesta #${col.id.toString().padStart(2, '0')}: ${numStr}${starStr}${rStr}`;
    });

    const textContent = `==============================================\n${result.game.toUpperCase()} - SISTEMA REDUCIDO\n==============================================\nGarantía: ${plan.name}\nNúmeros elegidos (${result.selectedNumbers.length}): ${result.selectedNumbers.join(', ')}\n${result.selectedStars ? `Estrellas: ${result.selectedStars.join(', ')}\n` : ''}Total columnas: ${result.columnsCount}\nPrecio por apuesta: ${result.pricePerBet.toFixed(2)} €\nImporte Total: ${result.totalCost.toFixed(2)} €\nFecha: ${new Date().toLocaleString('es-ES')}\n==============================================\n\n${lines.join('\n')}\n`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `columnas_${result.game}_${result.guarantee}_${result.columnsCount}apuestas.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const isEuro = result.game === 'euromillones';
    const headers = isEuro
      ? ['Columna', 'N1', 'N2', 'N3', 'N4', 'N5', 'Estrella1', 'Estrella2', 'Pares', 'Impares', 'Suma']
      : ['Columna', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'Reintegro', 'Pares', 'Impares', 'Suma'];

    const rows = result.columns.map((col) => {
      const evenCount = col.numbers.filter((n) => n % 2 === 0).length;
      const oddCount = col.numbers.length - evenCount;
      const sum = col.numbers.reduce((acc, n) => acc + n, 0);

      if (isEuro) {
        return [
          col.id,
          col.numbers[0] ?? '',
          col.numbers[1] ?? '',
          col.numbers[2] ?? '',
          col.numbers[3] ?? '',
          col.numbers[4] ?? '',
          col.stars?.[0] ?? '',
          col.stars?.[1] ?? '',
          evenCount,
          oddCount,
          sum,
        ].join(',');
      } else {
        return [
          col.id,
          col.numbers[0] ?? '',
          col.numbers[1] ?? '',
          col.numbers[2] ?? '',
          col.numbers[3] ?? '',
          col.numbers[4] ?? '',
          col.numbers[5] ?? '',
          columnReintegros[col.id] ?? '',
          evenCount,
          oddCount,
          sum,
        ].join(',');
      }
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `columnas_${result.game}_${result.guarantee}_${result.columnsCount}apuestas.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTerminal = () => {
    const lines = result.columns.map((col) => {
      const numStr = col.numbers.map((n) => n.toString().padStart(2, '0')).join(' ');
      if (result.game === 'euromillones' && col.stars) {
        const starStr = col.stars.map((s) => s.toString().padStart(2, '0')).join(' ');
        return `${numStr} + ${starStr}`;
      }
      return numStr;
    });

    const textContent = lines.join('\r\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `terminal_${result.game}_${result.columnsCount}apuestas.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Manual toggle number
  const toggleManualNumber = (num: number) => {
    setManualInputError(null);
    if (manualNumbers.includes(num)) {
      setManualNumbers(manualNumbers.filter((n) => n !== num));
    } else {
      if (manualNumbers.length >= maxRequiredNumbers) {
        setManualInputError(`Ya has marcado los ${maxRequiredNumbers} números ganadores.`);
        return;
      }
      setManualNumbers([...manualNumbers, num].sort((a, b) => a - b));
    }
  };

  const toggleManualStar = (star: number) => {
    if (manualStars.includes(star)) {
      setManualStars(manualStars.filter((s) => s !== star));
    } else {
      if (manualStars.length >= maxStars) return;
      setManualStars([...manualStars, star].sort((a, b) => a - b));
    }
  };

  // Parse manual text input e.g. "3 14 22 35 41 49"
  const handleParseManualQuickInput = () => {
    setManualInputError(null);
    const cleaned: number[] = manualQuickInput
      .replace(/[,;.-]/g, ' ')
      .trim()
      .split(/\s+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));

    const unique: number[] = Array.from(new Set<number>(cleaned));
    const maxNum = result.game === 'euromillones' ? 50 : 49;
    const validRange: number[] = unique.filter((n) => n >= 1 && n <= maxNum);

    if (validRange.length < maxRequiredNumbers) {
      setManualInputError(
        `Se necesitan exactamente ${maxRequiredNumbers} números válidos (encontrados ${validRange.length}).`
      );
      return;
    }

    setManualNumbers(validRange.slice(0, maxRequiredNumbers).sort((a: number, b: number) => a - b));
    setManualQuickInput('');
  };

  // Save manual draw to database
  const handleSaveManualToDatabase = () => {
    if (manualNumbers.length < maxRequiredNumbers) {
      setManualInputError(
        `Introduce al menos los ${maxRequiredNumbers} números ganadores para poder guardarlo.`
      );
      return;
    }

    if (onAddDraw) {
      const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = daysOfWeek[new Date(manualDate + 'T12:00:00Z').getDay()];

      const newDraw: LotteryDraw = {
        id: `${result.game}-${manualDate}-${Date.now()}`,
        game: result.game,
        date: manualDate,
        dayOfWeek: dayName,
        numbers: [...manualNumbers].sort((a, b) => a - b),
        complementario: manualComplementario,
        reintegro: manualReintegro,
        stars: manualStars.length > 0 ? [...manualStars].sort((a, b) => a - b) : undefined,
      };

      onAddDraw(newDraw);
      setManualSaveSuccess(true);
      setTimeout(() => setManualSaveSuccess(false), 3500);
    }
  };

  // Guarantee test helper
  const handleSimulateWithMyNumbers = () => {
    setGuaranteeTestDraw(result.selectedNumbers.slice(0, maxRequiredNumbers));
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-xs border transition-colors overflow-hidden ${
        result.game === 'primitiva'
          ? 'border-emerald-200/90'
          : result.game === 'bonoloto'
          ? 'border-blue-200/90'
          : 'border-amber-300/80'
      }`}
    >
      {/* Top Banner with Price and Summary */}
      <div
        className={`p-4 sm:p-6 border-b transition-colors ${
          result.game === 'primitiva'
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-400/50'
            : result.game === 'bonoloto'
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border-blue-400/50'
            : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 border-amber-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 border bg-white/20 text-white border-white/40 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>{plan.shortName} generada con éxito</span>
              <span className="uppercase opacity-85 font-semibold text-[10px] ml-1">
                ({result.game})
              </span>
            </div>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                result.game === 'euromillones' ? 'text-slate-950' : 'text-white'
              }`}
            >
              {result.columnsCount} Columnas Generadas
            </h2>
            <p
              className={`text-xs sm:text-sm mt-0.5 ${
                result.game === 'primitiva'
                  ? 'text-emerald-100'
                  : result.game === 'bonoloto'
                  ? 'text-blue-100'
                  : 'text-amber-950/85 font-medium'
              }`}
            >
              Jugando con <strong>{result.selectedNumbers.length} números</strong>{' '}
              {result.selectedStars ? `y ${result.selectedStars.length} estrellas` : ''} &bull;{' '}
              {plan.guaranteeText}
            </p>
          </div>

          {/* Big Price Box */}
          <div
            className={`backdrop-blur-md rounded-2xl p-3 sm:p-4 border-2 border-white/90 ring-2 ring-white/30 flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0 shadow-md ${
              result.game === 'primitiva'
                ? 'bg-emerald-950/50 text-white'
                : result.game === 'bonoloto'
                ? 'bg-blue-950/50 text-white'
                : 'bg-white/85 text-slate-950'
            }`}
          >
            <div className="text-left md:text-right">
              <span
                className={`text-[11px] uppercase tracking-wider block font-semibold ${
                  result.game === 'euromillones' ? 'text-amber-950' : 'text-slate-200'
                }`}
              >
                Importe Total ({result.columnsCount} × {result.pricePerBet.toFixed(2)} €)
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black font-mono ${
                  result.game === 'euromillones' ? 'text-slate-950' : 'text-white'
                }`}
              >
                {result.totalCost.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div
          className={`mt-4 pt-4 border-t flex flex-wrap items-center gap-2 ${
            result.game === 'primitiva'
              ? 'border-emerald-500/20'
              : result.game === 'bonoloto'
              ? 'border-blue-400/20'
              : 'border-amber-400/20'
          }`}
        >
          <button
            id="btn-print-pdf"
            onClick={onPrint}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 border ${
              result.game === 'primitiva'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 border-emerald-300 hover:from-emerald-400 hover:to-teal-300'
                : result.game === 'bonoloto'
                ? 'bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 text-slate-950 border-cyan-300 hover:from-cyan-300 hover:to-blue-300'
                : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 border-amber-300 hover:from-amber-300 hover:to-yellow-300'
            }`}
            title="Abre el cuadro de diálogo para imprimir o Guardar en PDF"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Imprimir / Guardar en PDF</span>
          </button>

          <button
            id="btn-copy-columns"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-slate-200 text-xs font-semibold border border-white/20 transition active:scale-95 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Columnas</span>
              </>
            )}
          </button>

          <button
            id="btn-save-combo"
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition active:scale-95 shadow-md border border-amber-300 cursor-pointer"
            title="Guarda esta combinación en Mis Peñas para consultarla o escrutarla en futuros sorteos"
          >
            <FolderHeart className="w-4 h-4 text-slate-950" />
            <span>Guardar en Mis Peñas</span>
          </button>

          <button
            id="btn-toggle-quality"
            type="button"
            onClick={() => setShowQualityAnalysis(!showQualityAnalysis)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-xs border cursor-pointer ${
              showQualityAnalysis
                ? 'bg-white text-slate-900 border-white ring-2 ring-white/40'
                : 'bg-black/35 hover:bg-black/55 text-slate-100 border-white/20'
            }`}
            title="Analiza la paridad (pares/impares), suma total y balance estadístico de las columnas"
          >
            <Scale className="w-4 h-4 text-emerald-300" />
            <span>Calidad & Equilibrio</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-bold">
              {qualityStats.optimalParityPercent}% óptimo
            </span>
          </button>

          <button
            id="btn-download-txt"
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-slate-200 text-xs font-semibold border border-white/20 transition active:scale-95 shadow-xs cursor-pointer"
            title="Descargar archivo .TXT legible con desglose completo"
          >
            <Download className="w-4 h-4" />
            <span>TXT</span>
          </button>

          <button
            id="btn-download-csv"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-slate-200 text-xs font-semibold border border-white/20 transition active:scale-95 shadow-xs cursor-pointer"
            title="Descargar archivo CSV compatible con Microsoft Excel y Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>CSV (Excel)</span>
          </button>

          <button
            id="btn-download-terminal"
            onClick={handleDownloadTerminal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-slate-200 text-xs font-semibold border border-white/20 transition active:scale-95 shadow-xs cursor-pointer"
            title="Descargar formato limpio de terminal SELAE para validación oficial en despacho de lotería"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Terminal SELAE</span>
          </button>
        </div>
      </div>

      {/* Save Toast Notification */}
      {saveSuccessToast && (
        <div className="bg-emerald-600 text-white px-5 py-2.5 flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessToast}</span>
          </div>
          <button
            onClick={() => setSaveSuccessToast(null)}
            className="text-emerald-200 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL DE CALIDAD Y EQUILIBRIO ESTADÍSTICO DE LAS COLUMNAS                  */}
      {/* ========================================================================= */}
      {showQualityAnalysis && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-4 sm:p-5 border-b border-slate-700 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Análisis de Calidad y Equilibrio de las {result.columnsCount} Columnas</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Campana de Gauss
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Comprueba la simetría de pares/impares y las sumas para evitar combinaciones descompensadas.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowQualityAnalysis(false)}
              className="text-xs text-slate-400 hover:text-white transition cursor-pointer self-start sm:self-auto"
            >
              Ocultar panel ▲
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Paridad (Pares / Impares) */}
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span>Equilibrio Par / Impar:</span>
                  <span className="text-emerald-400 text-[11px] font-semibold">
                    ({qualityStats.optimalParityPercent}% en rango óptimo)
                  </span>
                </span>
                {parityFilter !== 'all' && (
                  <button
                    onClick={() => setParityFilter('all')}
                    className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    Quitar filtro paridad
                  </button>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                {Object.entries(qualityStats.parityMap).map(([key, countVal]) => {
                  const count = Number(countVal) || 0;
                  const percent = Math.round((count / result.columnsCount) * 100);
                  const isFiltered = parityFilter === key;
                  const isOptimal =
                    result.game === 'euromillones'
                      ? key === '3P - 2I' || key === '2P - 3I'
                      : key === '3P - 3I' || key === '4P - 2I' || key === '2P - 4I';

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setParityFilter(isFiltered ? 'all' : key)}
                      className={`w-full text-left p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isFiltered
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                          : 'bg-slate-900/60 hover:bg-slate-700/60 border-slate-700/70 text-slate-200'
                      }`}
                      title={`Haz clic para filtrar las columnas con paridad ${key}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{key}</span>
                        {isOptimal && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              isFiltered
                                ? 'bg-slate-950 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/20'
                            }`}
                          >
                            Óptimo histórico
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <div className="w-24 bg-slate-700/50 rounded-full h-1.5 overflow-hidden hidden sm:block">
                          <div
                            className={`h-1.5 rounded-full ${
                              isFiltered ? 'bg-slate-950' : isOptimal ? 'bg-emerald-400' : 'bg-slate-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-bold">{count} col.</span>
                        <span className="text-[10px] opacity-75">({percent}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sumas de Columnas */}
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">
                    Distribución de Sumas (Total de números):
                  </span>
                  {sumRangeFilter !== 'all' && (
                    <button
                      onClick={() => setSumRangeFilter('all')}
                      className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Quitar filtro suma
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700 text-center">
                    <span className="text-[10px] text-slate-400 block">Suma Mínima</span>
                    <span className="text-sm font-black font-mono text-slate-200">
                      {qualityStats.minSum}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700 text-center ring-1 ring-emerald-500/50">
                    <span className="text-[10px] text-emerald-400 block font-semibold">
                      Suma Promedio
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-400">
                      {qualityStats.avgSum}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700 text-center">
                    <span className="text-[10px] text-slate-400 block">Suma Máxima</span>
                    <span className="text-sm font-black font-mono text-slate-200">
                      {qualityStats.maxSum}
                    </span>
                  </div>
                </div>

                {/* Sum Filters Buttons */}
                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSumRangeFilter(sumRangeFilter === 'optimo' ? 'all' : 'optimo')}
                    className={`w-full p-2 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                      sumRangeFilter === 'optimo'
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                        : 'bg-slate-900/60 hover:bg-slate-700/60 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span>
                      Rango Óptimo [{qualityStats.optimalSumMin} - {qualityStats.optimalSumMax}]
                    </span>
                    <span className="font-mono font-bold">
                      {qualityStats.sumMap.optimo} col. ({qualityStats.optimalSumPercent}%)
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSumRangeFilter(sumRangeFilter === 'bajo' ? 'all' : 'bajo')}
                      className={`p-2 rounded-lg border transition cursor-pointer text-left text-xs ${
                        sumRangeFilter === 'bajo'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-900/60 hover:bg-slate-700/60 border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="block opacity-75 text-[10px]">
                        Suma Baja (&lt;{qualityStats.optimalSumMin})
                      </span>
                      <span className="font-mono font-bold">
                        {qualityStats.sumMap.bajo} columnas
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSumRangeFilter(sumRangeFilter === 'alto' ? 'all' : 'alto')}
                      className={`p-2 rounded-lg border transition cursor-pointer text-left text-xs ${
                        sumRangeFilter === 'alto'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-900/60 hover:bg-slate-700/60 border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="block opacity-75 text-[10px]">
                        Suma Alta (&gt;{qualityStats.optimalSumMax})
                      </span>
                      <span className="font-mono font-bold">
                        {qualityStats.sumMap.alto} columnas
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  Tip: El 78% de los botes históricos caen dentro del rango óptimo de sumas.
                </span>
                {(parityFilter !== 'all' || sumRangeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setParityFilter('all');
                      setSumRangeFilter('all');
                    }}
                    className="text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Combination Dialog Modal */}
      <SaveCombinationDialog
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSaved={(comboName) => {
          setSaveSuccessToast(`¡Combinación "${comboName}" guardada en Mis Peñas!`);
          setTimeout(() => setSaveSuccessToast(null), 4000);
          onSavedCombination?.();
        }}
        game={result.game}
        selectedNumbers={result.selectedNumbers}
        selectedStars={result.selectedStars}
        guarantee={result.guarantee}
        columnsCount={result.columnsCount}
        totalCost={result.totalCost}
        pricePerBet={result.pricePerBet}
      />

      {/* ========================================================================= */}
      {/* ESCRUTADOR Y COMPROBADOR DE SORTEOS (AUTOMÁTICO / MANUAL) */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border shadow-xs ${
                result.game === 'primitiva'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : result.game === 'bonoloto'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                <span>Comprobar y Escrutar Columnas</span>
                <span className="text-xs font-normal text-slate-500">
                  (¿Cuántos aciertos y qué columnas ganan?)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Selecciona un sorteo descargado o introduce los números ganadores manualmente si aún
                no se ha descargado.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start md:self-auto">
            <button
              type="button"
              id="btn-mode-auto"
              onClick={() => setCheckerMode('auto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                checkerMode === 'auto'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Automático (Descargado)</span>
            </button>

            <button
              type="button"
              id="btn-mode-manual"
              onClick={() => setCheckerMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                checkerMode === 'manual'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Manual (No descargado)</span>
            </button>

            <button
              type="button"
              id="btn-mode-guarantee"
              onClick={() => {
                setCheckerMode('guarantee');
                if (guaranteeTestDraw.length === 0) {
                  handleSimulateWithMyNumbers();
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                checkerMode === 'guarantee'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Probar Garantía</span>
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* PANEL MODO AUTOMÁTICO */}
        {/* --------------------------------------------------------------------- */}
        {checkerMode === 'auto' && (
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label
                htmlFor="select-draw"
                className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Elegir sorteo del histórico oficial para comprobar:</span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {onSyncDatabase && (
                  <button
                    type="button"
                    id="btn-update-db-escrutador"
                    onClick={() => onSyncDatabase()}
                    disabled={isSyncingDatabase}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                    title="Actualizar base de datos para descargar sorteos recientes (incluyendo el de ayer)"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDatabase ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDatabase ? 'Actualizando BD...' : 'Actualizar Base de Datos'}</span>
                  </button>
                )}

                {gameDraws.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDrawId(gameDraws[0].id)}
                    className="text-xs text-indigo-700 font-bold hover:underline text-center sm:text-left py-1"
                  >
                    &larr; Comprobar con el último sorteo ({gameDraws[0].dayOfWeek},{' '}
                    {gameDraws[0].date})
                  </button>
                )}
              </div>
            </div>

            {gameDraws.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                No hay sorteos descargados aún para este juego. Puedes usar el modo{' '}
                <strong>Manual</strong> o sincronizar la base de datos arriba.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div className="md:col-span-2">
                  <div className="relative">
                    <select
                      id="select-draw"
                      value={selectedDrawId || (gameDraws[0] ? gameDraws[0].id : '')}
                      onChange={(e) => setSelectedDrawId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden appearance-none pr-9 cursor-pointer"
                    >
                      {gameDraws.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.dayOfWeek} {d.date} &rarr; [
                          {d.numbers.map((n) => n.toString().padStart(2, '0')).join(', ')}]
                          {d.complementario !== undefined ? ` | C: ${d.complementario}` : ''}
                          {d.reintegro !== undefined ? ` | R: ${d.reintegro}` : ''}
                          {d.stars && d.stars.length > 0 ? ` | ★ ${d.stars.join(', ')}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Quick navigation to last 3 draws */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500">Recientes:</span>
                  {gameDraws.slice(0, 3).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDrawId(d.id)}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold border transition ${
                        selectedDrawId === d.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {d.dayOfWeek.slice(0, 3)} {d.date.slice(5)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* PANEL MODO MANUAL */}
        {/* --------------------------------------------------------------------- */}
        {checkerMode === 'manual' && (
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Introduce la combinación del sorteo no descargado</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ideal para comprobar sorteos de hoy o sorteos que aún no se hayan descargado por
                  internet.
                </p>
              </div>

              {/* Clear button */}
              <button
                type="button"
                onClick={() => {
                  setManualNumbers([]);
                  setManualComplementario(undefined);
                  setManualReintegro(undefined);
                  setManualStars([]);
                  setManualInputError(null);
                }}
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar manual</span>
              </button>
            </div>

            {/* Quick text input and date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Fecha del sorteo:
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Escribir números rápidos (ej: 04 12 23 31 38 45):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Escribe los ${maxRequiredNumbers} números separados por espacio`}
                    value={manualQuickInput}
                    onChange={(e) => setManualQuickInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleParseManualQuickInput();
                    }}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleParseManualQuickInput}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    Cargar
                  </button>
                </div>
              </div>
            </div>

            {manualInputError && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-md p-2">
                {manualInputError}
              </p>
            )}

            {/* Number picker buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  O pulsa los {maxRequiredNumbers} números ganadores ({manualNumbers.length}/
                  {maxRequiredNumbers} elegidos):
                </span>
                {manualNumbers.length === maxRequiredNumbers && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ¡Combinación completa!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {Array.from(
                  { length: result.game === 'euromillones' ? 50 : 49 },
                  (_, i) => i + 1
                ).map((num) => {
                  const isSelected = manualNumbers.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => toggleManualNumber(num)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-105 shadow-xs font-black'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Extra inputs: Complementario & Reintegro or Stars */}
            {result.game === 'euromillones' ? (
              <div>
                <label className="text-xs font-bold text-amber-900 block mb-1">
                  Estrellas ganadoras (1-12) ({manualStars.length}/2):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => {
                    const isStarPicked = manualStars.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleManualStar(s)}
                        className={`w-7 h-7 rounded-full text-xs font-black transition cursor-pointer ${
                          isStarPicked
                            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-500 scale-105'
                            : 'bg-white text-slate-700 border border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        ★{s}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-purple-900 block mb-1">
                    Número Complementario (opcional 1-49):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="49"
                    placeholder="Ej: 14"
                    value={manualComplementario !== undefined ? manualComplementario : ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setManualComplementario(isNaN(val) ? undefined : val);
                    }}
                    className="w-full bg-purple-50/60 border border-purple-200 rounded-lg px-3 py-1.5 text-xs text-purple-950 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-blue-900 block mb-1">
                    Reintegro (opcional 0-9):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    placeholder="Ej: 7"
                    value={manualReintegro !== undefined ? manualReintegro : ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setManualReintegro(isNaN(val) ? undefined : val);
                    }}
                    className="w-full bg-blue-50/60 border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-blue-950 font-bold"
                  />
                </div>
              </div>
            )}

            {/* Save to database button */}
            {onAddDraw && manualNumbers.length === maxRequiredNumbers && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveManualToDatabase}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Guardar este sorteo en mi base de datos histórica</span>
                </button>

                {manualSaveSuccess && (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Sorteo guardado con éxito!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* PANEL MODO SIMULACIÓN DE GARANTÍA */}
        {/* --------------------------------------------------------------------- */}
        {checkerMode === 'guarantee' && (
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Simulador de Garantía Teórica ({plan.name})</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Comprueba que si los {maxRequiredNumbers} números premiados caen entre tus{' '}
                  {result.selectedNumbers.length} números elegidos, se cumple la garantía al 100%.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulateWithMyNumbers}
                className="text-xs text-indigo-700 font-bold hover:underline self-start sm:self-auto cursor-pointer"
              >
                Probar con mis primeros {maxRequiredNumbers} números &rarr;
              </button>
            </div>

            <div className="flex flex-wrap gap-1">
              {result.selectedNumbers.map((num) => {
                const isPicked = guaranteeTestDraw.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (isPicked) {
                        setGuaranteeTestDraw(guaranteeTestDraw.filter((n) => n !== num));
                      } else if (guaranteeTestDraw.length < maxRequiredNumbers) {
                        setGuaranteeTestDraw([...guaranteeTestDraw, num]);
                      }
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-black transition cursor-pointer ${
                      isPicked
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-105'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* COMBINACIÓN GANADORA ACTIVA & RESUMEN DE ESCRUTINIO */}
        {/* --------------------------------------------------------------------- */}
        {activeDrawInfo && activeDrawInfo.numbers.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-300/80 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              {/* Winning balls display */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    {activeDrawInfo.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Combinación Ganadora
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeDrawInfo.numbers.map((num) => (
                    <div
                      key={num}
                      className="w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-slate-700 font-black text-xs flex items-center justify-center shadow-xs"
                    >
                      {num}
                    </div>
                  ))}

                  {/* Complementario */}
                  {activeDrawInfo.complementario !== undefined && (
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                      <span className="text-[11px] font-bold text-purple-900">C:</span>
                      <div className="w-8 h-8 rounded-full bg-purple-700 text-white border-2 border-purple-500 font-black text-xs flex items-center justify-center shadow-xs">
                        {activeDrawInfo.complementario}
                      </div>
                    </div>
                  )}

                  {/* Reintegro */}
                  {activeDrawInfo.reintegro !== undefined && (
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                      <span className="text-[11px] font-bold text-blue-900">R:</span>
                      <div className="w-8 h-8 rounded-full bg-blue-700 text-white border-2 border-blue-500 font-black text-xs flex items-center justify-center shadow-xs">
                        {activeDrawInfo.reintegro}
                      </div>
                    </div>
                  )}

                  {/* Stars */}
                  {activeDrawInfo.stars && activeDrawInfo.stars.length > 0 && (
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                      <span className="text-[11px] font-bold text-amber-900">★:</span>
                      {activeDrawInfo.stars.map((s) => (
                        <div
                          key={s}
                          className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 border-2 border-amber-500 font-black text-xs flex items-center justify-center shadow-xs"
                        >
                          ★{s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Best Result Highlight */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-90">
                    Mejor Resultado
                  </span>
                  <span className="text-xl sm:text-2xl font-black">
                    {scrutinySummary.maxHits} Aciertos
                  </span>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* PANEL DE ASIGNACIÓN DE REINTEGROS (ADMINISTRACIÓN / BOLETO)       */}
            {/* ----------------------------------------------------------------- */}
            {result.game !== 'euromillones' && (
              <div className="bg-blue-50/70 border border-blue-200/90 rounded-2xl p-3 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-blue-600" />
                        Reintegro de tus Apuestas (0 - 9)
                      </span>
                      {activeDrawInfo?.reintegro !== undefined && (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-700 text-white shadow-2xs flex items-center gap-1">
                          <span>R. Ganador Sorteo:</span>
                          <span className="font-mono text-amber-300 underline font-black">{activeDrawInfo.reintegro}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-800/85 mt-0.5">
                      Los boletos oficiales de Loterías agrupan <strong>hasta 8 apuestas por resguardo</strong> (Boleto 1: Col. 01-08, Boleto 2: Col. 09-16...).
                      Asigna el reintegro por cada resguardo en 1 clic o a todas a la vez:
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 flex-wrap">
                    <button
                      type="button"
                      id="btn-simulate-boleto-reintegros"
                      onClick={handleSimulateBoletoReintegros}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-blue-300 text-blue-800 hover:bg-blue-100/80 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                      title="Asigna reintegros aleatorios por cada boleto oficial de 8 apuestas como hace el terminal de Loterías"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>🎲 Aleatorio por boletos (8 ap.)</span>
                    </button>
                    <button
                      type="button"
                      id="btn-clear-reintegros-all"
                      onClick={handleClearReintegros}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-red-700 hover:border-red-300 transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="Limpiar todos los reintegros asignados"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Limpiar todo</span>
                    </button>
                  </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 border-b border-blue-200/80 pb-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setReintegroMode('by_boleto')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      reintegroMode === 'by_boleto'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-100/60'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Por Boletos / Resguardos (8 apuestas por boleto)</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        reintegroMode === 'by_boleto' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {boletosList.length} {boletosList.length === 1 ? 'boleto' : 'boletos'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReintegroMode('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      reintegroMode === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-100/60'
                    }`}
                  >
                    <span>Mismo Reintegro a Todas (Col. 01 a {result.columnsCount})</span>
                  </button>
                </div>

                {/* Mode A: By Boleto (Col 1-8, 9-16, 17-24, etc.) */}
                {reintegroMode === 'by_boleto' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                      {boletosList.map((boleto) => {
                        const isWinning = boleto.isWinning;
                        const isMixed = boleto.reintegro === 'mixed';
                        const isAssigned = typeof boleto.reintegro === 'number';

                        return (
                          <div
                            key={boleto.boletoIndex}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isWinning
                                ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                                : isAssigned
                                ? 'bg-white border-blue-300 shadow-2xs'
                                : 'bg-white/80 border-blue-200/80'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 flex-wrap gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                                  <Ticket className="w-3.5 h-3.5 text-blue-600" />
                                  Boleto {boleto.boletoNumber}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                                  Cols {boleto.startCol.toString().padStart(2, '0')} - {boleto.endCol.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  ({boleto.columnsCount} ap.)
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {isWinning ? (
                                  <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    R: {boleto.reintegro} (¡Acertado! +{(boleto.columnsCount * result.pricePerBet).toFixed(2)} €)
                                  </span>
                                ) : isAssigned ? (
                                  <span className="text-[11px] font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                                    R: {boleto.reintegro}
                                  </span>
                                ) : isMixed ? (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                    R: Mixto
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">
                                    Sin asignar
                                  </span>
                                )}

                                {(isAssigned || isMixed) && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearBoletoReintegro(boleto.boletoIndex)}
                                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded text-xs ml-0.5 cursor-pointer"
                                    title={`Limpiar reintegro de Boleto ${boleto.boletoNumber} (Cols ${boleto.startCol} a ${boleto.endCol})`}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 0 to 9 quick-assignment buttons for this ticket */}
                            <div className="flex items-center justify-between gap-1">
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                                const isSelected = boleto.reintegro === num;
                                const isWinningDrawR = activeDrawInfo?.reintegro === num;

                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleSetBoletoReintegro(boleto.boletoIndex, num)}
                                    className={`flex-1 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                                      isSelected && isWinningDrawR
                                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-105 shadow-xs'
                                        : isSelected
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-105 shadow-xs'
                                        : isWinningDrawR
                                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-400 font-black hover:bg-emerald-100'
                                        : 'bg-slate-100/90 text-slate-700 hover:bg-blue-100 hover:text-blue-900 border border-transparent'
                                    }`}
                                    title={`Asignar Reintegro ${num} a las columnas ${boleto.startCol} a ${boleto.endCol} (Boleto ${boleto.boletoNumber})`}
                                  >
                                    {num}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-blue-900/75 pt-1">
                      💡 Pulsa el número de reintegro que aparece impreso en cada uno de tus resguardos de 8 apuestas.
                    </p>
                  </div>
                )}

                {/* Mode B: All columns at once */}
                {reintegroMode === 'all' && (
                  <div className="bg-white rounded-xl p-3 border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-bold text-blue-950">
                        Selecciona un número para aplicarlo a las {result.columnsCount} columnas simultáneamente:
                      </span>
                      {bulkReintegro !== undefined && (
                        <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Reintegro Global: {bulkReintegro}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                        const isSelected = bulkReintegro === num;
                        const isWinning = activeDrawInfo?.reintegro === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleSetAllReintegros(num)}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer shadow-2xs ${
                              isSelected
                                ? 'bg-blue-700 text-white ring-2 ring-blue-400 scale-105'
                                : isWinning
                                ? 'bg-blue-100 text-blue-950 border-2 border-blue-500 font-black hover:bg-blue-200'
                                : 'bg-slate-100 text-blue-900 border border-slate-200 hover:bg-blue-100/70'
                            }`}
                            title={`Asignar Reintegro ${num} a todas las apuestas (Col 01 a ${result.columnsCount})`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scrutiny Breakdown Cards */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Desglose de premios y aciertos en tus {result.columnsCount} columnas:</span>
                <span className="font-extrabold text-slate-900">
                  Total columnas con premio:{' '}
                  <strong className="text-emerald-700 font-black">
                    {scrutinySummary.totalPrizes}
                  </strong>
                </span>
              </div>

              <div className={`grid grid-cols-2 sm:grid-cols-4 ${result.game !== 'euromillones' ? 'md:grid-cols-7' : 'md:grid-cols-6'} gap-2`}>
                {/* 6 aciertos */}
                <button
                  type="button"
                  onClick={() => setHitsFilter(hitsFilter === 6 ? 'all' : 6)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    hitsFilter === 6
                      ? 'ring-2 ring-amber-500 bg-amber-100 border-amber-400 font-black'
                      : scrutinySummary.hitsCountMap[6] > 0
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold hover:bg-amber-100'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="text-[10px] block uppercase font-semibold text-slate-500">
                    6 Aciertos
                  </span>
                  <span className="text-lg font-black text-amber-900">
                    {scrutinySummary.hitsCountMap[6]}
                  </span>
                  <span className="text-[10px] block text-slate-500">columnas</span>
                </button>

                {/* 5 aciertos */}
                <button
                  type="button"
                  onClick={() => setHitsFilter(hitsFilter === 5 ? 'all' : 5)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    hitsFilter === 5
                      ? 'ring-2 ring-emerald-500 bg-emerald-100 border-emerald-400 font-black'
                      : scrutinySummary.hitsCountMap[5] > 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-100'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="text-[10px] block uppercase font-semibold text-slate-500">
                    5 Aciertos
                  </span>
                  <span className="text-lg font-black text-emerald-800">
                    {scrutinySummary.hitsCountMap[5]}
                  </span>
                  <span className="text-[10px] block text-slate-500">
                    {scrutinySummary.count5WithComplementary > 0
                      ? `(${scrutinySummary.count5WithComplementary} con C)`
                      : 'columnas'}
                  </span>
                </button>

                {/* 4 aciertos */}
                <button
                  type="button"
                  onClick={() => setHitsFilter(hitsFilter === 4 ? 'all' : 4)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    hitsFilter === 4
                      ? 'ring-2 ring-blue-500 bg-blue-100 border-blue-400 font-black'
                      : scrutinySummary.hitsCountMap[4] > 0
                      ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold hover:bg-blue-100'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="text-[10px] block uppercase font-semibold text-slate-500">
                    4 Aciertos
                  </span>
                  <span className="text-lg font-black text-blue-800">
                    {scrutinySummary.hitsCountMap[4]}
                  </span>
                  <span className="text-[10px] block text-slate-500">columnas</span>
                </button>

                {/* 3 aciertos */}
                <button
                  type="button"
                  onClick={() => setHitsFilter(hitsFilter === 3 ? 'all' : 3)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    hitsFilter === 3
                      ? 'ring-2 ring-teal-500 bg-teal-100 border-teal-400 font-black'
                      : scrutinySummary.hitsCountMap[3] > 0
                      ? 'bg-teal-50 border-teal-300 text-teal-950 font-bold hover:bg-teal-100'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="text-[10px] block uppercase font-semibold text-slate-500">
                    3 Aciertos
                  </span>
                  <span className="text-lg font-black text-teal-800">
                    {scrutinySummary.hitsCountMap[3]}
                  </span>
                  <span className="text-[10px] block text-slate-500">columnas</span>
                </button>

                {/* 2 aciertos */}
                <button
                  type="button"
                  onClick={() => setHitsFilter(hitsFilter === 2 ? 'all' : 2)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    hitsFilter === 2
                      ? 'ring-2 ring-slate-500 bg-slate-200 border-slate-400 font-black'
                      : scrutinySummary.hitsCountMap[2] > 0
                      ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="text-[10px] block uppercase font-semibold text-slate-500">
                    2 Aciertos
                  </span>
                  <span className="text-lg font-black text-slate-700">
                    {scrutinySummary.hitsCountMap[2]}
                  </span>
                  <span className="text-[10px] block text-slate-500">columnas</span>
                </button>

                {/* ≤ 1 aciertos */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center opacity-60">
                  <span className="text-[10px] block uppercase font-semibold text-slate-500">
                    0 - 1 Aciertos
                  </span>
                  <span className="text-lg font-black text-slate-600">
                    {scrutinySummary.hitsCountMap[1] + scrutinySummary.hitsCountMap[0]}
                  </span>
                  <span className="text-[10px] block text-slate-500">columnas</span>
                </div>

                {/* Reintegro card (Primitiva / Bonoloto) */}
                {result.game !== 'euromillones' && (
                  <button
                    type="button"
                    onClick={() => setHitsFilter(hitsFilter === 'reintegro' ? 'all' : 'reintegro')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      hitsFilter === 'reintegro'
                        ? 'ring-2 ring-blue-500 bg-blue-100 border-blue-400 font-black'
                        : scrutinySummary.reintegrosWonCount > 0
                        ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold hover:bg-blue-100'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] block uppercase font-semibold text-blue-700">
                      Reintegro {activeDrawInfo?.reintegro !== undefined ? `(R: ${activeDrawInfo.reintegro})` : ''}
                    </span>
                    <span className="text-lg font-black text-blue-900">
                      {scrutinySummary.reintegrosWonCount}
                    </span>
                    <span className="text-[10px] block text-slate-500">
                      {scrutinySummary.reintegrosWonCount > 0 ? 'reembolsos' : 'aciertos'}
                    </span>
                  </button>
                )}
              </div>

              {/* View filters and sorting */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    Mostrar:
                  </span>
                  <button
                    type="button"
                    onClick={() => setHitsFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                      hitsFilter === 'all'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Todas ({result.columnsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHitsFilter('prizes_only')}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                      hitsFilter === 'prizes_only'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    Solo premiadas ({scrutinySummary.totalPrizes})
                  </button>
                  {result.game !== 'euromillones' && (
                    <button
                      type="button"
                      onClick={() => setHitsFilter(hitsFilter === 'reintegro' ? 'all' : 'reintegro')}
                      className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                        hitsFilter === 'reintegro'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      Con Reintegro ({scrutinySummary.reintegrosWonCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-slate-500">Orden:</span>
                  <button
                    type="button"
                    onClick={() => setSortByHits(false)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      !sortByHits
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Orden de columna (1, 2, 3...)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortByHits(true)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                      sortByHits
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Más aciertos arriba</span>
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* BALANCE ECONÓMICO (INVERSIÓN VS PREMIOS)                      */}
              {/* ------------------------------------------------------------- */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-black">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>Balance Económico del Sorteo</span>
                        <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Inversión vs Premios
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Rendimiento financiero calculado para tus {result.columnsCount} columnas en este sorteo
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPrizeAdjuster(!showPrizeAdjuster)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition shadow-2xs self-start sm:self-auto cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>{showPrizeAdjuster ? 'Ocultar ajuste de importes' : 'Ajustar importes oficiales'}</span>
                  </button>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  {/* Inversión */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                      Inversión Total
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-black font-mono text-slate-800">
                        {financialSummary.invested.toFixed(2)} €
                      </span>
                      <span className="text-[10px] text-slate-400">({result.columnsCount} ap.)</span>
                    </div>
                  </div>

                  {/* Premios Cobrados */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                      Premios Obtenidos
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={`text-xl font-black font-mono ${
                          financialSummary.totalWon > 0 ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        {financialSummary.totalWon.toFixed(2)} €
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({financialSummary.categoryBreakdown.reduce((acc, c) => acc + c.count, 0)} prem.)
                      </span>
                    </div>
                  </div>

                  {/* Balance Neto */}
                  <div
                    className={`rounded-xl p-3 border shadow-2xs ${
                      financialSummary.netProfit >= 0
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase block tracking-wider opacity-75">
                      Balance Neto
                    </span>
                    <div className="flex items-center gap-1 mt-0.5 font-mono">
                      {financialSummary.netProfit >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="text-xl font-black">
                        {financialSummary.netProfit >= 0 ? '+' : ''}
                        {financialSummary.netProfit.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Retorno / ROI */}
                  <div
                    className={`rounded-xl p-3 border shadow-2xs ${
                      financialSummary.roi >= 0
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase block tracking-wider opacity-75">
                      Retorno (ROI)
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5 font-mono">
                      <span className="text-xl font-black">
                        {financialSummary.roi >= 0 ? '+' : ''}
                        {financialSummary.roi.toFixed(1)}%
                      </span>
                      <span className="text-[10px] opacity-75">rentabilidad</span>
                    </div>
                  </div>
                </div>

                {/* Optional Custom Prize Adjuster Form */}
                {showPrizeAdjuster && (
                  <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200 mb-3 space-y-2 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                        Ajustar importes oficiales de premios para este sorteo (€ por acierto):
                      </span>
                      <button
                        type="button"
                        onClick={() => setCustomPrizeValues({})}
                        className="text-[11px] text-amber-800 hover:underline font-semibold cursor-pointer"
                      >
                        Restablecer valores estimados
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                      {Object.entries(financialSummary.effectivePrices).map(([pKey, pVal]) => (
                        <div key={pKey} className="bg-white p-2 rounded-lg border border-amber-200">
                          <label className="text-[10px] font-bold text-slate-600 block truncate mb-1" title={pKey}>
                            {pKey}
                          </label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={pVal}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setCustomPrizeValues((prev) => ({
                                  ...prev,
                                  [pKey]: isNaN(v) ? 0 : v,
                                }));
                              }}
                              className="w-full text-xs font-mono font-bold px-1.5 py-0.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="text-[10px] text-slate-400 ml-1 font-bold">€</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorías premiadas detalle */}
                {financialSummary.categoryBreakdown.length > 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <div className="bg-slate-100/70 px-4 py-2 font-bold text-slate-700 flex items-center justify-between">
                      <span>Categorías con premio obtenidas</span>
                      <span>Total a cobrar</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {financialSummary.categoryBreakdown.map((item, idx) => (
                        <div key={idx} className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                              {item.count}
                            </span>
                            <span className="font-bold text-slate-800">{item.category}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({item.count} × {item.amountPerPrize.toFixed(2)} €)
                            </span>
                          </div>
                          <span className="font-mono font-black text-emerald-700 text-sm">
                            +{item.totalCategory.toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center text-xs text-slate-500">
                    En este sorteo ninguna columna ha alcanzado el mínimo para premio (≥3 aciertos).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* GRID DE COLUMNAS CON ESCRUTINIO DESTACADO */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800">
              Mostrando {displayedColumns.length} de {result.columnsCount} columnas
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {sortByHits && activeDrawInfo
                ? 'Orden: Más aciertos primero'
                : `Orden correlativo: Col 01 a Col ${result.columnsCount.toString().padStart(2, '0')}`}
            </span>
            {hitsFilter !== 'all' && (
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                Filtro activo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeDrawInfo && (
              <button
                type="button"
                onClick={() => setSortByHits(!sortByHits)}
                className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                title={sortByHits ? 'Volver al orden natural de columnas' : 'Ordenar con más aciertos arriba'}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>{sortByHits ? 'Ver en orden de columna (1, 2, 3...)' : 'Ver más aciertos arriba'}</span>
              </button>
            )}

            {hitsFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setHitsFilter('all')}
                className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Quitar filtro y ver todas
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {displayedColumns.map((col) => {
            const isTopPrize = activeDrawInfo && (col.numberHits >= 5 || (col.numberHits === 6 && col.hasReintegro));
            const isMediumPrize = activeDrawInfo && (col.numberHits >= 3 || col.hasReintegro);

            return (
              <div
                key={col.id}
                id={`column-card-${col.id}`}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isTopPrize
                    ? 'bg-gradient-to-b from-amber-50 to-emerald-50/80 border-emerald-500 ring-2 ring-emerald-400/50 shadow-md scale-[1.01]'
                    : isMediumPrize
                    ? col.numberHits >= 3
                      ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-300/40 shadow-xs'
                      : 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300/40 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/80 flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold font-mono text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Columna {col.id.toString().padStart(2, '0')}
                    </span>
                    {result.game !== 'euromillones' && (
                      <span
                        className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                        title={`Boleto oficial ${Math.floor((col.id - 1) / 8) + 1} (Apuestas ${Math.floor((col.id - 1) / 8) * 8 + 1} a ${Math.min((Math.floor((col.id - 1) / 8) + 1) * 8, result.columnsCount)})`}
                      >
                        Boleto {Math.floor((col.id - 1) / 8) + 1}
                      </span>
                    )}

                    {/* Reintegro selector/indicator for Primitiva & Bonoloto */}
                    {result.game !== 'euromillones' && (
                      <div className="flex items-center gap-1">
                        <label htmlFor={`col-reintegro-select-${col.id}`} className="sr-only">
                          Reintegro Columna {col.id}
                        </label>
                        <select
                          id={`col-reintegro-select-${col.id}`}
                          value={col.reintegro !== undefined ? col.reintegro : ''}
                          onChange={(e) =>
                            handleSetColumnReintegro(
                              col.id,
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className={`text-xs font-black px-1.5 py-0.5 rounded-md border transition cursor-pointer ${
                            col.hasReintegro
                              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400 shadow-2xs font-extrabold'
                              : col.reintegro !== undefined
                              ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold'
                              : 'bg-white text-slate-400 border-dashed border-slate-300 hover:border-slate-400'
                          }`}
                          title="Haz clic para seleccionar el reintegro de este resguardo/columna"
                        >
                          <option value="">R: —</option>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => (
                            <option key={r} value={r}>
                              R: {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Scrutiny badge */}
                  {activeDrawInfo && (
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${
                        col.numberHits === 6
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-500'
                          : col.numberHits === 5
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                          : col.numberHits === 4
                          ? 'bg-blue-600 text-white'
                          : col.numberHits === 3
                          ? 'bg-teal-600 text-white'
                          : col.hasReintegro
                          ? 'bg-blue-600 text-white ring-1 ring-blue-300'
                          : col.numberHits === 2
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {col.numberHits >= 5 && <Trophy className="w-3 h-3" />}
                      <span>
                        {col.numberHits} aciertos
                        {col.hasComplementario && ' + C'}
                        {col.hasReintegro && ' + R'}
                      </span>
                    </span>
                  )}
                </div>

                {/* Numbers Lottery Balls */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {col.numbers.map((num) => {
                    const isHit = activeDrawInfo && col.hitNumbers.includes(num);
                    const isComplementarioHit =
                      activeDrawInfo &&
                      activeDrawInfo.complementario !== undefined &&
                      activeDrawInfo.complementario === num;

                    return (
                      <div
                        key={num}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-2xs border transition-all ${
                          isHit
                            ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400 scale-105 shadow-md'
                            : isComplementarioHit
                            ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-300'
                            : 'bg-white text-slate-900 border-slate-300'
                        }`}
                        title={
                          isHit
                            ? `¡Número ${num} acertado!`
                            : isComplementarioHit
                            ? `¡Número Complementario ${num}!`
                            : `Número ${num}`
                        }
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>

                {/* Stars if Euromillones */}
                {col.stars && col.stars.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-amber-800 mr-1">
                      Estrellas:
                    </span>
                    {col.stars.map((star) => {
                      const isStarHit = activeDrawInfo && col.hitStars.includes(star);
                      return (
                        <div
                          key={star}
                          className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shadow-2xs transition ${
                            isStarHit
                              ? 'bg-amber-400 text-slate-950 border-2 border-amber-600 ring-2 ring-amber-300 scale-105'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          ★{star}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reintegro refund callout if matched */}
                {col.hasReintegro && (
                  <div className="mt-2.5 pt-1.5 border-t border-blue-200/80 flex items-center justify-between text-[11px] font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded-md">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                      Reintegro Acertado (R: {col.reintegro})
                    </span>
                    <span className="font-black text-blue-950">
                      Reembolso: +{result.pricePerBet.toFixed(2)} €
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
