"use client";

import Link from "next/link";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FiArrowUp } from "react-icons/fi";

import { useCategories } from "../lib/useCategories";
import { useStoreSettings } from "../lib/useStoreSettings";
import { instagramUrl } from "../lib/storeSettings";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { STORE } from "../theme/tokens";

const STEPS = [
  { n: "01", title: "Pick your fit", text: "Choose size & quantity." },
  { n: "02", title: "Tap WhatsApp", text: "Your order is pre-typed." },
  { n: "03", title: "Pay via UPI", text: "We confirm & ship." },
];

export default function Footer() {
  const { categories } = useCategories();
  const settings = useStoreSettings();
  const chatHref = buildWhatsAppUrl(`Hey ${STORE.name}! 👋 I have a question.`);
  const sizeHref = buildWhatsAppUrl(`Hey ${STORE.name}! 👋 Can you help me pick the right size?`);

  const linkClass = "text-sm font-semibold opacity-75 transition-opacity hover:opacity-100 hover:underline";

  return (
    <footer className="dc-inverse mt-16 border-t-2 border-edge">
      {/* How ordering works — reinforces the WhatsApp funnel on every page */}
      <div className="border-b-2" style={{ borderColor: "var(--dc-inverse-text)" }}>
        <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.n}
              className={`flex items-center gap-4 px-4 py-5 sm:px-6 lg:px-8 ${
                index > 0 ? "border-t-2 sm:border-l-2 sm:border-t-0" : ""
              }`}
              style={{ borderColor: "var(--dc-inverse-text)" }}
            >
              <span className="font-display text-3xl font-bold" style={{ color: "var(--dc-inverse-accent)" }}>
                {step.n}
              </span>
              <div>
                <p className="font-extrabold uppercase tracking-wide">{step.title}</p>
                <p className="text-sm opacity-70">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="DOPAMINE CLUB home" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/dopamine-club-logo-800.webp"
                alt="DOPAMINE CLUB"
                width={800}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-40 w-40 rounded-2xl border-2 object-cover sm:h-48 sm:w-48"
                style={{ borderColor: "var(--dc-inverse-text)", boxShadow: "6px 6px 0 var(--dc-inverse-accent)" }}
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm opacity-75">
              {settings.tagline}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={chatHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-extrabold uppercase"
                style={{ background: "var(--dc-inverse-accent)", color: "var(--dc-inverse-bg)" }}
              >
                <FaWhatsapp className="text-base" /> Chat with us
              </a>
              <a
                href={instagramUrl(settings.instagramHandle)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-extrabold uppercase"
                style={{ borderColor: "var(--dc-inverse-text)" }}
              >
                <FaInstagram className="text-base" /> @{settings.instagramHandle}
              </a>
            </div>
          </div>

          <nav aria-label="Shop">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] opacity-60">Shop</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/shop" className={linkClass}>
                  Shop all
                </Link>
              </li>
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className={linkClass}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Help">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] opacity-60">Help</p>
            <ul className="space-y-2.5">
              <li>
                <a href={sizeHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Size help
                </a>
              </li>
              <li>
                <a href={chatHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Order support
                </a>
              </li>
              <li>
                <Link href="/wishlist" className={linkClass}>
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/profile" className={linkClass}>
                  My account
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div
          className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t-2 pt-6 text-xs font-bold opacity-70"
          style={{ borderColor: "var(--dc-inverse-text)" }}
        >
          <p>© {new Date().getFullYear()} {STORE.name}. All rights reserved.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 uppercase tracking-wide hover:underline"
          >
            Back to top <FiArrowUp />
          </button>
        </div>
      </div>
    </footer>
  );
}
