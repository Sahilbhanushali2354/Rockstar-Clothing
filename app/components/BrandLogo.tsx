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

import { Box, type SxProps, type Theme } from "@mui/material";

type Size = "sm" | "md" | "lg";
type Variant = "full" | "mark" | "wordmark";

const TEXT: Record<Size, SxProps<Theme>> = {
  sm: { fontSize: 16 },
  md: { fontSize: { xs: 18, md: 20 } },
  lg: { fontSize: { xs: 24, md: 30 } },
};

const MARK: Record<
  Size,
  { size: number | Record<string, number>; radius: number }
> = {
  sm: { size: 28, radius: 6 },
  md: { size: { xs: 32, md: 36 }, radius: 8 },
  lg: { size: { xs: 48, md: 56 }, radius: 12 },
};

export function BrandMark({
  size = "md",
  className = "",
  sx,
}: {
  size?: Size;
  className?: string;
  sx?: SxProps<Theme>;
}) {
  const mark = MARK[size];

  return (
    <Box
      component="img"
      src="/brand/dc-monogram-256.webp"
      alt=""
      aria-hidden
      width={256}
      height={256}
      decoding="async"
      className={className}
      sx={[
        {
          flexShrink: 0,
          width: mark.size,
          height: mark.size,
          borderRadius: `${mark.radius}px`,
          border: "2px solid var(--dc-edge)",
          objectFit: "cover",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
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
      <Box
        component="span"
        className={className}
        role="img"
        aria-label="DOPAMINE CLUB"
        sx={{ display: "inline-flex" }}
      >
        <BrandMark size={size} />
      </Box>
    );
  }

  return (
    <Box
      component="span"
      className={className}
      aria-label="DOPAMINE CLUB"
      role="img"
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          userSelect: "none",
          whiteSpace: "nowrap",
          fontWeight: 900,
          textTransform: "uppercase",
          lineHeight: 1,
          letterSpacing: "-0.025em",
        },
        TEXT[size] as object,
      ]}
    >
      {variant === "full" && <BrandMark size={size} />}
      <Box
        component="span"
        aria-hidden
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
      >
        <Box component="span">DOPAMINE</Box>
        <Box
          component="span"
          sx={{
            borderRadius: "4px",
            px: 0.75,
            py: 0.25,
            bgcolor: "var(--dc-acid)",
            color: "var(--dc-ink)",
            border: "2px solid var(--dc-ink)",
            boxShadow: "2px 2px 0 var(--dc-ink)",
          }}
        >
          CLUB
        </Box>
      </Box>
    </Box>
  );
}
