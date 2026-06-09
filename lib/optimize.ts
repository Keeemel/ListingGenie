import { Platform, Issue } from "@/types/audit";

export interface GeminiOptimizeResult {
  optimizedTitle: string;
  optimizedDescription: string;
}

export async function generateOptimizedListing(
  title: string,
  description: string,
  platform: Platform,
  issues: Issue[],
): Promise<GeminiOptimizeResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const platformName =
    platform === "other"
      ? "a general e-commerce store"
      : platform.charAt(0).toUpperCase() + platform.slice(1);

  const actionable = issues
    .filter((i) => i.status !== "pass")
    .map((i) => `- ${i.message}. How to fix: ${i.fixTip}`)
    .join("\n");

  const prompt = `You are an expert ${platformName} listing copywriter. Rewrite the title and description to fix all audit issues below.

Platform: ${platformName}
Current title: "${title}"
Current description: "${description}"

Audit issues to fix:
${actionable || "- No critical issues found. Improve clarity, persuasiveness, and keyword density."}

Rules:
- Keep all factual product details (materials, dimensions, specs) intact
- Fix every issue listed above
- Be specific and compelling — no generic filler
- Do not add false claims or invented specifications
- Return ONLY valid JSON with no markdown fences: {"optimizedTitle":"...","optimizedDescription":"..."}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned no content");

  const clean = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(clean) as {
    optimizedTitle?: string;
    optimizedDescription?: string;
  };
  if (!parsed.optimizedTitle || !parsed.optimizedDescription) {
    throw new Error("Gemini response missing fields");
  }
  return {
    optimizedTitle: parsed.optimizedTitle,
    optimizedDescription: parsed.optimizedDescription,
  };
}
