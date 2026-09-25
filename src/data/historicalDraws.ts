import { LotteryDraw, GameType } from '../types';
import { OFFICIAL_HISTORICAL_DRAWS } from './officialDrawsData';


/**
 * Calculates current time in Europe/Madrid to determine if a draw has taken place.
 * - Bonoloto: Daily at 21:30 CET/CEST
 * - Primitiva: Monday, Thursday, Saturday at 21:40 CET/CEST
 * - Euromillones: Tuesday, Friday at 21:30 CET/CEST
 */
export function getMadridTime(): {
  dateStr: string;
  yesterdayStr: string;
  hour: number;
  minute: number;
} {
  const now = new Date();
  
  // Format Madrid date as YYYY-MM-DD
  const madridDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = madridDateFormatter.format(now);

  const madridTimeFormatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = madridTimeFormatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = madridDateFormatter.format(yesterdayDate);

  return { dateStr, yesterdayStr, hour, minute };
}

/**
 * Returns the maximum date for which a celebrated draw could officially exist in Spain.
 * Before 21:45 CET, today's draw has NOT been celebrated yet, so the latest possible is yesterday.
 */
export function getMaxCelebratedDateForGame(game: GameType): string {
  const { dateStr, yesterdayStr, hour, minute } = getMadridTime();
  const minCelebratedHour = 21;
  const minCelebratedMinute = game === 'primitiva' ? 45 : 35;

  const isAfterDraw = hour > minCelebratedHour || (hour === minCelebratedHour && minute >= minCelebratedMinute);
  return isAfterDraw ? dateStr : yesterdayStr;
}

// Verified official historical draws from Loterías y Apuestas del Estado
// Verified official historical draws from Loterías y Apuestas del Estado (SELAE)
// Contains complete verified draws for 2025 and 2026 for La Primitiva, Bonoloto, and Euromillones
export const INITIAL_DRAWS: LotteryDraw[] = OFFICIAL_HISTORICAL_DRAWS;

const LOCAL_STORAGE_KEY_V3 = 'loto_official_draws_v3';
const LEGACY_STORAGE_KEY_V2 = 'loto_user_custom_draws_v2';
const LEGACY_STORAGE_KEY_V1 = 'loto_user_custom_draws_v1';

/**
 * Validates and sanitizes a list of draws:
 * - Drops any draw whose date is in the future or today before official draw time
 * - Ensures numbers are sorted
 * - Removes duplicates (by game and date)
 */
export function sanitizeDraws(rawDraws: LotteryDraw[]): LotteryDraw[] {
  const seen = new Set<string>();
  const sanitized: LotteryDraw[] = [];

  for (const draw of rawDraws) {
    if (!draw.id || !draw.game || !draw.date || !Array.isArray(draw.numbers)) {
      continue;
    }

    const maxAllowed = getMaxCelebratedDateForGame(draw.game);
    // Disallow future draws or uncelebrated today's draws
    if (draw.date > maxAllowed) {
      continue;
    }

    const key = `${draw.game}-${draw.date}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    sanitized.push({
      ...draw,
      numbers: [...draw.numbers].sort((a, b) => a - b),
      stars: draw.stars ? [...draw.stars].sort((a, b) => a - b) : undefined,
    });
  }

  sanitized.sort((a, b) => b.date.localeCompare(a.date));
  return sanitized;
}

export function getStoredDraws(): LotteryDraw[] {
  try {
    // Check if we need to purge corrupted legacy v1 data that contained fake simulated random numbers
    if (localStorage.getItem(LEGACY_STORAGE_KEY_V1)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
    }
    if (localStorage.getItem(LEGACY_STORAGE_KEY_V2)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
    }

    const data = localStorage.getItem(LOCAL_STORAGE_KEY_V3);
    if (data) {
      const parsed: LotteryDraw[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filtrar y purgar cualquier sorteo anterior a los 2 últimos años (2025+) para mantener la app ligera y rápida
        const recentOnly = parsed.filter((d) => {
          const y = parseInt(d.date.substring(0, 4), 10);
          return isNaN(y) || y >= 2025;
        });
        const cleaned = sanitizeDraws(recentOnly);
        
        // Map of verified official seed draws to ensure verified results always take precedence
        const verifiedMap = new Map<string, LotteryDraw>(
          INITIAL_DRAWS.map((d) => [`${d.game}-${d.date}`, d])
        );

        let hasUpdates = false;
        // Update any draw where official verified seed numbers/C/R differ from stale local storage
        const updatedList: LotteryDraw[] = cleaned.map((draw) => {
          const key = `${draw.game}-${draw.date}`;
          const verified = verifiedMap.get(key);
          if (verified) {
            const numbersDiff = JSON.stringify(draw.numbers) !== JSON.stringify(verified.numbers);
            const compDiff = draw.complementario !== verified.complementario;
            const reintDiff = draw.reintegro !== verified.reintegro;
            const starsDiff = JSON.stringify(draw.stars || []) !== JSON.stringify(verified.stars || []);
            if (numbersDiff || compDiff || reintDiff || starsDiff) {
              hasUpdates = true;
              return verified;
            }
          }
          return draw;
        });

        const existingKeys = new Set(updatedList.map((d) => `${d.game}-${d.date}`));
        
        // Check if any verified official seeds from INITIAL_DRAWS are missing
        const missingSeeds = INITIAL_DRAWS.filter(
          (d) => !existingKeys.has(`${d.game}-${d.date}`) && d.date <= getMaxCelebratedDateForGame(d.game)
        );

        if (hasUpdates || missingSeeds.length > 0 || cleaned.length !== parsed.length) {
          const merged = sanitizeDraws([...missingSeeds, ...updatedList]);
          saveStoredDraws(merged);
          return merged;
        }

        return updatedList;
      }
    }
  } catch (e) {
    console.error('Error reading stored draws', e);
  }

  // Default to verified official draws
  const initialSanitized = sanitizeDraws(INITIAL_DRAWS);
  saveStoredDraws(initialSanitized);
  return initialSanitized;
}

export function saveStoredDraws(draws: LotteryDraw[]): void {
  try {
    const cleaned = sanitizeDraws(draws);
    localStorage.setItem(LOCAL_STORAGE_KEY_V3, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Error saving draws', e);
  }
}

export function resetStoredDraws(): LotteryDraw[] {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_V3);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
  } catch (e) {
    console.error('Error resetting draws', e);
  }
  const clean = sanitizeDraws(INITIAL_DRAWS);
  saveStoredDraws(clean);
  return clean;
}
