export type GameType = 'primitiva' | 'bonoloto' | 'euromillones';

export interface LotteryDraw {
  id: string;
  game: GameType;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  numbers: number[]; // 6 numbers for Primitiva/Bonoloto, 5 for Euromillones
  complementario?: number;
  reintegro?: number;
  stars?: number[]; // 2 stars for Euromillones (1-12)
  joker?: string;
}

export interface DayFrequency {
  day: string;
  count: number;
}

export interface NumberStat {
  number: number;
  totalCount: number;
  percentage: number;
  byDay: Record<string, number>; // e.g. { 'Lunes': 4, 'Jueves': 8, 'Sábado': 6 }
  lastDrawnDate?: string;
  isStar?: boolean;
  currentDelay?: number; // Consecutive draws without appearing up to the latest draw
  maxDelay?: number; // Maximum consecutive draws without appearing in the period
  streak?: number; // Current streak of consecutive appearances
}

export interface SavedCombination {
  id: string;
  name: string;
  game: GameType;
  selectedNumbers: number[];
  selectedStars?: number[];
  guarantee: ReductionGuarantee;
  columnsCount: number;
  totalCost: number;
  pricePerBet: number;
  createdAt: string; // ISO date
  notes?: string;
}

export type ReductionGuarantee = 'direct' | 'guarantee_5' | 'guarantee_4' | 'guarantee_3';




export interface ReductionPlan {
  id: string;
  name: string;
  shortName: string;
  description: string;
  guaranteeText: string;
  requiredCondition: string;
}

export interface GeneratedColumn {
  id: number;
  numbers: number[];
  stars?: number[];
  reintegro?: number;
}

export interface ReductionResult {
  game: GameType;
  selectedNumbers: number[];
  selectedStars?: number[];
  guarantee: ReductionGuarantee;
  columnsCount: number;
  pricePerBet: number;
  totalCost: number;
  columns: GeneratedColumn[];
  guaranteePercent: number; // e.g. 100%
  higherTierPercent?: number; // e.g. probability of 6 or 5
}

export interface PeriodFilterState {
  preset: '1m' | '3m' | '6m' | '1y' | '2y' | 'all' | 'custom';
  startDate: string;
  endDate: string;
  selectedDay?: string; // e.g. 'all' | 'Lunes' | 'Jueves' | 'Sábado', etc.
}
