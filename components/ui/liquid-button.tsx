"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const variants = cva(
  [
    "relative inline-flex items-center justify-center overflow-hidden",
    "font-bold tracking-wide transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600",
          "bg-[length:200%_100%] bg-left",
          "text-white shadow-lg shadow-indigo-500/20",
          "hover:bg-right hover:shadow-indigo-500/40 hover:scale-[1.02]",
          "active:scale-[0.98]",
        ].join(" "),
        ghost: [
          "border border-zinc-700 bg-zinc-900/60 text-zinc-200",
          "hover:bg-zinc-800 hover:border-zinc-500",
        ].join(" "),
      },
      size: {
        sm: "rounded-lg  px-4   py-2    text-sm",
        md: "rounded-xl  px-5   py-2.5  text-sm",
        lg: "rounded-xl  px-6   py-3    text-base",
        xl: "rounded-2xl px-8   py-4    text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface LiquidButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {}

export const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <button ref={ref} className={variants({ variant, size, className })} {...props}>
      {/* Specular highlight — glass-like shine at top */}
      <span
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.18),transparent_65%)]"
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </button>
  )
);

LiquidButton.displayName = "LiquidButton";
