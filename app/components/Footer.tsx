"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowUpward,
  Facebook,
  Instagram,
  WhatsApp,
} from "@mui/icons-material";

import { useCategories } from "../lib/useCategories";
import { useStoreSettings } from "../lib/useStoreSettings";
import { instagramUrl } from "../lib/storeSettings";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { STORE } from "../theme/tokens";

const STEPS = [
  { n: "01", title: "Pick your fit", text: "Choose size & quantity." },
  { n: "02", title: "Tap WhatsApp", text: "Your order is pre-typed." },
  { n: "03", title: "Pay via UPI", text: "We confirm & ship." },
];

const INVERSE_LINE = "var(--dc-inverse-text)";

const linkSx = {
  fontSize: 14,
  fontWeight: 600,
  opacity: 0.75,
  transition: "opacity 150ms",
  "&:hover": { opacity: 1 },
} as const;

const heading = {
  mb: 2,
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  opacity: 0.6,
} as const;

const pillSx = {
  px: 2,
  minHeight: 42,
  fontSize: 14,
  fontWeight: 800,
  boxShadow: "none",
  "&:hover": { boxShadow: "none", transform: "none" },
} as const;

export default function Footer() {
  const { categories } = useCategories();
  const settings = useStoreSettings();
  const chatHref = buildWhatsAppUrl(`Hey ${STORE.name}! 👋 I have a question.`);
  const sizeHref = buildWhatsAppUrl(
    `Hey ${STORE.name}! 👋 Can you help me pick the right size?`,
  );

  const external = { target: "_blank", rel: "noopener noreferrer" } as const;

  return (
    <Box
      component="footer"
      className="dc-inverse"
      sx={{ mt: 8, borderTop: "2px solid var(--dc-edge)" }}
    >
      {/* How ordering works — reinforces the WhatsApp funnel on every page */}
      <Box sx={{ borderBottom: `2px solid ${INVERSE_LINE}` }}>
        <Box
          sx={{
            mx: "auto",
            maxWidth: 1280,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          }}
        >
          {STEPS.map((step, index) => (
            <Stack
              key={step.n}
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                px: { xs: 2, sm: 3, lg: 4 },
                py: 2.5,
                borderColor: INVERSE_LINE,
                borderStyle: "solid",
                borderWidth: 0,
                ...(index > 0 && {
                  borderTopWidth: { xs: 2, sm: 0 },
                  borderLeftWidth: { xs: 0, sm: 2 },
                }),
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily:
                    "var(--font-display), var(--font-body), sans-serif",
                  fontSize: 30,
                  fontWeight: 700,
                  color: "var(--dc-inverse-accent)",
                }}
              >
                {step.n}
              </Typography>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.025em",
                  }}
                >
                  {step.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  {step.text}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Box>

      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1280,
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 6, lg: 8 },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: 5,
            gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr" },
          }}
        >
          <Box>
            <MuiLink
              component={Link}
              href="/"
              aria-label="DOPAMINE CLUB home"
              sx={{ display: "inline-block" }}
            >
              <Box
                component="img"
                src="/brand/dopamine-club-logo-800.webp"
                alt="DOPAMINE CLUB"
                width={800}
                height={800}
                loading="lazy"
                decoding="async"
                sx={{
                  display: "block",
                  width: { xs: 160, sm: 192 },
                  height: { xs: 160, sm: 192 },
                  borderRadius: 4,
                  border: `2px solid ${INVERSE_LINE}`,
                  objectFit: "cover",
                  boxShadow: "6px 6px 0 var(--dc-inverse-accent)",
                }}
              />
            </MuiLink>
            <Typography
              variant="body2"
              sx={{ mt: 2.5, maxWidth: 384, opacity: 0.75 }}
            >
              {settings.tagline}
            </Typography>
            <Stack
              direction="row"
              useFlexGap
              spacing={1.5}
              sx={{ mt: 3, flexWrap: "wrap" }}
            >
              <Button
                component="a"
                href={chatHref}
                {...external}
                startIcon={<WhatsApp />}
                sx={{
                  ...pillSx,
                  border: 0,
                  bgcolor: "var(--dc-inverse-accent)",
                  color: "var(--dc-inverse-bg)",
                  "&:hover": {
                    ...pillSx["&:hover"],
                    bgcolor: "var(--dc-inverse-accent)",
                  },
                }}
              >
                Chat with us
              </Button>
              <Button
                component="a"
                href={instagramUrl(settings.instagramHandle)}
                {...external}
                startIcon={<Instagram />}
                sx={{
                  ...pillSx,
                  border: `2px solid ${INVERSE_LINE}`,
                  color: "inherit",
                  textTransform: "none",
                }}
              >
                Instagram
              </Button>
              <Button
                component="a"
                href={settings.facebookUrl}
                {...external}
                startIcon={<Facebook />}
                sx={{
                  ...pillSx,
                  border: `2px solid ${INVERSE_LINE}`,
                  color: "inherit",
                }}
              >
                Facebook
              </Button>
            </Stack>
          </Box>

          <Box component="nav" aria-label="Shop">
            <Typography sx={heading}>Shop</Typography>
            <Stack
              component="ul"
              spacing={1.25}
              sx={{ m: 0, p: 0, listStyle: "none" }}
            >
              <Box component="li">
                <MuiLink
                  component={Link}
                  href="/shop"
                  color="inherit"
                  underline="hover"
                  sx={linkSx}
                >
                  Shop all
                </MuiLink>
              </Box>
              {categories.slice(0, 6).map((category) => (
                <Box component="li" key={category.id}>
                  <MuiLink
                    component={Link}
                    href={`/category/${category.slug}`}
                    color="inherit"
                    underline="hover"
                    sx={linkSx}
                  >
                    {category.name}
                  </MuiLink>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box component="nav" aria-label="Help">
            <Typography sx={heading}>Help</Typography>
            <Stack
              component="ul"
              spacing={1.25}
              sx={{ m: 0, p: 0, listStyle: "none" }}
            >
              <Box component="li">
                <MuiLink
                  href={sizeHref}
                  {...external}
                  color="inherit"
                  underline="hover"
                  sx={linkSx}
                >
                  Size help
                </MuiLink>
              </Box>
              <Box component="li">
                <MuiLink
                  href={chatHref}
                  {...external}
                  color="inherit"
                  underline="hover"
                  sx={linkSx}
                >
                  Order support
                </MuiLink>
              </Box>
              <Box component="li">
                <MuiLink
                  component={Link}
                  href="/wishlist"
                  color="inherit"
                  underline="hover"
                  sx={linkSx}
                >
                  Wishlist
                </MuiLink>
              </Box>
              <Box component="li">
                <MuiLink
                  component={Link}
                  href="/profile"
                  color="inherit"
                  underline="hover"
                  sx={linkSx}
                >
                  My account
                </MuiLink>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Stack
          direction="row"
          useFlexGap
          spacing={2}
          sx={{
            mt: 6,
            pt: 3,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid ${INVERSE_LINE}`,
            fontSize: 12,
            fontWeight: 700,
            opacity: 0.7,
          }}
        >
          <Typography sx={{ fontSize: "inherit", fontWeight: "inherit" }}>
            © {new Date().getFullYear()} {STORE.name}. All rights reserved.
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            endIcon={<ArrowUpward fontSize="small" />}
            sx={{
              color: "inherit",
              fontSize: 12,
              minHeight: 0,
              p: 0,
              "&:hover": {
                bgcolor: "transparent",
                textDecoration: "underline",
              },
            }}
          >
            Back to top
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
