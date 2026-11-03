import Link from "next/link";

import BrandLogo from "../components/BrandLogo";
import { ThemeSwitch } from "../components/ui";

const TAGS = ["Streetwear", "Co-ord sets", "Graphic tees", "Viral drops"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid min-h-screen lg:grid-cols-2"
      style={{ background: "var(--dc-bg)", color: "var(--dc-text)" }}
    >
      {/* Brand panel (desktop) */}
      <aside
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12"
        style={{ background: "var(--dc-ink)", color: "var(--dc-paper)" }}
      >
        <Link href="/" aria-label="DOPAMINE CLUB home" className="relative z-10 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/dopamine-club-logo-800.webp"
            alt="DOPAMINE CLUB"
            width={800}
            height={800}
            className="h-32 w-32 rounded-2xl border-2 object-cover xl:h-36 xl:w-36"
            style={{ borderColor: "var(--dc-paper)", boxShadow: "6px 6px 0 var(--dc-acid)" }}
          />
        </Link>

        <div>
          <p className="font-display text-6xl font-bold leading-[0.95] tracking-tight xl:text-7xl">
            Drip that
            <br />
            hits{" "}
            <span
              className="inline-block -rotate-2 rounded-md px-3"
              style={{ background: "var(--dc-acid)", color: "var(--dc-ink)", border: "3px solid var(--dc-paper)" }}
            >
              different.
            </span>
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {TAGS.map((tag, index) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide"
                style={{
                  background: index % 2 === 0 ? "var(--dc-acid)" : "transparent",
                  border: "2px solid var(--dc-acid)",
                  color: index % 2 === 0 ? "var(--dc-ink)" : "var(--dc-acid)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm opacity-60">Order on WhatsApp · Pay via UPI · Ships across India</p>

        {/* decorative blocks */}
        <div aria-hidden className="pointer-events-none absolute -right-16 top-24 h-48 w-48 rotate-12 rounded-3xl" style={{ background: "var(--dc-acid)" }} />
        <div aria-hidden className="pointer-events-none absolute -right-6 top-56 h-24 w-24 -rotate-6 rounded-2xl" style={{ border: "3px solid var(--dc-acid)" }} />
      </aside>

      {/* Form side */}
      <main className="flex min-h-screen flex-col px-4 py-5 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="DOPAMINE CLUB home" className="lg:invisible">
            <BrandLogo size="sm" />
          </Link>
          <ThemeSwitch />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
