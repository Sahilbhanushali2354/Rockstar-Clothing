"use client";

import Link from "next/link";
import { Box, Button, Card, Skeleton, Stack, Typography } from "@mui/material";

import type { Product } from "@/app/lib/productModel";
import ProductCard from "./ProductCard";

const grid = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(2, 1fr)",
    sm: "repeat(3, 1fr)",
    lg: "repeat(4, 1fr)",
  },
  gap: { xs: 1.5, sm: 2, lg: 3 },
} as const;

/*
 * Responsive product grid: 2 cols on phones (in-app browsers),
 * 3 on tablets, 4 on desktop. Handles loading + empty states.
 */
export default function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  categoryNames,
  empty,
}: {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
  /** slug → display name, to label each card */
  categoryNames?: Record<string, string>;
  empty?: {
    title: string;
    description?: string;
    action?: { label: string; href: string };
  };
}) {
  if (loading) {
    return (
      <Box sx={grid} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card
            key={i}
            sx={{ borderRadius: 3, border: "2px solid var(--dc-line)" }}
          >
            <Skeleton
              variant="rectangular"
              animation="pulse"
              sx={{ height: "auto", aspectRatio: "3 / 4" }}
            />
            <Stack spacing={1} sx={{ p: 1.5 }}>
              <Skeleton variant="rounded" height={12} width="50%" />
              <Skeleton variant="rounded" height={16} width="80%" />
              <Skeleton variant="rounded" height={16} width="33%" />
            </Stack>
          </Card>
        ))}
      </Box>
    );
  }

  if (products.length === 0) {
    return (
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
          {empty?.title ?? "Nothing here yet"}
        </Typography>
        {empty?.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 384 }}
          >
            {empty.description}
          </Typography>
        )}
        {empty?.action && (
          <Button
            component={Link}
            href={empty.action.href}
            variant="contained"
            sx={{ mt: 1 }}
          >
            {empty.action.label}
          </Button>
        )}
      </Stack>
    );
  }

  return (
    <Box sx={grid}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          categoryName={categoryNames?.[product.category]}
          priority={index < 4}
        />
      ))}
    </Box>
  );
}
