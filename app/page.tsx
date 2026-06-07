"use client";

import { useState, FormEvent } from "react";
import { AuditResult, Issue, IssueStatus } from "@/types/audit";

// ── Status icons ──────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: IssueStatus }) {
  if (status === "pass")
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold flex-shrink-0">
        ✓
      </span>
    );
  if (status === "warn")
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm font-bold flex-shrink-0">
        ⚠
      </span>
    );
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-700 text-sm font-bold flex-shrink-0">
      ✗
    </span>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const color =
    score >= 80
      ? "from-emerald-400 to-emerald-600"
      : score >= 50
      ? "from-amber-400 to-amber-600"
      : "from-red-400 to-red-600";

  const ring =
    score >= 80
      ? "ring-emerald-200"
      : score >= 50
      ? "ring-amber-200"
      : "ring-red-200";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${color} ring-8 ${ring} shadow-lg`}
      >
        <span className="text-4xl font-extrabold text-white">{score}</span>
      </div>
      <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
        Score / 100
      </div>
      <span
        className={`rounded-full px-4 py-1 text-sm font-bold text-white bg-gradient-to-r ${color}`}
      >
        Grade {grade}
      </span>
    </div>
  );
}

// ── Issue card ────────────────────────────────────────────────────────────────
function IssueCard({ issue }: { issue: Issue }) {
  const border =
    issue.status === "pass"
      ? "border-emerald-300"
      : issue.status === "warn"
      ? "border-amber-300"
      : "border-red-300";

  return (
    <div className={`flex gap-3 rounded-xl border-l-4 ${border} bg-white p-4 shadow-sm`}>
      <StatusIcon status={issue.status} />
      <div>
        <p className="text-sm font-medium text-slate-800">{issue.message}</p>
        {issue.fixTip && (
          <p className="mt-1 text-xs text-slate-400">{issue.fixTip}</p>
        )}
      </div>
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <svg
        className="h-10 w-10 animate-spin text-indigo-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"
        />
      </svg>
      <p className="text-sm text-slate-500">Analyzing your listing…</p>
    </div>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────────
function Results({ result }: { result: AuditResult }) {
  const { score, grade, issues, keywordGaps } = result;

  return (
    <div className="mt-8 space-y-8">
      {/* Score */}
      <div className="flex justify-center">
        <ScoreBadge score={score} grade={grade} />
      </div>

      {/* Issues */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Audit Findings
        </h2>
        <div className="space-y-3">
          {issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} />
          ))}
        </div>
      </section>

      {/* Keyword Gaps */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Missing Keywords
        </h2>

        {keywordGaps.skipped && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Add a{" "}
            <code className="rounded bg-slate-200 px-1 font-mono text-xs">
              GEMINI_API_KEY
            </code>{" "}
            to <code className="rounded bg-slate-200 px-1 font-mono text-xs">.env.local</code> to
            unlock AI-powered keyword gap analysis.
          </div>
        )}

        {keywordGaps.error && !keywordGaps.skipped && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {keywordGaps.error}
          </div>
        )}

        {keywordGaps.suggestedKeywords.length > 0 && (
          <>
            {keywordGaps.mainKeywordHasVolume === false && (
              <p className="mb-3 text-xs text-amber-600">
                ⚠ Your main keyword may have low search volume. Consider the
                alternatives below.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {keywordGaps.suggestedKeywords.map((kw, i) => (
                <div
                  key={i}
                  className="group relative cursor-default"
                  title={kw.why}
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-200">
                    {kw.keyword}
                  </span>
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                    {kw.why}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Hover over a chip for the reason. Add these phrases to your title
              and/or description.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mainKeyword, setMainKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      const data = (await res.json()) as AuditResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
      {/* Header */}
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧞</span>
            <span className="text-lg font-extrabold tracking-tight text-indigo-700">
              ListingGenie
            </span>
            <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
              Free Audit
            </span>
          </div>
          <span className="hidden text-xs text-slate-400 sm:block">
            No sign-up required
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Audit your product listing{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              in seconds
            </span>
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Paste your title and description. Get an instant score, a list of
            issues, and the high-intent keywords you&apos;re missing.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Product title{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Stainless Steel French Press Coffee Maker 34 oz — BPA Free"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              <div className="mt-1 flex justify-end">
                <span
                  className={`text-xs ${
                    title.length > 80
                      ? "text-red-500"
                      : title.length >= 40
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                >
                  {title.length} chars
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Product description{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={7}
                placeholder="Paste your full product description here. Include features, benefits, materials, dimensions, and use cases…"
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              <div className="mt-1 flex justify-end">
                <span
                  className={`text-xs ${
                    description.length >= 300
                      ? "text-emerald-600"
                      : description.length >= 150
                      ? "text-amber-500"
                      : "text-slate-400"
                  }`}
                >
                  {description.length} chars
                  {description.length < 300 && description.length > 0 && (
                    <> — aim for 300+</>
                  )}
                </span>
              </div>
            </div>

            {/* Main keyword */}
            <div>
              <label
                htmlFor="keyword"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Main keyword{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="keyword"
                type="text"
                value={mainKeyword}
                onChange={(e) => setMainKeyword(e.target.value)}
                placeholder="e.g. french press coffee maker"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                The primary search phrase you want to rank for.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Analyzing…" : "Audit my listing →"}
            </button>
          </form>

          {/* Loading */}
          {loading && <Spinner />}

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Results */}
          {result && !loading && <Results result={result} />}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          100% free · No account needed · Your data is never stored
        </p>
      </main>
    </div>
  );
}
