// src/services/cart.service.ts
import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart, UserCartPreference } from './cart.entity';
import { CartDto } from './cart.dto';
import { EventService } from 'event/event.service';
import { CouponService } from 'coupon/coupon.service';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(UserCartPreference)
        private userCartPreferenceRepository: Repository<UserCartPreference>,
        @Inject(forwardRef(() => EventService))
        private eventService: EventService, // Inject EventService
        private couponService: CouponService, // Inject CouponService
    ) {}

    async cartExists(userId: string, eventId: string): Promise<boolean> {
        const cart = await this.cartRepository.findOne({ where: { userId, eventId } });
        return !!cart; // Return true if cart exists, false otherwise
    }

    async addToCart(cartDto: CartDto) {
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
                totalAmount += Number(event.price || 0);
                
                return {
                    cartId: cart.id,
                    eventId: cart.eventId, // Add eventId to the response
                    eventName: event.name,
                    price: Number(event.price || 0),
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

        return {
            ...cartData,
            discount,
            finalAmount,
            couponApplied: {
                name: couponCode, // couponCode variable contains the voucher name
                discount: discount,
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

    
}