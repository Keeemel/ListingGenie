export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const VOWELS_RE = /[aeiouAEIOU]/;

function isGibberishWord(w: string): boolean {
  return w.length >= 3 && !VOWELS_RE.test(w);
}

function isRealWord(w: string): boolean {
  return w.length >= 3 && VOWELS_RE.test(w);
}

/**
 * Fast, free heuristic — rejects only obviously non-listing input.
 * Errs heavily toward valid; never blocks a real product listing.
 */
export function heuristicValidate(title: string, description: string): ValidationResult {
  const combined = (title.trim() + " " + description.trim()).trim();
  const words = combined.toLowerCase().match(/[a-z]+/g) ?? [];

  if (combined.length < 10) {
    return { valid: false, reason: "Input is too short to be a product listing." };
  }

  if (words.length > 0) {
    const gibberishRatio = words.filter(isGibberishWord).length / words.length;
    if (gibberishRatio > 0.8) {
      return {
        valid: false,
        reason: "Title and description appear to contain random characters, not a product listing.",
      };
    }
  }

  const uniqueWords = new Set(words);
  if (uniqueWords.size === 1 && combined.length < 40) {
    return {
      valid: false,
      reason: "Title and description appear to be repeated filler text, not a product listing.",
    };
  }

  const uniqueRealWords = new Set(words.filter(isRealWord));
  if (uniqueRealWords.size <= 1 && combined.length < 30) {
    return {
      valid: false,
      reason: "Title and description are too minimal to be a real product listing.",
    };
  }

  return { valid: true };
}
