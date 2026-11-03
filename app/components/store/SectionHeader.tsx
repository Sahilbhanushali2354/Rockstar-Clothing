import Link from "next/link";
import type { ReactNode } from "react";

/*
 * Standard storefront section heading.
 * `highlight` renders inside an acid block, like "CLUB" in the logo:
 *   <SectionHeader title="New" highlight="drops" />
 */
export default function SectionHeader({
  eyebrow,
  title,
  highlight,
  description,
  action,
  align = "left",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: ReactNode;
  action?: { label: string; href: string };
  align?: "left" | "center";
  as?: "h1" | "h2";
}) {
  const centered = align === "center";

  return (
    <div
      className={`mb-6 flex flex-wrap gap-4 md:mb-10 ${
        centered ? "flex-col items-center text-center" : "items-end justify-between"
      }`}
    >
      <div className={`min-w-0 ${centered ? "max-w-2xl" : "max-w-3xl"}`}>
        {eyebrow && (
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] opacity-70">{eyebrow}</p>
        )}
        <Tag
          className={`font-display font-bold tracking-tight ${
            Tag === "h1" ? "text-5xl leading-[0.95] sm:text-6xl lg:text-7xl" : "text-4xl leading-none sm:text-5xl"
          }`}
        >
          {title}
          {highlight && (
            <>
              {" "}
              <span className="dc-highlight -rotate-1">{highlight}</span>
            </>
          )}
        </Tag>
        {description && <p className="mt-3 text-sm opacity-75 sm:text-base">{description}</p>}
      </div>

      {action && (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide underline-offset-4 hover:underline"
        >
          {action.label}
          <span className="transition-transform group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </Link>
      )}
    </div>
  );
}
