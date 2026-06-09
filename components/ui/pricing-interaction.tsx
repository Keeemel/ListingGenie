"use client";

import NumberFlow from "@number-flow/react";
import React from "react";
import { Loader2 } from "lucide-react";

interface PricingInteractionProps {
  freeCredits: number;
  starterPrice: number;
  starterCredits: number;
  valuePrice: number;
  valueCredits: number;
  onSelectFree?: () => void;
  onSelectStarter?: () => Promise<void> | void;
  onSelectValue?: () => Promise<void> | void;
}

export function PricingInteraction({
  freeCredits,
  starterPrice,
  starterCredits,
  valuePrice,
  valueCredits,
  onSelectFree,
  onSelectStarter,
  onSelectValue,
}: PricingInteractionProps) {
  const [active, setActive] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const plans = [
    {
      name: "Free",
      price: 0,
      credits: freeCredits,
      badge: null,
      sub: "to get started",
    },
    {
      name: "Starter",
      price: starterPrice,
      credits: starterCredits,
      badge: "Popular",
      sub: "one-time",
    },
    {
      name: "Value",
      price: valuePrice,
      credits: valueCredits,
      badge: "Best deal",
      sub: "one-time",
    },
  ];

  async function handleCta() {
    if (active === 0) {
      onSelectFree?.();
      return;
    }
    setLoading(true);
    try {
      if (active === 1) await onSelectStarter?.();
      else await onSelectValue?.();
    } finally {
      setLoading(false);
    }
  }

  // Each card is 80px tall — keep consistent so the sliding border lines up
  const CARD_H = 80;
  const GAP = 12;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-[28px] border border-zinc-800 bg-zinc-900 p-3 shadow-2xl">
      {/* Plan cards */}
      <div className="relative flex w-full flex-col gap-3">
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            className="relative z-10 flex h-[80px] w-full cursor-pointer items-center justify-between rounded-2xl border border-zinc-700/60 px-4"
            onClick={() => setActive(i)}
          >
            <div className="flex flex-col items-start">
              <p className="flex items-center gap-2 text-base font-semibold text-zinc-100">
                {plan.name}
                {plan.badge && (
                  <span
                    className="rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: "#1e1b4b",
                      border: "1px solid #4338ca40",
                      color: "#a5b4fc",
                    }}
                  >
                    {plan.badge}
                  </span>
                )}
              </p>
              <p className="mt-0.5 flex items-center text-sm text-zinc-500">
                {plan.price === 0 ? (
                  <span className="font-medium text-zinc-300">Free</span>
                ) : (
                  <span className="flex items-center font-medium text-zinc-300">
                    €
                    <NumberFlow value={plan.price} />
                  </span>
                )}
                <span className="ml-1.5">
                  — {plan.credits} optimization{plan.credits !== 1 ? "s" : ""}
                </span>
              </p>
            </div>

            {/* Radio dot */}
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 p-1"
              style={{
                borderColor: active === i ? "#6366f1" : "#52525b",
                transition: "border-color 0.25s",
              }}
            >
              <div
                className="h-2.5 w-2.5 rounded-full bg-indigo-500"
                style={{
                  opacity: active === i ? 1 : 0,
                  transition: "opacity 0.25s",
                }}
              />
            </div>
          </div>
        ))}

        {/* Sliding highlight border */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 rounded-2xl border-2 border-indigo-500"
          style={{
            height: `${CARD_H}px`,
            transform: `translateY(${active * (CARD_H + GAP)}px)`,
            transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>

      {/* CTA button */}
      <button
        type="button"
        onClick={handleCta}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ transition: "background 0.2s, transform 0.15s" }}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : active === 0 ? (
          "Try for free"
        ) : (
          `Buy ${plans[active].name} — €${plans[active].price}`
        )}
      </button>
    </div>
  );
}
