import Link from "next/link";

import StoreShell from "./components/store/StoreShell";

export default function NotFound() {
  return (
    <StoreShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
        <p className="font-display text-8xl font-bold leading-none tracking-tight sm:text-9xl">
          4<span className="dc-highlight mx-1 -rotate-3">0</span>4
        </p>
        <p className="font-display text-3xl font-bold">This fit sold out — or never existed.</p>
        <p className="max-w-sm text-muted">The page you&apos;re looking for isn&apos;t here. The drop is, though.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-brutal btn-primary">
            Shop the drop →
          </Link>
          <Link href="/" className="btn-brutal btn-ink">
            Home
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
