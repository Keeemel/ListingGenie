"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, FormEvent, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, Loader2,
  Sparkles, Search, ShoppingCart, Tag, Heart, Store, Shirt,
  Globe, Info, Hash, Wand2, CreditCard, Copy, Check,
  Zap, BarChart3, Brain, Lock,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { SparklesText } from "@/components/ui/sparkles-text";
import { LiquidButton } from "@/components/ui/liquid-button";
import { HeroLanding } from "@/components/ui/hero-1";
import { AuthModal } from "@/components/ui/auth-modal";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
import { AccountModal } from "@/components/ui/account-modal";
import { AnimatedTestimonials, type Testimonial } from "@/components/ui/animated-testimonials";
import { PricingInteraction } from "@/components/ui/pricing-interaction";
import { AuditResponse, AuditResult, Issue, IssueStatus, Platform } from "@/types/audit";
import { OptimizeApiResult } from "@/types/optimize";
import { createClient } from "@/lib/supabase/client";

const LiquidGlassButton = dynamic(
  () => import("@/components/ui/liquid-glass-button").then((m) => m.LiquidGlassButton),
  { ssr: false },
);

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_META = {
  pass: { Icon: CheckCircle2, color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "#34d39930", label: "text-emerald-400" },
  warn: { Icon: AlertTriangle, color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "#fbbf2430", label: "text-amber-400" },
  fail: { Icon: XCircle, color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "#f8717130", label: "text-red-400" },
} satisfies Record<IssueStatus, { Icon: React.ComponentType<{ className?: string; size?: number; color?: string }>; color: string; bg: string; border: string; label: string }>;

function scoreAccent(score: number) {
  if (score >= 80) return { stroke: "#34d399", text: "text-emerald-400" };
  if (score >= 50) return { stroke: "#fbbf24", text: "text-amber-400" };
  return { stroke: "#f87171", text: "text-red-400" };
}

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const R = 52;
  const circ = 2 * Math.PI * R;
  const acc = scoreAccent(score);
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (score / 100) * circ), 150);
    return () => clearTimeout(t);
  }, [score, circ]);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="148" height="148" className="-rotate-90" aria-label={`Score: ${score} out of 100`}>
          <circle cx="74" cy="74" r={R} fill="none" stroke="#27272a" strokeWidth="9" />
          <circle cx="74" cy="74" r={R} fill="none" stroke={acc.stroke} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} style={{ filter: `drop-shadow(0 0 8px ${acc.stroke})`, transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[2.6rem] font-black leading-none text-white tabular-nums">{score}</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-600">/100</span>
        </div>
      </div>
      <span className={`text-xs font-bold uppercase tracking-[0.18em] ${acc.text}`}>Grade {grade}</span>
    </div>
  );
}

function IssueCard({ issue, index }: { issue: Issue; index: number }) {
  const m = STATUS_META[issue.status];
  const { Icon } = m;
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.045, duration: 0.26, ease: "easeOut" }}
      className="flex gap-3 rounded-xl p-3.5" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
      <Icon size={16} color={m.color} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug text-zinc-100">{issue.message}</p>
        {issue.fixTip && <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{issue.fixTip}</p>}
      </div>
    </motion.div>
  );
}

function KeywordChip({ kw, index }: { kw: { keyword: string; why: string }; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.25 }} className="group relative cursor-default">
      <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
        style={{ background: "linear-gradient(135deg,#6366f114,#8b5cf614)", border: "1px solid #6366f132", color: "#a5b4fc" }}>
        <Sparkles size={11} className="text-indigo-400 shrink-0" />{kw.keyword}
      </span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2.5 hidden w-64 -translate-x-1/2 rounded-xl border border-zinc-700/80 bg-zinc-900 px-4 py-3 text-xs leading-relaxed text-zinc-300 shadow-2xl group-hover:block">
        {kw.why}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-zinc-700/80" />
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-5 py-16">
      <div className="relative h-11 w-11">
        <div className="absolute inset-0 rounded-full border border-zinc-800" />
        <Loader2 size={44} className="animate-spin text-indigo-500" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-zinc-300">Analyzing your listing</p>
        <p className="text-xs text-zinc-600">Running 30+ SEO &amp; conversion checks…</p>
      </div>
      <div className="w-full max-w-sm space-y-2.5">
        {[80, 65, 90, 55].map((w, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-800/60" style={{ width: `${w}%` }} />
        ))}
      </div>
    </motion.div>
  );
}

function InvalidInputState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#27272a", border: "1px solid #3f3f46" }}>
        <AlertTriangle size={18} className="text-amber-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-zinc-100">This doesn&apos;t look like a product listing yet</h3>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
          Paste a real product title and description — what it is, materials, size, who it&apos;s for — to get your audit.
        </p>
      </div>
      <button type="button" onClick={onReset}
        className="mt-1 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-700">
        Try again
      </button>
    </motion.div>
  );
}

function OptimizedResult({ result, onClose }: { result: OptimizeApiResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function copyAll() {
    navigator.clipboard.writeText(`${result.optimizedTitle}\n\n${result.optimizedDescription}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => null);
  }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-4 rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 size={13} className="text-indigo-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">AI-Optimized Listing</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={copyAll} className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300">
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy all"}
          </button>
          <button type="button" onClick={onClose} className="text-zinc-700 transition-colors hover:text-zinc-500" aria-label="Close">
            <XCircle size={15} />
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-600">Optimized Title</p>
          <p className="text-sm font-medium leading-snug text-zinc-100">{result.optimizedTitle}</p>
        </div>
        <div className="h-px bg-zinc-800/80" />
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-600">Optimized Description</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{result.optimizedDescription}</p>
        </div>
      </div>
    </motion.div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  amazon: "Amazon", ebay: "eBay", etsy: "Etsy", shopify: "Shopify", vinted: "Vinted", other: "General",
};

function ResultsGrid({ result }: { result: AuditResult }) {
  const { score, grade, issues, keywordGaps, platform, platformTips } = result;
  const platformLabel = PLATFORM_LABELS[platform] ?? "General";
  const failCount = issues.filter((i) => i.status === "fail").length;
  const warnCount = issues.filter((i) => i.status === "warn").length;
  const passCount = issues.filter((i) => i.status === "pass").length;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: "easeOut" }}
        className="col-span-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center gap-6">
          <ScoreGauge score={score} grade={grade} />
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ background: "#6366f115", border: "1px solid #6366f135", color: "#a5b4fc" }}>
              {platformLabel} audit
            </span>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <span className="text-emerald-500">{passCount} passed</span>
              <span className="text-amber-400">{warnCount} warnings</span>
              <span className="text-red-400">{failCount} critical</span>
            </div>
          </div>
        </div>
      </motion.div>

      {issues.map((issue, i) => <IssueCard key={i} issue={issue} index={i} />)}

      {platformTips.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: issues.length * 0.045 + 0.05, duration: 0.3 }}
          className="col-span-full rounded-xl border border-indigo-900/30 bg-indigo-950/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Info size={12} className="text-zinc-500" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{platformLabel} Best Practices</span>
          </div>
          <div className="space-y-1.5">
            {platformTips.map((tip, i) => (
              <div key={i} className="flex gap-2.5">
                <Sparkles size={11} className="mt-0.5 shrink-0 text-indigo-400" />
                <p className="text-xs leading-relaxed text-zinc-300">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: issues.length * 0.045 + 0.12, duration: 0.3 }}
        className="col-span-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Search size={12} className="text-zinc-500" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Missing Keywords</span>
        </div>
        {keywordGaps.skipped && (
          <p className="text-sm text-zinc-500">Add a <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-violet-400">GEMINI_API_KEY</code> to unlock AI keyword gap analysis.</p>
        )}
        {keywordGaps.error && !keywordGaps.skipped && <p className="text-sm text-red-400">{keywordGaps.error}</p>}
        {keywordGaps.mainKeywordHasVolume === false && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-900/30 bg-amber-950/20 p-3 text-xs text-amber-500">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            Your main keyword may have low search volume — consider the alternatives below.
          </div>
        )}
        {keywordGaps.suggestedKeywords.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {keywordGaps.suggestedKeywords.map((kw, i) => <KeywordChip key={i} kw={kw} index={i} />)}
            </div>
            <p className="mt-3 text-xs text-zinc-600">Hover a chip to see why buyers search this phrase. Work these into your title and first paragraph.</p>
          </>
        )}
        {keywordGaps.backendTerms && keywordGaps.backendTerms.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <Hash size={11} className="text-zinc-500" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Backend Search Terms (Seller Central)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywordGaps.backendTerms.map((term, i) => (
                <span key={i} className="inline-flex rounded-full px-3 py-1 text-xs font-medium text-zinc-400" style={{ background: "#27272a", border: "1px solid #3f3f46" }}>{term}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-600">Add these to the Keywords field in Seller Central — they improve indexing without cluttering your visible listing.</p>
          </div>
        )}
        {keywordGaps.tags && keywordGaps.tags.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <Tag size={11} className="text-zinc-500" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Etsy Tags ({keywordGaps.tags.length}/13)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywordGaps.tags.map((tag, i) => (
                <span key={i} className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: "#4c1d9520", border: "1px solid #7c3aed40", color: "#a78bfa" }}>{tag}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-600">Each tag must be 20 characters or fewer.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const fieldCls =
  "w-full rounded-xl border border-zinc-700/80 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 " +
  "placeholder-zinc-600 outline-none ring-0 transition-all duration-200 " +
  "hover:border-zinc-600 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/25 autofill:bg-zinc-900";

const PLATFORM_ITEMS: { id: Platform; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "amazon", label: "Amazon", Icon: ShoppingCart },
  { id: "ebay", label: "eBay", Icon: Tag },
  { id: "etsy", label: "Etsy", Icon: Heart },
  { id: "shopify", label: "Shopify", Icon: Store },
  { id: "vinted", label: "Vinted", Icon: Shirt },
  { id: "other", label: "Other", Icon: Globe },
];

const PLATFORM_TITLE_HINTS: Record<Platform, { idealMin: number; idealMax: number; acceptableMin: number; hint: string }> = {
  amazon:  { idealMin: 80,  idealMax: 150, acceptableMin: 50,  hint: "Ideal: 80–150 chars" },
  ebay:    { idealMin: 60,  idealMax: 80,  acceptableMin: 40,  hint: "Ideal: 60–80 chars (max 80)" },
  etsy:    { idealMin: 60,  idealMax: 140, acceptableMin: 40,  hint: "Ideal: 60–140 chars" },
  shopify: { idealMin: 50,  idealMax: 60,  acceptableMin: 30,  hint: "Ideal: 50–60 chars" },
  vinted:  { idealMin: 20,  idealMax: 60,  acceptableMin: 10,  hint: "Ideal: 20–60 chars" },
  other:   { idealMin: 40,  idealMax: 70,  acceptableMin: 20,  hint: "Ideal: 40–70 chars" },
};

const VALID_PLATFORM_SET = new Set<string>(["amazon", "ebay", "etsy", "shopify", "vinted", "other"]);

// ── Testimonials data ─────────────────────────────────────────────────────────
const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Emma Laurent",
    role: "Amazon FBA Seller",
    company: "Self-employed",
    content: "Listed 3 products with ListingGenie's AI optimization. The first one hit page 1 within two weeks. The keyword gap analysis alone was worth 10x the price — it surfaced terms I'd never thought of.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 2,
    name: "Marcus Webb",
    role: "Etsy Shop Owner",
    company: "Webb Crafts Co.",
    content: "My best-selling item was pulling 40 views a month. After the AI rewrite, it jumped to 340. The title structure and keyword density insights were a game-changer. I wish I'd found this tool sooner.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 3,
    name: "Sofia Andersen",
    role: "eBay Power Seller",
    company: "Nordic Vintage Co.",
    content: "I sell vintage items and thought SEO didn't matter much on eBay. ListingGenie proved me completely wrong. Sales up 60% in six weeks after optimizing my top 5 listings.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: 4,
    name: "Ryan Okafor",
    role: "Shopify Store Owner",
    company: "Okafor Outdoors",
    content: "The platform-specific suggestions blew me away. It understood exactly what Shopify's algorithm prioritizes. 3x organic traffic in a month without spending an extra euro on ads.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    id: 5,
    name: "Léa Moreau",
    role: "Vinted Seller",
    company: "Vintage by Léa",
    content: "Even for Vinted! I was skeptical — it's just second-hand clothes. But it found 8 keywords I was completely missing. My items sell in hours now instead of sitting for weeks.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/17.jpg",
  },
];

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [mainKeyword,  setMainKeyword]  = useState("");
  const [platform,     setPlatform]     = useState<Platform>("other");
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState<AuditResult | null>(null);
  const [invalidInput, setInvalidInput] = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const sbRef = useRef<ReturnType<typeof createClient> | null>(null);

  const [user,             setUser]             = useState<User | null>(null);
  const [credits,          setCredits]          = useState(0);
  const [showAuthModal,    setShowAuthModal]    = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [optimizing,    setOptimizing]    = useState(false);
  const [optimized,     setOptimized]     = useState<OptimizeApiResult | null>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);

  const splitActive = loading || !!result || !!invalidInput || !!error;

  useEffect(() => {
    const keys = ["lg_title", "lg_desc", "lg_kw", "lg_platform"] as const;
    const vals = keys.map((k) => { const v = sessionStorage.getItem(k); sessionStorage.removeItem(k); return v; });
    if (vals[0]) setTitle(vals[0]);
    if (vals[1]) setDescription(vals[1]);
    if (vals[2]) setMainKeyword(vals[2]);
    if (vals[3] && VALID_PLATFORM_SET.has(vals[3])) setPlatform(vals[3] as Platform);

    let sb: ReturnType<typeof createClient>;
    try { sb = createClient(); sbRef.current = sb; } catch { return; }

    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(sb, session.user.id);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(sb, session.user.id);
      else setCredits(0);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(sb: ReturnType<typeof createClient>, userId: string) {
    const { data } = await sb.from("profiles").select("credits").eq("id", userId).single();
    if (data) setCredits(data.credits ?? 0);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    setInvalidInput(null);
    setOptimized(null);
    setOptimizeError(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, mainKeyword, platform }),
      });
      if (!res.ok) { const d = (await res.json()) as { error?: string }; throw new Error(d.error ?? `Server error ${res.status}`); }
      const data = (await res.json()) as AuditResponse;
      if ("invalid" in data && data.invalid) setInvalidInput(data.reason);
      else setResult(data as AuditResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOptimize() {
    if (!result) return;
    if (!user) {
      sessionStorage.setItem("lg_title", title);
      sessionStorage.setItem("lg_desc", description);
      sessionStorage.setItem("lg_kw", mainKeyword);
      sessionStorage.setItem("lg_platform", platform);
      setShowAuthModal(true);
      return;
    }
    setOptimizing(true);
    setOptimized(null);
    setOptimizeError(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, platform, issues: result.issues }),
      });
      if (res.status === 402) { setShowUpgradeModal(true); return; }
      if (!res.ok) { const d = (await res.json()) as { error?: string }; throw new Error(d.error ?? `Server error ${res.status}`); }
      const data = (await res.json()) as OptimizeApiResult;
      setOptimized(data);
      setCredits(data.creditsRemaining);
    } catch (err) {
      setOptimizeError(err instanceof Error ? err.message : "Optimization failed.");
    } finally {
      setOptimizing(false);
    }
  }

  async function handleSignOut() {
    // 1. Supabase API sign-out (global scope — invalidates server session)
    try {
      await createClient().auth.signOut({ scope: "global" });
    } catch {
      // ignore network errors
    }
    // 2. Wipe localStorage keys
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    // 3. Wipe Supabase cookies (session may be stored there via @supabase/ssr)
    try {
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        if (name.startsWith("sb-")) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
    } catch {
      // ignore
    }
    window.location.href = "/";
  }

  async function handleBuyPlan(plan: "starter" | "value") {
    if (!user) {
      sessionStorage.setItem("lg_title", title);
      sessionStorage.setItem("lg_desc", description);
      sessionStorage.setItem("lg_kw", mainKeyword);
      sessionStorage.setItem("lg_platform", platform);
      setShowAuthModal(true);
      return;
    }
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const { url } = (await res.json()) as { url?: string };
    if (url) window.location.href = url;
  }

  const canSubmit = !loading && title.trim().length > 0 && description.trim().length > 0;

  function optimizeHint(): string {
    if (!user) return "— sign in to use";
    if (credits > 0) return `— ${credits} credit${credits !== 1 ? "s" : ""} left`;
    return "— upgrade to continue";
  }

  function CharCount({ len, idealMin, idealMax, acceptableMin }: { len: number; idealMin: number; idealMax?: number; acceptableMin?: number }) {
    const color =
      idealMax && len > idealMax ? "text-red-500" :
      len >= idealMin ? "text-emerald-500" :
      acceptableMin && len >= acceptableMin ? "text-amber-500" : "text-zinc-700";
    return <span className={`tabular-nums text-xs transition-colors ${color}`}>{len.toLocaleString()}</span>;
  }

  function scrollToAudit() {
    document.getElementById("audit-form")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="bg-zinc-950">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" width={30} height={30} alt="ListingGenie" unoptimized priority />
            <span className="text-[15px] font-extrabold tracking-tight text-white">ListingGenie</span>
          </div>

          {/* Nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {[
              { label: "How it works", href: "#how-it-works" },
              { label: "Free audit", href: "#audit-form" },
              { label: "Reviews", href: "#testimonials" },
              { label: "Pricing", href: "#pricing" },
            ].map(({ label, href }) => (
              <a key={label} href={href}
                className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200">
                {label}
              </a>
            ))}
          </nav>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                className="flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900 py-1 pl-1 pr-3 transition-all hover:border-indigo-500/50 hover:bg-zinc-800"
                title="Account settings"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <CreditCard size={10} className="text-zinc-600" />
                <span className="text-xs font-semibold text-zinc-300">
                  {credits} credit{credits !== 1 ? "s" : ""}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowAuthModal(true)}
                className="rounded-full border border-zinc-700/60 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 transition-all hover:border-indigo-500/50 hover:text-white">
                Sign in
              </button>
              <button type="button" onClick={scrollToAudit}
                className="rounded-full px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                Try for free
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <HeroLanding
        title={
          <h1 className="max-w-3xl text-4xl font-black leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
            <SparklesText text="Your listings are losing you sales." colors={{ first: "#818cf8", second: "#a78bfa" }} sparklesCount={8} />
            <br />
            <SparklesText text="Our e-commerce AI fixes that."
              colors={{ first: "#c4b5fd", second: "#f9a8d4" }} sparklesCount={8}
              textStyle={{
                backgroundImage: "linear-gradient(135deg,#818cf8 0%,#a855f7 50%,#ec4899 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text", color: "transparent", fontWeight: "inherit",
              }} />
          </h1>
        }
        description="An AI trained specifically on e-commerce conversion patterns — analyzing 30+ SEO signals, keyword gaps, and marketplace-specific rules to tell you exactly what's killing your sales and how to fix it."
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <LiquidGlassButton onClick={scrollToAudit}>
            Run a free audit
            <ArrowRight size={15} />
          </LiquidGlassButton>
          <a href="#how-it-works"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-300">
            How it works <ArrowRight size={13} />
          </a>
        </div>

        {/* Platform chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] text-zinc-700">Optimized for</span>
          {["Amazon", "Etsy", "eBay", "Shopify", "Vinted"].map((p) => (
            <span key={p} className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[11px] font-medium text-zinc-500">{p}</span>
          ))}
        </div>
      </HeroLanding>

      {/* ── Trust strip ────────────────────────────────────────────────────── */}
      <div className="border-y border-zinc-800/50 bg-zinc-900/20">
        <div className="mx-auto max-w-5xl px-5 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {([
              { Icon: Brain, color: "#818cf8", label: "Gemini AI", sub: "e-commerce trained" },
              { Icon: BarChart3, color: "#34d399", label: "30+ signals", sub: "SEO & conversion" },
              { Icon: Globe, color: "#60a5fa", label: "6 marketplaces", sub: "Amazon, Etsy, eBay…" },
              { Icon: Zap, color: "#fbbf24", label: "Instant results", sub: "under 10 seconds" },
              { Icon: Lock, color: "#a78bfa", label: "Privacy first", sub: "data never stored" },
            ] as const).map(({ Icon, color, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-300">{label}</p>
                  <p className="text-[10px] text-zinc-600">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-zinc-950 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
              How it works
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              From listing to optimized — in{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">seconds</span>
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm leading-relaxed text-zinc-500">
              No marketing agency. No guesswork. An AI that has studied exactly what makes marketplace listings rank and convert.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                step: "01", color: "#6366f1",
                bg: "rgba(99,102,241,0.06)", border: "rgba(99,102,241,0.18)",
                title: "Paste your listing",
                desc: "Drop your product title and description. Select your marketplace. No account needed.",
              },
              {
                step: "02", color: "#10b981",
                bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.18)",
                title: "AI audits 30+ signals",
                desc: "Keyword density, title structure, conversion triggers, missing terms — all checked against platform-specific rules.",
              },
              {
                step: "03", color: "#a855f7",
                bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.18)",
                title: "Get your AI rewrite",
                desc: "One click generates an optimized title and description — rewritten for maximum ranking and sales velocity.",
              },
            ].map(({ step, color, bg, border, title, desc }) => (
              <div key={step} className="relative rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <span className="block text-6xl font-black tabular-nums leading-none" style={{ color, opacity: 0.18 }}>
                  {step}
                </span>
                <h3 className="mt-3 text-base font-bold text-zinc-100">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <AnimatedTestimonials
        title="Sellers who stopped guessing — and started winning."
        subtitle="Real results from marketplace sellers who used ListingGenie to turn underperforming listings into top-ranked products."
        badgeText="5-star rated by sellers"
        testimonials={TESTIMONIALS}
        autoRotateInterval={6000}
        trustedCompanies={["Amazon", "Etsy", "eBay", "Shopify", "Vinted", "Cdiscount"]}
        trustedCompaniesTitle="Trusted by sellers across"
      />

      {/* ── Separator ──────────────────────────────────────────────────────── */}
      <div className="relative h-px">
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,transparent,#6366f150,#a855f750,transparent)" }} />
      </div>

      {/* ── Audit section ──────────────────────────────────────────────────── */}
      <section id="audit-form" className="bg-zinc-950">
        <div className="flex flex-col md:h-[calc(100dvh-56px)] md:flex-row md:overflow-hidden">

          {/* Left: form */}
          <div className={[
            "shrink-0 md:border-r md:border-zinc-800/60",
            "transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            splitActive ? "md:w-[40%]" : "md:w-full",
          ].join(" ")}>
            <div className={["flex min-h-full flex-col justify-center p-4 md:p-5", !splitActive ? "md:mx-auto md:max-w-xl" : ""].join(" ")}>
              <div className="glow-card">
                <div className="glow-card-inner p-4 sm:p-5">
                  <form onSubmit={handleSubmit} className="space-y-3" noValidate>

                    {/* Platform */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Platform</p>
                      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                        {PLATFORM_ITEMS.map(({ id, label, Icon }) => {
                          const active = platform === id;
                          return (
                            <button key={id} type="button"
                              onClick={() => { setPlatform(id); setResult(null); setInvalidInput(null); setError(null); setOptimized(null); }}
                              className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition-all duration-150"
                              style={active
                                ? { background: "#6366f120", border: "1px solid #6366f155", color: "#a5b4fc" }
                                : { background: "#18181b", border: "1px solid #27272a", color: "#71717a" }}>
                              <Icon size={14} />{label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="h-px bg-zinc-800" />

                    {/* Title */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                          Product Title <span className="ml-0.5 text-indigo-500">*</span>
                        </label>
                        <CharCount len={title.length} idealMin={PLATFORM_TITLE_HINTS[platform].idealMin}
                          idealMax={PLATFORM_TITLE_HINTS[platform].idealMax} acceptableMin={PLATFORM_TITLE_HINTS[platform].acceptableMin} />
                      </div>
                      <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Stainless Steel French Press 34 oz — BPA Free, Double-Wall Insulated"
                        className={fieldCls} />
                      <p className="text-[11px] text-zinc-700">{PLATFORM_TITLE_HINTS[platform].hint}</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                          Description <span className="ml-0.5 text-indigo-500">*</span>
                        </label>
                        <CharCount len={description.length} idealMin={platform === "vinted" ? 60 : 300}
                          idealMax={platform === "vinted" ? 800 : 2000} acceptableMin={platform === "vinted" ? 30 : 150} />
                      </div>
                      <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                        rows={4} placeholder="Paste your full product description here — features, materials, dimensions, use cases, benefits…"
                        className={`${fieldCls} resize-none`} />
                      <p className="text-[11px] text-zinc-700">
                        {platform === "vinted"
                          ? description.length < 60 ? `${60 - description.length} more characters for full score` : "Length is good"
                          : description.length < 300 ? `${300 - description.length} more characters for full score` : "Length is good"}
                      </p>
                    </div>

                    {/* Keyword */}
                    <div className="space-y-1.5">
                      <label htmlFor="keyword" className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Main Keyword <span className="ml-1 font-normal normal-case tracking-normal text-zinc-700">(optional)</span>
                      </label>
                      <input id="keyword" type="text" value={mainKeyword} onChange={(e) => setMainKeyword(e.target.value)}
                        placeholder="e.g. french press coffee maker" className={fieldCls} />
                      <p className="text-[11px] text-zinc-700">The primary phrase you want to rank for.</p>
                    </div>

                    <LiquidButton type="submit" size="xl" className="w-full gap-2" disabled={!canSubmit}>
                      {loading ? <><Loader2 size={16} className="animate-spin" />Analyzing…</> : <>Audit my listing<ArrowRight size={16} /></>}
                    </LiquidButton>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Right: results */}
          <AnimatePresence>
            {splitActive && (
              <motion.div className="flex-1 overflow-y-auto border-t border-zinc-800/60 md:border-t-0"
                initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 48 }}
                transition={{ duration: 0.4, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}>
                <div className="p-4 md:p-6">
                  <AnimatePresence mode="wait">
                    {loading && (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <LoadingState />
                      </motion.div>
                    )}
                    {invalidInput && !loading && (
                      <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <InvalidInputState onReset={() => setInvalidInput(null)} />
                      </motion.div>
                    )}
                    {error && !loading && (
                      <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex gap-3 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
                        <XCircle size={16} className="mt-0.5 shrink-0" />{error}
                      </motion.div>
                    )}
                    {result && !loading && (
                      <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <ResultsGrid result={result} />

                        {/* Optimize button */}
                        {!optimized ? (
                          <div className="mt-5">
                            <button type="button" onClick={handleOptimize} disabled={optimizing}
                              className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)" }}>
                              {optimizing ? (
                                <><Loader2 size={15} className="animate-spin" />Rewriting with AI…</>
                              ) : (
                                <>
                                  <Wand2 size={15} />
                                  Optimize my listing with AI
                                  <span className="ml-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium">
                                    {optimizeHint()}
                                  </span>
                                </>
                              )}
                            </button>
                            {optimizeError && <p className="mt-2 text-xs text-red-400">{optimizeError}</p>}
                          </div>
                        ) : (
                          <OptimizedResult result={optimized} onClose={() => { setOptimized(null); setOptimizeError(null); }} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative overflow-hidden bg-zinc-950 py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full"
          style={{ background: "radial-gradient(ellipse,rgba(99,102,241,0.08) 0%,transparent 70%)" }} />

        <div className="relative mx-auto max-w-5xl px-5">
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-violet-400">
              Credit packs
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Audit free.{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Optimize to dominate.
              </span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-sm leading-relaxed text-zinc-500">
              The audit is always free. Credits power the AI rewrite — one-time purchase, no subscription, credits never expire.
            </p>
          </div>

          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center">
            <PricingInteraction
              freeCredits={3}
              starterPrice={4.99}
              starterCredits={15}
              valuePrice={9.99}
              valueCredits={40}
              onSelectFree={scrollToAudit}
              onSelectStarter={() => handleBuyPlan("starter")}
              onSelectValue={() => handleBuyPlan("value")}
            />

            {/* Feature bullets */}
            <div className="flex flex-col gap-5 lg:max-w-xs">
              {([
                { Icon: Brain, color: "#818cf8", bg: "#6366f115", border: "#6366f130",
                  title: "E-commerce specialist AI",
                  desc: "Trained on conversion patterns from top-performing Amazon, Etsy, eBay and Shopify listings — not a generic writing tool." },
                { Icon: Zap, color: "#fbbf24", bg: "#f59e0b15", border: "#f59e0b30",
                  title: "Platform-specific rewrites",
                  desc: "Different algorithms for each marketplace. Amazon SEO differs from Etsy SEO — our AI knows the difference." },
                { Icon: Lock, color: "#34d399", bg: "#10b98115", border: "#10b98130",
                  title: "Secure & private",
                  desc: "Payments via Stripe. Your listing content is processed in real-time and never stored on our servers." },
              ] as const).map(({ Icon, color, bg, border, title, desc }) => (
                <div key={title} className="flex gap-3.5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: bg, border: `1px solid ${border}` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600">{desc}</p>
                  </div>
                </div>
              ))}

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-700">
                <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-600" />One-time payment</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-600" />Credits never expire</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-600" />Instant delivery</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-600" />Secure via Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" width={22} height={22} alt="" unoptimized />
            <span className="text-sm font-bold text-zinc-600">ListingGenie</span>
          </div>
          <p className="text-center text-xs text-zinc-700">
            AI-powered e-commerce optimization &middot; Powered by Gemini &middot; &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-700">
            <a href="#audit-form" className="hover:text-zinc-400 transition-colors">Free audit</a>
            <a href="#pricing" className="hover:text-zinc-400 transition-colors">Pricing</a>
          </div>
        </div>
      </footer>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      {showAccountModal && user && (
        <AccountModal
          user={user}
          credits={credits}
          onClose={() => setShowAccountModal(false)}
          onSignOut={handleSignOut}
          onBuyCredits={() => { setShowAccountModal(false); setShowUpgradeModal(true); }}
        />
      )}
    </div>
  );
}
