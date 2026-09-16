import json
import re
from datetime import datetime

SPANISH_DAYS = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
}

def parse_date(date_str):
    # format d/m/yyyy or dd/mm/yyyy
    parts = date_str.strip().split('/')
    if len(parts) == 3:
        day = int(parts[0])
        month = int(parts[1])
        year = int(parts[2])
        d_obj = datetime(year, month, day)
        iso_date = f"{year:04d}-{month:02d}-{day:02d}"
        day_of_week = SPANISH_DAYS[d_obj.weekday() if d_obj.weekday() != 6 else 0]
        # Wait: python weekday(): Monday is 0, Sunday is 6.
        # But our dict had Sunday: 0! Let's fix that properly.
        weekday_map = {
            0: 'Lunes',
            1: 'Martes',
            2: 'Miércoles',
            3: 'Jueves',
            4: 'Viernes',
            5: 'Sábado',
            6: 'Domingo'
        }
        return iso_date, weekday_map[d_obj.weekday()]
    return None, None
