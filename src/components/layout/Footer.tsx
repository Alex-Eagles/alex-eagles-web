import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Mail, MapPin } from "lucide-react";
import emailjs from "@emailjs/browser";
import AeLogo from "@/components/ui/AeLogo";
import {
  BRAND,
  CONTACT,
  NAV_LINKS,
  SOCIALS,
  VEHICLE_NAMES,
} from "@/data/site";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

type NewsletterStatus = "idle" | "sending" | "sent" | "error";

/**
 * Footer — 4-column site footer (translated from Home.dc.html): brand + socials,
 * quick links, vehicles, and a contact + newsletter column. Shared across every
 * page via the layout in App.tsx.
 */
export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] =
    useState<NewsletterStatus>("idle");

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setNewsletterStatus("error");
      return;
    }

    setNewsletterStatus("sending");
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          name: "Newsletter signup",
          email: newsletterEmail,
          subject: "Newsletter signup",
          message: `${newsletterEmail} subscribed via the footer "Stay informed" form.`,
        },
        { publicKey: EMAILJS_PUBLIC_KEY },
      );
      setNewsletterStatus("sent");
      setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
    }
  };

  return (
    <footer className="bg-canvas border-t border-border-strong relative overflow-hidden">
      <div className="max-w-[var(--maxw-content)] mx-auto px-6 pt-[72px] pb-7 relative z-10">
        <div className="grid gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          {/* Column 1 — brand + mission + socials */}
          <div>
            <AeLogo size={64} className="text-fg mb-4" />
            <div className="font-display font-bold text-[22px] tracking-[0.04em] text-fg">
              ALEX EAGLES
            </div>
            <div className="font-sans text-xs tracking-[0.18em] uppercase text-brand-light mb-4">
              {BRAND.unit}
            </div>
            <p className="font-sans text-sm leading-[1.7] text-fg-muted max-w-[34ch] mb-5">
              {BRAND.mission}
            </p>
            <div className="flex gap-2.5">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-11 h-11 rounded-lg flex items-center justify-center bg-elevated border border-border text-fg-muted transition-colors duration-200 hover:text-fg hover:border-brand"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — quick links */}
          <FooterLinkColumn title="Quick links">
            {NAV_LINKS.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="font-sans text-sm inline-flex items-center gap-2 text-fg-muted transition-colors hover:text-fg"
                >
                  <ChevronRight size={14} className="text-gold" strokeWidth={2.5} />
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterLinkColumn>

          {/* Column 3 — vehicles */}
          <FooterLinkColumn title="Vehicles">
            {VEHICLE_NAMES.map((name) => (
              <li key={name}>
                <Link
                  to="/vehicles"
                  className="font-sans text-sm inline-flex items-center gap-2 text-fg-muted transition-colors hover:text-fg"
                >
                  <ChevronRight size={14} className="text-gold" strokeWidth={2.5} />
                  {name}
                </Link>
              </li>
            ))}
          </FooterLinkColumn>

          {/* Column 4 — contact + newsletter */}
          <div>
            <ColumnHeading>Communication</ColumnHeading>
            <div className="flex flex-col gap-3.5 mb-[22px]">
              <span className="inline-flex items-center gap-2.5 font-sans text-sm text-fg-muted">
                <Mail size={17} className="text-gold" />
                {CONTACT.email}
              </span>
              <a
                href="https://maps.app.goo.gl/3Go3CTXytPU46Esw5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 font-sans text-sm text-fg-muted transition-colors hover:text-fg"
              >
                <MapPin size={17} className="text-gold" />
                {CONTACT.location}
              </a>
            </div>

            {/* Newsletter — sends to CONTACT.email via EmailJS. */}
            <form
              className="bg-elevated border border-border rounded-[10px] p-4"
              onSubmit={handleNewsletterSubmit}
            >
              <label
                htmlFor="footer-email"
                className="block font-sans text-[13px] text-fg-muted mb-2.5"
              >
                Stay informed about developments.
              </label>
              <div className="flex gap-2">
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 min-w-0 h-11 bg-surface border border-border rounded-md px-3 font-sans text-sm text-fg outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  disabled={newsletterStatus === "sending"}
                  className="flex-none w-11 h-11 rounded-md bg-gold text-canvas cursor-pointer flex items-center justify-center hover:bg-gold-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ArrowUpRight size={18} strokeWidth={2.4} />
                </button>
              </div>
              {newsletterStatus === "sent" && (
                <p className="mt-2 font-sans text-xs text-[#16a34a]">
                  Thanks — you're on the list.
                </p>
              )}
              {newsletterStatus === "error" && (
                <p className="mt-2 font-sans text-xs text-[#dc2626]">
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-[22px] border-t border-border text-center font-sans text-[13px] text-fg-subtle">
          © 2026 Alex Eagles · Alexandria University · SUAS Competition
        </div>
      </div>
    </footer>
  );
}

/* ---- small internal helpers to keep the columns consistent ---- */

function ColumnHeading({ children }: { children: ReactNode }) {
  return (
    <div className="font-sans text-[13px] font-bold tracking-[0.12em] uppercase text-fg mb-[18px]">
      {children}
    </div>
  );
}

function FooterLinkColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <ColumnHeading>{title}</ColumnHeading>
      <ul className="list-none m-0 p-0 flex flex-col gap-3">{children}</ul>
    </div>
  );
}
