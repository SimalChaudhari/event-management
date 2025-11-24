import { Checkout } from '../checkout/checkout.entity';

/**
 * Utility function to format checkout response data
 * Used by both getCompletedCheckouts and getCompletedCheckoutById methods
 */
export class CheckoutResponseUtils {
  /**
   * Format a single checkout item for API response
   */
  static formatCheckoutResponse(
    checkout: Checkout,
    recentPaymentMethod: any = null,
    includeDetails: boolean = false
  ): any {
    const baseResponse = {
      // Basic checkout information
      checkoutId: checkout.checkoutId,
      status: checkout.status,
      totalAmount: Number(checkout.totalAmount),
      discount: Number(checkout.discount || 0),
      originalTotal: Number(checkout.totalAmount) + Number(checkout.discount || 0),
      cartItems: checkout.checkoutCartItems && checkout.checkoutCartItems.length > 0
        ? checkout.checkoutCartItems.map(item => ({ cartId: item.cartId, eventId: item.eventId }))
        : [],
      itemCount: checkout.checkoutCartItems ? checkout.checkoutCartItems.length : 0,
      user: {
        id: checkout.user.id,
        firstName: checkout.user.firstName,
        lastName: checkout.user.lastName,
        email: checkout.user.email
      },
      createdAt: checkout.createdAt,
      completedAt: checkout.completedAt,
      
      // Payment information
      payment: {
        method: checkout.paymentMethod,
        gateway: checkout.paymentGateway,
        transactionId: checkout.transactionId,
        notes: checkout.paymentNotes,
        completedAt: checkout.completedAt
      },

      // Payment Method Details (with new format)
      paymentMethod: recentPaymentMethod ? {
        id: recentPaymentMethod.id,
        brand: recentPaymentMethod.brand,
        cardBrandName: recentPaymentMethod.brand ? 
          recentPaymentMethod.brand.charAt(0).toUpperCase() + recentPaymentMethod.brand.slice(1) : null,
        displayName: recentPaymentMethod.displayName,
        maskedCardNumber: recentPaymentMethod.maskedCardNumber,
        cardIcon: recentPaymentMethod.cardIcon,
        funding: recentPaymentMethod.funding,
        expiryDisplay: recentPaymentMethod.expiryDisplay,
        isDefault: recentPaymentMethod.isDefault,
        isExpired: recentPaymentMethod.isExpired,
        isSelected: true
      } : null,

      // Coupon information (if applied)
      coupon: checkout.couponCode ? {
        code: checkout.couponCode,
        applied: true
      } : null,

      // Price breakdown
      priceBreakdown: {
        subtotal: Number(checkout.totalAmount) + Number(checkout.discount || 0),
        discount: Number(checkout.discount || 0),
        total: Number(checkout.totalAmount),
        currency: 'USD',
        gstInclusive: true
      },

      // Summary
      summary: {
        isCompleted: checkout.isCompleted,
        paymentCompleted: true,
        discountApplied: Number(checkout.discount || 0) > 0,
        totalItems: checkout.checkoutCartItems ? checkout.checkoutCartItems.length : 0
      }
    };

    // Add additional details for single checkout view
    if (includeDetails) {
      return {
        ...baseResponse,
      };
    }

    return baseResponse;
  }

  /**
   * Format multiple checkout items for API response
   */
  static formatMultipleCheckoutsResponse(
    checkouts: Checkout[],
    paymentMethods: any[] = []
  ): any[] {
    return checkouts.map(checkout => {
      // Find the most recent payment method for this user
      const recentPaymentMethod = paymentMethods.length > 0 ? paymentMethods[0] : null;
      
      return this.formatCheckoutResponse(checkout, recentPaymentMethod, false);
    });
  }
}
