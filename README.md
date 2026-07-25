# Alex Eagles — Web

The official website of **Alex Eagles**, Alexandria University's Unmanned Aerial
Systems (UAV) team, engineering precision flight for the **SUAS** competition.

A young, multidisciplinary team building the autonomous aircraft of tomorrow —
today. This repo is the team's public-facing site: mission, updates, vehicles,
history, and gallery.

---

## Tech stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------ |
| Framework    | [React 18](https://react.dev/)                               |
| Build tool   | [Vite 5](https://vite.dev/)                                  |
| Language     | [TypeScript 5](https://www.typescriptlang.org/) (strict)     |
| Styling      | [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`) |
| Routing      | [React Router v6](https://reactrouter.com/) (v7 future flags opted in) |
| Animation    | [Framer Motion](https://www.framer.com/motion/)              |
| Icons        | [Lucide React](https://lucide.dev/)                          |
| Fonts        | Barlow Condensed · Barlow · Inter · JetBrains Mono (Google Fonts) |

Tailwind v4 is wired through its first-class Vite plugin — there is **no**
`tailwind.config.js` or PostCSS config. The design system lives entirely in CSS
(see [Design system](#design-system)).

---

## Getting started

### Prerequisites

- **Node.js 18+** and a package manager (`npm`, `pnpm`, or `yarn`).

### Install & run

```bash
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:5173
```

The dev server binds on all interfaces (`host: true`) and uses a **strict** port
(`5173`) — it fails loudly if the port is taken instead of silently jumping.

### Scripts

| Command           | What it does                                         |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server (HMR) on port `5173`.      |
| `npm run build`   | Type-check (`tsc`) then build to `dist/`.            |
| `npm run preview` | Serve the production build locally.                  |
| `npm run lint`    | Type-check only (`tsc --noEmit`).                    |

---

## Project structure

```
alex-eagles-web/
├── index.html                 # Entry HTML; sets dark theme up-front, loads fonts
├── vite.config.ts             # Vite + React + Tailwind v4; `@` → src alias
├── tsconfig.json              # Strict TS, bundler resolution, `@/*` path alias
├── vercel.json                # SPA rewrite + asset caching (see Deployment)
└── src/
    ├── main.tsx               # App bootstrap: Router + ThemeProvider
    ├── App.tsx                # Layout shell + route table
    ├── components/
    │   ├── layout/            # Navbar, Footer
    │   ├── sections/          # Home sections: Hero, StatsBar, About, LatestUpdates, Sponsors
    │   └── ui/                # Reusable primitives: Button, GlassCard, SectionHeader,
    │                          #   ScrollReveal, ThemeToggle, AeLogo
    ├── pages/                 # Route components (Home, Team, Blog, Vehicles, Gallery,
    │                          #   History, NotFound) + ComingSoon placeholder
    ├── context/
    │   └── ThemeContext.tsx   # Single owner of dark/light state
    ├── data/                  # Content data: site.ts (nav/brand/socials), home.ts (mock content)
    ├── hooks/                 # useReducedMotion, useScrollPosition
    ├── lib/                   # motion.ts (shared Framer Motion variants/config)
    ├── styles/                # theme.css (design tokens) + global.css (Tailwind entry)
    └── assets/                # Logos
```

### Path alias

Import from `src` anywhere with the `@` alias (configured in both
`vite.config.ts` and `tsconfig.json`):

```ts
import Button from "@/components/ui/Button";
```

---

## Routing & pages

Client-side routing via React Router. Routes are declared in `src/App.tsx`:

| Route       | Page       | Status        |
| ----------- | ---------- | ------------- |
| `/`         | Home       | ✅ Video landing page |
| `/team`     | Team       | 🚧 Coming soon |
| `/blog`     | Blog       | ✅ Video landing page |
| `/vehicles` | Vehicles   | 🚧 Coming soon |
| `/gallery`  | Gallery    | 🚧 Coming soon |
| `/history`  | History    | 🚧 Coming soon |
| `*`         | NotFound   | 404 fallback  |

The **Home** and **Blog** routes have video-led landing pages. Home remains
clearly marked as being in active development; Team, Vehicles, Gallery, and
History render a polished, on-brand `ComingSoon` placeholder.

The layout shell (`App.tsx`) provides a skip link, a fixed theme toggle, the
navbar, the routed `<main>`, and the footer. A `ScrollToTop` helper resets scroll
on every route change.

---

## Design system

All design tokens are defined once in **`src/styles/theme.css`** — the single
source of truth for every color, font, size, radius, shadow, and timing value.
No component hardcodes a hex value; they read these CSS custom properties.

**`src/styles/global.css`** is the one CSS entry point (imported in `main.tsx`).
It pulls in Tailwind and maps the tokens into Tailwind's theme, so tokens are
usable two ways:

```tsx
// 1. Tailwind utilities (preferred)
<button className="bg-gold text-canvas">

// 2. Raw CSS variables (for one-off arbitrary values)
<div style={{ background: "var(--bg-glass)" }}>
```

### Theming (dark / light)

Dark mode is the brand default. `ThemeContext` sets `data-theme="dark|light"` on
`<html>`, and `theme.css` swaps the entire palette based on that attribute — so
components reference only *semantic* names (`--text-primary`, `--brand`, …) and
render correctly in both themes with zero per-theme code.

The choice is persisted to `localStorage` under `ae-theme`. `index.html` hard-codes
`data-theme="dark"` so the first paint is already dark; `ThemeContext` corrects it
to a returning user's saved preference on mount, avoiding a light-mode flash.

To add a color: add the variable to **both** the dark and light blocks in
`theme.css`, and (optionally) expose it as a Tailwind utility in `global.css`.

### Typography

- **Barlow Condensed** — hero & big section headlines (aerospace condensed)
- **Barlow** — smaller headings
- **Inter** — body copy and UI text
- **JetBrains Mono** — specs, telemetry, stats, dates

### Accessibility & motion

- Skip-to-content link and semantic landmarks in the layout shell.
- `useReducedMotion` hook respects `prefers-reduced-motion` for animations.
- Light-mode accent colors are darkened for AA contrast.

---

## Content

Editable content is kept out of components:

- **`src/data/site.ts`** — navigation, brand strings, contact, social links,
  vehicle names.
- **`src/data/home.ts`** — Home page content (stats, latest updates, sponsors).
  Currently mock data; swap these arrays for a CMS/API later without touching the
  components.
- **`public/media/`** — web-optimized H.264 footage and matching poster images
  used by the Home and Blog pages.

---

## Building for production

```bash
npm run build     # → dist/
npm run preview   # preview the built output
```

`build` runs `tsc` first, so a type error fails the build.

---

## Deployment

The site is hosted on **[Vercel](https://vercel.com/)** and served at
**[alex-eagles.com](https://alex-eagles.com)**.

### How it works

A Vercel project is connected to this GitHub repo and watches it:

| You push to…      | Vercel builds and deploys to…                       |
| ----------------- | --------------------------------------------------- |
| `main`            | **Production** — the live `alex-eagles.com` domain   |
| any other branch  | A **preview** URL (unique per branch, safe to share) |
| a pull request    | A preview URL, auto-commented on the PR              |

So **merging to `main` publishes the site.** There is no manual deploy step and
no GitHub Actions workflow — Vercel handles build and hosting itself.

DNS already points at Vercel (`A 76.76.21.21` for the apex, `CNAME
cname.vercel-dns.com` for `www`). **Do not change DNS records** when moving
between Vercel projects; only the domain's project assignment changes.

### `vercel.json`

Two things, both required:

1. **SPA rewrite.** We use React Router's `BrowserRouter`, so `/team` is a
   client-side route, not a file on disk. Without the rewrite, loading
   `alex-eagles.com/team` directly (or refreshing on it) returns a 404. The
   rewrite serves `index.html` for any path that isn't a real file, and the
   router takes over from there.
2. **Asset caching.** Vite fingerprints filenames in `dist/assets/`
   (`index-a1b2c3d4.js`), so those files can never go stale — we cache them for
   a year. `index.html` is deliberately *not* cached, so a new deploy is picked
   up immediately.

### First-time setup — connecting this repo to Vercel

Do this once. You need to be a member of the Alex Eagles Vercel team (ask an
admin for an invite).

1. **Import the repo.** Vercel dashboard → **Add New… → Project** → select
   `Alex-Eagles/alex-eagles-web` → **Import**.
2. **Confirm the build settings.** Vercel auto-detects Vite. Verify:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. **Deploy.** Click **Deploy** and wait for the build. You get a free
   `*.vercel.app` URL.
4. **Test on that URL before touching the domain.** Specifically:
   - Every route in the nav loads.
   - **Refresh the page while on `/team`** — this is what the SPA rewrite fixes.
     A 404 here means `vercel.json` isn't being picked up.
   - Dark/light toggle persists across a reload.
   - Images and fonts load; check the browser console for errors.
5. **Set the production branch.** Settings → **Git** → Production Branch =
   `main`.
6. **Move the domain over.** A domain can only be attached to one Vercel project
   at a time, so removal comes first:
   - On the **old** project: Settings → Domains → remove `alex-eagles.com` and
     `www.alex-eagles.com`.
   - On the **new** project: Settings → Domains → add both. Set one as primary
     and redirect the other (convention: apex is primary, `www` redirects to it).
   - Expect a few seconds of downtime between the two steps, and up to a minute
     for the TLS certificate to be reissued.
7. **Keep the old project for about a week** as a rollback path, then delete it.

### Day-to-day: shipping a change

```bash
git checkout main && git pull          # start from current main
git checkout -b my-feature             # never commit directly to main
# … make changes …
npm run lint                           # type-check before pushing
npm run build                          # make sure it actually builds
git add -A && git commit -m "…"
git push -u origin my-feature
```

Then open a pull request. Vercel comments a preview URL on it within a minute —
**review the change on that URL, not just locally.** Merge to `main` when it
looks right, and production updates automatically in 1–2 minutes.

### Rolling back a bad deploy

Vercel keeps every previous deployment. Dashboard → **Deployments** → find the
last good one → **⋯ → Promote to Production**. This is instant and needs no
build, so reach for it first, then fix the code properly afterwards.

### Troubleshooting

| Symptom                                    | Cause / fix                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 404 when refreshing on a non-`/` route     | `vercel.json` missing or not at the repo root — the SPA rewrite isn't applying.                  |
| Build fails on Vercel but works locally    | Almost always a type error (`build` runs `tsc` first) or a case-sensitive import path. Vercel builds on Linux, where `Button.tsx` ≠ `button.tsx`; Windows and macOS forgive this locally. |
| Push to `main` didn't deploy               | Check Settings → Git that the production branch is `main` and the GitHub integration still has repo access. |
| Old content still showing after a deploy   | Hard-refresh (`Ctrl+Shift+R`). If it persists, confirm the domain is attached to the project you actually deployed. |
| Fonts or images 404 in production          | Referenced from `public/` with an absolute path (`/logo.svg`), or imported through the `@` alias. Relative paths like `./logo.svg` break under nested routes. |

---

## Status

🚧 **In active development.** Home is live; Team, Blog, Vehicles, Gallery, and
History pages are on the roadmap.
