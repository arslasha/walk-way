import time
import requests
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.db import transaction
from django.utils.html import strip_tags
from places.models import Place, Category, Tag

class Command(BaseCommand):
    help = 'Parses places and categories from KudaGo API'

    # Hardcoded priority to intelligently pick the main category
    # The lower the index, the higher the priority.
    CATEGORY_PRIORITY = [
        'park', 'prirodnyj-zapovednik', 'restaurants', 'bar', 'museums', 
        'cinema', 'theatre', 'attractions', 'art-centers', 'photo-places',
        'recreation', 'clubs', 'comedy-club', 'questroom', 'anticafe'
    ]

    def add_arguments(self, parser):
        parser.add_argument('--city', type=str, default='msk', help='City slug (e.g., msk, spb)')
        parser.add_argument('--pages', type=int, default=3, help='Number of pages to parse (100 items per page)')

    def handle(self, *args, **options):
        city = options['city']
        max_pages = options['pages']

        self.stdout.write(self.style.NOTICE('Starting KudaGo Parsing...'))

        # 1. Parse Categories
        self.stdout.write(self.style.NOTICE('Fetching Categories...'))
        categories_map = self.parse_categories()

        # 2. Parse Places
        self.stdout.write(self.style.NOTICE(f'Fetching Places for city: {city} (Max pages: {max_pages})'))
        self.parse_places(city, max_pages, categories_map)

        self.stdout.write(self.style.SUCCESS('KudaGo parsing finished successfully!'))

    def parse_categories(self):
        url = 'https://kudago.com/public-api/v1.4/place-categories/'
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        categories_map = {}
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

    def parse_places(self, city, max_pages, categories_map):
        base_url = 'https://kudago.com/public-api/v1.4/places/'
        params = {
            'location': city,
            'fields': 'id,title,address,coords,categories,tags,description,body_text,images',
            'page_size': 100,
        }

        url = base_url
        page = 1
        total_created = 0
        total_updated = 0

        while url and page <= max_pages:
            self.stdout.write(f'Fetching page {page}...')
            try:
                response = requests.get(url, params=params if page == 1 else None)
                response.raise_for_status()
            except requests.RequestException as e:
                self.stderr.write(self.style.ERROR(f'Failed to fetch page {page}: {e}'))
                break

            data = response.json()
            results = data.get('results', [])

            for place_data in results:
                created = self.process_place(place_data, categories_map)
                if created is True:
                    total_created += 1
                elif created is False:
                    total_updated += 1

            url = data.get('next')
            page += 1
            time.sleep(0.5)  # Be nice to the API

        self.stdout.write(self.style.SUCCESS(f'Places processed. Created: {total_created}, Updated: {total_updated}'))

    @transaction.atomic
    def process_place(self, place_data, categories_map):
        kudago_id = place_data.get('id')
        coords = place_data.get('coords')

        if not coords or 'lat' not in coords or 'lon' not in coords:
            self.stderr.write(f"Skipping place {kudago_id}: No coordinates.")
            return None

        # PointField requires (longitude, latitude)
        try:
            location = Point(float(coords['lon']), float(coords['lat']))
        except (ValueError, TypeError):
            self.stderr.write(f"Skipping place {kudago_id}: Invalid coordinates.")
            return None

        # Category processing
        raw_categories = place_data.get('categories', [])
        main_category = None
        secondary_tags = []

        if raw_categories:
            # Sort categories by priority
            def get_priority(slug):
                try:
                    return self.CATEGORY_PRIORITY.index(slug)
                except ValueError:
                    return 999  # Lowest priority
            
            sorted_cats = sorted(raw_categories, key=get_priority)
            main_cat_slug = sorted_cats[0]
            main_category = categories_map.get(main_cat_slug)

            # Rest become tags
            for cat_slug in sorted_cats[1:]:
                if cat_slug in categories_map:
                    secondary_tags.append(categories_map[cat_slug].name)

        # Tags processing (from KudaGo tags array)
        kudago_tags = place_data.get('tags', [])
        all_feature_tags = set(secondary_tags + kudago_tags)

        # Parse description
        description = place_data.get('description') or place_data.get('body_text') or ''
        clean_desc = strip_tags(description).strip()

        # Parse images
        images = place_data.get('images', [])
        photo_urls = [img.get('image') for img in images if img.get('image')]

        # Save to DB
        place, created = Place.objects.update_or_create(
            kudago_id=kudago_id,
            defaults={
                'title': place_data.get('title', 'Unknown'),
                'description': clean_desc,
                'address': place_data.get('address', ''),
                'location': location,
                'category': main_category,
                'photos': photo_urls,
                'is_active': True,
            }
        )

        # Associate tags
        tag_objects = []
        for tag_name in all_feature_tags:
            tag_name = tag_name.strip().lower()
            if not tag_name:
                continue
            
            # Using get_or_create to ensure tag exists. 
            # These are KudaGo tags, so is_vibe=False.
            tag_obj, _ = Tag.objects.get_or_create(
                slug=tag_name.replace(' ', '-'),
                defaults={'name': tag_name.capitalize(), 'is_vibe': False}
            )
            tag_objects.append(tag_obj)

        place.tags.set(tag_objects)

        return created
