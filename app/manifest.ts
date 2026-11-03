import type { MetadataRoute } from "next";

import { brand } from "./theme/tokens";

// "Add to Home Screen" on Android/Chrome uses these icons + colours.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DOPAMINE CLUB",
    short_name: "DOPAMINE",
    description: "Trending streetwear, co-ord sets & graphic tees. Order on WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: brand.ink,
    theme_color: brand.ink,
    icons: [
      { src: "/brand/dc-monogram-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/dc-monogram-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/dc-monogram-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
