import os
import json
import time
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.conf import settings
from places.models import Place, Tag
from openai import OpenAI, OpenAIError

SYSTEM_PROMPT = """Ты — харизматичный местный гид и эксперт по свиданиям и прогулкам. Твоя задача — анализировать описания городских локаций (парки, кафе, музеи, выставки) и определять их эмоциональный "вайб", а также придумывать крутые "айсбрейкеры" (темы или действия для свидания в этом месте).

ПРАВИЛА ДЛЯ ВАЙБОВ:
Выбери от 1 до 3 наиболее подходящих тегов из списка:
[Романтично, Уютно, Эстетично, Мрачно, Шумно, Для интровертов, Для первого свидания, Для глубоких бесед, Подумать, Почиллить, Приключения].
Если место категорически не подходит ни под один, можешь предложить свой ОДИН короткий тег, но старайся держаться списка.

ПРАВИЛА ДЛЯ АЙСБРЕЙКЕРОВ:
Придумай 1-2 идеи для взаимодействия на свидании в этом месте. Это может быть тема для обсуждения, вдохновленная локацией, или мини-игра.
Тон: Неформальный, легкий, флиртующий или интригующий. Никакой духоты и энциклопедичности. Пиши от второго лица (обращайся к пользователю). Максимум 2 предложения на один айсбрейкер.

ФОРМАТ ВЫВОДА:
Ты должен вернуть строго валидный JSON без маркдаун-оберток.
{
  "vibes": ["тег1", "тег2"],
  "icebreakers": [
    "Текст айсбрейкера 1",
    "Текст айсбрейкера 2"
  ]
}
"""

class Command(BaseCommand):
    help = "Analyzes place descriptions to generate vibes and icebreakers using LLM"

    def handle(self, *args, **options):
        api_key = os.environ.get("OPENAI_API_KEY")
        if hasattr(settings, "OPENAI_API_KEY") and settings.OPENAI_API_KEY:
            api_key = settings.OPENAI_API_KEY
            
        if not api_key:
            self.stderr.write(self.style.ERROR("OPENAI_API_KEY is not set. Cannot run LLM analysis."))
            return

        client = OpenAI(
            api_key=api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )

        places_to_analyze = Place.objects.filter(is_analyzed=False).exclude(description__isnull=True).exclude(description__exact="")
        total_places = places_to_analyze.count()
        
        self.stdout.write(f"Found {total_places} places to analyze.")

        for i, place in enumerate(places_to_analyze):
            self.stdout.write(f"[{i+1}/{total_places}] Analyzing: {place.title}")
            
            category_name = place.category.name if place.category else "Не указано"
            user_content = f"Название: {place.title}\nКатегория: {category_name}\nОписание: {place.description}"

            try:
                response = client.chat.completions.create(
                    model="gemini-2.0-flash", # Бесплатная модель через Google AI Studio
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_content}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7,
                )
                
                content = response.choices[0].message.content
                data = json.loads(content)
                
                vibes = data.get("vibes", [])
                icebreakers = data.get("icebreakers", [])
                
                # Assign vibes as tags
                for vibe_name in vibes:
                    if not vibe_name:
                        continue
                    
                    slug = slugify(vibe_name, allow_unicode=True)
                    if not slug:
                        slug = f"vibe-{hash(vibe_name) % 10000}"
                        
                    tag, created = Tag.objects.get_or_create(
                        slug=slug,
                        defaults={"name": vibe_name, "is_vibe": True}
                    )
                    
                    # Ensure is_vibe is true if it was an existing regular tag
                    if not created and not tag.is_vibe:
                        tag.is_vibe = True
                        tag.save()
                        
                    place.tags.add(tag)

                place.icebreakers = icebreakers
                place.is_analyzed = True
                place.save()
                
                self.stdout.write(self.style.SUCCESS(f"  -> Generated {len(vibes)} vibes and {len(icebreakers)} icebreakers"))
                
                # Small sleep to avoid rate limits on standard tiers
                time.sleep(1)
                
            except OpenAIError as e:
                self.stderr.write(self.style.ERROR(f"  -> API Error: {str(e)}"))
                time.sleep(5) # backoff
            except json.JSONDecodeError:
                self.stderr.write(self.style.ERROR("  -> Error parsing JSON response from LLM"))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"  -> Unexpected error: {str(e)}"))
                
        self.stdout.write(self.style.SUCCESS("Finished analyzing places."))
