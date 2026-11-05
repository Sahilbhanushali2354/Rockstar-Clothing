"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  LinearProgress,
  Link as MuiLink,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowForward,
  CategoryOutlined,
  Check,
  Close,
  Inventory2Outlined,
  VisibilityOffOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";

import { FStore } from "@/firebase/firebase.config";
import { useAdminUser } from "@/app/components/AdminGuard";
import { PageHeader, Skeleton } from "@/app/components/ui";
import {
  LOW_STOCK,
  PRODUCTS,
  isSoldOut,
  normalizeProduct,
  slugToLabel,
  toSlug,
  type Product,
} from "@/app/lib/products";
import { imageUrl } from "@/app/lib/cloudinary";
import { WHATSAPP_NUMBER } from "@/app/lib/whatsapp";
import { META_PIXEL_ID } from "@/app/lib/metaPixel";
import { CLOUDINARY_CLOUD_NAME } from "@/app/lib/cloudinary";

interface CategorySummary {
  slug: string;
  name: string;
  active: boolean;
}

const sectionTitle = { fontSize: 18 } as const;
const smallLink = { fontSize: 12, fontWeight: 700 } as const;
const badge = {
  height: 20,
  borderRadius: 1,
  border: "1.5px solid var(--dc-edge)",
  fontSize: 11,
} as const;

function StatCard({
  label,
  value,
  href,
  accent,
  icon,
}: {
  label: string;
  value: number | string;
  href: string;
  accent: string;
  icon: ReactElement;
}) {
  const iconColor =
    accent === "var(--dc-acid)"
      ? "var(--dc-ink)"
      : accent === "var(--dc-text)"
        ? "var(--dc-bg)"
        : "var(--dc-text)";

  return (
    <Card
      sx={{
        transition: "transform 150ms",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <CardActionArea
        component={Link}
        href={href}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: 2,
          p: { xs: 2, sm: 2.5 },
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography
            color="text.secondary"
            sx={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            {label}
          </Typography>
          <Box
            sx={{
              display: "flex",
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              bgcolor: accent,
              color: iconColor,
              border: "2px solid var(--dc-edge)",
              "& svg": { fontSize: 16 },
            }}
          >
            {icon}
          </Box>
        </Stack>
        <Typography
          variant="h3"
          component="span"
          sx={{ fontSize: { xs: 30, sm: 36 } }}
        >
          {value}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

export default function AdminDashboard() {
  const user = useAdminUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(FStore, PRODUCTS),
      (snapshot) => {
        setProducts(
          snapshot.docs
            .map((productDoc) =>
              normalizeProduct(productDoc.id, productDoc.data()),
            )
            .sort((a, b) => b.createdAt - a.createdAt),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load products:", error);
        setLoading(false);
      },
    );

    const unsubCategories = onSnapshot(
      collection(FStore, "categories"),
      (snapshot) => {
        setCategories(
          snapshot.docs.map((categoryDoc) => {
            const data = categoryDoc.data();
            return {
              slug: toSlug(String(data.slug ?? categoryDoc.id)),
              name: String(data.name ?? categoryDoc.id),
              active: data.active !== false,
            };
          }),
        );
      },
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const stats = useMemo(() => {
    const live = products.filter((product) => product.active);
    return {
      live: live.length,
      hidden: products.length - live.length,
      soldOut: live.filter(isSoldOut).length,
      legacyImages: products.filter((product) =>
        product.images.some((image) => !image.publicId),
      ).length,
    };
  }, [products]);

  // Live products with sizes that are sold out or nearly sold out.
  const attention = useMemo(
    () =>
      products
        .filter((product) => product.active)
        .map((product) => ({
          product,
          sizes: product.sizes.filter((size) => size.stock <= LOW_STOCK),
        }))
        .filter((entry) => entry.sizes.length > 0)
        .slice(0, 6),
    [products],
  );

  const categoryName = (slug: string) =>
    categories.find((category) => category.slug === slug)?.name ??
    slugToLabel(slug);

  const setup = [
    {
      done: Boolean(WHATSAPP_NUMBER),
      label: "WhatsApp number set",
      hint: "NEXT_PUBLIC_WHATSAPP_NUMBER in .env",
    },
    {
      done: Boolean(META_PIXEL_ID),
      label: "Meta Pixel connected",
      hint: "NEXT_PUBLIC_META_PIXEL_ID in .env",
    },
    {
      done: Boolean(CLOUDINARY_CLOUD_NAME),
      label: "Cloudinary connected",
      hint: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env",
    },
    {
      done: categories.some((category) => category.active),
      label: "At least one live category",
      hint: "Add one in Categories",
    },
    {
      done: stats.live > 0,
      label: "At least one live product",
      hint: "Add your first drop",
    },
    {
      done: products.length > 0 && stats.legacyImages === 0,
      label: "All images on Cloudinary",
      hint: `${stats.legacyImages} products still use old images — run the migration`,
    },
  ];
  const setupDone = setup.filter((item) => item.done).length;

  const greeting = user?.email?.split("@")[0];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={greeting ? `Hey ${greeting} 👋` : "Dashboard"}
        description="Here's what's happening in the store."
        actions={
          <Button
            component={Link}
            href="/admin/products/new"
            variant="contained"
            startIcon={<Add />}
          >
            Add product
          </Button>
        }
      />

      {/* Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : (
          <>
            <StatCard
              label="Live"
              value={stats.live}
              href="/admin/products?status=live"
              accent="var(--dc-acid)"
              icon={<Inventory2Outlined />}
            />
            <StatCard
              label="Hidden"
              value={stats.hidden}
              href="/admin/products?status=hidden"
              accent="var(--dc-surface-2)"
              icon={<VisibilityOffOutlined />}
            />
            <StatCard
              label="Sold out"
              value={stats.soldOut}
              href="/admin/products?status=soldout"
              accent="var(--dc-text)"
              icon={<WarningAmberOutlined />}
            />
            <StatCard
              label="Categories"
              value={categories.length}
              href="/admin/categories"
              accent="var(--dc-acid)"
              icon={<CategoryOutlined />}
            />
          </>
        )}
      </Box>

      <Box
        sx={{
          mt: 3,
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" },
        }}
      >
        <Stack spacing={3}>
          {/* Needs attention */}
          <Card component="section" sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack
              direction="row"
              sx={{
                mb: 2,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" component="h2" sx={sectionTitle}>
                Stock alerts
              </Typography>
              <MuiLink
                component={Link}
                href="/admin/products?status=low"
                color="text.secondary"
                underline="hover"
                sx={smallLink}
              >
                View all
              </MuiLink>
            </Stack>

            {loading ? (
              <Skeleton className="h-24" />
            ) : attention.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ borderRadius: 2, bgcolor: "var(--dc-surface-2)", p: 2 }}
              >
                All live products have healthy stock. 🎉
              </Typography>
            ) : (
              <List disablePadding>
                {attention.map(({ product, sizes }, index) => (
                  <ListItem
                    key={product.id}
                    disablePadding
                    divider={index < attention.length - 1}
                  >
                    <ListItemButton
                      component={Link}
                      href={`/admin/products/${product.id}`}
                      sx={{ gap: 1.5, px: 0, py: 1.5, borderRadius: 1 }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 48,
                          flexShrink: 0,
                          overflow: "hidden",
                          borderRadius: 1,
                          bgcolor: "var(--dc-surface-2)",
                        }}
                      >
                        {product.images[0] && (
                          <Box
                            component="img"
                            src={imageUrl(product.images[0], 100, "4:5")}
                            alt=""
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ fontWeight: 700 }}
                        >
                          {product.title}
                        </Typography>
                        <Stack
                          direction="row"
                          useFlexGap
                          spacing={0.5}
                          sx={{ mt: 0.5, flexWrap: "wrap" }}
                        >
                          {sizes.map((size) => (
                            <Chip
                              key={size.label}
                              size="small"
                              label={`${size.label}: ${size.stock === 0 ? "out" : size.stock}`}
                              color={size.stock === 0 ? "secondary" : "default"}
                              variant={size.stock === 0 ? "filled" : "outlined"}
                              sx={badge}
                            />
                          ))}
                        </Stack>
                      </Box>
                      <ArrowForward
                        fontSize="small"
                        sx={{ flexShrink: 0, color: "text.secondary" }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Card>

          {/* Recent */}
          <Card component="section" sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack
              direction="row"
              sx={{
                mb: 2,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" component="h2" sx={sectionTitle}>
                Latest drops
              </Typography>
              <MuiLink
                component={Link}
                href="/admin/products"
                color="text.secondary"
                underline="hover"
                sx={smallLink}
              >
                All products
              </MuiLink>
            </Stack>

            {loading ? (
              <Skeleton className="h-40" />
            ) : products.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ borderRadius: 2, bgcolor: "var(--dc-surface-2)", p: 2 }}
              >
                No products yet.{" "}
                <MuiLink
                  component={Link}
                  href="/admin/products/new"
                  color="inherit"
                  sx={{ fontWeight: 700 }}
                >
                  Add your first one
                </MuiLink>
                .
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(3, 1fr)",
                    sm: "repeat(5, 1fr)",
                  },
                  gap: 1.5,
                }}
              >
                {products.slice(0, 5).map((product) => (
                  <MuiLink
                    key={product.id}
                    component={Link}
                    href={`/admin/products/${product.id}`}
                    color="inherit"
                    underline="none"
                    sx={{
                      minWidth: 0,
                      "&:hover img": { transform: "scale(1.05)" },
                    }}
                  >
                    <Box
                      sx={{
                        aspectRatio: "3 / 4",
                        overflow: "hidden",
                        borderRadius: 2,
                        bgcolor: "var(--dc-surface-2)",
                      }}
                    >
                      {product.images[0] && (
                        <Box
                          component="img"
                          src={imageUrl(product.images[0], 240, "3:4")}
                          alt=""
                          sx={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            transition: "transform 150ms",
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      noWrap
                      sx={{ mt: 0.75, fontSize: 12, fontWeight: 700 }}
                    >
                      {product.title}
                    </Typography>
                    <Typography
                      noWrap
                      color="text.secondary"
                      sx={{ fontSize: 11 }}
                    >
                      {categoryName(product.category)}
                    </Typography>
                  </MuiLink>
                ))}
              </Box>
            )}
          </Card>
        </Stack>

        {/* Setup checklist */}
        <Card
          component="aside"
          sx={{ height: "fit-content", p: { xs: 2, sm: 2.5 } }}
        >
          <Stack
            direction="row"
            sx={{
              mb: 0.5,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" component="h2" sx={sectionTitle}>
              Store setup
            </Typography>
            <Chip
              size="small"
              label={`${setupDone}/${setup.length}`}
              color={setupDone === setup.length ? "primary" : "default"}
              variant={setupDone === setup.length ? "filled" : "outlined"}
              sx={{
                ...badge,
                ...(setupDone !== setup.length && {
                  borderColor: "var(--dc-line)",
                  color: "text.secondary",
                }),
              }}
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(setupDone / setup.length) * 100}
            sx={{
              mb: 2,
              height: 8,
              borderRadius: 999,
              bgcolor: "var(--dc-surface-2)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                bgcolor: "var(--dc-acid)",
              },
            }}
          />
          <Stack
            component="ul"
            spacing={1.5}
            sx={{ m: 0, p: 0, listStyle: "none" }}
          >
            {setup.map((item) => (
              <Stack
                component="li"
                key={item.label}
                direction="row"
                spacing={1.25}
              >
                <Box
                  aria-hidden
                  sx={{
                    mt: 0.25,
                    display: "flex",
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 1,
                    bgcolor: item.done
                      ? "var(--dc-acid)"
                      : "var(--dc-surface-2)",
                    color: "var(--dc-ink)",
                    border: "1.5px solid var(--dc-edge)",
                    "& svg": { fontSize: 12 },
                  }}
                >
                  {item.done ? <Check /> : <Close sx={{ opacity: 0.4 }} />}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    color={item.done ? "text.secondary" : "text.primary"}
                    sx={{
                      fontWeight: 700,
                      textDecoration: item.done ? "line-through" : "none",
                    }}
                  >
                    {item.label}
                  </Typography>
                  {!item.done && (
                    <Typography variant="caption" color="text.secondary">
                      {item.hint}
                    </Typography>
                  )}
                </Box>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Box>
    </>
  );
}
