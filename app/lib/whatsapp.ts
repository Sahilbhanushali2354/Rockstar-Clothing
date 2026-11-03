/*
 * WhatsApp order hand-off (Phase 1 checkout).
 *
 * Builds a prefilled wa.me link so the customer lands in WhatsApp with
 * their order already typed out. Phase 2 swaps this for a payment
 * gateway — keep callers going through these helpers.
 */

export interface WhatsAppOrderItem {
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""
).replace(/\D/g, "");

const formatINR = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function getOrderTotal(items: WhatsAppOrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function buildOrderMessage(
  items: WhatsAppOrderItem[],
  pageUrl?: string,
) {
  const lines = items.map((item, index) => {
    const details = [
      item.size && `Size: ${item.size}`,
      item.color && `Color: ${item.color}`,
      `Qty: ${item.quantity}`,
    ]
      .filter(Boolean)
      .join(" | ");

    return `${index + 1}. ${item.name}\n   ${details}\n   ${formatINR(
      item.price * item.quantity,
    )}`;
  });

  return [
    "Hey DOPAMINE CLUB! 👋 I want to order:",
    "",
    ...lines,
    "",
    `Total: ${formatINR(getOrderTotal(items))}`,
    pageUrl ? `\nLink: ${pageUrl}` : "",
    "",
    "Please confirm availability & payment details.",
  ]
    .join("\n")
    .trim();
}

export function buildWhatsAppUrl(message: string) {
  const base = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}`
    : "https://wa.me/";

  return `${base}?text=${encodeURIComponent(message)}`;
}
