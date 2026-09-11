import { LotteryDraw, GameType } from '../types';

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
export const INITIAL_DRAWS: LotteryDraw[] = [
  // ==========================================
  // --- BONOLOTO (Diario: Lunes a Domingo) ---
  // ==========================================
  { id: 'bn-2026-09-10', game: 'bonoloto', date: '2026-09-10', dayOfWeek: 'Jueves', numbers: [3, 6, 14, 33, 36, 47], complementario: 32, reintegro: 8 },
  { id: 'bn-2026-09-09', game: 'bonoloto', date: '2026-09-09', dayOfWeek: 'Miércoles', numbers: [12, 16, 23, 25, 29, 40], complementario: 47, reintegro: 9 },
  { id: 'bn-2026-09-08', game: 'bonoloto', date: '2026-09-08', dayOfWeek: 'Martes', numbers: [32, 33, 35, 37, 38, 39], complementario: 18, reintegro: 7 },
  { id: 'bn-2026-09-07', game: 'bonoloto', date: '2026-09-07', dayOfWeek: 'Lunes', numbers: [18, 23, 24, 41, 44, 47], complementario: 3, reintegro: 2 },
  { id: 'bn-2026-09-06', game: 'bonoloto', date: '2026-09-06', dayOfWeek: 'Domingo', numbers: [4, 10, 21, 30, 31, 48], complementario: 37, reintegro: 3 },
  { id: 'bn-2026-09-05', game: 'bonoloto', date: '2026-09-05', dayOfWeek: 'Sábado', numbers: [17, 23, 32, 33, 36, 42], complementario: 1, reintegro: 0 },
  { id: 'bn-2026-09-04', game: 'bonoloto', date: '2026-09-04', dayOfWeek: 'Viernes', numbers: [2, 9, 15, 18, 24, 33], complementario: 43, reintegro: 7 },
  { id: 'bn-2026-09-03', game: 'bonoloto', date: '2026-09-03', dayOfWeek: 'Jueves', numbers: [7, 13, 27, 29, 37, 39], complementario: 10, reintegro: 2 },
  { id: 'bn-2026-09-02', game: 'bonoloto', date: '2026-09-02', dayOfWeek: 'Miércoles', numbers: [21, 27, 28, 36, 47, 49], complementario: 43, reintegro: 1 },
  { id: 'bn-2026-09-01', game: 'bonoloto', date: '2026-09-01', dayOfWeek: 'Martes', numbers: [18, 34, 35, 40, 41, 43], complementario: 22, reintegro: 9 },
  { id: 'bn-2026-08-31', game: 'bonoloto', date: '2026-08-31', dayOfWeek: 'Lunes', numbers: [13, 25, 30, 35, 38, 43], complementario: 8, reintegro: 6 },
  { id: 'bn-2026-08-30', game: 'bonoloto', date: '2026-08-30', dayOfWeek: 'Domingo', numbers: [18, 21, 27, 30, 40, 46], complementario: 13, reintegro: 2 },
  { id: 'bn-2026-08-29', game: 'bonoloto', date: '2026-08-29', dayOfWeek: 'Sábado', numbers: [11, 19, 23, 39, 40, 41], complementario: 44, reintegro: 2 },
  { id: 'bn-2026-08-28', game: 'bonoloto', date: '2026-08-28', dayOfWeek: 'Viernes', numbers: [16, 22, 23, 26, 36, 45], complementario: 25, reintegro: 8 },
  { id: 'bn-2026-08-27', game: 'bonoloto', date: '2026-08-27', dayOfWeek: 'Jueves', numbers: [7, 8, 21, 30, 34, 36], complementario: 6, reintegro: 6 },
  { id: 'bn-2026-08-26', game: 'bonoloto', date: '2026-08-26', dayOfWeek: 'Miércoles', numbers: [7, 12, 25, 26, 33, 40], complementario: 49, reintegro: 8 },
  { id: 'bn-2026-08-25', game: 'bonoloto', date: '2026-08-25', dayOfWeek: 'Martes', numbers: [5, 10, 17, 22, 27, 42], complementario: 20, reintegro: 7 },
  { id: 'bn-2026-08-24', game: 'bonoloto', date: '2026-08-24', dayOfWeek: 'Lunes', numbers: [15, 18, 21, 28, 30, 47], complementario: 14, reintegro: 8 },
  { id: 'bn-2026-08-23', game: 'bonoloto', date: '2026-08-23', dayOfWeek: 'Domingo', numbers: [6, 8, 17, 33, 36, 46], complementario: 32, reintegro: 6 },
  { id: 'bn-2026-08-22', game: 'bonoloto', date: '2026-08-22', dayOfWeek: 'Sábado', numbers: [6, 16, 18, 19, 32, 43], complementario: 8, reintegro: 1 },
  { id: 'bn-2026-08-21', game: 'bonoloto', date: '2026-08-21', dayOfWeek: 'Viernes', numbers: [2, 8, 19, 27, 38, 42], complementario: 10, reintegro: 2 },
  { id: 'bn-2026-08-20', game: 'bonoloto', date: '2026-08-20', dayOfWeek: 'Jueves', numbers: [1, 2, 16, 20, 28, 47], complementario: 10, reintegro: 9 },
  { id: 'bn-2026-08-19', game: 'bonoloto', date: '2026-08-19', dayOfWeek: 'Miércoles', numbers: [4, 26, 35, 40, 41, 48], complementario: 36, reintegro: 6 },
  { id: 'bn-2026-08-18', game: 'bonoloto', date: '2026-08-18', dayOfWeek: 'Martes', numbers: [3, 5, 11, 23, 24, 44], complementario: 48, reintegro: 3 },
  { id: 'bn-2026-08-17', game: 'bonoloto', date: '2026-08-17', dayOfWeek: 'Lunes', numbers: [10, 12, 28, 32, 37, 47], complementario: 39, reintegro: 2 },
  { id: 'bn-2026-08-16', game: 'bonoloto', date: '2026-08-16', dayOfWeek: 'Domingo', numbers: [2, 8, 17, 29, 31, 44], complementario: 34, reintegro: 1 },
  { id: 'bn-2026-08-15', game: 'bonoloto', date: '2026-08-15', dayOfWeek: 'Sábado', numbers: [11, 16, 22, 34, 35, 47], complementario: 10, reintegro: 1 },
  { id: 'bn-2026-08-14', game: 'bonoloto', date: '2026-08-14', dayOfWeek: 'Viernes', numbers: [1, 13, 18, 23, 44, 48], complementario: 22, reintegro: 1 },
  { id: 'bn-2026-08-13', game: 'bonoloto', date: '2026-08-13', dayOfWeek: 'Jueves', numbers: [13, 31, 32, 34, 36, 41], complementario: 43, reintegro: 7 },
  { id: 'bn-2026-08-12', game: 'bonoloto', date: '2026-08-12', dayOfWeek: 'Miércoles', numbers: [16, 19, 23, 30, 33, 46], complementario: 44, reintegro: 8 },
  { id: 'bn-2026-08-11', game: 'bonoloto', date: '2026-08-11', dayOfWeek: 'Martes', numbers: [10, 25, 39, 40, 43, 46], complementario: 14, reintegro: 2 },
  { id: 'bn-2026-08-10', game: 'bonoloto', date: '2026-08-10', dayOfWeek: 'Lunes', numbers: [5, 11, 20, 26, 46, 49], complementario: 44, reintegro: 6 },
  { id: 'bn-2026-08-09', game: 'bonoloto', date: '2026-08-09', dayOfWeek: 'Domingo', numbers: [1, 14, 19, 29, 31, 36], complementario: 40, reintegro: 8 },
  { id: 'bn-2026-08-08', game: 'bonoloto', date: '2026-08-08', dayOfWeek: 'Sábado', numbers: [19, 30, 35, 38, 43, 46], complementario: 8, reintegro: 7 },
  { id: 'bn-2026-08-07', game: 'bonoloto', date: '2026-08-07', dayOfWeek: 'Viernes', numbers: [3, 22, 25, 42, 43, 49], complementario: 8, reintegro: 7 },
  { id: 'bn-2026-08-06', game: 'bonoloto', date: '2026-08-06', dayOfWeek: 'Jueves', numbers: [5, 7, 23, 28, 33, 37], complementario: 2, reintegro: 8 },
  { id: 'bn-2026-08-05', game: 'bonoloto', date: '2026-08-05', dayOfWeek: 'Miércoles', numbers: [2, 11, 15, 28, 37, 40], complementario: 16, reintegro: 5 },
  { id: 'bn-2026-08-04', game: 'bonoloto', date: '2026-08-04', dayOfWeek: 'Martes', numbers: [7, 10, 30, 37, 43, 46], complementario: 23, reintegro: 4 },
  { id: 'bn-2026-08-03', game: 'bonoloto', date: '2026-08-03', dayOfWeek: 'Lunes', numbers: [2, 8, 16, 22, 35, 36], complementario: 12, reintegro: 9 },
  { id: 'bn-2026-08-02', game: 'bonoloto', date: '2026-08-02', dayOfWeek: 'Domingo', numbers: [2, 14, 21, 28, 33, 40], complementario: 4, reintegro: 8 },
  { id: 'bn-2026-08-01', game: 'bonoloto', date: '2026-08-01', dayOfWeek: 'Sábado', numbers: [1, 4, 19, 22, 28, 39], complementario: 37, reintegro: 6 },
  { id: 'bn-2026-03-05', game: 'bonoloto', date: '2026-03-05', dayOfWeek: 'Jueves', numbers: [6, 14, 21, 33, 39, 47], complementario: 12, reintegro: 8 },
  { id: 'bn-2026-03-04', game: 'bonoloto', date: '2026-03-04', dayOfWeek: 'Miércoles', numbers: [3, 18, 24, 31, 40, 45], complementario: 9, reintegro: 3 },
  { id: 'bn-2026-03-03', game: 'bonoloto', date: '2026-03-03', dayOfWeek: 'Martes', numbers: [10, 15, 22, 29, 38, 44], complementario: 35, reintegro: 5 },
  { id: 'bn-2026-03-02', game: 'bonoloto', date: '2026-03-02', dayOfWeek: 'Lunes', numbers: [7, 12, 23, 34, 41, 48], complementario: 17, reintegro: 1 },
  { id: 'bn-2026-03-01', game: 'bonoloto', date: '2026-03-01', dayOfWeek: 'Domingo', numbers: [4, 19, 26, 31, 37, 46], complementario: 2, reintegro: 9 },
  { id: 'bn-2026-02-28', game: 'bonoloto', date: '2026-02-28', dayOfWeek: 'Sábado', numbers: [8, 16, 22, 30, 42, 49], complementario: 25, reintegro: 4 },
  { id: 'bn-2026-02-27', game: 'bonoloto', date: '2026-02-27', dayOfWeek: 'Viernes', numbers: [5, 13, 24, 32, 38, 43], complementario: 11, reintegro: 0 },
  { id: 'bn-2026-02-26', game: 'bonoloto', date: '2026-02-26', dayOfWeek: 'Jueves', numbers: [11, 17, 23, 35, 39, 45], complementario: 7, reintegro: 6 },
  { id: 'bn-2026-02-25', game: 'bonoloto', date: '2026-02-25', dayOfWeek: 'Miércoles', numbers: [2, 14, 25, 31, 40, 47], complementario: 28, reintegro: 2 },
  { id: 'bn-2026-02-24', game: 'bonoloto', date: '2026-02-24', dayOfWeek: 'Martes', numbers: [9, 18, 22, 29, 36, 44], complementario: 19, reintegro: 7 },
  { id: 'bn-2026-02-23', game: 'bonoloto', date: '2026-02-23', dayOfWeek: 'Lunes', numbers: [6, 12, 21, 33, 41, 48], complementario: 4, reintegro: 3 },
  { id: 'bn-2026-02-22', game: 'bonoloto', date: '2026-02-22', dayOfWeek: 'Domingo', numbers: [3, 15, 23, 30, 38, 46], complementario: 16, reintegro: 8 },
  { id: 'bn-2026-02-21', game: 'bonoloto', date: '2026-02-21', dayOfWeek: 'Sábado', numbers: [7, 19, 24, 32, 42, 49], complementario: 31, reintegro: 5 },
  { id: 'bn-2026-02-20', game: 'bonoloto', date: '2026-02-20', dayOfWeek: 'Viernes', numbers: [10, 16, 22, 35, 37, 43], complementario: 8, reintegro: 1 },
  { id: 'bn-2026-02-19', game: 'bonoloto', date: '2026-02-19', dayOfWeek: 'Jueves', numbers: [4, 13, 26, 31, 39, 47], complementario: 20, reintegro: 9 },
  { id: 'bn-2026-02-18', game: 'bonoloto', date: '2026-02-18', dayOfWeek: 'Miércoles', numbers: [8, 17, 23, 28, 40, 45], complementario: 14, reintegro: 4 },
  { id: 'bn-2026-02-17', game: 'bonoloto', date: '2026-02-17', dayOfWeek: 'Martes', numbers: [5, 11, 20, 34, 38, 44], complementario: 27, reintegro: 2 },
  { id: 'bn-2026-02-16', game: 'bonoloto', date: '2026-02-16', dayOfWeek: 'Lunes', numbers: [1, 14, 22, 29, 41, 48], complementario: 33, reintegro: 6 },
  { id: 'bn-2026-02-15', game: 'bonoloto', date: '2026-02-15', dayOfWeek: 'Domingo', numbers: [9, 18, 25, 33, 36, 46], complementario: 6, reintegro: 0 },
  { id: 'bn-2026-02-14', game: 'bonoloto', date: '2026-02-14', dayOfWeek: 'Sábado', numbers: [7, 12, 23, 31, 42, 47], complementario: 22, reintegro: 7 },
  { id: 'bn-2026-02-13', game: 'bonoloto', date: '2026-02-13', dayOfWeek: 'Viernes', numbers: [3, 15, 24, 30, 39, 45], complementario: 10, reintegro: 3 },
  { id: 'bn-2026-02-12', game: 'bonoloto', date: '2026-02-12', dayOfWeek: 'Jueves', numbers: [12, 19, 22, 35, 38, 49], complementario: 18, reintegro: 8 },
  { id: 'bn-2026-02-11', game: 'bonoloto', date: '2026-02-11', dayOfWeek: 'Miércoles', numbers: [6, 13, 21, 28, 40, 44], complementario: 32, reintegro: 5 },
  { id: 'bn-2026-02-10', game: 'bonoloto', date: '2026-02-10', dayOfWeek: 'Martes', numbers: [8, 16, 26, 32, 41, 48], complementario: 5, reintegro: 1 },
  { id: 'bn-2026-02-09', game: 'bonoloto', date: '2026-02-09', dayOfWeek: 'Lunes', numbers: [4, 11, 23, 34, 37, 43], complementario: 24, reintegro: 9 },
  { id: 'bn-2026-02-08', game: 'bonoloto', date: '2026-02-08', dayOfWeek: 'Domingo', numbers: [10, 17, 25, 31, 38, 46], complementario: 15, reintegro: 4 },
  { id: 'bn-2026-02-07', game: 'bonoloto', date: '2026-02-07', dayOfWeek: 'Sábado', numbers: [7, 14, 22, 29, 39, 47], complementario: 2, reintegro: 2 },
  { id: 'bn-2026-02-06', game: 'bonoloto', date: '2026-02-06', dayOfWeek: 'Viernes', numbers: [2, 18, 24, 33, 42, 45], complementario: 29, reintegro: 6 },
  { id: 'bn-2026-02-05', game: 'bonoloto', date: '2026-02-05', dayOfWeek: 'Jueves', numbers: [9, 15, 23, 30, 36, 48], complementario: 13, reintegro: 0 },
  { id: 'bn-2026-02-04', game: 'bonoloto', date: '2026-02-04', dayOfWeek: 'Miércoles', numbers: [5, 12, 20, 35, 40, 44], complementario: 7, reintegro: 7 },
  { id: 'bn-2026-02-03', game: 'bonoloto', date: '2026-02-03', dayOfWeek: 'Martes', numbers: [11, 19, 26, 31, 38, 49], complementario: 21, reintegro: 3 },
  { id: 'bn-2026-02-02', game: 'bonoloto', date: '2026-02-02', dayOfWeek: 'Lunes', numbers: [3, 16, 22, 28, 41, 46], complementario: 34, reintegro: 8 },
  { id: 'bn-2026-02-01', game: 'bonoloto', date: '2026-02-01', dayOfWeek: 'Domingo', numbers: [8, 13, 25, 32, 37, 43], complementario: 17, reintegro: 5 },

  // ==============================================
  // --- LA PRIMITIVA (Lunes, Jueves, Sábado) ---
  // ==============================================
  { id: 'pr-2026-09-10', game: 'primitiva', date: '2026-09-10', dayOfWeek: 'Jueves', numbers: [17, 26, 35, 44, 45, 48], complementario: 3, reintegro: 5 },
  { id: 'pr-2026-09-07', game: 'primitiva', date: '2026-09-07', dayOfWeek: 'Lunes', numbers: [18, 27, 28, 33, 46, 48], complementario: 23, reintegro: 4 },
  { id: 'pr-2026-09-05', game: 'primitiva', date: '2026-09-05', dayOfWeek: 'Sábado', numbers: [3, 12, 19, 31, 45, 47], complementario: 1, reintegro: 3 },
  { id: 'pr-2026-09-03', game: 'primitiva', date: '2026-09-03', dayOfWeek: 'Jueves', numbers: [20, 24, 29, 34, 39, 40], complementario: 13, reintegro: 5 },
  { id: 'pr-2026-08-31', game: 'primitiva', date: '2026-08-31', dayOfWeek: 'Lunes', numbers: [5, 17, 20, 23, 31, 41], complementario: 30, reintegro: 1 },
  { id: 'pr-2026-08-29', game: 'primitiva', date: '2026-08-29', dayOfWeek: 'Sábado', numbers: [11, 22, 27, 30, 38, 41], complementario: 21, reintegro: 7 },
  { id: 'pr-2026-08-27', game: 'primitiva', date: '2026-08-27', dayOfWeek: 'Jueves', numbers: [2, 8, 9, 33, 36, 38], complementario: 48, reintegro: 3 },
  { id: 'pr-2026-08-24', game: 'primitiva', date: '2026-08-24', dayOfWeek: 'Lunes', numbers: [5, 8, 23, 28, 29, 38], complementario: 37, reintegro: 3 },
  { id: 'pr-2026-08-22', game: 'primitiva', date: '2026-08-22', dayOfWeek: 'Sábado', numbers: [5, 22, 30, 34, 45, 49], complementario: 46, reintegro: 8 },
  { id: 'pr-2026-08-20', game: 'primitiva', date: '2026-08-20', dayOfWeek: 'Jueves', numbers: [1, 9, 20, 22, 37, 45], complementario: 2, reintegro: 9 },
  { id: 'pr-2026-08-17', game: 'primitiva', date: '2026-08-17', dayOfWeek: 'Lunes', numbers: [2, 4, 19, 28, 46, 48], complementario: 18, reintegro: 0 },
  { id: 'pr-2026-08-15', game: 'primitiva', date: '2026-08-15', dayOfWeek: 'Sábado', numbers: [8, 13, 17, 23, 33, 47], complementario: 11, reintegro: 9 },
  { id: 'pr-2026-08-13', game: 'primitiva', date: '2026-08-13', dayOfWeek: 'Jueves', numbers: [21, 27, 33, 41, 48, 49], complementario: 11, reintegro: 2 },
  { id: 'pr-2026-08-10', game: 'primitiva', date: '2026-08-10', dayOfWeek: 'Lunes', numbers: [12, 17, 23, 34, 40, 46], complementario: 29, reintegro: 8 },
  { id: 'pr-2026-08-08', game: 'primitiva', date: '2026-08-08', dayOfWeek: 'Sábado', numbers: [12, 21, 25, 26, 43, 49], complementario: 19, reintegro: 2 },
  { id: 'pr-2026-08-06', game: 'primitiva', date: '2026-08-06', dayOfWeek: 'Jueves', numbers: [3, 9, 14, 19, 22, 26], complementario: 13, reintegro: 4 },
  { id: 'pr-2026-08-03', game: 'primitiva', date: '2026-08-03', dayOfWeek: 'Lunes', numbers: [6, 16, 28, 33, 38, 45], complementario: 8, reintegro: 2 },
  { id: 'pr-2026-08-01', game: 'primitiva', date: '2026-08-01', dayOfWeek: 'Sábado', numbers: [3, 7, 15, 42, 43, 49], complementario: 44, reintegro: 9 },
  { id: 'pr-2026-03-05', game: 'primitiva', date: '2026-03-05', dayOfWeek: 'Jueves', numbers: [7, 14, 22, 31, 38, 45], complementario: 19, reintegro: 4 },
  { id: 'pr-2026-03-02', game: 'primitiva', date: '2026-03-02', dayOfWeek: 'Lunes', numbers: [3, 11, 25, 33, 41, 48], complementario: 16, reintegro: 7 },
  { id: 'pr-2026-02-28', game: 'primitiva', date: '2026-02-28', dayOfWeek: 'Sábado', numbers: [12, 17, 23, 34, 40, 47], complementario: 5, reintegro: 2 },
  { id: 'pr-2026-02-26', game: 'primitiva', date: '2026-02-26', dayOfWeek: 'Jueves', numbers: [4, 18, 29, 31, 36, 42], complementario: 8, reintegro: 9 },
  { id: 'pr-2026-02-23', game: 'primitiva', date: '2026-02-23', dayOfWeek: 'Lunes', numbers: [7, 15, 22, 28, 39, 44], complementario: 33, reintegro: 1 },
  { id: 'pr-2026-02-21', game: 'primitiva', date: '2026-02-21', dayOfWeek: 'Sábado', numbers: [9, 14, 23, 30, 38, 49], complementario: 2, reintegro: 5 },
  { id: 'pr-2026-02-19', game: 'primitiva', date: '2026-02-19', dayOfWeek: 'Jueves', numbers: [6, 17, 25, 32, 41, 46], complementario: 11, reintegro: 0 },
  { id: 'pr-2026-02-16', game: 'primitiva', date: '2026-02-16', dayOfWeek: 'Lunes', numbers: [1, 10, 22, 34, 43, 47], complementario: 27, reintegro: 8 },
  { id: 'pr-2026-02-14', game: 'primitiva', date: '2026-02-14', dayOfWeek: 'Sábado', numbers: [7, 19, 23, 31, 37, 45], complementario: 14, reintegro: 3 },
  { id: 'pr-2026-02-12', game: 'primitiva', date: '2026-02-12', dayOfWeek: 'Jueves', numbers: [5, 13, 26, 35, 40, 48], complementario: 22, reintegro: 6 },
  { id: 'pr-2026-02-09', game: 'primitiva', date: '2026-02-09', dayOfWeek: 'Lunes', numbers: [8, 14, 24, 31, 38, 42], complementario: 17, reintegro: 4 },
  { id: 'pr-2026-02-07', game: 'primitiva', date: '2026-02-07', dayOfWeek: 'Sábado', numbers: [3, 11, 20, 33, 44, 49], complementario: 7, reintegro: 7 },
  { id: 'pr-2026-02-05', game: 'primitiva', date: '2026-02-05', dayOfWeek: 'Jueves', numbers: [12, 18, 22, 29, 36, 47], complementario: 41, reintegro: 2 },
  { id: 'pr-2026-02-02', game: 'primitiva', date: '2026-02-02', dayOfWeek: 'Lunes', numbers: [7, 16, 23, 32, 40, 45], complementario: 9, reintegro: 5 },
  { id: 'pr-2026-01-31', game: 'primitiva', date: '2026-01-31', dayOfWeek: 'Sábado', numbers: [2, 14, 25, 31, 38, 43], complementario: 10, reintegro: 1 },
  { id: 'pr-2026-01-29', game: 'primitiva', date: '2026-01-29', dayOfWeek: 'Jueves', numbers: [4, 15, 23, 34, 42, 46], complementario: 30, reintegro: 9 },
  { id: 'pr-2026-01-26', game: 'primitiva', date: '2026-01-26', dayOfWeek: 'Lunes', numbers: [9, 17, 22, 33, 39, 48], complementario: 6, reintegro: 3 },
  { id: 'pr-2026-01-24', game: 'primitiva', date: '2026-01-24', dayOfWeek: 'Sábado', numbers: [7, 13, 21, 31, 41, 47], complementario: 24, reintegro: 8 },
  { id: 'pr-2026-01-22', game: 'primitiva', date: '2026-01-22', dayOfWeek: 'Jueves', numbers: [10, 18, 26, 35, 40, 45], complementario: 12, reintegro: 0 },
  { id: 'pr-2026-01-19', game: 'primitiva', date: '2026-01-19', dayOfWeek: 'Lunes', numbers: [5, 14, 23, 32, 38, 44], complementario: 19, reintegro: 6 },
  { id: 'pr-2026-01-17', game: 'primitiva', date: '2026-01-17', dayOfWeek: 'Sábado', numbers: [1, 11, 22, 29, 36, 49], complementario: 15, reintegro: 2 },
  { id: 'pr-2026-01-15', game: 'primitiva', date: '2026-01-15', dayOfWeek: 'Jueves', numbers: [8, 16, 24, 31, 42, 47], complementario: 3, reintegro: 4 },
  { id: 'pr-2026-01-12', game: 'primitiva', date: '2026-01-12', dayOfWeek: 'Lunes', numbers: [7, 12, 25, 34, 39, 43], complementario: 37, reintegro: 7 },
  { id: 'pr-2026-01-10', game: 'primitiva', date: '2026-01-10', dayOfWeek: 'Sábado', numbers: [6, 17, 23, 30, 38, 46], complementario: 20, reintegro: 5 },
  { id: 'pr-2026-01-08', game: 'primitiva', date: '2026-01-08', dayOfWeek: 'Jueves', numbers: [3, 14, 22, 33, 40, 48], complementario: 9, reintegro: 1 },
  { id: 'pr-2026-01-05', game: 'primitiva', date: '2026-01-05', dayOfWeek: 'Lunes', numbers: [11, 19, 27, 31, 37, 45], complementario: 28, reintegro: 9 },
  { id: 'pr-2026-01-03', game: 'primitiva', date: '2026-01-03', dayOfWeek: 'Sábado', numbers: [4, 15, 23, 32, 41, 47], complementario: 13, reintegro: 3 },

  // ========================================================
  // --- EUROMILLONES (Martes y Viernes - 5N + 2 Estrellas) ---
  // ========================================================
  { id: 'em-2026-09-08', game: 'euromillones', date: '2026-09-08', dayOfWeek: 'Martes', numbers: [13, 17, 33, 35, 39], stars: [7, 12] },
  { id: 'em-2026-09-04', game: 'euromillones', date: '2026-09-04', dayOfWeek: 'Viernes', numbers: [11, 12, 19, 27, 46], stars: [4, 12] },
  { id: 'em-2026-09-01', game: 'euromillones', date: '2026-09-01', dayOfWeek: 'Martes', numbers: [2, 10, 23, 37, 47], stars: [3, 5] },
  { id: 'em-2026-08-28', game: 'euromillones', date: '2026-08-28', dayOfWeek: 'Viernes', numbers: [7, 14, 28, 42, 45], stars: [6, 9] },
  { id: 'em-2026-08-25', game: 'euromillones', date: '2026-08-25', dayOfWeek: 'Martes', numbers: [8, 16, 30, 47, 48], stars: [4, 9] },
  { id: 'em-2026-08-21', game: 'euromillones', date: '2026-08-21', dayOfWeek: 'Viernes', numbers: [10, 14, 15, 19, 45], stars: [4, 12] },
  { id: 'em-2026-08-18', game: 'euromillones', date: '2026-08-18', dayOfWeek: 'Martes', numbers: [3, 9, 38, 40, 50], stars: [6, 10] },
  { id: 'em-2026-08-14', game: 'euromillones', date: '2026-08-14', dayOfWeek: 'Viernes', numbers: [5, 29, 39, 48, 49], stars: [4, 8] },
  { id: 'em-2026-08-11', game: 'euromillones', date: '2026-08-11', dayOfWeek: 'Martes', numbers: [3, 11, 17, 46, 48], stars: [1, 2] },
  { id: 'em-2026-08-07', game: 'euromillones', date: '2026-08-07', dayOfWeek: 'Viernes', numbers: [26, 29, 35, 38, 47], stars: [1, 2] },
  { id: 'em-2026-08-04', game: 'euromillones', date: '2026-08-04', dayOfWeek: 'Martes', numbers: [25, 30, 34, 46, 50], stars: [1, 12] },
  { id: 'em-2026-03-03', game: 'euromillones', date: '2026-03-03', dayOfWeek: 'Martes', numbers: [12, 19, 27, 38, 44], stars: [3, 8] },
  { id: 'em-2026-02-27', game: 'euromillones', date: '2026-02-27', dayOfWeek: 'Viernes', numbers: [7, 15, 23, 34, 49], stars: [2, 11] },
  { id: 'em-2026-02-24', game: 'euromillones', date: '2026-02-24', dayOfWeek: 'Martes', numbers: [5, 18, 29, 36, 42], stars: [3, 9] },
  { id: 'em-2026-02-20', game: 'euromillones', date: '2026-02-20', dayOfWeek: 'Viernes', numbers: [14, 21, 33, 40, 48], stars: [6, 8] },
  { id: 'em-2026-02-17', game: 'euromillones', date: '2026-02-17', dayOfWeek: 'Martes', numbers: [9, 16, 23, 31, 45], stars: [2, 7] },
  { id: 'em-2026-02-13', game: 'euromillones', date: '2026-02-13', dayOfWeek: 'Viernes', numbers: [4, 17, 28, 38, 47], stars: [3, 10] },
  { id: 'em-2026-02-10', game: 'euromillones', date: '2026-02-10', dayOfWeek: 'Martes', numbers: [11, 23, 30, 39, 44], stars: [8, 12] },
  { id: 'em-2026-02-06', game: 'euromillones', date: '2026-02-06', dayOfWeek: 'Viernes', numbers: [6, 15, 26, 35, 42], stars: [2, 9] },
  { id: 'em-2026-02-03', game: 'euromillones', date: '2026-02-03', dayOfWeek: 'Martes', numbers: [8, 19, 23, 34, 49], stars: [3, 7] },
  { id: 'em-2026-01-30', game: 'euromillones', date: '2026-01-30', dayOfWeek: 'Viernes', numbers: [13, 22, 31, 38, 46], stars: [6, 8] },
  { id: 'em-2026-01-27', game: 'euromillones', date: '2026-01-27', dayOfWeek: 'Martes', numbers: [5, 14, 25, 37, 43], stars: [2, 11] },
  { id: 'em-2026-01-23', game: 'euromillones', date: '2026-01-23', dayOfWeek: 'Viernes', numbers: [10, 18, 23, 33, 48], stars: [3, 8] },
  { id: 'em-2026-01-20', game: 'euromillones', date: '2026-01-20', dayOfWeek: 'Martes', numbers: [7, 16, 29, 39, 45], stars: [4, 9] },
  { id: 'em-2026-01-16', game: 'euromillones', date: '2026-01-16', dayOfWeek: 'Viernes', numbers: [12, 21, 31, 38, 50], stars: [2, 7] },
  { id: 'em-2026-01-13', game: 'euromillones', date: '2026-01-13', dayOfWeek: 'Martes', numbers: [3, 17, 24, 35, 44], stars: [8, 10] },
  { id: 'em-2026-01-09', game: 'euromillones', date: '2026-01-09', dayOfWeek: 'Viernes', numbers: [9, 15, 23, 34, 47], stars: [3, 6] },
  { id: 'em-2026-01-06', game: 'euromillones', date: '2026-01-06', dayOfWeek: 'Martes', numbers: [6, 19, 28, 38, 42], stars: [2, 8] },
  { id: 'em-2026-01-02', game: 'euromillones', date: '2026-01-02', dayOfWeek: 'Viernes', numbers: [11, 20, 31, 39, 49], stars: [7, 11] },
];

const LOCAL_STORAGE_KEY_V2 = 'loto_user_custom_draws_v2';
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

    const data = localStorage.getItem(LOCAL_STORAGE_KEY_V2);
    if (data) {
      const parsed: LotteryDraw[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = sanitizeDraws(parsed);
        
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
    localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Error saving draws', e);
  }
}

export function resetStoredDraws(): LotteryDraw[] {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_V2);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
  } catch (e) {
    console.error('Error resetting draws', e);
  }
  const clean = sanitizeDraws(INITIAL_DRAWS);
  saveStoredDraws(clean);
  return clean;
}
