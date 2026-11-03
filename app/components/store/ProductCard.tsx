import Link from "next/link";

import { hasLowStock, isSoldOut, type Product } from "@/app/lib/productModel";
import { imageUrl } from "@/app/lib/imageUrl";
import Price from "./Price";

/*
 * The one product card used everywhere (shop, category, home, related).
 * Links to the product page — clothing needs a size before it can be bought.
 */
export default function ProductCard({
  product,
  categoryName,
  priority = false,
}: {
  product: Product;
  categoryName?: string;
  /** eager-load the image (first row above the fold) */
  priority?: boolean;
}) {
  const href = `/product/${encodeURIComponent(product.id)}`;
  const soldOut = isSoldOut(product);
  const lowStock = !soldOut && hasLowStock(product);
  const cover = product.images[0];
  const hover = product.images[1];

  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col rounded-xl border-2 border-edge bg-surface transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal focus-visible:shadow-brutal"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-[10px] border-b-2 border-edge bg-surface-2">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(cover, 600, "3:4")}
            srcSet={`${imageUrl(cover, 400, "3:4")} 400w, ${imageUrl(cover, 600, "3:4")} 600w, ${imageUrl(cover, 900, "3:4")} 900w`}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            alt={product.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={`h-full w-full object-contain transition-[transform,opacity] duration-500 group-hover:scale-[1.04] ${
              soldOut ? "opacity-60 grayscale" : ""
            } ${hover ? "group-hover:opacity-0" : ""}`}
          />
        )}
        {hover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(hover, 600, "3:4")}
            alt=""
            loading="lazy"
            decoding="async"
            aria-hidden
            className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {soldOut ? (
            <span className="dc-badge dc-badge-ink">Sold out</span>
          ) : product.featured ? (
            <span className="dc-badge dc-badge-live">New drop</span>
          ) : null}
          {lowStock && <span className="dc-badge">Few left</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3.5">
        {categoryName && (
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted sm:text-[11px]">
            {categoryName}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">{product.title}</h3>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" className="mt-auto pt-1" />
      </div>
    </Link>
  );
}
