"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import StoreShell, { Container } from "./StoreShell";
import SectionHeader from "./SectionHeader";
import ProductGrid from "./ProductGrid";
import { useCategories } from "@/app/lib/useCategories";
import {
  subscribeActiveProducts,
  isSoldOut,
  slugToLabel,
  toSlug,
  type Product,
  type StoreCategory,
} from "@/app/lib/products";

type Sort = "new" | "price-asc" | "price-desc";

const SORTS: { key: Sort; label: string }[] = [
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
];

/*
 * Shared catalog page for /shop (all products) and /category/[slug].
 * Category chips, sort, "hide sold out", product grid.
 *
 * `initialProducts` comes from the server (instant paint + SEO); the
 * client then refreshes silently for live stock. `null` = the server
 * couldn't load them, so the client fetches with a loading state.
 */
export default function Catalog({
  categorySlug,
  initialProducts = null,
  initialCategories = [],
}: {
  categorySlug?: string;
  initialProducts?: Product[] | null;
  initialCategories?: StoreCategory[];
}) {
  const slug = categorySlug ? toSlug(categorySlug) : "";
  const live = useCategories();
  // Use live categories once loaded; server-provided ones until then.
  const categories = live.loading ? initialCategories : live.categories;

  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(initialProducts === null);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState<Sort>("new");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Live: products added/edited/hidden in admin appear here instantly.
  useEffect(() => {
    setError(false);

    return subscribeActiveProducts(
      slug || undefined,
      (list) => {
        setProducts(list);
        setError(false);
        setLoading(false);
      },
      (fetchError) => {
        console.error("Failed to load products:", fetchError);
        // Keep showing server data if we have it.
        if (initialProducts === null) setError(true);
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const category = categories.find((item) => item.slug === slug);
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.slug, item.name])),
    [categories],
  );

  const visible = useMemo(() => {
    const list = inStockOnly
      ? products.filter((product) => !isSoldOut(product))
      : [...products];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    // "new" is already newest-first from getActiveProducts
    return list;
  }, [products, sort, inStockOnly]);

  const title = slug ? (category?.name ?? slugToLabel(slug)) : "Shop";

  const chipSx = (active: boolean) => ({
    flexShrink: 0,
    height: 36,
    px: 0.5,
    borderRadius: 999,
    border: "2px solid",
    fontSize: 14,
    fontWeight: 700,
    textTransform: "none",
    letterSpacing: 0,
    cursor: "pointer",
    ...(active
      ? {
          borderColor: "var(--dc-ink)",
          bgcolor: "var(--dc-acid)",
          color: "var(--dc-ink)",
          "&:hover": { bgcolor: "var(--dc-acid)" },
        }
      : {
          borderColor: "var(--dc-line)",
          bgcolor: "transparent",
          "&:hover": { borderColor: "var(--dc-edge)", bgcolor: "transparent" },
        }),
  });

  return (
    <StoreShell container={false}>
      {/* Header band */}
      <Box
        component="section"
        sx={{
          borderBottom: "2px solid var(--dc-edge)",
          bgcolor: "var(--dc-surface)",
        }}
      >
        <Container sx={{ pb: 3, pt: { xs: 5, sm: 7 } }}>
          <SectionHeader
            as="h1"
            eyebrow={slug ? "Collection" : "All products"}
            title={slug ? title : "Shop the"}
            highlight={slug ? undefined : "drop"}
            description={
              slug
                ? category?.subtitle || "Fresh fits, limited stock."
                : "Every piece, every collection. Limited stock — when it's gone, it's gone."
            }
          />

          {/* Category chips */}
          {categories.length > 0 && (
            <Stack
              component="nav"
              aria-label="Collections"
              direction="row"
              spacing={1}
              useFlexGap
              sx={{
                mx: { xs: -2, sm: 0 },
                px: { xs: 2, sm: 0 },
                pb: 0.5,
                overflowX: "auto",
                flexWrap: { xs: "nowrap", sm: "wrap" },
              }}
            >
              <Chip
                component={Link}
                href="/shop"
                label="All"
                clickable
                aria-current={!slug ? "page" : undefined}
                sx={chipSx(!slug)}
              />
              {categories.map((item) => (
                <Chip
                  key={item.id}
                  component={Link}
                  href={`/category/${item.slug}`}
                  label={item.name}
                  clickable
                  aria-current={item.slug === slug ? "page" : undefined}
                  sx={chipSx(item.slug === slug)}
                />
              ))}
            </Stack>
          )}
        </Container>
      </Box>

      <Container sx={{ py: { xs: 3, sm: 5 } }}>
        {/* Toolbar */}
        <Stack
          direction="row"
          useFlexGap
          spacing={1.5}
          sx={{
            mb: 2.5,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
            aria-live="polite"
          >
            {loading
              ? "Loading…"
              : `${visible.length} ${visible.length === 1 ? "piece" : "pieces"}`}
          </Typography>

          <Stack
            direction="row"
            useFlexGap
            spacing={1}
            sx={{ flexWrap: "wrap", alignItems: "center" }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                  sx={{
                    p: 0.5,
                    color: "var(--dc-edge)",
                    "&.Mui-checked": { color: "var(--dc-edge)" },
                  }}
                />
              }
              label="In stock"
              sx={{
                m: 0,
                pl: 0.75,
                pr: 1.5,
                borderRadius: 999,
                border: "2px solid var(--dc-line)",
                "& .MuiFormControlLabel-label": {
                  fontSize: 14,
                  fontWeight: 700,
                },
              }}
            />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={sort}
              onChange={(_, value: Sort | null) => value && setSort(value)}
              aria-label="Sort"
              sx={{
                p: 0.25,
                borderRadius: 999,
                border: "2px solid var(--dc-edge)",
                "& .MuiToggleButton-root": {
                  border: 0,
                  borderRadius: "999px !important",
                  px: 1.5,
                  py: 0.5,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.025em",
                  color: "text.secondary",
                  "&:hover": { color: "text.primary", bgcolor: "transparent" },
                  "&.Mui-selected, &.Mui-selected:hover": {
                    bgcolor: "var(--dc-text)",
                    color: "var(--dc-bg)",
                  },
                },
              }}
            >
              {SORTS.map((option) => (
                <ToggleButton key={option.key} value={option.key}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {error ? (
          <Stack
            spacing={1.5}
            sx={{
              alignItems: "center",
              borderRadius: 3,
              border: "2px dashed var(--dc-line)",
              px: 3,
              py: 8,
              textAlign: "center",
            }}
          >
            <Typography variant="h4" component="p" sx={{ fontSize: 24 }}>
              Couldn&apos;t load products
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </Stack>
        ) : (
          <ProductGrid
            products={visible}
            loading={loading}
            categoryNames={slug ? undefined : categoryNames}
            empty={
              inStockOnly && products.length > 0
                ? {
                    title: "All sold out",
                    description:
                      "Everything here is sold out right now. Restocks drop on Instagram first.",
                  }
                : {
                    title: "Dropping soon",
                    description: "Nothing here yet — check back soon.",
                    action: { label: "Shop all", href: "/shop" },
                  }
            }
          />
        )}
      </Container>
    </StoreShell>
  );
}
