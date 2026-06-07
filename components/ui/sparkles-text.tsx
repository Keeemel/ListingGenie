"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  size: number;
  duration: number;
  delay: number;
}

const DEFAULT_COLORS = ["#818CF8", "#A78BFA", "#C4B5FD", "#F9A8D4", "#6366F1"];

function generateSparkle(colors: string[]): Sparkle {
  return {
    id:       crypto.randomUUID(),
    x:        `${Math.random() * 115 - 7}%`,
    y:        `${Math.random() * 115 - 7}%`,
    color:    colors[Math.floor(Math.random() * colors.length)],
    size:     Math.random() * 10 + 7,
    duration: Math.random() * 0.55 + 0.45,
    delay:    Math.random() * 0.25,
  };
}

// ── Star SVG ──────────────────────────────────────────────────────────────────
function Star({ s }: { s: Sparkle }) {
  return (
    <motion.span
      className="pointer-events-none absolute"
      style={{ top: s.y, left: s.x }}
      initial={{ scale: 0, opacity: 0, rotate: -20 }}
      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 90, 180] }}
      transition={{ duration: s.duration, delay: s.delay, ease: "easeInOut" }}
    >
      <svg
        width={s.size}
        height={s.size}
        viewBox="0 0 10 10"
        fill={s.color}
        aria-hidden="true"
      >
        <path d="M5 0 C5 0 4.0 4.0 0 5 C4.0 6.0 5 10 5 10 C5 10 6.0 6.0 10 5 C6.0 4.0 5 0 5 0 Z" />
      </svg>
    </motion.span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface SparklesTextProps {
  text: string;
  className?: string;
  colors?: string[];
  /** Interval between sparkle spawns in ms */
  interval?: number;
}

export function SparklesText({
  text,
  className = "",
  colors = DEFAULT_COLORS,
  interval = 300,
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) return;

    // Seed with initial sparkles
    setSparkles(Array.from({ length: 6 }, () => generateSparkle(colors)));

    const id = setInterval(() => {
      setSparkles((prev) => [...prev.slice(1), generateSparkle(colors)]);
    }, interval);

    return () => clearInterval(id);
  }, [colors, interval]);

  return (
    <span className={`relative inline-block ${className}`}>
      <AnimatePresence>
        {sparkles.map((s) => (
          <Star key={s.id} s={s} />
        ))}
      </AnimatePresence>
      <span className="relative">{text}</span>
    </span>
  );
}
