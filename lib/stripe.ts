import Stripe from "stripe";

// Stripe is optional — if no valid key, we run in "mock" mode (no payment required)
const key = process.env.STRIPE_SECRET_KEY;
const isRealKey = key && !key.includes("placeholder") && key.startsWith("sk_");

export const stripe: Stripe | null = isRealKey ? new Stripe(key) : null;
