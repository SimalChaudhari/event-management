// src/services/cart.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart, UserCartPreference } from './cart.entity';
import { CartDto } from './cart.dto';
import { EventService } from 'event/event.service';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(UserCartPreference)
        private userCartPreferenceRepository: Repository<UserCartPreference>,
        private eventService: EventService, // Inject EventService
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
                const { userId, eventId, ...cartDetails } = cart;
    
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

        // Check if user has applied coupon
        const userPreference = await this.userCartPreferenceRepository.findOne({
            where: { userId }
        });

        let discount = 0;
        let couponApplied = null;
        
        if (userPreference && userPreference.appliedCoupon) {
            discount = Number(userPreference.couponDiscount || 0);
            
            // Get coupon details
            const couponDiscounts: Record<string, { type: string; value: number }> = {
                'SAVE10': { type: 'percentage', value: 10 },
                'SAVE20': { type: 'percentage', value: 20 },
                'SAVE50': { type: 'percentage', value: 50 },
                'FLAT100': { type: 'flat', value: 100 }
            };

            const couponInfo = couponDiscounts[userPreference.appliedCoupon];
            if (couponInfo) {
                couponApplied = {
                    code: userPreference.appliedCoupon,
                    discount: discount,
                    type: couponInfo.type
                };
            }
        }

        const finalAmount = Math.max(0, totalAmount - discount);

        return {
            items,
            totalCount: items.length,
            totalAmount,
            discount,
            finalAmount,
            currency: 'USD',
            couponApplied
        };
    }

    // Step 2: Apply coupon and save to database
    async applyCoupon(userId: string, cartIds: string[], couponCode: string) {
        // Get cart items total
        const cartData = await this.getCartItemsByIds(userId, cartIds);
        
        // Validate coupon
        const couponDiscounts: Record<string, { type: string; value: number }> = {
            'SAVE10': { type: 'percentage', value: 10 },
            'SAVE20': { type: 'percentage', value: 20 },
            'SAVE50': { type: 'percentage', value: 50 },
            'FLAT100': { type: 'flat', value: 100 }
        };

        if (!couponDiscounts[couponCode]) {
            throw new Error('Invalid coupon code');
        }

        const coupon = couponDiscounts[couponCode];
        let discount = 0;

        if (coupon.type === 'flat') {
            discount = coupon.value;
        } else {
            discount = (cartData.totalAmount * coupon.value) / 100;
        }

        const finalAmount = Math.max(0, cartData.totalAmount - discount);

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
                code: couponCode,
                discount: discount,
                type: coupon.type
            }
        };
    }


    
}