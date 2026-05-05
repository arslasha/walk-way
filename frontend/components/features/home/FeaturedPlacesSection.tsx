import { PlaceCard } from "@/components/features/places/PlaceCard";
import { PlaceCardSmall } from "@/components/features/places/PlaceCardSmall";
import type { Place } from "@/types/place";

const FEATURED_PLACE: Place = {
  slug: "sad-ermitazh",
  name: "Сад Эрмитаж",
  category: "Парк",
  address: "ул. Каретный ряд, 3",
  duration: "~30 мин",
  vibes: ["тихое", "природа"],
};

const SIDE_PLACES: Place[] = [
  {
    slug: "artplay",
    name: "Artplay Центр",
    category: "Арт-пространство",
    address: "Нижняя Сыромятническая, 10",
    duration: "~45 мин",
    vibes: ["уличное-искусство", "архитектура"],
  },
  {
    slug: "morozeika",
    name: "Скрытая Морозейка",
    category: "Кофейня",
    address: "ул. Моросейка, 10",
    duration: "~20 мин",
    vibes: ["кофе"],
  },
];

export function FeaturedPlacesSection() {
  return (
    <section className="ww-container pb-20">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-headline">сейчас в топе</h2>
        <a
          href="/explore"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          все места →
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
        <PlaceCard place={FEATURED_PLACE} />
        <div className="flex flex-col gap-4">
          {SIDE_PLACES.map((place) => (
            <PlaceCardSmall key={place.slug} place={place} />
          ))}
        </div>
      </div>
    </section>
  );
}
