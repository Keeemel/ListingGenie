import { Grade, Issue } from "@/types/audit";

// Common English stop-words excluded from single-word repetition checks
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "for", "nor", "so", "yet",
  "of", "in", "on", "at", "to", "by", "up", "as", "is", "it", "its",
  "be", "am", "are", "was", "were", "been", "being", "do", "does",
  "did", "will", "would", "shall", "should", "may", "might", "can",
  "could", "this", "that", "these", "those", "with", "from", "into",
  "than", "then", "when", "also", "not", "you", "your", "we", "our",
  "they", "their", "have", "has", "had", "all", "more", "use", "make",
  "very", "just", "any", "each", "both", "such", "only", "other",
]);

// ============================================================
// CONFIG — all weights and thresholds in one place
// ============================================================
export const CONFIG = {
  titleLength: {
    ideal: { min: 40, max: 70 },
    acceptable: { min: 20, max: 80 },
    points: { pass: 20, warn: 10, fail: 0 },
  },
  keywordInTitle: {
    points: { pass: 15, fail: 0 },
  },
  keywordInDescription: {
    points: { pass: 10, fail: 0 },
  },
  descriptionLength: {
    ideal: { min: 300, max: 2000 },
    acceptable: { min: 150 },
    points: { pass: 20, warn: 10, fail: 0 },
  },
  structure: {
    minDescriptionLength: 300, // rule is skipped below this threshold
    minLineBreaks: 3,
    points: { pass: 15, warn: 0 }, // increased from 10
  },
  keywordStuffing: {
    maxKeywordOccurrences: 4,      // exact keyword phrase occurrences in title+desc combined
    maxKeywordDensityPercent: 3,   // keyword token density % in title+desc combined
    maxWordRepetitions: 6,         // max times any single non-stop word may repeat
    minWordLength: 4,
    points: { pass: 15, fail: 0 },
  },
  readability: {
    minDescriptionLength: 150, // rule is skipped below this character count
    minSentences: 3,           // rule is skipped below this sentence count
    warnThreshold: 30,         // avg words/sentence → warn
    failThreshold: 50,         // avg words/sentence → fail (harder penalty)
    points: { pass: 15, warn: 5, fail: 0 }, // increased from 10; added fail tier
  },
} as const;

export function computeGrade(score: number): Grade {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

// ============================================================
// Individual rule implementations
// ============================================================

function ruleMissingFields(title: string, description: string): Issue[] {
  const issues: Issue[] = [];
  if (!title.trim()) {
    issues.push({
      rule: "emptyTitle",
      status: "fail",
      message: "Product title is missing.",
      fixTip: "Add a descriptive title of at least 40 characters.",
      points: 0,
    });
  }
  if (!description.trim()) {
    issues.push({
      rule: "emptyDescription",
      status: "fail",
      message: "Product description is missing.",
      fixTip:
        "Write at least 300 characters covering features, materials, dimensions, and use cases.",
      points: 0,
    });
  }
  return issues;
}

function ruleTitleLength(title: string): Issue {
  const len = title.trim().length;
  const { ideal, acceptable, points } = CONFIG.titleLength;

  if (len >= ideal.min && len <= ideal.max) {
    return {
      rule: "titleLength",
      status: "pass",
      message: `Title length is ideal (${len} chars).`,
      fixTip: "",
      points: points.pass,
    };
  }
  if (len >= acceptable.min && len <= acceptable.max) {
    return {
      rule: "titleLength",
      status: "warn",
      message: `Title length is acceptable but not optimal (${len} chars).`,
      fixTip: `Aim for ${ideal.min}–${ideal.max} characters for best visibility in search results.`,
      points: points.warn,
    };
  }
  return {
    rule: "titleLength",
    status: "fail",
    message:
      len < acceptable.min
        ? `Title is too short (${len} chars) — search engines may skip it.`
        : `Title is too long (${len} chars) and will be truncated in search results.`,
    fixTip: `Keep your title between ${ideal.min} and ${ideal.max} characters.`,
    points: points.fail,
  };
}

function ruleKeywordInTitle(title: string, keyword: string): Issue | null {
  if (!keyword.trim()) return null;
  const kw = keyword.toLowerCase().trim();
  const found = title.toLowerCase().includes(kw);
  return {
    rule: "keywordInTitle",
    status: found ? "pass" : "fail",
    message: found
      ? `Main keyword "${keyword}" is present in the title.`
      : `Main keyword "${keyword}" is missing from the title.`,
    fixTip: found
      ? ""
      : `Insert "${keyword}" near the beginning of your title for maximum SEO impact.`,
    points: found
      ? CONFIG.keywordInTitle.points.pass
      : CONFIG.keywordInTitle.points.fail,
  };
}

function ruleKeywordInDescription(
  description: string,
  keyword: string
): Issue | null {
  if (!keyword.trim()) return null;
  const kw = keyword.toLowerCase().trim();
  const found = description.toLowerCase().includes(kw);
  return {
    rule: "keywordInDescription",
    status: found ? "pass" : "fail",
    message: found
      ? `Main keyword "${keyword}" appears in the description.`
      : `Main keyword "${keyword}" is absent from the description.`,
    fixTip: found
      ? ""
      : `Use "${keyword}" naturally at least once in the opening paragraph.`,
    points: found
      ? CONFIG.keywordInDescription.points.pass
      : CONFIG.keywordInDescription.points.fail,
  };
}

function ruleDescriptionLength(description: string): Issue {
  const len = description.trim().length;
  const { ideal, acceptable, points } = CONFIG.descriptionLength;

  if (len >= ideal.min && len <= ideal.max) {
    return {
      rule: "descriptionLength",
      status: "pass",
      message: `Description length is ideal (${len} chars).`,
      fixTip: "",
      points: points.pass,
    };
  }
  if (len >= acceptable.min) {
    return {
      rule: "descriptionLength",
      status: "warn",
      message: `Description is a bit short (${len} chars).`,
      fixTip: `Expand to at least ${ideal.min} characters — cover features, benefits, dimensions, and use cases.`,
      points: points.warn,
    };
  }
  return {
    rule: "descriptionLength",
    status: "fail",
    message: `Description is too short (${len} chars) to rank well.`,
    fixTip: `Write at least ${ideal.min} characters. Address buyer questions: what is it, who is it for, why buy it?`,
    points: points.fail,
  };
}

// Bug 3 fix: skip rule when description is short (avoids false "wall of text" on thin copy)
function ruleStructure(description: string): Issue | null {
  if (description.trim().length < CONFIG.structure.minDescriptionLength) return null;

  const hasBullets = /^[ \t]*[•\-*]\s/m.test(description);
  const lineBreakCount = (description.match(/\n/g) ?? []).length;
  const hasStructure = hasBullets || lineBreakCount >= CONFIG.structure.minLineBreaks;

  return {
    rule: "structure",
    status: hasStructure ? "pass" : "warn",
    message: hasStructure
      ? "Description uses bullet points or clear paragraph breaks."
      : "Description reads as a wall of text with no visible structure.",
    fixTip: hasStructure
      ? ""
      : "Break content into bullet points (• or -) and short paragraphs to improve scannability.",
    points: hasStructure ? CONFIG.structure.points.pass : CONFIG.structure.points.warn,
  };
}

// Bug 1 fix: analyzes title+description combined; exact phrase occurrence count;
// stop-word-aware single-word repetition check.
function ruleKeywordStuffing(
  title: string,
  description: string,
  keyword: string
): Issue {
  const fullText = `${title} ${description}`;
  const fullLower = fullText.toLowerCase();
  const cfg = CONFIG.keywordStuffing;

  // (a & b) Exact keyword phrase with word-boundary match (avoids "test" hitting "testing")
  let keywordStuffed = false;
  let keywordCount = 0;

  if (keyword.trim()) {
    const kw = keyword.toLowerCase().trim();
    // Escape regex metacharacters, then anchor with word boundaries
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = fullText.match(regex);
    keywordCount = matches ? matches.length : 0;

    const totalWords = fullLower.split(/\s+/).filter(Boolean).length;
    // Density = phrase_occurrences / total_word_tokens (no kwWords multiplier —
    // a 4-word phrase appearing once in 100 words is 1%, not 4%)
    const density = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;

    keywordStuffed =
      keywordCount > cfg.maxKeywordOccurrences ||
      density > cfg.maxKeywordDensityPercent;
  }

  // (c) Any single non-stop word repeated too many times
  const tokens = fullLower.split(/\s+/).filter(Boolean);
  const freq: Record<string, number> = {};
  for (const raw of tokens) {
    const w = raw.replace(/[^a-z0-9]/g, "");
    if (w.length >= cfg.minWordLength && !STOP_WORDS.has(w)) {
      freq[w] = (freq[w] ?? 0) + 1;
    }
  }
  const topEntry = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  const wordStuffed = topEntry != null && topEntry[1] > cfg.maxWordRepetitions;

  const stuffed = keywordStuffed || wordStuffed;

  let message: string;
  if (!stuffed) {
    message = "No keyword stuffing detected.";
  } else if (keywordStuffed && keyword.trim()) {
    message = `Main keyword "${keyword}" appears ${keywordCount}× (limit: ${cfg.maxKeywordOccurrences}).`;
  } else if (wordStuffed && topEntry) {
    message = `"${topEntry[0]}" repeats ${topEntry[1]} times across title + description.`;
  } else {
    message = `Keyword density exceeds ${cfg.maxKeywordDensityPercent}% — over-optimized.`;
  }

  return {
    rule: "keywordStuffing",
    status: stuffed ? "fail" : "pass",
    message,
    fixTip: stuffed
      ? "Use synonyms and related phrases instead of repeating the same word. Natural copy ranks better."
      : "",
    points: stuffed ? cfg.points.fail : cfg.points.pass,
  };
}

// Bug 2 & 4 & 5 fix:
//   - Exclude bullet/list lines before computing avg sentence length
//   - Skip rule when description is too short or has too few sentences
//   - Graduated severity: warn (30–49 words/sentence) vs fail (50+ words/sentence)
function ruleReadability(description: string): Issue | null {
  const { minDescriptionLength, minSentences, warnThreshold, failThreshold, points } =
    CONFIG.readability;

  if (description.trim().length < minDescriptionLength) return null;

  // Strip bullet/list lines — they have no terminal punctuation and skew the avg
  const prose = description
    .split("\n")
    .filter((line) => !/^[ \t]*[•\-*]\s/.test(line))
    .join(" ");

  const sentences = prose
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length < minSentences) return null;

  const wordCount = prose.split(/\s+/).filter(Boolean).length;
  const avg = wordCount / sentences.length;

  if (avg >= failThreshold) {
    return {
      rule: "readability",
      status: "fail",
      message: `Average sentence is ${Math.round(avg)} words — extremely difficult to read.`,
      fixTip:
        "Break these long sentences aggressively. Use bullet points for lists. Target under 20 words per sentence.",
      points: points.fail,
    };
  }
  if (avg >= warnThreshold) {
    return {
      rule: "readability",
      status: "warn",
      message: `Average sentence is ${Math.round(avg)} words — hard to skim on mobile.`,
      fixTip: "Break long sentences into shorter ones. Aim for under 20 words per sentence.",
      points: points.warn,
    };
  }
  return {
    rule: "readability",
    status: "pass",
    message: `Good readability (avg ${Math.round(avg)} words/sentence).`,
    fixTip: "",
    points: points.pass,
  };
}

// ============================================================
// Public audit runner
// ============================================================
export function runOnPageAudit(
  title: string,
  description: string,
  mainKeyword: string = ""
): { score: number; issues: Issue[] } {
  // Guard: empty fields get an immediate low score
  const emptyIssues = ruleMissingFields(title, description);
  if (emptyIssues.length > 0) {
    return {
      score: Math.max(0, 100 - emptyIssues.length * 30),
      issues: emptyIssues,
    };
  }

  const issues: Issue[] = [];

  issues.push(ruleTitleLength(title));

  const kwTitle = ruleKeywordInTitle(title, mainKeyword);
  if (kwTitle) issues.push(kwTitle);

  const kwDesc = ruleKeywordInDescription(description, mainKeyword);
  if (kwDesc) issues.push(kwDesc);

  issues.push(ruleDescriptionLength(description));

  const structureIssue = ruleStructure(description);
  if (structureIssue) issues.push(structureIssue);

  // Pass title to stuffing rule so it analyses full listing corpus
  issues.push(ruleKeywordStuffing(title, description, mainKeyword));

  const readabilityIssue = ruleReadability(description);
  if (readabilityIssue) issues.push(readabilityIssue);

  // Normalize score to 100 using only the points of rules that actually ran
  const maxPointsMap: Record<string, number> = {
    titleLength: CONFIG.titleLength.points.pass,
    keywordInTitle: CONFIG.keywordInTitle.points.pass,
    keywordInDescription: CONFIG.keywordInDescription.points.pass,
    descriptionLength: CONFIG.descriptionLength.points.pass,
    structure: CONFIG.structure.points.pass,
    keywordStuffing: CONFIG.keywordStuffing.points.pass,
    readability: CONFIG.readability.points.pass,
  };

  const earned = issues.reduce((sum, i) => sum + i.points, 0);
  const possible = issues.reduce(
    (sum, i) => sum + (maxPointsMap[i.rule] ?? 0),
    0
  );

  const score =
    possible > 0
      ? Math.round(Math.min(100, Math.max(0, (earned / possible) * 100)))
      : 0;

  return { score, issues };
}
