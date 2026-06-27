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
        ("Мрачно", "mracno"),
        ("Шумно", "sumno"),
        ("Для интровертов", "dlya-introvertov"),
        ("Для первого свидания", "dlya-pervogo-svidaniya"),
        ("Для глубоких бесед", "dlya-glubokih-besed"),
        ("Подумать", "podumat"),
        ("Для отдыха", "dlya-otdyha"),
        ("Приключения", "priklyucheniya"),
        ("Для всей семьи", "dlya-vsey-semyi"),
        ("Необычное место", "neobychnoe-mesto"),
        ("Активно", "aktivno")
    ]

    # Category mapping to vibe names
    CATEGORY_VIBES = {
        "park": ["Для отдыха", "Эстетично", "Для интровертов"],
        "prirodnyj-zapovednik": ["Для отдыха", "Эстетично", "Для интровертов"],
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
        "recreation": ["Приключения", "Шумно"],
        "attractions": ["Эстетично", "Подумать"],
        "photo-places": ["Эстетично", "Романтично"],
    }

    # Category mapping to icebreakers
    CATEGORY_ICEBREAKERS = {
        "park": [
            "Устройте mini-соревнование: кто первым заметит белку или самое необычное дерево на этой тропинке?",
            "Спроси партнера, любит ли он гулять под теплым летним дождем или предпочитает исключительно ясную погоду."
        ],
        "prirodnyj-zapovednik": [
            "Устройте mini-соревнование: кто первым заметит белку или самое необычное дерево на этой тропинке?",
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
        "recreation": [
            "Каким активным видом спорта ты увлекаешься или хотел бы попробовать?",
            "Любишь ли ты скорость и адреналин так же, как и размеренные прогулки?"
        ],
        "attractions": [
            "Как думаешь, какая история или легенда скрывается за этим местом?",
            "Если бы ты проводил экскурсию по нашему городу, куда бы мы отправились в первую очередь?"
        ],
        "photo-places": [
            "Какой кадр, сделанный в этом месте, лучше всего передал бы сегодняшнее настроение?",
            "Любишь ли ты больше фотографировать сам или быть в кадре?"
        ],
    }

    DEFAULT_VIBES = ["Для отдыха", "Подумать"]
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
                
                # Determine base vibe names from category
                vibe_names = set(self.CATEGORY_VIBES.get(cat_slug, self.DEFAULT_VIBES))
                
                # Dynamic keyword matching based on title, description, and existing non-vibe tags
                text_to_scan = f"{place.title or ''} {place.description or ''}".lower()
                existing_tag_names = [t.name.lower() for t in place.tags.filter(is_vibe=False)]
                
                def contains_any(keywords):
                    return any(kw in text_to_scan for kw in keywords) or any(any(kw in t for kw in keywords) for t in existing_tag_names)
                
                # Apply rules
                if contains_any(["семейн", "детск", "семья", "ребенок", "детям", "всей семьей", "родител"]):
                    vibe_names.add("Для всей семьи")
                if contains_any(["необычн", "уникальн", "арт-объект", "странн", "удив", "экзотич", "секретн", "потай"]):
                    vibe_names.add("Необычное место")
                if contains_any(["активн", "спорт", "картинг", "дрифт", "прокат", "велосипед", "скалодром", "батут", "веревоч", "сноуборд", "лыжи"]):
                    vibe_names.add("Активно")
                if contains_any(["романтич", "свидан", "влюблен", "пароч", "для двоих", "свидание"]):
                    vibe_names.add("Романтично")
                    vibe_names.add("Для первого свидания")
                if contains_any(["уютн", "лампов", "домашн", "камин", "мягк", "тепл"]):
                    vibe_names.add("Уютно")
                if contains_any(["тишин", "спокой", "уединен", "интроверт", "тихий", "безлюд", "скрыт"]):
                    vibe_names.add("Для интровертов")
                    vibe_names.discard("Шумно")
                if contains_any(["шумн", "громк", "танц", "веселье", "диджей", "dj", "вечеринк", "концерт", "тусов"]):
                    vibe_names.add("Шумно")
                    vibe_names.discard("Для интровертов")
                if contains_any(["лекци", "истори", "философ", "подум", "книг", "библио", "чтен", "наук", "лекторий"]):
                    vibe_names.add("Подумать")
                    vibe_names.add("Для глубоких бесед")
                if contains_any(["красив", "архитект", "эстет", "вид на", "панорам", "фотограф", "живопис", "искусств", "галере"]):
                    vibe_names.add("Эстетично")
                if contains_any(["отдых", "прогул", "чилл", "расслаб", "релакс", "пляж", "шезлонг", "скамейк"]):
                    vibe_names.add("Для отдыха")
                
                # Determine icebreakers
                icebreakers = self.CATEGORY_ICEBREAKERS.get(cat_slug, self.DEFAULT_ICEBREAKERS)

                # Add vibe tags
                place_tags = [tag_objects[name] for name in vibe_names]
                place.tags.remove(*place.tags.filter(is_vibe=True))
                place.tags.add(*place_tags)

                # Update place fields
                place.icebreakers = icebreakers
                place.is_analyzed = True
                place.save()
                
                updated_count += 1
                if updated_count % 100 == 0:
                    self.stdout.write(f"Processed {updated_count}/{total_places} places...")

        self.stdout.write(self.style.SUCCESS(f"Successfully enriched {updated_count} places with vibe tags and icebreakers!"))
