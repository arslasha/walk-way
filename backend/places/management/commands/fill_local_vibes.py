from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.db import transaction
from places.models import Place, Category, Tag

class Command(BaseCommand):
    help = "Locally populates vibe tags and icebreakers for all places based on category heuristics."

    VIBES_LIST = [
        ("Романтично", "романтично"),
        ("Уютно", "уютно"),
        ("Эстетично", "эстетично"),
        ("Мрачно", "мрачно"),
        ("Шумно", "шумно"),
        ("Для интровертов", "для-интровертов"),
        ("Для первого свидания", "для-первого-свидания"),
        ("Для глубоких бесед", "для-глубоких-бесед"),
        ("Подумать", "подумать"),
        ("Почиллить", "почиллить"),
        ("Приключения", "приключения")
    ]

    # Category mapping to vibe names
    CATEGORY_VIBES = {
        "park": ["Почиллить", "Эстетично", "Для интровертов"],
        "prirodnyj-zapovednik": ["Почиллить", "Эстетично", "Для интровертов"],
        "restaurants": ["Шумно", "Для первого свидания", "Романтично"],
        "bar": ["Шумно", "Для первого свидания", "Романтично"],
        "clubs": ["Шумно", "Приключения"],
        "comedy-club": ["Шумно", "Для первого свидания"],
        "museums": ["Эстетично", "Для первого свидания", "Для глубоких бесед"],
        "art-centers": ["Эстетично", "Для первого свидания", "Для глубоких бесед"],
        "theatre": ["Эстетично", "Для глубоких бесед"],
        "cinema": ["Для первого свидания", "Уютно"],
        "anticafe": ["Приключения", "Уютно"],
        "questroom": ["Приключения", "Уютно"],
    }

    # Category mapping to icebreakers
    CATEGORY_ICEBREAKERS = {
        "park": [
            "Устройте мини-соревнование: кто первым заметит белку или самое необычное дерево на этой тропинке?",
            "Спроси партнера, любит ли он гулять под теплым летним дождем или предпочитает исключительно ясную погоду."
        ],
        "prirodnyj-zapovednik": [
            "Устройте мини-соревнование: кто первым заметит белку или самое необычное дерево на этой тропинке?",
            "Спроси партнера, любит ли он гулять под теплым летним дождем или предпочитает исключительно ясную погоду."
        ],
        "restaurants": [
            "Попробуйте угадать любимое блюдо друг друга по меню, основываясь только на первом впечатлении.",
            "Какое самое необычное блюдо ты когда-либо пробовал в жизни?"
        ],
        "bar": [
            "Закажите друг другу по напитку, который ассоциируется у вас с характером собеседника.",
            "Сыграйте в быструю игру «Я никогда не...» прямо за барной стойкой."
        ],
        "clubs": [
            "Под какую песню ты готов танцевать всю ночь без остановки?",
            "Какое самое безумное воспоминание у тебя связано с ночными клубами?"
        ],
        "comedy-club": [
            "Как думаешь, кто из комиков сегодня выступит круче всех?",
            "Какая твоя самая любимая шутка или мем в последнее время?"
        ],
        "museums": [
            "Выбери один экспонат или картину, которую ты бы забрал домой, и объясни свой выбор.",
            "Спроси, какое направление в искусстве собеседнику ближе: классика или безумный постмодерн?"
        ],
        "art-centers": [
            "Выбери один экспонат или картину, которую ты бы забрал домой, и объясни свой выбор.",
            "Спроси, какое направление в искусстве собеседнику ближе: классика или безумный постмодерн?"
        ],
        "theatre": [
            "Какой спектакль или фильм произвел на тебя самое сильное эмоциональное впечатление в последнее время?",
            "Если бы ты играл в театре, какую роль ты бы хотел примерить?"
        ],
        "cinema": [
            "Если бы про твою жизнь снимали кино, в каком жанре оно бы было и кто сыграл бы главную роль?",
            "Какой твой самый любимый фильм детства, который ты готов пересматривать бесконечно?"
        ],
        "anticafe": [
            "Спроси собеседника, в какой квест или настольную игру он мечтает сыграть в большой компании.",
            "Сыграйте в быструю партию в крестики-нолики на желание!"
        ],
        "questroom": [
            "Спроси собеседника, в какой квест или настольную игру он мечтает сыграть в большой компании.",
            "Сыграйте в быструю партию в крестики-нолики на желание!"
        ],
    }

    DEFAULT_VIBES = ["Почиллить", "Подумать"]
    DEFAULT_ICEBREAKERS = [
        "Расскажи о своем самом запоминающемся приключении в этом городе за последний год.",
        "Если бы ты мог переместиться в любую точку мира прямо сейчас, куда бы ты отправился?"
    ]

    def handle(self, *args, **options):
        self.stdout.write("Initializing local vibe tags...")
        
        # 1. Create all base vibe tags
        tag_objects = {}
        for name, slug in self.VIBES_LIST:
            tag, created = Tag.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "is_vibe": True}
            )
            tag_objects[name] = tag
            if created:
                self.stdout.write(f"Created vibe tag: {name}")

        # 2. Query places to update
        places_qs = Place.objects.all().select_related("category")
        total_places = places_qs.count()
        self.stdout.write(f"Found {total_places} places to enrich.")

        updated_count = 0
        
        with transaction.atomic():
            for place in places_qs:
                cat_slug = place.category.slug if place.category else ""
                
                # Determine vibe names
                vibe_names = self.CATEGORY_VIBES.get(cat_slug, self.DEFAULT_VIBES)
                # Determine icebreakers
                icebreakers = self.CATEGORY_ICEBREAKERS.get(cat_slug, self.DEFAULT_ICEBREAKERS)

                # Add vibe tags
                place_tags = [tag_objects[name] for name in vibe_names]
                place.tags.add(*place_tags)

                # Update place fields
                place.icebreakers = icebreakers
                place.is_analyzed = True
                place.save()
                
                updated_count += 1
                if updated_count % 100 == 0:
                    self.stdout.write(f"Processed {updated_count}/{total_places} places...")

        self.stdout.write(self.style.SUCCESS(f"Successfully enriched {updated_count} places with vibe tags and icebreakers!"))
