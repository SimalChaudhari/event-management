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
 * Compute GST breakdown when price is base (GST exclusive).
 * Base = price, GST = price × gstRate/100, total = base + GST
 */
export function getGstBreakdownFromBase(
  basePrice: number,
  gstRate: number = GST_RATE,
): GstBreakdown {
  const base = Number(basePrice) || 0;
  const rate = Number(gstRate) || GST_RATE;
  const gstAmount = Math.round(base * (rate / 100) * 100) / 100;
  const total = Math.round((base + gstAmount) * 100) / 100;
  return { baseAmount: base, gstAmount, total };
}

/**
 * Build full GST breakdown from cart items, total, discount and optional coupon.
 * Items can have gstRate (from event) - price is base (ex-GST). Uses getGstBreakdownFromBase.
 * description = eventName + " - Month YYYY" when startDate present (dynamic for Price Breakdown UI).
 */
export function buildGstBreakdown(
  cartItems: Array<{
    cartId: string;
    eventId: string;
    eventName?: string;
    price: number;
    startDate?: Date | string | null;
    gstRate?: number;
  }>,
  totalAmount: number,
  discount: number,
  couponApplied: any = null,
): GstBreakdownResult {
  const totalAmt = Number(totalAmount) || 0;
  const disc = Number(discount) || 0;
  const finalAmount = Math.max(0, totalAmt - disc);

  const items: GstBreakdownItem[] = cartItems.map((item) => {
    const basePrice = Number(item.price) || 0;
    const gstRate = Number(item.gstRate) || GST_RATE;
    const b = getGstBreakdownFromBase(basePrice, gstRate);
    const name = item.eventName ?? '';
    const description = item.startDate
      ? `${name} - ${formatMonthYear(item.startDate)}`
      : name;
    return {
      cartId: item.cartId,
      eventId: item.eventId,
      eventName: name,
      description,
      price: b.total,
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

  const avgRate =
    items.length > 0
      ? items.reduce((sum, i) => {
          const item = cartItems.find((c) => c.cartId === i.cartId);
          return sum + (Number(item?.gstRate) || GST_RATE);
        }, 0) / items.length
      : GST_RATE;
  const fb = disc > 0 ? getGstBreakdown(finalAmount) : null;
  const finalSummary: GstBreakdownSummary | null = fb
    ? { totalBaseAmount: fb.baseAmount, totalGst: fb.gstAmount, total: fb.total }
    : null;

  return {
    gstRate: items.length > 0 ? avgRate : GST_RATE,
    items,
    summary: { totalBaseAmount: totalBase, totalGst, total: totalAmt },
    finalAmount,
    finalSummary,
    couponApplied,
  };
}
