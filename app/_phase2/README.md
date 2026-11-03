# Phase 2 (not routed)

Folders starting with `_` are private in the Next.js App Router — nothing
here is reachable as a page.

- `CheckoutForm.tsx` — the original order/checkout form. Kept for Phase 2
  (payment gateway: Razorpay / PhonePe). Until then `/checkout` redirects
  to `/cart` (see `next.config.mjs`) and orders happen on WhatsApp.
