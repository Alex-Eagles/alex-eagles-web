# Vehicle page — integration into alex-eagles-web (Vite + React Router)

This folder IS the vehicle experience as static files. It runs standalone in a
browser (open index.html) and is designed to be mounted on the `/vehicles`
route inside your existing Navbar/Footer chrome.

## 1. Drop these files into the repo

Copy this whole folder to:

    public/vehicle/
      index.html
      support.js
      three-d-stage.js
      image-slot.js
      assets/…            (build frames, gallery videos, 3D models, component photos)

Vercel serves everything in `public/` at the site root, so it will be reachable
at `/vehicle/index.html` with its relative `assets/` intact — no build step, no
config. (Vercel serves real static files before any SPA rewrite in vercel.json,
so the catch-all won't intercept it.)

## 2. Mount it on the route

Replace `src/pages/Vehicles.tsx` with:

```tsx
/** Vehicles page — the Neith build experience, served as a static page. */
export default function Vehicles() {
  return (
    <iframe
      src="/vehicle/index.html"
      title="Neith — the vehicle"
      style={{ display: "block", width: "100%", height: "100vh", border: 0 }}
    />
  );
}
```

Why an iframe: the build section is scroll-driven with `position: sticky`, so it
must own its own scroll — the iframe isolates that from your router and Tailwind
with zero style bleed. Your fixed, transparent Navbar overlays it perfectly and
the Footer follows after.

## 3. Optional — hide the site Footer on this page

The page ends with its own CTA, so you may not want the global Footer under a
100vh iframe. In `src/App.tsx`:

```tsx
import { useLocation } from "react-router-dom";
// …
const { pathname } = useLocation();          // inside App()
// …
{pathname !== "/vehicles" && <Footer />}     // replace <Footer />
```

## Notes

- The in-page "Meet the team" button already links to `/team` with
  `target="_top"`, so it navigates your SPA (not the iframe).
- Editable "Tweaks" (build speed, scrub smoothing, explorer background, etc.)
  are baked into the static page; they don't need the editor to run.
- To update the page later, re-export it and replace `public/vehicle/`.
