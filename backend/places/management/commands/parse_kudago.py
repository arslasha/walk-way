import time
import requests
import logging
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.db import transaction
from django.utils.html import strip_tags
from places.models import Place, Category, Tag
from places.utils import parse_timetable, determine_is_indoor, determine_price_level

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Parses places and categories from KudaGo API with bulk operations'

    # Hardcoded priority to intelligently pick the main category
    CATEGORY_PRIORITY = [
        'park', 'prirodnyj-zapovednik', 'restaurants', 'bar', 'museums', 
        'cinema', 'theatre', 'attractions', 'art-centers', 'photo-places',
        'recreation', 'clubs', 'comedy-club', 'questroom', 'anticafe'
    ]

    def add_arguments(self, parser):
        parser.add_argument('--city', type=str, default='msk', help='City slug (e.g., msk, spb)')
        parser.add_argument('--limit', type=int, default=1000, help='Maximum number of places to parse')

    def fetch_with_retry(self, url, params=None, max_retries=5):
        for attempt in range(max_retries):
            try:
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 429:
                    sleep_time = (2 ** attempt) + 1
                    self.stderr.write(self.style.WARNING(f'Rate limited (429). Retrying in {sleep_time}s...'))
                    time.sleep(sleep_time)
                    continue
                response.raise_for_status()
                return response.json()
            except requests.RequestException as e:
                if attempt == max_retries - 1:
                    self.stderr.write(self.style.ERROR(f'Request failed after {max_retries} attempts: {e}'))
                    return None
                sleep_time = (2 ** attempt) + 1
                self.stderr.write(self.style.WARNING(f'Request failed: {e}. Retrying in {sleep_time}s...'))
                time.sleep(sleep_time)
        return None

    def handle(self, *args, **options):
        city = options['city']
        limit = options['limit']

        self.stdout.write(self.style.NOTICE('Starting KudaGo Bulk Parsing...'))

        # 1. Parse Categories
        self.stdout.write(self.style.NOTICE('Fetching Categories...'))
        categories_map = self.parse_categories()

        # 2. Parse Places
        self.stdout.write(self.style.NOTICE(f'Fetching Places for city: {city} (Limit: {limit})'))
        self.parse_places(city, limit, categories_map)

        self.stdout.write(self.style.SUCCESS('KudaGo bulk parsing finished successfully!'))

    def parse_categories(self):
        url = 'https://kudago.com/public-api/v1.4/place-categories/'
        data = self.fetch_with_retry(url)
        
        categories_map = {}
        if not data:
            return categories_map

        created_count = 0
        for cat_data in data:
            slug = cat_data.get('slug')
            name = cat_data.get('name')
            if not slug or not name:
                continue

            category, created = Category.objects.update_or_create(
                slug=slug,
                defaults={'name': name}
            )
            categories_map[slug] = category
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Categories processed. Created: {created_count}'))
        return categories_map

    def parse_places(self, city, limit, categories_map):
        base_url = 'https://kudago.com/public-api/v1.4/places/'
        params = {
            'location': city,
            'fields': 'id,title,address,coords,categories,tags,description,body_text,images,timetable',
            'page_size': 100,
            'categories': ','.join(self.CATEGORY_PRIORITY)
        }

        url = base_url
        processed_count = 0
        page = 1

        while url and processed_count < limit:
            self.stdout.write(f'Fetching page {page} (Processed: {processed_count}/{limit})...')
            data = self.fetch_with_retry(url, params=params if page == 1 else None)
            
            if not data:
                break

            results = data.get('results', [])
            if not results:
                break
                
            # If the current page exceeds our limit, slice the results
            if processed_count + len(results) > limit:
                results = results[:limit - processed_count]

            self.process_places_batch(results, categories_map)
            
            processed_count += len(results)
            url = data.get('next')
            page += 1
            time.sleep(0.3)  # Small base delay to respect API

        self.stdout.write(self.style.SUCCESS(f'Total places processed: {processed_count}'))

    @transaction.atomic
    def process_places_batch(self, results, categories_map):
        existing_kudago_ids = set(Place.objects.filter(
            kudago_id__in=[p.get('id') for p in results if p.get('id')]
        ).values_list('kudago_id', flat=True))

        places_to_create = []
        places_to_update = []
        place_tags_mapping = {} # kudago_id -> list of feature tag names

        for place_data in results:
            kudago_id = place_data.get('id')
            coords = place_data.get('coords')

            if not kudago_id or not coords or 'lat' not in coords or 'lon' not in coords:
                continue

            try:
                location = Point(float(coords['lon']), float(coords['lat']))
            except (ValueError, TypeError):
                continue

            raw_categories = place_data.get('categories', [])
            main_category = None
            secondary_tags = []

            if raw_categories:
                def get_priority(slug):
                    try:
                        return self.CATEGORY_PRIORITY.index(slug)
                    except ValueError:
                        return 999
                
                sorted_cats = sorted(raw_categories, key=get_priority)
                main_cat_slug = sorted_cats[0]
                main_category = categories_map.get(main_cat_slug)

                for cat_slug in sorted_cats[1:]:
                    if cat_slug in categories_map:
                        secondary_tags.append(categories_map[cat_slug].name)

            kudago_tags = place_data.get('tags', [])
            all_feature_tags = set(secondary_tags + kudago_tags)
            place_tags_mapping[kudago_id] = all_feature_tags

            description = place_data.get('description') or place_data.get('body_text') or ''
            clean_desc = strip_tags(description).strip()

            images = place_data.get('images', [])
            photo_urls = [img.get('image') for img in images if img.get('image')]

            timetable = place_data.get('timetable') or ''
            opening_hours = parse_timetable(timetable)
            
            main_cat_slug = main_category.slug if main_category else ''
            is_indoor = determine_is_indoor(main_cat_slug, kudago_tags)
            price_level = determine_price_level(main_cat_slug, clean_desc)

            place_obj = Place(
                kudago_id=kudago_id,
                title=place_data.get('title', 'Unknown'),
                description=clean_desc,
                address=place_data.get('address', ''),
                location=location,
                category=main_category,
                photos=photo_urls,
                is_active=True,
                opening_hours=opening_hours,
                opening_hours_text=timetable,
                price_level=price_level,
                is_indoor=is_indoor,
            )

            if kudago_id in existing_kudago_ids:
                places_to_update.append(place_obj)
            else:
                places_to_create.append(place_obj)

        # 1. Bulk Create Places
        if places_to_create:
            Place.objects.bulk_create(places_to_create, ignore_conflicts=True)
            
        # 2. Bulk Update Places
        if places_to_update:
            update_fields = [
                'title', 'description', 'address', 'location', 'category', 
                'photos', 'is_active', 'opening_hours', 'opening_hours_text', 
                'price_level', 'is_indoor'
            ]
            # Fetch real objects for updating
            existing_places_qs = Place.objects.filter(kudago_id__in=[p.kudago_id for p in places_to_update])
            existing_places_dict = {p.kudago_id: p for p in existing_places_qs}
            
            ready_to_update = []
            for p in places_to_update:
                if p.kudago_id in existing_places_dict:
                    real_p = existing_places_dict[p.kudago_id]
                    # Update fields on real_p
                    for field in update_fields:
                        setattr(real_p, field, getattr(p, field))
                    ready_to_update.append(real_p)
            
            Place.objects.bulk_update(ready_to_update, update_fields)

        # 3. Bulk Create Tags
        all_tag_names = set()
        for tags in place_tags_mapping.values():
            all_tag_names.update(tags)

        tag_dict = {}
        for tag_name in all_tag_names:
            tag_name = tag_name.strip().lower()
            if tag_name:
                tag_dict[tag_name.replace(' ', '-')] = tag_name.capitalize()

        existing_tag_slugs = set(Tag.objects.filter(slug__in=tag_dict.keys()).values_list('slug', flat=True))
        tags_to_create = [
            Tag(slug=slug, name=name, is_vibe=False)
            for slug, name in tag_dict.items()
            if slug not in existing_tag_slugs
        ]
        if tags_to_create:
            Tag.objects.bulk_create(tags_to_create, ignore_conflicts=True)

        # 4. Bulk M2M Assignment
        all_processed_kudago_ids = list(place_tags_mapping.keys())
        saved_places = Place.objects.filter(kudago_id__in=all_processed_kudago_ids)
        all_tags = {tag.slug: tag for tag in Tag.objects.filter(slug__in=tag_dict.keys())}
        
        PlaceTagsThrough = Place.tags.through
        m2m_objects = []
        
        # Clear existing M2M to properly handle tag removals/updates
        PlaceTagsThrough.objects.filter(place__in=saved_places).delete()

        for place in saved_places:
            place_tag_names = place_tags_mapping.get(place.kudago_id, [])
            for tag_name in place_tag_names:
                tag_slug = tag_name.strip().lower().replace(' ', '-')
                if tag_slug in all_tags:
                    m2m_objects.append(PlaceTagsThrough(place_id=place.id, tag_id=all_tags[tag_slug].id))
                    
        if m2m_objects:
            PlaceTagsThrough.objects.bulk_create(m2m_objects, ignore_conflicts=True)
