/*
 * DOPAMINE CLUB logo.
 *
 *  variant="full"     → DC monogram tile + "DOPAMINE CLUB" wordmark (default)
 *  variant="mark"     → DC monogram tile only (tight spaces, avatars, loaders)
 *  variant="wordmark" → text only
 *
 * Monogram: public/brand/dc-monogram-256.webp (sources in assets/brand/).
 * The wordmark is live text so it stays crisp and follows the theme colour.
 */

type Size = "sm" | "md" | "lg";
type Variant = "full" | "mark" | "wordmark";

const TEXT: Record<Size, string> = {
  sm: "text-base",
  md: "text-lg md:text-xl",
  lg: "text-2xl md:text-3xl",
};

const MARK: Record<Size, string> = {
  sm: "h-7 w-7 rounded-md",
  md: "h-8 w-8 rounded-lg md:h-9 md:w-9",
  lg: "h-12 w-12 rounded-xl md:h-14 md:w-14",
};

export function BrandMark({ size = "md", className = "" }: { size?: Size; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/dc-monogram-256.webp"
      alt=""
      aria-hidden
      width={256}
      height={256}
      decoding="async"
      className={`shrink-0 border-2 border-edge object-cover ${MARK[size]} ${className}`}
    />
  );
}

export default function BrandLogo({
  size = "md",
  variant = "full",
  className = "",
}: {
  size?: Size;
  variant?: Variant;
  className?: string;
}) {
  if (variant === "mark") {
    return (
      <span className={`inline-flex ${className}`} role="img" aria-label="DOPAMINE CLUB">
        <BrandMark size={size} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex select-none items-center gap-2 whitespace-nowrap font-black uppercase leading-none tracking-tight ${TEXT[size]} ${className}`}
      aria-label="DOPAMINE CLUB"
      role="img"
    >
      {variant === "full" && <BrandMark size={size} />}
      <span className="inline-flex items-center gap-1.5" aria-hidden>
        <span>DOPAMINE</span>
        <span
          className="rounded-[4px] px-1.5 py-0.5"
          style={{
            background: "var(--dc-acid)",
            color: "var(--dc-ink)",
            border: "2px solid var(--dc-ink)",
            boxShadow: "2px 2px 0 var(--dc-ink)",
          }}
        >
          CLUB
        </span>
      </span>
    </span>
  );
}
