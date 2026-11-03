"use client";

import Link from "next/link";
import { FiX } from "react-icons/fi";

import StoreShell from "../components/store/StoreShell";
import SectionHeader from "../components/store/SectionHeader";
import { inr } from "../components/store/Price";
import { removeFromWishlist } from "../lib/features/wishlist/wishlistSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.wishlist.items);

  return (
    <StoreShell className="py-10 sm:py-14">
      <SectionHeader
        as="h1"
        eyebrow={items.length ? `${items.length} saved` : "Wishlist"}
        title="Saved"
        highlight="fits"
      />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-line px-6 py-20 text-center">
          <p className="font-display text-4xl font-bold">
            Nothing <span className="dc-highlight">saved.</span>
          </p>
          <p className="max-w-sm text-muted">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="btn-brutal btn-primary">
            Browse the drop →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {items.map((item) => {
            const href = `/product/${encodeURIComponent(String(item.id))}`;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-xl border-2 border-edge bg-surface transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
              >
                <Link href={href} className="aspect-[3/4] overflow-hidden rounded-t-[10px] border-b-2 border-edge bg-surface-2">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => dispatch(removeFromWishlist(item.id))}
                  aria-label={`Remove ${item.name} from wishlist`}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-paper text-ink hover:bg-acid"
                >
                  <FiX />
                </button>
                <Link href={href} className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3.5">
                  <span className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">{item.name}</span>
                  <span className="mt-auto font-display font-bold">{inr(item.price)}</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </StoreShell>
  );
}
