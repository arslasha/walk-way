# Walk-Way

Умный планировщик прогулок и свиданий, объединяющий функционал гео-справочника и социальной сети.
Проект подбирает места и строит маршруты, основываясь на "вайбе" (настроении), компании и свободном времени пользователя, а не только на физическом расстоянии.

## Технологический стек
- **Frontend:** Next.js (App Router), Tailwind CSS
- **Backend:** Python, Django, Django REST Framework, GeoDjango
- **Database:** PostgreSQL с расширением PostGIS
- **Architecture:** 3-слойная оркестрация (Directives, Orchestration, Execution)

## Структура проекта
- `directives/` - Стандартные операционные процедуры (SOP) и документация.
- `execution/` - Детерминированные скрипты (парсинг KudaGo, утилиты).
- `frontend/` - Исходный код клиентской части.
- `backend/` - Исходный код серверной части и базы данных.

## Текущая фаза: Phase 1
Разработка Data Engine & Core Search:
- Развертывание PostgreSQL + PostGIS
- Интеграция с API (KudaGo)
- LLM-Enrichment для тегирования мест
- Базовый REST API для сложной фильтрации
