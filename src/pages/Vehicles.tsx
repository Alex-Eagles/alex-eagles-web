import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Prototypes from "@/components/sections/Prototypes";

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

export default function Vehicles() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  /*
   * #vp-prototypes-slot, once the DC runtime has rendered it. The "Before the
   * build" section belongs between Mission software and Technical documentation
   * — inside the injected page — but it's a React component, so it can't just
   * be markup in that document. Portalling into a slot the page provides is
   * what places it there; `null` means the page hasn't rendered yet (or the
   * slot is missing, in which case the fallback below still renders it after
   * the page rather than dropping it).
   */
  const [protoSlot, setProtoSlot] = useState<HTMLElement | null>(null);
  const [slotSettled, setSlotSettled] = useState(false);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let slotPoll = 0;
    let slotGiveUp = 0;
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
        /*
         * The slot only exists once the DC runtime has rendered the template
         * (it replaces <x-dc> with its own root), and boot above may still be
         * waiting on support.js — so poll for it the same way. Giving up marks
         * it settled, which is what lets the fallback render the section in its
         * old position rather than losing it.
         */
        const findSlot = () => {
          if (cancelled) return true;
          const el = host.querySelector<HTMLElement>("#vp-prototypes-slot");
          if (!el) return false;
          setProtoSlot(el);
          setSlotSettled(true);
          return true;
        };
        if (!findSlot()) {
          slotPoll = window.setInterval(() => {
            if (findSlot()) window.clearInterval(slotPoll);
          }, 50);
          slotGiveUp = window.setTimeout(() => {
            window.clearInterval(slotPoll);
            if (!cancelled) setSlotSettled(true);
          }, 6000);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          setSlotSettled(true);
        }
        console.error("[vehicles] inline mount failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(slotPoll);
      window.clearTimeout(slotGiveUp);
      /* Drop the portal before the slot is destroyed below, so React unmounts
         the section while its container is still the node it rendered into. */
      setProtoSlot(null);
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
    <>
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

      {/* Into the page's own slot (between Mission software and Technical
          documentation) once it exists. If the page never rendered one — an
          older cached copy of vehicle/index.html, or a failed mount — fall back
          to the original position after the page, so the section is late rather
          than missing. Nothing renders while it's still undecided, to avoid
          showing it in the wrong place and then moving it. */}
      {protoSlot
        ? createPortal(<Prototypes />, protoSlot)
        : slotSettled && <Prototypes />}
    </>
  );
}
