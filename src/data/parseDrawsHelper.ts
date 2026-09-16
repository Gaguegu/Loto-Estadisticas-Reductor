// Script to parse raw text and generate official draws dataset
import fs from 'fs';
import path from 'path';

export interface RawDraw {
  id: string;
  game: 'primitiva' | 'bonoloto' | 'euromillones';
  date: string;
  dayOfWeek: string;
  numbers: number[];
  complementario?: number;
  reintegro?: number;
  stars?: number[];
  joker?: string;
}
