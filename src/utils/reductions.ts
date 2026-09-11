import { GameType, ReductionGuarantee, GeneratedColumn, ReductionResult, ReductionPlan } from '../types';

export const REDUCTION_PLANS: Record<ReductionGuarantee, ReductionPlan> = {
  direct: {
    id: 'direct',
    name: 'Directo (100% al 6 / 5)',
    shortName: 'Directo',
    description: 'Genera todas las combinaciones posibles. Garantiza el premio mayor si los números ganadores están dentro de tu selección.',
    guaranteeText: '100% al 6 (o al 5 en Euromillones)',
    requiredCondition: 'Todos los aciertos',
  },
  guarantee_5: {
    id: 'guarantee_5',
    name: 'Reducida al 5 (100% garantía si 6 aciertos)',
    shortName: 'Reducida al 5',
    description: 'Garantiza al 100% al menos un premio de 5 aciertos si los 6 números ganadores están entre tus elegidos (con altas probabilidades de 6).',
    guaranteeText: '100% de 5 aciertos (si entran los 6)',
    requiredCondition: '5 de 6 aciertos',
  },
  guarantee_4: {
    id: 'guarantee_4',
    name: 'Reducida al 4 (100% garantía si 6 aciertos)',
    shortName: 'Reducida al 4',
    description: 'Garantiza al 100% al menos un premio de 4 aciertos si los 6 números ganadores están entre tus elegidos, con costo muy económico.',
    guaranteeText: '100% de 4 aciertos (si entran los 6)',
    requiredCondition: '4 de 6 aciertos',
  },
  guarantee_3: {
    id: 'guarantee_3',
    name: 'Reducida al 3 (Super reducida económica)',
    shortName: 'Reducida al 3',
    description: 'Máximo ahorro de apuestas garantizando al 100% al menos un premio de 3 aciertos.',
    guaranteeText: '100% de 3 aciertos (si entran los 6)',
    requiredCondition: '3 de 6 aciertos',
  },
};

// Generates mathematical combinations C(n, k)
export function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  if (arr.length === k) return [arr];

  const head = arr[0];
  const tail = arr.slice(1);

  const withHead = getCombinations(tail, k - 1).map((combo) => [head, ...combo]);
  const withoutHead = getCombinations(tail, k);

  return [...withHead, ...withoutHead];
}

// Well-tested optimal indexing templates for Spanish lottery standard reductions
// 0-indexed relative positions (from 0 to N-1)
const REDUCTION_TEMPLATES_6: Record<number, Partial<Record<ReductionGuarantee, number[][]>>> = {
  6: {
    direct: [[0, 1, 2, 3, 4, 5]],
    guarantee_5: [[0, 1, 2, 3, 4, 5]],
    guarantee_4: [[0, 1, 2, 3, 4, 5]],
    guarantee_3: [[0, 1, 2, 3, 4, 5]],
  },
  7: {
    guarantee_5: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 3, 4, 6],
    ],
    guarantee_4: [[0, 1, 2, 3, 4, 5]],
    guarantee_3: [[0, 1, 2, 3, 4, 5]],
  },
  8: {
    guarantee_5: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 3, 6, 7],
      [0, 1, 4, 5, 6, 7],
      [2, 3, 4, 5, 6, 7],
    ],
    guarantee_4: [
      [0, 1, 2, 3, 4, 5],
      [0, 2, 4, 5, 6, 7],
    ],
    guarantee_3: [[0, 1, 2, 3, 4, 5]],
  },
  9: {
    guarantee_5: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 3, 6, 7],
      [0, 1, 2, 4, 7, 8],
      [0, 3, 4, 5, 6, 8],
      [1, 2, 5, 6, 7, 8],
      [1, 3, 4, 6, 7, 8],
      [2, 3, 5, 6, 7, 8],
    ],
    guarantee_4: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 6, 7, 8],
      [3, 4, 5, 6, 7, 8],
    ],
    guarantee_3: [[0, 1, 2, 3, 4, 5]],
  },
  10: {
    guarantee_5: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 6, 7, 8],
      [0, 1, 3, 4, 6, 9],
      [0, 2, 4, 5, 7, 9],
      [0, 3, 5, 6, 8, 9],
      [1, 2, 3, 7, 8, 9],
      [1, 4, 5, 6, 7, 8],
      [2, 3, 4, 5, 6, 8],
      [0, 1, 5, 7, 8, 9],
      [2, 4, 6, 7, 8, 9],
      [1, 3, 5, 6, 7, 9],
      [0, 2, 3, 4, 8, 9],
      [1, 2, 4, 6, 8, 9],
      [3, 4, 5, 7, 8, 9],
    ],
    guarantee_4: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 6, 7, 8],
      [3, 4, 5, 6, 7, 9],
      [0, 2, 4, 7, 8, 9],
    ],
    guarantee_3: [
      [0, 1, 2, 3, 4, 5],
      [4, 5, 6, 7, 8, 9],
    ],
  },
  11: {
    guarantee_4: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 6, 7, 8],
      [0, 3, 4, 6, 9, 10],
      [1, 5, 6, 7, 9, 10],
      [2, 3, 5, 8, 9, 10],
      [2, 4, 7, 8, 9, 10],
      [3, 4, 5, 6, 7, 8],
    ],
    guarantee_3: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 6, 7, 8, 9],
      [2, 3, 4, 5, 9, 10],
    ],
  },
  12: {
    guarantee_4: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 6, 7, 8],
      [0, 3, 4, 6, 9, 10],
      [1, 3, 5, 7, 9, 11],
      [2, 4, 5, 8, 10, 11],
      [3, 4, 5, 6, 7, 8],
      [0, 2, 5, 7, 8, 10],
      [1, 4, 6, 8, 9, 11],
      [0, 1, 7, 9, 10, 11],
      [2, 3, 6, 8, 9, 10],
      [4, 5, 6, 7, 10, 11],
      [1, 2, 3, 5, 6, 11],
    ],
    guarantee_3: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 6, 7, 8, 9],
      [2, 3, 7, 8, 10, 11],
      [4, 5, 6, 9, 10, 11],
    ],
  },
};

// Greedy covering algorithm for optimal or arbitrary reductions
function generateGreedyCover(
  items: number[],
  pickSize: number, // 6 for Primitiva, 5 for Euromillones
  targetMatch: number, // 5, 4, or 3
  conditionSize: number // 6 for Primitiva (if 6 hit)
): number[][] {
  const allSubsets = getCombinations(items, conditionSize);
  const candidateBets = getCombinations(items, pickSize);

  // Set of targets to cover
  const uncovered = new Set<number>(allSubsets.map((_, idx) => idx));
  const chosenBets: number[][] = [];

  // Pre-calculate which subsets each candidate bet covers
  const betCovers = candidateBets.map((bet) => {
    const betSet = new Set(bet);
    const coveredSubsets: number[] = [];
    allSubsets.forEach((subset, sIdx) => {
      let matchCount = 0;
      for (const num of subset) {
        if (betSet.has(num)) matchCount++;
      }
      if (matchCount >= targetMatch) {
        coveredSubsets.push(sIdx);
      }
    });
    return coveredSubsets;
  });

  // Greedy selection: pick the bet that covers the maximum number of uncovered subsets
  while (uncovered.size > 0 && candidateBets.length > 0) {
    let bestBetIdx = -1;
    let maxNewCovered = -1;

    for (let i = 0; i < candidateBets.length; i++) {
      let count = 0;
      const covers = betCovers[i];
      for (let j = 0; j < covers.length; j++) {
        if (uncovered.has(covers[j])) count++;
      }
      if (count > maxNewCovered) {
        maxNewCovered = count;
        bestBetIdx = i;
      }
    }

    if (bestBetIdx === -1 || maxNewCovered <= 0) {
      break;
    }

    const chosen = candidateBets[bestBetIdx];
    chosenBets.push(chosen);

    // Remove covered subsets
    const covers = betCovers[bestBetIdx];
    for (let j = 0; j < covers.length; j++) {
      uncovered.delete(covers[j]);
    }
  }

  return chosenBets;
}

export function generateReducedColumns(
  selectedNumbers: number[],
  game: GameType,
  guarantee: ReductionGuarantee,
  selectedStars: number[] = [],
  pricePerBet: number
): ReductionResult {
  const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b);
  const n = sortedNumbers.length;
  const pickSize = game === 'euromillones' ? 5 : 6;

  let columnsRaw: number[][] = [];

  if (guarantee === 'direct') {
    columnsRaw = getCombinations(sortedNumbers, pickSize);
  } else if (game === 'primitiva' || game === 'bonoloto') {
    // Check if we have pre-calculated minimal template
    const templateForN = REDUCTION_TEMPLATES_6[n];
    if (templateForN && templateForN[guarantee]) {
      const indexMatrix = templateForN[guarantee]!;
      columnsRaw = indexMatrix.map((indexes) => indexes.map((idx) => sortedNumbers[idx]));
    } else {
      // Use mathematical greedy cover algorithm
      const targetMatch = guarantee === 'guarantee_5' ? 5 : guarantee === 'guarantee_4' ? 4 : 3;
      columnsRaw = generateGreedyCover(sortedNumbers, 6, targetMatch, 6);
    }
  } else {
    // Euromillones (5 numbers chosen from selectedNumbers)
    const targetMatch = guarantee === 'guarantee_5' ? 4 : guarantee === 'guarantee_4' ? 4 : 3;
    columnsRaw = generateGreedyCover(sortedNumbers, 5, targetMatch, 5);
  }

  // Sort each combination's numbers ascending
  columnsRaw.forEach((col) => col.sort((a, b) => a - b));

  // Sort combinations in natural canonical lottery order (lowest numbers first)
  columnsRaw.sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i];
      }
    }
    return a.length - b.length;
  });

  // Handle Stars for Euromillones
  const finalColumns: GeneratedColumn[] = [];

  if (game === 'euromillones') {
    // Euromillones requires 2 stars per column
    const sortedStars = [...selectedStars].sort((a, b) => a - b);
    let starPairs: number[][] = [];

    if (sortedStars.length >= 2) {
      starPairs = getCombinations(sortedStars, 2);
    } else if (sortedStars.length === 1) {
      starPairs = [[sortedStars[0], sortedStars[0] === 1 ? 2 : 1]];
    } else {
      starPairs = [[2, 8]]; // default popular stars
    }

    // Pair number combinations with star combinations
    // For direct or reduced, distribute stars across columns or pair all
    if (guarantee === 'direct' && starPairs.length > 1) {
      let idCounter = 1;
      for (const numCol of columnsRaw) {
        for (const starCol of starPairs) {
          finalColumns.push({
            id: idCounter++,
            numbers: [...numCol].sort((a, b) => a - b),
            stars: [...starCol].sort((a, b) => a - b),
          });
        }
      }
    } else {
      // Distribute stars smoothly across the generated columns
      columnsRaw.forEach((numCol, idx) => {
        const starPair = starPairs[idx % starPairs.length];
        finalColumns.push({
          id: idx + 1,
          numbers: [...numCol].sort((a, b) => a - b),
          stars: [...starPair].sort((a, b) => a - b),
        });
      });
    }
  } else {
    columnsRaw.forEach((numCol, idx) => {
      finalColumns.push({
        id: idx + 1,
        numbers: [...numCol].sort((a, b) => a - b),
      });
    });
  }

  const columnsCount = finalColumns.length;
  const totalCost = Number((columnsCount * pricePerBet).toFixed(2));

  // Calculate higher tier probability
  const allDirectCombosCount = getCombinations(sortedNumbers, pickSize).length;
  const higherTierPercent =
    allDirectCombosCount > 0
      ? Number(((columnsCount / allDirectCombosCount) * 100).toFixed(2))
      : 100;

  return {
    game,
    selectedNumbers: sortedNumbers,
    selectedStars: game === 'euromillones' ? selectedStars : undefined,
    guarantee,
    columnsCount,
    pricePerBet,
    totalCost,
    columns: finalColumns,
    guaranteePercent: 100,
    higherTierPercent,
  };
}
