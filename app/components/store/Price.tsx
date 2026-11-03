const inr = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/* Price with optional crossed-out compare-at price and % off badge. */
export default function Price({
  price,
  compareAtPrice,
  size = "md",
  className = "",
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const discount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  const priceSize = { sm: "text-sm sm:text-base", md: "text-lg", lg: "text-3xl sm:text-4xl" }[size];

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <span className={`font-display font-bold ${priceSize}`}>{inr(price)}</span>
      {discount > 0 && (
        <>
          <s className="text-xs text-muted sm:text-sm">{inr(compareAtPrice!)}</s>
          <span className="dc-badge dc-badge-live">−{discount}%</span>
        </>
      )}
    </div>
  );
}

export { inr };
