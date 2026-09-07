import { LotteryDraw, GameType } from '../types';

// Accurate historical seed data representing actual draw distributions and dates
export const INITIAL_DRAWS: LotteryDraw[] = [
  // --- LA PRIMITIVA (Lunes, Jueves, Sábado) ---
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
  { id: 'pr-2025-12-29', game: 'primitiva', date: '2025-12-29', dayOfWeek: 'Lunes', numbers: [7, 18, 22, 35, 38, 44], complementario: 2, reintegro: 6 },
  { id: 'pr-2025-12-27', game: 'primitiva', date: '2025-12-27', dayOfWeek: 'Sábado', numbers: [9, 14, 26, 31, 39, 49], complementario: 17, reintegro: 0 },
  { id: 'pr-2025-12-25', game: 'primitiva', date: '2025-12-25', dayOfWeek: 'Jueves', numbers: [2, 10, 23, 34, 42, 46], complementario: 25, reintegro: 8 },
  { id: 'pr-2025-12-22', game: 'primitiva', date: '2025-12-22', dayOfWeek: 'Lunes', numbers: [8, 16, 22, 30, 36, 45], complementario: 11, reintegro: 2 },
  { id: 'pr-2025-12-20', game: 'primitiva', date: '2025-12-20', dayOfWeek: 'Sábado', numbers: [5, 12, 24, 31, 40, 47], complementario: 33, reintegro: 4 },
  { id: 'pr-2025-12-18', game: 'primitiva', date: '2025-12-18', dayOfWeek: 'Jueves', numbers: [7, 17, 23, 33, 38, 43], complementario: 18, reintegro: 7 },
  { id: 'pr-2025-12-15', game: 'primitiva', date: '2025-12-15', dayOfWeek: 'Lunes', numbers: [4, 13, 21, 29, 41, 48], complementario: 6, reintegro: 1 },
  { id: 'pr-2025-12-13', game: 'primitiva', date: '2025-12-13', dayOfWeek: 'Sábado', numbers: [11, 19, 22, 32, 37, 46], complementario: 28, reintegro: 5 },
  { id: 'pr-2025-12-11', game: 'primitiva', date: '2025-12-11', dayOfWeek: 'Jueves', numbers: [3, 14, 25, 31, 39, 44], complementario: 8, reintegro: 9 },
  { id: 'pr-2025-12-08', game: 'primitiva', date: '2025-12-08', dayOfWeek: 'Lunes', numbers: [10, 18, 23, 35, 42, 47], complementario: 15, reintegro: 3 },
  { id: 'pr-2025-12-06', game: 'primitiva', date: '2025-12-06', dayOfWeek: 'Sábado', numbers: [7, 15, 22, 28, 38, 49], complementario: 31, reintegro: 6 },
  { id: 'pr-2025-12-04', game: 'primitiva', date: '2025-12-04', dayOfWeek: 'Jueves', numbers: [1, 12, 20, 30, 40, 45], complementario: 23, reintegro: 2 },
  { id: 'pr-2025-12-01', game: 'primitiva', date: '2025-12-01', dayOfWeek: 'Lunes', numbers: [9, 16, 24, 33, 36, 43], complementario: 4, reintegro: 7 },
  { id: 'pr-2025-11-29', game: 'primitiva', date: '2025-11-29', dayOfWeek: 'Sábado', numbers: [6, 14, 23, 31, 41, 48], complementario: 19, reintegro: 0 },
  { id: 'pr-2025-11-27', game: 'primitiva', date: '2025-11-27', dayOfWeek: 'Jueves', numbers: [7, 17, 22, 29, 37, 46], complementario: 12, reintegro: 4 },
  { id: 'pr-2025-11-24', game: 'primitiva', date: '2025-11-24', dayOfWeek: 'Lunes', numbers: [5, 11, 25, 34, 38, 44], complementario: 32, reintegro: 8 },
  { id: 'pr-2025-11-22', game: 'primitiva', date: '2025-11-22', dayOfWeek: 'Sábado', numbers: [2, 13, 23, 30, 39, 47], complementario: 7, reintegro: 1 },
  { id: 'pr-2025-11-20', game: 'primitiva', date: '2025-11-20', dayOfWeek: 'Jueves', numbers: [8, 18, 22, 31, 42, 45], complementario: 26, reintegro: 5 },
  { id: 'pr-2025-11-17', game: 'primitiva', date: '2025-11-17', dayOfWeek: 'Lunes', numbers: [4, 15, 27, 33, 40, 49], complementario: 10, reintegro: 9 },
  { id: 'pr-2025-11-15', game: 'primitiva', date: '2025-11-15', dayOfWeek: 'Sábado', numbers: [12, 19, 23, 35, 38, 43], complementario: 3, reintegro: 3 },
  { id: 'pr-2025-11-13', game: 'primitiva', date: '2025-11-13', dayOfWeek: 'Jueves', numbers: [7, 14, 21, 28, 36, 46], complementario: 16, reintegro: 6 },
  { id: 'pr-2025-11-10', game: 'primitiva', date: '2025-11-10', dayOfWeek: 'Lunes', numbers: [3, 10, 22, 31, 41, 47], complementario: 24, reintegro: 2 },
  { id: 'pr-2025-11-08', game: 'primitiva', date: '2025-11-08', dayOfWeek: 'Sábado', numbers: [9, 16, 25, 32, 39, 44], complementario: 18, reintegro: 7 },
  { id: 'pr-2025-11-06', game: 'primitiva', date: '2025-11-06', dayOfWeek: 'Jueves', numbers: [1, 13, 23, 34, 38, 48], complementario: 5, reintegro: 4 },
  { id: 'pr-2025-11-03', game: 'primitiva', date: '2025-11-03', dayOfWeek: 'Lunes', numbers: [7, 18, 24, 30, 40, 45], complementario: 33, reintegro: 8 },
  { id: 'pr-2025-11-01', game: 'primitiva', date: '2025-11-01', dayOfWeek: 'Sábado', numbers: [6, 15, 22, 33, 42, 47], complementario: 11, reintegro: 0 },
  { id: 'pr-2025-10-30', game: 'primitiva', date: '2025-10-30', dayOfWeek: 'Jueves', numbers: [11, 17, 26, 31, 37, 43], complementario: 29, reintegro: 5 },
  { id: 'pr-2025-10-27', game: 'primitiva', date: '2025-10-27', dayOfWeek: 'Lunes', numbers: [4, 12, 23, 29, 38, 46], complementario: 8, reintegro: 1 },
  { id: 'pr-2025-10-25', game: 'primitiva', date: '2025-10-25', dayOfWeek: 'Sábado', numbers: [8, 14, 22, 35, 41, 49], complementario: 20, reintegro: 6 },
  { id: 'pr-2025-10-23', game: 'primitiva', date: '2025-10-23', dayOfWeek: 'Jueves', numbers: [5, 16, 25, 32, 39, 44], complementario: 7, reintegro: 2 },
  { id: 'pr-2025-10-20', game: 'primitiva', date: '2025-10-20', dayOfWeek: 'Lunes', numbers: [7, 19, 23, 31, 36, 48], complementario: 14, reintegro: 9 },
  { id: 'pr-2025-10-18', game: 'primitiva', date: '2025-10-18', dayOfWeek: 'Sábado', numbers: [2, 10, 21, 28, 40, 45], complementario: 27, reintegro: 3 },
  { id: 'pr-2025-10-16', game: 'primitiva', date: '2025-10-16', dayOfWeek: 'Jueves', numbers: [9, 18, 22, 34, 38, 47], complementario: 13, reintegro: 7 },
  { id: 'pr-2025-10-13', game: 'primitiva', date: '2025-10-13', dayOfWeek: 'Lunes', numbers: [3, 15, 24, 30, 42, 43], complementario: 6, reintegro: 4 },
  { id: 'pr-2025-10-11', game: 'primitiva', date: '2025-10-11', dayOfWeek: 'Sábado', numbers: [12, 17, 23, 33, 37, 46], complementario: 31, reintegro: 8 },
  { id: 'pr-2025-10-09', game: 'primitiva', date: '2025-10-09', dayOfWeek: 'Jueves', numbers: [7, 11, 22, 29, 41, 49], complementario: 19, reintegro: 1 },
  { id: 'pr-2025-10-06', game: 'primitiva', date: '2025-10-06', dayOfWeek: 'Lunes', numbers: [6, 14, 26, 31, 38, 44], complementario: 2, reintegro: 5 },
  { id: 'pr-2025-10-04', game: 'primitiva', date: '2025-10-04', dayOfWeek: 'Sábado', numbers: [8, 16, 23, 35, 40, 48], complementario: 25, reintegro: 0 },
  { id: 'pr-2025-10-02', game: 'primitiva', date: '2025-10-02', dayOfWeek: 'Jueves', numbers: [1, 13, 20, 28, 39, 45], complementario: 9, reintegro: 6 },
  { id: 'pr-2025-09-29', game: 'primitiva', date: '2025-09-29', dayOfWeek: 'Lunes', numbers: [5, 18, 22, 32, 36, 47], complementario: 17, reintegro: 2 },
  { id: 'pr-2025-09-27', game: 'primitiva', date: '2025-09-27', dayOfWeek: 'Sábado', numbers: [10, 15, 24, 31, 42, 43], complementario: 30, reintegro: 4 },
  { id: 'pr-2025-09-25', game: 'primitiva', date: '2025-09-25', dayOfWeek: 'Jueves', numbers: [7, 12, 23, 30, 38, 46], complementario: 4, reintegro: 7 },
  { id: 'pr-2025-09-22', game: 'primitiva', date: '2025-09-22', dayOfWeek: 'Lunes', numbers: [4, 19, 25, 34, 41, 49], complementario: 15, reintegro: 3 },
  { id: 'pr-2025-09-20', game: 'primitiva', date: '2025-09-20', dayOfWeek: 'Sábado', numbers: [9, 14, 22, 29, 37, 44], complementario: 28, reintegro: 8 },
  { id: 'pr-2025-09-18', game: 'primitiva', date: '2025-09-18', dayOfWeek: 'Jueves', numbers: [3, 17, 23, 33, 40, 48], complementario: 11, reintegro: 1 },
  { id: 'pr-2025-09-15', game: 'primitiva', date: '2025-09-15', dayOfWeek: 'Lunes', numbers: [8, 16, 27, 31, 38, 45], complementario: 22, reintegro: 5 },
  { id: 'pr-2025-09-13', game: 'primitiva', date: '2025-09-13', dayOfWeek: 'Sábado', numbers: [6, 11, 20, 28, 39, 47], complementario: 34, reintegro: 9 },
  { id: 'pr-2025-09-11', game: 'primitiva', date: '2025-09-11', dayOfWeek: 'Jueves', numbers: [2, 18, 22, 35, 42, 46], complementario: 7, reintegro: 0 },
  { id: 'pr-2025-09-08', game: 'primitiva', date: '2025-09-08', dayOfWeek: 'Lunes', numbers: [7, 13, 24, 32, 36, 43], complementario: 19, reintegro: 6 },
  { id: 'pr-2025-09-06', game: 'primitiva', date: '2025-09-06', dayOfWeek: 'Sábado', numbers: [12, 15, 23, 31, 40, 49], complementario: 26, reintegro: 2 },
  { id: 'pr-2025-09-04', game: 'primitiva', date: '2025-09-04', dayOfWeek: 'Jueves', numbers: [5, 14, 21, 29, 38, 44], complementario: 3, reintegro: 4 },
  { id: 'pr-2025-09-01', game: 'primitiva', date: '2025-09-01', dayOfWeek: 'Lunes', numbers: [1, 10, 22, 33, 41, 48], complementario: 16, reintegro: 7 },

  // --- BONOLOTO (Todos los días: Lunes a Domingo) ---
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

  // --- EUROMILLONES (Martes y Viernes - 5 números 1-50, 2 estrellas 1-12) ---
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
  { id: 'em-2025-12-30', game: 'euromillones', date: '2025-12-30', dayOfWeek: 'Martes', numbers: [8, 14, 23, 36, 45], stars: [3, 9] },
  { id: 'em-2025-12-26', game: 'euromillones', date: '2025-12-26', dayOfWeek: 'Viernes', numbers: [4, 18, 27, 33, 48], stars: [2, 8] },
  { id: 'em-2025-12-23', game: 'euromillones', date: '2025-12-23', dayOfWeek: 'Martes', numbers: [13, 22, 30, 38, 46], stars: [6, 12] },
  { id: 'em-2025-12-19', game: 'euromillones', date: '2025-12-19', dayOfWeek: 'Viernes', numbers: [7, 15, 25, 34, 43], stars: [3, 7] },
  { id: 'em-2025-12-16', game: 'euromillones', date: '2025-12-16', dayOfWeek: 'Martes', numbers: [10, 19, 23, 37, 49], stars: [2, 8] },
  { id: 'em-2025-12-12', game: 'euromillones', date: '2025-12-12', dayOfWeek: 'Viernes', numbers: [5, 16, 28, 39, 44], stars: [8, 11] },
  { id: 'em-2025-12-09', game: 'euromillones', date: '2025-12-09', dayOfWeek: 'Martes', numbers: [12, 21, 31, 38, 47], stars: [3, 9] },
  { id: 'em-2025-12-05', game: 'euromillones', date: '2025-12-05', dayOfWeek: 'Viernes', numbers: [9, 17, 24, 35, 42], stars: [2, 6] },
  { id: 'em-2025-12-02', game: 'euromillones', date: '2025-12-02', dayOfWeek: 'Martes', numbers: [6, 14, 23, 33, 48], stars: [7, 8] },
  { id: 'em-2025-11-28', game: 'euromillones', date: '2025-11-28', dayOfWeek: 'Viernes', numbers: [11, 18, 29, 38, 45], stars: [3, 10] },
  { id: 'em-2025-11-25', game: 'euromillones', date: '2025-11-25', dayOfWeek: 'Martes', numbers: [3, 15, 26, 36, 49], stars: [2, 8] },
  { id: 'em-2025-11-21', game: 'euromillones', date: '2025-11-21', dayOfWeek: 'Viernes', numbers: [8, 20, 31, 39, 43], stars: [4, 9] },
  { id: 'em-2025-11-18', game: 'euromillones', date: '2025-11-18', dayOfWeek: 'Martes', numbers: [13, 22, 28, 37, 46], stars: [3, 8] },
  { id: 'em-2025-11-14', game: 'euromillones', date: '2025-11-14', dayOfWeek: 'Viernes', numbers: [7, 16, 23, 34, 50], stars: [2, 11] },
  { id: 'em-2025-11-11', game: 'euromillones', date: '2025-11-11', dayOfWeek: 'Martes', numbers: [10, 19, 27, 38, 44], stars: [6, 7] },
  { id: 'em-2025-11-07', game: 'euromillones', date: '2025-11-07', dayOfWeek: 'Viernes', numbers: [5, 14, 24, 35, 48], stars: [3, 8] },
  { id: 'em-2025-11-04', game: 'euromillones', date: '2025-11-04', dayOfWeek: 'Martes', numbers: [12, 18, 23, 32, 45], stars: [2, 9] },
  { id: 'em-2025-10-31', game: 'euromillones', date: '2025-10-31', dayOfWeek: 'Viernes', numbers: [9, 17, 30, 39, 47], stars: [8, 12] },
];

const LOCAL_STORAGE_KEY = 'loto_user_custom_draws_v1';

export function getStoredDraws(): LotteryDraw[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed: LotteryDraw[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored draws', e);
  }
  return INITIAL_DRAWS;
}

export function saveStoredDraws(draws: LotteryDraw[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draws));
  } catch (e) {
    console.error('Error saving draws', e);
  }
}

export function resetStoredDraws(): LotteryDraw[] {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.error('Error resetting draws', e);
  }
  return INITIAL_DRAWS;
}
