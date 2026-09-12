import { LotteryDraw, GameType, NumberStat, PeriodFilterState, SelectionCriterion } from '../types';

export const GAME_DRAW_DAYS: Record<GameType, string[]> = {
  primitiva: ['Lunes', 'Jueves', 'Sábado'],
  bonoloto: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  euromillones: ['Martes', 'Viernes'],
};

export const DEFAULT_PRICES: Record<GameType, number> = {
  primitiva: 1.00,
  bonoloto: 0.50,
  euromillones: 2.50,
};

export function getPresetDates(preset: PeriodFilterState['preset']): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];

  const target = new Date(now.getTime());

  switch (preset) {
    case '1m':
      target.setMonth(target.getMonth() - 1);
      break;
    case '3m':
      target.setMonth(target.getMonth() - 3);
      break;
    case '6m':
      target.setMonth(target.getMonth() - 6);
      break;
    case '1y':
      target.setFullYear(target.getFullYear() - 1);
      break;
    case '2y':
      target.setFullYear(target.getFullYear() - 2);
      break;
    case 'all':
    default:
      return { startDate: '2020-01-01', endDate };
  }

  const startDate = target.toISOString().split('T')[0];
  return { startDate, endDate };
}

export function filterDraws(
  draws: LotteryDraw[],
  game: GameType,
  startDate?: string,
  endDate?: string,
  selectedDay?: string
): LotteryDraw[] {
  return draws.filter((draw) => {
    if (draw.game !== game) return false;
    if (startDate && draw.date < startDate) return false;
    if (endDate && draw.date > endDate) return false;
    if (selectedDay && selectedDay !== 'all' && draw.dayOfWeek !== selectedDay) return false;
    return true;
  });
}

export function calculateLotteryStats(
  draws: LotteryDraw[],
  game: GameType,
  isStar = false
): NumberStat[] {
  const drawDays = GAME_DRAW_DAYS[game];
  const maxNumber = isStar ? 12 : game === 'euromillones' ? 50 : 49;
  const totalDraws = draws.length;

  const statsMap: Map<number, NumberStat> = new Map();

  for (let n = 1; n <= maxNumber; n++) {
    const byDay: Record<string, number> = {};
    drawDays.forEach((d) => {
      byDay[d] = 0;
    });

    statsMap.set(n, {
      number: n,
      totalCount: 0,
      percentage: 0,
      byDay,
      lastDrawnDate: undefined,
      isStar,
    });
  }

  // Iterate over draws sorted chronologically
  const sortedDraws = [...draws].sort((a, b) => a.date.localeCompare(b.date));

  // Map to store appearance indices for each number to calculate delays and streaks
  const appearanceIndices: Map<number, number[]> = new Map();
  for (let n = 1; n <= maxNumber; n++) {
    appearanceIndices.set(n, []);
  }

  sortedDraws.forEach((draw, drawIndex) => {
    const numbersToCheck = isStar ? draw.stars || [] : draw.numbers;
    const day = draw.dayOfWeek;

    numbersToCheck.forEach((num) => {
      const stat = statsMap.get(num);
      if (stat) {
        stat.totalCount += 1;
        if (stat.byDay[day] !== undefined) {
          stat.byDay[day] += 1;
        } else {
          stat.byDay[day] = 1;
        }
        stat.lastDrawnDate = draw.date;
      }
      const indices = appearanceIndices.get(num);
      if (indices) {
        indices.push(drawIndex);
      }
    });
  });

  const results: NumberStat[] = Array.from(statsMap.values()).map((stat) => {
    const indices = appearanceIndices.get(stat.number) || [];
    let currentDelay = totalDraws;
    let maxDelay = totalDraws;
    let streak = 0;

    if (totalDraws > 0) {
      if (indices.length === 0) {
        currentDelay = totalDraws;
        maxDelay = totalDraws;
        streak = 0;
      } else {
        const lastIndex = indices[indices.length - 1];
        currentDelay = totalDraws - 1 - lastIndex;

        // Calculate max delay between appearances
        let maxGap = indices[0]; // delay before first appearance
        for (let i = 0; i < indices.length - 1; i++) {
          const gap = indices[i + 1] - indices[i] - 1;
          if (gap > maxGap) maxGap = gap;
        }
        const gapAfterLast = totalDraws - 1 - lastIndex;
        if (gapAfterLast > maxGap) maxGap = gapAfterLast;
        maxDelay = maxGap;

        // Calculate current streak
        let checkIdx = totalDraws - 1;
        let s = 0;
        while (checkIdx >= 0) {
          const drawToCheck = isStar
            ? sortedDraws[checkIdx].stars || []
            : sortedDraws[checkIdx].numbers;
          if (drawToCheck.includes(stat.number)) {
            s++;
            checkIdx--;
          } else {
            break;
          }
        }
        streak = s;
      }
    }

    return {
      ...stat,
      percentage: totalDraws > 0 ? Number(((stat.totalCount / totalDraws) * 100).toFixed(1)) : 0,
      currentDelay,
      maxDelay,
      streak,
    };
  });

  // Sort descending by totalCount, then by number ascending
  results.sort((a, b) => {
    if (b.totalCount !== a.totalCount) {
      return b.totalCount - a.totalCount;
    }
    return a.number - b.number;
  });

  return results;
}

/**
 * Selects N numbers or stars based on statistical criterion:
 * - 'frequency': Top by totalCount descending (más frecuentes)
 * - 'delay_desc': Top by currentDelay descending (mayor atraso)
 * - 'streak': Top by streak descending, then by currentDelay ascending (en racha / calientes)
 * - 'balanced': 50% top frequency + 50% top delay (equilibrado / mixto)
 */
export function selectByCriterion(
  stats: NumberStat[],
  count: number,
  criterion: SelectionCriterion = 'frequency'
): number[] {
  if (!stats || stats.length === 0 || count <= 0) return [];
  const safeCount = Math.min(count, stats.length);

  if (criterion === 'frequency') {
    const sorted = [...stats].sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.number - b.number;
    });
    return sorted.slice(0, safeCount).map((s) => s.number);
  }

  if (criterion === 'delay_desc') {
    const sorted = [...stats].sort((a, b) => {
      if (b.currentDelay !== a.currentDelay) return b.currentDelay - a.currentDelay;
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.number - b.number;
    });
    return sorted.slice(0, safeCount).map((s) => s.number);
  }

  if (criterion === 'streak') {
    const sorted = [...stats].sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      if (a.currentDelay !== b.currentDelay) return a.currentDelay - b.currentDelay;
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.number - b.number;
    });
    return sorted.slice(0, safeCount).map((s) => s.number);
  }

  if (criterion === 'balanced') {
    const half = Math.ceil(safeCount / 2);
    const freqSorted = [...stats].sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.number - b.number;
    });
    const delaySorted = [...stats].sort((a, b) => {
      if (b.currentDelay !== a.currentDelay) return b.currentDelay - a.currentDelay;
      return a.number - b.number;
    });

    const chosen = new Set<number>();
    for (const s of freqSorted) {
      if (chosen.size >= half) break;
      chosen.add(s.number);
    }
    for (const s of delaySorted) {
      if (chosen.size >= safeCount) break;
      chosen.add(s.number);
    }
    for (const s of freqSorted) {
      if (chosen.size >= safeCount) break;
      chosen.add(s.number);
    }

    return Array.from(chosen).sort((a, b) => a - b);
  }

  return stats.slice(0, safeCount).map((s) => s.number);
}
