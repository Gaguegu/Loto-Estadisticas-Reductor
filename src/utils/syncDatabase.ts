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

export const OFFICIAL_WEB_URLS: Record<GameType, string> = {
  primitiva: 'https://www.loteriasyapuestas.es/es/la-primitiva/resultados',
  bonoloto: 'https://www.loteriasyapuestas.es/es/bonoloto/resultados',
  euromillones: 'https://www.loteriasyapuestas.es/es/euromillones/resultados',
};

export const LOTOIDEAS_WEB_URLS: Record<GameType, string> = {
  primitiva: 'https://www.lotoideas.com/primitiva-resultados-historicos-de-todos-los-sorteos/',
  bonoloto: 'https://www.lotoideas.com/bonoloto-resultados-historicos-de-todos-los-sorteos/',
  euromillones: 'https://www.lotoideas.com/euromillones-resultados-historicos-de-todos-los-sorteos/',
};

// Verified official direct CSV feeds from Lotoideas (mirroring SELAE)
export const LOTOIDEAS_CSV_URLS: Record<GameType, string> = {
  primitiva: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTov1BuA0nkVGTS48arpPFkc9cG7B40Xi3BfY6iqcWTrMwCBg5b50-WwvnvaR6mxvFHbDBtYFKg5IsJ/pub?gid=1&single=true&output=csv',
  bonoloto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQALTRaLDFfhXOAQmeONPqmFKm9yOiQ4W97rhWgR41BZ7czFsjK5YktD6fnETKHGB9YUnyQ4XBSbhZx/pub?gid=0&single=true&output=csv',
  euromillones: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy91wfK2JteoMi1ZOhGm0D1RKJfDTbEOj6rfnrB6-X7n2Q1nfFwBZBpcivHRdg3pSwxSQgLA3KpW7v/pub?output=csv',
};

const SPANISH_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Returns all calendar dates on which an official draw was celebrated for a game.
 */
export function getAllOfficialDatesForGame(
  game: GameType,
  maxDate: string,
  minDate = '2025-01-01'
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
 * Returns a list of dates (YYYY-MM-DD) of celebrated official draws that are missing from the active database.
 * Strictly respects the official draw timetable in Europe/Madrid.
 */
export function getPendingDrawDates(game: GameType, existingDraws: LotteryDraw[]): string[] {
  const gameDraws = existingDraws.filter((d) => d.game === game);
  const existingDates = new Set(gameDraws.map((d) => d.date));
  const maxAllowedDateStr = getMaxCelebratedDateForGame(game);

  // Check verified seed draws in INITIAL_DRAWS
  const missingSeeds = INITIAL_DRAWS.filter(
    (d) => d.game === game && d.date <= maxAllowedDateStr && !existingDates.has(d.date)
  ).map((d) => d.date);

  // Check all celebrated official days from Jan 1, 2025 up to today/yesterday
  const allOfficialDates = getAllOfficialDatesForGame(game, maxAllowedDateStr, '2025-01-01');
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

/**
 * Parses Lotoideas official CSV text into LotteryDraw objects.
 * Handles Primitiva, Bonoloto, and Euromillones formats.
 */
export function parseLotoideasCsv(csvText: string, defaultGame?: GameType, minYear = 2025): LotteryDraw[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const firstLine = lines[0].toUpperCase();
  let detectedGame: GameType = defaultGame || 'primitiva';
  if (firstLine.includes('JOKER')) {
    detectedGame = 'primitiva';
  } else if (firstLine.includes('ESTRELLA')) {
    detectedGame = 'euromillones';
  } else if (firstLine.includes('BONOLOTO') || (firstLine.includes('COMP') && !firstLine.includes('JOKER'))) {
    detectedGame = defaultGame || 'bonoloto';
  }

  const draws: LotteryDraw[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim());
    if (parts.length < 6) continue;

    const dateStr = parts[0];
    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3) continue;

    const d = parseInt(dateParts[0], 10);
    const m = parseInt(dateParts[1], 10);
    const y = parseInt(dateParts[2], 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) continue;
    // Solo conservar sorteos de los 2 últimos años (2025 en adelante) para no saturar memoria ni almacenamiento
    if (y < minYear) continue;

    const isoDate = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const dt = new Date(isoDate + 'T12:00:00Z');
    const dayOfWeek = SPANISH_DAYS[dt.getUTCDay()];

    if (detectedGame === 'euromillones') {
      const nums = parts.slice(1, 6).map((x) => parseInt(x, 10)).filter((n) => !isNaN(n) && n >= 1 && n <= 50);
      if (nums.length !== 5) continue;
      // Stars can be in column 6, 7 or 7, 8
      const candidateStars = parts.slice(6).map((x) => parseInt(x, 10)).filter((n) => !isNaN(n) && n >= 1 && n <= 12);
      const stars = candidateStars.slice(0, 2).sort((a, b) => a - b);

      draws.push({
        id: `em-${isoDate}`,
        game: 'euromillones',
        date: isoDate,
        dayOfWeek,
        numbers: nums.sort((a, b) => a - b),
        stars: stars.length === 2 ? stars : undefined,
      });
    } else {
      const nums = parts.slice(1, 7).map((x) => parseInt(x, 10)).filter((n) => !isNaN(n) && n >= 1 && n <= 49);
      if (nums.length !== 6) continue;

      const comp = parts[7] && !isNaN(parseInt(parts[7], 10)) ? parseInt(parts[7], 10) : undefined;
      const reint = parts[8] && !isNaN(parseInt(parts[8], 10)) ? parseInt(parts[8], 10) : undefined;
      const joker = parts[9] && parts[9].trim() ? parts[9].trim() : undefined;
      const prefix = detectedGame === 'primitiva' ? 'pr' : 'bn';

      draws.push({
        id: `${prefix}-${isoDate}`,
        game: detectedGame,
        date: isoDate,
        dayOfWeek,
        numbers: nums.sort((a, b) => a - b),
        complementario: comp,
        reintegro: reint,
        joker,
      });
    }
  }

  return sanitizeDraws(draws);
}

/**
 * Fetches verified official draws directly from Lotoideas (Google Docs CSV export).
 */
export async function fetchOfficialDrawsFromLotoideas(game: GameType): Promise<{
  success: boolean;
  draws: LotteryDraw[];
  error?: string;
}> {
  const url = LOTOIDEAS_CSV_URLS[game];
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const parsed = parseLotoideasCsv(csvText, game);

    if (parsed.length === 0) {
      throw new Error('No se pudieron extraer sorteos válidos del archivo descargado.');
    }

    return { success: true, draws: parsed };
  } catch (err: any) {
    console.warn(`Direct fetch failed for ${game}, trying fallback:`, err?.message || err);
    // Fallback using public CORS proxy if direct fetch is blocked in a restricted environment
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const text = await proxyRes.text();
        const parsed = parseLotoideasCsv(text, game);
        if (parsed.length > 0) {
          return { success: true, draws: parsed };
        }
      }
    } catch {
      // Ignore proxy fallback failure and return original error
    }

    return {
      success: false,
      draws: [],
      error: err?.message || 'Error de conexión al descargar sorteos de Lotoideas.',
    };
  }
}

export interface DiscrepancyItem {
  id: string;
  game: GameType;
  date: string;
  dayOfWeek: string;
  localNumbers: number[];
  localComp?: number;
  localReint?: number;
  localStars?: number[];
  officialNumbers: number[];
  officialComp?: number;
  officialReint?: number;
  officialStars?: number[];
  officialJoker?: string;
}

export interface ConfrontationReport {
  totalChecked: number;
  matchingCount: number;
  discrepancies: DiscrepancyItem[];
  missingCount: number;
  missingDates: string[];
  latestOfficialDate: string;
  source: string;
}

/**
 * Compares current local draws with official verified draws (from Lotoideas or SELAE).
 */
export function compareDrawsWithOfficialSource(
  game: GameType,
  localDraws: LotteryDraw[],
  officialDraws: LotteryDraw[]
): ConfrontationReport {
  const localGameDraws = localDraws.filter((d) => d.game === game);
  const officialGameDraws = officialDraws.filter((d) => d.game === game);

  const localMap = new Map<string, LotteryDraw>(localGameDraws.map((d) => [d.date, d]));
  const officialMap = new Map<string, LotteryDraw>(officialGameDraws.map((d) => [d.date, d]));

  let matchingCount = 0;
  const discrepancies: DiscrepancyItem[] = [];
  const missingDates: string[] = [];

  for (const official of officialGameDraws) {
    const local = localMap.get(official.date);
    if (!local) {
      missingDates.push(official.date);
      continue;
    }

    const numsEqual = JSON.stringify(local.numbers) === JSON.stringify(official.numbers);
    const compEqual = local.complementario === official.complementario;
    const reintEqual = local.reintegro === official.reintegro;
    const starsEqual = JSON.stringify(local.stars || []) === JSON.stringify(official.stars || []);

    if (numsEqual && compEqual && reintEqual && starsEqual) {
      matchingCount++;
    } else {
      discrepancies.push({
        id: local.id,
        game,
        date: official.date,
        dayOfWeek: official.dayOfWeek,
        localNumbers: local.numbers,
        localComp: local.complementario,
        localReint: local.reintegro,
        localStars: local.stars,
        officialNumbers: official.numbers,
        officialComp: official.complementario,
        officialReint: official.reintegro,
        officialStars: official.stars,
        officialJoker: official.joker,
      });
    }
  }

  const latestOfficialDate = officialGameDraws[0]?.date || 'N/A';

  return {
    totalChecked: officialGameDraws.length,
    matchingCount,
    discrepancies,
    missingCount: missingDates.length,
    missingDates,
    latestOfficialDate,
    source: 'Lotoideas & SELAE Oficial',
  };
}

export interface SyncResult {
  updatedDraws: LotteryDraw[];
  addedCount: number;
  addedByGame: Record<GameType, number>;
  latestDate: string;
  removedFutureCount: number;
  correctedVerifiedCount: number;
  sourceUsed: 'lotoideas_online' | 'local_verified';
  discrepanciesCorrected: DiscrepancyItem[];
}

/**
 * Downloads live official results from Lotoideas (and falls back to verified INITIAL_DRAWS if offline).
 * Sanitizes data, removes corrupt/fake draws, and guarantees 100% authentic numbers.
 */
export async function downloadAndSynchronizeDatabase(
  currentDraws: LotteryDraw[]
): Promise<SyncResult> {
  const sanitizedCurrent = sanitizeDraws(currentDraws);
  const removedFutureCount = currentDraws.length - sanitizedCurrent.length;

  // Try to download live results from Lotoideas for all 3 games
  const [prRes, bnRes, emRes] = await Promise.all([
    fetchOfficialDrawsFromLotoideas('primitiva'),
    fetchOfficialDrawsFromLotoideas('bonoloto'),
    fetchOfficialDrawsFromLotoideas('euromillones'),
  ]);

  const fetchedDraws: LotteryDraw[] = [];
  let sourceUsed: 'lotoideas_online' | 'local_verified' = 'local_verified';

  if (prRes.success && prRes.draws.length > 0) {
    fetchedDraws.push(...prRes.draws);
    sourceUsed = 'lotoideas_online';
  }
  if (bnRes.success && bnRes.draws.length > 0) {
    fetchedDraws.push(...bnRes.draws);
    sourceUsed = 'lotoideas_online';
  }
  if (emRes.success && emRes.draws.length > 0) {
    fetchedDraws.push(...emRes.draws);
    sourceUsed = 'lotoideas_online';
  }

  // Combine fetched draws with INITIAL_DRAWS as ground truth (fetched draws take precedence)
  const officialPool = sanitizeDraws([...fetchedDraws, ...INITIAL_DRAWS]);
  const officialMap = new Map<string, LotteryDraw>(
    officialPool.map((d) => [`${d.game}-${d.date}`, d])
  );

  let correctedVerifiedCount = 0;
  const discrepanciesCorrected: DiscrepancyItem[] = [];

  // 1. Repair any existing local draw that has erroneous or fake numbers
  const correctedCurrent = sanitizedCurrent.map((draw) => {
    const key = `${draw.game}-${draw.date}`;
    const verified = officialMap.get(key);
    if (verified) {
      const numbersDiff = JSON.stringify(draw.numbers) !== JSON.stringify(verified.numbers);
      const compDiff = draw.complementario !== verified.complementario;
      const reintDiff = draw.reintegro !== verified.reintegro;
      const starsDiff = JSON.stringify(draw.stars || []) !== JSON.stringify(verified.stars || []);

      if (numbersDiff || compDiff || reintDiff || starsDiff) {
        correctedVerifiedCount++;
        discrepanciesCorrected.push({
          id: draw.id,
          game: draw.game,
          date: draw.date,
          dayOfWeek: draw.dayOfWeek,
          localNumbers: draw.numbers,
          localComp: draw.complementario,
          localReint: draw.reintegro,
          localStars: draw.stars,
          officialNumbers: verified.numbers,
          officialComp: verified.complementario,
          officialReint: verified.reintegro,
          officialStars: verified.stars,
          officialJoker: verified.joker,
        });
        return verified;
      }
    }
    return draw;
  });

  const existingKeys = new Set(correctedCurrent.map((d) => `${d.game}-${d.date}`));
  const newOfficialDraws: LotteryDraw[] = [];
  const addedByGame: Record<GameType, number> = {
    primitiva: 0,
    bonoloto: 0,
    euromillones: 0,
  };

  // 2. Add any official celebrated draws that are missing in the local database
  for (const officialDraw of officialPool) {
    const maxAllowed = getMaxCelebratedDateForGame(officialDraw.game);
    if (officialDraw.date > maxAllowed) continue;

    const key = `${officialDraw.game}-${officialDraw.date}`;
    if (!existingKeys.has(key)) {
      newOfficialDraws.push(officialDraw);
      existingKeys.add(key);
      addedByGame[officialDraw.game]++;
    }
  }

  const merged = sanitizeDraws([...newOfficialDraws, ...correctedCurrent]);
  const { dateStr } = getMadridTime();

  return {
    updatedDraws: merged,
    addedCount: newOfficialDraws.length,
    addedByGame,
    latestDate: dateStr,
    removedFutureCount,
    correctedVerifiedCount,
    sourceUsed,
    discrepanciesCorrected,
  };
}

/**
 * Synchronous synchronization fallback using authentic verified official INITIAL_DRAWS.
 * Strictly avoids inventing random or deterministic numbers.
 */
export function synchronizeDatabase(currentDraws: LotteryDraw[]): SyncResult {
  const sanitizedCurrent = sanitizeDraws(currentDraws);
  const removedFutureCount = currentDraws.length - sanitizedCurrent.length;

  const verifiedMap = new Map<string, LotteryDraw>(
    INITIAL_DRAWS.map((d) => [`${d.game}-${d.date}`, d])
  );

  let correctedVerifiedCount = 0;
  const discrepanciesCorrected: DiscrepancyItem[] = [];

  const correctedCurrent = sanitizedCurrent.map((draw) => {
    const key = `${draw.game}-${draw.date}`;
    const verified = verifiedMap.get(key);
    if (verified) {
      const numbersDiff = JSON.stringify(draw.numbers) !== JSON.stringify(verified.numbers);
      const compDiff = draw.complementario !== verified.complementario;
      const reintDiff = draw.reintegro !== verified.reintegro;
      const starsDiff = JSON.stringify(draw.stars || []) !== JSON.stringify(verified.stars || []);

      if (numbersDiff || compDiff || reintDiff || starsDiff) {
        correctedVerifiedCount++;
        discrepanciesCorrected.push({
          id: draw.id,
          game: draw.game,
          date: draw.date,
          dayOfWeek: draw.dayOfWeek,
          localNumbers: draw.numbers,
          localComp: draw.complementario,
          localReint: draw.reintegro,
          localStars: draw.stars,
          officialNumbers: verified.numbers,
          officialComp: verified.complementario,
          officialReint: verified.reintegro,
          officialStars: verified.stars,
          officialJoker: verified.joker,
        });
        return verified;
      }
    }
    return draw;
  });

  const existingKeys = new Set(correctedCurrent.map((d) => `${d.game}-${d.date}`));
  const newOfficialDraws: LotteryDraw[] = [];
  const addedByGame: Record<GameType, number> = {
    primitiva: 0,
    bonoloto: 0,
    euromillones: 0,
  };

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

  const merged = sanitizeDraws([...newOfficialDraws, ...correctedCurrent]);
  const { dateStr } = getMadridTime();

  return {
    updatedDraws: merged,
    addedCount: newOfficialDraws.length,
    addedByGame,
    latestDate: dateStr,
    removedFutureCount,
    correctedVerifiedCount,
    sourceUsed: 'local_verified',
    discrepanciesCorrected,
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
 * Import and validate draws from either JSON or CSV (from Lotoideas or SELAE).
 */
export function parseAndValidateDraws(
  fileContent: string,
  defaultGame: GameType = 'primitiva'
): { valid: boolean; draws?: LotteryDraw[]; error?: string; format?: 'json' | 'csv' } {
  const trimmed = fileContent.trim();

  // 1. Try parsing as JSON first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        return { valid: false, error: 'El archivo JSON no contiene una lista válida de sorteos.' };
      }

      const validDraws: LotteryDraw[] = [];
      for (const item of parsed) {
        if (!item.id || !item.game || !item.date || !Array.isArray(item.numbers)) {
          continue;
        }
        validDraws.push(item as LotteryDraw);
      }

      if (validDraws.length === 0) {
        return { valid: false, error: 'No se encontraron sorteos con formato válido en el archivo JSON.' };
      }

      const sanitized = sanitizeDraws(validDraws);
      return { valid: true, draws: sanitized, format: 'json' };
    } catch {
      return { valid: false, error: 'Error de sintaxis JSON en el archivo seleccionado.' };
    }
  }

  // 2. Try parsing as Lotoideas / SELAE CSV
  try {
    const csvDraws = parseLotoideasCsv(trimmed, defaultGame);
    if (csvDraws.length > 0) {
      return { valid: true, draws: csvDraws, format: 'csv' };
    }
  } catch (err: any) {
    console.error('Error parsing CSV', err);
  }

  return {
    valid: false,
    error: 'Formato no reconocido. Por favor selecciona un archivo JSON o CSV oficial de Lotoideas.',
  };
}
