"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CardPreview from "@/components/CardPreview";
import CardTemplateSelector from "@/components/CardTemplateSelector";
import { OCCASIONS, GiftFormData, validateGiftForm } from "@/lib/validation";

export default function CreateGiftPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<GiftFormData>({
    senderName: "",
    senderEmail: "",
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    amountType: "FIXED",
    amountFixed: 50,
    amountMin: 30,
    amountMax: 75,
    occasion: "",
    message: "",
    cardTemplateId: "classic",
    notifyRecipient: true,
    expirationDays: 30,
  });

  function updateField<K extends keyof GiftFormData>(key: K, value: GiftFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateGiftForm(form);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach((err) => (errorMap[err.field] = err.message));
      setErrors(errorMap);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const errorMap: Record<string, string> = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            errorMap[err.field] = err.message;
          });
          setErrors(errorMap);
        } else {
          setErrors({ _form: data.error || "Something went wrong" });
        }
        return;
      }

      // Mock mode: got claim link directly (no Stripe)
      if (data.claimUrl) {
        const params = new URLSearchParams({
          order_id: data.orderId,
          claim_url: data.claimUrl,
          recipient: data.recipientName,
          amount: String(data.chargeCents),
        });
        router.push(`/success?${params.toString()}`);
        return;
      }

      // Stripe mode: redirect to checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create a Gift Link 🎁</h1>
          <p className="text-gray-600 mt-2">Fill in the details and send a personalized gift</p>
        </div>

        {canceled && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-center">
            Payment was canceled. You can try again below.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
            {errors._form && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                {errors._form}
              </div>
            )}

            {/* Sender Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-semibold text-gray-900">Your Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={form.senderName}
                    onChange={(e) => updateField("senderName", e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.senderName ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                    placeholder="Jane Smith"
                  />
                  {errors.senderName && <p className="text-red-500 text-xs mt-1">{errors.senderName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    value={form.senderEmail}
                    onChange={(e) => updateField("senderEmail", e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.senderEmail ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                    placeholder="jane@example.com"
                  />
                  {errors.senderEmail && <p className="text-red-500 text-xs mt-1">{errors.senderEmail}</p>}
                </div>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-semibold text-gray-900">Recipient Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={form.recipientName}
                    onChange={(e) => updateField("recipientName", e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.recipientName ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                    placeholder="John Doe"
                  />
                  {errors.recipientName && <p className="text-red-500 text-xs mt-1">{errors.recipientName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={form.recipientEmail}
                    onChange={(e) => updateField("recipientEmail", e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.recipientEmail ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                    placeholder="john@example.com"
                  />
                  {errors.recipientEmail && <p className="text-red-500 text-xs mt-1">{errors.recipientEmail}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.recipientPhone}
                  onChange={(e) => updateField("recipientPhone", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.notifyRecipient}
                  onChange={(e) => updateField("notifyRecipient", e.target.checked)}
                  className="rounded border-gray-300"
                />
                Email the recipient now
                <span className="text-gray-400 text-xs">(turn off to share the link yourself)</span>
              </label>
            </div>

            {/* Budget */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-semibold text-gray-900">Gift Budget</h2>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => updateField("amountType", "FIXED")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border-2 transition ${
                    form.amountType === "FIXED"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Fixed Amount
                </button>
                <button
                  type="button"
                  onClick={() => updateField("amountType", "RANGE")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border-2 transition ${
                    form.amountType === "RANGE"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Price Range
                </button>
              </div>

              {form.amountType === "FIXED" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={form.amountFixed}
                      onChange={(e) => updateField("amountFixed", Number(e.target.value))}
                      className={`w-full rounded-lg border pl-7 pr-3 py-2 text-sm ${errors.amountFixed ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                    />
                  </div>
                  {errors.amountFixed && <p className="text-red-500 text-xs mt-1">{errors.amountFixed}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-400">$</span>
                      <input
                        type="number"
                        min={10}
                        max={500}
                        value={form.amountMin}
                        onChange={(e) => updateField("amountMin", Number(e.target.value))}
                        className={`w-full rounded-lg border pl-7 pr-3 py-2 text-sm ${errors.amountMin ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                      />
                    </div>
                    {errors.amountMin && <p className="text-red-500 text-xs mt-1">{errors.amountMin}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-400">$</span>
                      <input
                        type="number"
                        min={10}
                        max={500}
                        value={form.amountMax}
                        onChange={(e) => updateField("amountMax", Number(e.target.value))}
                        className={`w-full rounded-lg border pl-7 pr-3 py-2 text-sm ${errors.amountMax ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                      />
                    </div>
                    {errors.amountMax && <p className="text-red-500 text-xs mt-1">{errors.amountMax}</p>}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400">Min $10 – Max $500.</p>
            </div>

            {/* Message & Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-semibold text-gray-900">Card & Message</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
                <select
                  value={form.occasion}
                  onChange={(e) => updateField("occasion", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {OCCASIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-gray-400">({form.message.length}/500)</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  maxLength={500}
                  rows={3}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.message ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                  placeholder="Write a personal message..."
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Style</label>
                <CardTemplateSelector
                  selected={form.cardTemplateId}
                  onSelect={(id) => updateField("cardTemplateId", id)}
                />
              </div>
            </div>

            {/* Expiration */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Expiry</label>
              <select
                value={form.expirationDays}
                onChange={(e) => updateField("expirationDays", Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-blue-200"
            >
              {loading ? "Creating..." : "Create Gift Link 🎁"}
            </button>
          </form>

          {/* Card Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Card Preview</h3>
              <CardPreview
                templateId={form.cardTemplateId}
                senderName={form.senderName}
                recipientName={form.recipientName}
                occasion={form.occasion}
                message={form.message}
              />
              <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">
                  <strong>Budget:</strong>{" "}
                  {form.amountType === "FIXED"
                    ? `$${form.amountFixed || 0}`
                    : `$${form.amountMin || 0} – $${form.amountMax || 0}`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>Charge:</strong> ${form.amountType === "FIXED" ? form.amountFixed || 0 : form.amountMax || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
