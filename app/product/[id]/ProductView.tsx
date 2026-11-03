"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCheck, FiHeart, FiMinus, FiPlus, FiShoppingBag } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

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
  getActiveProducts,
  getProduct,
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

  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [related, setRelated] = useState<Product[]>(initialRelated);
  const [loading, setLoading] = useState(!initialProduct);
  const [notFound, setNotFound] = useState(false);

  const [selectedSize, setSelectedSize] = useState(() => (initialProduct ? firstAvailableSize(initialProduct) : ""));
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  const isWishlisted = useAppSelector((state) =>
    product ? state.wishlist.items.some((item) => item.id === product.id) : false,
  );

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        // Fresh read (live stock). Silent when we already have server data.
        const found = await getProduct(productId);
        if (!active) return;

        if (!found) {
          setProduct(null);
          setNotFound(true);
          return;
        }

        setProduct(found);
        // Keep the shopper's size if it's still in stock; otherwise pick one that is.
        setSelectedSize((current) => {
          const still = getSizeOptions(found).find((size) => size.label === current && size.stock > 0);
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

        if (initialRelated.length === 0) {
          getActiveProducts(found.category)
            .then((list) => active && setRelated(list.filter((item) => item.id !== found.id).slice(0, 4)))
            .catch(() => undefined);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        // Only show "not found" if we had nothing to display.
        if (active && !initialProduct) {
          setProduct(null);
          setNotFound(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
    // initial* props only seed state; re-run only when the product changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const sizeOptions = useMemo(() => (product ? getSizeOptions(product) : []), [product]);
  const selectedStock = sizeOptions.find((size) => size.label === selectedSize)?.stock ?? 0;
  const soldOut = sizeOptions.length > 0 && sizeOptions.every((size) => size.stock <= 0);
  const canBuy = !soldOut && selectedStock > 0;

  const categoryName = product
    ? categories.find((category) => category.slug === product.category)?.name ?? slugToLabel(product.category)
    : "";

  const whatsAppItems = product
    ? [{ name: product.title, price: product.price, quantity, size: selectedSize }]
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
        <div className="grid gap-8 py-8 md:grid-cols-2 lg:gap-14 lg:py-12">
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-surface-2" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
            <div className="h-12 w-4/5 animate-pulse rounded bg-surface-2" />
            <div className="h-8 w-32 animate-pulse rounded bg-surface-2" />
            <div className="h-24 animate-pulse rounded bg-surface-2" />
            <div className="h-14 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
      </StoreShell>
    );
  }

  /* ---------- not found ---------- */
  if (notFound || !product) {
    return (
      <StoreShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="font-display text-6xl font-bold">
            Gone <span className="dc-highlight">fast.</span>
          </p>
          <p className="max-w-sm text-muted">This piece isn&apos;t available anymore, or the link is broken.</p>
          <Link href="/shop" className="btn-brutal btn-primary">
            Shop what&apos;s live →
          </Link>
        </div>
      </StoreShell>
    );
  }

  const sizeHelpHref = buildWhatsAppUrl(
    `Hey ${STORE.name}! 👋 Which size should I take in "${product.title}"? My usual size is: `,
  );

  return (
    <StoreShell container={false} stickyCta>
      <Container className="py-5 sm:py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm font-bold text-muted">
          <Link href={`/category/${product.category}`} className="inline-flex items-center gap-1.5 hover:text-fg">
            <FiArrowLeft /> {categoryName}
          </Link>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
          {/* ================= GALLERY ================= */}
          <div className="min-w-0 md:sticky md:top-24 md:self-start">
            <div className="relative overflow-hidden rounded-2xl border-2 border-edge bg-surface-2">
              <div
                ref={galleryRef}
                onScroll={onGalleryScroll}
                className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {(product.images.length ? product.images : [undefined]).map((image, index) => (
                  <div key={image?.publicId || image?.url || index} className="relative h-full w-full shrink-0 snap-center">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl(image, 1200, "4:5")}
                        srcSet={[600, 900, 1200].map((w) => `${imageUrl(image, w, "4:5")} ${w}w`).join(", ")}
                        sizes="(min-width: 768px) 50vw, 100vw"
                        alt={`${product.title} — photo ${index + 1}`}
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        className={`h-full w-full object-contain ${soldOut ? "grayscale" : ""}`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted">No photo</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
                {soldOut ? (
                  <span className="dc-badge dc-badge-ink">Sold out</span>
                ) : product.featured ? (
                  <span className="dc-badge dc-badge-live">New drop</span>
                ) : null}
              </div>

              {product.images.length > 1 && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
                  {product.images.map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 rounded-full border border-ink transition-all ${
                        index === activeImage ? "w-6 bg-acid" : "w-2 bg-paper"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="mt-3 hidden gap-2 md:flex">
                {product.images.map((image, index) => (
                  <button
                    key={image.publicId || image.url}
                    type="button"
                    onClick={() => goToImage(index)}
                    aria-label={`Show photo ${index + 1}`}
                    aria-pressed={index === activeImage}
                    className={`aspect-[4/5] w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                      index === activeImage ? "border-edge" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl(image, 160, "4:5")} alt="" loading="lazy" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= INFO ================= */}
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">{categoryName}</p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
              {product.title}
            </h1>
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" className="mt-4" />

            {/* Size */}
            <div className="mt-8">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-sm font-extrabold uppercase tracking-wide">
                  Size{selectedSize && <span className="ml-2 text-muted">— {selectedSize}</span>}
                </p>
                <a href={sizeHelpHref} target="_blank" rel="noopener noreferrer" className="text-sm font-bold underline underline-offset-4">
                  Size help?
                </a>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                {sizeOptions.map((size) => {
                  const selected = size.label === selectedSize;
                  const out = size.stock <= 0;
                  return (
                    <button
                      key={size.label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={out}
                      onClick={() => {
                        setSelectedSize(size.label);
                        setQuantity(1);
                      }}
                      className={`relative h-12 min-w-[3.25rem] rounded-lg border-2 px-3 text-sm font-extrabold uppercase transition-[transform,box-shadow,background-color] ${
                        selected
                          ? "border-ink bg-acid text-ink shadow-brutal-sm"
                          : out
                            ? "cursor-not-allowed border-line text-muted line-through"
                            : "border-edge hover:-translate-y-0.5"
                      }`}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
              {canBuy && selectedStock <= LOW_STOCK && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
                  Only {selectedStock} left in {selectedSize}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-6 flex items-center gap-4">
              <p className="text-sm font-extrabold uppercase tracking-wide">Qty</p>
              <div className="flex items-center rounded-lg border-2 border-edge">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex h-11 w-11 items-center justify-center disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <FiMinus />
                </button>
                <span className="w-8 text-center font-display text-lg font-bold" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(selectedStock, q + 1))}
                  disabled={!canBuy || quantity >= selectedStock}
                  className="flex h-11 w-11 items-center justify-center disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <FiPlus />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <WhatsAppButton
                items={whatsAppItems}
                source="product_page"
                contentIds={[product.id]}
                className="w-full"
                disabled={!canBuy}
                label={soldOut ? "Sold out" : "Buy via WhatsApp"}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canBuy}
                  className="btn-brutal btn-ink flex-1"
                >
                  {added ? <FiCheck /> : <FiShoppingBag />}
                  {added ? "Added" : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={handleWishlist}
                  aria-pressed={isWishlisted}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`btn-brutal w-14 px-0 ${isWishlisted ? "btn-primary" : "bg-surface"}`}
                >
                  <FiHeart className={isWishlisted ? "fill-current" : ""} />
                </button>
              </div>
              {added && (
                <Link href="/cart" className="block text-center text-sm font-bold underline underline-offset-4">
                  View cart →
                </Link>
              )}
            </div>

            {/* How it works */}
            <div className="mt-8 grid grid-cols-3 overflow-hidden rounded-xl border-2 border-edge text-center">
              {[
                ["WhatsApp", "Order pre-typed"],
                ["UPI", "Pay securely"],
                ["Ships", "Across India"],
              ].map(([title, text], index) => (
                <div key={title} className={`px-2 py-3 ${index === 0 ? "bg-acid text-ink" : ""} ${index > 0 ? "border-l-2 border-edge" : ""}`}>
                  <p className="text-xs font-extrabold uppercase">{title}</p>
                  <p className="text-[11px] opacity-70">{text}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <details open className="group mt-8 border-t-2 border-edge pt-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-extrabold uppercase tracking-wide">
                  Details
                  <span className="transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">{product.description}</p>
              </details>
            )}

            <a
              href={sizeHelpHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center gap-3 rounded-xl border-2 border-line p-4 text-sm transition-colors hover:border-edge"
            >
              <FaWhatsapp className="shrink-0 text-2xl" />
              <span>
                <span className="block font-bold">Not sure about fit?</span>
                <span className="text-muted">Chat with us — we&apos;ll help you pick a size.</span>
              </span>
            </a>
          </div>
        </div>
      </Container>

      {/* ================= RELATED ================= */}
      {related.length > 0 && (
        <section className="border-t-2 border-edge py-14 sm:py-20">
          <Container>
            <SectionHeader
              title="You may"
              highlight="also like"
              action={{ label: `More ${categoryName}`, href: `/category/${product.category}` }}
            />
            <ProductGrid products={related} />
          </Container>
        </section>
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
