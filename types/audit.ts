export type IssueStatus = "pass" | "warn" | "fail";
export type Grade = "A" | "B" | "C" | "D";

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
  skipped?: boolean;
  error?: string;
}

export interface AuditResult {
  score: number;
  grade: Grade;
  issues: Issue[];
  keywordGaps: KeywordGaps;
}

export interface AuditRequest {
  title: string;
  description: string;
  mainKeyword?: string;
}
