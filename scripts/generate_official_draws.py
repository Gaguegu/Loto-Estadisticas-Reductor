import json
from datetime import datetime

SPANISH_DAYS = {
    0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves',
    4: 'Viernes', 5: 'Sábado', 6: 'Domingo'
}

def parse_line(line, game):
    parts = line.strip().split()
    if not parts or len(parts) < 6:
        return None
    date_parts = parts[0].split('/')
    if len(date_parts) != 3:
        return None
    d, m, y = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
    # Filter strictly to the last 2 years (2025 and 2026) for optimal size (<300 KB) and performance
    if y < 2025:
        return None
    iso_date = f'{y:04d}-{m:02d}-{d:02d}'
    dt = datetime(y, m, d)
    day_name = SPANISH_DAYS[dt.weekday()]
    
    if game == 'primitiva':
        # date num1 num2 num3 num4 num5 num6 comp reint [joker]
        nums = sorted([int(x) for x in parts[1:7]])
        comp = int(parts[7]) if len(parts) > 7 else None
        reint = int(parts[8]) if len(parts) > 8 else None
        joker = parts[9] if len(parts) > 9 else None
        item = {
            'id': f'pr-{iso_date}',
            'game': 'primitiva',
            'date': iso_date,
            'dayOfWeek': day_name,
            'numbers': nums,
        }
        if comp is not None: item['complementario'] = comp
        if reint is not None: item['reintegro'] = reint
        if joker is not None: item['joker'] = joker
        return item
    elif game == 'bonoloto':
        # date num1 num2 num3 num4 num5 num6 comp reint
        nums = sorted([int(x) for x in parts[1:7]])
        comp = int(parts[7]) if len(parts) > 7 else None
        reint = int(parts[8]) if len(parts) > 8 else None
        item = {
            'id': f'bn-{iso_date}',
            'game': 'bonoloto',
            'date': iso_date,
            'dayOfWeek': day_name,
            'numbers': nums,
        }
        if comp is not None: item['complementario'] = comp
        if reint is not None: item['reintegro'] = reint
        return item
    elif game == 'euromillones':
        # date num1 num2 num3 num4 num5 star1 star2
        nums = sorted([int(x) for x in parts[1:6]])
        stars = sorted([int(x) for x in parts[6:8]]) if len(parts) >= 8 else []
        item = {
            'id': f'em-{iso_date}',
            'game': 'euromillones',
            'date': iso_date,
            'dayOfWeek': day_name,
            'numbers': nums,
            'stars': stars
        }
        return item

all_draws = []

for l in open('scripts/raw_primitiva.txt'):
    d = parse_line(l, 'primitiva')
    if d: all_draws.append(d)

for l in open('scripts/raw_bonoloto.txt'):
    d = parse_line(l, 'bonoloto')
    if d: all_draws.append(d)

for l in open('scripts/raw_euromillones.txt'):
    d = parse_line(l, 'euromillones')
    if d: all_draws.append(d)

# Sort all draws descending by date
all_draws.sort(key=lambda x: (x['date'], x['game']), reverse=True)

print(f'Total draws to generate: {len(all_draws)}')

ts_header = '''// Official Historical Draws Database from Loterías y Apuestas del Estado (SELAE)
// Contains complete verified draws for 2025 and 2026 for La Primitiva, Bonoloto, and Euromillones
import { LotteryDraw } from '../types';

export const OFFICIAL_HISTORICAL_DRAWS: LotteryDraw[] = '''

with open('src/data/officialDrawsData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_header)
    f.write(json.dumps(all_draws, indent=2, ensure_ascii=False))
    f.write(';\n')

print('Successfully written src/data/officialDrawsData.ts')
