import type { Metadata } from "next";

import Catalog from "../../components/store/Catalog";
import { getActiveProductsServer, getCategoriesServer } from "../../lib/catalog.server";
import { REVALIDATE_SECONDS } from "../../lib/firestoreRest";
import { imageUrl } from "../../lib/imageUrl";
import { slugToLabel, toSlug } from "../../lib/productModel";
import { SITE_URL } from "../../lib/site";

export const revalidate = REVALIDATE_SECONDS;

type Props = { params: { category: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = toSlug(decodeURIComponent(params.category));
  const category = (await getCategoriesServer())?.find((item) => item.slug === slug);
  const name = category?.name ?? slugToLabel(slug);
  const description =
    category?.subtitle || `Shop ${name} at DOPAMINE CLUB. Limited stock — order on WhatsApp, pay via UPI.`;
  const image = category?.imageUrl
    ? imageUrl({ url: category.imageUrl, publicId: category.imagePath }, 1200, "1:1")
    : undefined;
  const url = `${SITE_URL}/category/${slug}`;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: { url, title: `${name} · DOPAMINE CLUB`, description, images: image ? [image] : undefined },
  };
}

export default async function CategoryPage({ params }: Props) {
  const slug = toSlug(decodeURIComponent(params.category));
  const [products, categories] = await Promise.all([getActiveProductsServer(slug), getCategoriesServer()]);

  return <Catalog categorySlug={slug} initialProducts={products} initialCategories={categories ?? []} />;
}
