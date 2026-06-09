# ListingGenie — Automated Test Report

| | |
|---|---|
| **Date** | 2026-06-08 16:37:23 UTC |
| **Gemini model** | `gemini-2.5-flash-lite` |
| **API key** | present ✅ |

## Summary

**11/12 cases conform** — 0 ⚠️ minor discrepancy, 1 ❌ failure

| # | Case | Score | Grade | Expected | Verdict |
|--:|------|------:|:-----:|----------|:-------:|
| 1 | `bad-bottle` | 20 | D | < 35, grade D | ✅ |
| 2 | `good-bottle` | 85 | A | ≥ 80 | ✅ |
| 3 | `stuffed` | 45 | C | < 45 | ✅ |
| 4 | `candle` | 29 | D | grade D | ✅ |
| 5 | `earbuds` | 50 | C | 45–70 | ✅ |
| 6 | `perfect` | 91 | A | = 100, grade A | ❌ |
| 7 | `amazon-promo` | 45 | C | < 70 | ✅ |
| 8 | `ebay-long-title` | 76 | B | — | ✅ |
| 9 | `etsy-no-frontload` | 79 | B | — | ✅ |
| 10 | `garbage-caca` | 0 | D | — | ✅ |
| 11 | `garbage-asdf` | 0 | D | — | ✅ |
| 12 | `shopify-no-cta` | 65 | B | — | ✅ |

## Detailed Results

### CAS 1 — bad-bottle (degraded listing, all rules should fail or skip)

**Score:** 20/100 &nbsp; **Grade:** D &nbsp; **Verdict:** ✅

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

- ✗ `titleLength` **(fail, 0 pts)** — Title is too short (12 chars) — search engines will likely skip it.
  > *Keep your title between 40 and 70 characters.*
- ✗ `keywordInTitle` **(fail, 0 pts)** — Main keyword "insulated water bottle" is missing from the title.
  > *Insert "insulated water bottle" near the beginning of your title.*
- ✗ `keywordInDescription` **(fail, 0 pts)** — Main keyword "insulated water bottle" is absent from the description.
  > *Use "insulated water bottle" naturally at least once in the opening paragraph.*
- ✗ `descriptionLength` **(fail, 0 pts)** — Description is too short (40 chars) to rank well.
  > *Write at least 300 characters addressing: what is it, who is it for, and why buy it.*
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✗ `titleAttributes` **(fail, 0 pts)** — Title has no concrete product attributes (color, size, material, or number).
  > *Add specific details: size (ml, oz, cm), material (stainless steel, bamboo), color, or quantity to increase relevance and click-through.*
- ⚠ `promoLanguage` **(warn, 0 pts)** — Promotional language detected ("Buy now") — may reduce buyer trust.
  > *Replace "Buy now" with specific, factual claims that build credibility.*
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.

</details>

---

### CAS 2 — good-bottle (well-structured, bullets, score ≥ 80)

**Score:** 85/100 &nbsp; **Grade:** A &nbsp; **Verdict:** ✅

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

- ⚠ `titleLength` **(warn, 10 pts)** — Title length is acceptable but not optimal (75 chars, ideal 40–70).
  > *Aim for 40–70 characters to maximize visibility on other.*
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "insulated water bottle" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "insulated water bottle" appears in the description.
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (516 chars).
- ✓ `structure` **(pass, 15 pts)** — Description uses bullet points or clear paragraph breaks.
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 16 words/sentence).
- ✓ `keywordFrontLoad` **(pass, 8 pts)** — Main keyword appears in the first 50% of the title.
- ✓ `titleAttributes` **(pass, 7 pts)** — Title includes concrete product attributes (number, color, material, or size).
- ⚠ `promoLanguage` **(warn, 0 pts)** — Promotional language detected ("guarantee") — may reduce buyer trust.
  > *Replace "guarantee" with specific, factual claims that build credibility.*
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.
- ✓ `benefitsVsSpecs` **(pass, 8 pts)** — Description includes benefit-oriented and use-case language.
- ⚠ `specificity` **(warn, 3 pts)** — Description has only one specific measurement or quantity.
  > *Add more concrete details: dimensions, weight, capacity, quantity, or other measurable specs buyers compare when shopping.*
- ✓ `buyerQuestions` **(pass, 8 pts)** — Description addresses use context and intended audience.

</details>

---

### CAS 3 — stuffed (keyword stuffing — CRITICAL check)

**Score:** 45/100 &nbsp; **Grade:** C &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `keywordStuffing` | fail | fail | 0 | ✅ |

<details><summary>All issues from engine</summary>

- ⚠ `titleLength` **(warn, 10 pts)** — Title length is acceptable but not optimal (73 chars, ideal 40–70).
  > *Aim for 40–70 characters to maximize visibility on other.*
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "insulated water bottle" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "insulated water bottle" appears in the description.
- ⚠ `descriptionLength` **(warn, 10 pts)** — Description is a bit short (202 chars, ideal 300–2000).
  > *Expand to at least 300 characters — cover features, benefits, dimensions, and use cases.*
- ⚠ `structure` **(warn, 0 pts)** — Description reads as a wall of text with no visible structure.
  > *Break content into bullet points (• or -) and short paragraphs for easier scanning.*
- ✗ `keywordStuffing` **(fail, 0 pts)** — Main keyword "insulated water bottle" appears 9× (limit: 4).
  > *Use synonyms and related phrases instead of repeating the same word. Natural copy ranks better.*
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 10 words/sentence).
- ✓ `keywordFrontLoad` **(pass, 8 pts)** — Main keyword appears in the first 50% of the title.
- ✗ `titleAttributes` **(fail, 0 pts)** — Title has no concrete product attributes (color, size, material, or number).
  > *Add specific details: size (ml, oz, cm), material (stainless steel, bamboo), color, or quantity to increase relevance and click-through.*
- ⚠ `promoLanguage` **(warn, 0 pts)** — Promotional language detected ("Best") — may reduce buyer trust.
  > *Replace "Best" with specific, factual claims that build credibility.*
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.
- ✗ `benefitsVsSpecs` **(fail, 0 pts)** — Description reads as a raw spec sheet with no buyer benefits or use cases.
  > *Rewrite at least 2–3 sentences from the buyer's perspective: what problem does this solve? Who is it for? What does it feel like to use?*
- ✗ `specificity` **(fail, 0 pts)** — Description lacks specific measurements or quantities.
  > *Include concrete numbers: dimensions (cm, in), capacity (ml, oz), weight (g, kg, lbs), count (3-pack). Specificity builds trust and reduces returns.*
- ✗ `buyerQuestions` **(fail, 0 pts)** — Description does not answer 'Who is this for?' or 'When/where is it used?'.
  > *Add at least one use-context sentence (e.g. 'great for gym or travel') and one audience sentence (e.g. 'perfect for coffee lovers').*

</details>

---

### CAS 4 — candle (wrong keyword, thin description — Gemini gaps captured)

**Score:** 29/100 &nbsp; **Grade:** D &nbsp; **Verdict:** ✅

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

- ✗ `titleLength` **(fail, 0 pts)** — Title is too short (18 chars) — search engines will likely skip it.
  > *Keep your title between 40 and 70 characters.*
- ✗ `keywordInTitle` **(fail, 0 pts)** — Main keyword "lavender soy candle" is missing from the title.
  > *Insert "lavender soy candle" near the beginning of your title.*
- ✗ `keywordInDescription` **(fail, 0 pts)** — Main keyword "lavender soy candle" is absent from the description.
  > *Use "lavender soy candle" naturally at least once in the opening paragraph.*
- ✗ `descriptionLength` **(fail, 0 pts)** — Description is too short (146 chars) to rank well.
  > *Write at least 300 characters addressing: what is it, who is it for, and why buy it.*
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✗ `titleAttributes` **(fail, 0 pts)** — Title has no concrete product attributes (color, size, material, or number).
  > *Add specific details: size (ml, oz, cm), material (stainless steel, bamboo), color, or quantity to increase relevance and click-through.*
- ✓ `promoLanguage` **(pass, 10 pts)** — No promotional or banned language detected.
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.
- ⚠ `benefitsVsSpecs` **(warn, 3 pts)** — Description is mostly specs with limited benefit or use-case language.
  > *Add phrases like 'perfect for', 'keeps you', 'designed for daily use' — buyers need to visualize how the product improves their life.*
- ✗ `specificity` **(fail, 0 pts)** — Description lacks specific measurements or quantities.
  > *Include concrete numbers: dimensions (cm, in), capacity (ml, oz), weight (g, kg, lbs), count (3-pack). Specificity builds trust and reduces returns.*
- ⚠ `buyerQuestions` **(warn, 3 pts)** — Description covers one of the two key buyer questions (use context or audience).
  > *Make sure your description answers: Who is this for? AND When/where do they use it? Both signals help buyers self-qualify.*

</details>

**Missing Keywords (Gemini):**

  - `lavender scented candle for relaxation` — Shoppers are looking for candles that specifically promote relaxation.
  - `natural soy wax candle lavender` — Buyers want to ensure the candle is made from natural soy wax.
  - `long burning lavender candle` — Customers are interested in the candle's burn time for value.
  - `calming aromatherapy candle` — Searches indicate a desire for candles with aromatherapy benefits.
  - `gift idea lavender candle` — This phrase targets shoppers looking for gift options.

---

### CAS 5 — earbuds (single-sentence wall of text — readability stress test)

**Score:** 50/100 &nbsp; **Grade:** C &nbsp; **Verdict:** ✅

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

- ✗ `titleLength` **(fail, 0 pts)** — Title is too short (16 chars) — search engines will likely skip it.
  > *Keep your title between 40 and 70 characters.*
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "wireless earbuds" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "wireless earbuds" appears in the description.
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (440 chars).
- ⚠ `structure` **(warn, 0 pts)** — Description reads as a wall of text with no visible structure.
  > *Break content into bullet points (• or -) and short paragraphs for easier scanning.*
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✗ `readability` **(fail, 0 pts)** — Average sentence is 78 words — extremely difficult to read.
  > *Break these long sentences aggressively. Use bullet points. Target under 20 words per sentence.*
- ✗ `titleAttributes` **(fail, 0 pts)** — Title has no concrete product attributes (color, size, material, or number).
  > *Add specific details: size (ml, oz, cm), material (stainless steel, bamboo), color, or quantity to increase relevance and click-through.*
- ✓ `promoLanguage` **(pass, 10 pts)** — No promotional or banned language detected.
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.
- ✗ `benefitsVsSpecs` **(fail, 0 pts)** — Description reads as a raw spec sheet with no buyer benefits or use cases.
  > *Rewrite at least 2–3 sentences from the buyer's perspective: what problem does this solve? Who is it for? What does it feel like to use?*
- ✗ `specificity` **(fail, 0 pts)** — Description lacks specific measurements or quantities.
  > *Include concrete numbers: dimensions (cm, in), capacity (ml, oz), weight (g, kg, lbs), count (3-pack). Specificity builds trust and reduces returns.*
- ⚠ `buyerQuestions` **(warn, 3 pts)** — Description covers one of the two key buyer questions (use context or audience).
  > *Make sure your description answers: Who is this for? AND When/where do they use it? Both signals help buyers self-qualify.*

</details>

---

### CAS 6 — perfect (ideal listing — all rules pass, score = 100)

**Score:** 91/100 &nbsp; **Grade:** A &nbsp; **Verdict:** ❌

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

- ✓ `titleLength` **(pass, 20 pts)** — Title length is ideal for other (59 chars, target 40–70).
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "insulated water bottle" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "insulated water bottle" appears in the description.
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (1007 chars).
- ✓ `structure` **(pass, 15 pts)** — Description uses bullet points or clear paragraph breaks.
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 14 words/sentence).
- ✓ `keywordFrontLoad` **(pass, 8 pts)** — Main keyword appears in the first 50% of the title.
- ✓ `titleAttributes` **(pass, 7 pts)** — Title includes concrete product attributes (number, color, material, or size).
- ⚠ `promoLanguage` **(warn, 0 pts)** — Promotional language detected ("guarantee") — may reduce buyer trust.
  > *Replace "guarantee" with specific, factual claims that build credibility.*
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.
- ✓ `benefitsVsSpecs` **(pass, 8 pts)** — Description includes benefit-oriented and use-case language.
- ⚠ `specificity` **(warn, 3 pts)** — Description has only one specific measurement or quantity.
  > *Add more concrete details: dimensions, weight, capacity, quantity, or other measurable specs buyers compare when shopping.*
- ✓ `buyerQuestions` **(pass, 8 pts)** — Description addresses use context and intended audience.

</details>

**Discrepancies:**

- ❗ Score 91 < expected min 100

---

### CAS 7 — amazon-promo (Amazon title with 'best' → promoLanguage FAIL + score cap 70)

**Score:** 45/100 &nbsp; **Grade:** C &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `promoLanguage` | fail | fail | 0 | ✅ |

<details><summary>All issues from engine</summary>

- ✓ `titleLength` **(pass, 20 pts)** — Title length is ideal for amazon (91 chars, target 80–150).
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "insulated water bottle" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "insulated water bottle" appears in the description.
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (518 chars).
- ✓ `structure` **(pass, 15 pts)** — Description uses bullet points or clear paragraph breaks.
- ✗ `keywordStuffing` **(fail, 0 pts)** — Main keyword "insulated water bottle" appears 3× (limit: 4).
  > *Use synonyms and related phrases instead of repeating the same word. Natural copy ranks better.*
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 14 words/sentence).
- ✓ `keywordFrontLoad` **(pass, 8 pts)** — Main keyword appears in the first 40% of the title.
- ✓ `titleAttributes` **(pass, 7 pts)** — Title includes concrete product attributes (number, color, material, or size).
- ✗ `promoLanguage` **(fail, 0 pts)** — Banned promotional language detected ("Best") — Amazon can suppress or de-rank listings containing this.
  > *Remove all promotional terms (best, sale, guarantee, %, free shipping, #1, deal) from title and description. Amazon's policy prohibits them.*
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.
- ✓ `benefitsVsSpecs` **(pass, 8 pts)** — Description includes benefit-oriented and use-case language.
- ⚠ `specificity` **(warn, 3 pts)** — Description has only one specific measurement or quantity.
  > *Add more concrete details: dimensions, weight, capacity, quantity, or other measurable specs buyers compare when shopping.*
- ✓ `buyerQuestions` **(pass, 8 pts)** — Description addresses use context and intended audience.
- ✓ `amazonBullets` **(pass, 12 pts)** — 5 bullet points found — Amazon recommends exactly 5.

</details>

---

### CAS 8 — ebay-long-title (eBay title > 80 chars → titleLength FAIL)

**Score:** 76/100 &nbsp; **Grade:** B &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `titleLength` | fail | fail | 0 | ✅ |

<details><summary>All issues from engine</summary>

- ✗ `titleLength` **(fail, 0 pts)** — Title is too long (99 chars) — eBay hard-limits titles to 80 characters.
  > *Trim your title to 80 characters maximum. Prioritize the most searchable keywords.*
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "airpods pro" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "airpods pro" appears in the description.
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (537 chars).
- ✓ `structure` **(pass, 15 pts)** — Description uses bullet points or clear paragraph breaks.
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 12 words/sentence).
- ✓ `keywordFrontLoad` **(pass, 8 pts)** — Main keyword appears in the first 45% of the title.
- ⚠ `titleAttributes` **(warn, 3 pts)** — Title has only one concrete attribute — add more specifics.
  > *Include at least 2 concrete details (e.g. '750ml Stainless Steel' or 'Large Black Cotton') to help buyers qualify your product at a glance.*
- ✓ `promoLanguage` **(pass, 10 pts)** — No promotional or banned language detected.
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.
- ✗ `specificity` **(fail, 0 pts)** — Description lacks specific measurements or quantities.
  > *Include concrete numbers: dimensions (cm, in), capacity (ml, oz), weight (g, kg, lbs), count (3-pack). Specificity builds trust and reduces returns.*
- ⚠ `ebayItemSpecifics` **(warn, 5 pts)** — Only 2/5 item specifics mentioned in description. Missing: brand, size, color.
  > *Add brand, size, color, condition, and model/type to your description and eBay's Item Specifics fields — Cassini search ranks complete listings higher.*

</details>

---

### CAS 9 — etsy-no-frontload (Etsy: main keyword buried in title → keywordFrontLoad WARN/FAIL)

**Score:** 79/100 &nbsp; **Grade:** B &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `keywordFrontLoad` | warn | warn | 0 | ✅ |

<details><summary>All issues from engine</summary>

- ⚠ `titleLength` **(warn, 10 pts)** — Title length is acceptable but not optimal (56 chars, ideal 60–140).
  > *Aim for 60–140 characters to maximize visibility on etsy.*
- ✓ `keywordInTitle` **(pass, 15 pts)** — Main keyword "lavender soy candle" is present in the title.
- ✓ `keywordInDescription` **(pass, 10 pts)** — Main keyword "lavender soy candle" appears in the description.
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (563 chars).
- ✓ `structure` **(pass, 15 pts)** — Description uses bullet points or clear paragraph breaks.
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 11 words/sentence).
- ⚠ `keywordFrontLoad` **(warn, 0 pts)** — Main keyword appears too late in the title (position 25/56).
  > *Move "lavender soy candle" to the first 35% of your title for maximum search-algorithm weight.*
- ⚠ `titleAttributes` **(warn, 3 pts)** — Title has only one concrete attribute — add more specifics.
  > *Include at least 2 concrete details (e.g. '750ml Stainless Steel' or 'Large Black Cotton') to help buyers qualify your product at a glance.*
- ✓ `promoLanguage` **(pass, 10 pts)** — No promotional or banned language detected.
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.
- ✗ `benefitsVsSpecs` **(fail, 0 pts)** — Description reads as a raw spec sheet with no buyer benefits or use cases.
  > *Rewrite at least 2–3 sentences from the buyer's perspective: what problem does this solve? Who is it for? What does it feel like to use?*
- ⚠ `buyerQuestions` **(warn, 3 pts)** — Description covers one of the two key buyer questions (use context or audience).
  > *Make sure your description answers: Who is this for? AND When/where do they use it? Both signals help buyers self-qualify.*
- ✓ `etsyAttributes` **(pass, 10 pts)** — Listing mentions materials, occasions, or recipient — all important Etsy search signals.

</details>

---

### CAS 11 — garbage-caca (heuristic must reject 'caca')

**Score:** 0/100 &nbsp; **Grade:** D &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|

<details><summary>All issues from engine</summary>


</details>

---

### CAS 12 — garbage-asdf (heuristic must reject keyboard mash)

**Score:** 0/100 &nbsp; **Grade:** D &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|

<details><summary>All issues from engine</summary>


</details>

---

### CAS 10 — shopify-no-cta (Shopify: description has no call-to-action → shopifyMetaDesc WARN)

**Score:** 65/100 &nbsp; **Grade:** B &nbsp; **Verdict:** ✅

| Rule | Expected | Actual | Pts | Match |
|------|:--------:|:------:|----:|:-----:|
| `shopifyMetaDesc` | warn | warn | 5 | ✅ |

<details><summary>All issues from engine</summary>

- ⚠ `titleLength` **(warn, 10 pts)** — Title length is acceptable but not optimal (30 chars, ideal 50–60).
  > *Aim for 50–60 characters to maximize visibility on shopify.*
- ✗ `keywordInTitle` **(fail, 0 pts)** — Main keyword "linen pillow cover" is missing from the title.
  > *Insert "linen pillow cover" near the beginning of your title.*
- ✗ `keywordInDescription` **(fail, 0 pts)** — Main keyword "linen pillow cover" is absent from the description.
  > *Use "linen pillow cover" naturally at least once in the opening paragraph.*
- ✓ `descriptionLength` **(pass, 20 pts)** — Description length is ideal (571 chars).
- ✓ `structure` **(pass, 15 pts)** — Description uses bullet points or clear paragraph breaks.
- ✓ `keywordStuffing` **(pass, 15 pts)** — No keyword stuffing detected.
- ✓ `readability` **(pass, 15 pts)** — Good readability (avg 15 words/sentence).
- ✓ `titleAttributes` **(pass, 7 pts)** — Title includes concrete product attributes (number, color, material, or size).
- ✓ `promoLanguage` **(pass, 10 pts)** — No promotional or banned language detected.
- ✓ `allCaps` **(pass, 5 pts)** — Title capitalization looks normal.
- ⚠ `benefitsVsSpecs` **(warn, 3 pts)** — Description is mostly specs with limited benefit or use-case language.
  > *Add phrases like 'perfect for', 'keeps you', 'designed for daily use' — buyers need to visualize how the product improves their life.*
- ⚠ `specificity` **(warn, 3 pts)** — Description has only one specific measurement or quantity.
  > *Add more concrete details: dimensions, weight, capacity, quantity, or other measurable specs buyers compare when shopping.*
- ✗ `buyerQuestions` **(fail, 0 pts)** — Description does not answer 'Who is this for?' or 'When/where is it used?'.
  > *Add at least one use-context sentence (e.g. 'great for gym or travel') and one audience sentence (e.g. 'perfect for coffee lovers').*
- ⚠ `shopifyMetaDesc` **(warn, 5 pts)** — Opening sentence could work as a meta, but no clear call to action found.
  > *Write a punchy first sentence (50–160 chars) for Google snippets, and end the description with a CTA like 'Order today and get free delivery'.*

</details>

---

## Regressions / Écarts

- **`perfect`** — Score 91 < expected min 100

## Recommendations

1. **Investigate CAS 6 score (91 ≠ 100)** — the "perfect" listing should score 100. Rules that cost points: `promoLanguage` (warn, 0 pts), `specificity` (warn, 3 pts).
