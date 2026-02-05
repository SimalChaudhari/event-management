import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Checkout } from '../checkout/checkout.entity';
import { CheckoutCartItem } from '../checkout/checkout-cart-item.entity';
import { Order } from '../order/order.entity';

/**
 * Utility functions for checkout operations
 */
export class CheckoutUtils {
  /**
   * Get checkout data by order ID
   * Finds the checkout that matches the order's user and events
   */
  static async getCheckoutByOrderId(
    orderId: string,
    orderRepository: Repository<Order>,
    checkoutRepository: Repository<Checkout>,
    checkoutCartItemRepository: Repository<CheckoutCartItem>
  ): Promise<any> {
    // Get order with orderItems
    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'orderItems', 'orderItems.event'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Get event IDs from order items
    const eventIds = order.orderItems?.map(item => item.event?.id).filter(Boolean) || [];

    if (eventIds.length === 0) {
      throw new NotFoundException('No events found in order');
    }

    // Find completed checkout for this user with matching events
    // We'll look for checkouts that:
    // 1. Belong to the same user
    // 2. Are completed
    // 3. Have cart items matching the order's events
    // 4. Were created around the same time as the order (within 1 hour)
    if (!order.createdAt) {
      throw new NotFoundException('Order creation date not found');
    }
    const orderCreatedAt = new Date(order.createdAt);
    const oneHourBefore = new Date(orderCreatedAt.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(orderCreatedAt.getTime() + 60 * 60 * 1000);

    const checkouts = await checkoutRepository.find({
      where: {
        user: { id: order.user.id },
        isCompleted: true,
      },
      relations: ['user', 'checkoutCartItems'],
    });

    // Filter checkouts created within 1 hour of order creation
    const relevantCheckouts = checkouts.filter(checkout => {
      if (!checkout.createdAt) return false;
      const checkoutDate = new Date(checkout.createdAt);
      return checkoutDate >= oneHourBefore && checkoutDate <= oneHourAfter;
    });

    // Filter checkouts that match the order's events
    for (const checkout of relevantCheckouts) {
      // Get checkout cart items
      let checkoutCartItems = checkout.checkoutCartItems || [];
      if (checkoutCartItems.length === 0) {
        checkoutCartItems = await checkoutCartItemRepository.find({
          where: { checkoutId: checkout.checkoutId },
        });
      }

      const checkoutEventIds = checkoutCartItems.map(item => item.eventId).sort();
      const orderEventIds = [...eventIds].sort();

      // Check if checkout has the same events as order
      if (
        checkoutEventIds.length === orderEventIds.length &&
        checkoutEventIds.every((id, index) => id === orderEventIds[index]) &&
        checkout.createdAt &&
        new Date(checkout.createdAt) <= oneHourAfter
      ) {
        // Found matching checkout
        return {
          id: checkout.id,
          checkoutId: checkout.checkoutId,
          status: checkout.status,
          totalAmount: checkout.totalAmount,
          discount: checkout.discount,
          couponCode: checkout.couponCode,
          promoCode: checkout.promoCode,
          paymentGateway: checkout.paymentGateway,
          paymentMethod: checkout.paymentMethod,
          transactionId: checkout.transactionId,
          // paymentUrl omitted – sensitive; not stored and not returned
          paymentNotes: checkout.paymentNotes,
          isCompleted: checkout.isCompleted,
          createdAt: checkout.createdAt,
          completedAt: checkout.completedAt,
          updatedAt: checkout.updatedAt,
          cartItems: checkoutCartItems.map(item => ({
            cartId: item.cartId,
            eventId: item.eventId,
          })),
        };
      }
    }

    throw new NotFoundException('Checkout not found for this order');
  }
}

