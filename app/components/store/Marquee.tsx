import { Box, Typography } from "@mui/material";

/*
 * Scrolling announcement strip. `tone="accent"` = acid strip,
 * `tone="inverse"` = ink (light) / acid (dark) strip.
 * The scroll animation is the `.dc-marquee` keyframe in globals.css.
 */
export default function Marquee({
  items,
  tone = "accent",
  border = "y",
  className = "",
}: {
  items: readonly string[];
  tone?: "accent" | "inverse";
  /** which edges get the 2px rule: top+bottom, top only, or none */
  border?: "y" | "top" | "none";
  className?: string;
}) {
  if (items.length === 0) return null;

  const toneStyle =
    tone === "accent"
      ? {
          bgcolor: "var(--dc-acid)",
          color: "var(--dc-ink)",
          borderColor: "var(--dc-ink)",
        }
      : {
          bgcolor: "var(--dc-inverse-bg)",
          color: "var(--dc-inverse-text)",
          borderColor: "var(--dc-inverse-bg)",
        };

  // Rendered twice so the -50% translate loops seamlessly.
  const run = [...items, ...items];

  return (
    <Box
      className={className}
      role="marquee"
      aria-label={items.join(". ")}
      sx={{
        overflow: "hidden",
        borderStyle: "solid",
        borderWidth: 0,
        borderTopWidth: border === "none" ? 0 : 2,
        borderBottomWidth: border === "y" ? 2 : 0,
        py: 1,
        ...toneStyle,
      }}
    >
      <Box className="dc-marquee" aria-hidden>
        {[0, 1].map((copy) => (
          <Box key={copy} sx={{ display: "flex", flexShrink: 0 }}>
            {run.map((item, index) => (
              <Typography
                key={`${copy}-${index}`}
                component="span"
                sx={{
                  display: "flex",
                  flexShrink: 0,
                  alignItems: "center",
                  gap: 3,
                  pr: 3,
                  fontSize: { xs: 12, sm: 14 },
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                }}
              >
                {item}
                <Box component="span" sx={{ fontSize: 16, lineHeight: 1 }}>
                  ✦
                </Box>
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
