"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();

  // Mock mode: claim URL passed directly
  const claimUrl = searchParams.get("claim_url");
  const recipient = searchParams.get("recipient");
  const amountCents = parseInt(searchParams.get("amount") ?? "0");
  const orderId = searchParams.get("order_id");

  // Stripe mode: poll by session_id
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "active" | "pending" | "error">(
    claimUrl ? "active" : "loading"
  );
  const [order, setOrder] = useState<{
    id: string;
    recipientName: string;
    amountType: string;
    amountFixed: number | null;
    amountMax: number | null;
  } | null>(
    claimUrl
      ? { id: orderId ?? "", recipientName: recipient ?? "", amountType: "FIXED", amountFixed: amountCents, amountMax: amountCents }
      : null
  );
  const [resolvedClaimUrl, setResolvedClaimUrl] = useState<string | null>(claimUrl);
  const [copied, setCopied] = useState(false);

  // Stripe mode polling
  useEffect(() => {
    if (claimUrl || !sessionId) return;

    let attempts = 0;
    const maxAttempts = 20;

    const poll = async () => {
      try {
        const res = await fetch(`/api/order-status?session_id=${sessionId}`);
        const data = await res.json();

        if (data.order) {
          setOrder(data.order);
          if (data.order.status === "ACTIVE") {
            setStatus("active");
            setResolvedClaimUrl("Check your email for the claim link");
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("error");
      }
    };

    poll();
  }, [sessionId, claimUrl]);

  if (!sessionId && !claimUrl) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Missing session information.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-16 px-4">
      <div className="max-w-lg mx-auto text-center space-y-6">
        {status === "loading" && (
          <>
            <div className="text-6xl animate-bounce">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900">Processing your payment...</h1>
            <p className="text-gray-600">
              Confirming with Stripe and generating your gift link. This usually takes a few seconds.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          </>
        )}

        {status === "active" && order && (
          <>
            <div className="text-6xl">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900">Gift Link Created!</h1>
            <p className="text-gray-600">
              Your gift for <strong>{order.recipientName}</strong> is ready to share.
            </p>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-left space-y-3">
              <div className="text-sm text-gray-500">Budget</div>
              <div className="text-2xl font-bold text-gray-900">
                ${((order.amountType === "FIXED" ? order.amountFixed : order.amountMax) ?? 0) / 100}
              </div>
              <div className="text-sm text-gray-500 mt-4">Status</div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-green-700 font-medium">Active — ready to share</span>
              </div>
            </div>

            {resolvedClaimUrl && (
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 space-y-3">
                <p className="text-sm font-semibold text-blue-900">
                  🔗 Share this link with {order.recipientName}:
                </p>
                <div className="bg-white rounded-lg p-3 border border-blue-200 break-all text-sm text-gray-700 font-mono text-left">
                  {resolvedClaimUrl}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resolvedClaimUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  {copied ? "✓ Copied!" : "📋 Copy Link"}
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400">
              Order ID: {order.id}
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="text-6xl">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900">Still Processing</h1>
            <p className="text-gray-600">
              Payment received but the gift link is still being generated. You&apos;ll receive an email when it&apos;s ready.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl">😕</div>
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-gray-600">
              We couldn&apos;t verify your payment status. Please check your email or contact support.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
