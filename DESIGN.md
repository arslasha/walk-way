# DESIGN.md — Walk-Way Design System
> **Single Source of Truth for all frontend UI/UX decisions.**
> Every component, color, and layout decision must be documented here.
> Last updated: 2026-04-29 (v2 — Dramatic Urbanism)

---

## 1. Brand Identity

**Walk-Way** — городской агрегатор мест для прогулок. Универсальная аудитория: один, с друзьями, семьёй. Не нишевый продукт.

**Visual Direction:**
- **Эстетика:** ИДОО (idooidoo.ru) — огромная типографика, floating-карточки в Hero, editorial-раскладка, крупные радиусы (40px)
- **UX навигации:** OhMyWishes (ohmywishes.com) — чистая структура, интуитивный интерфейс
- **Темы:** Светлая и тёмная на выбор пользователя
- **Дизайн-система:** "Dramatic Urbanism" — Bold Magazine стиль

---

## 2. Color System

### 2.1 Light Theme (Default)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#F8F7F4` | Page background (warm off-white) |
| `--surface` | `#FFFFFF` | Cards, navbar, modals |
| `--surface-raised` | `#F0EEE8` | Vibe tag backgrounds |
| `--border` | `#E5E3DF` | Dividers, card borders, chip borders |
| `--text-primary` | `#0F0E17` | Headings, primary text |
| `--text-secondary` | `#6B6977` | Address, meta, secondary copy |
| `--accent` | `#E86A3A` | Active chips, CTA buttons, vibe tag text |
| `--accent-hover` | `#D05A2A` | Hover state for accent |

### 2.2 Dark Theme

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0F0E17` | Page background (deep, warm dark) |
| `--surface` | `#1A1926` | Cards, navbar |
| `--surface-raised` | `#252336` | Vibe tag bg, hover states |
| `--border` | `#2E2C42` | Dividers, card borders |
| `--text-primary` | `#F0EEE8` | Headings (warm off-white) |
| `--text-secondary` | `#8B8A9E` | Address, meta, secondary copy |
| `--accent` | `#E86A3A` | Same accent — brand consistency |
| `--accent-hover` | `#F07A4A` | Hover state (slightly lighter in dark) |

### 2.3 Semantic Colors (both themes)

| Token | Light | Dark |
|---|---|---|
| `--error` | `#BA1A1A` | `#FFB4AB` |
| `--success` | `#2D6A4F` | `#52B788` |

---

## 3. Typography

**Font:** `Inter` (Google Fonts)

> Typography is the **primary visual driver**. Headlines must be massive and bold — like a magazine masthead.

| Scale | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display-hero` | 100-120px | 800 | 0.9 | -0.04em | Landing page hero (one-time use) |
| `headline-xl` | 80px | 800 | 1.0 | -0.03em | Major section headings |
| `headline-lg` | 48px | 800 | 1.1 | -0.02em | Section titles ("сейчас в топе") |
| `subheading` | 24px | 600 | 1.35 | -0.01em | Card titles, subtitles |
| `body-lg` | 20px | 400 | 1.5 | 0 | Main body copy |
| `body-md` | 16px | 400 | 1.5 | 0 | Card description, secondary |
| `label-caps` | 12px | 700 | 1.0 | +0.10em | Category overlays, section labels (UPPERCASE) |
| `caption` | 12px | 400 | 1.4 | 0 | Address, meta info |

**Lowercase principle:** Main headings use lowercase for contemporary avant-garde feel (как у ИДОО).

---

## 4. Spacing Scale (8px base)

| Token | Value | Usage |
|---|---|---|
| `xs` | 8px | Icon gaps, tight groupings |
| `sm` | 16px | Internal card padding (small) |
| `md` | 24px | Card body padding |
| `lg` | 40px | Grid gap, section spacing |
| `xl` | 80px | Between major sections |
| `stack-xl` | 120px | Landing page section breaks |
| `edge-margin` | 64px | Page side margins (landing) |
| `gutter` | 32px | Grid gutter |
| `max-width` | 1440px | Content container max-width |

---

## 5. Shape (Border Radius)

> Hyper-roundedness is a key brand signal — "friendly-premium" feel.

| Context | Value | Token |
|---|---|---|
| Cards (primary) | `40px` | `rounded-card` |
| Cards (small/secondary) | `28px` | `rounded-card-sm` |
| Buttons (pill CTA) | `9999px` | `rounded-pill` |
| Chips / Tags | `9999px` | `rounded-full` |
| Inputs | `28px` | `rounded-input` |
| CTA Banner | `32px` | `rounded-banner` |
| Modals | `32px` | `rounded-modal` |
| Floating hero cards | `24px` | `rounded-hero-card` |

---

## 6. Elevation & Shadows

### Light Theme
- Default card: no shadow, 1px `--border`
- Hover card: `box-shadow: 0 8px 24px rgba(15, 14, 23, 0.08)`
- Navbar: `box-shadow: 0 1px 0 #E5E3DF`

### Dark Theme
- Default card: 1px `--border`
- Hover card: `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35)`
- Navbar: `box-shadow: 0 1px 0 #2E2C42`

---

## 7. Component Library

### 7.1 Navbar

**Desktop (64px height):**
- `bg: --surface`, `border-bottom: 1px --border`
- Left: Logo "Walk-Way" (`font-weight: 800, font-size: 20px`)
- Center: City selector pill (`border: 1px --border, padding: 8px 16px, rounded-full`)
- Right: Theme toggle icon + "Войти" button (`secondary style`)

**Mobile:** Bottom tab bar, 4 tabs: Explore / Search / Saved / Profile

---

### 7.2 Vibe Filter Chips

- Container: `overflow-x: auto, display: flex, gap: 8px, padding: 12px 24px`
- Chip shape: `rounded-full`, `padding: 8px 16px`
- **Inactive:** `bg: --surface, border: 1px --border, color: --text-secondary`
- **Active:** `bg: --accent, color: white, border: none`
- Multi-select enabled
- **NO emoji** — text only
- Examples: `Всё сразу`, `С ветерком`, `Уличное искусство`, `Кофе и архитектура`, `Парки и природа`, `Музеи`, `Еда и рынки`, `Архитектура`, `Не знаю что хочу`

---

### 7.3 Duration & Context Pills

Same pill styling as Vibe Chips but smaller group, shown after a `|` separator.
- Duration: `1 ч`, `2 ч`, `3 ч`, `4+ ч`
- Context: `Один`, `Вдвоём`, `Компания`

---

### 7.4 Place Card (Primary Content Unit)

```
┌──────────────────────────────────┐
│ [Category overlay pill]          │
│                                  │
│   LARGE EDITORIAL PHOTO          │
│   (62% of card height, 3:2)      │
│                                  │
├──────────────────────────────────┤
│  Place Name (18px bold)          │
│  Address (12px secondary)        │
│  [Vibe tag] [Vibe tag]           │
│  ~45 мин                         │
└──────────────────────────────────┘
```

**Specs:**
- `border-radius: 12px`
- `bg: --surface`
- `border: 1px --border`
- Photo: `object-fit: cover`, top 62%, `border-radius: 12px 12px 0 0`
- Category overlay: `position: absolute, top: 12px, left: 12px`, `bg: rgba(0,0,0,0.55)`, `color: white`, `font-size: 11px`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `rounded-full`, `padding: 4px 10px`
- Card body: `padding: 16px`
- Place name: `font-size: 18px, font-weight: 700, color: --text-primary`
- Address: `font-size: 12px, color: --text-secondary, margin-top: 4px`
- Vibe tags: `bg: --surface-raised, color: --accent, font-size: 12px, font-weight: 500, rounded-full, padding: 3px 10px`
- Duration: `font-size: 12px, color: --text-secondary`
- Hover: `transform: scale(1.02), transition: 0.2s ease`

---

### 7.5 Buttons

| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | `--accent` | white | none |
| Secondary | `--surface` | `--text-primary` | `1px --border` |
| Ghost | transparent | `--accent` | none |

All buttons: `border-radius: 10px`, `padding: 10px 20px`, `font-weight: 600`, `font-size: 14px`

---

### 7.6 Input Fields

- `bg: --surface`, `border: 1px --border`, `border-radius: 8px`
- Focus: `border-color: --accent`, `outline: none`
- Placeholder: `color: --text-secondary`

### 7.7 Personal Collections (Folders)

**SaveToCollectionButton:**
- **Trigger:** Bookmark icon button (`h-9 w-9, rounded-full, border`).
- **Saved State:** Filled accent bookmark (`text-accent bg-accent/10 border-accent`).
- **Unsaved State:** Outline bookmark (`text-muted-foreground border-border bg-surface/80 hover:text-accent hover:border-accent/50`).
- **Dropdown Menu:** Translucent blurred panel (`bg-surface border border-border shadow-2xl rounded-[20px] w-64 p-4`). Supports searching/selecting existing folders with checkmarks, custom public/private icons, and inline folder creation form.

**Profile Folders Dashboard:**
- **Tab Panel:** Integrates into `/profile` tab navigation.
- **Grid Layout:** 2-column or 3-column asymmetric layout showing personal folders.
- **Folder Card:** High-contrast raised surface (`bg-surface-raised, border border-border, rounded-card-sm, padding: 20px`). Includes folder name, description, place counter, public/private state toggle, list of saved places with map pins, and an inline delete confirmation flow.

---

## 8. Layout Grid

| Breakpoint | Columns | Gap | Side Padding |
|---|---|---|---|
| Mobile `< 768px` | 1 | 16px | 16px |
| Tablet `768-1024px` | 2 | 24px | 24px |
| Desktop `> 1024px` | 2-3 | 32px | auto (max 1280px) |

> **Rule:** Place cards never exceed 3 columns. This preserves editorial weight.

---

## 9. Page Structure (Phase 1)

### `/` — Landing Page (Homepage)
**Sections:**
1. Navbar (minimal)
2. **Hero** — Massive bold headline + floating rotated preview cards (right side)
3. Vibe filter strip — "выберите настроение" + horizontal chips
4. Featured places editorial grid — 1 large card + 2 stacked (asymmetric)
5. CTA Banner — accent-color wide banner with pill button

### `/explore` — Explore Feed (Priority #1)
**Components:** Navbar → Filter Row (vibes + duration + context) → 2-col editorial card grid

### `/place/[id]` — Place Detail (Priority #2)
**Components:** Navbar → Hero photo → Details section → Vibe tags → LLM description → Similar places

---

## 10. Design Rules (DO / DON'T)

### ✅ DO
- Use editorial full-bleed photography in all cards
- Keep chip text in Russian, no emoji
- Ensure both themes feel complete and intentional (not an afterthought)
- Use `--accent #E86A3A` sparingly — only for interactive/active states
- Follow the 8px spacing rhythm

### ❌ DON'T
- Use emoji in any UI element
- Use purple, lavender, or blue-violet tones
- Bias content/copy toward any specific social context (dating etc.)
- Use more than 3 font weights in a single component
- Exceed 3 columns in the place card grid

---

## 11. Stitch MCP Reference

**Project ID:** `4251015049018127885`

| Screen | Stitch ID | Theme | Notes |
|---|---|---|---|
| Explore — Light v1 | `5feeec05b2da4b3ab376aef317fefea4` | Light | Deprecated — too plain |
| Explore — Dark v1 | `cfc5bb443b4a4bc1a186d101e7786567` | Dark | Deprecated |
| Landing Page — Light v2 | `a8349ee1dadc489c862f03b7c981d0f1` | Light | **Current — Dramatic Urbanism** |

| Design System | Asset ID | Status |
|---|---|---|
| Urban Discovery Editorial (v1) | `assets/64a410e545c34a6f97386b90f8dc73d7` | Deprecated |
| Walk-Way Dark (v1) | `assets/03ba36513a6a437bb532a8b7e417aa3f` | Deprecated |
| Dramatic Urbanism (v2) | `assets/e5e99b6700f54c0d830b73a6fa1c5785` | **Active** |

---

## 12. Global Themes & Map Styles

### 12.1 Theme Switcher
- Configured site-wide dark/light mode toggle in Navigation Bar using `next-themes`.
- Transition states: Instant styling adjustment via CSS variables, standardizing dark/light aesthetics.

### 12.2 Theme-Aware MapLibre Styles
- **Light Theme Map:** Powered by `positron-gl-style` (Carto Positron clone). Clean, elegant, light grey background with minimal distraction.
- **Dark Theme Map:** Powered by `dark-matter-gl-style` (Carto Dark Matter clone). Dramatic, high-contrast dark aesthetic aligning with "Dramatic Urbanism".
- **Dynamic Transition:** Automatic detection of `resolvedTheme` with dynamic map stylesheet swap upon change.

### 12.3 Route Markers & Visualizations
- Custom styled circular index markers for route stops (`useRouteStore`).
- Active color scheme: `--accent` (`#E86A3A`) for marker body, high contrast text inside indicating sequence index.
- Interactive tooltip overlay on hover showing place name and core information.
- Preloader styling: High contrast animated pulse overlay matching brand identity to hide MapLibre setup jitter.

---

## 13. Change Log

| Date | Change | Author |
|---|---|---|
| 2026-04-29 | Initial design system v1 created. Explore page (light + dark). | agent |
| 2026-04-29 | **v2 Dramatic Urbanism upgrade.** 80-120px display type, 40px card radius, floating Hero cards, editorial asymmetric grid, CTA banner. Landing page added. | agent |
| 2026-05-18 | **Theme Integration & Interactive Map.** Added `next-themes` support, custom dynamic map styling (light/dark Matter), premium markers, and pulse preloader. | agent |
| 2026-05-18 | **Map Bottom Sheet & Interactive UX.** Added `vaul` responsive bottom sheet with custom metrics, quick-add recommendations, and map-marker centering/highlighting. | agent |
| 2026-05-18 | **Smart POIs & Route Path Rendering.** Added interactive map polyline paths with glowing effects, along-route "Smart POIs" dots, and interactive "Add to route" click popups. | agent |
| 2026-05-19 | **Personal Folders & Place Collections.** Integrated `SaveToCollectionButton` on cards, built `/profile` folders tab dashboard with folder CRUD and item removal. | agent |
| 2026-05-21 | **UX/UI Improvements & Bug Fixes.** Added confirm on clear route, auto-dismissible Toasts, active chip accent design, and horizontal tags scroll. | agent |


---

## 14. Responsive Floating Sidebar Layout

### 14.1 Responsive Positioning
- **Unified Sidebar Panel:** Completely removed the mobile bottom drawer (`vaul` drawer) to eliminate screen clutter and satisfy user preferences.
- **Mobile View:** Floats beautifully at `left-4 right-4 top-[88px] bottom-4` directly overlaying the map with a high-fidelity translucent blurred container.
- **Desktop View:** Positioned on the left at `left-6 top-[96px] bottom-6 w-96` leaving breathing room at all edges.
- **Header Navbar Integration:** Positioned perfectly below the standard website `Navbar` (`h-[72px]`) to ensure seamless navigation, theme toggling, and auth access.

### 14.2 Content & Interactions
- Unifies real-time route metrics (Distance, Estimated walking duration, Steps), a sortable interactive list of points (`@dnd-kit/sortable`), and a quick-add search/category recommended grid into a single, clean vertical scroll area.
- **Marker Alignment:** Clicking a location flies the camera to the marker and expands a custom tooltip.
- **Desktop Shifting:** Utilizes left padding inside map `fitBounds` bounds-fitting to center markers in the right visible area of the viewport.

