"use client";

import { Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import { BrandMark } from "./BrandLogo";

const bounce = keyframes`
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: none; animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
`;

/* Full-screen brand loader: DC monogram + bouncing acid/ink blocks. */
const Loader = ({ label = "Loading" }: { label?: string }) => {
  return (
    <Stack
      role="status"
      aria-live="polite"
      spacing={2.5}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "var(--dc-bg)",
      }}
    >
      <BrandMark size="lg" sx={{ boxShadow: "4px 4px 0 var(--dc-edge)" }} />
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: "flex-end" }}
        aria-hidden
      >
        {["var(--dc-acid)", "var(--dc-text)", "var(--dc-acid)"].map(
          (color, index) => (
            <Box
              key={index}
              sx={{
                width: 12,
                height: 12,
                borderRadius: "3px",
                bgcolor: color,
                border: "2px solid var(--dc-edge)",
                animation: `${bounce} 1s infinite`,
                animationDelay: `${index * 120}ms`,
              }}
            />
          ),
        )}
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
};

export default Loader;
