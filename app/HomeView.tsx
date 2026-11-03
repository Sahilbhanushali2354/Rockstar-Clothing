"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

import StoreShell, { Container } from "./components/store/StoreShell";
import SectionHeader from "./components/store/SectionHeader";
import ProductGrid from "./components/store/ProductGrid";
import Marquee from "./components/store/Marquee";
import { useCategories } from "./lib/useCategories";
import { useStoreSettings } from "./lib/useStoreSettings";
import { getActiveProducts, type Product, type StoreCategory } from "./lib/products";
import { imageUrl } from "./lib/imageUrl";
import { buildWhatsAppUrl } from "./lib/whatsapp";
import { trackPixel } from "./lib/metaPixel";
import { DEFAULT_SETTINGS, instagramUrl, type StoreSettings } from "./lib/storeSettings";
import { STORE } from "./theme/tokens";

const categoryImage = (url: string, publicId: string, width: number) =>
  url ? imageUrl({ url, publicId }, width) : "";

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
  const categories = liveCategories.loading ? initialCategories : liveCategories.categories;
  const categoriesLoading = liveCategories.loading && initialCategories.length === 0;
  // Live settings replace the server copy once the listener has data.
  const settings = liveSettings === DEFAULT_SETTINGS ? initialSettings : liveSettings;

  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [productsLoading, setProductsLoading] = useState(initialProducts === null);

  useEffect(() => {
    let active = true;
    getActiveProducts()
      .then((list) => active && setProducts(list))
      .catch((error) => console.error("Failed to load products:", error))
      .finally(() => active && setProductsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const instagramHandle = `@${settings.instagramHandle}`;
  const instagramHref = instagramUrl(settings.instagramHandle);

  // Featured first, then newest.
  const drops = useMemo(
    () => [...products].sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt - a.createdAt).slice(0, 8),
    [products],
  );

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.slug, category.name])),
    [categories],
  );

  const heroCategory = categories.find((category) => category.imageUrl);
  const heroImage =
    (heroCategory && categoryImage(heroCategory.imageUrl, heroCategory.imagePath, 1000)) ||
    (drops[0]?.images[0] ? imageUrl(drops[0].images[0], 1000, "4:5") : "");
  const editorial = categories.filter((category) => category.imageUrl)[1] ?? heroCategory;

  const whatsappHref = buildWhatsAppUrl(`Hey ${STORE.name}! 👋 What's new in the latest drop?`);

  return (
    <StoreShell container={false}>
      {/* ================= HERO ================= */}
      <section className="dc-inverse relative overflow-hidden border-b-2 border-edge">
        <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="relative z-10">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em]" style={{ borderColor: "var(--dc-inverse-text)" }}>
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--dc-inverse-accent)" }} />
              {settings.heroBadge}
            </p>
            <h1 className="max-w-[12ch] font-display text-[3.4rem] font-bold leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
              {settings.heroTitle}{" "}
              <span className="dc-highlight -rotate-2">{settings.heroHighlight}</span>
            </h1>
            <p className="mt-6 max-w-md text-base opacity-80 sm:text-lg">{settings.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="btn-brutal"
                style={{
                  background: "var(--dc-inverse-accent)",
                  color: "var(--dc-inverse-bg)",
                  borderColor: "var(--dc-inverse-text)",
                  boxShadow: "4px 4px 0 var(--dc-inverse-text)",
                }}
              >
                Shop the drop →
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackPixel("Contact", { source: "home_hero" })}
                className="btn-brutal"
                style={{
                  background: "transparent",
                  color: "var(--dc-inverse-text)",
                  borderColor: "var(--dc-inverse-text)",
                  boxShadow: "none",
                }}
              >
                <FaWhatsapp className="text-lg" /> Ask on WhatsApp
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="relative aspect-[4/5] -rotate-2 overflow-hidden rounded-2xl border-[3px]"
              style={{ borderColor: "var(--dc-inverse-text)", boxShadow: "10px 10px 0 var(--dc-inverse-accent)" }}
            >
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt="Latest DOPAMINE CLUB drop" fetchPriority="high" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full animate-pulse" style={{ background: "var(--dc-inverse-accent)", opacity: 0.25 }} />
              )}
            </div>
            <span
              className="absolute -bottom-4 -left-2 rotate-[-8deg] rounded-lg border-[3px] px-4 py-2 font-display text-xl font-bold uppercase sm:-left-6"
              style={{ background: "var(--dc-inverse-accent)", color: "var(--dc-inverse-bg)", borderColor: "var(--dc-inverse-text)" }}
            >
              Fresh fits ✦
            </span>
          </div>
        </Container>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeader eyebrow="Collections" title="Shop by" highlight="vibe" action={{ label: "Shop all", href: "/shop" }} />

          {categoriesLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-surface-2" />
              ))}
            </div>
          ) : categories.length === 0 ? null : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl border-2 border-edge bg-surface-2 transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
                >
                  {category.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={categoryImage(category.imageUrl, category.imagePath, 600)}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute left-2.5 top-2.5 rounded-md border-2 border-ink bg-acid px-1.5 py-0.5 font-display text-xs font-bold text-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="relative m-2 rounded-lg border-2 border-ink bg-paper p-2.5 text-ink sm:m-3 sm:p-3">
                    <p className="flex items-center justify-between gap-2 font-display text-base font-bold leading-tight sm:text-xl">
                      {category.name}
                      <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                        →
                      </span>
                    </p>
                    {category.subtitle && <p className="mt-0.5 line-clamp-1 text-xs opacity-70">{category.subtitle}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      <Marquee items={settings.tickerItems} tone="accent" />

      {/* ================= NEW DROPS ================= */}
      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeader eyebrow="Just landed" title="New" highlight="drops" action={{ label: "View all", href: "/shop" }} />
          <ProductGrid
            products={drops}
            loading={productsLoading}
            categoryNames={categoryNames}
            empty={{ title: "Drop loading…", description: "New pieces land soon. Follow us on Instagram so you don't miss it." }}
          />
        </Container>
      </section>

      {/* ================= EDITORIAL ================= */}
      {editorial && (
        <section className="pb-14 sm:pb-20">
          <Container>
            <Link
              href={`/category/${editorial.slug}`}
              className="group relative grid overflow-hidden rounded-2xl border-2 border-edge md:grid-cols-2"
            >
              <div className="relative aspect-[4/3] md:aspect-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={categoryImage(editorial.imageUrl, editorial.imagePath, 1200)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center gap-5 bg-acid p-8 text-ink sm:p-12">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] opacity-70">Featured collection</p>
                <p className="font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl">{editorial.name}</p>
                {editorial.subtitle && <p className="max-w-sm text-base opacity-80">{editorial.subtitle}</p>}
                <span className="inline-flex w-fit items-center gap-2 rounded-lg border-2 border-ink bg-ink px-5 py-3 text-sm font-extrabold uppercase text-acid transition-transform group-hover:translate-x-1">
                  Explore {editorial.name} →
                </span>
              </div>
            </Link>
          </Container>
        </section>
      )}

      {/* ================= INSTAGRAM CTA ================= */}
      <section>
        <Container>
          <div className="flex flex-col items-center gap-5 rounded-2xl border-2 border-edge bg-surface px-6 py-12 text-center shadow-brutal-lg sm:py-16">
            <FaInstagram className="text-4xl" />
            <SectionHeader align="center" title="Join the" highlight="club" description={`Drops, restocks and fit checks — first on ${instagramHandle}.`} />
            <a href={instagramHref} target="_blank" rel="noopener noreferrer" className="btn-brutal btn-primary -mt-4">
              Follow {instagramHandle}
            </a>
          </div>
        </Container>
      </section>
    </StoreShell>
  );
}
