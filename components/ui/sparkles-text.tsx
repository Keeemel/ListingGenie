"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  size: number;
  duration: number;
  delay: number;
}

const DEFAULT_COLORS = ["#6366F1", "#8B5CF6", "#A78BFA", "#FE8BBB", "#C4B5FD"];

function make(colors: string[]): Sparkle {
  return {
    id:       Math.random().toString(36).slice(2),
    x:        `${Math.random() * 110 - 5}%`,
    y:        `${Math.random() * 110 - 5}%`,
    color:    colors[Math.floor(Math.random() * colors.length)],
    size:     Math.random() * 8 + 6,
    duration: Math.random() * 0.5 + 0.4,
    delay:    Math.random() * 0.3,
  };
}

function Star({ sparkle }: { sparkle: Sparkle }) {
  return (
    <motion.span
      className="pointer-events-none absolute"
      style={{ left: sparkle.x, top: sparkle.y }}
      initial={{ opacity: 0, scale: 0, rotate: -30 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 90, 180] }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: sparkle.duration, delay: sparkle.delay, ease: "easeInOut" }}
    >
      <svg
        width={sparkle.size}
        height={sparkle.size}
        viewBox="0 0 10 10"
        fill={sparkle.color}
        aria-hidden="true"
      >
        <path d="M5 0 L5.9 3.6 L9.5 5 L5.9 6.4 L5 10 L4.1 6.4 L0.5 5 L4.1 3.6 Z" />
      </svg>
    </motion.span>
  );
}

interface SparklesTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  density?: number;
}

export function SparklesText({
  children,
  className = "",
  colors = DEFAULT_COLORS,
  density = 5,
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) return;

    setSparkles(Array.from({ length: density }, () => make(colors)));
    const id = setInterval(() => {
      setSparkles((prev) => [...prev.slice(1), make(colors)]);
    }, 350);
    return () => clearInterval(id);
  }, [colors, density]);

  return (
    <span className={`relative inline-block ${className}`}>
      <AnimatePresence>
        {sparkles.map((s) => (
          <Star key={s.id} sparkle={s} />
        ))}
      </AnimatePresence>
      <span className="relative z-10">{children}</span>
    </span>
  );
}
