import { NextRequest, NextResponse } from "next/server";
import { runOnPageAudit, computeGrade } from "@/lib/auditRules";
import { generateKeywordGaps } from "@/lib/keywordGaps";
import { AuditRequest, AuditResult } from "@/types/audit";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: AuditRequest;

  try {
    body = (await req.json()) as AuditRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const mainKeyword = (body.mainKeyword ?? "").trim();

  // Part A: rule-based on-page audit (no external API)
  const { score, issues } = runOnPageAudit(title, description, mainKeyword);
  const grade = computeGrade(score);

  // Part B: keyword gaps via LLM (graceful fallback if key is absent)
  const keywordGaps = await generateKeywordGaps(title, description, mainKeyword);

  const result: AuditResult = { score, grade, issues, keywordGaps };
  return NextResponse.json(result);
}
