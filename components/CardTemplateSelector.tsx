"use client";

import { CARD_TEMPLATES, CardTemplate } from "@/lib/card-templates";

interface CardTemplateSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function CardTemplateSelector({
  selected,
  onSelect,
}: CardTemplateSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {CARD_TEMPLATES.map((t: CardTemplate) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
            selected === t.id
              ? `${t.borderClass} ring-2 ring-offset-2 ring-blue-500 shadow-md`
              : "border-gray-200 hover:border-gray-300"
          } ${t.bgClass}`}
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className="text-xs font-medium text-gray-700">{t.name}</span>
        </button>
      ))}
    </div>
  );
}
