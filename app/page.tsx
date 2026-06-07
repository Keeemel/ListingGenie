"use client";

import dynamic from "next/dynamic";
import { useState, FormEvent } from "react";
import { SparklesText } from "@/components/ui/sparkles-text";
import { LiquidButton } from "@/components/ui/liquid-button";
import { AuditResult, Issue, IssueStatus } from "@/types/audit";

// WebGL canvas — no SSR (browser-only API)
const WebGLShader = dynamic(
  () => import("@/components/ui/webgl-shader").then((m) => m.WebGLShader),
  { ssr: false }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(s: IssueStatus) {
  if (s === "pass") return { ring: "#34d399", bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "✓" };
  if (s === "warn") return { ring: "#fbbf24", bg: "bg-amber-500/10",   text: "text-amber-400",   icon: "⚠" };
  return               { ring: "#f87171", bg: "bg-red-500/10",     text: "text-red-400",     icon: "✗" };
}

function scoreColor(score: number) {
  if (score >= 80) return { stroke: "#34d399", shadow: "rgba(52,211,153,0.35)",  grade: "text-emerald-400" };
  if (score >= 50) return { stroke: "#fbbf24", shadow: "rgba(251,191,36,0.35)",  grade: "text-amber-400"   };
  return                  { stroke: "#f87171", shadow: "rgba(248,113,113,0.35)", grade: "text-red-400"      };
}

// ── Status icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: IssueStatus }) {
  const c = statusColor(status);
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${c.bg} ${c.text}`}
      style={{ boxShadow: `0 0 0 1px ${c.ring}30` }}
    >
      {c.icon}
    </span>
  );
}

// ── Circular score gauge ──────────────────────────────────────────────────────

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const r    = 52;
  const circ = 2 * Math.PI * r;
  const off  = circ - (score / 100) * circ;
  const c    = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="144" height="144" className="-rotate-90" aria-hidden="true">
          {/* Track */}
          <circle cx="72" cy="72" r={r} fill="none" stroke="#27272a" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="72" cy="72" r={r}
            fill="none"
            stroke={c.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={off}
            className="score-ring"
            style={{ filter: `drop-shadow(0 0 6px ${c.stroke})` }}
          />
        </svg>
        {/* Label inside ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-white leading-none">{score}</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">/ 100</span>
        </div>
      </div>
      <span className={`text-sm font-bold uppercase tracking-widest ${c.grade}`}>
        Grade {grade}
      </span>
    </div>
  );
}

// ── Issue card ────────────────────────────────────────────────────────────────

function IssueCard({ issue }: { issue: Issue }) {
  const c = statusColor(issue.status);
  return (
    <div
      className="flex gap-3 rounded-xl bg-zinc-900 p-4"
      style={{ borderLeft: `3px solid ${c.ring}` }}
    >
      <StatusIcon status={issue.status} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-100">{issue.message}</p>
        {issue.fixTip && (
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{issue.fixTip}</p>
        )}
      </div>
    </div>
  );
}

// ── Keyword chip with tooltip ─────────────────────────────────────────────────

function KeywordChip({ kw }: { kw: { keyword: string; why: string } }) {
  return (
    <div className="group relative cursor-default">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
        style={{
          background: "linear-gradient(135deg, #6366F115, #8B5CF615)",
          border: "1px solid #6366F140",
          color: "#A78BFA",
          boxShadow: "0 0 12px #6366F110",
        }}
      >
        <span className="text-indigo-400 text-xs">✦</span>
        {kw.keyword}
      </span>
      {/* Tooltip */}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-60 -translate-x-1/2
                   rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs text-zinc-300
                   shadow-xl group-hover:block"
      >
        {kw.why}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-700" />
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="mt-8 flex flex-col items-center gap-4 py-8">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#8B5CF6" }}
        />
      </div>
      <p className="text-sm text-zinc-500">Analyzing your listing…</p>
    </div>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────────

function Results({ result }: { result: AuditResult }) {
  const { score, grade, issues, keywordGaps } = result;

  return (
    <div className="mt-10 space-y-8">
      {/* Score gauge */}
      <div className="flex justify-center">
        <ScoreGauge score={score} grade={grade} />
      </div>

      {/* Audit findings */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Audit Findings
        </h2>
        <div className="space-y-2.5">
          {issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} />
          ))}
        </div>
      </section>

      {/* Missing keywords */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Missing Keywords
        </h2>

        {keywordGaps.skipped && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
            Add a{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-violet-400">
              GEMINI_API_KEY
            </code>{" "}
            to{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-violet-400">
              .env.local
            </code>{" "}
            to unlock AI-powered keyword gap analysis.
          </div>
        )}

        {keywordGaps.error && !keywordGaps.skipped && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
            {keywordGaps.error}
          </div>
        )}

        {keywordGaps.mainKeywordHasVolume === false && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-amber-500">
            <span>⚠</span>
            Your main keyword may have low search volume — consider the alternatives below.
          </p>
        )}

        {keywordGaps.suggestedKeywords.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {keywordGaps.suggestedKeywords.map((kw, i) => (
                <KeywordChip key={i} kw={kw} />
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-600">
              Hover a chip to see why buyers search this phrase. Add them to your title and description.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

// ── Input / Textarea wrappers ─────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 " +
  "placeholder-zinc-600 outline-none transition " +
  "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

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
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setResult((await res.json()) as AuditResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && title.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* ── Slim header ──────────────────────────────────────────────────────── */}
      <header className="relative z-30 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🧞</span>
            <span className="text-base font-extrabold tracking-tight text-white">
              ListingGenie
            </span>
            <span className="ml-1 rounded-full border border-violet-700/40 bg-violet-950/60 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
              Free Audit
            </span>
          </div>
          <span className="hidden text-xs text-zinc-600 sm:block">
            No sign-up required
          </span>
        </div>
      </header>

      {/* ── Hero — WebGL shader confined here ────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "62vh" }}>

        {/* Shader background */}
        <div className="absolute inset-0 z-0">
          <WebGLShader className="h-full w-full" />
        </div>

        {/* Gradient fade to zinc-950 at bottom so content below blends */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-transparent to-zinc-950" />

        {/* Hero content */}
        <div className="relative z-10 flex min-h-[62vh] flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Free · Instant · No account
          </p>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            <SparklesText>
              Your product pages aren&apos;t selling.
            </SparklesText>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
              Here&apos;s why.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-zinc-400 sm:text-lg">
            Free 10-second listing audit — spot the SEO &amp; conversion gaps
            killing your sales.
          </p>

          {/* Scroll hint */}
          <div className="mt-10 flex flex-col items-center gap-1 text-zinc-600">
            <span className="text-xs uppercase tracking-widest">Start below</span>
            <svg
              className="h-4 w-4 animate-bounce"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── Form + Results ────────────────────────────────────────────────────── */}
      <main className="relative z-20 mx-auto max-w-2xl px-4 pb-24 -mt-6">

        {/* Glow-border form card */}
        <div className="glow-card">
          <div className="glow-card-inner p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Product title */}
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-zinc-300">
                  Product title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Stainless Steel French Press Coffee Maker 34 oz — BPA Free"
                  className={inputCls}
                />
                <div className="mt-1 flex justify-end">
                  <span className={`text-xs tabular-nums ${
                    title.length > 80 ? "text-red-400" :
                    title.length >= 40 ? "text-emerald-500" : "text-zinc-600"
                  }`}>
                    {title.length} chars
                  </span>
                </div>
              </div>

              {/* Product description */}
              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-zinc-300">
                  Product description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={7}
                  placeholder="Paste your full product description here. Include features, benefits, materials, dimensions, and use cases…"
                  className={`${inputCls} resize-y`}
                />
                <div className="mt-1 flex justify-end">
                  <span className={`text-xs tabular-nums ${
                    description.length >= 300 ? "text-emerald-500" :
                    description.length >= 150 ? "text-amber-500" : "text-zinc-600"
                  }`}>
                    {description.length} chars
                    {description.length > 0 && description.length < 300 && " — aim for 300+"}
                  </span>
                </div>
              </div>

              {/* Main keyword */}
              <div>
                <label htmlFor="keyword" className="mb-1.5 block text-sm font-semibold text-zinc-300">
                  Main keyword{" "}
                  <span className="font-normal text-zinc-600">(optional)</span>
                </label>
                <input
                  id="keyword"
                  type="text"
                  value={mainKeyword}
                  onChange={(e) => setMainKeyword(e.target.value)}
                  placeholder="e.g. french press coffee maker"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-zinc-600">
                  The primary search phrase you want to rank for.
                </p>
              </div>

              {/* CTA */}
              <LiquidButton
                type="submit"
                size="xl"
                className="w-full"
                disabled={!canSubmit}
              >
                {loading ? "Analyzing…" : "Audit my listing →"}
              </LiquidButton>
            </form>

            {/* Loading */}
            {loading && <Spinner />}

            {/* API error */}
            {error && !loading && (
              <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Results */}
            {result && !loading && <Results result={result} />}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-zinc-700">
          100% free · No account needed · Your data is never stored
        </p>
      </main>

    </div>
  );
}
