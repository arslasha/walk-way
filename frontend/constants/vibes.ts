export interface VibeOption {
  value: string;
  label: string;
}

export const VIBES: VibeOption[] = [
  { value: "all",          label: "Всё сразу" },
  { value: "breeze",       label: "С ветерком" },
  { value: "street-art",   label: "Уличное искусство" },
  { value: "coffee",       label: "Кофе и архитектура" },
  { value: "nature",       label: "Парки и природа" },
  { value: "museums",      label: "Музеи" },
  { value: "food",         label: "Еда и рынки" },
];

export const DEFAULT_VIBE = VIBES[0];
