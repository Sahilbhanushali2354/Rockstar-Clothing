"use client";

import { Paper, Typography } from "@mui/material";

import WhatsAppButton from "./WhatsAppButton";
import type { WhatsAppOrderItem } from "@/app/lib/whatsapp";

interface StickyWhatsAppBarProps {
  items: WhatsAppOrderItem[];
  source: string;
  contentIds?: string[];
  /** Short line shown left of the button, e.g. "Size M · ₹999". */
  summary?: string;
  label?: string;
  disabled?: boolean;
}

/*
 * Mobile/tablet-only bottom action bar. Pair it with a spacer
 * (`<Box className="sticky-cta-spacer" />`) at the end of the page so
 * content isn't hidden under it — no layout shift since the bar is
 * fixed and its height is constant.
 */
export default function StickyWhatsAppBar({
  items,
  source,
  contentIds,
  summary,
  label,
  disabled,
}: StickyWhatsAppBarProps) {
  return (
    <Paper
      square
      elevation={0}
      sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed",
        insetInline: 0,
        bottom: 0,
        zIndex: 1200,
        alignItems: "center",
        gap: 1.5,
        px: 2,
        pt: 1.5,
        pb: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        bgcolor: "var(--dc-surface)",
        borderTop: "2px solid var(--dc-edge)",
        "& .MuiButton-root": {
          borderColor: "var(--dc-ink)",
          boxShadow: "4px 4px 0 var(--dc-ink)",
        },
      }}
    >
      {summary && (
        <Typography
          variant="body2"
          noWrap
          sx={{ minWidth: 0, flex: 1, fontWeight: 800 }}
        >
          {summary}
        </Typography>
      )}
      <WhatsAppButton
        items={items}
        source={source}
        contentIds={contentIds}
        label={label}
        disabled={disabled}
        className={summary ? "shrink-0" : "w-full"}
      />
    </Paper>
  );
}
