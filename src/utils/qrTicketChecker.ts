import { GameType, LotteryDraw } from '../types';

export interface ScannedBet {
  index: number;
  numbers: number[];
  stars?: number[];
  reintegro?: number;
}

export interface ParsedTicketData {
  raw: string;
  game: GameType;
  date?: string; // YYYY-MM-DD if extracted or inferred
  drawNumber?: string;
  reintegro?: number;
  joker?: string;
  bets: ScannedBet[];
  ticketCode?: string;
  isOfficialSELAECode: boolean;
  notes?: string;
}

export interface BetScrutinyResult {
  index: number;
  numbers: number[];
  stars?: number[];
  hitNumbers: number[];
  numberHits: number;
  hitStars: number[];
  starHits: number;
  hasComplementario: boolean;
  hasReintegro: boolean;
  prizeCategory: string;
  isPrize: boolean;
  estimatedPrize: number;
}

export interface TicketScrutinyResult {
  game: GameType;
  draw: LotteryDraw;
  betsCount: number;
  winningBetsCount: number;
  totalWon: number;
  reintegroWon: boolean;
  bets: BetScrutinyResult[];
}

export const OFFICIAL_PRIZE_ESTIMATES: Record<GameType, Record<string, number>> = {
  primitiva: {
    'Esp. Cat (6 + R)': 15000000,
    '1ª Cat (6 Aciertos)': 1400000,
    '2ª Cat (5 + C)': 38000,
    '3ª Cat (5 Aciertos)': 2200,
    '4ª Cat (4 Aciertos)': 65,
    '5ª Cat (3 Aciertos)': 8,
    'Reintegro': 1.0,
  },
  bonoloto: {
    '1ª Cat (6 Aciertos)': 400000,
    '2ª Cat (5 + C)': 12000,
    '3ª Cat (5 Aciertos)': 850,
    '4ª Cat (4 Aciertos)': 28,
    '5ª Cat (3 Aciertos)': 4,
    'Reintegro': 0.5,
  },
  euromillones: {
    '1ª Cat (5 + 2★)': 50000000,
    '2ª Cat (5 + 1★)': 250000,
    '3ª Cat (5 + 0★)': 25000,
    '4ª Cat (4 + 2★)': 2500,
    '5ª Cat (4 + 1★)': 150,
    '6ª Cat (3 + 2★)': 75,
    '7ª Cat (4 + 0★)': 50,
    '8ª Cat (2 + 2★)': 20,
    '9ª Cat (3 + 1★)': 14,
    '10ª Cat (3 + 0★)': 10,
    '11ª Cat (1 + 2★)': 9,
    '12ª Cat (2 + 1★)': 7,
    '13ª Cat (2 + 0★)': 4,
  },
};

/**
 * Parses the raw text read from a QR code or barcode on a lottery slip.
 * Handles official SELAE format strings, query parameters, or plain list formats.
 */
export function parseTicketQR(qrText: string, defaultGame: GameType = 'primitiva'): ParsedTicketData {
  const trimmed = qrText.trim();
  let detectedGame: GameType = defaultGame;
  let reintegro: number | undefined = undefined;
  let date: string | undefined = undefined;
  let drawNumber: string | undefined = undefined;
  let ticketCode: string | undefined = undefined;
  const bets: ScannedBet[] = [];
  let isOfficialSELAECode = false;

  const lower = trimmed.toLowerCase();

  // Detect game from keywords or code prefixes
  if (lower.includes('euromillones') || lower.includes('emil') || lower.includes('euro') || lower.includes('j=em')) {
    detectedGame = 'euromillones';
  } else if (lower.includes('bonoloto') || lower.includes('bono') || lower.includes('j=bn') || lower.includes('j=bo')) {
    detectedGame = 'bonoloto';
  } else if (lower.includes('primitiva') || lower.includes('prim') || lower.includes('j=lp') || lower.includes('j=pr')) {
    detectedGame = 'primitiva';
  }

  // Check if it's a URL or query string like ?A=... or &R=...
  if (trimmed.includes('loteriasyapuestas.es') || trimmed.includes('selae') || /^[A-Z0-9]{15,40}$/i.test(trimmed)) {
    isOfficialSELAECode = true;
    ticketCode = trimmed;
  }

  // Extract date if present (YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY)
  const dateMatch = trimmed.match(/(\d{4})[/-](\d{2})[/-](\d{2})/) || trimmed.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (dateMatch) {
    if (dateMatch[1].length === 4) {
      date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    } else {
      date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }

  // Extract reintegro if present (R=5 or R:5 or Reintegro: 5)
  const rMatch = trimmed.match(/(?:R|REINTEGRO)[=:\s]+(\d)/i);
  if (rMatch) {
    reintegro = parseInt(rMatch[1], 10);
  }

  // Look for structured lines or blocks of numbers:
  // e.g., "A: 03 12 24 35 44 49" or "1: 03-12-24-35-44-49"
  // or "5 12 23 34 45 + 2 9"
  const lines = trimmed.split(/[\r\n;,|]+/);

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    // Check for stars separated by * or + or ★
    let numbersPart = cleanLine;
    let starsPart = '';

    if (cleanLine.includes('★')) {
      const parts = cleanLine.split('★');
      numbersPart = parts[0];
      starsPart = parts.slice(1).join(' ');
    } else if (cleanLine.includes('+') && detectedGame === 'euromillones') {
      const parts = cleanLine.split('+');
      numbersPart = parts[0];
      starsPart = parts[1];
    } else if (cleanLine.includes('*')) {
      const parts = cleanLine.split('*');
      numbersPart = parts[0];
      starsPart = parts.slice(1).join(' ');
    }

    // Extract all numbers between 1 and 50 (or 1 and 49)
    const allInts = (numbersPart.match(/\b\d{1,2}\b/g) || [])
      .map((n) => parseInt(n, 10))
      .filter((n) => n >= 1 && n <= (detectedGame === 'euromillones' ? 50 : 49));

    // Remove duplicates and sort
    const uniqueNumbers = Array.from(new Set(allInts)).sort((a, b) => a - b);

    const neededCount = detectedGame === 'euromillones' ? 5 : 6;
    if (uniqueNumbers.length >= neededCount) {
      const betNumbers = uniqueNumbers.slice(0, neededCount);
      let betStars: number[] | undefined = undefined;

      if (detectedGame === 'euromillones') {
        const starInts = (starsPart.match(/\b\d{1,2}\b/g) || [])
          .map((n) => parseInt(n, 10))
          .filter((n) => n >= 1 && n <= 12);
        const uniqueStars = Array.from(new Set(starInts)).sort((a, b) => a - b);
        if (uniqueStars.length >= 2) {
          betStars = uniqueStars.slice(0, 2);
        } else if (uniqueNumbers.length >= 7) {
          // Maybe stars were appended at the end of numbers
          betStars = uniqueNumbers.slice(5, 7).filter((s) => s <= 12);
        }
      }

      bets.push({
        index: bets.length + 1,
        numbers: betNumbers,
        stars: betStars,
        reintegro,
      });
    }
  }

  // If no bets were found via line parsing, search whole string for groups of numbers
  if (bets.length === 0) {
    const allInts = (trimmed.match(/\b\d{1,2}\b/g) || [])
      .map((n) => parseInt(n, 10))
      .filter((n) => n >= 1 && n <= (detectedGame === 'euromillones' ? 50 : 49));

    const neededCount = detectedGame === 'euromillones' ? 5 : 6;
    if (allInts.length >= neededCount) {
      // Chunk into bets
      let i = 0;
      while (i + neededCount <= allInts.length) {
        const chunk = allInts.slice(i, i + neededCount);
        const unique = Array.from(new Set(chunk)).sort((a, b) => a - b);
        if (unique.length === neededCount) {
          let stars: number[] | undefined = undefined;
          i += neededCount;
          if (detectedGame === 'euromillones' && i + 2 <= allInts.length) {
            const possibleStars = allInts.slice(i, i + 2).filter((s) => s <= 12);
            if (possibleStars.length === 2) {
              stars = possibleStars;
              i += 2;
            }
          }
          bets.push({
            index: bets.length + 1,
            numbers: unique,
            stars,
            reintegro,
          });
        } else {
          i++;
        }
      }
    }
  }

  return {
    raw: trimmed,
    game: detectedGame,
    date,
    drawNumber,
    reintegro,
    bets,
    ticketCode,
    isOfficialSELAECode,
    notes: isOfficialSELAECode
      ? 'Código oficial de resguardo detectado. Por motivos de seguridad de SELAE, los códigos oficiales están cifrados con el número de serie de la terminal.'
      : undefined,
  };
}

/**
 * Scrutinizes parsed bets against a specific official lottery draw.
 */
export function scrutinizeTicket(
  ticket: ParsedTicketData,
  draw: LotteryDraw,
  customReintegro?: number
): TicketScrutinyResult {
  const effectiveReintegro = customReintegro !== undefined ? customReintegro : ticket.reintegro;
  const winningSet = new Set(draw.numbers);
  const winningStarsSet = new Set(draw.stars || []);

  const estimates = OFFICIAL_PRIZE_ESTIMATES[ticket.game];
  let totalWon = 0;
  let winningBetsCount = 0;
  let reintegroWon = false;

  const betsResult: BetScrutinyResult[] = ticket.bets.map((bet) => {
    const hitNumbers = bet.numbers.filter((n) => winningSet.has(n));
    const numberHits = hitNumbers.length;

    const hitStars = bet.stars ? bet.stars.filter((s) => winningStarsSet.has(s)) : [];
    const starHits = hitStars.length;

    const hasComplementario =
      draw.complementario !== undefined && bet.numbers.includes(draw.complementario);

    const betR = bet.reintegro !== undefined ? bet.reintegro : effectiveReintegro;
    const hasReintegro =
      ticket.game !== 'euromillones' &&
      draw.reintegro !== undefined &&
      betR !== undefined &&
      betR === draw.reintegro;

    if (hasReintegro) {
      reintegroWon = true;
    }

    let isPrize = false;
    let prizeCategory = 'Sin premio';
    let estimatedPrize = 0;

    if (ticket.game === 'euromillones') {
      if (numberHits === 5 && starHits === 2) {
        isPrize = true;
        prizeCategory = '1ª Cat (5 + 2★)';
      } else if (numberHits === 5 && starHits === 1) {
        isPrize = true;
        prizeCategory = '2ª Cat (5 + 1★)';
      } else if (numberHits === 5 && starHits === 0) {
        isPrize = true;
        prizeCategory = '3ª Cat (5 + 0★)';
      } else if (numberHits === 4 && starHits === 2) {
        isPrize = true;
        prizeCategory = '4ª Cat (4 + 2★)';
      } else if (numberHits === 4 && starHits === 1) {
        isPrize = true;
        prizeCategory = '5ª Cat (4 + 1★)';
      } else if (numberHits === 3 && starHits === 2) {
        isPrize = true;
        prizeCategory = '6ª Cat (3 + 2★)';
      } else if (numberHits === 4 && starHits === 0) {
        isPrize = true;
        prizeCategory = '7ª Cat (4 + 0★)';
      } else if (numberHits === 2 && starHits === 2) {
        isPrize = true;
        prizeCategory = '8ª Cat (2 + 2★)';
      } else if (numberHits === 3 && starHits === 1) {
        isPrize = true;
        prizeCategory = '9ª Cat (3 + 1★)';
      } else if (numberHits === 3 && starHits === 0) {
        isPrize = true;
        prizeCategory = '10ª Cat (3 + 0★)';
      } else if (numberHits === 1 && starHits === 2) {
        isPrize = true;
        prizeCategory = '11ª Cat (1 + 2★)';
      } else if (numberHits === 2 && starHits === 1) {
        isPrize = true;
        prizeCategory = '12ª Cat (2 + 1★)';
      } else if (numberHits === 2 && starHits === 0) {
        isPrize = true;
        prizeCategory = '13ª Cat (2 + 0★)';
      } else {
        prizeCategory = `${numberHits} aciertos`;
      }
    } else {
      // Primitiva and Bonoloto
      if (numberHits === 6) {
        isPrize = true;
        prizeCategory = hasReintegro ? 'Esp. Cat (6 + R)' : '1ª Cat (6 Aciertos)';
      } else if (numberHits === 5 && hasComplementario) {
        isPrize = true;
        prizeCategory = '2ª Cat (5 + C)';
      } else if (numberHits === 5) {
        isPrize = true;
        prizeCategory = '3ª Cat (5 Aciertos)';
      } else if (numberHits === 4) {
        isPrize = true;
        prizeCategory = '4ª Cat (4 Aciertos)';
      } else if (numberHits === 3) {
        isPrize = true;
        prizeCategory = '5ª Cat (3 Aciertos)';
      } else if (hasReintegro) {
        isPrize = true;
        prizeCategory = 'Reintegro';
      } else {
        prizeCategory = `${numberHits} aciertos`;
      }
    }

    if (isPrize) {
      winningBetsCount++;
      estimatedPrize = estimates[prizeCategory] || (hasReintegro ? estimates['Reintegro'] || 1 : 0);
      totalWon += estimatedPrize;
    }

    return {
      index: bet.index,
      numbers: bet.numbers,
      stars: bet.stars,
      hitNumbers,
      numberHits,
      hitStars,
      starHits,
      hasComplementario,
      hasReintegro,
      prizeCategory,
      isPrize,
      estimatedPrize,
    };
  });

  return {
    game: ticket.game,
    draw,
    betsCount: ticket.bets.length,
    winningBetsCount,
    totalWon,
    reintegroWon,
    bets: betsResult,
  };
}
