import type { Metadata } from "next";

import Catalog from "../components/store/Catalog";
import {
  getActiveProductsServer,
  getCategoriesServer,
} from "../lib/catalog.server";
import { REVALIDATE_SECONDS } from "../lib/firestoreRest";
import { SITE_URL } from "../lib/site";

export const revalidate = REVALIDATE_SECONDS;

export const metadata: Metadata = {
  title: "Shop all",
  description:
    "Every DOPAMINE CLUB drop — streetwear, co-ord sets & graphic tees. Limited stock. Order on WhatsApp.",
  alternates: { canonical: `${SITE_URL}/shop` },
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getActiveProductsServer(),
    getCategoriesServer(),
  ]);

  return (
    <Catalog initialProducts={products} initialCategories={categories ?? []} />
  );
}
