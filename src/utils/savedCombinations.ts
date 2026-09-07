import { SavedCombination } from '../types';

const STORAGE_KEY = 'loto_saved_combinations_v1';

export function getSavedCombinations(): SavedCombination[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading saved combinations:', err);
    return [];
  }
}

export function saveCombination(combo: Omit<SavedCombination, 'id' | 'createdAt'>): SavedCombination {
  const all = getSavedCombinations();
  const newCombo: SavedCombination = {
    ...combo,
    id: `combo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newCombo, ...all];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newCombo;
}

export function deleteSavedCombination(id: string): SavedCombination[] {
  const all = getSavedCombinations();
  const updated = all.filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function updateSavedCombination(id: string, updates: Partial<SavedCombination>): SavedCombination[] {
  const all = getSavedCombinations();
  const updated = all.map((c) => (c.id === id ? { ...c, ...updates } : c));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
