"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Box, Link as MuiLink, Typography } from "@mui/material";

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
    <Box
      sx={{
        mb: { xs: 3, md: 5 },
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        ...(centered
          ? {
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }
          : { alignItems: "flex-end", justifyContent: "space-between" }),
      }}
    >
      <Box sx={{ minWidth: 0, maxWidth: centered ? 672 : 768 }}>
        {eyebrow && (
          <Typography
            component="p"
            sx={{
              mb: 1,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              opacity: 0.7,
            }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography
          variant={Tag === "h1" ? "h1" : "h2"}
          component={Tag}
          sx={
            Tag === "h1"
              ? { fontSize: { xs: 48, sm: 60, lg: 72 }, lineHeight: 0.95 }
              : { fontSize: { xs: 36, sm: 48 }, lineHeight: 1 }
          }
        >
          {title}
          {highlight && (
            <>
              {" "}
              <Box
                component="span"
                className="dc-highlight"
                sx={{ transform: "rotate(-1deg)" }}
              >
                {highlight}
              </Box>
            </>
          )}
        </Typography>
        {description && (
          <Typography
            sx={{ mt: 1.5, fontSize: { xs: 14, sm: 16 }, opacity: 0.75 }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {action && (
        <MuiLink
          component={Link}
          href={action.href}
          color="inherit"
          underline="hover"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            fontSize: 14,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.025em",
            textUnderlineOffset: 4,
            "&:hover .arrow": { transform: "translateX(4px)" },
          }}
        >
          {action.label}
          <Box
            component="span"
            className="arrow"
            aria-hidden
            sx={{ transition: "transform 150ms" }}
          >
            →
          </Box>
        </MuiLink>
      )}
    </Box>
  );
}
