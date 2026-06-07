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
// JSON parser — handles raw JSON and ```json fences
// ============================================================
function parseGapsJson(raw: string): KeywordGaps {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (typeof parsed !== "object" || parsed === null) throw new Error("not object");

    const obj = parsed as Record<string, unknown>;

    const suggestedKeywords: SuggestedKeyword[] = Array.isArray(obj.suggestedKeywords)
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
  } catch {
    return { suggestedKeywords: [], error: "Could not parse LLM response." };
  }
}

// ============================================================
// Gemini provider (free tier)
// ============================================================
async function callGemini(
  title: string,
  description: string,
  keyword: string,
  apiKey: string
): Promise<KeywordGaps> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(title, description, keyword) }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
    return { suggestedKeywords: [], error: "Keyword suggestions unavailable. Check your GEMINI_API_KEY." };
  }
}
