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
import { Refund } from './refund.entity';
import { ErrorHandlerUtil } from '../utils/error-handler.util';
import { CheckoutResponseUtils } from '../utils/checkout-response.utils';
import { CheckoutUtils } from '../utils/checkout.utils';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';
import { Cart } from 'cart/cart.entity';
import { Order } from 'order/order.entity';
import { OrderItemEntity, OrderNoStatus } from 'order/event.item.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { OrderService } from 'order/order.service';
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
import { generateUniqueOrderNumber } from 'utils/order-number.utils';
import { AddressService } from 'user/address.service';
import type { WooShPayBillingDetails, WooShPayShippingDetails } from './wooshpay.service';
import * as isoCountries from 'i18n-iso-countries';

// WooShPay requires ISO 2-letter country codes (e.g. IN, SG). Default to Singapore when missing/invalid.
const WOOSHPAY_DEFAULT_COUNTRY = 'SG';

/** Normalize country to ISO 2-letter code; default to Singapore (SG) when missing or invalid. */
function toCountryCode(country: string | undefined | null): string {
  const raw = (country ?? '').trim();
  if (!raw) return WOOSHPAY_DEFAULT_COUNTRY;
  if (raw.length === 2 && /^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  try {
    if (!isoCountries.getNames('en')) {
      isoCountries.registerLocale(require('i18n-iso-countries/langs/en.json'));
    }
    const code = isoCountries.getAlpha2Code(raw, 'en');
    return code ? code.toUpperCase() : WOOSHPAY_DEFAULT_COUNTRY;
  } catch {
    return WOOSHPAY_DEFAULT_COUNTRY;
  }
}

/** Max webhook event IDs to keep for deduplication (prevents same event being processed twice on retry). */
const WEBHOOK_DEDUPE_MAX = 50000;

@Injectable()
export class CheckoutService {
  /** Processed webhook event keys (eventId or type+objectId) – skip if already seen (retries/duplicates). */
  private processedWebhookKeys = new Set<string>();

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
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    private couponService: CouponService,
    private wooShPayService: WooShPayService,
    @Inject(forwardRef(() => CartService))
    private cartService: CartService,
    private orderService: OrderService,
    private addressService: AddressService,
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
    const itemsForGst: Array<{
      cartId: string;
      eventId: string;
      eventName: string;
      price: number;
      startDate?: Date | string | null;
      gstRate?: number;
    }> = [];

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

      const basePrice = Number(event.price);
      const gstRate = Number(event.gstRate) || 18;
      const totalPrice = Math.round(basePrice * (1 + gstRate / 100) * 100) / 100;

      if (Number(item.price) !== basePrice && Number(item.price) !== totalPrice) {
        throw new BadRequestException(`Price mismatch for event ${event.name}`);
      }

      calculatedTotal += totalPrice;
      validatedCartItems.push({
        eventId: item.eventId,
        price: basePrice,
        eventName: event.name,
      });
      itemsForGst.push({
        cartId: cartItem.id,
        eventId: item.eventId,
        eventName: event.name,
        price: basePrice,
        startDate: event.startDate ?? null,
        gstRate,
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

    // Build couponApplied for gstBreakdown (same shape as GET session). Add discountPercentage for UI to show "10% off".
    let couponApplied: any = null;
    if (couponData) {
      const discountPercentage =
        couponData.discountType === 'percentage'
          ? Number(couponData.discountValue)
          : calculatedTotal > 0
            ? Math.round((discount / calculatedTotal) * 10000) / 100
            : 0;
      couponApplied = {
        name: couponData.name,
        discount,
        discountPercentage,
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
      const existingCartItems = existingCheckout.checkoutCartItems?.map(item => ({
        eventId: item.eventId,
        price: 0,
        eventName: ''
      })) || validatedCartItems;

      // If current request has different coupon/discount, update existing checkout (single API: create-checkout with coupon applies it)
      const couponChanged = (dto.couponCode || '') !== (existingCheckout.couponCode || '');
      const discountChanged = Number(discount) !== Number(existingCheckout.discount || 0);
      const totalChanged = Math.abs(Number(finalAmount) - Number(existingCheckout.totalAmount || 0)) > 0.01;
      if (couponChanged || discountChanged || totalChanged) {
        console.log('🔄 Updating existing checkout with new coupon/discount:', { couponChanged, discountChanged, totalChanged });
        existingCheckout.couponCode = dto.couponCode ?? existingCheckout.couponCode;
        existingCheckout.discount = discount;
        existingCheckout.totalAmount = finalAmount;
        await this.checkoutRepository.save(existingCheckout);
      }

      let existingCouponApplied: any = null;
      const couponCodeToUse = existingCheckout.couponCode;
      if (couponCodeToUse) {
        try {
          const coupon = await this.couponService.getCouponByName(couponCodeToUse);
          const subTotal = Number(existingCheckout.totalAmount || 0) + Number(existingCheckout.discount || 0);
          const discAmount = Number(existingCheckout.discount || 0);
          const discountPercentage =
            coupon.discountType === 'percentage'
              ? Number(coupon.discountValue)
              : subTotal > 0 ? Math.round((discAmount / subTotal) * 10000) / 100 : 0;
          existingCouponApplied = {
            name: coupon.name,
            discount: discAmount,
            discountPercentage,
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
      let couponDetails: any = null;
      if (couponCodeToUse) {
        try {
          const coupon = await this.couponService.getCouponByName(couponCodeToUse);
          const subTotal = Number(existingCheckout.totalAmount || 0) + Number(existingCheckout.discount || 0);
          const discAmount = Number(existingCheckout.discount || 0);
          const discountPercentage =
            coupon.discountType === 'percentage'
              ? Number(coupon.discountValue)
              : subTotal > 0 ? Math.round((discAmount / subTotal) * 10000) / 100 : 0;
          couponDetails = {
            id: coupon.id,
            name: coupon.name,
            discountValue: coupon.discountValue,
            discountType: coupon.discountType,
            discountPercentage,
            actualValue: coupon.actualValue,
            validFrom: coupon.validFrom,
            validTo: coupon.validTo,
          };
        } catch (_) {}
      }
      return {
        id: existingCheckout.id,
        checkoutId: existingCheckout.checkoutId,
        status: existingCheckout.status,
        totalAmount: existingCheckout.totalAmount,
        discount: existingCheckout.discount,
        discountPercentage: existingCouponApplied?.discountPercentage ?? null,
        couponCode: existingCheckout.couponCode,
        coupon: couponDetails,
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
      billingSameAsShipping: dto.billingSameAsShipping ?? false,
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

    // Get coupon details if coupon code exists. Add discountPercentage for UI to show "10% off".
    let couponDetails = null;
    if (savedCheckout.couponCode) {
      try {
        const coupon = await this.couponService.getCouponByName(savedCheckout.couponCode);
        const subTotal = Number(savedCheckout.totalAmount || 0) + Number(savedCheckout.discount || 0);
        const discAmount = Number(savedCheckout.discount || 0);
        const discountPercentage =
          coupon.discountType === 'percentage'
            ? Number(coupon.discountValue)
            : subTotal > 0 ? Math.round((discAmount / subTotal) * 10000) / 100 : 0;
        couponDetails = {
          id: coupon.id,
          name: coupon.name,
          discountValue: coupon.discountValue,
          discountType: coupon.discountType,
          discountPercentage,
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
      discountPercentage: couponDetails?.discountPercentage ?? null,
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
    const cartCount = checkout.checkoutCartItems?.length ?? 0;
    console.log('[WEBHOOK createOrderFromCheckout] checkoutId=', checkout.checkoutId, '| cartItems=', cartCount);
    return await this.orderRepository.manager.transaction(async (manager) => {
      const orderNo = await generateUniqueOrderNumber(async (candidate) => {
        const existing = await manager.findOne(Order, {
          where: { orderNo: candidate },
          select: ['id'],
        });
        return !!existing;
      }).catch(() => {
        throw new InternalServerErrorException('Could not generate unique order number. Please retry.');
      });

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
      console.log('[WEBHOOK createOrderFromCheckout] Order created id=', savedOrder.id, 'orderNo=', (savedOrder as any).orderNo);

      // Link checkout to order for refund lookups
      await manager.update(Checkout, { checkoutId: checkout.checkoutId }, { orderId: savedOrder.id });

      // Get checkout cart items from CheckoutCartItem table
      const checkoutCartItems = checkout.checkoutCartItems || [];
      if (checkoutCartItems.length === 0) {
        console.warn('[WEBHOOK createOrderFromCheckout] No checkoutCartItems – no order items or register events will be created');
      }
      // Create order items (Completed + invoice) and register events
      for (const checkoutCartItem of checkoutCartItems) {
        const event = await manager.findOne(Event, {
          where: { id: checkoutCartItem.eventId },
        });
        if (event) {
          const invoiceNumber = await this.orderService.generateInvoiceNumberInTransaction(manager);
          const orderItem = manager.create(OrderItemEntity, {
            order: savedOrder,
            event,
            status: OrderNoStatus.Completed,
            invoiceNumber,
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
          console.log('[WEBHOOK createOrderFromCheckout] RegisterEvent created for eventId=', event.id);

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
          const subTotal = totalAmount + discount;
          const discountPercentage =
            coupon.discountType === 'percentage'
              ? Number(coupon.discountValue)
              : subTotal > 0 ? Math.round((discount / subTotal) * 10000) / 100 : 0;
          couponApplied = {
            name: checkout.couponCode,
            discount,
            discountPercentage,
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
          gstRate: Number(item.gstRate) || 18,
        }));
        gstBreakdown = buildGstBreakdown(itemsWithPrice, totalAmount, discount, couponApplied);
      } catch (_) {
        // keep default gstBreakdown if cart fetch fails
      }
    }

    return {
      id: checkout.id,
      checkoutId: checkout.checkoutId,
      orderId: checkout.orderId ?? null,
      status: checkout.status,
      totalAmount: checkout.totalAmount,
      discount: checkout.discount,
      discountPercentage: couponApplied?.discountPercentage ?? null,
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
    currency: string = 'SGD',
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

    // Use discounted total (checkout.totalAmount) so WooShPay charges the amount after coupon, not original
    const amountToCharge = Number(checkout.totalAmount ?? 0);
    const amountToChargeCents = Math.round(amountToCharge * 100);

    const line_items: Array<{
      price_data: { currency: string; unit_amount: number; product_data: { name: string; description?: string } };
      quantity: number;
    }> = [];

    const eventPrices: { event: any; price: number }[] = [];
    let originalTotal = 0;
    for (const item of items) {
      const event = await this.eventRepository.findOne({ where: { id: item.eventId } });
      if (!event) continue;
      const price = Number(event.price ?? 0);
      originalTotal += price;
      eventPrices.push({ event, price });
    }

    if (eventPrices.length === 0) {
      throw new BadRequestException('No valid events found for checkout');
    }

    // Split amountToCharge across line items (proportional to event price) so WooShPay total = discounted amount
    for (let i = 0; i < eventPrices.length; i++) {
      const { event, price } = eventPrices[i];
      let unitAmountCents: number;
      if (originalTotal <= 0) {
        unitAmountCents = Math.round(amountToChargeCents / eventPrices.length);
      } else if (i === eventPrices.length - 1) {
        // Last item: use remainder so total is exactly amountToChargeCents (avoids rounding drift)
        const soFar = line_items.reduce((sum, li) => sum + (li.price_data.unit_amount || 0) * (li.quantity || 1), 0);
        unitAmountCents = Math.max(0, amountToChargeCents - soFar);
      } else {
        unitAmountCents = Math.round((price / originalTotal) * amountToChargeCents);
      }
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

    const sessionPayload: any = {
      cancel_url: cancelUrl,
      success_url: successUrl,
      mode: 'payment',
      customer: customerId,
      line_items,
      metadata: { checkout_id: checkoutId, user_id: userId },
      payment_method_types: ['card'],
    };

    // Only pass billing/shipping when billingSameAsShipping is true AND user has address – WooShPay format
    const useBillingShipping = checkout.billingSameAsShipping === true;
    let defaultAddress: { street: string; apartment?: string; city: string; state: string; postalCode: string; country: string } | null = null;
    if (useBillingShipping) {
      try {
        const addr = await this.addressService.findDefaultAddress(userId);
        if (addr && addr.street && addr.city && addr.country) {
          defaultAddress = {
            street: addr.street,
            apartment: addr.apartment ?? undefined,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            country: addr.country,
          };
        }
      } catch {
        // No address or error – do not add billing_address_collection or payment_intent_data
      }
    }

    if (defaultAddress) {
      const countryCode = toCountryCode(defaultAddress.country);
      const userName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined;
      const billing_details: WooShPayBillingDetails = {
        name: userName,
        email: user.email ?? undefined,
        phone: user.mobile ?? undefined,
        address: {
          line1: defaultAddress.street,
          line2: defaultAddress.apartment,
          city: defaultAddress.city,
          state: defaultAddress.state,
          postal_code: defaultAddress.postalCode,
          country: countryCode,
        },
      };
      const shipping: WooShPayShippingDetails = {
        name: userName,
        phone: user.mobile ?? undefined,
        address: {
          line1: defaultAddress.street,
          line2: defaultAddress.apartment,
          city: defaultAddress.city,
          state: defaultAddress.state,
          postal_code: defaultAddress.postalCode,
          country: countryCode,
        },
      };
      sessionPayload.billing_address_collection = 'required';
      sessionPayload.shipping_address_collection = { allowed_countries: [countryCode] };
      sessionPayload.payment_intent_data = {
        billing_details,
        shipping,
      };
    }

    const session = await this.wooShPayService.createCheckoutSession(sessionPayload);

    const url = session?.url ?? session?.checkout_url ?? session?.session?.url;
    if (!url) {
      throw new InternalServerErrorException('WooShPay checkout session did not return a URL');
    }

    const sessionId = session?.id;
    // Do not store paymentUrl (sensitive); return URL only for one-time redirect
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

  /**
   * Create a refund for an order paid via WooShPay.
   * Finds the checkout by orderId (must belong to the user), then calls WooShPay refund API.
   * @param orderId - Order UUID
   * @param userId - Requesting user (must own the order)
   * @param amount - Optional amount in cents; omit for full refund
   * @param reason - Optional reason (e.g. 'requested_by_customer', 'duplicate')
   */
  async createRefundForOrder(
    orderId: string,
    userId: string,
    amount?: number,
    reason?: string,
  ): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
    });
    if (!order) {
      throw new NotFoundException('Order not found or you do not have access to it');
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { orderId, user: { id: userId } },
    });
    if (!checkout) {
      throw new NotFoundException('Checkout not found for this order. Refund is only available for WooShPay orders.');
    }

    const paymentIntentId = checkout.wooshpayPaymentIntentId;
    if (!paymentIntentId) {
      throw new BadRequestException(
        'No payment intent stored for this order. Refunds are only supported for orders paid via WooShPay checkout.',
      );
    }

    const result = await this.wooShPayService.createRefund(
      paymentIntentId,
      amount,
      reason,
    );

    // Store refund so user can track status
    const refundEntity = this.refundRepository.create({
      orderId,
      wooshpayRefundId: result.id,
      amount: result.amount ?? 0,
      currency: result.currency ?? 'SGD',
      status: result.status ?? 'pending',
      reason: result.reason ?? reason ?? undefined,
    });
    await this.refundRepository.save(refundEntity);

    return result;
  }

  /**
   * Get refund status for an order (so user can track). Returns list of refunds for that order.
   */
  async getRefundStatusForOrder(orderId: string, userId: string): Promise<any[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
    });
    if (!order) {
      throw new NotFoundException('Order not found or you do not have access to it');
    }

    const refunds = await this.refundRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });

    return refunds.map((r) => ({
      id: r.id,
      wooshpayRefundId: r.wooshpayRefundId,
      amount: r.amount,
      amountFormatted: `$${(r.amount / 100).toFixed(2)}`,
      currency: r.currency,
      status: r.status,
      reason: r.reason,
      createdAt: r.createdAt,
    }));
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
        validTo: couponResult.coupon.validTo,
      },
      priceBreakdown: {
        subtotal: totalAmount,
        discount: discount,
        total: finalAmount,
        currency: 'SGD',
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

    const { paymentUrl: _omit, ...rest } = checkout;
    return {
      ...rest,
      cartItems,
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

    // Expire WooShPay session immediately so payment URL cannot be reused
    if (checkout.wooshpaySessionId) {
      try {
        await this.expireWooShPaySession(checkout.wooshpaySessionId);
      } catch (e) {
        console.warn('[cancelCheckout] Expire session failed (may already be expired):', (e as Error)?.message);
      }
    }
    checkout.paymentUrl = undefined;
    checkout.status = CheckoutStatus.Cancelled;
    await this.checkoutRepository.save(checkout);
  }


  /**
   * Process WooShPay webhook events according to their format.
   * Deduplicates by event ID / type+objectId so the same webhook (retry or duplicate) is not processed twice.
   */
  async processPaymentCompletion(webhookData: any): Promise<void> {
    // Support both webhook shapes: { type, data: { object } } and { event_type, object } or { event_type, data }
    let eventType = webhookData.type || webhookData.event_type;
    if (!eventType && webhookData.data?.object) {
      const obj = webhookData.data.object;
      if (obj.object === 'checkout_session') {
        eventType = obj.status === 'complete' ? 'checkout.session.completed'
          : obj.status === 'expired' ? 'checkout.session.expired'
          : obj.status === 'canceled' || obj.status === 'cancelled' ? 'checkout.session.canceled'
          : 'checkout.session.completed'; // fallback for unknown status
      } else if (obj.object === 'payment_link' && obj.status === 'paid') eventType = 'payment_link.paid';
    }
    if (!eventType && webhookData.object) {
      const obj = webhookData.object;
      if (obj.object === 'checkout_session') {
        eventType = obj.status === 'complete' ? 'checkout.session.completed'
          : obj.status === 'expired' ? 'checkout.session.expired'
          : obj.status === 'canceled' || obj.status === 'cancelled' ? 'checkout.session.canceled'
          : 'checkout.session.completed';
      } else if (obj.object === 'payment_link' && obj.status === 'paid') eventType = 'payment_link.paid';
    }
    const eventData =
      webhookData.data?.object ??
      webhookData.object ??
      webhookData.data ??
      webhookData;

    // Deduplicate: if we already processed this exact webhook event (same id or type+objectId), skip
    const eventId = webhookData.id ?? eventData?.id;
    const dedupeKey = eventId ? String(eventId) : (eventType && eventData?.id ? `${eventType}-${eventData.id}` : null);
    if (dedupeKey) {
      if (this.processedWebhookKeys.has(dedupeKey)) {
        console.log('[WEBHOOK processPaymentCompletion] Already processed dedupeKey=', dedupeKey, '→ skipping (duplicate/retry)');
        return;
      }
      this.processedWebhookKeys.add(dedupeKey);
      if (this.processedWebhookKeys.size > WEBHOOK_DEDUPE_MAX) {
        const arr = Array.from(this.processedWebhookKeys);
        this.processedWebhookKeys = new Set(arr.slice(-Math.floor(WEBHOOK_DEDUPE_MAX / 2)));
      }
    }

    console.log('[WEBHOOK processPaymentCompletion] eventType=', eventType, '| objectId=', eventData?.id, '| status=', eventData?.status);
    console.log('[WEBHOOK processPaymentCompletion] metadata=', eventData?.metadata, '| checkout_id=', eventData?.metadata?.checkout_id);
    if (!eventType) {
      console.error('[WEBHOOK processPaymentCompletion] No event type found. Payload keys:', Object.keys(webhookData || {}));
    }

    try {
      switch (eventType) {
        case 'checkout.session.completed':
          console.log('[WEBHOOK] → completeCheckoutFromSession');
          await this.completeCheckoutFromSession(eventData);
          break;
        case 'checkout.session.expired':
        case 'checkout.session.canceled':
          console.log('[WEBHOOK] → handleCheckoutSessionCanceledOrExpired (user refused or session expired)');
          await this.handleCheckoutSessionCanceledOrExpired(eventData);
          break;
        case 'payment_link.paid':
          console.log('[WEBHOOK] → completeCheckoutFromPaymentLink');
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
          console.log('[WEBHOOK] Unhandled event type:', eventType, '| Full payload keys:', JSON.stringify(Object.keys(webhookData || {})));
      }
    } catch (error: any) {
      console.error('[WEBHOOK] Error in processPaymentCompletion:', eventType, error?.message, error?.stack);
      ErrorHandlerUtil.handleError(error, `Webhook processing failed for event: ${eventType}`);
    }
  }


  /**
   * Complete checkout when session is completed (payment succeeded).
   * Only then we create order and remove those items from cart.
   */
  private async completeCheckoutFromSession(session: any): Promise<void> {
    const status = (session?.status || '').toLowerCase();
    if (status !== 'complete') {
      console.log('[WEBHOOK completeCheckoutFromSession] Session status is not complete:', session?.status, '→ treating as canceled/expired');
      await this.handleCheckoutSessionCanceledOrExpired(session);
      return;
    }

    const checkoutId = session?.metadata?.checkout_id ?? session?.checkout_id;

    console.log('[WEBHOOK completeCheckoutFromSession] session.metadata=', session?.metadata, '| checkoutId=', checkoutId);
    if (!checkoutId) {
      console.error('[WEBHOOK completeCheckoutFromSession] No checkout_id. Session keys:', session ? Object.keys(session) : 'null');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
      relations: ['user', 'checkoutCartItems'],
    });

    if (!checkout) {
      console.error('[WEBHOOK completeCheckoutFromSession] Checkout NOT FOUND for id:', checkoutId);
      return;
    }
    // Idempotency: avoid creating a second order if webhook is called again (retry or duplicate event)
    if (checkout.orderId) {
      console.log('[WEBHOOK completeCheckoutFromSession] Order already created for checkoutId=', checkoutId, '| orderId=', checkout.orderId, '→ skipping');
      return;
    }
    const itemCount = checkout.checkoutCartItems?.length ?? 0;
    console.log('[WEBHOOK completeCheckoutFromSession] Checkout found, cart items=', itemCount);

    if (itemCount === 0) {
      console.warn('[WEBHOOK completeCheckoutFromSession] No cart items – order will have no items/register events. CheckoutId:', checkoutId);
    }

    // Store WooShPay payment intent ID for refunds (session may have payment_intent or payment_intent_id)
    const paymentIntentId = session.payment_intent ?? session.payment_intent_id;
    if (paymentIntentId) {
      checkout.wooshpayPaymentIntentId = typeof paymentIntentId === 'string' ? paymentIntentId : paymentIntentId?.id ?? paymentIntentId;
      checkout.transactionId = checkout.wooshpayPaymentIntentId;
    }

    checkout.status = CheckoutStatus.Completed;
    checkout.isCompleted = true;
    checkout.completedAt = new Date();
    checkout.paymentUrl = undefined; // clear any stored URL; sensitive and no longer needed
    await this.checkoutRepository.save(checkout);

    console.log('[WEBHOOK completeCheckoutFromSession] Creating order from checkout...');
    await this.createOrderFromCheckout(checkout);
    // Expire WooShPay session so payment URL cannot be reused
    if (checkout.wooshpaySessionId) {
      try {
        await this.expireWooShPaySession(checkout.wooshpaySessionId);
      } catch (e) {
        console.warn('[WEBHOOK completeCheckoutFromSession] Expire session failed (may already be expired):', (e as Error)?.message);
      }
    }
    console.log('[WEBHOOK completeCheckoutFromSession] ✅ Done. Order and register events created for checkoutId:', checkoutId);
  }

  /**
   * Complete checkout when payment link is paid (payment succeeded).
   * Only then we create order and remove those items from cart.
   */
  private async completeCheckoutFromPaymentLink(
    paymentLink: any,
  ): Promise<void> {
    const checkoutId = paymentLink?.metadata?.checkout_id ?? paymentLink?.checkout_id;

    console.log('[WEBHOOK completeCheckoutFromPaymentLink] metadata=', paymentLink?.metadata, '| checkoutId=', checkoutId);
    if (!checkoutId) {
      console.error('[WEBHOOK completeCheckoutFromPaymentLink] No checkout_id. PaymentLink keys:', paymentLink ? Object.keys(paymentLink) : 'null');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
      relations: ['user', 'checkoutCartItems'],
    });

    if (!checkout) {
      console.error('[WEBHOOK completeCheckoutFromPaymentLink] Checkout NOT FOUND for id:', checkoutId);
      return;
    }
    // Idempotency: avoid creating a second order if webhook is called again (e.g. both checkout.session.completed and payment_link.paid)
    if (checkout.orderId) {
      console.log('[WEBHOOK completeCheckoutFromPaymentLink] Order already created for checkoutId=', checkoutId, '| orderId=', checkout.orderId, '→ skipping');
      return;
    }
    const itemCount = checkout.checkoutCartItems?.length ?? 0;
    console.log('[WEBHOOK completeCheckoutFromPaymentLink] Checkout found, cart items=', itemCount);

    if (itemCount === 0) {
      console.warn('[WEBHOOK completeCheckoutFromPaymentLink] No cart items – order will have no items. CheckoutId:', checkoutId);
    }

    checkout.status = CheckoutStatus.Completed;
    checkout.isCompleted = true;
    checkout.completedAt = new Date();
    checkout.paymentUrl = undefined; // clear any stored URL; sensitive and no longer needed
    await this.checkoutRepository.save(checkout);

    console.log('[WEBHOOK completeCheckoutFromPaymentLink] Creating order from checkout...');
    await this.createOrderFromCheckout(checkout);
    // Expire WooShPay session so payment URL cannot be reused
    if (checkout.wooshpaySessionId) {
      try {
        await this.expireWooShPaySession(checkout.wooshpaySessionId);
      } catch (e) {
        console.warn('[WEBHOOK completeCheckoutFromPaymentLink] Expire session failed (may already be expired):', (e as Error)?.message);
      }
    }
    console.log('[WEBHOOK completeCheckoutFromPaymentLink] ✅ Done. Order and register events created for checkoutId:', checkoutId);
  }

  /**
   * Handle checkout session canceled or expired (user refused payment, clicked cancel, or session expired).
   * Marks checkout as Cancelled so it is not left stuck in Pending.
   */
  private async handleCheckoutSessionCanceledOrExpired(session: any): Promise<void> {
    const checkoutId = session?.metadata?.checkout_id ?? session?.checkout_id;

    if (!checkoutId) {
      console.log('[WEBHOOK handleCheckoutSessionCanceledOrExpired] No checkout_id in session metadata');
      return;
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { checkoutId },
    });

    if (!checkout) {
      console.error('[WEBHOOK handleCheckoutSessionCanceledOrExpired] Checkout not found:', checkoutId);
      return;
    }

    if (checkout.status === CheckoutStatus.Completed) {
      console.log('[WEBHOOK handleCheckoutSessionCanceledOrExpired] Checkout already completed, skipping:', checkoutId);
      return;
    }

    checkout.status = CheckoutStatus.Cancelled;
    checkout.paymentUrl = undefined; // clear sensitive URL; expire session immediately
    checkout.paymentNotes = `Payment refused or cancelled. Session status: ${session?.status || 'unknown'}`;
    if (checkout.wooshpaySessionId) {
      try {
        await this.expireWooShPaySession(checkout.wooshpaySessionId);
      } catch (e) {
        console.warn('[WEBHOOK handleCheckoutSessionCanceledOrExpired] Expire session failed (may already be expired):', (e as Error)?.message);
      }
    }
    await this.checkoutRepository.save(checkout);

    console.log('[WEBHOOK handleCheckoutSessionCanceledOrExpired] Checkout marked as cancelled:', checkoutId);
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
   * Handle refund updated (webhook from WooShPay when refund status changes)
   */
  private async handleRefundUpdated(refund: any): Promise<void> {
    const refundId = refund.id ?? refund.refund_id;

    if (refundId) {
      const existing = await this.refundRepository.findOne({
        where: { wooshpayRefundId: refundId },
      });
      if (existing) {
        existing.status = refund.status ?? existing.status;
        await this.refundRepository.save(existing);
        console.log(`💰 Refund status updated: ${refundId} → ${refund.status}`);
      }
    }

    const checkoutId = refund.metadata?.checkout_id;
    if (checkoutId) {
      const checkout = await this.checkoutRepository.findOne({
        where: { checkoutId },
      });
      if (checkout) {
        checkout.paymentNotes = `Refund updated: ${refund.status}`;
        await this.checkoutRepository.save(checkout);
      }
    }
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
