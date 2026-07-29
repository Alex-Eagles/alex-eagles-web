import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Vehicles page — the Clover build experience, rendered INLINE (no iframe).
 *
 * The experience is a self-contained "Design Component" static page under
 * public/vehicle/ (an <x-dc> template + a component <script> + the support.js
 * runtime, which loads its own React UMD and hydrates <x-dc>). Rather than embed
 * it in an iframe — which owns its own scroll and leaves the site Footer
 * unreachable — we mount it inline so it flows as a normal page section: the
 * build animation drives off the MAIN window scroll, and the Navbar/Footer sit
 * before and after it exactly like every other route.
 *
 * How it works:
 *   1. Fetch /vehicle/index.html once.
 *   2. Hoist its <link>/<style> from the <head>/<helmet> into the document head.
 *   3. Inject the <x-dc> template + <script data-dc-script> into our container.
 *   4. Load support.js and call window.__dcBoot() to hydrate.
 *   5. On unmount, remove the injected nodes and hoisted styles.
 *
 * Assets resolve relatively ("assets/…") so we set a <base> for the mount only
 * — but since the fetched HTML's relative URLs are rewritten to absolute
 * "/vehicle/…" below, no base tag is needed.
 */
const VEHICLE_URL = "/vehicle/index.html";
const SUPPORT_URL = "/vehicle/support.js";

export default function Vehicles() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { search } = useLocation();

  /**
   * A search result for a timeline stop deep-links with ?stop=<index>. The route
   * stays mounted while the query changes, so the static bundle's own boot-time
   * read only ever fires once — searching again from this page has to be driven
   * from here. Polls because the bundle hydrates asynchronously.
   */
  useEffect(() => {
    const raw = new URLSearchParams(search).get("stop");
    if (raw === null || raw === "") return;
    const stop = Number(raw);
    if (!Number.isInteger(stop)) return;

    let tries = 0;
    const call = () => {
      const open = (window as unknown as { __vptOpenStop?: (i: number) => void }).__vptOpenStop;
      if (open) {
        open(stop);
        return true;
      }
      return false;
    };
    if (call()) return;
    const timer = window.setInterval(() => {
      if (call() || ++tries > 40) window.clearInterval(timer);
    }, 120);
    return () => window.clearInterval(timer);
  }, [search]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const injected: Node[] = [];

    (async () => {
      try {
        const res = await fetch(VEHICLE_URL, { credentials: "same-origin" });
        if (!res.ok) throw new Error(`fetch ${VEHICLE_URL} → ${res.status}`);
        const raw = await res.text();
        if (cancelled) return;

        const doc = new DOMParser().parseFromString(raw, "text/html");

        // Rewrite relative asset URLs (href/src="assets/…", url(assets/…)) to
        // absolute /vehicle/… so they resolve from any SPA route.
        // "./image-slot.js" resolves against /vehicles and 404s, so sibling
        // scripts are rewritten alongside the asset paths.
        const abs = (u: string) => {
          if (u.startsWith("assets/")) return `/vehicle/${u}`;
          if (u.startsWith("./")) return `/vehicle/${u.slice(2)}`;
          return null;
        };
        doc.querySelectorAll<HTMLElement>("[src],[href],[poster]").forEach(
          (el) => {
            (["src", "href", "poster"] as const).forEach((attr) => {
              const v = el.getAttribute(attr);
              const next = v && abs(v);
              if (next) el.setAttribute(attr, next);
            });
          },
        );

        // 1) Hoist fonts + the page's <style> into our <head> (tagged for cleanup).
        doc
          .querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], style')
          .forEach((node) => {
            // Skip the runtime's own x-dc{display:none} guard if present.
            const clone = node.cloneNode(true) as HTMLElement;
            clone.setAttribute("data-vehicle-style", "");
            document.head.appendChild(clone);
            injected.push(clone);
          });

        // 2) Inject the <x-dc> template markup into our container.
        const xdc = doc.querySelector("x-dc");
        if (!xdc) throw new Error("no <x-dc> block in vehicle page");
        host.appendChild(xdc);

        // 3) Inject the component <script data-dc-script> (with its data-props).
        //    The script also builds asset URLs as JS strings (e.g. the build
        //    frames: `'assets/frames/f000.png'`). Those are relative to the
        //    document (now /vehicles), so rewrite quoted "assets/…" literals to
        //    absolute "/vehicle/assets/…" — the attribute rewrite above only
        //    covers markup, not JS strings.
        const dcScriptSrc = doc.querySelector("script[data-dc-script]");
        if (dcScriptSrc) {
          const s = document.createElement("script");
          s.type = "text/x-dc";
          s.setAttribute("data-dc-script", "");
          const props = dcScriptSrc.getAttribute("data-props");
          if (props) s.setAttribute("data-props", props);
          s.textContent = (dcScriptSrc.textContent ?? "").replace(
            /(['"`])assets\//g,
            "$1/vehicle/assets/",
          );
          host.appendChild(s);
          injected.push(s);
        }

        // 4) Ensure support.js is loaded, then (re)boot the DC runtime.
        const boot = () => {
          const w = window as unknown as { __dcBoot?: () => void };
          if (typeof w.__dcBoot === "function") w.__dcBoot();
        };
        if ((window as unknown as { __dcBoot?: unknown }).__dcBoot) {
          boot();
        } else if (!document.querySelector(`script[src="${SUPPORT_URL}"]`)) {
          const s = document.createElement("script");
          s.src = SUPPORT_URL;
          s.onload = boot;
          document.head.appendChild(s);
          // support.js stays cached across navigations; don't clean it up.
        } else {
          // script tag exists but runtime not ready yet — poll briefly.
          const t = window.setInterval(() => {
            if ((window as unknown as { __dcBoot?: unknown }).__dcBoot) {
              window.clearInterval(t);
              boot();
            }
          }, 50);
          window.setTimeout(() => window.clearInterval(t), 5000);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
        console.error("[vehicles] inline mount failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      injected.forEach((n) => n.parentNode?.removeChild(n));
      if (host) host.innerHTML = "";

      // A card may have been open when we left. The bundle's teardown takes its
      // listeners with it, so release the scroll lock here or the whole site is
      // left unscrollable until a reload.
      const body = document.body;
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
      delete (window as unknown as { __vptOpenStop?: unknown }).__vptOpenStop;
    };
  }, []);

  return (
    <div ref={hostRef} data-vehicle-root>
      {error && (
        <p style={{ padding: 32, color: "var(--text-muted)" }}>
          Couldn’t load the vehicle experience. {error}
        </p>
      )}
    </div>
  );
}
