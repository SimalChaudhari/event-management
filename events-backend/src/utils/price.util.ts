/**
 * Coerce price and earlyBirdPrice to number for API responses.
 * TypeORM decimal columns and JSON body can return string.
 * Set EVENT_PRICE_IN_CENTS=true if price is stored in cents (e.g. 12000 → 120.00).
 */
export function toDisplayPrice(price: unknown): number {
  const n = Number(price ?? 0);
  if (process.env.EVENT_PRICE_IN_CENTS === 'true') {
    return Math.round((n / 100) * 100) / 100;
  }
  return n;
}

/** Ensure event-like object has numeric price and earlyBirdPrice (for responses). */
export function coerceEventPrices<T extends { price?: unknown; earlyBirdPrice?: unknown }>(obj: T): T {
  if (!obj) return obj;
  return {
    ...obj,
    ...(obj.price !== undefined && { price: toDisplayPrice(obj.price) }),
    ...(obj.earlyBirdPrice !== undefined && { earlyBirdPrice: toDisplayPrice(obj.earlyBirdPrice) }),
  };
}
