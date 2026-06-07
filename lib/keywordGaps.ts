import { KeywordGaps, SuggestedKeyword } from "@/types/audit";

// ============================================================
// Prompt factory — shared across providers
// ============================================================
function buildPrompt(title: string, description: string, keyword: string): string {
  return `You are an e-commerce SEO expert. Analyze this product listing and find keyword gaps.

Product Title: ${title}
Main Keyword: ${keyword || "not specified"}
Product Description: ${description}

Return ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  "mainKeywordHasVolume": true,
  "suggestedKeywords": [
    { "keyword": "example buyer phrase", "why": "why shoppers search this" }
  ]
}

Rules:
- mainKeywordHasVolume: true if the main keyword has meaningful search volume, false if it is too generic or too niche
- suggestedKeywords: exactly 5 specific, high purchase-intent phrases that real shoppers type and are NOT already in the title or description
- Each "why" must be one short sentence explaining the buyer intent`;
}

// ============================================================
// JSON parser — handles raw JSON, ```json fences, and partial wrapping
// ============================================================
function parseGapsJson(raw: string): KeywordGaps {
  // Strategy 1: extract content from ```json ... ``` or ``` ... ``` (multiline)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = fenceMatch ? fenceMatch[1].trim() : raw.trim();

  // Strategy 2: if candidate doesn't start with {, find the first JSON object
  if (!candidate.startsWith("{")) {
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    if (objectMatch) candidate = objectMatch[0];
  }

  try {
    const parsed: unknown = JSON.parse(candidate);
    if (typeof parsed !== "object" || parsed === null)
      throw new Error("parsed value is not an object");

    const obj = parsed as Record<string, unknown>;

    const suggestedKeywords: SuggestedKeyword[] = Array.isArray(
      obj.suggestedKeywords
    )
      ? (obj.suggestedKeywords as unknown[])
          .slice(0, 5)
          .map((k) => {
            const item = k as Record<string, unknown>;
            return {
              keyword: String(item.keyword ?? ""),
              why: String(item.why ?? ""),
            };
          })
          .filter((k) => k.keyword.length > 0)
      : [];

    return {
      mainKeywordHasVolume: Boolean(obj.mainKeywordHasVolume),
      suggestedKeywords,
    };
  } catch (err) {
    // Bug 6 fix: log the raw response so the operator can diagnose parse failures
    console.error(
      "[keywordGaps] JSON parse failed:",
      err instanceof Error ? err.message : String(err),
      "\nRaw response (first 600 chars):",
      raw.slice(0, 600)
    );
    return { suggestedKeywords: [], error: "Could not parse LLM response." };
  }
}

// ============================================================
// Gemini provider (free tier — gemini-1.5-flash)
// ============================================================
async function callGemini(
  title: string,
  description: string,
  keyword: string,
  apiKey: string
): Promise<KeywordGaps> {
  // gemini-2.0-flash-lite is the current free-tier model (gemini-1.5-flash was removed from v1beta)
  // Override via GEMINI_MODEL env var if needed (e.g. gemini-2.0-flash)
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // 10-second hard timeout to avoid hanging requests
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(title, description, keyword) }] }],
      generationConfig: {
        temperature: 0.3,
        // Instructs Gemini to return JSON directly (no fences); our parser handles
        // fences as a fallback in case an older API version ignores this field.
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) {
      throw new Error(
        `Gemini rate limit reached (429). Wait ~1 minute and try again. Free tier: 30 req/min.`
      );
    }
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  // Log the full candidate finish reason to diagnose safety-block / empty responses
  const candidate = data.candidates?.[0];
  if (!candidate) {
    const blockReason = data.promptFeedback?.blockReason ?? "unknown";
    throw new Error(`Gemini returned no candidates. blockReason: ${blockReason}`);
  }

  const text = candidate.content?.parts?.[0]?.text ?? "";
  if (!text) {
    throw new Error(
      `Gemini candidate has no text. finishReason: ${candidate.finishReason ?? "unknown"}`
    );
  }

  return parseGapsJson(text);
}

// ============================================================
// Public interface — swap provider here without touching callers
// ============================================================
export async function generateKeywordGaps(
  title: string,
  description: string,
  mainKeyword: string
): Promise<KeywordGaps> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return { suggestedKeywords: [], skipped: true };
  }

  try {
    return await callGemini(title, description, mainKeyword, apiKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[keywordGaps] LLM call failed:", message);
    // Surface rate-limit message to the UI so the user knows to wait
    const userMessage = message.startsWith("Gemini rate limit")
      ? "Rate limit reached — wait ~1 minute and audit again. (Free tier: 30 req/min)"
      : "Keyword suggestions unavailable — check GEMINI_API_KEY or server logs.";
    return { suggestedKeywords: [], error: userMessage };
  }
}
