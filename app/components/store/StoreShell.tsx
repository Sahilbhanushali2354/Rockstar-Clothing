import type { ReactNode } from "react";
import {
  Box,
  Container as MuiContainer,
  type SxProps,
  type Theme,
} from "@mui/material";

import Navbar from "../Navbar";
import Footer from "../Footer";

/*
 * Standard storefront page frame: navbar, main content, footer.
 * `container` wraps children in the standard max-width + gutters.
 */
export default function StoreShell({
  children,
  container = true,
  stickyCta = false,
  className = "",
}: {
  children: ReactNode;
  container?: boolean;
  /** page renders a <StickyWhatsAppBar> — reserve room for it below the footer on mobile */
  stickyCta?: boolean;
  className?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        bgcolor: "var(--dc-bg)",
        color: "var(--dc-text)",
      }}
    >
      <Navbar />
      <Box component="main" className={className} sx={{ flex: 1 }}>
        {container ? <Container>{children}</Container> : children}
      </Box>
      <Footer />
      {stickyCta && <Box className="sticky-cta-spacer" aria-hidden />}
    </Box>
  );
}

export function Container({
  children,
  className = "",
  sx,
}: {
  children: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <MuiContainer
      maxWidth={false}
      className={className}
      sx={[
        { maxWidth: 1280, px: { xs: 2, sm: 3, lg: 4 } },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </MuiContainer>
  );
}
