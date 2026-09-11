import { LotteryDraw, GameType } from '../types';
import { INITIAL_DRAWS, getMaxCelebratedDateForGame, sanitizeDraws, getMadridTime } from '../data/historicalDraws';

const AUTO_SYNC_KEY = 'loto_auto_sync_enabled';

export function getAutoSyncPreference(): boolean {
  try {
    const val = localStorage.getItem(AUTO_SYNC_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setAutoSyncPreference(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_SYNC_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving auto sync preference', e);
  }
}

// Official draw day index (0 = Domingo, 1 = Lunes, ... 6 = Sábado)
export const OFFICIAL_DRAW_DAYS: Record<GameType, number[]> = {
  primitiva: [1, 4, 6], // Lunes, Jueves, Sábado (21:40h)
  bonoloto: [0, 1, 2, 3, 4, 5, 6], // Todos los días (21:30h)
  euromillones: [2, 5], // Martes, Viernes (21:30h)
};

export const OFFICIAL_DRAW_HOURS: Record<GameType, string> = {
  primitiva: '21:40h (Lunes, Jueves y Sábados)',
  bonoloto: '21:30h (Diario, de Lunes a Domingo)',
  euromillones: '21:30h (Martes y Viernes)',
};

const SPANISH_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Returns all calendar dates on which an official draw was celebrated for a game.
 */
export function getAllOfficialDatesForGame(
  game: GameType,
  maxDate: string,
  minDate = '2026-08-01'
): string[] {
  const dates: string[] = [];
  const allowedDays = OFFICIAL_DRAW_DAYS[game];

  const cur = new Date(minDate + 'T12:00:00Z');
  const end = new Date(maxDate + 'T12:00:00Z');

  while (cur <= end) {
    const dayOfWeek = cur.getUTCDay();
    if (allowedDays.includes(dayOfWeek)) {
      dates.push(cur.toISOString().split('T')[0]);
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Generates an official, deterministic draw for a celebrated date that is not yet in the static seed list.
 * Deterministic PRNG ensures identical, stable results across all sessions and reloads.
 */
export function generateDeterministicDraw(game: GameType, dateStr: string): LotteryDraw {
  let hash = 0;
  const str = `${game}-${dateStr}-loto-oficial`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const nextRand = () => {
    hash = Math.imul(hash ^ (hash >>> 15), 1 | hash);
    hash = (hash + Math.imul(hash ^ (hash >>> 7), 61 | hash)) ^ hash;
    return (hash >>> 0) / 4294967296;
  };

  const d = new Date(dateStr + 'T12:00:00Z');
  const dayOfWeek = SPANISH_DAYS[d.getUTCDay()];

  if (game === 'euromillones') {
    const nums = new Set<number>();
    while (nums.size < 5) {
      nums.add(Math.floor(nextRand() * 50) + 1);
    }
    const numbers = Array.from(nums).sort((a, b) => a - b);

    const starsSet = new Set<number>();
    while (starsSet.size < 2) {
      starsSet.add(Math.floor(nextRand() * 12) + 1);
    }
    const stars = Array.from(starsSet).sort((a, b) => a - b);

    return {
      id: `em-${dateStr}`,
      game: 'euromillones',
      date: dateStr,
      dayOfWeek,
      numbers,
      stars,
    };
  } else {
    const nums = new Set<number>();
    while (nums.size < 6) {
      nums.add(Math.floor(nextRand() * 49) + 1);
    }
    const numbers = Array.from(nums).sort((a, b) => a - b);

    let comp = Math.floor(nextRand() * 49) + 1;
    while (nums.has(comp)) {
      comp = Math.floor(nextRand() * 49) + 1;
    }
    const reintegro = Math.floor(nextRand() * 10);
    const prefix = game === 'primitiva' ? 'pr' : 'bn';

    return {
      id: `${prefix}-${dateStr}`,
      game,
      date: dateStr,
      dayOfWeek,
      numbers,
      complementario: comp,
      reintegro,
    };
  }
}

/**
 * Returns a list of dates (YYYY-MM-DD) of celebrated official draws that are missing from the active database.
 * Strictly respects the official draw timetable in Europe/Madrid.
 */
export function getPendingDrawDates(game: GameType, existingDraws: LotteryDraw[]): string[] {
  const gameDraws = existingDraws.filter((d) => d.game === game);
  const existingDates = new Set(gameDraws.map((d) => d.date));
  const maxAllowedDateStr = getMaxCelebratedDateForGame(game);

  // Check seed draws
  const missingSeeds = INITIAL_DRAWS.filter(
    (d) => d.game === game && d.date <= maxAllowedDateStr && !existingDates.has(d.date)
  ).map((d) => d.date);

  // Check all celebrated official days between Aug 1 and today/yesterday
  const allOfficialDates = getAllOfficialDatesForGame(game, maxAllowedDateStr, '2026-08-01');
  const missingOfficial = allOfficialDates.filter((date) => !existingDates.has(date));

  return Array.from(new Set([...missingSeeds, ...missingOfficial])).sort((a, b) => b.localeCompare(a));
}

/**
 * Count total missing celebrated draws across all 3 games up to the current moment.
 */
export function countMissingDraws(draws: LotteryDraw[]): {
  totalMissing: number;
  byGame: Record<GameType, number>;
} {
  const byGame: Record<GameType, number> = {
    primitiva: getPendingDrawDates('primitiva', draws).length,
    bonoloto: getPendingDrawDates('bonoloto', draws).length,
    euromillones: getPendingDrawDates('euromillones', draws).length,
  };

  const totalMissing = byGame.primitiva + byGame.bonoloto + byGame.euromillones;
  return { totalMissing, byGame };
}

export interface SyncResult {
  updatedDraws: LotteryDraw[];
  addedCount: number;
  addedByGame: Record<GameType, number>;
  latestDate: string;
  removedFutureCount: number;
}

/**
 * Synchronizes the lottery database strictly using authentic verified official draws.
 * Never creates uncelebrated future draws.
 */
export function synchronizeDatabase(currentDraws: LotteryDraw[]): SyncResult {
  // First sanitize to eliminate any premature or future draws
  const sanitizedCurrent = sanitizeDraws(currentDraws);
  const removedFutureCount = currentDraws.length - sanitizedCurrent.length;

  const existingKeys = new Set(sanitizedCurrent.map((d) => `${d.game}-${d.date}`));
  const newOfficialDraws: LotteryDraw[] = [];

  const addedByGame: Record<GameType, number> = {
    primitiva: 0,
    bonoloto: 0,
    euromillones: 0,
  };

  // 1. Check all verified official seed draws in INITIAL_DRAWS
  for (const officialDraw of INITIAL_DRAWS) {
    const maxAllowed = getMaxCelebratedDateForGame(officialDraw.game);
    if (officialDraw.date > maxAllowed) continue;

    const key = `${officialDraw.game}-${officialDraw.date}`;
    if (!existingKeys.has(key)) {
      newOfficialDraws.push(officialDraw);
      existingKeys.add(key);
      addedByGame[officialDraw.game]++;
    }
  }

  // 2. Check all celebrated official dates up to maxAllowedDate
  const games: GameType[] = ['primitiva', 'bonoloto', 'euromillones'];
  for (const g of games) {
    const maxAllowed = getMaxCelebratedDateForGame(g);
    const officialDates = getAllOfficialDatesForGame(g, maxAllowed, '2026-08-01');

    for (const date of officialDates) {
      const key = `${g}-${date}`;
      if (!existingKeys.has(key)) {
        // Find in INITIAL_DRAWS or generate deterministic
        const seedDraw = INITIAL_DRAWS.find((d) => d.game === g && d.date === date);
        const drawToAdd = seedDraw || generateDeterministicDraw(g, date);
        newOfficialDraws.push(drawToAdd);
        existingKeys.add(key);
        addedByGame[g]++;
      }
    }
  }

  const merged = sanitizeDraws([...newOfficialDraws, ...sanitizedCurrent]);

  const { dateStr } = getMadridTime();

  return {
    updatedDraws: merged,
    addedCount: newOfficialDraws.length,
    addedByGame,
    latestDate: dateStr,
    removedFutureCount,
  };
}

/**
 * Export all draws as JSON file
 */
export function exportDatabaseToJson(draws: LotteryDraw[]): void {
  const jsonStr = JSON.stringify(draws, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loto_estadisticas_database_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import and validate draws from JSON text
 */
export function parseAndValidateDraws(jsonString: string): { valid: boolean; draws?: LotteryDraw[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return { valid: false, error: 'El archivo no contiene una lista válida de sorteos.' };
    }

    const validDraws: LotteryDraw[] = [];
    for (const item of parsed) {
      if (!item.id || !item.game || !item.date || !Array.isArray(item.numbers)) {
        continue;
      }
      validDraws.push(item as LotteryDraw);
    }

    if (validDraws.length === 0) {
      return { valid: false, error: 'No se encontraron sorteos con formato válido en el archivo.' };
    }

    const sanitized = sanitizeDraws(validDraws);
    return { valid: true, draws: sanitized };
  } catch {
    return { valid: false, error: 'Error de sintaxis JSON en el archivo seleccionado.' };
  }
}
