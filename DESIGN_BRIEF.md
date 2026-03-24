# DESIGN_BRIEF.md
## Design Resource Library — Project Brief

**Author:** Xiaoyang Hu · xiaoyanghu.com  
**Last updated:** March 2026

---

## 1. Project Overview

A standalone website that shares the design resources, tools, and references behind the making of xiaoyanghu.com. The site is both a curated resource library and a personal build log — positioned as "here's what I used and why" rather than a generic link aggregator.

**Target audience:** Designers and anyone learning web coding who wants to improve their aesthetic sensibility and discover tools they might not know.

**Core value proposition:** This is not a bookmarks dump. Every resource is here because it earned its place — filtered through real usage, with a personal note explaining the context.

---

## 2. Content Structure

All content is stored in **`public/data/data.json`** (served at `/data/data.json`) and maintained via Google Sheets (export CSV → run `npm run csv-to-json`). Each item has: `category`, `name`, `url`, `note`, `tier`, `handle` (X only), `bio` (X only), optional `localImg`.

### Six categories (rendered as tabs):

| Tab | Content |
|-----|---------|
| **X Accounts** | 69 designers to follow for daily aesthetic intake |
| **Design Inspiration** | Visual reference, motion galleries, tools, personal sites |
| **UI Components** | Front-end component libraries most designers haven't heard of |
| **Framer Resources** | Components, templates, UI kits within the Framer ecosystem |
| **Portfolio Inspiration** | 35 curated designer portfolio sites, entry–mid level |
| **Portfolio Platforms** | 3 aggregator platforms for browsing portfolios at scale |

### Tier system (two tiers only):

- **Tier 1 ★** — Must see. Displayed first, marked with a star.
- **Tier 2** — Worth exploring. Displayed after tier 1, no special marking.

Tier distinction is communicated through **ordering + star icon only** — no visual dividers or section labels between tiers.

---

## 3. Visual Concept

### Core concept: X (Twitter) clone
The site is a pixel-faithful recreation of X's interface — three-column layout, dark theme, tweet-style resource cards, tab navigation. The meta joke: a site about design resources that looks like the place where designers actually discover things.

### Layout structure (mirroring X exactly):

```
┌─────────────────────────────────────────────────────┐
│  Monitor frame (dark, on textured desktop background) │
│  ┌───────────────────────────────────────────────────┐│
│  │ ┌──────┬──────────────────────┬────────────────┐  ││
│  │ │ Left │   Main feed          │  Right sidebar │  ││
│  │ │ nav  │                      │                │  ││
│  │ │      │  [Tab: X Accounts]   │  Search bar    │  ││
│  │ │  ✦   │  [Tab: Inspo]        │                │  ││
│  │ │  🏠  │  [Tab: Components]   │  Trending in   │  ││
│  │ │  🔍  │  [Tab: Framer]       │  Design        │  ││
│  │ │  🔔  │  [Tab: Portfolios]   │                │  ││
│  │ │  👤  │  [Tab: Platforms]    │  Hire / Skill / │  ││
│  │ │      │                      │  poll widgets  │  ││
│  │ │      │  ── Resource feed ── │                │  ││
│  │ └──────┴──────────────────────┴────────────────┘  ││
│  └───────────────────────────────────────────────────┘│
│                  [monitor stand]                       │
└─────────────────────────────────────────────────────┘
```

### Each resource = one "tweet":
- Avatar (favicon or generated initials with consistent color)
- Name + handle + timestamp (relative, e.g. "2h")
- Personal note as tweet body
- Website screenshot preview card (Microlink embed URL at runtime; optional static `localImg` in data)
- Action bar: 💬 comments · 🔁 reposts · ♡/♥ likes · 🔖 bookmarks

### Additional UI elements:
- **Left nav:** ✦ logo, Home, Explore, Notifications, Profile
- **Compose box:** "Know a great resource?" (disabled for logged-out users)
- **Right sidebar:** Search, hire card, Claude Skill install, poll, footer links (no login UI in current build)
- **✦ verified badge** on tier 1 items (in place of X's blue checkmark)

### Outer frame:
The X interface sits inside a monitor/screen frame, which sits on a textured desktop background. Gives the impression of "looking at someone's screen."

---

## 4. Interaction Design

### Tab navigation
Each tab = one resource category. Clicking a tab switches the feed. URL updates to reflect active tab (e.g. `/resources/inspo`).

### Likes (current build)
Tweet-style like counts with optimistic UI; **localStorage** in v1-style implementation (see app code). Supabase persistence is a future option.

### Comments (v2)
Not shipped in current UI — possible future layer with auth.

### Login / OAuth
**Not in the current codebase** (no login panel). v2 may add Supabase Auth (GitHub / Google) for comments and saved lists.

### Screenshot previews
- **Runtime:** Microlink screenshot URL in `ScreenshotCard`, with loading / error fallback to domain text
- **Optional:** `localImg` in JSON → file under `public/`; folder `public/screenshots/` for manually cached images

---

## 5. Bonus Feature: SKILL.md

A downloadable `SKILL.md` file — formatted for Claude's memory/skills system — that distills the resource library into a prompt-ready format. Users can drop this file into their Claude setup and ask questions like "I'm building a Framer portfolio, where should I start?"

Presented as a **hidden easter egg** on the site: subtle link in the footer or right sidebar, framed as "for the nerds."

---

## 6. Tech Stack (planned)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js (App Router) | SSG for fast load, easy deployment |
| Styling | Tailwind CSS | Utility-first, fast to build X clone |
| Data | `public/data/data.json` (from Google Sheets CSV) | Zero-infra, easy to maintain |
| Screenshots | Microlink runtime URLs + optional `localImg` | No batch script in repo yet |
| Auth | NextAuth.js (GitHub + Google) | Simple OAuth setup |
| Database | Supabase (free tier) | Likes, comments, user data |
| Deployment | Vercel | One-click, integrates with Next.js |

---

## 7. Content Maintenance Workflow

```
Edit in Google Sheets
       ↓
Export as CSV
       ↓
Run: `npm run csv-to-json` → writes `public/data/data.json`
       ↓
(Optional) add/update `localImg` paths and assets under `public/`
       ↓
Commit + push → Vercel auto-deploys
```

Adding a new resource = add one row in Google Sheets. Everything else is scripted.

---

## 8. Open Questions / Future Scope

- **v2: User-submitted resources** — logged-in users can suggest resources, pending review
- **v2: Personal lists** — users can save their own collections
- **Internationalization** — content is in English; UI could support Chinese
- **Mobile layout** — X mobile view is a known pattern, could adapt

---

## 9. Design Decisions Log

| Decision | Rationale |
|----------|-----------|
| X clone (not Figma/FigJam) | Most natural fit for content; meta humor; familiar to target audience |
| Two tiers only (not three) | Everything in the list is already curated — three tiers implies tier 3 isn't worth seeing |
| Star icon for tier 1, no dividers | Subtle distinction; doesn't break the feed flow |
| Monitor frame around X UI | Adds depth; feels like "looking at someone's screen"; reinforces the web-design context |
| Microlink for screenshots | Zero manual work; automated at build time; consistent quality |
| Google Sheets as CMS | Best editing UX for tabular data; CSV export is trivial; no lock-in |
| Supabase for likes/comments | Free tier is generous; real-time capable for future use; easy Auth integration |
| SKILL.md as easter egg | Niche appeal; conversation starter; differentiates from other resource sites |
