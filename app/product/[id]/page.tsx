import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductView from "./ProductView";
import {
  getActiveProductsServer,
  getProductServer,
} from "@/app/lib/catalog.server";
import { REVALIDATE_SECONDS } from "@/app/lib/firestoreRest";
import { imageUrl } from "@/app/lib/imageUrl";
import { isSoldOut } from "@/app/lib/productModel";
import { SITE_URL } from "@/app/lib/site";

// Cached per product, refreshed every 60s or instantly via /api/revalidate.
export const revalidate = REVALIDATE_SECONDS;

type Props = { params: { id: string } };

const describe = (text: string, fallback: string) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean
    ? clean.length > 155
      ? `${clean.slice(0, 152)}…`
      : clean
    : fallback;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = decodeURIComponent(params.id);
  const product = await getProductServer(id);
  if (!product) return { title: "Product not found" };

  const price = `₹${product.price.toLocaleString("en-IN")}`;
  const description = describe(
    product.description,
    `${product.title} — ${price}. Order on WhatsApp, pay via UPI.`,
  );
  // Square, uncropped image works best for WhatsApp / Instagram link previews.
  const image = product.images[0]
    ? imageUrl(product.images[0], 1200, "1:1")
    : undefined;
  const url = `${SITE_URL}/product/${encodeURIComponent(product.id)}`;

  return {
    title: `${product.title} · ${price}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${product.title} · ${price}`,
      description,
      images: image
        ? [{ url: image, width: 1200, height: 1200, alt: product.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} · ${price}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const id = decodeURIComponent(params.id);
  const product = await getProductServer(id);

  // null = doesn't exist / hidden → real 404. undefined = Firestore hiccup → client retries.
  if (product === null) notFound();

  const related = product
    ? ((await getActiveProductsServer(product.category)) ?? [])
        .filter((item) => item.id !== product.id)
        .slice(0, 4)
    : [];

  // Google product rich results (price, stock).
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description || undefined,
        image: product.images.map((image) => imageUrl(image, 1200)),
        sku: product.id,
        brand: { "@type": "Brand", name: "DOPAMINE CLUB" },
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/product/${encodeURIComponent(product.id)}`,
          priceCurrency: "INR",
          price: product.price,
          availability: isSoldOut(product)
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ProductView
        productId={id}
        initialProduct={product}
        initialRelated={related}
      />
    </>
  );
}
