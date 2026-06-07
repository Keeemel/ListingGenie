"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, FormEvent, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  BarChart3,
  Search,
} from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import { LiquidButton } from "@/components/ui/liquid-button";
import { AuditResult, Issue, IssueStatus } from "@/types/audit";

// WebGL canvas — client-only
const WebGLShader = dynamic(
  () => import("@/components/ui/webgl-shader").then((m) => m.WebGLShader),
  { ssr: false },
);

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_META = {
  pass: {
    Icon: CheckCircle2,
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "#34d39930",
    label: "text-emerald-400",
  },
  warn: {
    Icon: AlertTriangle,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "#fbbf2430",
    label: "text-amber-400",
  },
  fail: {
    Icon: XCircle,
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "#f8717130",
    label: "text-red-400",
  },
} satisfies Record<IssueStatus, { Icon: React.ComponentType<{ className?: string; size?: number; color?: string }>; color: string; bg: string; border: string; label: string }>;

function scoreAccent(score: number) {
  if (score >= 80) return { stroke: "#34d399", glow: "rgba(52,211,153,0.3)",  text: "text-emerald-400" };
  if (score >= 50) return { stroke: "#fbbf24", glow: "rgba(251,191,36,0.3)",  text: "text-amber-400"   };
  return               { stroke: "#f87171", glow: "rgba(248,113,113,0.3)", text: "text-red-400"     };
}

// ── Circular score gauge ──────────────────────────────────────────────────────
function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const R    = 52;
  const circ = 2 * Math.PI * R;
  const acc  = scoreAccent(score);

  // Animate from empty → actual offset
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (score / 100) * circ), 150);
    return () => clearTimeout(t);
  }, [score, circ]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="148" height="148" className="-rotate-90" aria-label={`Score: ${score} out of 100`}>
          {/* Track ring */}
          <circle cx="74" cy="74" r={R} fill="none" stroke="#27272a" strokeWidth="9" />
          {/* Progress ring */}
          <circle
            cx="74" cy="74" r={R}
            fill="none"
            stroke={acc.stroke}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="score-ring"
            style={{ filter: `drop-shadow(0 0 8px ${acc.stroke})` }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[2.6rem] font-black leading-none text-white tabular-nums">{score}</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-600">/100</span>
        </div>
      </div>
      <span className={`text-xs font-bold uppercase tracking-[0.18em] ${acc.text}`}>
        Grade {grade}
      </span>
    </div>
  );
}

// ── Issue card ────────────────────────────────────────────────────────────────
function IssueCard({ issue, index }: { issue: Issue; index: number }) {
  const m = STATUS_META[issue.status];
  const { Icon } = m;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.055, duration: 0.28, ease: "easeOut" }}
      className="flex gap-3.5 rounded-xl p-4"
      style={{
        background: m.bg,
        border: `1px solid ${m.border}`,
      }}
    >
      <Icon size={18} color={m.color} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug text-zinc-100">{issue.message}</p>
        {issue.fixTip && (
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{issue.fixTip}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Keyword chip ──────────────────────────────────────────────────────────────
function KeywordChip({ kw, index }: { kw: { keyword: string; why: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className="group relative cursor-default"
    >
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
        style={{
          background: "linear-gradient(135deg,#6366f114,#8b5cf614)",
          border: "1px solid #6366f132",
          color: "#a5b4fc",
        }}
      >
        <Sparkles size={11} className="text-indigo-400 shrink-0" />
        {kw.keyword}
      </span>
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2.5 hidden w-64 -translate-x-1/2 rounded-xl border border-zinc-700/80 bg-zinc-900 px-4 py-3 text-xs leading-relaxed text-zinc-300 shadow-2xl group-hover:block">
        {kw.why}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-zinc-700/80" />
      </div>
    </motion.div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8 flex flex-col items-center gap-5 py-10"
    >
      <div className="relative h-11 w-11">
        <div className="absolute inset-0 rounded-full border border-zinc-800" />
        <Loader2 size={44} className="animate-spin text-indigo-500" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-zinc-300">Analyzing your listing</p>
        <p className="text-xs text-zinc-600">Running SEO rules + Gemini keyword analysis…</p>
      </div>
      {/* Skeleton bars */}
      <div className="w-full space-y-2.5 pt-2">
        {[80, 65, 90, 55].map((w, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-xl bg-zinc-800/60"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────
function Results({ result }: { result: AuditResult }) {
  const { score, grade, issues, keywordGaps } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mt-10 space-y-10"
    >
      {/* Score */}
      <div className="flex justify-center">
        <ScoreGauge score={score} grade={grade} />
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-800" />

      {/* Audit findings */}
      <section>
        <div className="mb-5 flex items-center gap-2">
          <BarChart3 size={13} className="text-zinc-500" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Audit Findings
          </h2>
        </div>
        <div className="space-y-2.5">
          {issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} index={i} />
          ))}
        </div>
      </section>

      {/* Missing keywords */}
      <section>
        <div className="mb-5 flex items-center gap-2">
          <Search size={13} className="text-zinc-500" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Missing Keywords
          </h2>
        </div>

        {keywordGaps.skipped && (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-500">
            Add a{" "}
            <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-violet-400">
              GEMINI_API_KEY
            </code>{" "}
            to unlock AI keyword gap analysis.
          </p>
        )}

        {keywordGaps.error && !keywordGaps.skipped && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
            {keywordGaps.error}
          </div>
        )}

        {keywordGaps.mainKeywordHasVolume === false && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-900/30 bg-amber-950/20 p-3 text-xs text-amber-500">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            Your main keyword may have low search volume — consider the alternatives below.
          </div>
        )}

        {keywordGaps.suggestedKeywords.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {keywordGaps.suggestedKeywords.map((kw, i) => (
                <KeywordChip key={i} kw={kw} index={i} />
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              Hover a chip to see why buyers search this phrase. Work these into your title and first paragraph.
            </p>
          </>
        )}
      </section>
    </motion.div>
  );
}

// ── Dark input style ──────────────────────────────────────────────────────────
const fieldCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 " +
  "placeholder-zinc-700 outline-none ring-0 transition-all duration-200 " +
  "hover:border-zinc-700 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 " +
  "autofill:bg-zinc-950";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [mainKeyword, setMainKeyword] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<AuditResult | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, mainKeyword }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `Server error ${res.status}`);
      }
      setResult((await res.json()) as AuditResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && title.trim().length > 0 && description.trim().length > 0;

  // ── Char counter helper ───────────────────────────────────────────────────
  function CharCount({
    len, idealMin, idealMax, acceptableMin,
  }: { len: number; idealMin: number; idealMax?: number; acceptableMin?: number }) {
    const color =
      idealMax && len > idealMax ? "text-red-500" :
      len >= idealMin            ? "text-emerald-500" :
      acceptableMin && len >= acceptableMin ? "text-amber-500" :
      "text-zinc-700";
    return (
      <span className={`tabular-nums text-xs transition-colors ${color}`}>
        {len.toLocaleString()}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          {/* Logo + name */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="ListingGenie"
              unoptimized
              priority
            />
            <span className="text-[15px] font-extrabold tracking-tight text-white">
              ListingGenie
            </span>
            <span
              className="ml-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                border: "1px solid #6366f140",
                background: "#6366f110",
                color: "#818cf8",
              }}
            >
              Free Audit
            </span>
          </div>

          {/* Right */}
          <p className="hidden text-xs text-zinc-600 sm:block">
            No sign-up &middot; No data stored
          </p>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "68vh", paddingTop: "64px" /* header height */ }}
      >
        {/* WebGL shader — confined to this section */}
        <div className="absolute inset-0 z-0">
          <WebGLShader />
        </div>

        {/* Bottom gradient: hero fades into zinc-950 so the form section blends */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-950/30 via-zinc-950/10 to-zinc-950" />

        {/* Hero content */}
        <div className="relative z-10 flex min-h-[inherit] flex-col items-center justify-center px-5 pb-20 pt-12 text-center">
          {/* Eyebrow */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{
              border: "1px solid #6366f135",
              background: "#6366f10c",
              color: "#818cf8",
            }}
          >
            <Sparkles size={11} />
            AI-powered listing analysis
          </div>

          {/* H1 with sparkles */}
          <h1 className="max-w-3xl text-5xl font-black leading-[1.07] tracking-tight text-white sm:text-6xl lg:text-7xl">
            <SparklesText
              text="Your listings aren't selling."
              colors={["#818cf8", "#a78bfa", "#c4b5fd", "#f9a8d4"]}
            />
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
              }}
            >
              Here&apos;s exactly why.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Free 10-second audit — spot every SEO gap and conversion killer
            before they cost you another sale.
          </p>

          {/* Scroll hint */}
          <div className="mt-12 flex flex-col items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-700">Audit below</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 4L7 10L13 4" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Form + Results ──────────────────────────────────────────────────── */}
      <main className="relative z-20 mx-auto max-w-2xl px-4 pb-28 -mt-8">

        {/* Glow-border form card */}
        <div className="glow-card">
          <div className="glow-card-inner p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>

              {/* ── Title ── */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Product Title <span className="ml-0.5 text-indigo-500">*</span>
                  </label>
                  <CharCount len={title.length} idealMin={40} idealMax={80} acceptableMin={20} />
                </div>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Stainless Steel French Press 34 oz — BPA Free, Double-Wall Insulated"
                  className={fieldCls}
                />
                <p className="text-[11px] text-zinc-700">Ideal range: 40–70 characters</p>
              </div>

              {/* ── Description ── */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Product Description <span className="ml-0.5 text-indigo-500">*</span>
                  </label>
                  <CharCount len={description.length} idealMin={300} idealMax={2000} acceptableMin={150} />
                </div>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={7}
                  placeholder="Paste your full product description here — features, materials, dimensions, use cases, benefits…"
                  className={`${fieldCls} resize-y`}
                />
                <p className="text-[11px] text-zinc-700">
                  {description.length < 300
                    ? `${300 - description.length} more characters for full score`
                    : "Length is good"}
                </p>
              </div>

              {/* ── Keyword ── */}
              <div className="space-y-2">
                <label htmlFor="keyword" className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Main Keyword{" "}
                  <span className="ml-1 font-normal normal-case tracking-normal text-zinc-700">(optional)</span>
                </label>
                <input
                  id="keyword"
                  type="text"
                  value={mainKeyword}
                  onChange={(e) => setMainKeyword(e.target.value)}
                  placeholder="e.g. french press coffee maker"
                  className={fieldCls}
                />
                <p className="text-[11px] text-zinc-700">The primary phrase you want to rank for in search.</p>
              </div>

              {/* ── CTA ── */}
              <LiquidButton
                type="submit"
                size="xl"
                className="w-full gap-2"
                disabled={!canSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    Audit my listing
                    <ArrowRight size={16} />
                  </>
                )}
              </LiquidButton>
            </form>

            {/* Loading state */}
            <AnimatePresence>
              {loading && <LoadingState />}
            </AnimatePresence>

            {/* API error */}
            <AnimatePresence>
              {error && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 flex gap-3 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400"
                >
                  <XCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {result && !loading && <Results result={result} />}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[11px] text-zinc-800">
          Free forever &middot; No account &middot; Data never stored
        </p>
      </main>

    </div>
  );
}
