import { Box, Chip, Stack, Typography } from "@mui/material";

const inr = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const PRICE_SIZE = {
  sm: { xs: 14, sm: 16 },
  md: { xs: 18 },
  lg: { xs: 30, sm: 36 },
} as const;

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

  return (
    <Stack
      direction="row"
      className={className}
      sx={{ flexWrap: "wrap", alignItems: "center", columnGap: 1, rowGap: 0.5 }}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: "var(--font-display), var(--font-body), sans-serif",
          fontWeight: 700,
          fontSize: PRICE_SIZE[size],
          lineHeight: 1.4,
        }}
      >
        {inr(price)}
      </Typography>
      {discount > 0 && (
        <>
          <Box
            component="s"
            sx={{ fontSize: { xs: 12, sm: 14 }, color: "text.secondary" }}
          >
            {inr(compareAtPrice!)}
          </Box>
          <Chip
            label={`−${discount}%`}
            size="small"
            color="primary"
            sx={{ height: 20, border: "1.5px solid var(--dc-ink)" }}
          />
        </>
      )}
    </Stack>
  );
}

export { inr };
