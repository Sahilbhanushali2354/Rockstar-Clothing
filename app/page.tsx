import HomeView from "./HomeView";
import {
  getActiveProductsServer,
  getCategoriesServer,
  getSettingsServer,
} from "./lib/catalog.server";
import { REVALIDATE_SECONDS } from "./lib/firestoreRest";
import { instagramUrl } from "./lib/storeSettings";
import { SITE_URL } from "./lib/site";

export const revalidate = REVALIDATE_SECONDS;

export default async function HomePage() {
  const [products, categories, settings] = await Promise.all([
    getActiveProductsServer(),
    getCategoriesServer(),
    getSettingsServer(),
  ]);

  // Lets Google show the DC logo + Instagram for brand searches.
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DOPAMINE CLUB",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/dc-monogram-512.png`,
    sameAs: [instagramUrl(settings.instagramHandle), settings.facebookUrl],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organization).replace(/</g, "\\u003c"),
        }}
      />
      <HomeView
        initialProducts={products}
        initialCategories={categories ?? []}
        initialSettings={settings}
      />
    </>
  );
}
