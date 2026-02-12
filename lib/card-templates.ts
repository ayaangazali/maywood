export interface CardTemplate {
  id: string;
  name: string;
  emoji: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  accentClass: string;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    emoji: "🎁",
    bgClass: "bg-gradient-to-br from-blue-50 to-indigo-100",
    borderClass: "border-blue-200",
    textClass: "text-blue-900",
    accentClass: "text-blue-600",
  },
  {
    id: "celebration",
    name: "Celebration",
    emoji: "🎉",
    bgClass: "bg-gradient-to-br from-amber-50 to-orange-100",
    borderClass: "border-amber-200",
    textClass: "text-amber-900",
    accentClass: "text-amber-600",
  },
  {
    id: "heart",
    name: "With Love",
    emoji: "❤️",
    bgClass: "bg-gradient-to-br from-pink-50 to-rose-100",
    borderClass: "border-pink-200",
    textClass: "text-pink-900",
    accentClass: "text-pink-600",
  },
  {
    id: "nature",
    name: "Nature",
    emoji: "🌿",
    bgClass: "bg-gradient-to-br from-green-50 to-emerald-100",
    borderClass: "border-green-200",
    textClass: "text-green-900",
    accentClass: "text-green-600",
  },
  {
    id: "cosmic",
    name: "Cosmic",
    emoji: "✨",
    bgClass: "bg-gradient-to-br from-violet-50 to-purple-100",
    borderClass: "border-violet-200",
    textClass: "text-violet-900",
    accentClass: "text-violet-600",
  },
];

export function getTemplate(id: string): CardTemplate {
  return CARD_TEMPLATES.find((t) => t.id === id) ?? CARD_TEMPLATES[0];
}
