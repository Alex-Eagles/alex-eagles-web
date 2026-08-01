import { useEffect, useRef, useState } from "react";
import Prototypes from "@/components/sections/Prototypes";
import { useTheme } from "@/context/ThemeContext";

/**
 * Vehicles page — the Neith build experience, rendered INLINE (no iframe).
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
// The hero clip lives inside the fetched HTML (as a <source src>), so without
// this hint the browser has no idea it exists until that fetch resolves, the
// text is parsed, and the <video> is injected — the rest of the page (navbar,
// footer, layout) is already visible well before the video even starts
// downloading. Hinting the exact same URL the injected <source> will use lets
// the browser start pulling video bytes immediately, in parallel with the
// index.html fetch, so playback is ready by the time the markup lands instead
// of noticeably after it.
const HERO_VIDEO_URL = "/vehicle/assets/landing.mp4";

export default function Vehicles() {
  const hostRef = useRef<HTMLDivElement>(null);
  /* React's own container, and the home the Prototypes wrapper is returned to
     before teardown. */
  const rootRef = useRef<HTMLDivElement>(null);
  /*
   * Wrapper around <Prototypes />. "Before the final build" belongs between
   * Mission software and Technical documentation — inside the injected page —
   * but it's a React component, so it can't simply be markup in that document.
   *
   * React renders it here and we then move this wrapper into the slot the page
   * provides. React keeps owning everything inside the wrapper and doesn't care
   * where the wrapper itself sits in the document, so relocating it is safe.
   *
   * Moving rather than portalling is deliberate: if the slot never turns up,
   * the section simply stays where React put it — after the page — instead of
   * rendering into a node that isn't in the document and vanishing.
   */
  const protoRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  /*
   * The Neith experience is a fixed dark design — its sections carry their own
   * hard-coded backgrounds and the global toggle is hidden here (see App.tsx).
   * Arriving in light mode used to leave the shell around it (navbar, footer,
   * the page behind the mount) light against a black page, so pin the whole
   * site dark for as long as this route is mounted.
   *
   * A pin, not setTheme: it never touches the saved preference, so leaving goes
   * straight back to whatever the visitor was using before they came in.
   */
  const { pinTheme } = useTheme();
  useEffect(() => {
    pinTheme("dark");
    return () => pinTheme(null);
  }, [pinTheme]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let slotPoll = 0;
    let slotGiveUp = 0;
    const injected: Node[] = [];

    // Kick the hero video's download off now, in parallel with the HTML fetch
    // below — see the HERO_VIDEO_URL comment. A plain fetch() rather than
    // <link rel=preload as=video>: Chrome doesn't reliably act on a video
    // preload hint (it's built for script/style/font/image), but a warm GET
    // here lands the file in the HTTP cache so the <video>'s own request,
    // once the markup is injected below, resolves from cache instead of
    // opening a second cold connection. Not awaited — this races the HTML
    // fetch, it doesn't block it — and left running on navigation away; an
    // abandoned same-origin GET has nothing to clean up.
    void fetch(HERO_VIDEO_URL, { credentials: "same-origin" }).catch(() => {});

    // support.js is only appended to the document once index.html has been
    // fetched AND parsed (step 4, below) — so today it doesn't even start
    // downloading until that's done, a fully serial hop on top of the HTML
    // fetch it doesn't actually depend on. A preload hint (unlike video,
    // Chrome does act on this for scripts) starts that 68KB request now, in
    // parallel with the HTML fetch, so it's already in cache by the time step
    // 4 creates the real <script src>. Left in place rather than cleaned up on
    // unmount — same reasoning as the script tag itself below: it's a static,
    // cacheable asset shared across visits to this route.
    if (!document.querySelector(`link[rel="preload"][href="${SUPPORT_URL}"]`)) {
      const preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "script";
      preload.href = SUPPORT_URL;
      document.head.appendChild(preload);
    }

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
        /*
         * Move the Prototypes wrapper into the page's slot.
         *
         * Gated on #dc-root, which is the crux: the raw markup we injected in
         * step 2 already contains a #vp-prototypes-slot, but __dcBoot replaces
         * the whole <x-dc> with its own #dc-root and re-renders the template
         * into it — throwing that first slot away. Matching the early one put
         * the section inside a discarded subtree, which is exactly how it went
         * missing. #dc-root only exists after boot, so waiting for it means the
         * slot we find is the live one.
         *
         * Boot itself may still be waiting on support.js, and the runtime's
         * render is async on top of that, so poll rather than checking once.
         */
        const placeProto = () => {
          if (cancelled) return true;
          const proto = protoRef.current;
          if (!proto) return false;
          const slot = host
            .querySelector("#dc-root")
            ?.querySelector("#vp-prototypes-slot");
          if (!slot) return false;
          if (proto.parentNode !== slot) slot.appendChild(proto);
          return true;
        };
        if (!placeProto()) {
          slotPoll = window.setInterval(() => {
            if (placeProto()) window.clearInterval(slotPoll);
          }, 60);
          slotGiveUp = window.setTimeout(
            () => window.clearInterval(slotPoll),
            8000,
          );
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
        console.error("[vehicles] inline mount failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(slotPoll);
      window.clearTimeout(slotGiveUp);
      /* Hand the wrapper back to React's own container before the injected page
         is torn down. Leave it inside the slot and React would later unmount a
         node whose parent no longer exists, which throws. */
      const proto = protoRef.current;
      if (proto && rootRef.current && proto.parentNode !== rootRef.current) {
        rootRef.current.appendChild(proto);
      }
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
      delete (window as unknown as { __vptShowStop?: unknown }).__vptShowStop;
    };
  }, []);

  return (
    <div ref={rootRef}>
      {/* The bundle is fetched after mount, so this container is empty for a
          beat and the Footer rides up under the Navbar before the page drops
          in. Hold a viewport of height in the page's own background colour so
          the first paint is the page arriving, not the footer flashing past. */}
      <div
        ref={hostRef}
        data-vehicle-root
        style={{ minHeight: "100dvh", backgroundColor: "#07091c" }}
      >
        {error && (
          <p style={{ padding: 32, color: "var(--text-muted)" }}>
            Couldn’t load the vehicle experience. {error}
          </p>
        )}
      </div>

      {/* Moved into the page's own slot (between Mission software and Technical
          documentation) once the runtime has rendered it — see placeProto
          above. Until then, and if the slot never appears, it stays here. */}
      <div ref={protoRef}>
        <Prototypes />
      </div>
    </div>
  );
}
