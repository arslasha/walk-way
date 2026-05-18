import re
from datetime import datetime
from django.utils import timezone

DAYS_MAP = {
    'пн': 0, 'вт': 1, 'ср': 2, 'чт': 3, 'пт': 4, 'сб': 5, 'вс': 6
}
DAYS_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

def parse_days(days_str):
    """
    Parses a string of days like 'пн-пт', 'сб, вс' into a set of standard day keys.
    """
    days_str = days_str.replace(',', ' ').replace('и', ' ').strip()
    
    # Find any ranges like 'пн-пт' or 'пт-вс'
    range_match = re.search(r'([а-я]{2})\s*-\s*([а-я]{2})', days_str)
    
    selected_days = set()
    if range_match:
        start_day, end_day = range_match.groups()
        if start_day in DAYS_MAP and end_day in DAYS_MAP:
            start_idx = DAYS_MAP[start_day]
            end_idx = DAYS_MAP[end_day]
            if start_idx <= end_idx:
                for i in range(start_idx, end_idx + 1):
                    selected_days.add(DAYS_KEYS[i])
            else: # cross-week range, wrapping around
                curr = start_idx
                while curr != end_idx:
                    selected_days.add(DAYS_KEYS[curr])
                    curr = (curr + 1) % 7
                selected_days.add(DAYS_KEYS[end_idx])
    
    # Also find individual days (like 'сб', 'вс')
    individual_days = re.findall(r'\b([а-я]{2})\b', days_str)
    for day in individual_days:
        if day in DAYS_MAP:
            selected_days.add(DAYS_KEYS[DAYS_MAP[day]])
            
    if 'ежедневно' in days_str or not selected_days:
        if 'ежедневно' in days_str:
            return set(DAYS_KEYS)
            
    return selected_days

def pad_time(time_str):
    """
    Pads time strings like '0:00' to '00:00' and '12:0' to '12:00'.
    """
    time_str = time_str.strip()
    if ':' in time_str:
        h, m = time_str.split(':')
        return f'{int(h):02d}:{int(m):02d}'
    return '00:00'

def parse_timetable(timetable_str):
    """
    Converts a KudaGo timetable string into a structured JSON dictionary.
    E.g. 'пн–пт 12:00–0:00, сб, вс 10:00–0:00' -> 
    {
      'mon': [['12:00', '00:00']],
      'tue': [['12:00', '00:00']],
      ...
    }
    """
    if not timetable_str:
        return {}
    
    timetable_str = timetable_str.replace('–', '-').replace('—', '-').lower().strip()
    
    if 'круглосуточно' in timetable_str:
        return {day: [['00:00', '23:59']] for day in DAYS_KEYS}
        
    timetable_str = re.sub(r'касса:\s*', '', timetable_str)
    timetable_str = re.sub(r'\s*\([^)]*\)', '', timetable_str)
    
    pattern = r'([а-я,–\s-]+)?(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})'
    matches = re.findall(pattern, timetable_str)
    
    schedule = {day: [] for day in DAYS_KEYS}
    
    for days_str, start, end in matches:
        days_str = days_str or 'ежедневно'
        selected_days = parse_days(days_str)
        start_padded = pad_time(start)
        end_padded = pad_time(end)
        
        for day in selected_days:
            schedule[day].append([start_padded, end_padded])
            
    # Clean up empty days
    return {k: v for k, v in schedule.items() if v}

def is_open_at(schedule, day, time_str):
    """
    Checks if a place is open on a given day and time, accounting for midnight wrap-arounds.
    """
    if not schedule:
        return True # Default to open if no timetable is available
    
    if day not in DAYS_KEYS:
        return False
        
    day_idx = DAYS_KEYS.index(day)
    prev_day = DAYS_KEYS[(day_idx - 1) % 7]
    
    # Check if we are within any of the current day's intervals
    for start, end in schedule.get(day, []):
        if start <= end:
            if start <= time_str <= end:
                return True
        else: # wraps around midnight, e.g. 12:00 to 03:00
            if start <= time_str or time_str <= '00:00':
                return True
                
    # Also check if we are within the trailing part of the previous day's wrap-around interval
    for start, end in schedule.get(prev_day, []):
        if start > end: # wraps around midnight
            if time_str <= end:
                return True
                
    return False

# Heuristic category/tag constants
OUTDOOR_CATEGORIES = {
    'park', 'prirodnyj-zapovednik', 'attractions', 'photo-places', 'beach', 
    'viewpoint', 'cemetery', 'bridge', 'fountain', 'recreation'
}

OUTDOOR_TAGS = {
    'парк', 'пляж', 'парки', 'сады', 'набережная', 'улица', 'площадь', 
    'под-открытым-небом', 'на-открытом-воздухе', 'каток', 'усадьба', 
    'природа', 'заповедник'
}

FREE_KEYWORDS = {'бесплатно', 'свободный вход', 'вход свободный', 'бесплатный'}

def determine_is_indoor(main_cat_slug, tags_list):
    """
    Heuristically determines whether a place is indoors or outdoors based on categories and tags.
    """
    if main_cat_slug in OUTDOOR_CATEGORIES:
        return False
        
    for tag in tags_list:
        tag_slug = tag.replace(' ', '-').lower()
        if tag_slug in OUTDOOR_TAGS:
            return False
            
    return True

def determine_price_level(main_cat_slug, description_text):
    """
    Heuristically determines the price level of a place: 0=Free, 1=Low, 2=Medium, 3=High.
    """
    desc_lower = description_text.lower()
    for keyword in FREE_KEYWORDS:
        if keyword in desc_lower:
            return 0
            
    if main_cat_slug in {'park', 'prirodnyj-zapovednik', 'fountain', 'bridge'}:
        return 0
    elif main_cat_slug in {'restaurants', 'bar'}:
        if any(w in desc_lower for w in ['элитный', 'дорогой', 'премиум', 'высокая кухня']):
            return 3
        return 2
    elif main_cat_slug in {'anticafe', 'cinema', 'museums', 'attractions', 'recreation'}:
        return 1
    elif main_cat_slug == 'clubs':
        return 2
        
    return 1 # Default fallback is Low

def get_day_and_time(current_time_str=None):
    """
    Parses current_time_str (ISO, format YYYY-MM-DD HH:MM, or HH:MM) into a weekday and HH:MM.
    Defaults to current time if None.
    """
    if not current_time_str:
        dt = timezone.now()
    else:
        try:
            # ISO format (e.g. 2026-05-18T14:30:00Z)
            dt = datetime.fromisoformat(current_time_str.replace('Z', '+00:00'))
        except ValueError:
            try:
                # YYYY-MM-DD HH:MM
                dt = datetime.strptime(current_time_str, '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    # HH:MM
                    t = datetime.strptime(current_time_str, '%H:%M')
                    now = timezone.now()
                    dt = now.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)
                except ValueError:
                    dt = timezone.now()
                    
    # Map weekday (0=Monday) to DAYS_KEYS
    day = DAYS_KEYS[dt.weekday()]
    time_str = dt.strftime('%H:%M')
    return day, time_str

