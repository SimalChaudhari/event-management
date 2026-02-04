import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual } from 'typeorm';
import { WooShPayService } from './wooshpay.service';
import { Checkout } from './checkout.entity';
import { CheckoutCartItem } from './checkout-cart-item.entity';
import { ErrorHandlerUtil } from '../utils/error-handler.util';
import { CheckoutResponseUtils } from '../utils/checkout-response.utils';
import { CheckoutUtils } from '../utils/checkout.utils';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';
import { Cart } from 'cart/cart.entity';
import { Order } from 'order/order.entity';
import { OrderItemEntity } from 'order/event.item.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { CouponService } from 'coupon/coupon.service';
import { CartService } from 'cart/cart.service';
import {
  CreateCheckoutDto,
  CheckoutStatus,
  PaymentGateway,
  CartItemDto,
} from './checkout.dto';
import { OrderStatus, PaymentMethod } from 'order/order.dto';
import { buildGstBreakdown } from '../utils/gst.utils';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Checkout)
    private checkoutRepository: Repository<Checkout>,
    @InjectRepository(CheckoutCartItem)
    private checkoutCartItemRepository: Repository<CheckoutCartItem>,
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
    @Inject(forwardRef(() => CartService))
    private cartService: CartService,
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

    // Validate cart items and calculate total; build itemsForGst for gstBreakdown (same shape as GET session)
    let calculatedTotal = 0;
    const validatedCartItems: CartItemDto[] = [];
    const itemsForGst: Array<{ cartId: string; eventId: string; eventName: string; price: number; startDate?: Date | string | null }> = [];

    for (const item of cartItemsToProcess) {
      const event = await this.eventRepository.findOne({
        where: { id: item.eventId },
      });
      if (!event) {
        throw new NotFoundException(`Event with ID ${item.eventId} not found`);
      }

      const cartItem = await this.cartRepository.findOne({
        where: { userId, eventId: item.eventId },
      });
      if (!cartItem) {
        throw new NotFoundException(
          `Event ${item.eventId} is not in your cart`,
        );
      }

      if (Number(item.price) !== Number(event.price)) {
        throw new BadRequestException(`Price mismatch for event ${event.name}`);
      }

      calculatedTotal += Number(event.price);
      validatedCartItems.push({
        eventId: item.eventId,
        price: Number(event.price),
        eventName: event.name,
      });
      itemsForGst.push({
        cartId: cartItem.id,
        eventId: item.eventId,
        eventName: event.name,
        price: Number(event.price),
        startDate: event.startDate ?? null,
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

    // Build couponApplied for gstBreakdown (same shape as GET session)
    let couponApplied: any = null;
    if (couponData) {
      couponApplied = {
        name: couponData.name,
        discount,
        type: couponData.discountType,
        couponId: couponData.id,
        actualValue: couponData.actualValue,
        discountValue: couponData.discountValue,
      };
    }
    const gstBreakdown = buildGstBreakdown(itemsForGst, calculatedTotal, discount, couponApplied);

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
      const existingCartItems = existingCheckout.checkoutCartItems?.map(item => ({
        eventId: item.eventId,
        price: 0,
        eventName: ''
      })) || validatedCartItems;
      let existingCouponApplied: any = null;
      if (existingCheckout.couponCode) {
        try {
          const coupon = await this.couponService.getCouponByName(existingCheckout.couponCode);
          existingCouponApplied = {
            name: coupon.name,
            discount: Number(existingCheckout.discount || 0),
            type: coupon.discountType,
            couponId: coupon.id,
            actualValue: coupon.actualValue,
            discountValue: coupon.discountValue,
          };
        } catch (_) {}
      }
      const existingGstBreakdown = buildGstBreakdown(
        itemsForGst,
        Number(existingCheckout.totalAmount),
        Number(existingCheckout.discount || 0),
        existingCouponApplied,
      );
      return {
        id: existingCheckout.id,
        checkoutId: existingCheckout.checkoutId,
        status: existingCheckout.status,
        totalAmount: existingCheckout.totalAmount,
        discount: existingCheckout.discount,
        couponCode: existingCheckout.couponCode,
        promoCode: existingCheckout.promoCode,
        cartItems: existingCartItems,
        gstBreakdown: existingGstBreakdown,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
        },
        createdAt: existingCheckout.createdAt,
        isExisting: true,
      };
    }

    console.log('🆕 No existing checkout found, creating new one...');
    // Create checkout session
    const checkoutId = await this.generateUniqueCheckoutId();
    const checkout = this.checkoutRepository.create({
      checkoutId,
      user,
      totalAmount: finalAmount,
      discount,
      couponCode: dto.couponCode,
      promoCode: dto.promoCode,
      status: CheckoutStatus.Pending,
    });

    const savedCheckout = await this.checkoutRepository.save(checkout);

    // Create CheckoutCartItem records for each cart item (store IDs only)
    const checkoutCartItems = [];
    for (const item of cartItemsToProcess) {
      // Get cartId from cart repository
      const cartItem = await this.cartRepository.findOne({
        where: { userId, eventId: item.eventId },
      });
      if (cartItem) {
        const checkoutCartItem = this.checkoutCartItemRepository.create({
          checkout: savedCheckout,
          checkoutId: savedCheckout.checkoutId,
          cartId: cartItem.id,
          eventId: item.eventId,
        });
        const savedItem = await this.checkoutCartItemRepository.save(checkoutCartItem);
        checkoutCartItems.push(savedItem);
      }
    }

    // Get coupon details if coupon code exists
    let couponDetails = null;
    if (savedCheckout.couponCode) {
      try {
        const coupon = await this.couponService.getCouponByName(savedCheckout.couponCode);
        couponDetails = {
          id: coupon.id,
          name: coupon.name,
          discountValue: coupon.discountValue,
          discountType: coupon.discountType,
          actualValue: coupon.actualValue,
          validFrom: coupon.validFrom,
          validTo: coupon.validTo
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
      coupon: couponDetails,
      cartItems: validatedCartItems,
      gstBreakdown,
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
      relations: ['checkoutCartItems'],
      order: { createdAt: 'DESC' }
    });

    console.log('🔍 Found pending checkouts:', pendingCheckouts.length);

    // Compare each pending checkout with current request
    for (const checkout of pendingCheckouts) {
      console.log('🔍 Comparing checkout:', {
        checkoutId: checkout.checkoutId,
        checkoutDiscount: checkout.discount,
        checkoutCouponCode: checkout.couponCode,
        checkoutCartItems: checkout.checkoutCartItems?.length || 0
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

      // Check if cart items match - use checkoutCartItems from database
      const checkoutCartItems = checkout.checkoutCartItems || [];
      const checkoutEventIds = checkoutCartItems.map(item => item.eventId).sort();
      const currentEventIds = cartItems.map(item => item.eventId).sort();
      const cartItemsMatch = JSON.stringify(checkoutEventIds) === JSON.stringify(currentEventIds);
      
      console.log('🔍 Cart items comparison:', {
        checkoutItems: checkoutEventIds,
        currentItems: currentEventIds,
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

  /**
   * Create order from completed checkout. Called only when payment succeeds (webhook: checkout.session.completed or payment_link.paid).
   * Cart items for this checkout are removed here – never on checkout create.
   */
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

      // Get checkout cart items from CheckoutCartItem table
      const checkoutCartItems = checkout.checkoutCartItems || [];
      
      // Create order items and register events
      for (const checkoutCartItem of checkoutCartItems) {
        const event = await manager.findOne(Event, {
          where: { id: checkoutCartItem.eventId },
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

          // Remove from cart only when payment has successfully completed (this method is called only from webhook: checkout.session.completed / payment_link.paid)
          await manager.delete(Cart, {
            userId: checkout.user.id,
            eventId: event.id,
          });
        }
      }

      // Record coupon usage if applicable
      if (checkout.couponCode) {
        const coupon = await this.couponService.getCouponByName(
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
      relations: ['user', 'checkoutCartItems'],
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    let cartItemsFromDb = checkout.checkoutCartItems || [];
    if (!cartItemsFromDb || cartItemsFromDb.length === 0) {
      cartItemsFromDb = await this.checkoutCartItemRepository.find({
        where: { checkoutId: checkout.checkoutId },
      });
    }

    const cartItems = cartItemsFromDb.map(item => ({
      cartId: item.cartId,
      eventId: item.eventId,
    }));

    const cartIds = cartItemsFromDb.map(item => item.cartId);
    const totalAmount = Number(checkout.totalAmount) || 0;
    const discount = Number(checkout.discount) || 0;

    let couponApplied: any = null;
    if (checkout.couponCode && checkout.couponCode.trim() !== '') {
      try {
        const coupon = await this.couponService.getCouponByName(checkout.couponCode);
        if (coupon) {
          couponApplied = {
            name: checkout.couponCode,
            discount,
            type: coupon.discountType,
            couponId: coupon.id,
            actualValue: coupon.actualValue,
            discountValue: coupon.discountValue,
          };
        }
      } catch (_) {}
    }

    let gstBreakdown = buildGstBreakdown([], totalAmount, discount, couponApplied);
    if (cartIds.length > 0) {
      try {
        const cartData = await this.cartService.getCartItemsByIds(userId, cartIds);
        const itemsWithPrice = (cartData.items || []).map((item: any) => ({
          cartId: item.cartId,
          eventId: item.eventId,
          eventName: item.eventName || '',
          price: Number(item.price) || 0,
          startDate: item.startDate ?? null,
        }));
        gstBreakdown = buildGstBreakdown(itemsWithPrice, totalAmount, discount, couponApplied);
      } catch (_) {
        // keep default gstBreakdown if cart fetch fails
      }
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
      cartItems,
      isCompleted: checkout.isCompleted,
      createdAt: checkout.createdAt,
      completedAt: checkout.completedAt,
      gstBreakdown,
    };
  }

  /**
   * Get or create WooShPay customer for checkout session flow.
   * When user is on checkout page, call this first. If user has wooshpayCustomerId in DB, return it; else create customer via WooShPay and save to DB.
   */
  async getOrCreateWooShPayCustomer(
    userId: string,
    dto?: {
      address?: { city?: string; country?: string; line1?: string; line2?: string; postal_code?: string; state?: string };
      shipping?: { address?: { city?: string; country?: string; line1?: string; line2?: string; postal_code?: string; state?: string }; name?: string; phone?: string };
      name?: string;
      phone?: string;
    },
  ): Promise<{ customerId: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.wooshpayCustomerId) {
      return { customerId: user.wooshpayCustomerId };
    }

    const customerPayload: Record<string, any> = {
      email: user.email,
      name: dto?.name ?? (((user.firstName ?? '') + ' ' + (user.lastName ?? '')).trim() || undefined),
      phone: dto?.phone ?? user.mobile ?? undefined,
      address: dto?.address,
      shipping: dto?.shipping,
    };
    Object.keys(customerPayload).forEach((k) => customerPayload[k] === undefined && delete customerPayload[k]);

    const customer = await this.wooShPayService.createCustomer(customerPayload);
    const customerId = customer?.id;
    if (!customerId) {
      throw new InternalServerErrorException('WooShPay customer creation did not return customer id');
    }

    user.wooshpayCustomerId = customerId;
    await this.userRepository.save(user);

    return { customerId };
  }



  /**
   * Create WooShPay Checkout Session (redirect flow – uses /v1/checkout/sessions, NOT Payment Intent).
   * When user clicks "Process now", call this with checkoutId; returns URL to redirect user to complete payment.
   */
  async createWooShPayCheckoutSession(
    userId: string,
    checkoutId: string,
    successUrl: string,
    cancelUrl: string,
    currency: string = 'USD',
  ): Promise<{ url: string; sessionId?: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { customerId } = await this.getOrCreateWooShPayCustomer(userId);

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId, user: { id: userId } },
      relations: ['checkoutCartItems'],
    });
    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }
    if (checkout.isCompleted) {
      throw new BadRequestException('Checkout is already completed');
    }

    const items = checkout.checkoutCartItems || [];
    if (items.length === 0) {
      throw new BadRequestException('No cart items in checkout');
    }

    const line_items: Array<{
      price_data: { currency: string; unit_amount: number; product_data: { name: string; description?: string } };
      quantity: number;
    }> = [];

    for (const item of items) {
      const event = await this.eventRepository.findOne({ where: { id: item.eventId } });
      if (!event) continue;
      const price = Number(event.price ?? 0);
      const unitAmountCents = Math.round(price * 100); // smallest unit (cents)
      const eventName = (event.name && String(event.name).trim()) || `Event ${event.id}`;
      const rawDesc = event.description ? String(event.description) : '';
      const plainDesc = rawDesc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
      line_items.push({
        price_data: {
          currency,
          unit_amount: unitAmountCents,
          product_data: {
            name: eventName,
            description: plainDesc || eventName,
          },
        },
        quantity: 1,
      });
    }

    if (line_items.length === 0) {
      throw new BadRequestException('No valid events found for checkout');
    }

    const sessionPayload: any = {
      cancel_url: cancelUrl,
      success_url: successUrl,
      mode: 'payment',
      customer: customerId,
      line_items,
      metadata: { checkout_id: checkoutId, user_id: userId },
    };

    const session = await this.wooShPayService.createCheckoutSession(sessionPayload);

    const url = session?.url ?? session?.checkout_url ?? session?.session?.url;
    if (!url) {
      throw new InternalServerErrorException('WooShPay checkout session did not return a URL');
    }

    const sessionId = session?.id;
    checkout.paymentUrl = url;
    if (sessionId) checkout.wooshpaySessionId = sessionId;
    await this.checkoutRepository.save(checkout);

    return { url, sessionId };
  }

  /**
   * Retrieve a WooShPay Checkout Session by session ID
   */
  async getWooShPaySession(sessionId: string): Promise<any> {
    return await this.wooShPayService.getCheckoutSession(sessionId);
  }

  /**
   * Retrieve WooShPay session by our checkoutId (uses stored wooshpaySessionId)
   */
  async getWooShPaySessionByCheckoutId(userId: string, checkoutId: string): Promise<any> {
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId, user: { id: userId } },
    });
    if (!checkout) throw new NotFoundException('Checkout not found');
    if (!checkout.wooshpaySessionId) throw new BadRequestException('No WooShPay session for this checkout');
    return await this.wooShPayService.getCheckoutSession(checkout.wooshpaySessionId);
  }

  /**
   * Expire a WooShPay Checkout Session by session ID
   */
  async expireWooShPaySession(sessionId: string): Promise<any> {
    return await this.wooShPayService.expireCheckoutSession(sessionId);
  }

  /**
   * Expire WooShPay session by our checkoutId (uses stored wooshpaySessionId)
   */
  async expireWooShPaySessionByCheckoutId(userId: string, checkoutId: string): Promise<any> {
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId, user: { id: userId } },
    });
    if (!checkout) throw new NotFoundException('Checkout not found');
    if (!checkout.wooshpaySessionId) throw new BadRequestException('No WooShPay session for this checkout');
    return await this.wooShPayService.expireCheckoutSession(checkout.wooshpaySessionId);
  }

  /**
   * List WooShPay Checkout Sessions (retrieve all with optional limit)
   */
  async listWooShPaySessions(params?: { limit?: number }): Promise<any> {
    return await this.wooShPayService.listCheckoutSessions(params);
  }

  async getCheckoutByOrderId(orderId: string): Promise<any> {
    return CheckoutUtils.getCheckoutByOrderId(
      orderId,
      this.orderRepository,
      this.checkoutRepository,
      this.checkoutCartItemRepository
    );
  }

  async updateCheckoutCartItems(checkoutId: string, cartItemsMinimal: any[]): Promise<void> {
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
      relations: ['checkoutCartItems'],
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    // Delete existing checkout cart items
    if (checkout.checkoutCartItems && checkout.checkoutCartItems.length > 0) {
      await this.checkoutCartItemRepository.remove(checkout.checkoutCartItems);
    }

    // Create new checkout cart items
    for (const item of cartItemsMinimal) {
      const checkoutCartItem = this.checkoutCartItemRepository.create({
        checkout: checkout,
        checkoutId: checkout.checkoutId,
        cartId: item.cartId,
        eventId: item.eventId,
      });
      await this.checkoutCartItemRepository.save(checkoutCartItem);
    }
  }

  async applyCouponToCheckout(checkoutId: string, userId: string, couponCode: string): Promise<any> {
    // Get checkout with cart items
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId, user: { id: userId } },
      relations: ['user', 'checkoutCartItems'],
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    // Check if checkout is already completed
    if (checkout.isCompleted) {
      throw new BadRequestException('Cannot apply coupon to completed checkout');
    }

    // Get cart items from CheckoutCartItem table
    const checkoutCartItems = checkout.checkoutCartItems || [];
    if (checkoutCartItems.length === 0) {
      throw new BadRequestException('No cart items found in checkout');
    }

    // Calculate total from cart items
    let totalAmount = 0;
    for (const item of checkoutCartItems) {
      const event = await this.eventRepository.findOne({
        where: { id: item.eventId },
      });
      if (event) {
        totalAmount += Number(event.price || 0);
      }
    }

    // Validate and apply coupon
    const couponResult = await this.couponService.validateAndApplyCoupon(
      couponCode,
      userId,
      totalAmount,
    );

    const { discount, finalAmount } = couponResult;

    // Update checkout with coupon details
    checkout.couponCode = couponCode;
    checkout.discount = discount;
    checkout.totalAmount = finalAmount; // Update totalAmount to reflect discounted amount

    await this.checkoutRepository.save(checkout);

    // Return updated checkout with coupon details
    return {
      checkoutId: checkout.checkoutId,
      status: checkout.status,
      totalAmount: finalAmount,
      originalTotal: totalAmount,
      discount: discount,
      couponCode: couponCode,
      coupon: {
        id: couponResult.coupon.id,
        name: couponResult.coupon.name,
        discountValue: couponResult.coupon.discountValue,
        discountType: couponResult.coupon.discountType,
        actualValue: couponResult.coupon.actualValue,
        expiryDate: couponResult.coupon.expiryDate,
      },
      priceBreakdown: {
        subtotal: totalAmount,
        discount: discount,
        total: finalAmount,
        currency: 'USD',
        gstInclusive: true,
      },
    };
  }

  // Public method for payment success page (no user authentication required)
  async getCheckoutByIdPublic(checkoutId: string): Promise<any> {
    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
      relations: ['user', 'checkoutCartItems'],
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    // Only return checkout if payment is completed for security
    if (!checkout.isCompleted) {
      throw new NotFoundException('Payment not completed yet');
    }

    // Convert checkoutCartItems to cartItems format for response
    const cartItems = checkout.checkoutCartItems?.map(item => ({
      cartId: item.cartId,
      eventId: item.eventId,
    })) || [];

    return {
      ...checkout,
      cartItems: cartItems,
    };
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

    console.log('🔔 Processing webhook event:', {
      type: eventType,
      objectId: eventData?.id,
      status: eventData?.status,
      checkoutId: eventData?.metadata?.checkout_id,
      timestamp: new Date().toISOString()
    });

    try {
      switch (eventType) {
        case 'checkout.session.completed':
          console.log('✅ Checkout session completed, completing checkout...');
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
   * Complete checkout when session is completed (payment succeeded).
   * Only then we create order and remove those items from cart.
   */
  private async completeCheckoutFromSession(session: any): Promise<void> {
    const checkoutId = session.metadata?.checkout_id;

    if (!checkoutId) {
      console.log('No checkout_id found in session metadata');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
      relations: ['user', 'checkoutCartItems'],
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

    // Create order and remove cart items only after payment success
    await this.createOrderFromCheckout(checkout);

    console.log(`✅ Checkout session completed for ID: ${checkoutId} (order created, cart items removed)`);
  }

  /**
   * Complete checkout when payment link is paid (payment succeeded).
   * Only then we create order and remove those items from cart.
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
      relations: ['user', 'checkoutCartItems'],
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

    // Create order and remove cart items only after payment success
    await this.createOrderFromCheckout(checkout);

    console.log(`✅ Payment link completed for ID: ${checkoutId} (order created, cart items removed)`);
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
   * Get all completed checkouts for a user
   * This method retrieves only completed payment data from the checkout table
   */
  async getCompletedCheckouts(userId: string): Promise<any[]> {
    try {
      const completedCheckouts = await this.checkoutRepository.find({
        where: {
          user: { id: userId },
          status: CheckoutStatus.Completed,
          isCompleted: true
        },
        relations: ['user', 'checkoutCartItems'],
        order: { createdAt: 'DESC' }
      });
      console.log('completedCheckouts', completedCheckouts);

      if (!completedCheckouts || completedCheckouts.length === 0) {
        return [];
      }

      // Format the response using utility function (no saved card data)
      return CheckoutResponseUtils.formatMultipleCheckoutsResponse(completedCheckouts, []);
    } catch (error: any) {
      console.error('❌ Error getting completed checkouts:', error);
      throw new InternalServerErrorException(
        `Failed to retrieve completed checkouts: ${error.message}`
      );
    }
  }

  /**
   * Get specific completed checkout by ID for a user
   * This method retrieves only completed payment data from the checkout table
   */
  async getCompletedCheckoutById(checkoutId: string, userId: string): Promise<any> {
    try {
      const checkout = await this.checkoutRepository.findOne({
        where: {
          checkoutId: checkoutId,
          user: { id: userId },
          status: CheckoutStatus.Completed,
          isCompleted: true
        },
        relations: ['user', 'checkoutCartItems']
      });

      if (!checkout) {
        throw new NotFoundException('Completed checkout not found or you are not authorized to view this checkout');
      }

      // Format the response using utility function (include details for single checkout; no saved card data)
      return CheckoutResponseUtils.formatCheckoutResponse(checkout, null, true);
    } catch (error: any) {
      console.error('❌ Error getting checkout by ID:', error);
      
      // Re-throw NotFoundException as is
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle other errors
      throw new InternalServerErrorException(
        `Failed to retrieve checkout details: ${error.message}`
      );
    }
  }

}
