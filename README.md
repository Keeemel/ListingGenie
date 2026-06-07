# ListingGenie — Free Listing Audit

An instant, free audit tool for e-commerce product listings. Paste a title and description, get a score/100, a list of on-page issues, and AI-powered missing keyword suggestions.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Add your Gemini key (optional — audit still works without it)
cp .env.example .env.local
# Then open .env.local and replace "your_gemini_api_key_here" with your real key

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Where to get a free Gemini API key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create an API key (free tier, no credit card required)
3. Paste it in `.env.local`:

```env
GEMINI_API_KEY=AIza...your_key_here
```

> Without the key the app still runs and shows the full on-page audit (score + issues). Keyword gap analysis is skipped and a notice is shown.

## Deploy on Vercel

```bash
# Push to GitHub, then import in Vercel dashboard
# Add GEMINI_API_KEY as an environment variable in the Vercel project settings
```

Or one-click deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## How it works

| Part | What it does | Needs API? |
|------|-------------|------------|
| **On-page audit** | Checks title length, keyword placement, description depth, structure, keyword stuffing, readability | No |
| **Keyword gaps** | Uses Gemini to suggest 5 high-intent buyer keywords missing from the listing | Yes (free tier) |

## Audit rules & weights (`lib/auditRules.ts`)

All thresholds live in the `CONFIG` object at the top of the file — edit freely:

| Rule | Max points |
|------|-----------|
| Title length (40–70 chars ideal) | 20 |
| Main keyword in title | 15 |
| Main keyword in description | 10 |
| Description length (300–2000 chars ideal) | 20 |
| Structure (bullets / paragraphs) | 10 |
| No keyword stuffing (≤6 repeats, ≤4% density) | 15 |
| Readability (avg sentence ≤30 words) | 10 |

## Swap the LLM provider

The keyword gap logic is isolated in `lib/keywordGaps.ts`. Add a new provider function (e.g. `callOpenAI`) and swap it inside `generateKeywordGaps()` — zero changes needed elsewhere.

## File structure

```
app/
  api/audit/route.ts   — POST endpoint (server-side, key never exposed to client)
  page.tsx             — Single-page UI
  layout.tsx           — Root layout + metadata
  globals.css          — Tailwind import
lib/
  auditRules.ts        — All on-page rules + CONFIG
  keywordGaps.ts       — LLM abstraction (Gemini by default)
types/
  audit.ts             — Shared TypeScript interfaces
```
