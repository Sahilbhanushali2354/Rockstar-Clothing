/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Phase 1: orders go through WhatsApp from the cart. Remove when the
      // Phase 2 checkout (app/_phase2/CheckoutForm.tsx) goes live.
      { source: "/checkout", destination: "/cart", permanent: false },

      // Old admin URLs → current ones.
      { source: "/admin/category", destination: "/admin/categories", permanent: true },
      { source: "/admin/category/:slug", destination: "/admin/products?category=:slug", permanent: true },
      {
        source: "/admin/addproduct",
        has: [{ type: "query", key: "id", value: "(?<id>.+)" }],
        destination: "/admin/products/:id",
        permanent: true,
      },
      { source: "/admin/addproduct", destination: "/admin/products/new", permanent: true },
    ];
  },
};

export default nextConfig;
