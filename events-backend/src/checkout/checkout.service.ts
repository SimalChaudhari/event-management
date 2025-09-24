import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { WooShPayService } from './wooshpay.service';
import { Checkout } from './checkout.entity';
import { validateCard, detectCardTypeRealtime } from '../utils/card-validation.utils';
import { ErrorHandlerUtil } from '../utils/error-handler.util';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';
import { Cart } from 'cart/cart.entity';
import { Order } from 'order/order.entity';
import { OrderItemEntity } from 'order/event.item.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { CouponService } from 'coupon/coupon.service';
import { PaymentMethodService } from './payment-method.service';
import {
  CreateCheckoutDto,
  CheckoutStatus,
  PaymentGateway,
  CartItemDto,
  InAppPaymentDto,
  InAppPaymentWithSavedMethodDto,
} from './checkout.dto';
import { OrderStatus, PaymentMethod } from 'order/order.dto';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Checkout)
    private checkoutRepository: Repository<Checkout>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItemEntity)
    private orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    private couponService: CouponService,
    private wooShPayService: WooShPayService,
    private paymentMethodService: PaymentMethodService,
  ) {}

  private async generateUniqueCheckoutId(): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      return `CHK-${currentYear}-${timestamp}-${randomSuffix}`;
    } catch (error) {
      throw new InternalServerErrorException('Error generating checkout ID');
    }
  }

  async createCheckout(userId: string, dto: CreateCheckoutDto): Promise<any> {
    // Validate user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Determine which cart items to process
    let cartItemsToProcess = dto.cartItems;

    // If useSelectedItemsOnly is true, use the provided cartItems (already filtered)
    if (dto.useSelectedItemsOnly) {
      if (!dto.cartItems || dto.cartItems.length === 0) {
        throw new BadRequestException('Please specify cart items to checkout or set useAllCartItems to true.');
      }
      // Use the provided cartItems directly (they are already the selected items)
      cartItemsToProcess = dto.cartItems;
    }

    // Validate cart items and calculate total
    let calculatedTotal = 0;
    const validatedCartItems: CartItemDto[] = [];

    for (const item of cartItemsToProcess) {
      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: item.eventId },
      });
      if (!event) {
        throw new NotFoundException(`Event with ID ${item.eventId} not found`);
      }

      // Verify item is in user's cart
      const cartItem = await this.cartRepository.findOne({
        where: { userId, eventId: item.eventId },
      });
      if (!cartItem) {
        throw new NotFoundException(
          `Event ${item.eventId} is not in your cart`,
        );
      }

      // Validate price
      if (Number(item.price) !== Number(event.price)) {
        throw new BadRequestException(`Price mismatch for event ${event.name}`);
      }

      calculatedTotal += Number(event.price);
      validatedCartItems.push({
        eventId: item.eventId,
        price: Number(event.price),
        eventName: event.name,
      });
    }

    // Handle coupon validation if provided
    let discount = dto.discount || 0;
    let couponData = null;

    // If we already have a discount from the cart service, use it
    if (dto.discount && dto.discount > 0) {
      console.log('🔍 Debug - Using pre-calculated discount:', dto.discount);
      discount = dto.discount;
    } else if (dto.couponCode) {
      try {
        const couponResult = await this.couponService.validateAndApplyCoupon(
          dto.couponCode,
          userId,
          calculatedTotal,
        );
        discount = couponResult.discount;
        couponData = couponResult.coupon;
      } catch (error: any) {
        ErrorHandlerUtil.handleError(error, 'Coupon validation failed', 400);
      }
    }

    const finalAmount = calculatedTotal - discount;

    console.log('🔍 Debug - Amount validation:', {
      calculatedTotal,
      discount,
      finalAmount,
      dtoTotalAmount: dto.totalAmount,
      difference: Math.abs(Number(dto.totalAmount) - finalAmount)
    });

    // Validate final amount with more tolerance for floating point precision
    if (Math.abs(Number(dto.totalAmount) - finalAmount) > 0.1) {
      throw new BadRequestException(
        `Amount mismatch. Expected: ${finalAmount}, Received: ${dto.totalAmount}`,
      );
    }

    // Check for existing pending checkout with same cart items
    console.log('🔍 About to check for existing checkout...');
    const existingCheckout = await this.findExistingPendingCheckout(userId, validatedCartItems, discount, dto.couponCode);
    if (existingCheckout) {
      console.log('🔄 Found existing pending checkout, returning existing one:', existingCheckout.checkoutId);
      return {
        id: existingCheckout.id,
        checkoutId: existingCheckout.checkoutId,
        status: existingCheckout.status,
        totalAmount: existingCheckout.totalAmount,
        discount: existingCheckout.discount,
        couponCode: existingCheckout.couponCode,
        promoCode: existingCheckout.promoCode,
        cartItems: existingCheckout.cartItems,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
        },
        createdAt: existingCheckout.createdAt,
        isExisting: true, // Flag to indicate this is an existing checkout
      };
    }

    console.log('🆕 No existing checkout found, creating new one...');
    // Create checkout session
    const checkoutId = await this.generateUniqueCheckoutId();
    const checkout = this.checkoutRepository.create({
      checkoutId,
      user,
      cartItems: validatedCartItems,
      totalAmount: finalAmount,
      discount,
      couponCode: dto.couponCode,
      promoCode: dto.promoCode,
      status: CheckoutStatus.Pending,
    });

    const savedCheckout = await this.checkoutRepository.save(checkout);

    // Get coupon details if coupon code exists
    let couponDetails = null;
    if (savedCheckout.couponCode) {
      try {
        const coupon = await this.couponService.getCouponByCode(savedCheckout.couponCode);
        couponDetails = {
          id: coupon.id,
          code: coupon.code,
          discountValue: coupon.discountValue,
          discountType: coupon.discountType,
          actualValue: coupon.actualValue,
          expiryDate: coupon.expiryDate
        };
      } catch (error: any) {
        console.log('⚠️ Could not fetch coupon details:', error.message);
      }
    }

    return {
      id: savedCheckout.id,
      checkoutId: savedCheckout.checkoutId,
      status: savedCheckout.status,
      totalAmount: savedCheckout.totalAmount,
      discount: savedCheckout.discount,
      couponCode: savedCheckout.couponCode,
      coupon: couponDetails, // Add coupon details with ID
      cartItems: validatedCartItems,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
      },
      createdAt: savedCheckout.createdAt,
    };
  }

  /**
   * Find existing pending checkout for the same user with same cart items
   * Ignores discount and coupon differences - uses same checkout for same cart items
   */
  private async findExistingPendingCheckout(
    userId: string, 
    cartItems: CartItemDto[], 
    discount: number, 
    couponCode?: string
  ): Promise<Checkout | null> {
    console.log('🔍 Searching for existing pending checkout:', {
      userId,
      cartItemsCount: cartItems.length,
      discount,
      couponCode
    });

    // Get all pending checkouts for this user
    const pendingCheckouts = await this.checkoutRepository.find({
      where: { 
        user: { id: userId },
        status: CheckoutStatus.Pending,
        isCompleted: false,
        isDeleted: false
      },
      order: { createdAt: 'DESC' }
    });

    console.log('🔍 Found pending checkouts:', pendingCheckouts.length);

    // Compare each pending checkout with current request
    for (const checkout of pendingCheckouts) {
      console.log('🔍 Comparing checkout:', {
        checkoutId: checkout.checkoutId,
        checkoutDiscount: checkout.discount,
        checkoutCouponCode: checkout.couponCode,
        checkoutCartItems: checkout.cartItems?.length
      });

      // Skip discount comparison - use same checkout regardless of discount changes
      console.log('🔍 Discount comparison (ignored):', {
        checkoutDiscount: checkout.discount,
        currentDiscount: discount,
        note: 'Discount comparison skipped - using same checkout for same cart items'
      });

      // Skip coupon comparison - use same checkout regardless of coupon changes
      console.log('🔍 Coupon comparison (ignored):', {
        checkoutCoupon: checkout.couponCode,
        currentCoupon: couponCode,
        note: 'Coupon comparison skipped - using same checkout for same cart items'
      });

      // Check if cart items match
      const cartItemsMatch = this.compareCartItems(checkout.cartItems, cartItems);
      console.log('🔍 Cart items comparison:', {
        checkoutItems: checkout.cartItems?.map(item => item.eventId),
        currentItems: cartItems.map(item => item.eventId),
        match: cartItemsMatch
      });
      
      if (cartItemsMatch) {
        console.log('✅ Found matching checkout!');
        return checkout;
      }
      
      console.log('❌ Cart items mismatch, skipping');
    }

    console.log('❌ No matching checkout found');
    return null;
  }

  /**
   * Compare two cart item arrays to see if they contain the same events
   */
  private compareCartItems(cartItems1: any[], cartItems2: CartItemDto[]): boolean {
    if (cartItems1.length !== cartItems2.length) {
      return false;
    }

    // Extract event IDs and sort them for comparison
    const eventIds1 = cartItems1.map(item => item.eventId).sort();
    const eventIds2 = cartItems2.map(item => item.eventId).sort();

    // Compare the sorted arrays
    return JSON.stringify(eventIds1) === JSON.stringify(eventIds2);
  }

  private async createOrderFromCheckout(checkout: Checkout): Promise<any> {
    return await this.orderRepository.manager.transaction(async (manager) => {
      // Generate order number
      const currentYear = new Date().getFullYear();
      const lastOrder = await manager.find(Order, {
        where: { orderNo: Like(`${currentYear}%`) },
        order: { orderNo: 'DESC' },
        take: 1,
      });

      let orderNo: string;
      if (lastOrder.length > 0) {
        const lastSequentialNumber = parseInt(
          lastOrder[0].orderNo.slice(5),
          10,
        );
        orderNo = `${currentYear}-${(lastSequentialNumber + 1).toString().padStart(4, '0')}`;
      } else {
        orderNo = `${currentYear}-0001`;
      }

      // Create order
      const order = manager.create(Order, {
        orderNo,
        user: checkout.user,
        paymentMethod: PaymentMethod.CreditCard, // Map from payment gateway
        price: Number(checkout.totalAmount),
        status: OrderStatus.Completed,
        discount: Number(checkout.discount || 0),
        originalPrice: Number(checkout.totalAmount) + Number(checkout.discount || 0),
      });

      const savedOrder = await manager.save(Order, order);

      // Create order items and register events
      for (const cartItem of checkout.cartItems) {
        const event = await manager.findOne(Event, {
          where: { id: cartItem.eventId },
        });
        if (event) {
          // Create order item
          const orderItem = manager.create(OrderItemEntity, {
            order: savedOrder,
            event: event,
          });
          await manager.save(OrderItemEntity, orderItem);

          // Register for event
          const registerEvent = manager.create(RegisterEvent, {
            userId: checkout.user.id,
            eventId: event.id,
            type: 'Attendee',
            orderId: savedOrder.id,
          });
          await manager.save(RegisterEvent, registerEvent);

          // Remove from cart
          await manager.delete(Cart, {
            userId: checkout.user.id,
            eventId: event.id,
          });
        }
      }

      // Record coupon usage if applicable
      if (checkout.couponCode) {
        const coupon = await this.couponService.getCouponByCode(
          checkout.couponCode,
        );
        if (coupon) {
          await this.couponService.recordCouponUsage(
            checkout.user.id,
            coupon.id,
            savedOrder.id,
          );
        }
      }

      return savedOrder;
    });
  }

  async getCheckoutById(checkoutId: string, userId: string): Promise<any> {
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId, user: { id: userId } },
      relations: ['user'],
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    return {
      id: checkout.id,
      checkoutId: checkout.checkoutId,
      status: checkout.status,
      totalAmount: checkout.totalAmount,
      discount: checkout.discount,
      couponCode: checkout.couponCode,
      paymentGateway: checkout.paymentGateway,
      paymentMethod: checkout.paymentMethod,
      transactionId: checkout.transactionId,
      cartItems: checkout.cartItems,
      isCompleted: checkout.isCompleted,
      createdAt: checkout.createdAt,
      completedAt: checkout.completedAt,
    };
  }

  // Public method for payment success page (no user authentication required)
  async getCheckoutByIdPublic(checkoutId: string): Promise<any> {
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
      relations: ['user'],
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    // Only return checkout if payment is completed for security
    if (!checkout.isCompleted) {
      throw new NotFoundException('Payment not completed yet');
    }

    return checkout;
  }

  async getUserCheckouts(userId: string): Promise<any[]> {
    const checkouts = await this.checkoutRepository.find({
      where: { user: { id: userId }, isDeleted: false },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return checkouts.map((checkout) => ({
      id: checkout.id,
      checkoutId: checkout.checkoutId,
      status: checkout.status,
      totalAmount: checkout.totalAmount,
      discount: checkout.discount,
      couponCode: checkout.couponCode,
      paymentGateway: checkout.paymentGateway,
      isCompleted: checkout.isCompleted,
      createdAt: checkout.createdAt,
      completedAt: checkout.completedAt,
    }));
  }

  async cancelCheckout(checkoutId: string, userId: string): Promise<void> {
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId, user: { id: userId } },
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    if (checkout.status !== CheckoutStatus.Pending) {
      throw new BadRequestException(
        'Cannot cancel checkout that is not in pending status',
      );
    }

    checkout.status = CheckoutStatus.Cancelled;
    await this.checkoutRepository.save(checkout);
  }


  /**
   * Process WooShPay webhook events according to their format
   * This method handle WooShPay webhook format according to payment events
   */
  async processPaymentCompletion(webhookData: any): Promise<void> {
    const eventType = webhookData.type;
    const eventData = webhookData.data?.object;

    try {
      switch (eventType) {
        case 'payment_intent.succeeded':
          await this.completeCheckoutFromPaymentIntent(eventData);
          break;
        case 'payment_intent.requires_action':
          // Ignore requires_action events - only log for debugging
          console.log('🔐 3D Secure authentication in progress (ignoring event)');
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(eventData);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCancelled(eventData);
          break;
        case 'payment_intent.created':
          // Ignore created events - only log for debugging
          console.log('🆕 Payment intent created (ignoring event)');
          break;
        case 'checkout.session.completed':
          await this.completeCheckoutFromSession(eventData);
          break;
        case 'payment_link.paid':
          await this.completeCheckoutFromPaymentLink(eventData);
          break;
        case 'payment_link.failed':
          await this.handlePaymentLinkFailed(eventData);
          break;
        case 'charge.refund.updated':
          await this.handleRefundUpdated(eventData);
          break;
        case 'payout.paid':
          await this.handlePayoutPaid(eventData);
          break;
        case 'payout.failed':
          await this.handlePayoutFailed(eventData);
          break;
        default:
          console.log(`Unhandled WooShPay webhook event type: ${eventType}`);
      }
    } catch (error: any) {
      console.error(`Error processing WooShPay webhook ${eventType}:`, error);
      ErrorHandlerUtil.handleError(error, `Webhook processing failed for event: ${eventType}`);
    }
  }


  /**
   * Complete checkout when payment intent succeeds
   * Payment Intent successful checkout complete
   */
  private async completeCheckoutFromPaymentIntent(
    paymentIntent: any,
  ): Promise<void> {
    let checkoutId = paymentIntent.metadata?.checkout_id;

    // If no checkout_id in metadata, try to find by transaction ID or payment intent ID
    if (!checkoutId) {
      console.log('⚠️ No checkout_id found in payment intent metadata, searching by transaction ID...');
      console.log(`🔍 Searching for: paymentIntentId=${paymentIntent.id}`);
      
      // First try to find by exact transaction ID match
      let checkout = await this.checkoutRepository.findOne({
        where: { transactionId: paymentIntent.id },
        relations: ['user']
      });
      
      // If not found, try to find by partial match (checkout session vs payment intent)
      if (!checkout) {
        console.log('🔍 Trying to find by partial transaction ID match...');
        const allCheckouts = await this.checkoutRepository.find({
          where: { status: CheckoutStatus.Processing },
          relations: ['user']
        });
        
        // Look for the most recent processing checkout (likely the one that just completed payment)
        checkout = allCheckouts.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )[0];
        
        if (checkout) {
          console.log(`✅ Found checkout by partial match: ${checkout.checkoutId} (${checkout.transactionId})`);
        }
      }
      
      if (checkout) {
        checkoutId = checkout.checkoutId;
        console.log(`✅ Found checkout by transaction ID: ${checkoutId}`);
      } else {
        console.log('❌ Could not find checkout by transaction ID either');
        console.log('💡 Available processing checkouts:');
        const processingCheckouts = await this.checkoutRepository.find({
          where: { status: CheckoutStatus.Processing },
          select: ['checkoutId', 'transactionId', 'createdAt']
        });
        console.log(processingCheckouts);
        return;
      }
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
      relations: ['user'],
    });

    if (!checkout) {
      console.error(`Checkout not found for ID: ${checkoutId}`);
      return;
    }

    // Complete the checkout
    checkout.status = CheckoutStatus.Completed;
    checkout.isCompleted = true;
    checkout.completedAt = new Date();
    await this.checkoutRepository.save(checkout);

    // Create order and process items
    await this.createOrderFromCheckout(checkout);

    // Store payment method from WooShPay webhook (secure tokenization)
    try {
      const savedPaymentMethod = await this.paymentMethodService.extractAndStoreFromWebhook(
        checkout.user.id,
        { data: { object: paymentIntent } }
      );
      
      if (savedPaymentMethod) {
        console.log('💳 WooShPay payment method stored:', {
          id: savedPaymentMethod.id,
          displayName: savedPaymentMethod.getDisplayName(),
          wooshpayToken: savedPaymentMethod.wooshpayPaymentMethodId,
          isDefault: savedPaymentMethod.isDefault,
        });
      }
    } catch (error: any) {
      console.log('⚠️ Could not store payment method from webhook:', error.message);
    }

    console.log(`✅ Checkout completed for ID: ${checkoutId}`);
  }

  /**
   * Complete checkout when session is completed
   * Checkout Session complete checkout complete
   */
  private async completeCheckoutFromSession(session: any): Promise<void> {
    const checkoutId = session.metadata?.checkout_id;

    if (!checkoutId) {
      console.log('No checkout_id found in session metadata');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
      relations: ['user'],
    });

    if (!checkout) {
      console.error(`Checkout not found for ID: ${checkoutId}`);
      return;
    }

    // Complete the checkout
    checkout.status = CheckoutStatus.Completed;
    checkout.isCompleted = true;
    checkout.completedAt = new Date();
    await this.checkoutRepository.save(checkout);

    // Create order and process items
    await this.createOrderFromCheckout(checkout);

    console.log(`✅ Checkout session completed for ID: ${checkoutId}`);
  }

  /**
   * Complete checkout when payment link is paid
   * Payment Link paid checkout complete
   */
  private async completeCheckoutFromPaymentLink(
    paymentLink: any,
  ): Promise<void> {
    const checkoutId = paymentLink.metadata?.checkout_id;

    if (!checkoutId) {
      console.log('No checkout_id found in payment link metadata');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
      relations: ['user'],
    });

    if (!checkout) {
      console.error(`Checkout not found for ID: ${checkoutId}`);
      return;
    }

    // Complete the checkout
    checkout.status = CheckoutStatus.Completed;
    checkout.isCompleted = true;
    checkout.completedAt = new Date();
    await this.checkoutRepository.save(checkout);

    // Create order and process items
    await this.createOrderFromCheckout(checkout);

    console.log(`✅ Payment link completed for ID: ${checkoutId}`);
  }

  /**
   * Handle failed payment intent
   * Payment Intent failed checkout failed status
   */
  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    const checkoutId = paymentIntent.metadata?.checkout_id;

    if (!checkoutId) {
      console.log('No checkout_id found in payment intent metadata');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
    });

    if (!checkout) {
      console.error(`Checkout not found for ID: ${checkoutId}`);
      return;
    }

    // Update checkout with payment failure
    checkout.status = CheckoutStatus.Failed;
    checkout.paymentNotes = `Payment failed: ${paymentIntent.status}`;
    await this.checkoutRepository.save(checkout);

    console.log(`❌ Payment intent failed for checkout: ${checkoutId}`);
  }

  /**
   * Handle cancelled payment intent
   * Payment Intent cancelled checkout cancelled status
   */
  private async handlePaymentIntentCancelled(
    paymentIntent: any,
  ): Promise<void> {
    const checkoutId = paymentIntent.metadata?.checkout_id;

    if (!checkoutId) {
      console.log('No checkout_id found in payment intent metadata');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
    });

    if (!checkout) {
      console.error(`Checkout not found for ID: ${checkoutId}`);
      return;
    }

    // Update checkout with cancellation
    checkout.status = CheckoutStatus.Cancelled;
    checkout.paymentNotes = `Payment cancelled: ${paymentIntent.status}`;
    await this.checkoutRepository.save(checkout);

    console.log(`🚫 Payment intent cancelled for checkout: ${checkoutId}`);
  }

  /**
   * Handle failed payment link
   * Payment Link failed checkout failed status
   */
  private async handlePaymentLinkFailed(paymentLink: any): Promise<void> {
    const checkoutId = paymentLink.metadata?.checkout_id;

    if (!checkoutId) {
      console.log('No checkout_id found in payment link metadata');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
    });

    if (!checkout) {
      console.error(`Checkout not found for ID: ${checkoutId}`);
      return;
    }

    // Update checkout with payment link failure
    checkout.status = CheckoutStatus.Failed;
    checkout.paymentNotes = `Payment link failed: ${paymentLink.status}`;
    await this.checkoutRepository.save(checkout);

    console.log(`❌ Payment link failed for checkout: ${checkoutId}`);
  }

  /**
   * Handle refund updated
   * Refund update checkout refund information store
   */
  private async handleRefundUpdated(refund: any): Promise<void> {
    const checkoutId = refund.metadata?.checkout_id;

    if (!checkoutId) {
      console.log('No checkout_id found in refund metadata');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
    });

    if (!checkout) {
      console.error(`Checkout not found for ID: ${checkoutId}`);
      return;
    }

    // Update checkout with refund information
    checkout.paymentNotes = `Refund updated: ${refund.status}`;
    await this.checkoutRepository.save(checkout);

    console.log(`💰 Refund updated for checkout: ${checkoutId}`);
  }

  /**
   * Handle payout paid
   * Payout paid merchant receive money
   */
  private async handlePayoutPaid(payout: any): Promise<void> {
    console.log(`💳 Payout paid: ${payout.id}`, {
      amount: payout.payment_amount,
      currency: payout.payment_currency,
      merchantPayoutId: payout.merchant_payout_id,
    });

    // You can add logic here to notify merchants about successful payouts
    // For example, send email notification, update merchant balance, etc.
  }

  /**
   * Handle payout failed
   * Payout failed merchant recive money not received
   */
  private async handlePayoutFailed(payout: any): Promise<void> {
    console.log(`❌ Payout failed: ${payout.id}`, {
      amount: payout.payment_amount,
      currency: payout.payment_currency,
      merchantPayoutId: payout.merchant_payout_id,
    });

    // You can add logic here to handle failed payouts
    // For example, retry payout, notify merchant, etc.
  }


  /**
   * Get user's saved payment methods for checkout page
   */
  async getUserSavedPaymentMethods(userId: string): Promise<any[]> {
    try {
      return await this.paymentMethodService.getUserPaymentMethods(userId);
    } catch (error) {
      console.log('⚠️ Could not get saved payment methods:', error);
      return [];
    }
  }

  // ============ IN-APP PAYMENT METHODS ============

  /**
   * Process in-app payment with card details (no external redirect)
   * Perfect for popup/modal payments within the event page
   */
  async processInAppPaymentWithCard(userId: string, dto: InAppPaymentDto): Promise<any> {
    console.log('💳 Processing in-app payment with card details');

    // Find checkout session
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId: dto.checkoutId, user: { id: userId } },
      relations: ['user'],
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    if (checkout.status !== CheckoutStatus.Pending) {
      throw new BadRequestException('Checkout session is not in pending status');
    }

    try {
      // Validate card BEFORE changing checkout status
      console.log('🔍 Validating card details...');
      const cardValidation = validateCard(dto.cardNumber, dto.cvc);
      
      if (!cardValidation.isValid) {
        console.log('❌ Card validation failed:', {
          cardType: cardValidation.cardType.name,
          luhnValid: cardValidation.isLuhnValid,
          lengthValid: cardValidation.cardType.validLengths.includes(dto.cardNumber.replace(/\D/g, '').length),
          cvvValid: dto.cvc ? cardValidation.cardType.cvvLength === dto.cvc.length : true
        });
        
        // Generate detailed error message with suggestions
        const errorDetails = this.generateCardValidationError(cardValidation, dto);
        throw new BadRequestException(errorDetails);
      }

      // Only change checkout status to processing AFTER successful validation
      checkout.status = CheckoutStatus.Processing;
      checkout.paymentGateway = PaymentGateway.WooShPay;
      checkout.paymentMethod = 'Credit Card';
      await this.checkoutRepository.save(checkout);
      
      console.log('✅ Card validation successful:', {
        cardType: cardValidation.cardType.name,
        brand: cardValidation.cardType.type,
        region: cardValidation.cardType.region,
        country: cardValidation.cardType.country,
        formattedNumber: cardValidation.formattedNumber
      });

      // Process payment with WooShPay Direct API
      const paymentResult = await this.wooShPayService.processInAppPaymentWithCard(
        checkout.totalAmount,
        'USD',
        {
          number: dto.cardNumber,
          exp_month: dto.expMonth,
          exp_year: dto.expYear,
          cvc: dto.cvc,
          name: dto.cardholderName || `${checkout.user.firstName} ${checkout.user.lastName}`,
        },
        {
          email: dto.billingEmail || checkout.user.email,
          name: dto.cardholderName || `${checkout.user.firstName} ${checkout.user.lastName}`,
        },
        {
          checkout_id: checkout.checkoutId,
          user_id: userId,
          events: checkout.cartItems.map((item: any) => item.eventName).join(', '),
          payment_type: 'in_app',
        }
      );

      console.log('✅ In-app payment processed:', {
        paymentIntentId: paymentResult.paymentIntent.id,
        status: paymentResult.paymentIntent.status,
        requiresAction: paymentResult.requiresAction,
      });

      // Update checkout with transaction details
      checkout.transactionId = paymentResult.paymentIntent.id;
      checkout.paymentNotes = 'In-app payment processed';

      // If payment is successful, complete the checkout immediately
      if (paymentResult.paymentIntent.status === 'succeeded') {
        checkout.status = CheckoutStatus.Completed;
        checkout.isCompleted = true;
        checkout.completedAt = new Date();
        await this.checkoutRepository.save(checkout);

        // Create order and process items
        await this.createOrderFromCheckout(checkout);

        // Store payment method if requested
        try {
          const savedPaymentMethod = await this.paymentMethodService.storePaymentMethodFromWooShPay(
            userId,
            paymentResult.paymentMethod.id,
            {
              // Use detected card brand from validation instead of WooShPay's brand
              brand: cardValidation.cardType.type,
              last4: paymentResult.paymentMethod.card.last4,
              exp_month: paymentResult.paymentMethod.card.exp_month,
              exp_year: paymentResult.paymentMethod.card.exp_year,
              country: paymentResult.paymentMethod.card.country,
              funding: paymentResult.paymentMethod.card.funding,
              fingerprint: paymentResult.paymentMethod.card.fingerprint,
            },
            paymentResult.paymentMethod.billing_details,
            undefined, // customerId
            dto.savePaymentMethod || false // shouldSave
          );
          
          if (savedPaymentMethod) {
            console.log('💳 Payment method saved for future use');
          } else {
            console.log('💳 Payment method not saved (user choice)');
          }
        } catch (error: any) {
          console.log('⚠️ Could not save payment method:', error.message);
        }

        return {
          success: true,
          transactionId: paymentResult.paymentIntent.id,
          status: 'completed',
          isCompleted: true,
          requiresAction: false,
          nextAction: null,
          paymentMethod: {
            id: paymentResult.paymentMethod.id,
            last4: paymentResult.paymentMethod.card.last4,
            brand: paymentResult.paymentMethod.card.brand,
          },
          amount: checkout.totalAmount,
          currency: 'USD',
          message: 'Payment completed successfully!',
        };
      }

      // If payment requires additional action (3D Secure, etc.)
      if (paymentResult.requiresAction) {
        await this.checkoutRepository.save(checkout);
        return {
          success: false,
          transactionId: paymentResult.paymentIntent.id,
          status: 'requires_action',
          isCompleted: false,
          requiresAction: true,
          nextAction: paymentResult.nextAction,
          paymentMethod: {
            id: paymentResult.paymentMethod.id,
            last4: paymentResult.paymentMethod.card.last4,
            brand: paymentResult.paymentMethod.card.brand,
          },
          amount: checkout.totalAmount,
          currency: 'USD',
          message: 'Payment requires 3D Secure authentication. Complete authentication and webhook will handle completion.',
          note: 'After 3D Secure completion, webhook will automatically complete the payment',
        };
      }

      // If payment failed
      checkout.status = CheckoutStatus.Failed;
      checkout.paymentNotes = `Payment failed: ${paymentResult.paymentIntent.status}`;
      await this.checkoutRepository.save(checkout);

      throw new BadRequestException(`Payment failed: ${paymentResult.paymentIntent.status}`);

    } catch (error: any) {
      // Reset checkout status back to pending for retry
      checkout.status = CheckoutStatus.Pending;
      checkout.paymentNotes = error.message;
      await this.checkoutRepository.save(checkout);

      console.error('❌ In-app payment failed:', error);
      
      // If it's a validation error, throw BadRequestException
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Use ErrorHandlerUtil for proper error handling
      ErrorHandlerUtil.handleError(error, 'In-app payment failed');
    }
  }

  /**
   * Process in-app payment with saved payment method (1-click payment)
   */
  async processInAppPaymentWithSavedMethod(userId: string, dto: InAppPaymentWithSavedMethodDto): Promise<any> {
    console.log('⚡ Processing in-app payment with saved method');

    // Find checkout session
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId: dto.checkoutId, user: { id: userId } },
      relations: ['user'],
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    if (checkout.status !== CheckoutStatus.Pending) {
      throw new BadRequestException('Checkout session is not in pending status');
    }

    // Verify saved payment method exists and belongs to user
    const savedPaymentMethod = await this.paymentMethodService.getPaymentMethodById(userId, dto.paymentMethodId);
    if (!savedPaymentMethod) {
      throw new NotFoundException('Saved payment method not found');
    }

    if (savedPaymentMethod.isExpired()) {
      throw new BadRequestException('Saved payment method has expired');
    }

    // Validate CVV BEFORE changing checkout status
    console.log('🔍 Validating CVV for saved payment method...');
    
    if (dto.cvc && dto.cvc.length !== savedPaymentMethod.cvvLength) {
      console.log('❌ CVV validation failed:', {
        expectedLength: savedPaymentMethod.cvvLength,
        providedLength: dto.cvc.length,
        brand: savedPaymentMethod.brand
      });
      
      const errorMessage = this.generateSavedCardCVVError(savedPaymentMethod, dto.cvc);
      throw new BadRequestException(errorMessage);
    }
    
    console.log('✅ CVV validation successful for saved payment method:', {
      brand: savedPaymentMethod.brand,
      cvvLength: savedPaymentMethod.cvvLength
    });

    // Only change checkout status to processing AFTER successful validation
    checkout.status = CheckoutStatus.Processing;
    checkout.paymentGateway = PaymentGateway.WooShPay;
    checkout.paymentMethod = savedPaymentMethod.getDisplayName();
    await this.checkoutRepository.save(checkout);

    try {
      // Process payment with saved method
      const paymentResult = await this.wooShPayService.processInAppPaymentWithSavedMethod(
        checkout.totalAmount,
        'USD',
        savedPaymentMethod.wooshpayPaymentMethodId,
        checkout.user.email,
        {
          checkout_id: checkout.checkoutId,
          user_id: userId,
          events: checkout.cartItems.map((item: any) => item.eventName).join(', '),
          payment_type: 'in_app_saved',
          saved_payment_method_id: dto.paymentMethodId,
        }
      );

      console.log('✅ In-app payment with saved method processed:', {
        paymentIntentId: paymentResult.paymentIntent.id,
        status: paymentResult.paymentIntent.status,
        requiresAction: paymentResult.requiresAction,
      });

      // Update checkout with transaction details
      checkout.transactionId = paymentResult.paymentIntent.id;
      checkout.paymentNotes = 'In-app payment with saved method processed';

      // If payment is successful, complete the checkout immediately
      if (paymentResult.paymentIntent.status === 'succeeded') {
        checkout.status = CheckoutStatus.Completed;
        checkout.isCompleted = true;
        checkout.completedAt = new Date();
        await this.checkoutRepository.save(checkout);

        // Create order and process items
        await this.createOrderFromCheckout(checkout);

        // Update payment method usage tracking
        savedPaymentMethod.usageCount += 1;
        savedPaymentMethod.lastUsedAt = new Date();
        await this.paymentMethodService['paymentMethodRepository'].save(savedPaymentMethod);

        return {
          success: true,
          transactionId: paymentResult.paymentIntent.id,
          status: 'completed',
          isCompleted: true,
          requiresAction: false,
          nextAction: null,
          paymentMethod: {
            id: dto.paymentMethodId,
            displayName: savedPaymentMethod.getDisplayName(),
            last4: savedPaymentMethod.last4,
            brand: savedPaymentMethod.brand,
          },
          amount: checkout.totalAmount,
          currency: 'USD',
          message: 'Payment completed instantly with saved method!',
        };
      }

      // If payment requires additional action
      if (paymentResult.requiresAction) {
        await this.checkoutRepository.save(checkout);
        return {
          success: false,
          transactionId: paymentResult.paymentIntent.id,
          status: 'requires_action',
          isCompleted: false,
          requiresAction: true,
          nextAction: paymentResult.nextAction,
          paymentMethod: {
            id: dto.paymentMethodId,
            displayName: savedPaymentMethod.getDisplayName(),
            last4: savedPaymentMethod.last4,
            brand: savedPaymentMethod.brand,
          },
          amount: checkout.totalAmount,
          currency: 'USD',
          message: 'Payment requires 3D Secure authentication. Complete authentication and webhook will handle completion.',
          note: 'After 3D Secure completion, webhook will automatically complete the payment',
        };
      }

      // If payment failed
      checkout.status = CheckoutStatus.Failed;
      checkout.paymentNotes = `Payment failed: ${paymentResult.paymentIntent.status}`;
      await this.checkoutRepository.save(checkout);

      throw new BadRequestException(`Payment failed: ${paymentResult.paymentIntent.status}`);

    } catch (error: any) {
      // Reset checkout status back to pending for retry
      checkout.status = CheckoutStatus.Pending;
      checkout.paymentNotes = error.message;
      await this.checkoutRepository.save(checkout);

      console.error('❌ In-app payment with saved method failed:', error);
      
      // If it's a validation error, throw BadRequestException
      if (error instanceof BadRequestException) {
      throw error;
      }
      
      // Use ErrorHandlerUtil for proper error handling
      ErrorHandlerUtil.handleError(error, 'In-app payment with saved method failed');
    }
  }


  // Removed fallback system - using real webhook processing only

  /**
   * Generate simple card validation error message
   */
  private generateCardValidationError(cardValidation: any, dto: any): string {
    const cardNumber = dto.cardNumber.replace(/\D/g, '');
    const cardLength = cardNumber.length;

    // Check Luhn algorithm
    if (!cardValidation.isLuhnValid) {
      return 'Invalid card number. Please check and try again.';
    }

    // Check card length
    if (!cardValidation.cardType.validLengths.includes(cardLength)) {
      return `Invalid ${cardValidation.cardType.name} card length. Please check your card number.`;
    }

    // Check CVV length
    if (dto.cvc && dto.cvc.length !== cardValidation.cardType.cvvLength) {
      return `Invalid CVV. ${cardValidation.cardType.name} cards require ${cardValidation.cardType.cvvLength}-digit CVV.`;
    }

    // Check if card type is unknown
    if (cardValidation.cardType.type === 'unknown') {
      return 'Unsupported card type. Please use Visa, Mastercard, or other supported cards.';
    }

    // Default error
    return 'Invalid card details. Please check your card information.';
  }

  /**
   * Generate simple CVV error for saved payment methods
   */
  private generateSavedCardCVVError(savedPaymentMethod: any, providedCVV: string): string {
    const cardBrand = savedPaymentMethod.brand.toUpperCase();
    const expectedLength = savedPaymentMethod.cvvLength;

    return `Invalid CVV. Your ${cardBrand} card requires ${expectedLength}-digit CVV.`;
  }

}
