# PRD — Design Resource Library
**Author:** Xiaoyang Hu · xiaoyanghu.com  
**Status:** Ready for development  
**Last updated:** 2025

---

## 1. Overview

A standalone website that shares the design resources, tools, and people that shaped Xiaoyang's portfolio and aesthetic. The core value is not just the links — it's the curation, the personal commentary, and the context of *when and why* each resource was useful.

The site is built around a single creative concept: **a pixel-perfect X (Twitter) clone**, where each resource is a "tweet" in a feed, organized by category tabs. Users can like, comment, and eventually log in.

A downloadable **SKILL.md** file (for use with Claude) is included as a hidden bonus feature.

---

## 2. Target Audience

- Designers learning web coding
- Entry-level / mid-level product designers
- Anyone building a portfolio for the first time
- Web coding enthusiasts who want to improve their aesthetic

---

## 3. Core Concept

### The X (Twitter) metaphor

| X Element | This site |
|-----------|-----------|
| Tab bar (For You / Following) | Resource categories |
| Tweet card | Each resource |
| Avatar + username | Resource name + domain |
| Tweet body | Xiaoyang's personal note / recommendation |
| Link preview card | Microlink screenshot of the website |
| ♥ Like / 💬 Comment / ★ Bookmark | Real user interactions |
| Verified checkmark (✦) | Tier 1 "must see" badge |

### Layout

Three-column X layout:
- **Left:** Icon navigation sidebar (Home, Explore, Notifications, Profile)
- **Center:** Main feed with category tabs + resource tweets
- **Right:** Search bar, trending tags, login/signup panel

### Outer shell

The X interface sits inside a **monitor frame**, on top of a minimal desktop background. This creates the impression of "looking at a screen within a screen" — making the X parody feel intentional and theatrical.

---

## 4. Content Structure

All content is sourced from `public/data/data.json` (generated from Google Sheets via `scripts/csv-to-json.js`, loaded at `/data/data.json`).

### Categories (tabs)

1. **X Accounts** — Designers worth following on X
2. **Design Inspiration** — Visual reference and aesthetic training sites
3. **UI Components** — Front-end component libraries
4. **Framer Resources** — Framer-specific tools and templates
5. **Portfolios** — Designer portfolio sites for inspiration
6. **Portfolio Platforms** — Aggregator sites for browsing portfolios

### Resource card fields (from `public/data/data.json`)

```json
{
  "name": "Design Spells",
  "url": "https://www.designspells.com",
  "note": "A library of design details that feel like magic moments.",
  "tier": 1,
  "category": "design-inspiration"
}
```

X Accounts also have:
```json
{
  "handle": "@samdape",
  "bio": "making things · sam-peitz.com"
}
```

### Tier system

- **Tier 1** — "Must see": shown first, marked with ✦ badge, sorted to top
- **Tier 2** — "Worth exploring": shown after tier 1, no badge

---

## 5. Detailed UI Spec

### 5.1 Monitor + Desktop Shell

- Background: dark, minimal — something like `#1a1a2e` or a muted dark gradient
- Monitor frame: dark bezel, rounded corners, with a monitor stand at the bottom
- The X app fills the entire screen area inside the monitor

### 5.2 Left Sidebar (X nav)

- Logo: ✦ (Xiaoyang's mark, replaces X bird)
- Nav icons: Home, Explore, Notifications, Profile (icon-only, no labels)
- Bottom: More (•••)
- Width: ~72px

### 5.3 Center Feed

**Feed header (sticky)**
- Title: "Design Resources"
- Tabs: one per category, horizontally scrollable
- Active tab: white text + blue bottom border (matching X exactly)

**Compose box** (decorative, non-functional in v1)
- Avatar placeholder + "Know a great resource?" input
- "Post" button (disabled state)

**Resource tweets (sorted: tier 1 first)**

For non-X-account resources:
```
[Avatar with resource initial]  [Name] ✦  [domain]  ·  [time ago]
[Xiaoyang's personal note text]
[Link preview card]
  [Screenshot image — via Microlink API]
  [Domain]
  [Resource name]
[♡ Comments count]  [⟳ Reposts]  [♡ Likes count]  [🔖 Bookmark]
```

For X accounts:
```
[Avatar with initials]  [Name] ✦  [@handle]  ·  [time ago]
[Xiaoyang's personal note text]
[Bio line]
[♡ Comments]  [⟳ Reposts]  [♡ Likes]  [🔖]
```

**Screenshot previews:**
- Source: `https://api.microlink.io/?url={URL}&screenshot=true&meta=false&embed=screenshot.url`
- Loading state: skeleton / "Loading preview..."
- Error state: show domain name as fallback text
- Recommended: pre-generate and cache screenshots at build time to avoid API rate limits

### 5.4 Right Sidebar

- **Search bar**: decorative in v1 (no backend search yet)
- **Trending panel**: hardcoded design-related trending topics (#WebCoding, #FramerComponents, #PortfolioDesign, etc.)
- **Auth / login UI** — not in the current codebase; v2 may add Supabase OAuth (see §11).

### 5.5 Bookmarks bar — not shipped

A Chrome-style bookmarks bar was originally spec’d (secondary nav: portfolio, LinkedIn, About / How to use modals, suggest link). **`BookmarksBar` was removed** — it was never wired into the app. Comparable entry points today: **Suggest new** (left sidebar), **account menu** (X profile + personal site), and **pinned home posts** (e.g. how-to copy in the feed).

---

## 6. Interactions

### Likes (v1 — optimistic, local state)
- Click ♡ → turns pink (♥), count +1
- Click again → undo
- In v1, likes are stored in localStorage (no backend)
- In v2, likes sync to Supabase after login

### Comments (v2)
- Click comment icon → expands inline comment thread
- Requires login

### Login (v2)
- GitHub OAuth via Supabase Auth
- Google OAuth via Supabase Auth
- On login: likes and bookmarks persist to user account

### Tab switching
- Click tab → feed re-renders with that category's resources
- URL updates: `/resources/x`, `/resources/inspo`, etc.

---

## 7. Data & Content Management

### Source of truth: Google Sheets
- URL: *(your Google Sheet link)*
- Columns: `category / name / url / note / tier / handle / bio`

### Workflow
1. Edit resources in Google Sheets
2. Export as CSV
3. Run `scripts/csv-to-json.js` → outputs `public/data/data.json` (served at `/data/data.json`)
4. Commit and deploy

### Screenshot previews
Cards use **Microlink screenshot URLs at runtime** (`ScreenshotCard`), with optional `localImg` from `public/data/data.json` when present. There is **no** `fetch-screenshots.js` in this repo; a future script could batch-download into `public/screenshots/` if you hit rate limits.

---

## 8. SKILL.md Bonus Feature

A downloadable `SKILL.md` file that teaches Claude how to recommend design resources based on Xiaoyang's curation system.

- Accessible via footer links, the Claude Skill card (right sidebar), or `SKILL.md` route
- Framed as an easter egg: "Use this with Claude to get personalized resource recommendations"
- Content: distilled version of all 6 categories + tier 1 picks + usage context

---

## 9. Tech Stack (recommended)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js (App Router) | File-based routing, easy deployment |
| Styling | Tailwind CSS | Fast iteration, consistent spacing |
| Data | `public/data/data.json` (static, `/data/data.json`) | Simple, no backend needed for v1 |
| Screenshots | Microlink embed URLs (+ optional `localImg`) | Runtime previews; optional static cache later |
| Auth (v2) | Supabase Auth | GitHub + Google OAuth, free tier |
| DB (v2) | Supabase (Postgres) | Likes, comments, bookmarks |
| Deployment | Vercel | Free, instant deploys from GitHub |

---

## 10. File Structure

```
/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page — monitor + X shell
│   │   └── layout.tsx
│   ├── components/               # XShell, FeedTabs, TweetCard, SuggestModal, PollCard, etc.
│   ├── lib/
│   │   └── supabase.ts           # Optional client (polls, suggestions when env set)
│   └── types.ts
├── public/
│   ├── data/
│   │   └── data.json             # All resource content (fetched at runtime)
│   └── screenshots/              # Pre-cached website screenshots
├── scripts/
│   └── csv-to-json.js            # Google Sheets CSV → public/data/data.json
└── SKILL.md                      # Claude skill file (public download)
```

---

## 11. Phases

### v1 — MVP (build this first)
- [ ] Monitor + desktop shell
- [ ] Full X layout (3 columns)
- [ ] Category tabs
- [ ] Resource tweet cards with screenshot previews
- [ ] Tier 1 badge + sorting
- [ ] Like button (localStorage)
- [ ] SKILL.md download

### v2 — Social features
- [ ] GitHub / Google login via Supabase
- [ ] Likes persist to database
- [ ] Comments
- [ ] Bookmarks (save resources to your profile)
- [ ] "Suggest a resource" form → GitHub issue or Supabase table

### v3 — Polish
- [ ] Search (filter resources in feed)
- [ ] Keyboard navigation
- [ ] Mobile responsive (collapses to single column)
- [ ] Animations (tweet entrance, like animation)
- [ ] OG image for social sharing

---

## 12. Design References

- **X (Twitter)** — pixel-accurate UI reference for colors, spacing, typography
  - Tab active: `#fff` text + `#1d9bf0` 2px bottom border
  - Background: `#000`
  - Border color: `#2f3336`
  - Secondary text: `#71767b`
  - Link color: `#1d9bf0`
  - Like active color: `#f91880`
  - Font: system-ui / -apple-system (or Twitter Chirp if self-hosted)

- **Prototype reference:** *(screenshots from our Claude conversation)*
