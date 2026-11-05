"use client";

import Link from "next/link";
import { Box, Button, Stack, Typography } from "@mui/material";

import StoreShell from "./components/store/StoreShell";

export default function NotFound() {
  return (
    <StoreShell>
      <Stack
        spacing={2.5}
        sx={{
          minHeight: "60vh",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h1"
          component="p"
          sx={{ fontSize: { xs: 96, sm: 128 }, lineHeight: 1 }}
        >
          4
          <Box
            component="span"
            className="dc-highlight"
            sx={{ mx: 0.5, transform: "rotate(-3deg)" }}
          >
            0
          </Box>
          4
        </Typography>
        <Typography variant="h2" component="p" sx={{ fontSize: 30 }}>
          This fit sold out — or never existed.
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 384 }}>
          The page you&apos;re looking for isn&apos;t here. The drop is, though.
        </Typography>
        <Stack
          direction="row"
          useFlexGap
          spacing={1.5}
          sx={{ flexWrap: "wrap", justifyContent: "center" }}
        >
          <Button
            component={Link}
            href="/shop"
            variant="contained"
            size="large"
          >
            Shop the drop →
          </Button>
          <Button
            component={Link}
            href="/"
            variant="contained"
            color="secondary"
            size="large"
          >
            Home
          </Button>
        </Stack>
      </Stack>
    </StoreShell>
  );
}
