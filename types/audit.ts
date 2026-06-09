export type IssueStatus = "pass" | "warn" | "fail";
export type Grade = "A" | "B" | "C" | "D";
export type Platform = "amazon" | "ebay" | "etsy" | "shopify" | "vinted" | "other";

export interface Issue {
  rule: string;
  status: IssueStatus;
  message: string;
  fixTip: string;
  points: number;
}

export interface SuggestedKeyword {
  keyword: string;
  why: string;
}

export interface KeywordGaps {
  mainKeywordHasVolume?: boolean;
  suggestedKeywords: SuggestedKeyword[];
  tags?: string[];              // Etsy: up to 13 tags (≤ 20 chars each)
  backendTerms?: string[];      // Amazon: backend search terms
  isProductListing?: boolean;   // Gemini validation signal
  listingReason?: string;       // Gemini explanation when isProductListing === false
  skipped?: boolean;
  error?: string;
}

export interface AuditResult {
  score: number;
  grade: Grade;
  issues: Issue[];
  keywordGaps: KeywordGaps;
  platform: Platform;
  platformTips: string[];
}

export interface AuditRequest {
  title: string;
  description: string;
  mainKeyword?: string;
  platform?: Platform;
}

// Discriminated union for API responses
export type AuditResponse =
  | { invalid: true; reason: string }
  | AuditResult;
