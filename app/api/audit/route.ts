import { NextRequest, NextResponse } from "next/server";
import { runOnPageAudit, computeGrade } from "@/lib/auditRules";
import { generateKeywordGaps } from "@/lib/keywordGaps";
import { heuristicValidate } from "@/lib/validateInput";
import { AuditRequest, AuditResult, AuditResponse, Platform } from "@/types/audit";

const VALID_PLATFORMS = new Set<Platform>(["amazon", "ebay", "etsy", "shopify", "vinted", "other"]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: AuditRequest;
  try {
    body = (await req.json()) as AuditRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title       = (body.title       ?? "").trim();
  const description = (body.description ?? "").trim();
  const mainKeyword = (body.mainKeyword  ?? "").trim();
  const platform: Platform = VALID_PLATFORMS.has(body.platform as Platform)
    ? (body.platform as Platform)
    : "other";

  // ── Level 1: free heuristic — rejects obvious garbage immediately ───────────
  const heuristic = heuristicValidate(title, description);
  if (!heuristic.valid) {
    return NextResponse.json({
      invalid: true,
      reason: heuristic.reason ?? "This does not appear to be a product listing.",
    } as AuditResponse);
  }

  // ── On-page audit (synchronous) ─────────────────────────────────────────────
  const { score, issues, platformTips } = runOnPageAudit(title, description, mainKeyword, platform);
  const grade = computeGrade(score);

  // ── Gemini (also returns isProductListing validation signal) ────────────────
  const keywordGaps = await generateKeywordGaps(title, description, mainKeyword, platform);

  // ── Level 2: AI validation — only block when Gemini is explicit ─────────────
  // Never block when Gemini was skipped (no key) or errored — avoid false positives.
  if (keywordGaps.isProductListing === false && !keywordGaps.skipped && !keywordGaps.error) {
    return NextResponse.json({
      invalid: true,
      reason: keywordGaps.listingReason ?? "This does not appear to be a product listing.",
    } as AuditResponse);
  }

  const result: AuditResult = { score, grade, issues, keywordGaps, platform, platformTips };
  return NextResponse.json(result);
}
