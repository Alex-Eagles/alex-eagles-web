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
| `/`         | Home       | ✅ Built      |
| `/team`     | Team       | 🚧 Coming soon |
| `/blog`     | Blog       | 🚧 Coming soon |
| `/vehicles` | Vehicles   | 🚧 Coming soon |
| `/gallery`  | Gallery    | 🚧 Coming soon |
| `/history`  | History    | 🚧 Coming soon |
| `*`         | NotFound   | 404 fallback  |

The **Home** page is fully designed (Hero → StatsBar → About → LatestUpdates →
Sponsors). The remaining pages render a polished, on-brand `ComingSoon`
placeholder so navigation works end-to-end today — swap each page's import for
the real design as it lands; nothing else in the shell changes.

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

---

## Building for production

```bash
npm run build     # → dist/
npm run preview   # preview the built output
```

`build` runs `tsc` first, so a type error fails the build.

---

## Status

🚧 **In active development.** Home is live; Team, Blog, Vehicles, Gallery, and
History pages are on the roadmap.
