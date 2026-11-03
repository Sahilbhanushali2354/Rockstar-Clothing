"use client";

import Link from "next/link";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";

import StoreShell from "../components/store/StoreShell";
import SectionHeader from "../components/store/SectionHeader";
import { inr } from "../components/store/Price";
import WhatsAppButton from "../components/WhatsAppButton";
import StickyWhatsAppBar from "../components/StickyWhatsAppBar";
import { decreaseQuantity, increaseQuantity, removeFromCart } from "../lib/features/cart/cartSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

export default function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const contentIds = items.map((item) => String(item.id));

  return (
    <StoreShell stickyCta={items.length > 0} className="py-10 sm:py-14">
      <SectionHeader
        as="h1"
        eyebrow={count > 0 ? `${count} ${count === 1 ? "item" : "items"}` : "Cart"}
        title="Your"
        highlight="bag"
      />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-line px-6 py-20 text-center">
          <p className="font-display text-4xl font-bold">
            It&apos;s <span className="dc-highlight">empty.</span>
          </p>
          <p className="max-w-sm text-muted">Your next fit is one tap away.</p>
          <Link href="/shop" className="btn-brutal btn-primary">
            Shop the drop →
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* Items */}
          <ul className="space-y-3">
            {items.map((item) => {
              const key = { id: item.id, size: item.size, color: item.color };

              return (
                <li
                  key={`${item.id}-${item.size ?? ""}-${item.color ?? ""}`}
                  className="flex gap-3 rounded-xl border-2 border-edge bg-surface p-3 sm:gap-5 sm:p-4"
                >
                  <Link
                    href={`/product/${encodeURIComponent(String(item.id))}`}
                    className="aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg border-2 border-edge bg-surface-2 sm:w-28"
                  >
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${encodeURIComponent(String(item.id))}`}
                        className="line-clamp-2 font-bold leading-snug hover:underline sm:text-lg"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => dispatch(removeFromCart(key))}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
                        aria-label={`Remove ${item.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {item.size && <span className="dc-badge">Size {item.size}</span>}
                      {item.color && <span className="dc-badge">{item.color}</span>}
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                      <div className="flex items-center rounded-lg border-2 border-edge">
                        <button
                          type="button"
                          onClick={() => dispatch(decreaseQuantity(key))}
                          className="flex h-9 w-9 items-center justify-center"
                          aria-label={item.quantity === 1 ? `Remove ${item.name}` : "Decrease quantity"}
                        >
                          <FiMinus />
                        </button>
                        <span className="w-7 text-center font-display font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => dispatch(increaseQuantity(key))}
                          className="flex h-9 w-9 items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <FiPlus />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold">{inr(item.price * item.quantity)}</p>
                        {item.quantity > 1 && <p className="text-xs text-muted">{inr(item.price)} each</p>}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Summary */}
          <aside className="rounded-2xl border-2 border-edge bg-surface p-5 shadow-brutal-lg sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-2xl font-bold">Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal ({count})</dt>
                <dd className="font-bold">{inr(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-bold">Confirmed on WhatsApp</dd>
              </div>
            </dl>
            <div className="my-5 border-t-2 border-dashed border-line" />
            <div className="flex items-baseline justify-between">
              <span className="font-extrabold uppercase tracking-wide">Total</span>
              <span className="font-display text-3xl font-bold">{inr(total)}</span>
            </div>

            <WhatsAppButton
              items={items}
              source="cart_summary"
              contentIds={contentIds}
              label="Order via WhatsApp"
              className="mt-6 w-full"
            />

            <ol className="mt-6 space-y-2 text-sm">
              {["Tap the button — your order is pre-typed", "We confirm size & stock on chat", "Pay via UPI, we ship"].map(
                (step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-acid text-xs font-black text-ink">
                      {index + 1}
                    </span>
                    <span className="text-muted">{step}</span>
                  </li>
                ),
              )}
            </ol>
          </aside>
        </div>
      )}

      {items.length > 0 && (
        <StickyWhatsAppBar
          items={items}
          source="cart_sticky_bar"
          contentIds={contentIds}
          summary={`${count} ${count === 1 ? "item" : "items"} · ${inr(total)}`}
          label="Order now"
        />
      )}
    </StoreShell>
  );
}
