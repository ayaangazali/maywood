"use client";

import { getTemplate } from "@/lib/card-templates";

interface CardPreviewProps {
  templateId: string;
  senderName: string;
  recipientName: string;
  occasion?: string;
  message: string;
}

export default function CardPreview({
  templateId,
  senderName,
  recipientName,
  occasion,
  message,
}: CardPreviewProps) {
  const t = getTemplate(templateId);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 ${t.borderClass} ${t.bgClass} p-6 shadow-lg max-w-md w-full`}
    >
      <div className="absolute top-4 right-4 text-4xl opacity-30">{t.emoji}</div>
      <div className="absolute bottom-4 left-4 text-6xl opacity-10">{t.emoji}</div>

      <div className="relative z-10 space-y-4">
        {occasion && (
          <p className={`text-sm font-medium uppercase tracking-wide ${t.accentClass}`}>
            {occasion}
          </p>
        )}
        <h3 className={`text-2xl font-bold ${t.textClass}`}>
          For {recipientName || "..."}
        </h3>
        <div className={`min-h-[60px] text-base ${t.textClass} opacity-80 whitespace-pre-wrap`}>
          {message || "Your message will appear here..."}
        </div>
        <div className={`pt-4 text-sm font-medium ${t.accentClass}`}>
          — {senderName || "..."}
        </div>
      </div>
    </div>
  );
}
