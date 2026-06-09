import { KeywordGaps, Platform, SuggestedKeyword } from "@/types/audit";

// ============================================================
// Shared validation instruction injected into every prompt
// ============================================================
const VALIDATION_FIELDS = `"isProductListing": true,
  "reason": ""`;

const VALIDATION_RULES = `- isProductListing: true if this text describes a real product for sale — be very lenient, set false ONLY for clear nonsense, random characters, or test inputs (e.g. "asdf", "caca", "test test")
- reason: one-sentence explanation ONLY when isProductListing is false, otherwise empty string`;

// ============================================================
// Platform-aware prompt factory
// ============================================================
function buildPrompt(title: string, description: string, keyword: string, platform: Platform): string {
  const base = `You are an e-commerce SEO expert specializing in ${platform === "other" ? "general e-commerce" : platform.charAt(0).toUpperCase() + platform.slice(1)} listings.

Product Title: ${title}
Main Keyword: ${keyword || "not specified"}
Platform: ${platform}
Product Description: ${description}`;

  const platformInstructions: Record<Platform, string> = {
    amazon: `Return ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  ${VALIDATION_FIELDS},
  "mainKeywordHasVolume": true,
  "suggestedKeywords": [
    { "keyword": "buyer search phrase", "why": "why shoppers search this on Amazon" }
  ],
  "backendTerms": ["term1", "term2", "term3", "term4", "term5"]
}

Rules:
- ${VALIDATION_RULES}
- mainKeywordHasVolume: true if keyword has meaningful Amazon search volume
- suggestedKeywords: exactly 5 high purchase-intent phrases NOT already in title or description
- backendTerms: 5–8 backend search terms (single words or short phrases) buyers use but that don't fit naturally in the visible listing — these go in Seller Central's keyword field
- Each "why" must be one short sentence explaining Amazon buyer intent`,

    ebay: `Return ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  ${VALIDATION_FIELDS},
  "mainKeywordHasVolume": true,
  "suggestedKeywords": [
    { "keyword": "buyer search phrase", "why": "why shoppers search this on eBay" }
  ]
}

Rules:
- ${VALIDATION_RULES}
- mainKeywordHasVolume: true if keyword has meaningful eBay search volume
- suggestedKeywords: exactly 5 keyword-rich title phrases and item-specific terms (brand, model, size, color) buyers search on eBay that are NOT already in the listing
- Prioritize terms that also work as eBay Item Specifics
- Each "why" must be one short sentence`,

    etsy: `Return ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  ${VALIDATION_FIELDS},
  "mainKeywordHasVolume": true,
  "suggestedKeywords": [
    { "keyword": "buyer search phrase", "why": "why shoppers search this on Etsy" }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Rules:
- ${VALIDATION_RULES}
- mainKeywordHasVolume: true if keyword has meaningful Etsy search volume
- suggestedKeywords: exactly 5 long-tail, buyer-intent phrases NOT in the listing (e.g. "personalized leather wallet gift for him")
- tags: exactly 13 Etsy tags — each MUST be 20 characters or fewer, specific, and cover materials/occasions/recipients/styles that match this product
- Each "why" must be one short sentence`,

    shopify: `Return ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  ${VALIDATION_FIELDS},
  "mainKeywordHasVolume": true,
  "suggestedKeywords": [
    { "keyword": "search phrase", "why": "why shoppers search this on Google/Shopify" }
  ]
}

Rules:
- ${VALIDATION_RULES}
- mainKeywordHasVolume: true if keyword has meaningful Google/e-commerce search volume
- suggestedKeywords: exactly 5 Google-friendly search phrases (long-tail, buyer-intent) NOT in the listing
- Focus on phrases that work for both Google SEO and in-site search
- Each "why" must be one short sentence`,

    vinted: `Return ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  ${VALIDATION_FIELDS},
  "mainKeywordHasVolume": true,
  "suggestedKeywords": [
    { "keyword": "search phrase", "why": "why Vinted buyers search this" }
  ]
}

Rules:
- ${VALIDATION_RULES}
- mainKeywordHasVolume: true if keyword reflects what Vinted buyers actually search
- suggestedKeywords: exactly 5 simple, buyer-intent phrases (brand+size+color combos, style names) Vinted shoppers actually type
- Keep phrases short and natural — Vinted search is simple, not Google SEO
- Each "why" must be one short sentence`,

    other: `Return ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  ${VALIDATION_FIELDS},
  "mainKeywordHasVolume": true,
  "suggestedKeywords": [
    { "keyword": "buyer search phrase", "why": "why shoppers search this" }
  ]
}

Rules:
- ${VALIDATION_RULES}
- mainKeywordHasVolume: true if keyword has meaningful search volume
- suggestedKeywords: exactly 5 specific, high purchase-intent phrases NOT in title or description
- Each "why" must be one short sentence explaining buyer intent`,
  };

  return `${base}\n\n${platformInstructions[platform]}`;
}

// ============================================================
// JSON parser — handles raw JSON, fences, and partial wrapping
// ============================================================
function parseGapsJson(raw: string, platform: Platform): KeywordGaps {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = fenceMatch ? fenceMatch[1].trim() : raw.trim();

  if (!candidate.startsWith("{")) {
    const objMatch = candidate.match(/\{[\s\S]*\}/);
    if (objMatch) candidate = objMatch[0];
  }

  try {
    const parsed: unknown = JSON.parse(candidate);
    if (typeof parsed !== "object" || parsed === null)
      throw new Error("parsed value is not an object");

    const obj = parsed as Record<string, unknown>;

    const suggestedKeywords: SuggestedKeyword[] = Array.isArray(obj.suggestedKeywords)
      ? (obj.suggestedKeywords as unknown[])
          .slice(0, 5)
          .map((k) => {
            const item = k as Record<string, unknown>;
            return { keyword: String(item.keyword ?? ""), why: String(item.why ?? "") };
          })
          .filter((k) => k.keyword.length > 0)
      : [];

    const result: KeywordGaps = {
      mainKeywordHasVolume: Boolean(obj.mainKeywordHasVolume),
      suggestedKeywords,
    };

    // Gemini validation signal
    if (typeof obj.isProductListing === "boolean") {
      result.isProductListing = obj.isProductListing;
    }
    if (typeof obj.reason === "string" && obj.reason.trim().length > 0) {
      result.listingReason = obj.reason.trim();
    }

    // Etsy: parse tags (≤ 13, each ≤ 20 chars)
    if (platform === "etsy" && Array.isArray(obj.tags)) {
      result.tags = (obj.tags as unknown[])
        .map((t) => String(t).trim())
        .filter((t) => t.length > 0 && t.length <= 20)
        .slice(0, 13);
    }

    // Amazon: parse backend search terms
    if (platform === "amazon" && Array.isArray(obj.backendTerms)) {
      result.backendTerms = (obj.backendTerms as unknown[])
        .map((t) => String(t).trim())
        .filter((t) => t.length > 0)
        .slice(0, 10);
    }

    return result;
  } catch (err) {
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
// Gemini provider
// ============================================================
async function callGemini(
  title: string,
  description: string,
  keyword: string,
  apiKey: string,
  platform: Platform
): Promise<KeywordGaps> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(title, description, keyword, platform) }] }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) {
      throw new Error(`Gemini rate limit reached (429). Wait ~1 minute and try again. Free tier: 30 req/min.`);
    }
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    promptFeedback?: { blockReason?: string };
  };

  const candidate = data.candidates?.[0];
  if (!candidate) {
    const blockReason = data.promptFeedback?.blockReason ?? "unknown";
    throw new Error(`Gemini returned no candidates. blockReason: ${blockReason}`);
  }

  const text = candidate.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error(`Gemini candidate has no text. finishReason: ${candidate.finishReason ?? "unknown"}`);

  return parseGapsJson(text, platform);
}

// ============================================================
// Public interface
// ============================================================
export async function generateKeywordGaps(
  title: string,
  description: string,
  mainKeyword: string,
  platform: Platform = "other"
): Promise<KeywordGaps> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return { suggestedKeywords: [], skipped: true };
  }

  try {
    return await callGemini(title, description, mainKeyword, apiKey, platform);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[keywordGaps] LLM call failed:", message);
    const userMessage = message.startsWith("Gemini rate limit")
      ? "Rate limit reached — wait ~1 minute and audit again. (Free tier: 30 req/min)"
      : "Keyword suggestions unavailable — check GEMINI_API_KEY or server logs.";
    return { suggestedKeywords: [], error: userMessage };
  }
}
