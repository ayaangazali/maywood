"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function ClaimedContent() {
  const searchParams = useSearchParams();
  const item = searchParams.get("item") ?? "Gift";
  const priceCents = parseInt(searchParams.get("price") ?? "0");
  const remainderCents = parseInt(searchParams.get("remainder") ?? "0");
  const orderId = searchParams.get("orderId") ?? "";
  const sender = searchParams.get("sender") ?? "Someone";

  const [remainderChoice, setRemainderChoice] = useState<string | null>(null);
  const [remainderProcessing, setRemainderProcessing] = useState(false);
  const [remainderMessage, setRemainderMessage] = useState<string | null>(null);

  async function handleRemainder(action: "gift_card" | "donate") {
    setRemainderProcessing(true);
    try {
      const res = await fetch("/api/claim/remainder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setRemainderChoice(action);
        setRemainderMessage(data.message);
      } else {
        setRemainderMessage(data.error || "Failed to process remainder");
      }
    } catch {
      setRemainderMessage("Network error. Please try again.");
    } finally {
      setRemainderProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-16 px-4">
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="text-7xl">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900">Gift Claimed!</h1>
        <p className="text-lg text-gray-600">
          Your gift from <strong>{sender}</strong> is on its way.
        </p>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Item</span>
            <span className="font-semibold text-gray-900">{item}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Amount</span>
            <span className="font-semibold text-gray-900">
              ${(priceCents / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Delivery</span>
            <span className="text-green-600 font-medium">📧 Sent to your email</span>
          </div>
        </div>

        {remainderCents > 0 && !remainderChoice && (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 space-y-4">
            <p className="text-amber-800 font-medium">
              You have <strong>${(remainderCents / 100).toFixed(2)}</strong> remaining!
            </p>
            <p className="text-sm text-amber-700">
              What would you like to do with the rest?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRemainder("gift_card")}
                disabled={remainderProcessing}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                💳 Convert to Gift Card
              </button>
              <button
                onClick={() => handleRemainder("donate")}
                disabled={remainderProcessing}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                ❤️ Donate to Charity
              </button>
            </div>
          </div>
        )}

        {remainderMessage && (
          <div className={`rounded-xl p-4 border ${remainderChoice ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {remainderMessage}
          </div>
        )}

        <p className="text-xs text-gray-400 pt-4">
          If you don&apos;t receive your gift within a few minutes, check your spam folder.
        </p>
      </div>
    </div>
  );
}

export default function ClaimedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <ClaimedContent />
    </Suspense>
  );
}
