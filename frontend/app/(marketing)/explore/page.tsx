import { PlaceCard } from "@/components/features/places/PlaceCard";
import type { Place } from "@/types/place";

const MOCK_PLACES: Place[] = [
  {
    slug: "gorky-park-art",
    name: "Гараж и окрестности",
    category: "Арт-пространство",
    address: "Парк Горького",
    duration: "2-3 ч",
    vibes: ["уличное-искусство", "природа"],
  },
  {
    slug: "chistye-prudy-coffee",
    name: "Скрытая кофейня на Чистых",
    category: "Кофейня",
    address: "Чистопрудный бульвар, 14",
    duration: "1 ч",
    vibes: ["кофе", "тихое"],
  },
  {
    slug: "winzavod-gallery",
    name: "ЦСИ Винзавод",
    category: "Галерея",
    address: "4-й Сыромятнический пер., 1/8",
    duration: "2 ч",
    vibes: ["уличное-искусство", "архитектура"],
  },
  {
    slug: "danilovsky-market",
    name: "Даниловский рынок",
    category: "Рынок",
    address: "Мытная ул., 74",
    duration: "1.5 ч",
    vibes: ["еда", "ветерок"],
  },
  {
    slug: "ges-2",
    name: "ГЭС-2",
    category: "Культура",
    address: "Болотная набережная, 15",
    duration: "3 ч",
    vibes: ["музеи", "архитектура"],
  },
  {
    slug: "aptekarsky-ogorod",
    name: "Аптекарский огород",
    category: "Парк",
    address: "Проспект Мира, 26с1",
    duration: "1-2 ч",
    vibes: ["природа", "тихое"],
  },
];

export default function ExplorePage() {
  return (
    <div className="pt-24 pb-32">
      <div className="ww-container">
        {/* Header / Title */}
        <div className="mb-8">
          <h1 className="text-headline-xl font-bold text-foreground mb-4">
            исследуй
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl">
            Листайте подборку и находите новые места. Свайпайте теги, чтобы изменить настроение.
          </p>
        </div>

        {/* Filter Row */}
        <div className="mb-12 overflow-x-auto pb-4 no-scrollbar">
          <div className="flex flex-nowrap items-center gap-2">
            <button className="chip chip-active">все вайбы</button>
            <button className="chip whitespace-nowrap">кофе</button>
            <button className="chip whitespace-nowrap">природа</button>
            <button className="chip whitespace-nowrap">уличное-искусство</button>
            <button className="chip whitespace-nowrap">музеи</button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <button className="chip whitespace-nowrap">1 ч</button>
            <button className="chip whitespace-nowrap">2-3 ч</button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <button className="chip whitespace-nowrap">один</button>
            <button className="chip whitespace-nowrap">вдвоем</button>
            <button className="chip whitespace-nowrap">компания</button>
          </div>
        </div>

        {/* Explore Feed: 2-col editorial grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_PLACES.map((place) => (
            <PlaceCard key={place.slug} place={place} />
          ))}
        </div>
      </div>
    </div>
  );
}
