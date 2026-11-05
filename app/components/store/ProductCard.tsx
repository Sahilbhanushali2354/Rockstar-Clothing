"use client";

import Link from "next/link";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import { hasLowStock, isSoldOut, type Product } from "@/app/lib/productModel";
import { imageUrl } from "@/app/lib/imageUrl";
import Price from "./Price";

const badge = { height: 20, borderRadius: 1, border: "1.5px solid" } as const;

/*
 * The one product card used everywhere (shop, category, home, related).
 * Links to the product page — clothing needs a size before it can be bought.
 */
export default function ProductCard({
  product,
  categoryName,
  priority = false,
}: {
  product: Product;
  categoryName?: string;
  /** eager-load the image (first row above the fold) */
  priority?: boolean;
}) {
  const href = `/product/${encodeURIComponent(product.id)}`;
  const soldOut = isSoldOut(product);
  const lowStock = !soldOut && hasLowStock(product);
  const cover = product.images[0];
  const hover = product.images[1];

  return (
    <Card
      sx={{
        minWidth: 0,
        borderRadius: 3,
        border: "2px solid var(--dc-edge)",
        transition: "transform 150ms, box-shadow 150ms",
        "&:hover, &:focus-within": {
          transform: "translate(-2px, -2px)",
          boxShadow: "4px 4px 0 var(--dc-edge)",
        },
        "&:hover .cover": {
          transform: "scale(1.04)",
          ...(hover && { opacity: 0 }),
        },
        "&:hover .hover-img": { opacity: 1 },
      }}
    >
      <CardActionArea
        component={Link}
        href={href}
        disableRipple
        sx={{
          display: "flex",
          height: "100%",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            position: "relative",
            aspectRatio: "3 / 4",
            overflow: "hidden",
            borderBottom: "2px solid var(--dc-edge)",
            bgcolor: "var(--dc-surface-2)",
          }}
        >
          {cover && (
            <Box
              component="img"
              className="cover"
              src={imageUrl(cover, 600, "3:4")}
              srcSet={`${imageUrl(cover, 400, "3:4")} 400w, ${imageUrl(cover, 600, "3:4")} 600w, ${imageUrl(cover, 900, "3:4")} 900w`}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              alt={product.title}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              sx={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transition: "transform 500ms, opacity 500ms",
                ...(soldOut && { opacity: 0.6, filter: "grayscale(1)" }),
              }}
            />
          )}
          {hover && (
            <Box
              component="img"
              className="hover-img"
              src={imageUrl(hover, 600, "3:4")}
              alt=""
              loading="lazy"
              decoding="async"
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: 0,
                transition: "opacity 500ms",
              }}
            />
          )}

          <Stack
            spacing={0.5}
            sx={{
              position: "absolute",
              left: 8,
              top: 8,
              alignItems: "flex-start",
            }}
          >
            {soldOut ? (
              <Chip
                label="Sold out"
                size="small"
                color="secondary"
                sx={badge}
              />
            ) : product.featured ? (
              <Chip
                label="New drop"
                size="small"
                color="primary"
                sx={{ ...badge, borderColor: "var(--dc-ink)" }}
              />
            ) : null}
            {lowStock && (
              <Chip
                label="Few left"
                size="small"
                sx={{
                  ...badge,
                  bgcolor: "var(--dc-surface)",
                  borderColor: "var(--dc-edge)",
                }}
              />
            )}
          </Stack>
        </Box>

        <Stack spacing={0.5} sx={{ flex: 1, p: { xs: 1.25, sm: 1.75 } }}>
          {categoryName && (
            <Typography
              noWrap
              color="text.secondary"
              sx={{
                fontSize: { xs: 10, sm: 11 },
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              {categoryName}
            </Typography>
          )}
          <Typography
            component="h3"
            sx={{
              fontSize: { xs: 14, sm: 16 },
              fontWeight: 700,
              lineHeight: 1.375,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.title}
          </Typography>
          <Box sx={{ mt: "auto !important", pt: 0.5 }}>
            <Price
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              size="sm"
            />
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
