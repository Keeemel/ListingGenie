# ListingGenie — Automated Test Report

| | |
|---|---|
| **Date** | 2026-06-07 16:06:22 UTC |
| **Gemini model** | `gemini-2.5-flash-lite` |
| **API key** | present ✅ |

## Summary

**6/6 cases conform** — 0 ⚠️ minor discrepancy, 0 ❌ failure

| # | Case | Score | Grade | Expected | Verdict |
|--:|------|------:|:-----:|----------|:-------:|
| 1 | `bad-bottle` | 19 | D | < 35, grade D | ✅ |
| 2 | `good-bottle` | 91 | A | ≥ 80 | ✅ |
| 3 | `stuffed` | 45 | C | < 45 | ✅ |
| 4 | `candle` | 19 | D | grade D | ✅ |
| 5 | `earbuds` | 55 | C | 45–70 | ✅ |
| 6 | `perfect` | 100 | A | = 100, grade A | ✅ |

## Detailed Results

### CAS 1 — bad-bottle (degraded listing, all rules should fail or skip)

**Score:** 19/100 &nbsp; **Grade:** D &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `titleLength` | fail | fail | 0 | ✅ |
| `keywordInTitle` | fail | fail | 0 | ✅ |
| `keywordInDescription` | fail | fail | 0 | ✅ |
| `descriptionLength` | fail | fail | 0 | ✅ |
| `structure` | skipped | skipped | — | ✅ |
| `readability` | skipped | skipped | — | ✅ |
| `keywordStuffing` | pass | pass | 15 | ✅ |

<details><summary>All issues from engine</summary>

- ✗ `titleLength` **(fail, 0 pts)** — Title is too short (12 chars) — search engines may skip it.
  > *Keep your title between 40 and 70 characters.*
- ✗ `keywordInTitle` **(fail, 0 pts)** — Main keyword "insulated water bottle" is missing from the title.
  > *Insert "insulated water bottle" near the beginning of your title for maximum SEO impact.*
- ✗ `keywordInDescription` **(fail, 0 pts)** — Main keyword "insulated water bottle" is absent from the description.
  > *Use "insulated water bottle" naturally at least once in the opening paragraph.*
- ✗ `descriptionLength` **(fail, 0 pts)** — Description is too short (40 chars) to rank well.
  > *Write at least 300 characters. Address buyer questions: what is it, who is it for, why buy it?*
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.

</details>

---

### CAS 2 — good-bottle (well-structured, bullets, score ≥ 80)

**Score:** 91/100 &nbsp; **Grade:** A &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `titleLength` | warn | warn | 10 | ✅ |
| `keywordInTitle` | pass | pass | 15 | ✅ |
| `keywordInDescription` | pass | pass | 10 | ✅ |
| `descriptionLength` | pass | pass | 20 | ✅ |
| `structure` | pass | pass | 15 | ✅ |
| `keywordStuffing` | pass | pass | 15 | ✅ |
| `readability` | pass | pass | 15 | ✅ |

<details><summary>All issues from engine</summary>

- ⚠ `titleLength` **(warn, 10 pts)** — Title length is acceptable but not optimal (75 chars).
  > *Aim for 40–70 characters for best visibility in search results.*
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "insulated water bottle" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "insulated water bottle" appears in the description.
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (516 chars).
- ✓ `structure` **(pass, 15 pts)** — Description uses bullet points or clear paragraph breaks.
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 16 words/sentence).

</details>

---

### CAS 3 — stuffed (keyword stuffing — CRITICAL check)

**Score:** 45/100 &nbsp; **Grade:** C &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `keywordStuffing` | fail | fail | 0 | ✅ |

<details><summary>All issues from engine</summary>

- ⚠ `titleLength` **(warn, 10 pts)** — Title length is acceptable but not optimal (73 chars).
  > *Aim for 40–70 characters for best visibility in search results.*
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "insulated water bottle" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "insulated water bottle" appears in the description.
- ⚠ `descriptionLength` **(warn, 10 pts)** — Description is a bit short (202 chars).
  > *Expand to at least 300 characters — cover features, benefits, dimensions, and use cases.*
- ✗ `keywordStuffing` **(fail, 0 pts)** — Main keyword "insulated water bottle" appears 9× (limit: 4).
  > *Use synonyms and related phrases instead of repeating the same word. Natural copy ranks better.*
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 10 words/sentence).

</details>

---

### CAS 4 — candle (wrong keyword, thin description — Gemini gaps captured)

**Score:** 19/100 &nbsp; **Grade:** D &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `titleLength` | fail | fail | 0 | ✅ |
| `keywordInTitle` | fail | fail | 0 | ✅ |
| `keywordInDescription` | fail | fail | 0 | ✅ |
| `descriptionLength` | fail | fail | 0 | ✅ |
| `structure` | skipped | skipped | — | ✅ |
| `readability` | skipped | skipped | — | ✅ |
| `keywordStuffing` | pass | pass | 15 | ✅ |

<details><summary>All issues from engine</summary>

- ✗ `titleLength` **(fail, 0 pts)** — Title is too short (18 chars) — search engines may skip it.
  > *Keep your title between 40 and 70 characters.*
- ✗ `keywordInTitle` **(fail, 0 pts)** — Main keyword "lavender soy candle" is missing from the title.
  > *Insert "lavender soy candle" near the beginning of your title for maximum SEO impact.*
- ✗ `keywordInDescription` **(fail, 0 pts)** — Main keyword "lavender soy candle" is absent from the description.
  > *Use "lavender soy candle" naturally at least once in the opening paragraph.*
- ✗ `descriptionLength` **(fail, 0 pts)** — Description is too short (146 chars) to rank well.
  > *Write at least 300 characters. Address buyer questions: what is it, who is it for, why buy it?*
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.

</details>

**Missing Keywords (Gemini):**

  - `lavender scented candle for relaxation` — Shoppers are looking for a candle specifically for relaxation purposes.
  - `natural soy wax candle lavender` — Buyers want to ensure the candle is made from natural soy wax and has a lavender scent.
  - `long burning lavender candle` — Customers are interested in the candle's burn time and its lavender fragrance.
  - `lavender aromatherapy candle gift` — People are searching for lavender candles as gifts with aromatherapy benefits.
  - `calming lavender home fragrance` — Shoppers seek a calming scent for their home environment, specifically lavender.

---

### CAS 5 — earbuds (single-sentence wall of text — readability stress test)

**Score:** 55/100 &nbsp; **Grade:** C &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `titleLength` | fail | fail | 0 | ✅ |
| `keywordInTitle` | pass | pass | 15 | ✅ |
| `keywordInDescription` | pass | pass | 10 | ✅ |
| `descriptionLength` | pass | pass | 20 | ✅ |
| `structure` | warn | warn | 0 | ✅ |
| `keywordStuffing` | pass | pass | 15 | ✅ |
| `readability` | fail | fail | 0 | ✅ |

<details><summary>All issues from engine</summary>

- ✗ `titleLength` **(fail, 0 pts)** — Title is too short (16 chars) — search engines may skip it.
  > *Keep your title between 40 and 70 characters.*
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "wireless earbuds" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "wireless earbuds" appears in the description.
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (440 chars).
- ⚠ `structure` **(warn, 0 pts)** — Description reads as a wall of text with no visible structure.
  > *Break content into bullet points (• or -) and short paragraphs to improve scannability.*
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✗ `readability` **(fail, 0 pts)** — Average sentence is 78 words — extremely difficult to read.
  > *Break these long sentences aggressively. Use bullet points for lists. Target under 20 words per sentence.*

</details>

---

### CAS 6 — perfect (ideal listing — all rules pass, score = 100)

**Score:** 100/100 &nbsp; **Grade:** A &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `titleLength` | pass | pass | 20 | ✅ |
| `keywordInTitle` | pass | pass | 15 | ✅ |
| `keywordInDescription` | pass | pass | 10 | ✅ |
| `descriptionLength` | pass | pass | 20 | ✅ |
| `structure` | pass | pass | 15 | ✅ |
| `keywordStuffing` | pass | pass | 15 | ✅ |
| `readability` | pass | pass | 15 | ✅ |

<details><summary>All issues from engine</summary>

- ✓ `titleLength` **(pass, 20 pts)** — Title length is ideal (59 chars).
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "insulated water bottle" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "insulated water bottle" appears in the description.
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (1007 chars).
- ✓ `structure` **(pass, 15 pts)** — Description uses bullet points or clear paragraph breaks.
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 14 words/sentence).

</details>

---

## Regressions / Écarts

✅ No discrepancies — all expected behaviors match exactly.

## Recommendations

1. All critical paths pass. Consider extending the suite with boundary cases: empty title, 2001-char description (above ideal max), keyword density exactly at 3%, and a description with exactly 3 line-breaks but no bullet characters.
