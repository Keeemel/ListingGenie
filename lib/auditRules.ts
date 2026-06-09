import { Grade, Issue, Platform } from "@/types/audit";

// ── Stop-words (excluded from single-word repetition checks) ─────────────────
const STOP_WORDS = new Set([
  "the","a","an","and","or","but","for","nor","so","yet","of","in","on","at",
  "to","by","up","as","is","it","its","be","am","are","was","were","been",
  "being","do","does","did","will","would","shall","should","may","might",
  "can","could","this","that","these","those","with","from","into","than",
  "then","when","also","not","you","your","we","our","they","their","have",
  "has","had","all","more","use","make","very","just","any","each","both",
  "such","only","other",
]);

// ── Promotional / banned words ────────────────────────────────────────────────
const PROMO_PATTERNS = [
  /\bbest\b/i, /\bsale\b/i, /\bcheap\b/i, /\b#1\b/, /\bnumber one\b/i,
  /\bfree shipping\b/i, /\bfree delivery\b/i, /\bguarantee\b/i,
  /\b100%\s*guarantee\b/i, /\bdeal\b/i, /\blowest price\b/i,
  /\blimited time\b/i, /\bact now\b/i, /\bspecial offer\b/i,
  /\bbuy now\b/i, /\border now\b/i, /\bexclusive offer\b/i,
];

// ── Color / size / material word lists (for titleAttributes) ─────────────────
const COLOR_WORDS = new Set([
  "black","white","red","blue","green","yellow","pink","purple","orange",
  "brown","grey","gray","silver","gold","beige","navy","cream","ivory",
  "charcoal","teal","mint","coral","rose","copper","bronze",
]);
const MATERIAL_WORDS = new Set([
  "steel","stainless","aluminum","aluminium","titanium","copper","iron",
  "wood","bamboo","oak","pine","cedar","walnut","leather","suede","nylon",
  "polyester","cotton","linen","silk","wool","cashmere","canvas","denim",
  "ceramic","glass","porcelain","plastic","silicone","rubber","foam","memory",
  "carbon","fiber","fibre","brass","chrome","zinc","alloy",
]);
const SIZE_PATTERN = /\b(xs|sm|s|m|l|xl|xxl|xxxl|\d[\d.]*\s*(cm|mm|in|inch|inches|ft|oz|ml|l|liter|litre|kg|g|lb|lbs|fl\s*oz|gallon))\b/i;

// ── Benefit / use-case language (for benefitsVsSpecs) ────────────────────────
const BENEFIT_PATTERNS = [
  /\bperfect for\b/i, /\bgreat for\b/i, /\bideal for\b/i,
  /\bdesigned for\b/i, /\bmade for\b/i, /\bbuilt for\b/i,
  /\bkeeps\b/i, /\bprotects\b/i, /\bprevents\b/i, /\bensures\b/i,
  /\bhelps\b/i, /\bimproves\b/i, /\benhances\b/i, /\breduces\b/i,
  /\bsaves\b/i, /\bdelivers\b/i, /\bprovides\b/i,
  /\bno more\b/i, /\bnever worry\b/i, /\bworry.?free\b/i,
  /\beasy to\b/i, /\bsimple to\b/i, /\bquick to\b/i,
];

// ── Use-case / context words (for buyerQuestions) ────────────────────────────
const USE_CASE_PATTERNS = [
  /\bat home\b/i, /\bin the office\b/i, /\bon the go\b/i,
  /\boutdoor(s)?\b/i, /\btravel(ling)?\b/i, /\bgym\b/i,
  /\bdaily use\b/i, /\beveryday\b/i, /\bkitchen\b/i, /\bbedroom\b/i,
  /\bworkout\b/i, /\bhike\b/i, /\bcamping\b/i, /\boffice\b/i,
];
const RECIPIENT_PATTERNS = [
  /\bfor (men|women|kids|children|boys|girls|adults|seniors|beginners|professionals|him|her|them|mom|dad|parents|babies)\b/i,
  /\bgift for\b/i, /\byour\b/i, /\byou\b/i,
];

// ── eBay item-specific indicators ─────────────────────────────────────────────
const EBAY_SPECIFIC_PATTERNS = [
  { label: "brand",     re: /\bbrand\b|[A-Z][a-z]+ (is|by|from)\b/i },
  { label: "size",      re: /\bsize\b|\b(xs|s|m|l|xl|xxl|\d+\s*(cm|mm|in|inch|inches))\b/i },
  { label: "color",     re: new RegExp(`\\b(${[...COLOR_WORDS].join("|")})\\b`, "i") },
  { label: "condition", re: /\b(new|used|refurbished|open\s*box|like new|pre.?owned|excellent|good|fair|acceptable|for parts)\b/i },
  { label: "model",     re: /\bmodel\b|\btype\b|\bversion\b|\bgeneration\b/i },
];

// ── Etsy attribute indicators ─────────────────────────────────────────────────
const ETSY_MATERIAL_WORDS = new Set([
  "linen","cotton","wood","silver","gold","brass","leather","ceramic",
  "glass","resin","canvas","velvet","silk","bamboo","acrylic","polymer",
  "sterling","copper","bronze","stainless","porcelain","clay","felt",
  "crochet","knit","woven","embroidered","printed","engraved",
]);
const ETSY_OCCASION_WORDS = new Set([
  "birthday","wedding","anniversary","christmas","holiday","graduation",
  "valentine","baby shower","housewarming","mothers day","fathers day",
  "engagement","bridal","bachelorette","retirement","easter","halloween",
]);
const ETSY_RECIPIENT_RE = /\bfor (her|him|them|mom|dad|wife|husband|sister|brother|friend|teacher|kids|baby|grandma|grandpa)\b/i;

// ── Vinted title attribute patterns ──────────────────────────────────────────
const VINTED_SIZE_RE = /\b(xs|s|m|l|xl|xxl|xxxl|\d{2,3}|one size|fits (all|s|m|l))\b/i;
const VINTED_CONDITION_RE = /\b(new|neuf|used|occasion|like new|good|fair|excellent|worn|tres bon|bon etat|satisfaisant)\b/i;

// ============================================================
// Per-platform configuration
// ============================================================

interface TitleCfg {
  idealMin: number; idealMax: number;
  acceptableMin: number; acceptableMax: number;
  hardMax?: number;        // fail if > this (e.g. eBay 80)
  points: { pass: number; warn: number; fail: number };
}
interface DescCfg {
  idealMin: number; idealMax: number;
  acceptableMin: number;
  points: { pass: number; warn: number; fail: number };
}
interface PlatformCfg {
  title: TitleCfg;
  desc: DescCfg;
  promoSeverity: "fail" | "warn" | "skip";
  promoScoreCap?: number;  // hard score ceiling when promo fires on this platform
  checkFrontLoad: boolean;
  checkTitleAttributes: boolean;
  checkBenefits: boolean;
  checkSpecificity: boolean;
  checkBuyerQuestions: boolean;
  checkAmazonBullets: boolean;
  checkEbaySpecifics: boolean;
  checkEtsyAttributes: boolean;
  checkShopifyMeta: boolean;
  checkVintedAttributes: boolean;
  frontLoadThreshold: number; // fraction of title length (0–1)
  platformTips: string[];
}

const PLATFORM_CONFIGS: Record<Platform, PlatformCfg> = {
  amazon: {
    title: {
      idealMin: 80, idealMax: 150,
      acceptableMin: 60, acceptableMax: 200, hardMax: 200,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    desc: {
      idealMin: 300, idealMax: 2000, acceptableMin: 150,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    promoSeverity: "fail",
    promoScoreCap: 70,
    checkFrontLoad: true,
    checkTitleAttributes: true,
    checkBenefits: true,
    checkSpecificity: true,
    checkBuyerQuestions: true,
    checkAmazonBullets: true,
    checkEbaySpecifics: false,
    checkEtsyAttributes: false,
    checkShopifyMeta: false,
    checkVintedAttributes: false,
    frontLoadThreshold: 0.40,
    platformTips: [
      "Use Title Case throughout your title — Amazon's style guide and A9 algorithm both expect it.",
      "Include exactly 5 bullet points in your description, each highlighting a customer benefit.",
      "Promotional words (best, sale, guarantee, %) can trigger Amazon's listing suppression — remove them.",
      "Front-load your primary keyword: the first 80 characters are indexed most heavily by A9.",
      "Add backend search terms in Seller Central under 'Keywords' to capture additional queries without cluttering the title.",
    ],
  },
  ebay: {
    title: {
      idealMin: 60, idealMax: 80,
      acceptableMin: 40, acceptableMax: 80, hardMax: 80,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    desc: {
      idealMin: 200, idealMax: 2000, acceptableMin: 100,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    promoSeverity: "warn",
    checkFrontLoad: true,
    checkTitleAttributes: true,
    checkBenefits: false,
    checkSpecificity: true,
    checkBuyerQuestions: false,
    checkAmazonBullets: false,
    checkEbaySpecifics: true,
    checkEtsyAttributes: false,
    checkShopifyMeta: false,
    checkVintedAttributes: false,
    frontLoadThreshold: 0.45,
    platformTips: [
      "eBay titles are capped at 80 characters — every character is prime SEO real estate.",
      "Fill in all Item Specifics (brand, size, color, condition, model) in the eBay listing form — Cassini ranks listings with complete specifics higher.",
      "State the item condition clearly in both the condition field and the description.",
      "Keyword-dense titles outperform vague ones in Cassini search — avoid filler words like 'amazing' or 'great'.",
    ],
  },
  etsy: {
    title: {
      idealMin: 60, idealMax: 140,
      acceptableMin: 40, acceptableMax: 140, hardMax: 140,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    desc: {
      idealMin: 250, idealMax: 2000, acceptableMin: 150,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    promoSeverity: "warn",
    checkFrontLoad: true,
    checkTitleAttributes: true,
    checkBenefits: true,
    checkSpecificity: false,
    checkBuyerQuestions: true,
    checkAmazonBullets: false,
    checkEbaySpecifics: false,
    checkEtsyAttributes: true,
    checkShopifyMeta: false,
    checkVintedAttributes: false,
    frontLoadThreshold: 0.35,
    platformTips: [
      "Use all 13 Etsy tags with specific, long-tail phrases buyers actually search for (e.g. 'personalized leather wallet mens gift').",
      "Front-load your main keyword — Etsy's algorithm weights the first 25–40 characters most heavily.",
      "Mention materials (sterling silver, hand-dyed linen), occasions (birthday, wedding), and recipients (gift for her) in the description.",
      "Repeat your keyword in the first line of the description — Etsy also indexes description text.",
    ],
  },
  shopify: {
    title: {
      idealMin: 50, idealMax: 60,
      acceptableMin: 30, acceptableMax: 80,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    desc: {
      idealMin: 300, idealMax: 2000, acceptableMin: 150,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    promoSeverity: "warn",
    checkFrontLoad: false,
    checkTitleAttributes: true,
    checkBenefits: true,
    checkSpecificity: true,
    checkBuyerQuestions: true,
    checkAmazonBullets: false,
    checkEbaySpecifics: false,
    checkEtsyAttributes: false,
    checkShopifyMeta: true,
    checkVintedAttributes: false,
    frontLoadThreshold: 0.5,
    platformTips: [
      "Write a unique meta description (150–160 characters) in Shopify's SEO section — it directly affects Google click-through rate.",
      "Add descriptive alt text to every product image for accessibility and Google Image search.",
      "End your description with a clear call to action ('Add to Cart', 'Order Today', 'Shop Now').",
      "Structure the description with headings and bullet points — Google rewards scannable, well-structured content.",
    ],
  },
  vinted: {
    title: {
      idealMin: 20, idealMax: 60,
      acceptableMin: 10, acceptableMax: 80,
      points: { pass: 15, warn: 8, fail: 0 },
    },
    desc: {
      idealMin: 60, idealMax: 800, acceptableMin: 30,
      points: { pass: 15, warn: 8, fail: 0 },
    },
    promoSeverity: "skip",
    checkFrontLoad: false,
    checkTitleAttributes: false,
    checkBenefits: false,
    checkSpecificity: false,
    checkBuyerQuestions: false,
    checkAmazonBullets: false,
    checkEbaySpecifics: false,
    checkEtsyAttributes: false,
    checkShopifyMeta: false,
    checkVintedAttributes: true,
    frontLoadThreshold: 0.5,
    platformTips: [
      "Your title should contain brand, size, color, and condition — all in one concise line.",
      "Be precise about condition: Vinted buyers filter by condition and distrust vague descriptions.",
      "Add measurements in the description if the label size differs from actual fit.",
      "Use simple, natural words — Vinted search is keyword-based with no Google SEO complexity.",
    ],
  },
  other: {
    title: {
      idealMin: 40, idealMax: 70,
      acceptableMin: 20, acceptableMax: 80,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    desc: {
      idealMin: 300, idealMax: 2000, acceptableMin: 150,
      points: { pass: 20, warn: 10, fail: 0 },
    },
    promoSeverity: "warn",
    checkFrontLoad: true,
    checkTitleAttributes: true,
    checkBenefits: true,
    checkSpecificity: true,
    checkBuyerQuestions: true,
    checkAmazonBullets: false,
    checkEbaySpecifics: false,
    checkEtsyAttributes: false,
    checkShopifyMeta: false,
    checkVintedAttributes: false,
    frontLoadThreshold: 0.50,
    platformTips: [
      "Write a descriptive, keyword-rich title that clearly identifies the product.",
      "Use bullet points and short paragraphs — most buyers scan rather than read.",
      "Cover the three buyer questions: what is it, who is it for, and why should they buy it.",
    ],
  },
};

// ============================================================
// Grade + static helpers
// ============================================================

export function computeGrade(score: number): Grade {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

export function getPlatformConfig(platform: Platform): PlatformCfg {
  return PLATFORM_CONFIGS[platform];
}

export function getPlatformTips(platform: Platform): string[] {
  return PLATFORM_CONFIGS[platform].platformTips;
}

// ============================================================
// Max-points map — used to compute possible score
// ============================================================

function buildMaxPointsMap(cfg: PlatformCfg): Record<string, number> {
  return {
    titleLength:        cfg.title.points.pass,
    keywordInTitle:     15,
    keywordInDescription: 10,
    descriptionLength:  cfg.desc.points.pass,
    structure:          15,
    keywordStuffing:    15,
    readability:        15,
    keywordFrontLoad:    8,
    titleAttributes:     7,
    promoLanguage:      10,
    allCaps:             5,
    benefitsVsSpecs:     8,
    specificity:         7,
    buyerQuestions:      8,
    amazonBullets:      12,
    ebayItemSpecifics:  12,
    etsyAttributes:     10,
    shopifyMetaDesc:    12,
    vintedAttributes:   15,
  };
}

// ============================================================
// Rules — existing (platform-aware thresholds)
// ============================================================

function ruleMissingFields(title: string, description: string, platform: Platform): Issue[] {
  const issues: Issue[] = [];
  const cfg = PLATFORM_CONFIGS[platform];
  if (!title.trim()) {
    issues.push({
      rule: "emptyTitle",
      status: "fail",
      message: "Product title is missing.",
      fixTip: `Add a descriptive title of at least ${cfg.title.idealMin} characters.`,
      points: 0,
    });
  }
  if (!description.trim()) {
    issues.push({
      rule: "emptyDescription",
      status: "fail",
      message: "Product description is missing.",
      fixTip: `Write at least ${cfg.desc.idealMin} characters covering features, benefits, and use cases.`,
      points: 0,
    });
  }
  return issues;
}

function ruleTitleLength(title: string, platform: Platform): Issue {
  const len = title.trim().length;
  const { idealMin, idealMax, acceptableMin, acceptableMax, hardMax, points } =
    PLATFORM_CONFIGS[platform].title;

  // Hard max (e.g. eBay 80 chars — listing will be truncated/rejected)
  if (hardMax !== undefined && len > hardMax) {
    return {
      rule: "titleLength",
      status: "fail",
      message: `Title is too long (${len} chars) — ${platform === "ebay" ? "eBay" : "this platform"} hard-limits titles to ${hardMax} characters.`,
      fixTip: `Trim your title to ${hardMax} characters maximum. Prioritize the most searchable keywords.`,
      points: points.fail,
    };
  }
  if (len >= idealMin && len <= idealMax) {
    return {
      rule: "titleLength",
      status: "pass",
      message: `Title length is ideal for ${platform} (${len} chars, target ${idealMin}–${idealMax}).`,
      fixTip: "",
      points: points.pass,
    };
  }
  if (len >= acceptableMin && len <= acceptableMax) {
    return {
      rule: "titleLength",
      status: "warn",
      message: `Title length is acceptable but not optimal (${len} chars, ideal ${idealMin}–${idealMax}).`,
      fixTip: `Aim for ${idealMin}–${idealMax} characters to maximize visibility on ${platform}.`,
      points: points.warn,
    };
  }
  return {
    rule: "titleLength",
    status: "fail",
    message:
      len < acceptableMin
        ? `Title is too short (${len} chars) — search engines will likely skip it.`
        : `Title is too long (${len} chars) and will be truncated in search results.`,
    fixTip: `Keep your title between ${idealMin} and ${idealMax} characters.`,
    points: points.fail,
  };
}

function ruleKeywordInTitle(title: string, keyword: string): Issue | null {
  if (!keyword.trim()) return null;
  const found = title.toLowerCase().includes(keyword.toLowerCase().trim());
  return {
    rule: "keywordInTitle",
    status: found ? "pass" : "fail",
    message: found
      ? `Main keyword "${keyword}" is present in the title.`
      : `Main keyword "${keyword}" is missing from the title.`,
    fixTip: found ? "" : `Insert "${keyword}" near the beginning of your title.`,
    points: found ? 15 : 0,
  };
}

function ruleKeywordInDescription(description: string, keyword: string): Issue | null {
  if (!keyword.trim()) return null;
  const found = description.toLowerCase().includes(keyword.toLowerCase().trim());
  return {
    rule: "keywordInDescription",
    status: found ? "pass" : "fail",
    message: found
      ? `Main keyword "${keyword}" appears in the description.`
      : `Main keyword "${keyword}" is absent from the description.`,
    fixTip: found ? "" : `Use "${keyword}" naturally at least once in the opening paragraph.`,
    points: found ? 10 : 0,
  };
}

function ruleDescriptionLength(description: string, platform: Platform): Issue {
  const len = description.trim().length;
  const { idealMin, idealMax, acceptableMin, points } = PLATFORM_CONFIGS[platform].desc;
  if (len >= idealMin && len <= idealMax) {
    return { rule: "descriptionLength", status: "pass", message: `Description length is ideal (${len} chars).`, fixTip: "", points: points.pass };
  }
  if (len >= acceptableMin) {
    return { rule: "descriptionLength", status: "warn", message: `Description is a bit short (${len} chars, ideal ${idealMin}–${idealMax}).`, fixTip: `Expand to at least ${idealMin} characters — cover features, benefits, dimensions, and use cases.`, points: points.warn };
  }
  return { rule: "descriptionLength", status: "fail", message: `Description is too short (${len} chars) to rank well.`, fixTip: `Write at least ${idealMin} characters addressing: what is it, who is it for, and why buy it.`, points: points.fail };
}

function ruleStructure(description: string): Issue | null {
  if (description.trim().length < 200) return null;
  const hasBullets = /^[ \t]*[•\-*]\s/m.test(description);
  const lineBreaks = (description.match(/\n/g) ?? []).length;
  const ok = hasBullets || lineBreaks >= 3;
  return {
    rule: "structure",
    status: ok ? "pass" : "warn",
    message: ok
      ? "Description uses bullet points or clear paragraph breaks."
      : "Description reads as a wall of text with no visible structure.",
    fixTip: ok ? "" : "Break content into bullet points (• or -) and short paragraphs for easier scanning.",
    points: ok ? 15 : 0,
  };
}

function ruleKeywordStuffing(title: string, description: string, keyword: string): Issue {
  const fullText = `${title} ${description}`;
  const maxOccurrences = 4;
  const maxDensity = 3;
  const maxWordRep = 6;
  const minWordLen = 4;

  let keywordStuffed = false;
  let keywordCount = 0;

  if (keyword.trim()) {
    const kw = keyword.toLowerCase().trim();
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    keywordCount = (fullText.match(regex) ?? []).length;
    const totalWords = fullText.toLowerCase().split(/\s+/).filter(Boolean).length;
    const density = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
    keywordStuffed = keywordCount > maxOccurrences || density > maxDensity;
  }

  const tokens = fullText.toLowerCase().split(/\s+/).filter(Boolean);
  const freq: Record<string, number> = {};
  for (const raw of tokens) {
    const w = raw.replace(/[^a-z0-9]/g, "");
    if (w.length >= minWordLen && !STOP_WORDS.has(w)) freq[w] = (freq[w] ?? 0) + 1;
  }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  const wordStuffed = top != null && top[1] > maxWordRep;

  const stuffed = keywordStuffed || wordStuffed;
  let message: string;
  if (!stuffed) {
    message = "No keyword stuffing detected.";
  } else if (keywordStuffed && keyword.trim()) {
    message = `Main keyword "${keyword}" appears ${keywordCount}× (limit: ${maxOccurrences}).`;
  } else if (wordStuffed && top) {
    message = `"${top[0]}" repeats ${top[1]} times across title + description.`;
  } else {
    message = `Keyword density exceeds ${maxDensity}% — over-optimized.`;
  }

  return {
    rule: "keywordStuffing",
    status: stuffed ? "fail" : "pass",
    message,
    fixTip: stuffed ? "Use synonyms and related phrases instead of repeating the same word. Natural copy ranks better." : "",
    points: stuffed ? 0 : 15,
  };
}

function ruleReadability(description: string): Issue | null {
  if (description.trim().length < 150) return null;
  const prose = description.split("\n").filter((l) => !/^[ \t]*[•\-*]\s/.test(l)).join(" ");
  const sentences = prose.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length === 0) return null;
  const avg = prose.split(/\s+/).filter(Boolean).length / sentences.length;
  if (avg >= 50) {
    return { rule: "readability", status: "fail", message: `Average sentence is ${Math.round(avg)} words — extremely difficult to read.`, fixTip: "Break these long sentences aggressively. Use bullet points. Target under 20 words per sentence.", points: 0 };
  }
  if (avg >= 30) {
    return { rule: "readability", status: "warn", message: `Average sentence is ${Math.round(avg)} words — hard to skim on mobile.`, fixTip: "Break long sentences into shorter ones. Aim for under 20 words per sentence.", points: 5 };
  }
  return { rule: "readability", status: "pass", message: `Good readability (avg ${Math.round(avg)} words/sentence).`, fixTip: "", points: 15 };
}

// ============================================================
// Rules — new
// ============================================================

function ruleKeywordFrontLoad(title: string, keyword: string, platform: Platform): Issue | null {
  if (!keyword.trim() || title.trim().length < 20) return null;
  const kw = keyword.toLowerCase().trim();
  const t = title.toLowerCase();
  const threshold = PLATFORM_CONFIGS[platform].frontLoadThreshold;
  const cutoff = Math.ceil(t.length * threshold);
  const pos = t.indexOf(kw);
  if (pos === -1) return null; // keywordInTitle handles missing keyword
  const frontLoaded = pos < cutoff;
  const pct = Math.round(threshold * 100);
  return {
    rule: "keywordFrontLoad",
    status: frontLoaded ? "pass" : "warn",
    message: frontLoaded
      ? `Main keyword appears in the first ${pct}% of the title.`
      : `Main keyword appears too late in the title (position ${pos + 1}/${title.length}).`,
    fixTip: frontLoaded ? "" : `Move "${keyword}" to the first ${pct}% of your title for maximum search-algorithm weight.`,
    points: frontLoaded ? 8 : 0,
  };
}

function ruleTitleAttributes(title: string, platform: Platform): Issue | null {
  if (!PLATFORM_CONFIGS[platform].checkTitleAttributes) return null;
  const t = title.toLowerCase();
  const words = t.split(/\s+/);
  let found = 0;
  if (/\d/.test(title)) found++;                                   // numeric value
  if (words.some((w) => COLOR_WORDS.has(w))) found++;              // color
  if (words.some((w) => MATERIAL_WORDS.has(w))) found++;          // material
  if (SIZE_PATTERN.test(title)) found++;                            // size/capacity

  if (found >= 2) {
    return { rule: "titleAttributes", status: "pass", message: "Title includes concrete product attributes (number, color, material, or size).", fixTip: "", points: 7 };
  }
  if (found === 1) {
    return { rule: "titleAttributes", status: "warn", message: "Title has only one concrete attribute — add more specifics.", fixTip: "Include at least 2 concrete details (e.g. '750ml Stainless Steel' or 'Large Black Cotton') to help buyers qualify your product at a glance.", points: 3 };
  }
  return { rule: "titleAttributes", status: "fail", message: "Title has no concrete product attributes (color, size, material, or number).", fixTip: "Add specific details: size (ml, oz, cm), material (stainless steel, bamboo), color, or quantity to increase relevance and click-through.", points: 0 };
}

function rulePromoLanguage(title: string, description: string, platform: Platform): Issue | null {
  const severity = PLATFORM_CONFIGS[platform].promoSeverity;
  if (severity === "skip") return null;

  const combined = `${title} ${description}`;
  const hit = PROMO_PATTERNS.find((re) => re.test(combined));
  if (!hit) {
    return { rule: "promoLanguage", status: "pass", message: "No promotional or banned language detected.", fixTip: "", points: 10 };
  }

  const matchedWord = combined.match(hit)?.[0] ?? "promotional language";
  const isAmazon = platform === "amazon";
  return {
    rule: "promoLanguage",
    status: severity,
    message: isAmazon
      ? `Banned promotional language detected ("${matchedWord}") — Amazon can suppress or de-rank listings containing this.`
      : `Promotional language detected ("${matchedWord}") — may reduce buyer trust.`,
    fixTip: isAmazon
      ? `Remove all promotional terms (best, sale, guarantee, %, free shipping, #1, deal) from title and description. Amazon's policy prohibits them.`
      : `Replace "${matchedWord}" with specific, factual claims that build credibility.`,
    points: 0,
  };
}

function ruleAllCaps(title: string): Issue {
  const words = title.split(/\s+/).filter(Boolean);
  const capsWords = words.filter((w) => {
    const clean = w.replace(/[^a-zA-Z]/g, "");
    return clean.length >= 5 && clean === clean.toUpperCase();
  });
  if (capsWords.length >= 4) {
    return { rule: "allCaps", status: "fail", message: `Title has ${capsWords.length} words in ALL CAPS — looks like spam and hurts readability.`, fixTip: "Use Title Case instead (capitalize first letter of main words only). Reserve ALL CAPS for acronyms.", points: 0 };
  }
  if (capsWords.length >= 2) {
    return { rule: "allCaps", status: "warn", message: `${capsWords.length} words in ALL CAPS detected in title.`, fixTip: "Limit ALL CAPS to accepted acronyms (BPA, USB, UV). Use Title Case for product words.", points: 2 };
  }
  return { rule: "allCaps", status: "pass", message: "Title capitalization looks normal.", fixTip: "", points: 5 };
}

function ruleBenefitsVsSpecs(description: string, platform: Platform): Issue | null {
  if (!PLATFORM_CONFIGS[platform].checkBenefits) return null;
  if (description.trim().length < 100) return null;
  const hits = BENEFIT_PATTERNS.filter((re) => re.test(description)).length;
  if (hits >= 3) {
    return { rule: "benefitsVsSpecs", status: "pass", message: "Description includes benefit-oriented and use-case language.", fixTip: "", points: 8 };
  }
  if (hits >= 1) {
    return { rule: "benefitsVsSpecs", status: "warn", message: "Description is mostly specs with limited benefit or use-case language.", fixTip: "Add phrases like 'perfect for', 'keeps you', 'designed for daily use' — buyers need to visualize how the product improves their life.", points: 3 };
  }
  return { rule: "benefitsVsSpecs", status: "fail", message: "Description reads as a raw spec sheet with no buyer benefits or use cases.", fixTip: "Rewrite at least 2–3 sentences from the buyer's perspective: what problem does this solve? Who is it for? What does it feel like to use?", points: 0 };
}

function ruleSpecificity(description: string, platform: Platform): Issue | null {
  if (!PLATFORM_CONFIGS[platform].checkSpecificity) return null;
  if (description.trim().length < 100) return null;
  const measurements = (description.match(/\d[\d.]*\s*(cm|mm|in|inch|inches|ft|oz|ml|l(?!ong)|liter|litre|kg|g(?!reat)|lb|lbs|fl\s*oz|gallon|pack|piece|set)/gi) ?? []).length;
  if (measurements >= 2) {
    return { rule: "specificity", status: "pass", message: `Description includes ${measurements} concrete measurements or quantities.`, fixTip: "", points: 7 };
  }
  if (measurements === 1) {
    return { rule: "specificity", status: "warn", message: "Description has only one specific measurement or quantity.", fixTip: "Add more concrete details: dimensions, weight, capacity, quantity, or other measurable specs buyers compare when shopping.", points: 3 };
  }
  return { rule: "specificity", status: "fail", message: "Description lacks specific measurements or quantities.", fixTip: "Include concrete numbers: dimensions (cm, in), capacity (ml, oz), weight (g, kg, lbs), count (3-pack). Specificity builds trust and reduces returns.", points: 0 };
}

function ruleBuyerQuestions(description: string, platform: Platform): Issue | null {
  if (!PLATFORM_CONFIGS[platform].checkBuyerQuestions) return null;
  if (description.trim().length < 100) return null;
  const hasUseCase = USE_CASE_PATTERNS.some((re) => re.test(description));
  const hasRecipient = RECIPIENT_PATTERNS.some((re) => re.test(description));
  if (hasUseCase && hasRecipient) {
    return { rule: "buyerQuestions", status: "pass", message: "Description addresses use context and intended audience.", fixTip: "", points: 8 };
  }
  if (hasUseCase || hasRecipient) {
    return { rule: "buyerQuestions", status: "warn", message: "Description covers one of the two key buyer questions (use context or audience).", fixTip: "Make sure your description answers: Who is this for? AND When/where do they use it? Both signals help buyers self-qualify.", points: 3 };
  }
  return { rule: "buyerQuestions", status: "fail", message: "Description does not answer 'Who is this for?' or 'When/where is it used?'.", fixTip: "Add at least one use-context sentence (e.g. 'great for gym or travel') and one audience sentence (e.g. 'perfect for coffee lovers').", points: 0 };
}

// ── Platform-specific rules ───────────────────────────────────────────────────

function ruleAmazonBullets(description: string, platform: Platform): Issue | null {
  if (!PLATFORM_CONFIGS[platform].checkAmazonBullets) return null;
  const bulletLines = description.split("\n").filter((l) => /^[ \t]*[•\-*]\s/.test(l));
  const count = bulletLines.length;
  if (count >= 5) {
    return { rule: "amazonBullets", status: "pass", message: `${count} bullet points found — Amazon recommends exactly 5.`, fixTip: "", points: 12 };
  }
  if (count >= 3) {
    return { rule: "amazonBullets", status: "warn", message: `Only ${count} bullet points found — Amazon expects 5.`, fixTip: "Add bullet points until you have exactly 5 — each should highlight a unique customer benefit, not a raw spec.", points: 5 };
  }
  return { rule: "amazonBullets", status: "fail", message: `Found ${count} bullet point(s) — Amazon expects 5 benefit-focused bullets.`, fixTip: "Structure your description with 5 bullet points (• or -), each covering one key benefit: what it does, why it matters, and how it helps the buyer.", points: 0 };
}

function ruleEbayItemSpecifics(description: string, platform: Platform): Issue | null {
  if (!PLATFORM_CONFIGS[platform].checkEbaySpecifics) return null;
  const foundLabels = EBAY_SPECIFIC_PATTERNS.filter(({ re }) => re.test(description)).map(({ label }) => label);
  const count = foundLabels.length;
  if (count >= 4) {
    return { rule: "ebayItemSpecifics", status: "pass", message: `Description covers ${count}/5 key item specifics (${foundLabels.join(", ")}).`, fixTip: "", points: 12 };
  }
  if (count >= 2) {
    const missing = EBAY_SPECIFIC_PATTERNS.filter(({ label }) => !foundLabels.includes(label)).map(({ label }) => label);
    return { rule: "ebayItemSpecifics", status: "warn", message: `Only ${count}/5 item specifics mentioned in description. Missing: ${missing.join(", ")}.`, fixTip: "Add brand, size, color, condition, and model/type to your description and eBay's Item Specifics fields — Cassini search ranks complete listings higher.", points: 5 };
  }
  return { rule: "ebayItemSpecifics", status: "fail", message: "Description is missing key eBay item specifics (brand, size, color, condition, model).", fixTip: "Fill in eBay's Item Specifics form and mention brand, condition, size, color, and model in the description. These are the top filters buyers use.", points: 0 };
}

function ruleEtsyAttributes(description: string, title: string, platform: Platform): Issue | null {
  if (!PLATFORM_CONFIGS[platform].checkEtsyAttributes) return null;
  const combined = `${title} ${description}`.toLowerCase();
  const words = combined.split(/\s+/);
  const hasMaterial = words.some((w) => ETSY_MATERIAL_WORDS.has(w.replace(/[^a-z]/g, "")));
  const hasOccasion = [...ETSY_OCCASION_WORDS].some((o) => combined.includes(o));
  const hasRecipient = ETSY_RECIPIENT_RE.test(combined);
  const score = [hasMaterial, hasOccasion, hasRecipient].filter(Boolean).length;
  if (score >= 2) {
    return { rule: "etsyAttributes", status: "pass", message: "Listing mentions materials, occasions, or recipient — all important Etsy search signals.", fixTip: "", points: 10 };
  }
  if (score === 1) {
    return { rule: "etsyAttributes", status: "warn", message: "Listing covers only one of the key Etsy search signals (material, occasion, recipient).", fixTip: "Etsy shoppers filter by material (sterling silver, linen), occasion (birthday, wedding), and recipient (for her, for dad). Add at least two of these to expand your visibility.", points: 4 };
  }
  return { rule: "etsyAttributes", status: "fail", message: "Listing mentions no material, occasion, or recipient — key signals for Etsy search.", fixTip: "Add material (e.g. 'hand-dyed linen'), occasion (e.g. 'perfect for birthdays'), and recipient (e.g. 'gift for her') to both title and description.", points: 0 };
}

function ruleShopifyMeta(description: string, platform: Platform): Issue | null {
  if (!PLATFORM_CONFIGS[platform].checkShopifyMeta) return null;
  const hasCta = /\b(add to cart|buy now|order now|shop now|get yours|order today|purchase|in stock)\b/i.test(description);
  const firstSentence = description.split(/[.!?\n]/)[0]?.trim() ?? "";
  const metaLen = firstSentence.length;
  const hasMeta = metaLen >= 50 && metaLen <= 200; // first sentence approximates a meta description
  if (hasCta && hasMeta) {
    return { rule: "shopifyMetaDesc", status: "pass", message: "Description has a compelling opening (potential meta description) and a clear call to action.", fixTip: "", points: 12 };
  }
  if (hasCta || hasMeta) {
    return { rule: "shopifyMetaDesc", status: "warn", message: hasCta ? "CTA found but opening sentence may not work as a meta description (aim for 50–160 chars)." : "Opening sentence could work as a meta, but no clear call to action found.", fixTip: "Write a punchy first sentence (50–160 chars) for Google snippets, and end the description with a CTA like 'Order today and get free delivery'.", points: 5 };
  }
  return { rule: "shopifyMetaDesc", status: "fail", message: "No clear call to action or meta-ready opening sentence found.", fixTip: "Start with a compelling 50–160 char sentence (this often becomes your Google meta description). End with 'Add to Cart', 'Shop Now', or 'Order Today'.", points: 0 };
}

function ruleVintedAttributes(title: string, platform: Platform): Issue | null {
  if (!PLATFORM_CONFIGS[platform].checkVintedAttributes) return null;
  const t = title.toLowerCase();
  const words = t.split(/\s+/);
  const hasColor = words.some((w) => COLOR_WORDS.has(w.replace(/[^a-z]/g, "")));
  const hasSize = VINTED_SIZE_RE.test(title);
  const hasCondition = VINTED_CONDITION_RE.test(title);
  // Brand = at least one capitalized word other than the first word of the title
  const titleWords = title.split(/\s+/);
  const hasBrand = titleWords.slice(1).some((w) => /^[A-Z][a-z]/.test(w));
  const found = [hasColor, hasSize, hasCondition, hasBrand].filter(Boolean).length;
  if (found >= 3) {
    return { rule: "vintedAttributes", status: "pass", message: "Title includes the key Vinted signals: brand, size, color, and/or condition.", fixTip: "", points: 15 };
  }
  if (found >= 2) {
    const missing = [!hasBrand && "brand", !hasSize && "size", !hasCondition && "condition", !hasColor && "color"].filter(Boolean);
    return { rule: "vintedAttributes", status: "warn", message: `Title covers ${found}/4 Vinted attributes. Possibly missing: ${missing.join(", ")}.`, fixTip: "Vinted buyers search by brand, size, color, and condition — include all four in your title for best discovery.", points: 7 };
  }
  return { rule: "vintedAttributes", status: "fail", message: "Title is missing most key Vinted attributes (brand, size, color, condition).", fixTip: "Write your title like: 'Zara Blazer Black M New with tags'. Include brand, item name, color, size, and condition.", points: 0 };
}

// ============================================================
// Public audit runner
// ============================================================

export function runOnPageAudit(
  title: string,
  description: string,
  mainKeyword = "",
  platform: Platform = "other"
): { score: number; issues: Issue[]; platformTips: string[] } {
  const emptyIssues = ruleMissingFields(title, description, platform);
  if (emptyIssues.length > 0) {
    return { score: Math.max(0, 100 - emptyIssues.length * 30), issues: emptyIssues, platformTips: PLATFORM_CONFIGS[platform].platformTips };
  }

  const cfg = PLATFORM_CONFIGS[platform];
  const issues: Issue[] = [];

  // ── Existing rules (platform-aware thresholds) ──────────────────────────────
  issues.push(ruleTitleLength(title, platform));

  const kwTitle = ruleKeywordInTitle(title, mainKeyword);
  if (kwTitle) issues.push(kwTitle);

  const kwDesc = ruleKeywordInDescription(description, mainKeyword);
  if (kwDesc) issues.push(kwDesc);

  issues.push(ruleDescriptionLength(description, platform));

  if (platform !== "vinted") {
    const struct = ruleStructure(description);
    if (struct) issues.push(struct);
  }

  issues.push(ruleKeywordStuffing(title, description, mainKeyword));

  if (platform !== "vinted") {
    const read = ruleReadability(description);
    if (read) issues.push(read);
  }

  // ── New rules ───────────────────────────────────────────────────────────────
  const frontLoad = ruleKeywordFrontLoad(title, mainKeyword, platform);
  if (frontLoad) issues.push(frontLoad);

  const attrs = ruleTitleAttributes(title, platform);
  if (attrs) issues.push(attrs);

  const promo = rulePromoLanguage(title, description, platform);
  if (promo) issues.push(promo);

  issues.push(ruleAllCaps(title));

  const benefits = ruleBenefitsVsSpecs(description, platform);
  if (benefits) issues.push(benefits);

  const specificity = ruleSpecificity(description, platform);
  if (specificity) issues.push(specificity);

  const buyerQ = ruleBuyerQuestions(description, platform);
  if (buyerQ) issues.push(buyerQ);

  // ── Platform-specific rules ─────────────────────────────────────────────────
  const bullets = ruleAmazonBullets(description, platform);
  if (bullets) issues.push(bullets);

  const ebaySpec = ruleEbayItemSpecifics(description, platform);
  if (ebaySpec) issues.push(ebaySpec);

  const etsyAttr = ruleEtsyAttributes(description, title, platform);
  if (etsyAttr) issues.push(etsyAttr);

  const shopifyMeta = ruleShopifyMeta(description, platform);
  if (shopifyMeta) issues.push(shopifyMeta);

  const vinted = ruleVintedAttributes(title, platform);
  if (vinted) issues.push(vinted);

  // ── Score normalization ─────────────────────────────────────────────────────
  const maxMap = buildMaxPointsMap(cfg);
  const earned = issues.reduce((s, i) => s + i.points, 0);
  const possible = issues.reduce((s, i) => s + (maxMap[i.rule] ?? 0), 0);
  const rawScore = possible > 0 ? Math.round(Math.min(100, Math.max(0, (earned / possible) * 100))) : 0;

  // Hard caps
  const stuffingFail = issues.find((i) => i.rule === "keywordStuffing" && i.status === "fail");
  const promoFail    = issues.find((i) => i.rule === "promoLanguage"    && i.status === "fail");

  let score = rawScore;
  if (stuffingFail) score = Math.min(score, 45);
  if (promoFail && cfg.promoScoreCap !== undefined) score = Math.min(score, cfg.promoScoreCap);

  return { score, issues, platformTips: cfg.platformTips };
}
