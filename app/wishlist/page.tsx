"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import StoreShell from "../components/store/StoreShell";
import SectionHeader from "../components/store/SectionHeader";
import { inr } from "../components/store/Price";
import { removeFromWishlist } from "../lib/features/wishlist/wishlistSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.wishlist.items);

  return (
    <StoreShell className="py-10 sm:py-14">
      <SectionHeader
        as="h1"
        eyebrow={items.length ? `${items.length} saved` : "Wishlist"}
        title="Saved"
        highlight="fits"
      />

      {items.length === 0 ? (
        <Stack
          spacing={2}
          sx={{
            alignItems: "center",
            borderRadius: 4,
            border: "2px dashed var(--dc-line)",
            px: 3,
            py: 10,
            textAlign: "center",
          }}
        >
          <Typography variant="h2" component="p" sx={{ fontSize: 36 }}>
            Nothing{" "}
            <Box component="span" className="dc-highlight">
              saved.
            </Box>
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 384 }}>
            Tap the heart on any product to save it here.
          </Typography>
          <Button
            component={Link}
            href="/shop"
            variant="contained"
            size="large"
          >
            Browse the drop →
          </Button>
        </Stack>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: { xs: 1.5, sm: 2, lg: 3 },
          }}
        >
          {items.map((item) => {
            const href = `/product/${encodeURIComponent(String(item.id))}`;

            return (
              <Card
                key={item.id}
                sx={{
                  position: "relative",
                  borderRadius: 3,
                  border: "2px solid var(--dc-edge)",
                  transition: "transform 150ms, box-shadow 150ms",
                  "&:hover": {
                    transform: "translate(-2px, -2px)",
                    boxShadow: "4px 4px 0 var(--dc-edge)",
                  },
                  "&:hover .wish-img": { transform: "scale(1.04)" },
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
                      aspectRatio: "3 / 4",
                      overflow: "hidden",
                      borderBottom: "2px solid var(--dc-edge)",
                      bgcolor: "var(--dc-surface-2)",
                    }}
                  >
                    {item.image && (
                      <Box
                        component="img"
                        className="wish-img"
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        sx={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          transition: "transform 500ms",
                        }}
                      />
                    )}
                  </Box>
                  <Stack
                    spacing={0.5}
                    sx={{ flex: 1, p: { xs: 1.25, sm: 1.75 } }}
                  >
                    <Typography
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
                      {item.name}
                    </Typography>
                    <Typography
                      sx={{
                        mt: "auto !important",
                        fontFamily:
                          "var(--font-display), var(--font-body), sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {inr(item.price)}
                    </Typography>
                  </Stack>
                </CardActionArea>
                <IconButton
                  size="small"
                  onClick={() => dispatch(removeFromWishlist(item.id))}
                  aria-label={`Remove ${item.name} from wishlist`}
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    border: "2px solid var(--dc-ink)",
                    bgcolor: "var(--dc-paper)",
                    color: "var(--dc-ink)",
                    "&:hover": { bgcolor: "var(--dc-acid)" },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Card>
            );
          })}
        </Box>
      )}
    </StoreShell>
  );
}
