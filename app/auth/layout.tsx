"use client";

import Link from "next/link";
import { Box, Chip, Link as MuiLink, Stack, Typography } from "@mui/material";

import BrandLogo from "../components/BrandLogo";
import { ThemeSwitch } from "../components/ui";

const TAGS = ["Streetwear", "Co-ord sets", "Graphic tees", "Viral drops"];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        minHeight: "100vh",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        bgcolor: "var(--dc-bg)",
        color: "var(--dc-text)",
      }}
    >
      {/* Brand panel (desktop) */}
      <Box
        component="aside"
        sx={{
          position: "relative",
          overflow: "hidden",
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: 6,
          bgcolor: "var(--dc-ink)",
          color: "var(--dc-paper)",
        }}
      >
        <MuiLink
          component={Link}
          href="/"
          aria-label="DOPAMINE CLUB home"
          sx={{ position: "relative", zIndex: 1, width: "fit-content" }}
        >
          <Box
            component="img"
            src="/brand/dopamine-club-logo-800.webp"
            alt="DOPAMINE CLUB"
            width={800}
            height={800}
            sx={{
              display: "block",
              width: { lg: 128, xl: 144 },
              height: { lg: 128, xl: 144 },
              borderRadius: 4,
              border: "2px solid var(--dc-paper)",
              objectFit: "cover",
              boxShadow: "6px 6px 0 var(--dc-acid)",
            }}
          />
        </MuiLink>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h1"
            component="p"
            sx={{ fontSize: { lg: 60, xl: 72 }, lineHeight: 0.95 }}
          >
            Drip that
            <br />
            hits{" "}
            <Box
              component="span"
              sx={{
                display: "inline-block",
                transform: "rotate(-2deg)",
                borderRadius: 1.5,
                px: 1.5,
                bgcolor: "var(--dc-acid)",
                color: "var(--dc-ink)",
                border: "3px solid var(--dc-paper)",
              }}
            >
              different.
            </Box>
          </Typography>
          <Stack
            direction="row"
            useFlexGap
            spacing={1}
            sx={{ mt: 4, flexWrap: "wrap" }}
          >
            {TAGS.map((tag, index) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  borderRadius: 999,
                  border: "2px solid var(--dc-acid)",
                  bgcolor: index % 2 === 0 ? "var(--dc-acid)" : "transparent",
                  color: index % 2 === 0 ? "var(--dc-ink)" : "var(--dc-acid)",
                }}
              />
            ))}
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ opacity: 0.6 }}>
          Order on WhatsApp · Pay via UPI · Ships across India
        </Typography>

        {/* decorative blocks */}
        <Box
          aria-hidden
          sx={{
            pointerEvents: "none",
            position: "absolute",
            right: -64,
            top: 96,
            width: 192,
            height: 192,
            transform: "rotate(12deg)",
            borderRadius: 6,
            bgcolor: "var(--dc-acid)",
          }}
        />
        <Box
          aria-hidden
          sx={{
            pointerEvents: "none",
            position: "absolute",
            right: -24,
            top: 224,
            width: 96,
            height: 96,
            transform: "rotate(-6deg)",
            borderRadius: 4,
            border: "3px solid var(--dc-acid)",
          }}
        />
      </Box>

      {/* Form side */}
      <Box
        component="main"
        sx={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          px: { xs: 2, sm: 4 },
          py: 2.5,
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <MuiLink
            component={Link}
            href="/"
            aria-label="DOPAMINE CLUB home"
            color="inherit"
            underline="none"
            sx={{ visibility: { lg: "hidden" } }}
          >
            <BrandLogo size="sm" />
          </MuiLink>
          <ThemeSwitch />
        </Stack>
        <Stack
          sx={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 448 }}>{children}</Box>
        </Stack>
      </Box>
    </Box>
  );
}
