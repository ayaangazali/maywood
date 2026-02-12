"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface AuditEvent {
  id: string;
  type: string;
  message: string;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

interface Email {
  id: string;
  to: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string | null;
  amountType: string;
  amountFixed: number | null;
  amountMin: number | null;
  amountMax: number | null;
  currency: string;
  occasion: string | null;
  message: string;
  cardTemplateId: string;
  notifyRecipient: boolean;
  status: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  claimTokenLast4: string | null;
  claimExpiresAt: string | null;
  claimedAt: string | null;
  selectedItem: { id: string; title: string; priceCents: number } | null;
  fulfillmentProvider: string;
  fulfillmentExternalId: string | null;
  remainderCents: number | null;
  remainderAction: string | null;
  remainderFulfilled: boolean;
  createdAt: string;
  updatedAt: string;
  auditEvents: AuditEvent[];
  emails: Email[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  LOCKED: "bg-purple-100 text-purple-700",
  REDEEMED: "bg-indigo-100 text-indigo-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  FULFILLING: "bg-cyan-100 text-cyan-700",
  FULFILLED: "bg-emerald-100 text-emerald-800",
  FULFILLMENT_FAILED: "bg-red-100 text-red-700",
  CANCELED: "bg-gray-100 text-gray-400",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      setOrder(data.order);
    } catch {
      console.error("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleAction(action: string) {
    setActionLoading(action);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      setActionMessage(data.message || data.error || "Action completed");
      fetchOrder();
    } catch {
      setActionMessage("Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Order not found.</p>
      </div>
    );
  }

  function formatAmount(): string {
    if (!order) return "";
    if (order.amountType === "FIXED") return `$${((order.amountFixed ?? 0) / 100).toFixed(2)}`;
    return `$${((order.amountMin ?? 0) / 100).toFixed(0)} – $${((order.amountMax ?? 0) / 100).toFixed(0)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/orders" className="text-gray-500 hover:text-gray-700">
            ← Orders
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Order Detail</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {actionMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
            {actionMessage}
          </div>
        )}

        {/* Status + Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100"}`}>
                {order.status}
              </span>
              <span className="text-sm text-gray-400">ID: {order.id}</span>
            </div>
            <div className="flex gap-2">
              {(order.status === "FULFILLMENT_FAILED" || order.status === "LOCKED") && (
                <button
                  onClick={() => handleAction("retry-fulfillment")}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {actionLoading === "retry-fulfillment" ? "Retrying..." : "Retry Fulfillment"}
                </button>
              )}
              {order.status === "ACTIVE" && (
                <button
                  onClick={() => handleAction("resend-email")}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading === "resend-email" ? "Sending..." : "Resend Email"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-3">
            <h3 className="font-semibold text-gray-900">Sender</h3>
            <Info label="Name" value={order.senderName} />
            <Info label="Email" value={order.senderEmail} />
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-3">
            <h3 className="font-semibold text-gray-900">Recipient</h3>
            <Info label="Name" value={order.recipientName} />
            <Info label="Email" value={order.recipientEmail} />
            {order.recipientPhone && <Info label="Phone" value={order.recipientPhone} />}
            <Info label="Auto-notify" value={order.notifyRecipient ? "Yes" : "No"} />
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-3">
            <h3 className="font-semibold text-gray-900">Payment</h3>
            <Info label="Amount" value={formatAmount()} />
            <Info label="Type" value={order.amountType} />
            {order.stripeCheckoutSessionId && (
              <Info label="Stripe Session" value={order.stripeCheckoutSessionId} truncate />
            )}
            {order.stripePaymentIntentId && (
              <Info label="Payment Intent" value={order.stripePaymentIntentId} truncate />
            )}
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-3">
            <h3 className="font-semibold text-gray-900">Claim</h3>
            <Info label="Token (last 4)" value={order.claimTokenLast4 ?? "—"} />
            <Info label="Expires" value={order.claimExpiresAt ? new Date(order.claimExpiresAt).toLocaleString() : "—"} />
            <Info label="Claimed at" value={order.claimedAt ? new Date(order.claimedAt).toLocaleString() : "—"} />
            {order.selectedItem && (
              <Info label="Selected" value={`${order.selectedItem.title} ($${(order.selectedItem.priceCents / 100).toFixed(2)})`} />
            )}
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-3">
            <h3 className="font-semibold text-gray-900">Fulfillment</h3>
            <Info label="Provider" value={order.fulfillmentProvider} />
            <Info label="External ID" value={order.fulfillmentExternalId ?? "—"} />
            {order.remainderCents != null && order.remainderCents > 0 && (
              <>
                <Info label="Remainder" value={`$${(order.remainderCents / 100).toFixed(2)}`} />
                <Info label="Remainder Action" value={order.remainderAction ?? "Pending"} />
                <Info label="Remainder Fulfilled" value={order.remainderFulfilled ? "Yes" : "No"} />
              </>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-3">
            <h3 className="font-semibold text-gray-900">Details</h3>
            <Info label="Occasion" value={order.occasion ?? "—"} />
            <Info label="Card Template" value={order.cardTemplateId} />
            <Info label="Created" value={new Date(order.createdAt).toLocaleString()} />
            <Info label="Updated" value={new Date(order.updatedAt).toLocaleString()} />
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
          <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">{order.message}</p>
        </div>

        {/* Audit Events */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Audit Trail</h3>
          {order.auditEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No events recorded.</p>
          ) : (
            <div className="space-y-3">
              {order.auditEvents.map((event) => (
                <div key={event.id} className="flex gap-3 text-sm">
                  <div className="text-gray-400 whitespace-nowrap w-40 flex-shrink-0">
                    {new Date(event.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 mr-2">
                      {event.type}
                    </span>
                    <span className="text-gray-700">{event.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emails */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Emails</h3>
          {order.emails.length === 0 ? (
            <p className="text-gray-500 text-sm">No emails sent.</p>
          ) : (
            <div className="space-y-2">
              {order.emails.map((email) => (
                <div key={email.id} className="flex items-center gap-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    email.status === "SENT" ? "bg-green-100 text-green-700" :
                    email.status === "FAILED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{email.status}</span>
                  <span className="text-gray-700">{email.to}</span>
                  <span className="text-gray-400">—</span>
                  <span className="text-gray-600 truncate">{email.subject}</span>
                  <span className="text-gray-400 ml-auto whitespace-nowrap">{new Date(email.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-900 font-medium ${truncate ? "max-w-[200px] truncate" : ""}`}>
        {value}
      </span>
    </div>
  );
}
