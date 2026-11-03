"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

import { trackPixel } from "@/app/lib/metaPixel";
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  getOrderTotal,
  type WhatsAppOrderItem,
} from "@/app/lib/whatsapp";

interface WhatsAppButtonProps {
  items: WhatsAppOrderItem[];
  label?: string;
  /** Where the click came from — sent to the pixel for ad reporting. */
  source: string;
  contentIds?: string[];
  className?: string;
  disabled?: boolean;
}

/*
 * Primary CTA: hands the order to WhatsApp and fires Meta Pixel
 * Lead + Contact. Uses a real <a> (not window.open) so Instagram's
 * in-app browser hands off to the WhatsApp app reliably, and opens a
 * new tab so the pixel request isn't killed by navigation.
 */
export default function WhatsAppButton({
  items,
  label = "Buy via WhatsApp",
  source,
  contentIds,
  className = "",
  disabled = false,
}: WhatsAppButtonProps) {
  const isDisabled = disabled || items.length === 0;

  // Read the URL after mount so server and client markup match.
  const [pageUrl, setPageUrl] = useState<string>();
  useEffect(() => setPageUrl(window.location.href), []);

  const href = isDisabled
    ? undefined
    : buildWhatsAppUrl(buildOrderMessage(items, pageUrl));

  const handleClick = () => {
    if (isDisabled) return;

    const params = {
      content_name: items.map((item) => item.name).join(", "),
      content_ids: contentIds,
      content_type: "product",
      value: getOrderTotal(items),
      currency: "INR",
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      source,
    };

    trackPixel("Lead", params);
    trackPixel("Contact", params);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-disabled={isDisabled}
      className={`btn-brutal btn-whatsapp ${
        isDisabled ? "pointer-events-none opacity-50" : ""
      } ${className}`}
    >
      <FaWhatsapp aria-hidden className="text-xl" />
      <span>{label}</span>
    </a>
  );
}
