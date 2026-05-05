export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/explore", label: "Места" },
  { href: "/map",     label: "Карта" },
  { href: "/saved",   label: "Сохранённые" },
];

export const FOOTER_LINKS = {
  service: {
    title: "СЕРВИС",
    links: [
      { href: "/explore",           label: "Места" },
      { href: "/map",               label: "Карта" },
      { href: "/explore?tab=vibes", label: "Вайбы" },
      { href: "/search",            label: "Поиск" },
    ],
  },
  company: {
    title: "КОМПАНИЯ",
    links: [
      { href: "/about",    label: "О проекте" },
      { href: "/blog",     label: "Блог" },
      { href: "/partners", label: "Партнёрам" },
      { href: "/feedback", label: "Обратная связь" },
    ],
  },
  social: {
    title: "СОЦСЕТИ",
    links: [
      { href: "https://vk.com",        label: "VK" },
      { href: "https://t.me/walkway",  label: "Telegram" },
      { href: "https://instagram.com", label: "Instagram" },
    ],
  },
} as const;
