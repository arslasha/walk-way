# Task 013: Fix Route Rendering & Client-Side CORS Issues

**Assignee:** Frontend Agent & Backend Agent (Coordinated)
**Status:** Not Started

## Context
Пользователи сообщают, что построенный пешеходный маршрут (линия/polyline) не отображается на интерактивной карте (`/map`). При детальном анализе архитектуры и логов выявлены две критические проблемы:
1. **CORS Headers Block (Блокировка браузером):** Фронтенд-стор `routeStore.ts` выполняет клиентские запросы (`fetchRouteDetails`) напрямую к Django API (`http://localhost:8000/api/v1/routes/calculate/`). Поскольку в Django не настроены CORS-заголовки, браузер блокирует эти запросы. Запросы завершаются ошибкой, стор переходит в режим fallback с `routeGeometry: null`, из-за чего линия не рендерится.
2. **Глобальная GeoJSON пагинация бэкенда:** В `settings.py` глобально задан класс пагинации `'rest_framework_gis.pagination.GeoJsonPagination'`. Это вызывает падение `500 Internal Server Error` на обычных (не-геопространственных) эндпоинтах, таких как `/api/v1/tags/?is_vibe=true` (ошибка `TypeError: list indices must be integers or slices, not str`).

## Requirements

### 1. Backend: Настройка CORS (django-cors-headers)
- Добавить `django-cors-headers` в `backend/requirements.txt`.
- В `backend/config/settings.py` настроить:
  - Добавить `'corsheaders'` в `INSTALLED_APPS`.
  - Добавить `'corsheaders.middleware.CorsMiddleware'` в самое начало списка `MIDDLEWARE`.
  - Задать `CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]` (или разрешить все для локальной разработки `CORS_ALLOW_ALL_ORIGINS = True`).
- Пересобрать и перезапустить контейнер бэкенда для применения изменений (`docker compose up --build`).

### 2. Backend: Исправление пагинации Tag/Category ViewSets
- Чтобы предотвратить `500` ошибки на не-геопространственных данных, явно отключить GeoJSON пагинацию для `TagViewSet` и `CategoryViewSet` в `backend/places/views.py`:
  ```python
  class TagViewSet(viewsets.ReadOnlyModelViewSet):
      pagination_class = None  # Или стандартный PageNumberPagination
      ...
  ```

### 3. Frontend: Диагностика и отладка рендеринга MapLibre
- Убедиться, что `routeGeometry` успешно доходит до фронтенда (логировать в консоль браузера при обновлении стора).
- Проверить реактивность слоев `<Source>` и `<Layer>` в `frontend/app/map/page.tsx`:
  - Убедиться, что `geojsonRoute` корректно перерисовывается при обновлении `routeGeometry`.
  - Проверить, что идентификаторы слоев (`route-line-glow`, `route-line-core`) уникальны и не конфликтуют со стандартными слоями Carto.
  - При необходимости обновить порядок рендеринга, чтобы линия маршрута гарантированно рисовалась поверх слоев базовой карты.

## Constraints & Rules
- Следовать правилам Conventional Commits и 3-Layer Architecture.
- Все клиентские изменения UI должны соответствовать `DESIGN.md`.

## Status Check
- [ ] Пакет `django-cors-headers` добавлен и настроен на бэкенде.
- [ ] Клиентские запросы к `/api/v1/routes/calculate/` проходят успешно без CORS ошибок.
- [ ] Исправлена ошибка 500 на эндпоинте `/api/v1/tags/` (пагинация отключена/заменена).
- [ ] Линия маршрута корректно и плавно отображается на карте MapLibre.
