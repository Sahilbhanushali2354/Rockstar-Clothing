"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Add, DeleteOutlined, Remove } from "@mui/icons-material";

import StoreShell from "../components/store/StoreShell";
import SectionHeader from "../components/store/SectionHeader";
import { inr } from "../components/store/Price";
import WhatsAppButton from "../components/WhatsAppButton";
import StickyWhatsAppBar from "../components/StickyWhatsAppBar";
import {
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
} from "../lib/features/cart/cartSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

const DISPLAY_FONT = "var(--font-display), var(--font-body), sans-serif";
const badge = {
  height: 22,
  borderRadius: 1,
  border: "1.5px solid var(--dc-edge)",
  bgcolor: "var(--dc-surface)",
} as const;

export default function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const contentIds = items.map((item) => String(item.id));

  return (
    <StoreShell stickyCta={items.length > 0} className="py-10 sm:py-14">
      <SectionHeader
        as="h1"
        eyebrow={
          count > 0 ? `${count} ${count === 1 ? "item" : "items"}` : "Cart"
        }
        title="Your"
        highlight="bag"
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
            It&apos;s{" "}
            <Box component="span" className="dc-highlight">
              empty.
            </Box>
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 384 }}>
            Your next fit is one tap away.
          </Typography>
          <Button
            component={Link}
            href="/shop"
            variant="contained"
            size="large"
          >
            Shop the drop →
          </Button>
        </Stack>
      ) : (
        <Box
          sx={{
            display: "grid",
            alignItems: "start",
            gap: { xs: 3, lg: 5 },
            gridTemplateColumns: { xs: "1fr", lg: "1fr 380px" },
          }}
        >
          {/* Items */}
          <Stack
            component="ul"
            spacing={1.5}
            sx={{ m: 0, p: 0, listStyle: "none" }}
          >
            {items.map((item) => {
              const key = { id: item.id, size: item.size, color: item.color };
              const href = `/product/${encodeURIComponent(String(item.id))}`;

              return (
                <Card
                  component="li"
                  key={`${item.id}-${item.size ?? ""}-${item.color ?? ""}`}
                  sx={{
                    display: "flex",
                    gap: { xs: 1.5, sm: 2.5 },
                    borderRadius: 3,
                    border: "2px solid var(--dc-edge)",
                    p: { xs: 1.5, sm: 2 },
                  }}
                >
                  <Box
                    component={Link}
                    href={href}
                    sx={{
                      aspectRatio: "3 / 4",
                      width: { xs: 96, sm: 112 },
                      flexShrink: 0,
                      overflow: "hidden",
                      borderRadius: 2,
                      border: "2px solid var(--dc-edge)",
                      bgcolor: "var(--dc-surface-2)",
                    }}
                  >
                    {item.image && (
                      <Box
                        component="img"
                        src={item.image}
                        alt={item.name}
                        sx={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </Box>

                  <Stack sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <MuiLink
                        component={Link}
                        href={href}
                        color="inherit"
                        underline="hover"
                        sx={{
                          fontWeight: 700,
                          lineHeight: 1.375,
                          fontSize: { sm: 18 },
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.name}
                      </MuiLink>
                      <IconButton
                        size="small"
                        onClick={() => dispatch(removeFromCart(key))}
                        aria-label={`Remove ${item.name}`}
                        sx={{
                          color: "text.secondary",
                          "&:hover": { color: "error.main" },
                        }}
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Stack
                      direction="row"
                      useFlexGap
                      spacing={0.75}
                      sx={{ mt: 0.5, flexWrap: "wrap" }}
                    >
                      {item.size && (
                        <Chip
                          size="small"
                          label={`Size ${item.size}`}
                          sx={badge}
                        />
                      )}
                      {item.color && (
                        <Chip size="small" label={item.color} sx={badge} />
                      )}
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        mt: "auto",
                        pt: 1.5,
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          alignItems: "center",
                          borderRadius: 2,
                          border: "2px solid var(--dc-edge)",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => dispatch(decreaseQuantity(key))}
                          aria-label={
                            item.quantity === 1
                              ? `Remove ${item.name}`
                              : "Decrease quantity"
                          }
                          sx={{ width: 36, height: 36 }}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography
                          sx={{
                            width: 28,
                            textAlign: "center",
                            fontFamily: DISPLAY_FONT,
                            fontWeight: 700,
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => dispatch(increaseQuantity(key))}
                          aria-label="Increase quantity"
                          sx={{ width: 36, height: 36 }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          sx={{
                            fontFamily: DISPLAY_FONT,
                            fontSize: 18,
                            fontWeight: 700,
                          }}
                        >
                          {inr(item.price * item.quantity)}
                        </Typography>
                        {item.quantity > 1 && (
                          <Typography variant="caption" color="text.secondary">
                            {inr(item.price)} each
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Stack>
                </Card>
              );
            })}
          </Stack>

          {/* Summary */}
          <Paper
            component="aside"
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "2px solid var(--dc-edge)",
              p: { xs: 2.5, sm: 3 },
              boxShadow: "6px 6px 0 var(--dc-edge)",
              position: { lg: "sticky" },
              top: { lg: 96 },
            }}
          >
            <Typography variant="h5" component="h2" sx={{ fontSize: 24 }}>
              Summary
            </Typography>
            <Stack
              component="dl"
              spacing={1.5}
              sx={{ mt: 2.5, mb: 0, fontSize: 14 }}
            >
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Box component="dt" sx={{ color: "text.secondary" }}>
                  Subtotal ({count})
                </Box>
                <Box component="dd" sx={{ m: 0, fontWeight: 700 }}>
                  {inr(total)}
                </Box>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Box component="dt" sx={{ color: "text.secondary" }}>
                  Shipping
                </Box>
                <Box component="dd" sx={{ m: 0, fontWeight: 700 }}>
                  Confirmed on WhatsApp
                </Box>
              </Stack>
            </Stack>
            <Divider
              sx={{ my: 2.5, borderBottomWidth: 2, borderStyle: "dashed" }}
            />
            <Stack
              direction="row"
              sx={{ alignItems: "baseline", justifyContent: "space-between" }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                Total
              </Typography>
              <Typography
                sx={{ fontFamily: DISPLAY_FONT, fontSize: 30, fontWeight: 700 }}
              >
                {inr(total)}
              </Typography>
            </Stack>

            <Box sx={{ mt: 3 }}>
              <WhatsAppButton
                items={items}
                source="cart_summary"
                contentIds={contentIds}
                label="Order via WhatsApp"
                className="w-full"
              />
            </Box>

            <Stack
              component="ol"
              spacing={1}
              sx={{ mt: 3, mb: 0, p: 0, listStyle: "none", fontSize: 14 }}
            >
              {[
                "Tap the button — your order is pre-typed",
                "We confirm size & stock on chat",
                "Pay via UPI, we ship",
              ].map((step, index) => (
                <Stack component="li" direction="row" spacing={1.5} key={step}>
                  <Box
                    component="span"
                    sx={{
                      display: "flex",
                      width: 24,
                      height: 24,
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1.5,
                      border: "2px solid var(--dc-ink)",
                      bgcolor: "var(--dc-acid)",
                      color: "var(--dc-ink)",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    {step}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>
      )}

      {items.length > 0 && (
        <StickyWhatsAppBar
          items={items}
          source="cart_sticky_bar"
          contentIds={contentIds}
          summary={`${count} ${count === 1 ? "item" : "items"} · ${inr(total)}`}
          label="Order now"
        />
      )}
    </StoreShell>
  );
}
