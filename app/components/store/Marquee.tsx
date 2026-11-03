/*
 * Scrolling announcement strip. `tone="accent"` = acid strip,
 * `tone="inverse"` = ink (light) / acid (dark) strip.
 */
export default function Marquee({
  items,
  tone = "accent",
  className = "",
}: {
  items: readonly string[];
  tone?: "accent" | "inverse";
  className?: string;
}) {
  if (items.length === 0) return null;

  const toneStyle =
    tone === "accent"
      ? { background: "var(--dc-acid)", color: "var(--dc-ink)", borderColor: "var(--dc-ink)" }
      : { background: "var(--dc-inverse-bg)", color: "var(--dc-inverse-text)", borderColor: "var(--dc-inverse-bg)" };

  // Rendered twice so the -50% translate loops seamlessly.
  const run = [...items, ...items];

  return (
    <div
      className={`overflow-hidden border-y-2 py-2 ${className}`}
      style={toneStyle}
      role="marquee"
      aria-label={items.join(". ")}
    >
      <div className="dc-marquee" aria-hidden>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {run.map((item, index) => (
              <span
                key={`${copy}-${index}`}
                className="flex shrink-0 items-center gap-6 pr-6 text-xs font-extrabold uppercase tracking-[0.16em] sm:text-sm"
              >
                {item}
                <span className="text-base leading-none">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
