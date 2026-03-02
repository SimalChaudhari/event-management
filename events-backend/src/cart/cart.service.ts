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
import { Withdrawal } from './withdrawal.entity';
import { CheckoutService } from '../checkout/checkout.service';

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
        @InjectRepository(Withdrawal)
        private withdrawalRepository: Repository<Withdrawal>,
        @Inject(forwardRef(() => EventService))
        private eventService: EventService, // Inject EventService
        private couponService: CouponService, // Inject CouponService
        @Inject(forwardRef(() => CheckoutService))
        private checkoutService: CheckoutService,
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
                const basePrice = this.eventService.getEffectivePrice(event);
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
     * Same status derivation as my-events: real (re_*) + synthetic (withdrawal_failed_*) refunds → withdrawn | refund_refused | pending.
     */
    private deriveRefundStatusFromRefunds(refunds: { status?: string | null; wooshpayRefundId?: string | null }[]): 'withdrawn' | 'refund_refused' | 'pending' {
        const realRefunds = refunds.filter((r) => r.wooshpayRefundId?.startsWith('re_'));
        const syntheticRefunds = refunds.filter((r) => r.wooshpayRefundId?.startsWith('withdrawal_failed_'));
        const hasSucceeded = realRefunds.some((r) => (r.status || '').toLowerCase() === 'succeeded');
        const hasFailed =
            realRefunds.some((r) => {
                const x = (r.status || '').toLowerCase();
                return x === 'failed' || x === 'canceled' || x === 'refused';
            }) ||
            syntheticRefunds.some((r) => {
                const x = (r.status || '').toLowerCase();
                return x === 'failed' || x === 'canceled' || x === 'refused';
            });
        if (hasSucceeded) return 'withdrawn';
        if (hasFailed) return 'refund_refused';
        return 'pending';
    }

    /**
     * My events: full history – all events user ever participated in (including withdrawn).
     * Includes events from RegisterEvent and events from Withdrawal (approved leave) so history is complete.
     */
    async getMyParticipatedEvents(userId: string): Promise<{ status: string; eventId: string; eventName: string; canRequestWithdrawal: boolean }[]> {
        const result: { status: string; eventId: string; eventName: string; canRequestWithdrawal: boolean }[] = [];
        const eventIdsInResult = new Set<string>();

        const registrations = await this.registerEventRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            select: ['eventId', 'status', 'orderId'],
        });

        const orderIds = registrations.length > 0 ? [...new Set(registrations.map((r) => r.orderId).filter(Boolean))] as string[] : [];
        const orderRefundStatus = new Map<string, 'pending' | 'withdrawn'>();
        for (const oid of orderIds) {
            try {
                await this.checkoutService.getRefundStatusForOrder(oid, userId);
            } catch (_) {}
        }
        let refunds: { orderId: string; status: string; wooshpayRefundId?: string }[] = [];
        if (orderIds.length > 0) {
            refunds = await this.refundRepository.find({
                where: { orderId: In(orderIds) },
                select: ['orderId', 'status', 'wooshpayRefundId'],
            });
            for (const orderId of orderIds) {
                const orderRefunds = refunds.filter((r) => r.orderId === orderId);
                const realRefunds = orderRefunds.filter((r) => r.wooshpayRefundId?.startsWith('re_'));
                if (realRefunds.length === 0) continue;
                const hasSucceeded = realRefunds.some((r) => (r.status || '').toLowerCase() === 'succeeded');
                orderRefundStatus.set(orderId, hasSucceeded ? 'withdrawn' : 'pending');
            }
        }

        const completedRegs = registrations.filter((r) => {
            if (r.status === Status.Withdraw) return false;
            if (r.orderId && orderRefundStatus.has(r.orderId)) return false;
            return true;
        });
        const withdrawalBlock = new Set<string>();
        const withdrawalDisplayStatus = new Map<string, string>(); // key: orderId-eventId, value: pending | rejected | withdrawn | refund_refused
        if (orderIds.length > 0) {
            const withdrawals = await this.withdrawalRepository.find({
                where: { order: { id: In(orderIds) } },
                relations: ['order', 'event'],
            });
            for (const w of withdrawals) {
                const key = `${w.order?.id}-${w.event?.id}`;
                if (!key || !w.order?.id) continue;
                const s = (w.status || '').toLowerCase();
                if (s === 'pending' || s === 'approved') withdrawalBlock.add(key);
                if (s === 'pending') {
                    withdrawalDisplayStatus.set(key, 'pending');
                } else if (s === 'rejected') {
                    withdrawalDisplayStatus.set(key, 'rejected');
                } else if (s === 'approved') {
                    const orderRefunds = refunds.filter((r) => r.orderId === w.order?.id);
                    const status = this.deriveRefundStatusFromRefunds(orderRefunds);
                    withdrawalDisplayStatus.set(key, status);
                }
            }
        }

        for (const reg of registrations) {
            const eventId = reg.eventId!;
            eventIdsInResult.add(eventId);
            const key = reg.orderId ? `${reg.orderId}-${eventId}` : '';
            const withdrawalStatus = key ? withdrawalDisplayStatus.get(key) : null;
            let status: string;
            if (withdrawalStatus) {
                status = withdrawalStatus;
            } else if (reg.status === Status.Withdraw) {
                status = 'withdrawn';
            } else if (reg.orderId && orderRefundStatus.has(reg.orderId)) {
                status = orderRefundStatus.get(reg.orderId)!;
            } else {
                status = 'completed';
            }
            const canRequestWithdrawal =
                status === 'withdrawn' || status === 'pending' || status === 'rejected' || status === 'refund_refused'
                    ? false
                    : !(reg.orderId && withdrawalBlock.has(`${reg.orderId}-${eventId}`));
            let eventName = 'Event';
            let isEventFuture = false;
            let withdrawalEnabled = true;
            try {
                const event = await this.eventService.getEventById(eventId);
                eventName = event.name ?? eventName;
                isEventFuture = event?.endDate
                    ? new Date() < new Date(new Date(event.endDate).setHours(23, 59, 59, 999))
                    : false;
                withdrawalEnabled = (event as any).withdrawalEnabled !== false;
            } catch (_) {}
            result.push({
                status,
                eventId,
                eventName,
                canRequestWithdrawal: canRequestWithdrawal && isEventFuture && withdrawalEnabled,
            });
        }

        // Include events user left (withdrawal approved – RegisterEvent was deleted) so history is complete
        const userWithdrawals = await this.withdrawalRepository.find({
            where: { order: { user: { id: userId } } },
            order: { request_at: 'DESC' },
            relations: ['order', 'event'],
        });
        const leftOrderIds = userWithdrawals.map((w) => w.order?.id).filter(Boolean) as string[];
        for (const oid of leftOrderIds) {
            try {
                await this.checkoutService.getRefundStatusForOrder(oid, userId);
            } catch (_) {}
        }
        const leftRefundsByOrder =
            leftOrderIds.length > 0
                ? await this.refundRepository.find({
                      where: { orderId: In(leftOrderIds) },
                      select: ['orderId', 'status', 'wooshpayRefundId'],
                  })
                : [];
        for (const w of userWithdrawals) {
            const eventId = w.event?.id;
            const orderId = w.order?.id;
            if (!eventId || eventIdsInResult.has(eventId)) continue;
            eventIdsInResult.add(eventId);
            const eventName = w.title?.trim() || (w.event as any)?.name || 'Event';
            let status = 'pending';
            if (orderId) {
                const orderRefunds = leftRefundsByOrder.filter((r) => r.orderId === orderId);
                status = this.deriveRefundStatusFromRefunds(orderRefunds);
            }
            result.push({
                status,
                eventId,
                eventName,
                canRequestWithdrawal: false,
            });
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

    /** Get orderId from registration or from withdrawal (so invoice can show for withdrawn/left events too). */
    async getOrderIdByUserAndEventOrWithdrawal(userId: string, eventId: string): Promise<string | null> {
        const fromReg = await this.getOrderIdByUserAndEvent(userId, eventId);
        if (fromReg) return fromReg;
        const row = await this.withdrawalRepository
            .createQueryBuilder('w')
            .innerJoin('w.order', 'o')
            .where('o.userId = :userId', { userId })
            .andWhere('w.eventId = :eventId', { eventId })
            .select('o.id', 'orderId')
            .getRawOne<{ orderId: string }>();
        return row?.orderId ?? null;
    }

    /** Get status for invoice. Withdrawal-first: pending until refund success; maintain approved/rejected. */
    async getOrderStatusForInvoice(
        userId: string,
        orderId: string,
        eventId: string,
    ): Promise<'completed' | 'pending' | 'withdrawn' | 'rejected' | 'refund_refused'> {
        try {
            await this.checkoutService.getRefundStatusForOrder(orderId, userId);
        } catch (_) {
            // Order not found or no access – keep existing DB state
        }
        const withdrawal = await this.withdrawalRepository
            .createQueryBuilder('w')
            .innerJoin('w.order', 'o')
            .innerJoin('w.event', 'e')
            .where('o.id = :orderId', { orderId })
            .andWhere('e.id = :eventId', { eventId })
            .select(['w.status'])
            .getOne();
        if (withdrawal) {
            const s = (withdrawal.status || '').toLowerCase();
            if (s === 'pending') return 'pending';
            if (s === 'rejected') return 'rejected';
            if (s === 'approved') {
                const refunds = await this.refundRepository.find({
                    where: { orderId },
                    select: ['status', 'wooshpayRefundId'],
                });
                return this.deriveRefundStatusFromRefunds(refunds);
            }
        }
        const reg = await this.registerEventRepository.findOne({
            where: { userId, eventId },
            select: ['status'],
        });
        if (!reg) return 'withdrawn';
        if (reg.status === Status.Withdraw) return 'withdrawn';
        const refunds = await this.refundRepository.find({
            where: { orderId },
            select: ['status'],
        });
        if (refunds.length === 0) return 'completed';
        const hasSucceeded = refunds.some((r) => (r.status || '').toLowerCase() === 'succeeded');
        return hasSucceeded ? 'withdrawn' : 'pending';
    }

    /**
     * Withdrawal info for invoice: status/color rules.
     * - order withdrawn → canWithdraw false, status withdrawn
     * - order pending → canWithdraw false, color yellow
     * - withdrawal pending → canWithdraw false, color yellow
     * - approved + refund failed/canceled (webhook) → withdrawalStatus refund_refused, color red, canWithdraw if event future
     * - approved + refund pending/succeeded → withdrawalStatus admin_approved, color white
     * - rejected → canWithdraw if event future, color red
     * - no withdrawal + event future → canWithdraw true, color green
     */
    async getWithdrawalInfoForInvoice(
        orderId: string,
        eventId: string,
        orderStatus: 'completed' | 'pending' | 'withdrawn' | 'rejected' | 'refund_refused',
    ): Promise<{
        canWithdraw: boolean;
        withdrawalStatusColor: string;
        withdrawalStatusMessage?: string;
    }> {
        if (orderStatus === 'withdrawn') {
            return {
                canWithdraw: false,
                withdrawalStatusColor: '#000000',
                withdrawalStatusMessage: 'Withdrawn.',
            };
        }
        if (orderStatus === 'pending') {
            return {
                canWithdraw: false,
                withdrawalStatusColor: '#FFA500',
                withdrawalStatusMessage: 'Pending review.',
            };
        }
        if (orderStatus === 'rejected') {
            return {
                canWithdraw: false,
                withdrawalStatusColor: '#DC3545',
                withdrawalStatusMessage: 'Withdrawal rejected.',
            };
        }
        if (orderStatus === 'refund_refused') {
            return {
                canWithdraw: false,
                withdrawalStatusColor: '#DC3545',
                withdrawalStatusMessage: 'Refund refused.',
            };
        }

        let event: { endDate?: Date } | null = null;
        try {
            event = await this.eventService.getEventById(eventId);
        } catch {
            return {
                canWithdraw: false,
                withdrawalStatusColor: '#000000',
            };
        }
        const isEventFuture = event?.endDate
            ? new Date() < new Date(new Date(event.endDate).setHours(23, 59, 59, 999))
            : false;

        const withdrawal = await this.withdrawalRepository
            .createQueryBuilder('w')
            .where('w.orderId = :orderId', { orderId })
            .andWhere('w.eventId = :eventId', { eventId })
            .select(['w.status', 'w.request_at'])
            .getOne();

        const status = withdrawal?.status ?? null;
        const statusLower = status ? String(status).toLowerCase() : null;
        let withdrawalStatusColor = '#000000';
        let canWithdraw = false;
        /** Display status for user: pending | admin_approved | refund_refused | rejected */
        let displayStatus: string | null = status;

        if (statusLower === 'pending') {
            withdrawalStatusColor = '#FFA500';
            canWithdraw = false;
        } else if (statusLower === 'approved') {
            const refunds = await this.refundRepository.find({
                where: { orderId },
                select: ['status', 'wooshpayRefundId'],
            });
            const realRefunds = refunds.filter((r) => r.wooshpayRefundId?.startsWith('re_'));
            const syntheticRefunds = refunds.filter((r) => r.wooshpayRefundId?.startsWith('withdrawal_failed_'));
            const hasRefundRefused =
                realRefunds.some((r) => {
                    const s = (r.status || '').toLowerCase();
                    return s === 'failed' || s === 'canceled' || s === 'refused';
                }) ||
                syntheticRefunds.some((r) => {
                    const s = (r.status || '').toLowerCase();
                    return s === 'failed' || s === 'canceled' || s === 'refused';
                });
            if (hasRefundRefused) {
                displayStatus = 'refund_refused';
                withdrawalStatusColor = '#DC3545';
                canWithdraw = isEventFuture; // allow user to request again if event still future
            } else {
                displayStatus = 'admin_approved';
                withdrawalStatusColor = '#000000';
                canWithdraw = false;
            }
        } else if (statusLower === 'rejected') {
            displayStatus = 'rejected';
            withdrawalStatusColor = '#DC3545';
            canWithdraw = isEventFuture;
        } else {
            canWithdraw = isEventFuture;
            withdrawalStatusColor = isEventFuture ? '#28A745' : '#FFFFFF'; // green only when future; white when past (no withdraw)
        }

        const withdrawalStatusMessage =
            displayStatus === 'admin_approved'
                ? 'Admin approved your request. Refund success.'
                : displayStatus === 'refund_refused'
                    ? 'Refund refused.'
                    : displayStatus === 'rejected'
                        ? 'Withdrawal rejected.'
                        : displayStatus === 'pending'
                            ? 'Pending review.'
                            : undefined;

        const withdrawalEnabled = (event as any).withdrawalEnabled !== false;
        return {
            canWithdraw: canWithdraw && withdrawalEnabled,
            withdrawalStatusColor,
            withdrawalStatusMessage,
        };
    }
}