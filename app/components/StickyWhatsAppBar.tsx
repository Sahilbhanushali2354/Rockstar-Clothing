"use client";

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
 * (`<div className="sticky-cta-spacer" />`) at the end of the page so
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
    <div className="sticky-cta md:hidden">
      {summary && (
        <span className="min-w-0 flex-1 truncate text-sm font-extrabold">
          {summary}
        </span>
      )}
      <WhatsAppButton
        items={items}
        source={source}
        contentIds={contentIds}
        label={label}
        disabled={disabled}
        className={summary ? "shrink-0" : "w-full"}
      />
    </div>
  );
}
