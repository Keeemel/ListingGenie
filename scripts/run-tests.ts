#!/usr/bin/env node
/**
 * ListingGenie — Automated Audit Test Suite
 * Usage:  npx tsx scripts/run-tests.ts
 *         npm test
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { runOnPageAudit, computeGrade } from "../lib/auditRules";
import { generateKeywordGaps } from "../lib/keywordGaps";
import type { Issue, KeywordGaps, IssueStatus } from "../types/audit";

// ── Load .env.local before any function reads process.env ────────────────────
// (keywordGaps reads GEMINI_API_KEY lazily inside generateKeywordGaps(), so
//  setting it here — at module scope, after imports — is fine.)
(function loadEnvLocal() {
  try {
    const content = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch { /* no .env.local — continue */ }
})();

// ── Types ─────────────────────────────────────────────────────────────────────
type Verdict = "✅" | "⚠️" | "❌";

interface RuleExpectation {
  rule: string;
  status: IssueStatus | "skipped";
}

interface TestCase {
  id: string;
  label: string;
  title: string;
  keyword: string;
  description: string;
  runGemini: boolean;
  expect: {
    scoreMin?: number;
    scoreMax?: number;
    grade?: string;
    rules: RuleExpectation[];
  };
}

interface TestResult {
  tc: TestCase;
  score: number;
  grade: string;
  issues: Issue[];
  gaps: KeywordGaps | null;
  verdict: Verdict;
  discrepancies: string[];
}

// ── The 6 test cases ──────────────────────────────────────────────────────────
const CASES: TestCase[] = [
  // ── CAS 1 ──────────────────────────────────────────────────────────────────
  {
    id: "bad-bottle",
    label: "CAS 1 — bad-bottle (degraded listing, all rules should fail or skip)",
    title: "Water Bottle",
    keyword: "insulated water bottle",
    description: "Nice bottle. Keeps drinks cold. Buy now.",
    runGemini: false,
    expect: {
      grade: "D",
      scoreMax: 35,
      rules: [
        { rule: "titleLength",        status: "fail"    },
        { rule: "keywordInTitle",     status: "fail"    },
        { rule: "keywordInDescription", status: "fail"  },
        { rule: "descriptionLength",  status: "fail"    },
        { rule: "structure",          status: "skipped" }, // desc < 300 chars
        { rule: "readability",        status: "skipped" }, // desc < 150 chars
        { rule: "keywordStuffing",    status: "pass"    },
      ],
    },
  },

  // ── CAS 2 ──────────────────────────────────────────────────────────────────
  {
    id: "good-bottle",
    label: "CAS 2 — good-bottle (well-structured, bullets, score ≥ 80)",
    title: "Insulated Water Bottle 750ml – 24h Cold, 12h Hot, Leakproof Stainless Steel",
    keyword: "insulated water bottle",
    description: `Stay hydrated all day with our double-wall insulated water bottle, built for work, gym, and travel.
• Keeps drinks cold for 24 hours and hot for 12 hours
• Leakproof lid – toss it in your bag without worry
• Premium 18/8 stainless steel, BPA-free
• Sweat-free exterior with a comfortable grip
• 750ml capacity, fits most car cup holders
Whether you're on the trail or at the office, this insulated water bottle keeps every sip at the perfect temperature. Easy to clean, built to last, backed by a lifetime guarantee.`,
    runGemini: false,
    expect: {
      scoreMin: 80,
      rules: [
        { rule: "titleLength",        status: "warn" }, // 75 chars → acceptable range
        { rule: "keywordInTitle",     status: "pass" },
        { rule: "keywordInDescription", status: "pass" },
        { rule: "descriptionLength",  status: "pass" },
        { rule: "structure",          status: "pass" }, // has bullets
        { rule: "keywordStuffing",    status: "pass" },
        { rule: "readability",        status: "pass" }, // bullets excluded from avg
      ],
    },
  },

  // ── CAS 3 ──────────────────────────────────────────────────────────────────
  {
    id: "stuffed",
    label: "CAS 3 — stuffed (keyword stuffing — CRITICAL check)",
    title: "Insulated Water Bottle Insulated Water Bottle Best Insulated Water Bottle",
    keyword: "insulated water bottle",
    description:
      "This insulated water bottle is the best insulated water bottle. Buy this insulated water bottle because our insulated water bottle is a great insulated water bottle. Insulated water bottle for everyone.",
    runGemini: false,
    expect: {
      scoreMax: 45, // hard cap applied by engine when stuffing fires
      rules: [
        { rule: "keywordStuffing", status: "fail" }, // CRITICAL: must fail
      ],
    },
  },

  // ── CAS 4 ──────────────────────────────────────────────────────────────────
  {
    id: "candle",
    label: "CAS 4 — candle (wrong keyword, thin description — Gemini gaps captured)",
    title: "Scented Soy Candle",
    keyword: "lavender soy candle",
    description:
      "A relaxing scented candle made from natural soy wax. Burns for about 45 hours with a calming fragrance. Perfect for your living room or as a gift.",
    runGemini: true,
    expect: {
      grade: "D",
      rules: [
        { rule: "titleLength",        status: "fail"    }, // 18 chars < 20
        { rule: "keywordInTitle",     status: "fail"    }, // "lavender" absent
        { rule: "keywordInDescription", status: "fail"  }, // "lavender soy candle" absent
        { rule: "descriptionLength",  status: "fail"    }, // ~146 chars < 150
        { rule: "structure",          status: "skipped" }, // desc < 300
        { rule: "readability",        status: "skipped" }, // desc < 150
        { rule: "keywordStuffing",    status: "pass"    },
      ],
    },
  },

  // ── CAS 5 ──────────────────────────────────────────────────────────────────
  {
    id: "earbuds",
    label: "CAS 5 — earbuds (single-sentence wall of text — readability stress test)",
    title: "Wireless Earbuds",
    keyword: "wireless earbuds",
    description:
      "These wireless earbuds are honestly the kind of product that you will want to use every single day because they combine a really long battery life with a very comfortable fit and a sound quality that works well for music podcasts calls and gaming all at once without ever needing to be adjusted or recharged constantly throughout the day which is something that a lot of other earbuds simply cannot offer to their customers in the same way.",
    runGemini: false,
    expect: {
      scoreMin: 45,
      scoreMax: 70,
      rules: [
        { rule: "titleLength",        status: "fail" },
        { rule: "keywordInTitle",     status: "pass" },
        { rule: "keywordInDescription", status: "pass" },
        { rule: "descriptionLength",  status: "pass" },
        { rule: "structure",          status: "warn" }, // no bullets, desc > 300
        { rule: "keywordStuffing",    status: "pass" },
        { rule: "readability",        status: "fail" }, // expected FAIL — will expose bug if SKIPPED
      ],
    },
  },

  // ── CAS 6 ──────────────────────────────────────────────────────────────────
  {
    id: "perfect",
    label: "CAS 6 — perfect (ideal listing — all rules pass, score = 100)",
    title: "Insulated Water Bottle 750ml – Cold 24h, Hot 12h, Leakproof",
    keyword: "insulated water bottle",
    description: `Stay hydrated all day with a flask designed for busy mornings, long workouts, and weekend adventures. This insulated water bottle uses double-wall vacuum technology, so your drink stays exactly how you poured it. Fill it with iced coffee before the gym, or hot tea before a hike, and forget about it for hours.
• Keeps cold drinks chilled for up to 24 hours
• Keeps hot drinks warm for up to 12 hours
• Leakproof lid, so nothing spills inside your bag
• Premium 18/8 stainless steel, completely BPA-free
• Sweat-free exterior with a soft, non-slip grip
• 750ml size that still fits most car cup holders
The wide opening makes it easy to drop in ice cubes and to clean by hand. A slim profile slides into side pockets and backpack sleeves without any trouble. It comes in five colors, so you can match it to your gear and your mood.
We stand behind the build with a lifetime guarantee. If anything goes wrong, we replace it, no questions asked. Order today and feel the difference on your very first morning.`,
    runGemini: false,
    expect: {
      scoreMin: 100,
      scoreMax: 100,
      grade: "A",
      rules: [
        { rule: "titleLength",        status: "pass" },
        { rule: "keywordInTitle",     status: "pass" },
        { rule: "keywordInDescription", status: "pass" },
        { rule: "descriptionLength",  status: "pass" },
        { rule: "structure",          status: "pass" },
        { rule: "keywordStuffing",    status: "pass" },
        { rule: "readability",        status: "pass" },
      ],
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function callGeminiWithRetry(
  title: string,
  description: string,
  keyword: string,
  maxRetries = 2
): Promise<KeywordGaps> {
  let result = await generateKeywordGaps(title, description, keyword);
  let attempt = 0;
  while (result.error?.toLowerCase().includes("rate limit") && attempt < maxRetries) {
    attempt++;
    console.log(`\n    ⏳ Rate limit — waiting 60 s (retry ${attempt}/${maxRetries})…`);
    await sleep(60_000);
    result = await generateKeywordGaps(title, description, keyword);
  }
  return result;
}

function findIssue(issues: Issue[], rule: string): Issue | undefined {
  return issues.find((i) => i.rule === rule);
}

// ── Evaluate one test case ────────────────────────────────────────────────────
function evaluate(
  tc: TestCase,
  score: number,
  grade: string,
  issues: Issue[]
): { verdict: Verdict; discrepancies: string[] } {
  const discrepancies: string[] = [];
  let critical = false;

  // Score range checks
  if (tc.expect.scoreMax !== undefined && score > tc.expect.scoreMax) {
    discrepancies.push(
      `Score ${score} > expected max ${tc.expect.scoreMax}`
    );
    // Only critical if it's the "perfect" case expecting exactly 100
    if (tc.expect.scoreMin === 100) critical = true;
  }
  if (tc.expect.scoreMin !== undefined && score < tc.expect.scoreMin) {
    discrepancies.push(`Score ${score} < expected min ${tc.expect.scoreMin}`);
    critical = true;
  }

  // Grade check
  if (tc.expect.grade && grade !== tc.expect.grade) {
    discrepancies.push(`Grade "${grade}" ≠ expected "${tc.expect.grade}"`);
    critical = true;
  }

  // Rule-by-rule checks
  for (const exp of tc.expect.rules) {
    const actual = findIssue(issues, exp.rule);
    const actualStatus = actual ? actual.status : "skipped";

    if (actualStatus === exp.status) continue; // match — no discrepancy

    discrepancies.push(
      `Rule "${exp.rule}": expected ${exp.status.toUpperCase()}, got ${actualStatus.toUpperCase()}`
    );

    // Critical conditions
    if (
      exp.rule === "keywordStuffing" || // stuffing must always be right
      (exp.status === "fail" && actualStatus === "pass") || // should fail but passed
      (exp.status === "pass" && actualStatus === "fail")    // should pass but failed
    ) {
      critical = true;
    }
  }

  const verdict: Verdict =
    discrepancies.length === 0 ? "✅" : critical ? "❌" : "⚠️";
  return { verdict, discrepancies };
}

// ── Report generation ─────────────────────────────────────────────────────────
function fmtGaps(gaps: KeywordGaps | null, runGemini: boolean): string {
  if (!runGemini) return "_not run for this case_";
  if (!gaps) return "_not run_";
  if (gaps.skipped) return "_skipped (no GEMINI_API_KEY)_";
  if (gaps.error) return `_error: ${gaps.error}_`;
  if (!gaps.suggestedKeywords.length) return "_none returned_";
  return gaps.suggestedKeywords
    .map((k) => `  - \`${k.keyword}\` — ${k.why}`)
    .join("\n");
}

function scoreExpLabel(tc: TestCase): string {
  const parts: string[] = [];
  if (tc.expect.scoreMin !== undefined && tc.expect.scoreMax !== undefined) {
    parts.push(
      tc.expect.scoreMin === tc.expect.scoreMax
        ? `= ${tc.expect.scoreMin}`
        : `${tc.expect.scoreMin}–${tc.expect.scoreMax}`
    );
  } else if (tc.expect.scoreMax !== undefined) {
    parts.push(`< ${tc.expect.scoreMax}`);
  } else if (tc.expect.scoreMin !== undefined) {
    parts.push(`≥ ${tc.expect.scoreMin}`);
  }
  if (tc.expect.grade) parts.push(`grade ${tc.expect.grade}`);
  return parts.join(", ") || "—";
}

function generateReport(
  results: TestResult[],
  hasKey: boolean,
  model: string
): string {
  const date = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const passCount = results.filter((r) => r.verdict === "✅").length;
  const warnCount = results.filter((r) => r.verdict === "⚠️").length;
  const failCount = results.filter((r) => r.verdict === "❌").length;

  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(`# ListingGenie — Automated Test Report`);
  lines.push(``);
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| **Date** | ${date} |`);
  lines.push(`| **Gemini model** | \`${model}\` |`);
  lines.push(`| **API key** | ${hasKey ? "present ✅" : "absent — keyword gaps skipped ⚠️"} |`);
  lines.push(``);

  // ── Summary ───────────────────────────────────────────────────────────────
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`**${passCount}/6 cases conform** — ${warnCount} ⚠️ minor discrepancy, ${failCount} ❌ failure`);
  lines.push(``);
  lines.push(`| # | Case | Score | Grade | Expected | Verdict |`);
  lines.push(`|--:|------|------:|:-----:|----------|:-------:|`);
  for (const [idx, r] of results.entries()) {
    lines.push(
      `| ${idx + 1} | \`${r.tc.id}\` | ${r.score} | ${r.grade} | ${scoreExpLabel(r.tc)} | ${r.verdict} |`
    );
  }
  lines.push(``);

  // ── Detailed results ──────────────────────────────────────────────────────
  lines.push(`## Detailed Results`);
  lines.push(``);

  for (const r of results) {
    lines.push(`### ${r.tc.label}`);
    lines.push(``);
    lines.push(`**Score:** ${r.score}/100 &nbsp; **Grade:** ${r.grade} &nbsp; **Verdict:** ${r.verdict}`);
    lines.push(``);

    // Rule comparison table
    lines.push(`| Rule | Expected | Actual | Pts | Match |`);
    lines.push(`|------|:--------:|:------:|----:|:-----:|`);
    for (const exp of r.tc.expect.rules) {
      const actual = findIssue(r.issues, exp.rule);
      const actualStatus = actual ? actual.status : "skipped";
      const pts = actual ? String(actual.points) : "—";
      const match = actualStatus === exp.status ? "✅" : "⚠️";
      lines.push(
        `| \`${exp.rule}\` | ${exp.status} | ${actualStatus} | ${pts} | ${match} |`
      );
    }
    lines.push(``);

    // All issues returned (full picture, including rules not in expectations)
    lines.push(`<details><summary>All issues from engine</summary>`);
    lines.push(``);
    for (const issue of r.issues) {
      const icon = issue.status === "pass" ? "✓" : issue.status === "warn" ? "⚠" : "✗";
      lines.push(
        `- ${icon} \`${issue.rule}\` **(${issue.status}, ${issue.points} pts)** — ${issue.message}`
      );
      if (issue.fixTip) lines.push(`  > *${issue.fixTip}*`);
    }
    lines.push(``);
    lines.push(`</details>`);
    lines.push(``);

    // Gemini keywords (only for cases with runGemini: true)
    if (r.tc.runGemini) {
      lines.push(`**Missing Keywords (Gemini):**`);
      lines.push(``);
      const gapText = fmtGaps(r.gaps, r.tc.runGemini);
      lines.push(gapText);
      if (r.gaps && r.gaps.mainKeywordHasVolume === false) {
        lines.push(``);
        lines.push(`> ⚠️ \`mainKeywordHasVolume: false\` — Gemini reports low search volume for this keyword.`);
      }
      lines.push(``);
    }

    // Discrepancies for this case
    if (r.discrepancies.length > 0) {
      lines.push(`**Discrepancies:**`);
      lines.push(``);
      for (const d of r.discrepancies) lines.push(`- ❗ ${d}`);
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(``);
  }

  // ── Regressions / écarts ──────────────────────────────────────────────────
  lines.push(`## Regressions / Écarts`);
  lines.push(``);
  const allDiscrepancies = results.flatMap((r) =>
    r.discrepancies.map((d) => `**\`${r.tc.id}\`** — ${d}`)
  );
  if (allDiscrepancies.length === 0) {
    lines.push(`✅ No discrepancies — all expected behaviors match exactly.`);
  } else {
    for (const d of allDiscrepancies) lines.push(`- ${d}`);
  }
  lines.push(``);

  // ── Recommendations ───────────────────────────────────────────────────────
  lines.push(`## Recommendations`);
  lines.push(``);

  const recs: string[] = [];

  // Check CAS 5 readability bug
  const cas5 = results.find((r) => r.tc.id === "earbuds");
  const cas5ReadDisc = cas5?.discrepancies.find((d) =>
    d.includes("readability")
  );
  if (cas5ReadDisc) {
    recs.push(
      `**Fix \`minSentences\` guard in \`ruleReadability()\`** (\`lib/auditRules.ts\`): ` +
      `CAS 5 has a 440-char, ~90-word description that is a single run-on sentence. ` +
      `The \`minSentences < 3\` guard silently skips it (returns \`null\`) instead of firing FAIL. ` +
      `**Fix:** remove the \`minSentences\` guard — the \`minDescriptionLength\` guard already protects against very short texts. ` +
      `A description long enough to pass the length check should always be evaluated for readability.`
    );
  }

  // Check CAS 3 score calibration
  const cas3 = results.find((r) => r.tc.id === "stuffed");
  if (cas3 && cas3.score > 60) {
    recs.push(
      `**Re-calibrate stuffing penalty** (\`CONFIG.keywordStuffing.points\` in \`lib/auditRules.ts\`): ` +
      `CAS 3 (heavy stuffing ×9) scores ${cas3.score}/100 (grade ${cas3.grade}) because keyword-presence and readability rules ` +
      `compensate. Consider: (a) penalising stuffing with negative points or (b) capping the final score at 55 ` +
      `when \`keywordStuffing.status === "fail"\`. Target: a stuffed listing should never exceed grade C.`
    );
  }

  // Check CAS 6 perfect score
  const cas6 = results.find((r) => r.tc.id === "perfect");
  if (cas6 && cas6.score !== 100) {
    const failedRules = cas6.issues
      .filter((i) => i.status !== "pass")
      .map((i) => `\`${i.rule}\` (${i.status}, ${i.points} pts)`);
    recs.push(
      `**Investigate CAS 6 score (${cas6.score} ≠ 100)** — the "perfect" listing should score 100. ` +
      `Rules that cost points: ${failedRules.join(", ") || "none identified — check normalization logic"}.`
    );
  }

  if (recs.length === 0) {
    recs.push(
      `All critical paths pass. Consider extending the suite with boundary cases: ` +
      `empty title, 2001-char description (above ideal max), keyword density exactly at 3%, ` +
      `and a description with exactly 3 line-breaks but no bullet characters.`
    );
  }

  for (const [i, rec] of recs.entries()) {
    lines.push(`${i + 1}. ${rec}`);
    lines.push(``);
  }

  return lines.join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const hasKey =
    !!process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

  console.log("\n🧞  ListingGenie — Automated Audit Test Suite");
  console.log(`    Date  : ${new Date().toISOString()}`);
  console.log(`    Key   : ${hasKey ? "present ✅" : "absent — keyword gaps skipped"}`);
  console.log(`    Model : ${model}\n`);

  const results: TestResult[] = [];
  let geminiCallIdx = 0;

  for (const [i, tc] of CASES.entries()) {
    process.stdout.write(`  [${i + 1}/6] ${tc.id.padEnd(15)}`);

    // On-page audit (synchronous, no external calls)
    const { score, issues } = runOnPageAudit(tc.title, tc.description, tc.keyword);
    const grade = computeGrade(score);

    // Gemini keyword gaps (throttled: 2.5 s between calls)
    let gaps: KeywordGaps | null = null;
    if (tc.runGemini) {
      if (geminiCallIdx > 0) await sleep(4000);
      process.stdout.write("[Gemini…] ");
      gaps = hasKey
        ? await callGeminiWithRetry(tc.title, tc.description, tc.keyword)
        : { suggestedKeywords: [], skipped: true };
      geminiCallIdx++;
    }

    const { verdict, discrepancies } = evaluate(tc, score, grade, issues);
    console.log(`score=${score}  grade=${grade}  ${verdict}`);

    for (const d of discrepancies) {
      console.log(`           ⤷ ${d}`);
    }

    results.push({ tc, score, grade, issues, gaps, verdict, discrepancies });
  }

  // ── Write report ────────────────────────────────────────────────────────
  const reportPath = join(process.cwd(), "TEST_REPORT.md");
  const report = generateReport(results, hasKey, model);
  writeFileSync(reportPath, report, "utf-8");

  const passCount = results.filter((r) => r.verdict === "✅").length;
  const warnCount = results.filter((r) => r.verdict === "⚠️").length;
  const failCount = results.filter((r) => r.verdict === "❌").length;

  console.log(`\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(
    `  ${passCount} ✅  ${warnCount} ⚠️  ${failCount} ❌   (${passCount}/6 conform)`
  );
  console.log(`  Report → TEST_REPORT.md`);
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
