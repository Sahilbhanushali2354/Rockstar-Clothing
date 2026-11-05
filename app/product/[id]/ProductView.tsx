"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Breadcrumbs,
  Button,
  ButtonBase,
  Card,
  Chip,
  IconButton,
  Link as MuiLink,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import {
  Add,
  ArrowBack,
  Check,
  Favorite,
  FavoriteBorder,
  Remove,
  ShoppingBagOutlined,
  WhatsApp,
} from "@mui/icons-material";

import StoreShell, { Container } from "@/app/components/store/StoreShell";
import SectionHeader from "@/app/components/store/SectionHeader";
import ProductGrid from "@/app/components/store/ProductGrid";
import Price from "@/app/components/store/Price";
import WhatsAppButton from "@/app/components/WhatsAppButton";
import StickyWhatsAppBar from "@/app/components/StickyWhatsAppBar";

import { trackPixel } from "@/app/lib/metaPixel";
import {
  DEFAULT_SIZE_LABELS,
  LOW_STOCK,
  subscribeActiveProducts,
  subscribeProduct,
  slugToLabel,
  type Product,
  type ProductSize,
} from "@/app/lib/products";
import { imageUrl } from "@/app/lib/cloudinary";
import { buildWhatsAppUrl } from "@/app/lib/whatsapp";
import { useCategories } from "@/app/lib/useCategories";
import { addToCart } from "@/app/lib/features/cart/cartSlice";
import { toggleWishlist } from "@/app/lib/features/wishlist/wishlistSlice";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { STORE } from "@/app/theme/tokens";

const DISPLAY_FONT = "var(--font-display), var(--font-body), sans-serif";

const pulse = keyframes`
  50% { opacity: 0.5; }
`;

// Products saved without stock info fall back to default sizes, all available.
const UNTRACKED_STOCK = 99;

function getSizeOptions(product: Product): ProductSize[] {
  return product.sizes.length > 0
    ? product.sizes
    : DEFAULT_SIZE_LABELS.map((label) => ({ label, stock: UNTRACKED_STOCK }));
}

const firstAvailableSize = (product: Product) => {
  const options = getSizeOptions(product);
  return (options.find((size) => size.stock > 0) ?? options[0])?.label ?? "";
};

/*
 * Product page UI. Rendered with server-fetched data (instant paint,
 * link previews); then refreshes stock in the background so sizes are
 * never stale. If the server couldn't load it (`initialProduct`
 * undefined), it fetches on the client instead.
 */
export default function ProductView({
  productId,
  initialProduct,
  initialRelated = [],
}: {
  productId: string;
  initialProduct?: Product;
  initialRelated?: Product[];
}) {
  const dispatch = useAppDispatch();
  const { categories } = useCategories();

  const [product, setProduct] = useState<Product | null>(
    initialProduct ?? null,
  );
  const [related, setRelated] = useState<Product[]>(initialRelated);
  const [loading, setLoading] = useState(!initialProduct);
  const [notFound, setNotFound] = useState(false);

  const [selectedSize, setSelectedSize] = useState(() =>
    initialProduct ? firstAvailableSize(initialProduct) : "",
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  const isWishlisted = useAppSelector((state) =>
    product
      ? state.wishlist.items.some((item) => item.id === product.id)
      : false,
  );

  // Live product: price/stock/photo edits in admin appear instantly; if the
  // product is hidden or deleted, the page switches to "not found".
  useEffect(
    () =>
      subscribeProduct(
        productId,
        (found) => {
          setLoading(false);

          if (!found) {
            setProduct(null);
            setNotFound(true);
            return;
          }

          setNotFound(false);
          setProduct(found);
          // Keep the shopper's size if it's still in stock; otherwise pick one that is.
          setSelectedSize((current) => {
            const still = getSizeOptions(found).find(
              (size) => size.label === current && size.stock > 0,
            );
            return still ? current : firstAvailableSize(found);
          });

          if (!tracked.current) {
            tracked.current = true;
            trackPixel("ViewContent", {
              content_ids: [found.id],
              content_name: found.title,
              content_category: found.category,
              content_type: "product",
              value: found.price,
              currency: "INR",
            });
          }
        },
        (error) => {
          console.error("Error fetching product:", error);
          setLoading(false);
          // Keep showing server data if we have it.
          setNotFound((current) => current || !initialProduct);
        },
      ),
    // initial* props only seed state; re-subscribe only when the product changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productId],
  );

  // Live "You may also like" for this product's category.
  const productCategory = product?.category;
  useEffect(() => {
    if (!productCategory) return;
    return subscribeActiveProducts(productCategory, (list) =>
      setRelated(list.filter((item) => item.id !== productId).slice(0, 4)),
    );
  }, [productCategory, productId]);

  const sizeOptions = useMemo(
    () => (product ? getSizeOptions(product) : []),
    [product],
  );
  const selectedStock =
    sizeOptions.find((size) => size.label === selectedSize)?.stock ?? 0;
  const soldOut =
    sizeOptions.length > 0 && sizeOptions.every((size) => size.stock <= 0);
  const canBuy = !soldOut && selectedStock > 0;

  // If live stock drops below the chosen quantity, cap it.
  useEffect(() => {
    if (selectedStock > 0) setQuantity((q) => Math.min(q, selectedStock));
  }, [selectedStock]);

  const categoryName = product
    ? (categories.find((category) => category.slug === product.category)
        ?.name ?? slugToLabel(product.category))
    : "";

  const whatsAppItems = product
    ? [
        {
          name: product.title,
          price: product.price,
          quantity,
          size: selectedSize,
        },
      ]
    : [];

  const handleAddToCart = () => {
    if (!product || !canBuy) return;

    dispatch(
      addToCart({
        id: product.id,
        name: product.title,
        price: product.price,
        quantity,
        image: imageUrl(product.images[0], 300, "3:4"),
        size: selectedSize,
      }),
    );
    trackPixel("AddToCart", {
      content_ids: [product.id],
      content_name: product.title,
      content_type: "product",
      value: product.price * quantity,
      currency: "INR",
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    if (!product) return;
    dispatch(
      toggleWishlist({
        id: product.id,
        name: product.title,
        price: product.price,
        image: imageUrl(product.images[0], 300, "3:4"),
      }),
    );
  };

  // Keep thumbnails in sync when swiping the mobile gallery.
  const onGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeImage) setActiveImage(index);
  };

  const goToImage = (index: number) => {
    setActiveImage(index);
    const el = galleryRef.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <StoreShell>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, lg: 7 },
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            py: { xs: 4, lg: 6 },
          }}
        >
          <Skeleton
            variant="rounded"
            sx={{ height: "auto", aspectRatio: "4 / 5", borderRadius: 4 }}
          />
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={16} width={96} />
            <Skeleton variant="rounded" height={48} width="80%" />
            <Skeleton variant="rounded" height={32} width={128} />
            <Skeleton variant="rounded" height={96} />
            <Skeleton variant="rounded" height={56} />
          </Stack>
        </Box>
      </StoreShell>
    );
  }

  /* ---------- not found ---------- */
  if (notFound || !product) {
    return (
      <StoreShell>
        <Stack
          spacing={2}
          sx={{
            minHeight: "60vh",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            textAlign: "center",
          }}
        >
          <Typography variant="h1" component="p" sx={{ fontSize: 60 }}>
            Gone{" "}
            <Box component="span" className="dc-highlight">
              fast.
            </Box>
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 384 }}>
            This piece isn&apos;t available anymore, or the link is broken.
          </Typography>
          <Button
            component={Link}
            href="/shop"
            variant="contained"
            size="large"
          >
            Shop what&apos;s live →
          </Button>
        </Stack>
      </StoreShell>
    );
  }

  const sizeHelpHref = buildWhatsAppUrl(
    `Hey ${STORE.name}! 👋 Which size should I take in "${product.title}"? My usual size is: `,
  );

  const label = {
    fontSize: 14,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.025em",
  } as const;
  const badge = { height: 22, borderRadius: 1, border: "1.5px solid" } as const;

  return (
    <StoreShell container={false} stickyCta>
      <Container sx={{ py: { xs: 2.5, sm: 4 } }}>
        {/* Breadcrumb */}
        <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 2.5 }}>
          <MuiLink
            component={Link}
            href={`/category/${product.category}`}
            color="text.secondary"
            underline="none"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              fontSize: 14,
              fontWeight: 700,
              "&:hover": { color: "text.primary" },
            }}
          >
            <ArrowBack fontSize="small" /> {categoryName}
          </MuiLink>
        </Breadcrumbs>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, lg: 7 },
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {/* ================= GALLERY ================= */}
          <Box
            sx={{
              minWidth: 0,
              position: { md: "sticky" },
              top: { md: 96 },
              alignSelf: { md: "start" },
            }}
          >
            <Box
              sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 4,
                border: "2px solid var(--dc-edge)",
                bgcolor: "var(--dc-surface-2)",
              }}
            >
              <Box
                ref={galleryRef}
                onScroll={onGalleryScroll}
                sx={{
                  display: "flex",
                  aspectRatio: "4 / 5",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {(product.images.length ? product.images : [undefined]).map(
                  (image, index) => (
                    <Box
                      key={image?.publicId || image?.url || index}
                      sx={{
                        position: "relative",
                        height: "100%",
                        width: "100%",
                        flexShrink: 0,
                        scrollSnapAlign: "center",
                      }}
                    >
                      {image ? (
                        <Box
                          component="img"
                          src={imageUrl(image, 1200, "4:5")}
                          srcSet={[600, 900, 1200]
                            .map((w) => `${imageUrl(image, w, "4:5")} ${w}w`)
                            .join(", ")}
                          sizes="(min-width: 768px) 50vw, 100vw"
                          alt={`${product.title} — photo ${index + 1}`}
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "auto"}
                          sx={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            ...(soldOut && { filter: "grayscale(1)" }),
                          }}
                        />
                      ) : (
                        <Stack
                          sx={{
                            height: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "text.secondary",
                          }}
                        >
                          No photo
                        </Stack>
                      )}
                    </Box>
                  ),
                )}
              </Box>

              <Stack
                spacing={0.75}
                sx={{
                  pointerEvents: "none",
                  position: "absolute",
                  left: 12,
                  top: 12,
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
              </Stack>

              {product.images.length > 1 && (
                <Stack
                  direction="row"
                  spacing={0.75}
                  aria-hidden
                  sx={{
                    position: "absolute",
                    insetInline: 0,
                    bottom: 12,
                    justifyContent: "center",
                    display: { md: "none" },
                  }}
                >
                  {product.images.map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        height: 8,
                        width: index === activeImage ? 24 : 8,
                        borderRadius: 999,
                        border: "1px solid var(--dc-ink)",
                        bgcolor:
                          index === activeImage
                            ? "var(--dc-acid)"
                            : "var(--dc-paper)",
                        transition: "all 150ms",
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            {product.images.length > 1 && (
              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1.5, display: { xs: "none", md: "flex" } }}
              >
                {product.images.map((image, index) => (
                  <ButtonBase
                    key={image.publicId || image.url}
                    onClick={() => goToImage(index)}
                    aria-label={`Show photo ${index + 1}`}
                    aria-pressed={index === activeImage}
                    sx={{
                      aspectRatio: "4 / 5",
                      width: 64,
                      overflow: "hidden",
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor:
                        index === activeImage
                          ? "var(--dc-edge)"
                          : "transparent",
                      opacity: index === activeImage ? 1 : 0.6,
                      transition: "opacity 150ms, border-color 150ms",
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <Box
                      component="img"
                      src={imageUrl(image, 160, "4:5")}
                      alt=""
                      loading="lazy"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </ButtonBase>
                ))}
              </Stack>
            )}
          </Box>

          {/* ================= INFO ================= */}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              {categoryName}
            </Typography>
            <Typography
              variant="h1"
              sx={{ mt: 1, fontSize: { xs: 36, sm: 48 }, lineHeight: 0.95 }}
            >
              {product.title}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Price
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                size="lg"
              />
            </Box>

            {/* Size */}
            <Box sx={{ mt: 4 }}>
              <Stack
                direction="row"
                sx={{
                  mb: 1.5,
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <Typography sx={label}>
                  Size
                  {selectedSize && (
                    <Box
                      component="span"
                      sx={{ ml: 1, color: "text.secondary" }}
                    >
                      — {selectedSize}
                    </Box>
                  )}
                </Typography>
                <MuiLink
                  href={sizeHelpHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="inherit"
                  sx={{ fontSize: 14, fontWeight: 700, textUnderlineOffset: 4 }}
                >
                  Size help?
                </MuiLink>
              </Stack>
              <ToggleButtonGroup
                exclusive
                value={selectedSize}
                onChange={(_, value: string | null) => {
                  if (!value) return;
                  setSelectedSize(value);
                  setQuantity(1);
                }}
                aria-label="Size"
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                {sizeOptions.map((size) => {
                  const out = size.stock <= 0;
                  return (
                    <ToggleButton
                      key={size.label}
                      value={size.label}
                      disabled={out}
                      sx={{
                        height: 48,
                        minWidth: 52,
                        px: 1.5,
                        borderRadius: "8px !important",
                        border: "2px solid var(--dc-edge) !important",
                        ml: "0 !important",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "text.primary",
                        transition:
                          "transform 150ms, box-shadow 150ms, background-color 150ms",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          bgcolor: "transparent",
                        },
                        "&.Mui-selected, &.Mui-selected:hover": {
                          borderColor: "var(--dc-ink) !important",
                          bgcolor: "var(--dc-acid)",
                          color: "var(--dc-ink)",
                          boxShadow: "3px 3px 0 var(--dc-edge)",
                          transform: "none",
                        },
                        "&.Mui-disabled": {
                          borderColor: "var(--dc-line) !important",
                          color: "text.secondary",
                          textDecoration: "line-through",
                        },
                      }}
                    >
                      {size.label}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
              {canBuy && selectedStock <= LOW_STOCK && (
                <Typography
                  sx={{
                    mt: 1.5,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                      animation: `${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                    }}
                  />
                  Only {selectedStock} left in {selectedSize}
                </Typography>
              )}
            </Box>

            {/* Quantity */}
            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 3, alignItems: "center" }}
            >
              <Typography sx={label}>Qty</Typography>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  borderRadius: 2,
                  border: "2px solid var(--dc-edge)",
                }}
              >
                <IconButton
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  sx={{ width: 44, height: 44 }}
                >
                  <Remove fontSize="small" />
                </IconButton>
                <Typography
                  aria-live="polite"
                  sx={{
                    width: 32,
                    textAlign: "center",
                    fontFamily: DISPLAY_FONT,
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {quantity}
                </Typography>
                <IconButton
                  onClick={() =>
                    setQuantity((q) => Math.min(selectedStock, q + 1))
                  }
                  disabled={!canBuy || quantity >= selectedStock}
                  aria-label="Increase quantity"
                  sx={{ width: 44, height: 44 }}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            {/* Actions */}
            <Stack spacing={1.5} sx={{ mt: 4 }}>
              <WhatsAppButton
                items={whatsAppItems}
                source="product_page"
                contentIds={[product.id]}
                className="w-full"
                disabled={!canBuy}
                label={soldOut ? "Sold out" : "Buy via WhatsApp"}
              />
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleAddToCart}
                  disabled={!canBuy}
                  startIcon={added ? <Check /> : <ShoppingBagOutlined />}
                  sx={{ flex: 1 }}
                >
                  {added ? "Added" : "Add to cart"}
                </Button>
                <IconButton
                  onClick={handleWishlist}
                  aria-pressed={isWishlisted}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                  sx={{
                    width: 56,
                    height: 52,
                    borderRadius: 2,
                    border: "2px solid var(--dc-edge)",
                    boxShadow: "4px 4px 0 var(--dc-edge)",
                    bgcolor: isWishlisted
                      ? "var(--dc-acid)"
                      : "var(--dc-surface)",
                    color: isWishlisted ? "var(--dc-ink)" : "text.primary",
                    "&:hover": {
                      bgcolor: isWishlisted
                        ? "var(--dc-acid)"
                        : "var(--dc-surface)",
                      transform: "translate(-1px, -1px)",
                    },
                  }}
                >
                  {isWishlisted ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </Stack>
              {added && (
                <MuiLink
                  component={Link}
                  href="/cart"
                  color="inherit"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    textUnderlineOffset: 4,
                  }}
                >
                  View cart →
                </MuiLink>
              )}
            </Stack>

            {/* How it works */}
            <Box
              sx={{
                mt: 4,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                overflow: "hidden",
                borderRadius: 3,
                border: "2px solid var(--dc-edge)",
                textAlign: "center",
              }}
            >
              {[
                ["WhatsApp", "Order pre-typed"],
                ["UPI", "Pay securely"],
                ["Ships", "Across India"],
              ].map(([title, text], index) => (
                <Box
                  key={title}
                  sx={{
                    px: 1,
                    py: 1.5,
                    ...(index === 0 && {
                      bgcolor: "var(--dc-acid)",
                      color: "var(--dc-ink)",
                    }),
                    ...(index > 0 && {
                      borderLeft: "2px solid var(--dc-edge)",
                    }),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    {title}
                  </Typography>
                  <Typography sx={{ fontSize: 11, opacity: 0.7 }}>
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Description */}
            {product.description && (
              <Accordion
                defaultExpanded
                disableGutters
                elevation={0}
                sx={{
                  mt: 4,
                  bgcolor: "transparent",
                  borderTop: "2px solid var(--dc-edge)",
                  borderRadius: 0,
                  "&::before": { display: "none" },
                  "& .Mui-expanded .plus": { transform: "rotate(45deg)" },
                }}
              >
                <AccordionSummary
                  expandIcon={null}
                  sx={{
                    px: 0,
                    pt: 1.5,
                    minHeight: 0,
                    "& .MuiAccordionSummary-content": {
                      m: 0,
                      justifyContent: "space-between",
                    },
                  }}
                >
                  <Typography sx={label}>Details</Typography>
                  <Box
                    component="span"
                    className="plus"
                    sx={{ transition: "transform 150ms" }}
                  >
                    +
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 1.5, pb: 0 }}>
                  <Typography
                    color="text.secondary"
                    sx={{
                      whiteSpace: "pre-line",
                      fontSize: { xs: 14, sm: 16 },
                      lineHeight: 1.625,
                    }}
                  >
                    {product.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            <Card
              component="a"
              href={sizeHelpHref}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                mt: 3,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                borderRadius: 3,
                border: "2px solid var(--dc-line)",
                p: 2,
                fontSize: 14,
                color: "inherit",
                textDecoration: "none",
                transition: "border-color 150ms",
                "&:hover": { borderColor: "var(--dc-edge)" },
              }}
            >
              <WhatsApp sx={{ flexShrink: 0, fontSize: 24 }} />
              <Box component="span">
                <Box
                  component="span"
                  sx={{ display: "block", fontWeight: 700 }}
                >
                  Not sure about fit?
                </Box>
                <Box component="span" sx={{ color: "text.secondary" }}>
                  Chat with us — we&apos;ll help you pick a size.
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* ================= RELATED ================= */}
      {related.length > 0 && (
        <Box
          component="section"
          sx={{ borderTop: "2px solid var(--dc-edge)", py: { xs: 7, sm: 10 } }}
        >
          <Container>
            <SectionHeader
              title="You may"
              highlight="also like"
              action={{
                label: `More ${categoryName}`,
                href: `/category/${product.category}`,
              }}
            />
            <ProductGrid products={related} />
          </Container>
        </Box>
      )}

      <StickyWhatsAppBar
        items={whatsAppItems}
        source="product_sticky_bar"
        contentIds={[product.id]}
        summary={
          soldOut
            ? "Sold out"
            : `Size ${selectedSize} · ₹${(product.price * quantity).toLocaleString("en-IN")}`
        }
        label={soldOut ? "Sold out" : "Buy on WhatsApp"}
        disabled={!canBuy}
      />
    </StoreShell>
  );
}
