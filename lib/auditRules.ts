import { Grade, Issue } from "@/types/audit";

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
    minLineBreaks: 3,
    points: { pass: 10, warn: 0 },
  },
  keywordStuffing: {
    maxRepetitions: 6,
    maxDensityPercent: 4,
    minWordLength: 4,
    points: { pass: 15, fail: 0 },
  },
  readability: {
    maxAvgWordsPerSentence: 30,
    points: { pass: 10, warn: 0 },
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

function ruleStructure(description: string): Issue {
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

function ruleKeywordStuffing(description: string, keyword: string): Issue {
  const words = description
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  // Count word frequencies (ignore short words)
  const freq: Record<string, number> = {};
  for (const raw of words) {
    const w = raw.replace(/[^a-z0-9]/g, "");
    if (w.length >= CONFIG.keywordStuffing.minWordLength) {
      freq[w] = (freq[w] ?? 0) + 1;
    }
  }

  const topEntry = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  const overRepeated =
    topEntry && topEntry[1] > CONFIG.keywordStuffing.maxRepetitions;

  let densityHigh = false;
  if (keyword.trim() && words.length > 0) {
    const kw = keyword.toLowerCase().trim();
    const count = words.filter((w) => w.includes(kw)).length;
    densityHigh =
      (count / words.length) * 100 > CONFIG.keywordStuffing.maxDensityPercent;
  }

  const stuffed = overRepeated || densityHigh;

  return {
    rule: "keywordStuffing",
    status: stuffed ? "fail" : "pass",
    message: stuffed
      ? overRepeated
        ? `"${topEntry[0]}" repeats ${topEntry[1]} times — looks like keyword stuffing.`
        : `Main keyword density exceeds ${CONFIG.keywordStuffing.maxDensityPercent}% — over-optimized.`
      : "No keyword stuffing detected.",
    fixTip: stuffed
      ? "Use synonyms and related phrases instead of repeating the same word. Natural copy ranks better."
      : "",
    points: stuffed
      ? CONFIG.keywordStuffing.points.fail
      : CONFIG.keywordStuffing.points.pass,
  };
}

function ruleReadability(description: string): Issue {
  const sentences = description
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return {
      rule: "readability",
      status: "warn",
      message: "Could not detect sentence structure — missing punctuation?",
      fixTip: "Write complete sentences ending with . ! or ?",
      points: 0,
    };
  }

  const wordCount = description.split(/\s+/).filter(Boolean).length;
  const avg = wordCount / sentences.length;
  const tooLong = avg > CONFIG.readability.maxAvgWordsPerSentence;

  return {
    rule: "readability",
    status: tooLong ? "warn" : "pass",
    message: tooLong
      ? `Average sentence is ${Math.round(avg)} words — hard to skim on mobile.`
      : `Good readability (avg ${Math.round(avg)} words/sentence).`,
    fixTip: tooLong
      ? "Break long sentences into shorter ones. Aim for under 20 words per sentence."
      : "",
    points: tooLong
      ? CONFIG.readability.points.warn
      : CONFIG.readability.points.pass,
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
    return { score: Math.max(0, 100 - emptyIssues.length * 30), issues: emptyIssues };
  }

  const issues: Issue[] = [];
  issues.push(ruleTitleLength(title));

  const kwTitle = ruleKeywordInTitle(title, mainKeyword);
  if (kwTitle) issues.push(kwTitle);

  const kwDesc = ruleKeywordInDescription(description, mainKeyword);
  if (kwDesc) issues.push(kwDesc);

  issues.push(ruleDescriptionLength(description));
  issues.push(ruleStructure(description));
  issues.push(ruleKeywordStuffing(description, mainKeyword));
  issues.push(ruleReadability(description));

  // Normalize to 100 based on max achievable points for rules that ran
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
    possible > 0 ? Math.round(Math.min(100, Math.max(0, (earned / possible) * 100))) : 0;

  return { score, issues };
}
