"use client";

import { useState } from "react";
import { X, Loader2, Zap, CheckCircle2, Crown } from "lucide-react";

interface UpgradeModalProps {
  onClose: () => void;
}

const PLANS = [
  {
    key: "starter",
    label: "Starter",
    price: "€4.99",
    priceNum: 4.99,
    credits: 15,
    perCredit: "€0.33",
    highlight: false,
    badge: null,
  },
  {
    key: "value",
    label: "Value",
    price: "€9.99",
    priceNum: 9.99,
    credits: 40,
    perCredit: "€0.25",
    highlight: true,
    badge: "Best value",
  },
];

const FEATURES = [
  "AI rewrite tailored to your marketplace",
  "Optimized title + full description",
  "Credits never expire",
  "Instant delivery",
];

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(planKey: string) {
    setLoadingPlan(planKey);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not create checkout session.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Gradient top bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)" }} />

        <button type="button" onClick={onClose}
          className="absolute right-4 top-5 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Close">
          <X size={15} />
        </button>

        <div className="p-7">
          {/* Header */}
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg,#7c3aed20,#a855f720)", border: "1px solid #7c3aed30" }}>
            <Crown size={18} className="text-violet-400" />
          </div>
          <h2 className="text-lg font-black text-zinc-100">Get more optimizations</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
            You&apos;ve used all your credits. Pick a pack — one-time payment, no subscription.
          </p>

          {/* What 1 credit does */}
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">1 credit =</p>
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-500" />
                  <p className="text-xs leading-relaxed text-zinc-400">{f}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div className="mt-5 space-y-3">
            {PLANS.map((plan) => (
              <div key={plan.key} className="relative overflow-hidden rounded-xl"
                style={plan.highlight
                  ? { background: "linear-gradient(135deg,#1e1b4b,#2e1065)", border: "1px solid #4338ca40" }
                  : { background: "#18181b", border: "1px solid #27272a" }}>

                {plan.badge && (
                  <div className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff" }}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{plan.label}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {plan.credits} optimizations &middot;{" "}
                        <span className="text-zinc-400">{plan.perCredit}/credit</span>
                      </p>
                    </div>
                    <p className="text-2xl font-black text-white">{plan.price}</p>
                  </div>

                  <button type="button" onClick={() => handleBuy(plan.key)} disabled={!!loadingPlan}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    style={plan.highlight
                      ? { background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff" }
                      : { background: "#27272a", color: "#e4e4e7", border: "1px solid #3f3f46" }}>
                    {loadingPlan === plan.key
                      ? <><Loader2 size={14} className="animate-spin" />Redirecting…</>
                      : <><Zap size={14} />Buy {plan.label} — {plan.price}</>}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-700">
            <span>Secure payment via Stripe</span>
            <span>&middot;</span>
            <span>Credits delivered instantly</span>
          </p>
        </div>
      </div>
    </div>
  );
}
