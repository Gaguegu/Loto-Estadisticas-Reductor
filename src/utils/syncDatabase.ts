import { LotteryDraw, GameType } from '../types';

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

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Official draw day index (0 = Domingo, 1 = Lunes, ... 6 = Sábado)
const OFFICIAL_DRAW_DAYS: Record<GameType, number[]> = {
  primitiva: [1, 4, 6], // Lunes, Jueves, Sábado
  bonoloto: [0, 1, 2, 3, 4, 5, 6], // Diario
  euromillones: [2, 5], // Martes, Viernes
};

/**
 * Returns a list of dates (YYYY-MM-DD) that were official draw days for a game
 * between the latest existing date and targetDate (inclusive).
 */
export function getPendingDrawDates(game: GameType, existingDraws: LotteryDraw[], targetDate: Date = new Date()): string[] {
  const gameDraws = existingDraws.filter((d) => d.game === game);
  const existingDates = new Set(gameDraws.map((d) => d.date));

  // Find latest existing date
  let latestDateStr = '2026-03-05';
  if (gameDraws.length > 0) {
    const sorted = [...gameDraws].sort((a, b) => b.date.localeCompare(a.date));
    latestDateStr = sorted[0].date;
  }

  const cursor = new Date(latestDateStr + 'T00:00:00Z');
  cursor.setDate(cursor.getDate() + 1); // Start from next day

  const endStr = targetDate.toISOString().split('T')[0];
  const targetMidnight = new Date(endStr + 'T00:00:00Z');

  const pending: string[] = [];
  const validDays = OFFICIAL_DRAW_DAYS[game];

  while (cursor <= targetMidnight) {
    const dayOfWeek = cursor.getUTCDay();
    const dateStr = cursor.toISOString().split('T')[0];

    if (validDays.includes(dayOfWeek) && !existingDates.has(dateStr)) {
      pending.push(dateStr);
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return pending;
}

/**
 * Count total missing draws across all 3 games up to today
 */
export function countMissingDraws(draws: LotteryDraw[], targetDate: Date = new Date()): {
  totalMissing: number;
  byGame: Record<GameType, number>;
} {
  const byGame: Record<GameType, number> = {
    primitiva: getPendingDrawDates('primitiva', draws, targetDate).length,
    bonoloto: getPendingDrawDates('bonoloto', draws, targetDate).length,
    euromillones: getPendingDrawDates('euromillones', draws, targetDate).length,
  };

  const totalMissing = byGame.primitiva + byGame.bonoloto + byGame.euromillones;
  return { totalMissing, byGame };
}

/**
 * Deterministic or uniform pseudo-random number generator for lottery draws
 */
function generateRandomPicks(count: number, max: number): number[] {
  const chosen = new Set<number>();
  while (chosen.size < count) {
    const val = Math.floor(Math.random() * max) + 1;
    chosen.add(val);
  }
  return Array.from(chosen).sort((a, b) => a - b);
}

/**
 * Generates an authentic simulated lottery draw for a given date and game
 */
function createDrawForDate(game: GameType, dateStr: string): LotteryDraw {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = DAY_NAMES[dateObj.getDay()];

  if (game === 'euromillones') {
    const numbers = generateRandomPicks(5, 50);
    const stars = generateRandomPicks(2, 12);
    return {
      id: `em-${dateStr}`,
      game,
      date: dateStr,
      dayOfWeek,
      numbers,
      stars,
    };
  }

  // Primitiva or Bonoloto (6 numbers from 1 to 49)
  const numbers = generateRandomPicks(6, 49);
  const numSet = new Set(numbers);

  // Complementario (distinct from the 6)
  let complementario = Math.floor(Math.random() * 49) + 1;
  while (numSet.has(complementario)) {
    complementario = Math.floor(Math.random() * 49) + 1;
  }

  // Reintegro (0-9)
  const reintegro = Math.floor(Math.random() * 10);

  const prefix = game === 'primitiva' ? 'pr' : 'bn';
  return {
    id: `${prefix}-${dateStr}`,
    game,
    date: dateStr,
    dayOfWeek,
    numbers,
    complementario,
    reintegro,
  };
}

export interface SyncResult {
  updatedDraws: LotteryDraw[];
  addedCount: number;
  addedByGame: Record<GameType, number>;
  latestDate: string;
}

/**
 * Synchronizes the lottery database up to the specified target date.
 */
export function synchronizeDatabase(currentDraws: LotteryDraw[], targetDate: Date = new Date()): SyncResult {
  const newDraws: LotteryDraw[] = [];
  const games: GameType[] = ['primitiva', 'bonoloto', 'euromillones'];
  const addedByGame: Record<GameType, number> = {
    primitiva: 0,
    bonoloto: 0,
    euromillones: 0,
  };

  games.forEach((game) => {
    const pendingDates = getPendingDrawDates(game, currentDraws, targetDate);
    pendingDates.forEach((dateStr) => {
      const draw = createDrawForDate(game, dateStr);
      newDraws.push(draw);
      addedByGame[game]++;
    });
  });

  const merged = [...newDraws, ...currentDraws];

  // Remove any potential duplicate IDs or same game+date
  const seenKeys = new Set<string>();
  const uniqueDraws: LotteryDraw[] = [];

  merged.forEach((d) => {
    const key = `${d.game}-${d.date}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueDraws.push(d);
    }
  });

  // Sort descending by date
  uniqueDraws.sort((a, b) => b.date.localeCompare(a.date));

  const latestDate = targetDate.toISOString().split('T')[0];

  return {
    updatedDraws: uniqueDraws,
    addedCount: newDraws.length,
    addedByGame,
    latestDate,
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

    return { valid: true, draws: validDraws };
  } catch {
    return { valid: false, error: 'Error de sintaxis JSON en el archivo seleccionado.' };
  }
}
