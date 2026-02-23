// src/services/cart.service.ts
import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart, UserCartPreference } from './cart.entity';
import { CartDto } from './cart.dto';
import { EventService } from 'event/event.service';
import { CouponService } from 'coupon/coupon.service';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { Status } from 'registerEvent/registerEvent.dto';
import { Refund } from 'checkout/refund.entity';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(UserCartPreference)
        private userCartPreferenceRepository: Repository<UserCartPreference>,
        @InjectRepository(RegisterEvent)
        private registerEventRepository: Repository<RegisterEvent>,
        @InjectRepository(Refund)
        private refundRepository: Repository<Refund>,
        @Inject(forwardRef(() => EventService))
        private eventService: EventService, // Inject EventService
        private couponService: CouponService, // Inject CouponService
    ) {}

    async cartExists(userId: string, eventId: string): Promise<boolean> {
        const cart = await this.cartRepository.findOne({ where: { userId, eventId } });
        return !!cart; // Return true if cart exists, false otherwise
    }

    /** Check if user is already registered for an event (prevents duplicate registration) */
    async isUserAlreadyRegistered(userId: string, eventId: string): Promise<boolean> {
        const existing = await this.registerEventRepository.findOne({
            where: { userId, eventId },
        });
        return !!existing;
    }

    /** Get event IDs the user is already registered for (used at checkout) */
    async getAlreadyRegisteredEventIds(userId: string, eventIds: string[]): Promise<string[]> {
        if (!eventIds?.length) return [];
        const registrations = await this.registerEventRepository.find({
            where: { userId, eventId: In(eventIds) },
            select: ['eventId'],
        });
        return [...new Set(registrations.map((r) => r.eventId!).filter(Boolean))];
    }

    async addToCart(cartDto: CartDto) {
        const { userId, eventId } = cartDto;
        if (!userId || !eventId) {
            throw new BadRequestException('userId and eventId are required');
        }
        const alreadyRegistered = await this.isUserAlreadyRegistered(userId, eventId);
        if (alreadyRegistered) {
            throw new BadRequestException('You are already registered for this event.');
        }
        const cartEntry = this.cartRepository.create(cartDto);
        return await this.cartRepository.save(cartEntry);
    }

    async getUserCarts(userId: string) {
        const carts = await this.cartRepository.find({ where: { userId } });
    
        const enrichedCarts = await Promise.all(
            carts.map(async (cart) => {
                const event = await this.eventService.getEventById(cart.eventId);
                const { userId, ...cartDetails } = cart; // Keep eventId in cartDetails
    
                return {
                    ...cartDetails,
                    event,
                };
            })
        );
    
        return enrichedCarts;
    }
    

    async getCartById(id: string, userId: string) {
        const cart = await this.cartRepository.findOne({ where: { id, userId } }); // Restrict by userId
        if (!cart) throw new NotFoundException('Cart not found');
    
        const event = await this.eventService.getEventById(cart.eventId);
        const { userId: _, eventId, ...cartDetails } = cart;
    
        return {
            ...cartDetails,
            event,
        };
    }
    

    async deleteCart(id: string, userId: string) {
        const cart = await this.cartRepository.findOne({ where: { id, userId } }); // Only find if user is the owner
        if (!cart) throw new NotFoundException('Cart not found or you are not authorized to delete this item');
    
        await this.cartRepository.remove(cart);
        return {
            success: true,
            message: 'Cart item deleted successfully',
        };
    }


    // Step 1: Get cart items WITH saved coupon (if any)
    async getCartItemsByIds(userId: string, cartIds: string[]) {
        if (!cartIds || cartIds.length === 0) {
            return {
                items: [],
                totalCount: 0,
                totalAmount: 0,
                discount: 0,
                finalAmount: 0,
                currency: 'USD',
                couponApplied: null
            };
        }

        // Find cart items by IDs
        const cartItems = await this.cartRepository
            .createQueryBuilder('cart')
            .where('cart.userId = :userId', { userId })
            .andWhere('cart.id IN (:...cartIds)', { cartIds })
            .getMany();

        let totalAmount = 0;
        const items = await Promise.all(
            cartItems.map(async (cart) => {
                const event = await this.eventService.getEventById(cart.eventId);
                const basePrice = Number(event.price || 0);
                const gstRate = Number(event.gstRate) || 18;
                const itemTotal = Math.round(basePrice * (1 + gstRate / 100) * 100) / 100;
                totalAmount += itemTotal;

                return {
                    cartId: cart.id,
                    eventId: cart.eventId, // Add eventId to the response
                    eventName: event.name,
                    price: basePrice,
                    gstRate,
                    image: event.images && event.images.length > 0 
                        ? (event.images[0].startsWith('http') 
                            ? event.images[0] 
                            : `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/event/${event.images[0]}`)
                        : null,
                    startDate: event.startDate
                };
            })
        );

        // Check if user has applied coupon to these specific cart items
        const userPreference = await this.userCartPreferenceRepository.findOne({
            where: { userId }
        });

        let discount = 0;
        let couponApplied = null;
        
        // Only apply coupon if it was specifically applied to these cart items
        // For now, we'll not apply any coupon unless explicitly requested
        // This prevents automatic coupon application to new cart items

        const finalAmount = Math.max(0, totalAmount - discount);

        return {
            items,
            totalCount: items.length,
            totalAmount,
            discount,
            finalAmount,
            currency: 'USD',
            couponApplied: null
        };
    }

    // Clear coupon preferences for user
    async clearCouponPreferences(userId: string) {
        const userPreference = await this.userCartPreferenceRepository.findOne({
            where: { userId }
        });

        if (userPreference) {
            userPreference.appliedCoupon = undefined;
            userPreference.couponDiscount = 0;
            await this.userCartPreferenceRepository.save(userPreference);
        }
    }

    // Step 2: Apply coupon and save to database
    async applyCoupon(userId: string, cartIds: string[], couponCode: string) {
        // Get cart items total
        const cartData = await this.getCartItemsByIds(userId, cartIds);
        
        // Use CouponService to validate and calculate discount
        const couponResult = await this.couponService.validateAndApplyCoupon(
            couponCode, 
            userId, 
            cartData.totalAmount
        );

        const { coupon, discount, finalAmount } = couponResult;

        // Save/Update user cart preferences
        let userPreference = await this.userCartPreferenceRepository.findOne({
            where: { userId }
        });

        if (!userPreference) {
            userPreference = this.userCartPreferenceRepository.create({
                userId,
                appliedCoupon: couponCode,
                couponDiscount: discount
            });
        } else {
            userPreference.appliedCoupon = couponCode;
            userPreference.couponDiscount = discount;
        }

        await this.userCartPreferenceRepository.save(userPreference);

        const totalBeforeDiscount = cartData.totalAmount;
        const discountPercentage =
          coupon.discountType === 'percentage'
            ? Number(coupon.discountValue)
            : totalBeforeDiscount > 0
              ? Math.round((discount / totalBeforeDiscount) * 10000) / 100
              : 0;

        return {
            ...cartData,
            discount,
            finalAmount,
            discountPercentage,
            couponApplied: {
                name: couponCode,
                discount,
                discountPercentage,
                type: coupon.discountType,
                couponId: coupon.id,
                actualValue: coupon.actualValue,
                discountValue: coupon.discountValue
            }
        };
    }

    // Record coupon usage when order is completed
    async recordCouponUsage(userId: string, orderId: string) {
        const userPreference = await this.userCartPreferenceRepository.findOne({
            where: { userId }
        });

        if (userPreference && userPreference.appliedCoupon) {
            // Get coupon by name to get couponId
            const coupon = await this.couponService.getCouponByName(userPreference.appliedCoupon);
            
            if (coupon) {
                await this.couponService.recordCouponUsage(userId, coupon.id, orderId);
            }
        }
    }

    /**
     * My events: list events the user has participated in. Returns only status, eventId, eventName.
     * status: completed | pending | withdrawn
     * Uses refund status (same as GET /api/checkout/refund/status/:orderId): if any refund for that order has status 'succeeded' → withdrawn (complete refund); else if any refund exists → pending.
     */
    async getMyParticipatedEvents(userId: string): Promise<{ status: string; eventId: string; eventName: string }[]> {
        const registrations = await this.registerEventRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            select: ['eventId', 'status', 'orderId'],
        });
        if (registrations.length === 0) return [];

        const orderIds = [...new Set(registrations.map((r) => r.orderId).filter(Boolean))] as string[];
        const orderRefundStatus = new Map<string, 'pending' | 'withdrawn'>();
        if (orderIds.length > 0) {
            const refunds = await this.refundRepository.find({
                where: { orderId: In(orderIds) },
                select: ['orderId', 'status'],
            });
            for (const orderId of orderIds) {
                const orderRefunds = refunds.filter((r) => r.orderId === orderId);
                if (orderRefunds.length === 0) continue;
                const hasSucceeded = orderRefunds.some((r) => (r.status || '').toLowerCase() === 'succeeded');
                orderRefundStatus.set(orderId, hasSucceeded ? 'withdrawn' : 'pending');
            }
        }

        const result: { status: string; eventId: string; eventName: string }[] = [];
        for (const reg of registrations) {
            const eventId = reg.eventId!;
            let status: string;
            if (reg.status === Status.Withdraw) {
                status = 'withdrawn';
            } else if (reg.orderId && orderRefundStatus.has(reg.orderId)) {
                status = orderRefundStatus.get(reg.orderId)!;
            } else {
                status = 'completed';
            }
            let eventName = 'Event';
            try {
                const event = await this.eventService.getEventById(eventId);
                eventName = event.name ?? eventName;
            } catch (_) {}
            result.push({ status, eventId, eventName });
        }
        return result;
    }

    /** Get orderId for user's registration for an event (for invoice by eventId). */
    async getOrderIdByUserAndEvent(userId: string, eventId: string): Promise<string | null> {
        const reg = await this.registerEventRepository.findOne({
            where: { userId, eventId },
            select: ['orderId', 'status'],
        });
        return reg?.orderId ?? null;
    }

    /** Get status for invoice: completed | pending | withdrawn (same logic as my-events). */
    async getOrderStatusForInvoice(userId: string, orderId: string, eventId: string): Promise<'completed' | 'pending' | 'withdrawn'> {
        const reg = await this.registerEventRepository.findOne({
            where: { userId, eventId },
            select: ['status'],
        });
        if (reg?.status === Status.Withdraw) return 'withdrawn';
        const refunds = await this.refundRepository.find({
            where: { orderId },
            select: ['status'],
        });
        if (refunds.length === 0) return 'completed';
        const hasSucceeded = refunds.some((r) => (r.status || '').toLowerCase() === 'succeeded');
        return hasSucceeded ? 'withdrawn' : 'pending';
    }

    
}