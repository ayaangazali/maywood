"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CardPreview from "@/components/CardPreview";
import type { CardTemplate } from "@/lib/card-templates";

interface CatalogItemData {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
  imageUrl: string;
  isBestMatch: boolean;
}

interface OrderData {
  senderName: string;
  recipientName: string;
  message: string;
  occasion: string | null;
  cardTemplateId: string;
  amountType: string;
  maxCents: number;
  minCents: number | null;
}

interface Props {
  token: string;
  order: OrderData;
  template: CardTemplate;
  catalog: CatalogItemData[];
  recommended: CatalogItemData[];
}

export default function ClaimClient({ token, order, catalog, recommended }: Props) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<CatalogItemData | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(catalog.map((item) => item.category)))];

  const filteredCatalog = filterCategory === "all"
    ? catalog
    : catalog.filter((item) => item.category === filterCategory);

  const budgetDisplay = order.amountType === "FIXED"
    ? `$${(order.maxCents / 100).toFixed(0)}`
    : `up to $${(order.maxCents / 100).toFixed(0)}`;

  async function handleClaim() {
    if (!selectedItem) return;
    setClaiming(true);
    setError(null);

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, itemId: selectedItem.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to claim gift");
        setShowConfirm(false);
        return;
      }

      // Redirect to claimed page with info
      const params = new URLSearchParams({
        item: selectedItem.title,
        price: String(selectedItem.priceCents),
        remainder: String(data.remainderCents || 0),
        orderId: data.orderId,
        sender: order.senderName,
      });
      router.push(`/claimed?${params.toString()}`);
    } catch {
      setError("Network error. Please try again.");
      setShowConfirm(false);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <CardPreview
              templateId={order.cardTemplateId}
              senderName={order.senderName}
              recipientName={order.recipientName}
              occasion={order.occasion ?? undefined}
              message={order.message}
            />
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">
                You have a gift! 🎁
              </h1>
              <p className="text-lg text-gray-600">
                <strong>{order.senderName}</strong> sent you a gift. Pick any gift{" "}
                {budgetDisplay}.
              </p>
              {order.amountType === "RANGE" && order.minCents && (
                <p className="text-sm text-gray-400">
                  Suggested range: ${(order.minCents / 100).toFixed(0)}–${(order.maxCents / 100).toFixed(0)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ✨ Recommended for You
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recommended.map((item) => (
                <CatalogCard
                  key={`rec-${item.id}`}
                  item={item}
                  maxCents={order.maxCents}
                  minCents={order.minCents}
                  selected={selectedItem?.id === item.id}
                  onSelect={() => {
                    setSelectedItem(item);
                    setShowConfirm(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm font-medium text-gray-500">Filter:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  filterCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((item) => (
              <CatalogCard
                key={item.id}
                item={item}
                maxCents={order.maxCents}
                minCents={order.minCents}
                selected={selectedItem?.id === item.id}
                onSelect={() => {
                  setSelectedItem(item);
                  setShowConfirm(true);
                }}
              />
            ))}
          </div>

          {filteredCatalog.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No items in this category within your budget.
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900">Confirm Your Choice</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900">{selectedItem.title}</p>
              <p className="text-sm text-gray-600">{selectedItem.description}</p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                ${(selectedItem.priceCents / 100).toFixed(2)}
              </p>
            </div>

            {selectedItem.priceCents < order.maxCents && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  💡 You&apos;ll have <strong>${((order.maxCents - selectedItem.priceCents) / 100).toFixed(2)}</strong> remaining.
                  You&apos;ll be able to convert it to a gift card or donate it.
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500">
              This action cannot be undone. The gift link will be used.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={claiming}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {claiming ? "Claiming..." : "Claim Gift"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogCard({
  item,
  maxCents,
  minCents,
  selected,
  onSelect,
}: {
  item: CatalogItemData;
  maxCents: number;
  minCents: number | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const isBelowSuggested = minCents != null && item.priceCents < minCents;

  return (
    <button
      onClick={onSelect}
      className={`relative text-left bg-white rounded-xl p-4 border-2 transition-all hover:shadow-md ${
        selected
          ? "border-blue-500 ring-2 ring-blue-200"
          : "border-gray-100 hover:border-blue-200"
      }`}
    >
      {item.isBestMatch && minCents != null && (
        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
          Best match
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
          {item.category === "Coffee & Tea" && "☕"}
          {item.category === "Food Delivery" && "🍕"}
          {item.category === "Books & Media" && "📚"}
          {item.category === "Gaming" && "🎮"}
          {item.category === "Streaming" && "📺"}
          {item.category === "Generic Gift Cards" && "💳"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
          <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-blue-600 font-bold">${(item.priceCents / 100).toFixed(0)}</span>
            {isBelowSuggested && (
              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Below suggested
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{item.category}</span>
        </div>
      </div>
    </button>
  );
}
