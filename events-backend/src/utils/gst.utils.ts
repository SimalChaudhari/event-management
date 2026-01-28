/** GST rate 18% - used for inclusive breakdown */
export const GST_RATE = 18;

export interface GstBreakdown {
  baseAmount: number;
  gstAmount: number;
  total: number;
}

export interface GstBreakdownItem {
  cartId: string;
  eventId: string;
  eventName: string;
  /** Dynamic description for UI: "Event Name - Month YYYY" when startDate present */
  description: string;
  /** GST-inclusive price (same as baseAmount + gstAmount); no separate total to avoid redundancy */
  price: number;
  baseAmount: number;
  gstAmount: number;
}

function formatMonthYear(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export interface GstBreakdownSummary {
  totalBaseAmount: number;
  totalGst: number;
  total: number;
}

export interface GstBreakdownResult {
  gstRate: number;
  items: GstBreakdownItem[];
  summary: GstBreakdownSummary;
  finalAmount: number;
  finalSummary: GstBreakdownSummary | null;
  couponApplied: any;
}

/**
 * Compute GST breakdown when price is GST inclusive.
 * Base = price × 100/118, GST = price - base
 */
export function getGstBreakdown(gstInclusivePrice: number): GstBreakdown {
  const total = Number(gstInclusivePrice) || 0;
  const baseAmount = Math.round((total * 100) / (100 + GST_RATE) * 100) / 100;
  const gstAmount = Math.round((total - baseAmount) * 100) / 100;
  return { baseAmount, gstAmount, total };
}

/**
 * Build full GST breakdown from cart items, total, discount and optional coupon.
 * Uses GST_RATE and getGstBreakdown for per-item and final summary.
 * description = eventName + " - Month YYYY" when startDate present (dynamic for Price Breakdown UI).
 */
export function buildGstBreakdown(
  cartItems: Array<{
    cartId: string;
    eventId: string;
    eventName?: string;
    price: number;
    startDate?: Date | string | null;
  }>,
  totalAmount: number,
  discount: number,
  couponApplied: any = null,
): GstBreakdownResult {
  const totalAmt = Number(totalAmount) || 0;
  const disc = Number(discount) || 0;
  const finalAmount = Math.max(0, totalAmt - disc);

  const items: GstBreakdownItem[] = cartItems.map((item) => {
    const price = Number(item.price) || 0;
    const b = getGstBreakdown(price);
    const name = item.eventName ?? '';
    const description = item.startDate
      ? `${name} - ${formatMonthYear(item.startDate)}`
      : name;
    return {
      cartId: item.cartId,
      eventId: item.eventId,
      eventName: name,
      description,
      price,
      baseAmount: b.baseAmount,
      gstAmount: b.gstAmount,
    };
  });

  let totalBase = 0;
  let totalGst = 0;
  items.forEach((i) => {
    totalBase += i.baseAmount;
    totalGst += i.gstAmount;
  });
  totalBase = Math.round(totalBase * 100) / 100;
  totalGst = Math.round(totalGst * 100) / 100;

  const fb = disc > 0 ? getGstBreakdown(finalAmount) : null;
  const finalSummary: GstBreakdownSummary | null = fb
    ? { totalBaseAmount: fb.baseAmount, totalGst: fb.gstAmount, total: fb.total }
    : null;

  return {
    gstRate: GST_RATE,
    items,
    summary: { totalBaseAmount: totalBase, totalGst, total: totalAmt },
    finalAmount,
    finalSummary,
    couponApplied,
  };
}
