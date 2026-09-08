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

/**
 * Returns a list of dates (YYYY-MM-DD) of verified official draws available in the system
 * that are missing from the current active database.
 * Strictly respects the official draw timetable in Europe/Madrid.
 */
export function getPendingDrawDates(game: GameType, existingDraws: LotteryDraw[]): string[] {
  const gameDraws = existingDraws.filter((d) => d.game === game);
  const existingDates = new Set(gameDraws.map((d) => d.date));
  const maxAllowedDateStr = getMaxCelebratedDateForGame(game);

  // Return dates of verified official draws that have taken place but are missing from the current list
  const missingOfficialDates = INITIAL_DRAWS.filter(
    (d) => d.game === game && d.date <= maxAllowedDateStr && !existingDates.has(d.date)
  ).map((d) => d.date);

  return missingOfficialDates;
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
 * Never generates random fake lottery numbers.
 * Also purges any future or premature draws that were mistakenly saved.
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

  // Check if any verified official seed draws are missing from the user's database
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
