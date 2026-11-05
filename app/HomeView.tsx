"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { Instagram, WhatsApp } from "@mui/icons-material";

import StoreShell, { Container } from "./components/store/StoreShell";
import SectionHeader from "./components/store/SectionHeader";
import ProductGrid from "./components/store/ProductGrid";
import Marquee from "./components/store/Marquee";
import { useCategories } from "./lib/useCategories";
import { useStoreSettings } from "./lib/useStoreSettings";
import {
  subscribeActiveProducts,
  type Product,
  type StoreCategory,
} from "./lib/products";
import { imageUrl, type ImageAspect } from "./lib/imageUrl";
import { buildWhatsAppUrl } from "./lib/whatsapp";
import { trackPixel } from "./lib/metaPixel";
import {
  DEFAULT_SETTINGS,
  instagramUrl,
  type StoreSettings,
} from "./lib/storeSettings";
import { STORE } from "./theme/tokens";

/*
 * Category photo URL. With `aspect`, Cloudinary pads the WHOLE photo into
 * that frame (no cropping) — so a tall jeans shot and a wide tee shot both
 * show completely in the same portrait tile.
 */
const categoryImage = (
  url: string,
  publicId: string,
  width: number,
  aspect?: ImageAspect,
) => (url ? imageUrl({ url, publicId }, width, aspect) : "");

const DISPLAY_FONT = "var(--font-display), var(--font-body), sans-serif";

const pulse = keyframes`
  50% { opacity: 0.5; }
`;

/*
 * Home page UI. Server passes initial data (instant paint); live
 * Firestore data takes over on the client.
 */
export default function HomeView({
  initialProducts = null,
  initialCategories = [],
  initialSettings = DEFAULT_SETTINGS,
}: {
  initialProducts?: Product[] | null;
  initialCategories?: StoreCategory[];
  initialSettings?: StoreSettings;
}) {
  const liveCategories = useCategories();
  const liveSettings = useStoreSettings();
  const categories = liveCategories.loading
    ? initialCategories
    : liveCategories.categories;
  const categoriesLoading =
    liveCategories.loading && initialCategories.length === 0;
  // Live settings replace the server copy once the listener has data.
  const settings =
    liveSettings === DEFAULT_SETTINGS ? initialSettings : liveSettings;

  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [productsLoading, setProductsLoading] = useState(
    initialProducts === null,
  );

  // Live: new drops / stock changes from admin show up without a refresh.
  useEffect(
    () =>
      subscribeActiveProducts(
        undefined,
        (list) => {
          setProducts(list);
          setProductsLoading(false);
        },
        (error) => {
          console.error("Failed to load products:", error);
          setProductsLoading(false);
        },
      ),
    [],
  );

  const instagramHandle = `@${settings.instagramHandle}`;
  const instagramHref = instagramUrl(settings.instagramHandle);

  // Featured first, then newest.
  const drops = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            b.createdAt - a.createdAt,
        )
        .slice(0, 8),
    [products],
  );

  const categoryNames = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [category.slug, category.name]),
      ),
    [categories],
  );

  const heroCategory = categories.find((category) => category.imageUrl);
  const heroImage =
    (heroCategory &&
      categoryImage(
        heroCategory.imageUrl,
        heroCategory.imagePath,
        1000,
        "4:5",
      )) ||
    (drops[0]?.images[0] ? imageUrl(drops[0].images[0], 1000, "4:5") : "");
  const editorial =
    categories.filter((category) => category.imageUrl)[1] ?? heroCategory;

  const whatsappHref = buildWhatsAppUrl(
    `Hey ${STORE.name}! 👋 What's new in the latest drop?`,
  );

  const categoryGrid = {
    display: "grid",
    gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
    gap: { xs: 1.5, sm: 2 },
  } as const;

  return (
    <StoreShell container={false}>
      {/* ================= HERO ================= */}
      <Box
        component="section"
        className="dc-inverse"
        sx={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "2px solid var(--dc-edge)",
        }}
      >
        <Container>
          <Box
            sx={{
              display: "grid",
              alignItems: "center",
              gap: 5,
              gridTemplateColumns: { xs: "1fr", lg: "1.15fr 1fr" },
              py: { xs: 6, sm: 8, lg: 12 },
            }}
          >
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                component="p"
                sx={{
                  mb: 2.5,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  borderRadius: 999,
                  border: "2px solid var(--dc-inverse-text)",
                  px: 1.5,
                  py: 0.5,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "var(--dc-inverse-accent)",
                    animation: `${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                  }}
                />
                {settings.heroBadge}
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  maxWidth: "12ch",
                  fontSize: { xs: "3.4rem", sm: 72, lg: 96 },
                  lineHeight: 0.9,
                }}
              >
                {settings.heroTitle}{" "}
                <Box
                  component="span"
                  className="dc-highlight"
                  sx={{ transform: "rotate(-2deg)" }}
                >
                  {settings.heroHighlight}
                </Box>
              </Typography>
              <Typography
                sx={{
                  mt: 3,
                  maxWidth: 448,
                  fontSize: { xs: 16, sm: 18 },
                  opacity: 0.8,
                }}
              >
                {settings.heroSubtitle}
              </Typography>
              <Stack
                direction="row"
                useFlexGap
                spacing={1.5}
                sx={{ mt: 4, flexWrap: "wrap" }}
              >
                <Button
                  component={Link}
                  href="/shop"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: "var(--dc-inverse-accent)",
                    color: "var(--dc-inverse-bg)",
                    borderColor: "var(--dc-inverse-text)",
                    boxShadow: "4px 4px 0 var(--dc-inverse-text)",
                    "&:hover": {
                      bgcolor: "var(--dc-inverse-accent)",
                      boxShadow: "5px 5px 0 var(--dc-inverse-text)",
                    },
                  }}
                >
                  Shop the drop →
                </Button>
                <Button
                  component="a"
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackPixel("Contact", { source: "home_hero" })}
                  variant="outlined"
                  size="large"
                  startIcon={<WhatsApp />}
                  sx={{
                    bgcolor: "transparent",
                    color: "var(--dc-inverse-text)",
                    borderColor: "var(--dc-inverse-text)",
                    "&:hover": { bgcolor: "transparent", boxShadow: "none" },
                  }}
                >
                  Ask on WhatsApp
                </Button>
              </Stack>
            </Box>

            <Box
              sx={{
                position: "relative",
                mx: "auto",
                width: "100%",
                maxWidth: { xs: 448, lg: "none" },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  aspectRatio: "4 / 5",
                  overflow: "hidden",
                  borderRadius: 4,
                  border: "3px solid var(--dc-inverse-text)",
                  boxShadow: "10px 10px 0 var(--dc-inverse-accent)",
                  transform: "rotate(-2deg)",
                }}
              >
                {heroImage ? (
                  <Box
                    component="img"
                    src={heroImage}
                    alt="Latest DOPAMINE CLUB drop"
                    fetchPriority="high"
                    sx={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Skeleton
                    variant="rectangular"
                    animation="pulse"
                    sx={{
                      width: "100%",
                      height: "100%",
                      bgcolor: "var(--dc-inverse-accent)",
                      opacity: 0.25,
                    }}
                  />
                )}
              </Box>
              <Typography
                component="span"
                sx={{
                  position: "absolute",
                  bottom: -16,
                  left: { xs: -8, sm: -24 },
                  transform: "rotate(-8deg)",
                  borderRadius: 2,
                  border: "3px solid var(--dc-inverse-text)",
                  px: 2,
                  py: 1,
                  fontFamily: DISPLAY_FONT,
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  bgcolor: "var(--dc-inverse-accent)",
                  color: "var(--dc-inverse-bg)",
                }}
              >
                Fresh fits ✦
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ================= CATEGORIES ================= */}
      <Box component="section" sx={{ py: { xs: 7, sm: 10 } }}>
        <Container>
          <SectionHeader
            eyebrow="Collections"
            title="Shop by"
            highlight="vibe"
            action={{ label: "Shop all", href: "/shop" }}
          />

          {categoriesLoading ? (
            <Box sx={categoryGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  sx={{ height: "auto", aspectRatio: "4 / 5", borderRadius: 3 }}
                />
              ))}
            </Box>
          ) : categories.length === 0 ? null : (
            <Box sx={categoryGrid}>
              {categories.map((category, index) => (
                <Card
                  key={category.id}
                  sx={{
                    position: "relative",
                    aspectRatio: "4 / 5",
                    borderRadius: 3,
                    border: "2px solid var(--dc-edge)",
                    bgcolor: "var(--dc-surface-2)",
                    transition: "transform 150ms, box-shadow 150ms",
                    "&:hover": {
                      transform: "translate(-2px, -2px)",
                      boxShadow: "4px 4px 0 var(--dc-edge)",
                    },
                    "&:hover .cat-img": { transform: "scale(1.05)" },
                    "&:hover .cat-arrow": { transform: "translateX(4px)" },
                  }}
                >
                  <CardActionArea
                    component={Link}
                    href={`/category/${category.slug}`}
                    disableRipple
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "stretch",
                    }}
                  >
                    {category.imageUrl && (
                      <Box
                        component="img"
                        className="cat-img"
                        src={categoryImage(
                          category.imageUrl,
                          category.imagePath,
                          600,
                          "4:5",
                        )}
                        alt=""
                        loading="lazy"
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          transition: "transform 500ms",
                        }}
                      />
                    )}
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        left: 10,
                        top: 10,
                        borderRadius: 1.5,
                        border: "2px solid var(--dc-ink)",
                        bgcolor: "var(--dc-acid)",
                        color: "var(--dc-ink)",
                        px: 0.75,
                        py: 0.25,
                        fontFamily: DISPLAY_FONT,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        position: "relative",
                        m: { xs: 1, sm: 1.5 },
                        p: { xs: 1.25, sm: 1.5 },
                        borderRadius: 2,
                        border: "2px solid var(--dc-ink)",
                        bgcolor: "var(--dc-paper)",
                        color: "var(--dc-ink)",
                      }}
                    >
                      <Typography
                        component="p"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          fontFamily: DISPLAY_FONT,
                          fontSize: { xs: 16, sm: 20 },
                          fontWeight: 700,
                          lineHeight: 1.25,
                        }}
                      >
                        {category.name}
                        <Box
                          component="span"
                          className="cat-arrow"
                          aria-hidden
                          sx={{ transition: "transform 150ms" }}
                        >
                          →
                        </Box>
                      </Typography>
                      {category.subtitle && (
                        <Typography
                          noWrap
                          sx={{ mt: 0.25, fontSize: 12, opacity: 0.7 }}
                        >
                          {category.subtitle}
                        </Typography>
                      )}
                    </Paper>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <Marquee items={settings.tickerItems} tone="accent" />

      {/* ================= NEW DROPS ================= */}
      <Box component="section" sx={{ py: { xs: 7, sm: 10 } }}>
        <Container>
          <SectionHeader
            eyebrow="Just landed"
            title="New"
            highlight="drops"
            action={{ label: "View all", href: "/shop" }}
          />
          <ProductGrid
            products={drops}
            loading={productsLoading}
            categoryNames={categoryNames}
            empty={{
              title: "Drop loading…",
              description:
                "New pieces land soon. Follow us on Instagram so you don't miss it.",
            }}
          />
        </Container>
      </Box>

      {/* ================= EDITORIAL ================= */}
      {editorial && (
        <Box component="section" sx={{ pb: { xs: 7, sm: 10 } }}>
          <Container>
            <Card
              sx={{
                borderRadius: 4,
                border: "2px solid var(--dc-edge)",
                "&:hover .ed-img": { transform: "scale(1.05)" },
                "&:hover .ed-cta": { transform: "translateX(4px)" },
              }}
            >
              <CardActionArea
                component={Link}
                href={`/category/${editorial.slug}`}
                disableRipple
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  alignItems: "stretch",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    aspectRatio: { xs: "4 / 3", md: "auto" },
                    minHeight: { md: 360 },
                    bgcolor: "var(--dc-surface-2)",
                  }}
                >
                  <Box
                    component="img"
                    className="ed-img"
                    src={categoryImage(
                      editorial.imageUrl,
                      editorial.imagePath,
                      1200,
                    )}
                    alt=""
                    loading="lazy"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      transition: "transform 700ms",
                    }}
                  />
                </Box>
                <Stack
                  spacing={2.5}
                  sx={{
                    justifyContent: "center",
                    bgcolor: "var(--dc-acid)",
                    color: "var(--dc-ink)",
                    p: { xs: 4, sm: 6 },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.2em",
                      opacity: 0.7,
                    }}
                  >
                    Featured collection
                  </Typography>
                  <Typography
                    component="p"
                    sx={{
                      fontFamily: DISPLAY_FONT,
                      fontSize: { xs: 48, sm: 60 },
                      fontWeight: 700,
                      lineHeight: 0.95,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {editorial.name}
                  </Typography>
                  {editorial.subtitle && (
                    <Typography
                      sx={{ maxWidth: 384, fontSize: 16, opacity: 0.8 }}
                    >
                      {editorial.subtitle}
                    </Typography>
                  )}
                  <Box
                    component="span"
                    className="ed-cta"
                    sx={{
                      display: "inline-flex",
                      width: "fit-content",
                      alignItems: "center",
                      gap: 1,
                      borderRadius: 2,
                      border: "2px solid var(--dc-ink)",
                      bgcolor: "var(--dc-ink)",
                      color: "var(--dc-acid)",
                      px: 2.5,
                      py: 1.5,
                      fontSize: 14,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      transition: "transform 150ms",
                    }}
                  >
                    Explore {editorial.name} →
                  </Box>
                </Stack>
              </CardActionArea>
            </Card>
          </Container>
        </Box>
      )}

      {/* ================= INSTAGRAM CTA ================= */}
      <Box component="section">
        <Container>
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2.5,
              borderRadius: 4,
              border: "2px solid var(--dc-edge)",
              px: 3,
              py: { xs: 6, sm: 8 },
              textAlign: "center",
              boxShadow: "6px 6px 0 var(--dc-edge)",
            }}
          >
            <Instagram sx={{ fontSize: 36 }} />
            <SectionHeader
              align="center"
              title="Join the"
              highlight="club"
              description={`Drops, restocks and fit checks — first on ${instagramHandle}.`}
            />
            <Button
              component="a"
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="large"
              sx={{ mt: -2, textTransform: "none" }}
            >
              Follow {instagramHandle}
            </Button>
          </Paper>
        </Container>
      </Box>
    </StoreShell>
  );
}
