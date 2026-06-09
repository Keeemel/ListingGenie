import Stripe from "stripe";

// ── Pricing configuration — change Price IDs here ─────────────────────────────
// Create two one-time products in your Stripe Dashboard, copy their Price IDs
// into STRIPE_PRICE_STARTER and STRIPE_PRICE_VALUE in .env.local.
export const PLANS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER!,
    credits: 15,
    price: "€4.99",
    label: "Starter",
    description: "15 optimizations",
  },
  value: {
    priceId: process.env.STRIPE_PRICE_VALUE!,
    credits: 40,
    price: "€9.99",
    label: "Value",
    description: "40 optimizations — best value",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// Lazily-initialized Stripe client.
// Created on first call so `STRIPE_SECRET_KEY` is only required at runtime,
// not during the Next.js static build page-data collection phase.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return _stripe;
}
