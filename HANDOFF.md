# Alex Eagles Website — Project Handoff

**Snapshot date:** 2026-07-24
**Repo:** `Alex-Eagles/alex-eagles-web` (GitHub)
**Local path (owner's machine):** `D:\Mazen\alexeagles\website-26-repo\alex-eagles-web`
**Live site:** [alex-eagles.com](https://alex-eagles.com) — hosted on Vercel

> **Read this first if you are an AI agent picking up this project.**
> This document is the complete context transfer: what the site is, what has
> been built, what state the repository is actually in right now (including the
> parts that are broken), the conventions you must follow, and what to do next.
> Section 4 contains a **live blocker** — read it before running any git command.

---

## Table of contents

1. [What this project is](#1-what-this-project-is)
2. [Tech stack & how it runs](#2-tech-stack--how-it-runs)
3. [Repository & branch map](#3-repository--branch-map)
4. [⚠️ Current repo state — read before touching git](#4-️-current-repo-state--read-before-touching-git)
5. [Architecture & code conventions](#5-architecture--code-conventions)
6. [The design system](#6-the-design-system)
7. [Page-by-page status](#7-page-by-page-status)
8. [Decisions already made — do not silently undo these](#8-decisions-already-made--do-not-silently-undo-these)
9. [Working preferences (how the owner likes things done)](#9-working-preferences-how-the-owner-likes-things-done)
10. [Known issues & technical debt](#10-known-issues--technical-debt)
11. [Recommended next steps, prioritised](#11-recommended-next-steps-prioritised)
12. [Environment gotchas & quick reference](#12-environment-gotchas--quick-reference)

---

## 1. What this project is

The public-facing website for **Alex Eagles**, Alexandria University's student
Unmanned Aerial Systems (UAV) team, which competes in **SUAS** (Student
Unmanned Aerial Systems competition).

The site's job is to present the team to sponsors, prospective members, and the
competition community: who the team is, what aircraft they build, their
competition history, and ongoing build updates.

It is a **static single-page React application** — no backend, no database, no
CMS. All content lives in typed TypeScript files under `src/data/`.

**Who works on it:** a small group of team members, each of whom took one page.
Contributors visible in git history include the repo owner (`MazenNazeih`),
`farahharfoush`, and `ahtantawy20`. Most of the code was written with Claude
Code assistance, which is why the codebase is unusually heavily commented (see
§9 — this is deliberate and should be preserved).

---

## 2. Tech stack & how it runs

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | React 18.3                                                     |
| Build tool | Vite 5.4                                                       |
| Language   | TypeScript 5.6, **strict mode**                                |
| Styling    | Tailwind CSS v4 via `@tailwindcss/vite` + CSS Modules + CSS vars |
| Routing    | React Router v6.28 (`BrowserRouter`)                           |
| Animation  | Framer Motion 11 **and** GSAP 3.15 (`@gsap/react`)             |
| Icons      | Lucide React                                                   |
| Extras     | `@base-ui/react`, `shadcn`, `tw-animate-css`, `@lottiefiles/dotlottie-react`, `@fontsource-variable/geist` |
| Fonts      | Barlow Condensed · Barlow · Inter · JetBrains Mono (Google Fonts, loaded in `index.html`) |
| Hosting    | Vercel (auto-deploy from GitHub)                               |

**Important:** Tailwind v4 is wired through its first-class Vite plugin. There
is **no `tailwind.config.js` and no PostCSS config** — the entire theme lives in
CSS (`src/styles/theme.css` + `src/styles/global.css`). If you go looking for a
Tailwind config file, it does not exist and should not be created.

### Scripts

```bash
npm run dev      # Vite dev server, http://localhost:5173 (strictPort — fails if taken)
npm run build    # tsc && vite build  → dist/
npm run preview  # serve the production build
npm run lint     # tsc --noEmit (type-check only — there is no ESLint)
```

`npm run build` runs `tsc` first, so **a type error fails the build**. Vercel
runs the same command, so type errors break production deploys.

### Build health as of this snapshot

`npm run build` **passes** (verified 2026-07-24, ~20s). One warning: the main JS
chunk is **588 kB** (193 kB gzipped), above Vite's 500 kB advisory threshold.
See §10.

---

## 3. Repository & branch map

The team used a **branch-per-page** workflow. Each member built their page on
its own branch; `draftmain` was used as the integration branch before promoting
to `main`.

| Branch | Ahead of `main` | Contains |
| ------ | --------------- | -------- |
| `main` | — | Production. Shared shell + design system. Home is a **ComingSoon placeholder**. Brand `#242599` colour map applied to **light mode only**. |
| `draftmain` | +11 | Integration branch. History page (3D scene) merged in, webp photo conversion, lazy-loading fixes. **Most complete integration point.** |
| `teampage` | +2 (local) / origin is +25 | The Team page: roster data, member cards, jump nav, 2025 + 2026 rosters. **This is the branch currently checked out and it is mid-merge — see §4.** |
| `vehiclepage` | +15 | Vehicles page: `src/features/vehicles/` — hero, overview, problem-1, problem-2, technical, with GSAP scroll animations. |
| `blogpage` | +13 | Blog page: `src/components/blog/` — BlogCard, BlogFilters, BlogHeader. Consolidated into a single canonical Blog page; mobile-hardened. |
| `historypage` | +5 | History page: `src/components/history/` — a 3D scroll-driven journey scene (ChaseCamera, JourneyPath, TravellingLight, WebGLBoundary, perf tiering). |
| `gallerypage` | +2 | Gallery page + `src/data/gallery.ts` + video embeds. |
| `homepage` | 0 local (**origin is +2**) | The full homepage sections. `origin/homepage` contains two commits not merged anywhere — including the video-hosting decision (§8). |
| `worktree-vercel-deploy-docs` | merged | Added `vercel.json` + the deployment guide in the README. Already merged via PR #2. |

### Ancestry note

`origin/teampage` (`bff57a3`) is a **superset** — it absorbed `vehiclepage` and
other work through a chain of merges. That is why the working tree currently
shows Team *and* Vehicles *and* the full Home page all at once.

### Two commits worth knowing about

- `607c70b` — *"Remove video assets from the repo, wire code for external
  hosting"*. Lives only on `origin/homepage`. It deleted `fly.mp4`, `dark.mp4`,
  and `light.mp4` (**84 MB combined**) and pointed video sources at empty
  placeholder URL constants that gracefully no-op. **This decision has not been
  applied to the other branches**, which is why an 11 MB `public/drone_video.mp4`
  is still staged on the current tree. See §8 and §10.
- `835a9b7` / `2811852` — `main` reverted a full-site retheme and instead
  applied the `#242599` brand colour map to **light mode only**, and made Home a
  placeholder. So `main` is deliberately more conservative than the feature
  branches.

---

## 4. ⚠️ Current repo state — read before touching git

**The working checkout is in the middle of an unresolved merge.** Do not run
`git checkout`, `git rebase`, or `git pull` until this is resolved.

```
Branch:      teampage
Merging:     origin/teampage (bff57a3) into local teampage (659cd11)
MERGE_HEAD:  present
Conflict:    .gitignore  (status UU — unresolved)
Staged:      ~200 files (the whole merge payload — assets, team page, vehicles page)
```

`git status` shows the tracking state as `teampage: ahead 1, behind 25`, which
is the merge that is half-applied.

### The conflict

`.gitignore` has one trivial conflict — both sides added lines at the end. The
correct resolution keeps **both**:

```gitignore
# Claude Code agent state / worktrees
.claude/
# Normalized cut-out working PNGs (webp in cutout2/ ships instead)
src/assets/members/cutouts/
```

### To resolve

```bash
# 1. Write the .gitignore tail shown above (remove all <<<<<<< ======= >>>>>>> markers)
git add .gitignore
git status                 # confirm nothing else is unmerged
npm run build              # confirm it still compiles
git commit --no-edit       # completes the merge with the prepared merge message
```

**Do not `git merge --abort`** without asking the owner — the staged payload
includes the entire 2025 roster and its 41 cut-out WebP images, which were
prepared locally.

### Other loose ends in the checkout

- A stray `src/.claude/settings.local.json` is tracked inside `src/`. It is
  agent state and does not belong in the source tree — should be deleted.
- A registered git worktree exists at
  `.claude/worktrees/vercel-deploy-docs` (branch `worktree-vercel-deploy-docs`,
  already merged). Safe to remove with `git worktree remove`.
- `dist/` and `tsconfig*.tsbuildinfo` exist on disk. `dist/` is gitignored;
  the `.tsbuildinfo` files are **not** and probably should be.

---

## 5. Architecture & code conventions

### Directory layout

```
alex-eagles-web/
├── index.html              # Entry. Hard-codes data-theme="dark" to avoid a light flash.
├── vite.config.ts          # React + Tailwind v4 plugins; "@" → ./src; host:true, port 5173 strict
├── tsconfig.json           # strict, bundler resolution, "@/*" path alias
├── vercel.json             # SPA rewrite + 1-year immutable caching on /assets/*
├── components.json         # shadcn config
├── docs/
│   └── color-usage-map.html  # Standalone visual audit of the #242599 brand palette
└── src/
    ├── main.tsx            # Bootstrap: BrowserRouter + ThemeProvider
    ├── App.tsx             # Layout shell: skip link, ThemeToggle, Navbar, <Routes>, Footer, ScrollToTop
    ├── components/
    │   ├── layout/         # Navbar, Footer
    │   ├── sections/       # Home sections: Hero, StatsBar, About, LatestUpdates, Sponsors, marquee
    │   ├── team/           # JumpNav, TeamMemberCard, MemberCardSolid (+ .module.css each)
    │   └── ui/             # Button, GlassCard, SectionHeader, ScrollReveal, ThemeToggle, AeLogo, dropdown-menu
    ├── features/
    │   └── vehicles/       # Page-scoped feature module: components/ + hooks/
    ├── pages/              # Home, Team, Blog, Vehicles, Gallery, History, NotFound, ComingSoon
    ├── context/ThemeContext.tsx   # Single owner of dark/light state
    ├── data/               # site.ts, home.ts, team.ts — ALL editable content
    ├── hooks/              # useReducedMotion, useScrollPosition
    ├── lib/                # motion.ts (shared Framer Motion variants), utils.ts (cn helper)
    ├── styles/             # theme.css (tokens) + global.css (Tailwind entry + token bridge)
    └── assets/             # fonts, members/, team/, images/
```

### Path alias

`@` → `src`, configured in **both** `vite.config.ts` and `tsconfig.json`.
Always import as `@/components/ui/Button`. Never use deep relative paths.

### Two styling systems coexist — know which to use

This is the single most important convention to understand, because it is not
obvious:

1. **Tailwind utility classes** — used by the Home page, the layout shell, and
   the `ui/` primitives. Utilities are generated from the design tokens via the
   `@theme inline` block in `global.css`, e.g. `bg-canvas`, `text-fg`,
   `text-brand`, `font-display`, `text-hero`.
2. **CSS Modules** — used by the Team page (`Team.module.css`,
   `TeamMemberCard.module.css`, `MemberCardSolid.module.css`,
   `JumpNav.module.css`) and the newer feature pages. These read the **same**
   CSS custom properties directly (`var(--brand)`, `var(--page-max)`).

Both are legitimate. Match whichever the file you are editing already uses.
Do not convert one to the other as a drive-by change.

### Content lives in `src/data/`, never in components

- `site.ts` — nav links, brand strings, contact email, socials, vehicle names.
- `home.ts` — Home page stats, latest updates, sponsors (currently mock data).
- `team.ts` — the roster. Structure: `year → leadership[3] → divisions[] →
  sections[] → members[]`. Two rosters exist: `ROSTER_2026` and `ROSTER_2025`,
  exposed via `ROSTER_YEARS = ["2026", "2025"]`.

`team.ts` has an extensive header comment explaining exactly how to fill a slot
(name → photo slug → optional cut-out slug). **Read it before editing the
roster.** The card behaviour changes automatically based on whether a matching
file exists in `src/assets/members/cutout2/<slug>.webp` — no code change needed.

### Routing

All routes declared in `src/App.tsx`. `ScrollToTop` resets scroll on navigation.
`ComingSoon` is a shared, on-brand placeholder page used by any route whose real
design has not landed — swapping a page from placeholder to real is a one-line
import change and nothing else in the shell moves.

---

## 6. The design system

**`src/styles/theme.css` is the single source of truth.** Every colour, font,
size, radius, shadow, and timing value is a CSS custom property defined there.
**No component hardcodes a hex value.** This is a hard rule and the file says so
in its own header comment.

**`src/styles/global.css`** is the one CSS entry point (imported in `main.tsx`).
It imports Tailwind, then `theme.css`, then bridges the tokens into Tailwind's
theme with `@theme inline`. The `inline` keyword matters — it makes utilities
emit `var(--…)` rather than baking in a fixed value, so they update live when
the theme switches.

### Theming

Dark mode is the brand default. `ThemeContext` sets `data-theme="dark|light"` on
`<html>`; `theme.css` swaps the whole palette on that attribute. Components only
ever reference *semantic* names (`--text-primary`, `--brand`, `--bg-surface`),
so they render correctly in both themes with zero per-theme code.

Preference persists to `localStorage` under the key **`ae-theme`**.
`index.html` hard-codes `data-theme="dark"` so the first paint is already dark;
`ThemeContext` corrects it on mount for returning light-mode users.

**To add a colour:** add the variable to *both* the dark and light blocks in
`theme.css`, then optionally expose it in the `@theme inline` block.

### Current palette

| Token | Dark | Light |
| ----- | ---- | ----- |
| `--brand` | `#3c40b5` (royal indigo) | `#3c40b5` (constant) |
| `--bg-primary` | `#07091c` (deep-space navy) | `#f7f8ff` |
| `--bg-surface` | `#0d1035` | `#ffffff` |
| `--bg-elevated` | `#161a50` | `#eceeff` |
| `--gold` | amber accent | `#b45309` (darkened for AA contrast) |
| `--stage-from/to` | `#1e2467` → `#0b0e2c` | **identical to dark, on purpose** |

`--stage-*` is the backdrop behind cut-out member portraits. The member's name
is knocked out of it in white, so it cannot follow the surface tokens without
losing all contrast in light mode. Leave it alone.

### Sub-team accent colours

Ten per-sub-team accents (`--team-management`, `--team-aerodesign`,
`--team-wing`, `--team-propulsion`, `--team-software`, `--team-hardware`,
`--team-computer-vision`, `--team-firmware`, `--team-structure`,
`--team-tail-stability`). The slug must match `slugify(subTeamName)` —
`"Tail & Stability"` → `--team-tail-stability`.

### Typography

- **Barlow Condensed** — hero and big section headlines (aerospace condensed feel)
- **Barlow** — smaller headings
- **Inter** — body copy and UI
- **JetBrains Mono** — specs, telemetry, stats, dates
- **Archivo** — Team page only, fixed by the design handoff. Loaded in
  `index.html` but **not** exposed as a `--font-*` token in `theme.css`, so the
  Team CSS modules reference it directly. Inconsistent with the rest of the
  system; worth hoisting into a token.

All-caps labels must be letterspaced — use the `.eyebrow` helper
(`--tracking-caps: 0.12em`).

### Layout anchors

`--maxw-content: 1180px`, `--page-gutter: 48px` (20px on small),
`--nav-height: 88px`. Anchor targets get
`scroll-margin-top: calc(var(--nav-height) + 16px)` so they clear the fixed
navbar.

### Accessibility & motion

- Skip-to-content link and semantic landmarks in `App.tsx`.
- `useReducedMotion` honours `prefers-reduced-motion`.
- Light-mode accents are deliberately darkened for AA contrast.
- `docs/color-usage-map.html` is a standalone audit page for the brand palette —
  open it in a browser when making colour decisions.

---

## 7. Page-by-page status

| Route | Page | On `main` | Built on branch | Notes |
| ----- | ---- | --------- | --------------- | ----- |
| `/` | Home | 🚧 ComingSoon placeholder | `homepage`, present in current tree | Hero → StatsBar → About → LatestUpdates → Sponsors. Sponsor logos, video backgrounds. Content in `data/home.ts` is **mock data**. |
| `/team` | Team | 🚧 placeholder | `teampage` ✅ | Full-height crew hero, year toggle (2026/2025), leadership trio, division→section card grids, PULL jump nav. 2025 uses `MemberCardSolid` (colour cut-out on solid backdrop); 2026 uses `TeamMemberCard` (grayscale→colour reveal). |
| `/vehicles` | Vehicles | 🚧 placeholder | `vehiclepage` ✅ | `src/features/vehicles/`: hero, overview, problem-1, problem-2, technical. GSAP scroll animations via three custom hooks. |
| `/blog` | Blog | 🚧 placeholder | `blogpage` ✅ | BlogCard / BlogFilters / BlogHeader. Consolidated to one canonical page; mobile-hardened; filter→card spacing and contrast polished. Hardware, software, and AI posts written. |
| `/history` | History | 🚧 placeholder | `historypage` ✅ | Scroll-driven **3D journey scene**: ChaseCamera, JourneyPath, TravellingLight, GroundDots, StopOverlays, StopProps, Timeline2D, plus `WebGLBoundary`, `usePerfTier`, and `capability.ts` for graceful degradation. Follows light-mode colours. |
| `/gallery` | Gallery | 🚧 placeholder | `gallerypage` ✅ | Gallery grid + `data/gallery.ts` + video embeds. |
| `*` | NotFound | ✅ | — | 404 fallback. |

**The critical fact:** every page is built, but **almost nothing is on `main`.**
Production currently shows placeholders for every route. The single highest-value
piece of work available is integrating these branches — see §11.

> The README's routing table still says every page is "coming soon" and that
> only Home is built. That was true when it was written and is now **stale**.
> Update it as part of any integration work.

---

## 8. Decisions already made — do not silently undo these

1. **Design tokens are the only source of colour.** Never hardcode a hex in a
   component. Add to `theme.css` (both dark and light blocks) instead.
2. **Dark mode is the brand default**, and `index.html` hard-codes it to prevent
   a light-mode flash on first paint. Do not "fix" that as redundant.
3. **`--stage-from` / `--stage-to` are identical in both themes on purpose.**
   Documented in `theme.css` with the reason.
4. **`main` uses the `#242599` brand map in light mode only.** A full-site
   retheme was attempted (`9bf758c`) and deliberately reverted (`835a9b7`).
   Do not re-apply it site-wide without asking.
5. **Large video files must not be committed.** `607c70b` removed 84 MB of MP4s
   and replaced them with placeholder URL constants that no-op until real hosted
   URLs are provided. Videos belong on external hosting. *(This is still
   violated on the current tree — see §10.)*
6. **Member photos ship as WebP.** `9d6da68` converted photos to WebP; the
   working PNG cut-outs in `src/assets/members/cutouts/` are gitignored, and
   only `cutout2/*.webp` ships.
7. **No `tailwind.config.js`, no PostCSS config.** Tailwind v4 + Vite plugin only.
8. **`ComingSoon` stays** as the shared placeholder so navigation works
   end-to-end while pages land one at a time.
9. **DNS must not be changed** when moving between Vercel projects — only the
   domain's project assignment changes. (`A 76.76.21.21` apex,
   `CNAME cname.vercel-dns.com` for www.)
10. **`vercel.json` must stay at the repo root.** Both entries are required: the
    SPA rewrite (otherwise refreshing on `/team` 404s) and the immutable caching
    on `/assets/*`.

---

## 9. Working preferences (how the owner likes things done)

Inferred from the codebase and commit history — these are consistent enough
across the repo to treat as house style.

### Code style

- **Comment generously and pedagogically.** The codebase explains *why*, not
  just *what* — `theme.css`, `team.ts`, and `App.tsx` all open with multi-line
  header comments that teach a newcomer how the file works and how to extend it.
  This is deliberate; the team includes members who are not primarily web
  developers. Match this density. Do not strip comments as "noise."
- **Single source of truth, always.** Tokens in one file, content in `data/`,
  nav in `site.ts`. When something is repeated, it gets hoisted into a variable
  or a data file.
- **Self-documenting extension points.** `team.ts` describes exactly how to add
  a member; `theme.css` describes exactly how to add a colour. New systems
  should come with the same kind of instructions inline.
- **TypeScript strict, explicit interfaces** for every data shape.
- **Semantic naming over literal naming** — `--text-primary`, not `--white`.

### Documentation

- The README is treated as real documentation, with tables, a troubleshooting
  matrix, and step-by-step runbooks. Keep it that way and keep it current.
- Prose is written for a human teammate, not for a machine.

### Git workflow

- **Branch per page/feature**, never commit directly to `main`.
- `draftmain` as the integration branch before promoting to `main`.
- Type-check and build **before** pushing.
- Review changes on the **Vercel preview URL**, not just locally.
- Descriptive commit messages in the imperative mood for substantive work.

### Assets

- WebP for photos; keep working files out of the repo.
- Large media (video) goes on external hosting, never in git.

### Tooling

- Works on **Windows 11 with PowerShell**. Commands should be PowerShell-safe.
- Heavy Claude Code user; `.claude/settings.json` carries a curated permission
  allowlist so common build/git commands do not prompt.

---

## 10. Known issues & technical debt

### Blocking / high priority

| # | Issue | Detail |
| - | ----- | ------ |
| 1 | **Unresolved merge in the working checkout** | `.gitignore` conflict, ~200 files staged. Nothing can proceed until resolved. See §4. |
| 2 | **Production shows placeholders for every page** | Six finished pages sit on unmerged branches. `main` is essentially an empty shell. |
| 3 | **11 MB `public/drone_video.mp4` staged for commit** | Directly contradicts decision §8.5. Referenced by `src/features/vehicles/components/problem-1.tsx` as `/drone_video.mp4`. Should move to external hosting before this lands on `main`. |
| 4 | **Branches have diverged significantly** | `blogpage` is 9 behind `main`, `vehiclepage` 8 behind, `historypage` 8 behind. The longer this waits, the harder the merges get — several branches touch `theme.css` and `global.css`. |

### Medium

| # | Issue | Detail |
| - | ----- | ------ |
| 5 | **588 kB JS bundle (193 kB gzipped)** | Above Vite's 500 kB warning. Framer Motion *and* GSAP are both bundled. Fix by route-level `React.lazy` + `Suspense` — the History page's 3D scene in particular should never load for someone visiting `/`. |
| 6 | **Unoptimised images** | `ibrahim-mohamed.jpg` 512 kB, `card-texture.png` 523 kB, `crew.jpg` 349 kB, `mohamed-bassem.png` 291 kB, `drone.png` 259 kB (duplicated in both `src/assets/images/` and `public/assets/`). |
| 7 | **Mixed image formats in `src/assets/members/`** | 20 `.jpeg` + 17 `.jpg` + 4 `.png`. The WebP conversion (`9d6da68`) was applied on `draftmain` but the current tree still carries the originals. |
| 8 | **README routing table is stale** | Claims only Home is built and everything else is "coming soon". The opposite is now closer to true. |
| 9 | **`data/home.ts` is mock content** | Stats, latest updates, and sponsors are placeholders. Needs real copy before launch. |
| 10 | **`data/site.ts` has placeholder links** | All four social links are `href: "#"`. `CONTACT.email` is `team@alexeagles.org` — verify this is the real address (the domain is `alex-eagles.com`). `VEHICLE_NAMES` are `Falcon-X1` / `Talon VTOL` / `Skimmer FW` — verify these are real. |

### Low / hygiene

| # | Issue |
| - | ----- |
| 11 | `src/.claude/settings.local.json` is tracked inside the source tree — delete it. |
| 12 | `tsconfig.tsbuildinfo` and `tsconfig.node.tsbuildinfo` are not gitignored. |
| 13 | Stale worktree registration at `.claude/worktrees/vercel-deploy-docs` (branch already merged). |
| 14 | `origin/homepage` is 2 commits ahead of local `homepage`, including the video-hosting decision — unmerged anywhere. |
| 15 | No ESLint. `npm run lint` is only `tsc --noEmit`. |
| 16 | No tests of any kind, and no CI beyond Vercel's build. |
| 17 | `index.html` has a title, meta description, and an SVG favicon, but **no Open Graph / Twitter card tags**, no `apple-touch-icon`, no `robots.txt`, and no sitemap. Link previews in WhatsApp / LinkedIn / Slack will be blank — worth fixing before the site is shown to sponsors. |
| 18 | Fonts are loaded from Google Fonts at runtime (five families, including Archivo for the Team page) while `@fontsource-variable/geist` is *also* a dependency and Space Grotesk sits unused in `src/assets/fonts/`. Font loading is inconsistent and is a render-blocking request. |

---

## 11. Recommended next steps, prioritised

### Phase 1 — unblock (do this first)

1. **Resolve the merge** in the working checkout per §4. Verify with
   `npm run build`, then commit.
2. **Remove `public/drone_video.mp4` from the commit**, upload it to external
   hosting (or Vercel Blob / Cloudflare R2), and reference it by URL — mirroring
   what `607c70b` did for the other videos. Do this *before* it reaches `main`,
   because removing a large blob from git history afterwards is painful.
3. **Delete `src/.claude/settings.local.json`** and add `*.tsbuildinfo` to
   `.gitignore`.

### Phase 2 — get the finished work onto production

This is where nearly all the remaining value is. Take one branch at a time, in
this order (lowest merge risk first):

4. `teampage` → `draftmain`
5. `vehiclepage` → `draftmain`
6. `blogpage` → `draftmain`
7. `gallerypage` → `draftmain`
8. Confirm `historypage` is fully represented in `draftmain` (it was merged at
   `e4db92d`, but `historypage` has moved since).
9. Merge `origin/homepage`'s two outstanding commits.

For each: rebase or merge `main` in **first**, resolve `theme.css` /
`global.css` conflicts by keeping *both* sides' tokens, run `npm run build`,
push, and **review on the Vercel preview URL**. Then promote `draftmain` → `main`
in one reviewed PR.

Watch specifically for:
- Duplicate or conflicting token definitions in `theme.css`.
- Case-sensitive import paths — Vercel builds on Linux, where `Button.tsx` ≠
  `button.tsx`. Windows will not catch this locally.
- The `#242599` light-mode-only decision on `main` being clobbered by a branch
  that predates it.

### Phase 3 — polish before promoting the site publicly

10. **Route-level code splitting** with `React.lazy` — biggest single perf win,
    especially isolating the History page's 3D scene.
11. **Compress and convert all images to WebP**; deduplicate `drone.png`.
12. **Fill in real content**: `home.ts` stats/updates/sponsors, real social
    URLs and contact email in `site.ts`, real vehicle names.
13. **Update the README** routing table and status section to match reality.
14. **SEO & sharing**: add Open Graph / Twitter card tags, an `apple-touch-icon`,
    `robots.txt`, and a sitemap. Title, meta description, and the SVG favicon
    are already in place. Link previews are currently blank, which matters for a
    sponsor-facing site.
15. **Accessibility pass** on the newer pages. The shell and Home were built
    with a11y in mind, and `TeamMemberCard` is already keyboard-accessible
    (`tabIndex={0}` with all reveal motion keyed off `:hover, :focus-within`, so
    the card opens on focus as well as hover — a genuinely good pattern; keep
    it). Still unaudited: focus order through the jump nav, the same
    focus-within treatment on `MemberCardSolid`, touch behaviour on the reveal
    cards, and reduced-motion handling inside the GSAP hooks and the 3D History
    scene.
16. Add ESLint + Prettier, and a lightweight GitHub Action running
    `npm run lint && npm run build` on PRs.

---

## 12. Environment gotchas & quick reference

### Node is not on PATH on the owner's machine

Node lives at `C:\Program Files\nodejs` but is not on the user PATH. Every
PowerShell command that shells out to node/npm must prefix it:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path; npm run build
```

This is already reflected in the allowlist in `.claude/settings.json`.

### Dev server

Port **5173**, `strictPort: true` — it fails loudly rather than silently jumping
ports (this was a deliberate change after orphaned servers piled up during
debugging). `host: true` binds all interfaces so IPv4, IPv6, and LAN all reach
the same server.

### Deployment

Vercel watches the GitHub repo:

| Push to… | Deploys to… |
| -------- | ----------- |
| `main` | **Production** — `alex-eagles.com` |
| any other branch | a unique preview URL |
| a pull request | a preview URL, auto-commented on the PR |

**Merging to `main` publishes the site.** No manual deploy step, no GitHub
Actions.

**Rollback:** Vercel Dashboard → Deployments → last good one → ⋯ → *Promote to
Production*. Instant, no rebuild. Reach for this first, fix the code after.

### Troubleshooting matrix

| Symptom | Cause / fix |
| ------- | ----------- |
| 404 when refreshing a non-`/` route | `vercel.json` missing from repo root — SPA rewrite not applying. |
| Builds locally, fails on Vercel | Type error (build runs `tsc` first), or a case-sensitive import path. Vercel builds on Linux. |
| Push to `main` did not deploy | Check Vercel Settings → Git: production branch is `main` and the GitHub integration still has repo access. |
| Old content after deploy | Hard-refresh (`Ctrl+Shift+R`). If it persists, confirm the domain is attached to the project you actually deployed. |
| Fonts/images 404 in production | Must be referenced from `public/` with an absolute path (`/logo.svg`) or imported through the `@` alias. Relative paths like `./logo.svg` break under nested routes. |

### Day-to-day workflow

```bash
git checkout main && git pull
git checkout -b my-feature          # never commit directly to main
# … make changes …
npm run lint                        # type-check
npm run build                       # confirm it builds
git add -A && git commit -m "…"
git push -u origin my-feature
# open a PR, review on the Vercel preview URL, then merge
```

---

## Appendix — file map for common tasks

| I want to… | Edit… |
| ---------- | ----- |
| Change a colour anywhere | `src/styles/theme.css` (both dark **and** light blocks) |
| Add a Tailwind utility for a token | `src/styles/global.css`, the `@theme inline` block |
| Change navigation | `src/data/site.ts` → `NAV_LINKS` |
| Change contact / socials | `src/data/site.ts` → `CONTACT`, `SOCIALS` |
| Add or edit a team member | `src/data/team.ts` (read the header comment first) |
| Add a member's photo | `src/assets/members/<slug>.webp` + optional cut-out at `src/assets/members/cutout2/<slug>.webp` |
| Add a route | `src/App.tsx` + `src/data/site.ts` |
| Change Home page copy | `src/data/home.ts` |
| Change caching or SPA routing on Vercel | `vercel.json` |
| Adjust the navbar offset for anchors | `--nav-height` in `src/styles/theme.css` |

---

*Prepared 2026-07-24. If you are an agent continuing this work: start at §4,
then §11 Phase 1. Preserve the commenting style described in §9 — it is the
convention the whole codebase is built around.*
