"use client";

import React from "react";

// ── SVG distortion filter (renders hidden, referenced by backdrop-filter) ─────
function GlassFilter() {
  return (
    <svg className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter
          id="lg-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.065 0.065" numOctaves="1" seed="2" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.5" result="blurNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurNoise" scale="55" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="3" result="final" />
          <feComposite in="final" in2="final" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function LiquidGlassButton({ className = "", children, ...props }: LiquidGlassButtonProps) {
  return (
    <button
      className={`relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {/* Glass layer: inset shadow border ring */}
      <div
        className="absolute inset-0 rounded-full transition-all"
        style={{
          boxShadow: [
            "inset 0 0 0 1px rgba(255,255,255,0.18)",
            "inset 0 1px 1px rgba(255,255,255,0.22)",
            "inset 0 -1px 1px rgba(0,0,0,0.35)",
            "0 4px 24px rgba(99,102,241,0.25)",
            "0 1px 2px rgba(0,0,0,0.4)",
          ].join(","),
        }}
      />

      {/* Distorted backdrop */}
      <div
        className="absolute inset-0 -z-10 overflow-hidden rounded-full"
        style={{ backdropFilter: 'url("#lg-glass") blur(2px) brightness(1.08)' }}
      />

      {/* Indigo tint overlay */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.28) 0%, rgba(139,92,246,0.22) 100%)",
        }}
      />

      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <GlassFilter />
    </button>
  );
}
