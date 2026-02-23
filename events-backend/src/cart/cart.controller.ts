// src/controllers/cart.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, Query, Res, UseGuards, Request, forwardRef, Inject } from '@nestjs/common';
import { Response } from 'express';
import { CartService } from './cart.service';
import { CartDto } from './cart.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { EventService } from 'event/event.service';
import { CheckoutService } from 'checkout/checkout.service';
import { CreateCheckoutDto } from 'checkout/checkout.dto';


@Controller('api/carts')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(
        private readonly cartService: CartService,
        @Inject(forwardRef(() => EventService))
        private readonly eventService: EventService, // Inject EventService
        private readonly checkoutService: CheckoutService, // Inject CheckoutService
    ) {}
    
    @Post('create-checkout')
    async createCheckout(
        @Body() body: { selectedCartIds: string[]; couponId?: string; billingSameAsShipping?: boolean },
        @Request() req: any,
        @Res() response: Response
    ) {
        return this.runCreateCheckout(req, response, body, { requireCouponId: false });
    }

    /** Apply rebate/redeem code (coupon required). Same logic as create-checkout; couponId is required. */
    @Post('apply-coupon')
    async applyCouponRoute(
        @Body() body: { selectedCartIds: string[]; couponId: string; billingSameAsShipping?: boolean },
        @Request() req: any,
        @Res() response: Response
    ) {
        if (!body.couponId || String(body.couponId).trim() === '') {
            return response.status(400).json({
                success: false,
                message: 'couponId (rebate/redeem code) is required for apply-coupon.',
                error: 'couponId is required',
            });
        }
        return this.runCreateCheckout(req, response, body, { requireCouponId: true });
    }

    /** Shared logic for create-checkout and apply-coupon. No duplicate code. */
    private async runCreateCheckout(
        req: any,
        response: Response,
        body: { selectedCartIds: string[]; couponId?: string; billingSameAsShipping?: boolean },
        options: { requireCouponId: boolean },
    ) {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            if (role !== 'user') {
                return response.status(403).json({
                    success: false,
                    message: 'Access denied. Only users can create checkout sessions.',
                });
            }

            if (!body.selectedCartIds || body.selectedCartIds.length === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'Please select at least one item for checkout.',
                });
            }

            let result = await this.cartService.getCartItemsByIds(userId, body.selectedCartIds);
            if (result.totalCount === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'No valid cart items found for checkout.',
                });
            }

            const eventIds = (result.items || []).map((item: any) => item.eventId).filter(Boolean);
            const alreadyRegisteredIds = await this.cartService.getAlreadyRegisteredEventIds(userId, eventIds);
            if (alreadyRegisteredIds.length > 0) {
                const names = (result.items || [])
                    .filter((item: any) => alreadyRegisteredIds.includes(item.eventId))
                    .map((item: any) => item.eventName || item.eventId);
                return response.status(400).json({
                    success: false,
                    message: 'You are already registered for one or more events in your cart. Please remove them before checkout.',
                    alreadyRegisteredEvents: names,
                });
            }

            const applyCoupon = options.requireCouponId || (body.couponId && body.couponId.trim() !== '');
            if (applyCoupon) {
                const couponId = body.couponId?.trim();
                if (!couponId) {
                    return response.status(400).json({
                        success: false,
                        message: 'couponId is required.',
                        error: 'couponId is required',
                    });
                }
                try {
                    const couponService = this.cartService['couponService'];
                    const coupon = await couponService.getCouponById(couponId);
                    const couponResult = await this.cartService.applyCoupon(userId, body.selectedCartIds, coupon.name);
                    result = {
                        ...result,
                        discount: couponResult.discount,
                        finalAmount: couponResult.finalAmount,
                        discountPercentage: couponResult.discountPercentage,
                        couponApplied: couponResult.couponApplied as any
                    } as any;
                } catch (error: any) {
                    return response.status(400).json({
                        success: false,
                        message: error.message || 'Invalid coupon ID',
                        error: error.message
                    });
                }
            }

            const checkoutItems = result.items.map(item => ({
                eventId: item.eventId,
                price: item.price,
                eventName: item.eventName
            }));
            const cartIdsMinimal = result.items.map(item => ({ cartId: item.cartId, eventId: item.eventId }));

            const totalAmount = result.totalAmount;
            const discount = result.discount || 0;
            const finalAmount = totalAmount - discount;

            let couponCodeForCheckout: string | undefined;
            if (applyCoupon && body.couponId?.trim()) {
                const couponService = this.cartService['couponService'];
                const coupon = await couponService.getCouponById(body.couponId.trim());
                couponCodeForCheckout = coupon.name;
            }

            const checkoutDto: CreateCheckoutDto = {
                cartItems: checkoutItems,
                totalAmount: finalAmount,
                discount,
                couponCode: couponCodeForCheckout,
                useSelectedItemsOnly: true,
                billingSameAsShipping: body.billingSameAsShipping,
            };

            const checkout = await this.checkoutService.createCheckout(userId, checkoutDto);
            await this.checkoutService.updateCheckoutCartItems(checkout.checkoutId, cartIdsMinimal);

            try {
                await this.checkoutService.getOrCreateWooShPayCustomer(userId);
            } catch (err: any) {
                console.warn('WooShPay customer create/skip on create-checkout:', err?.message);
            }

            const successMessage = applyCoupon
                ? 'Checkout session created successfully with coupon applied'
                : 'Checkout session created successfully';

            const responseData: any = {
                checkoutId: checkout.checkoutId,
                status: checkout.status,
                totalAmount: applyCoupon ? finalAmount : totalAmount,
                itemCount: cartIdsMinimal.length,
                user: checkout.user,
                createdAt: checkout.createdAt,
                paymentMethods: {
                    inAppPayment: true,
                    savedPaymentMethods: true,
                    cardValidation: true
                }
            };

            if (applyCoupon) {
                responseData.couponCode = checkout.couponCode;
                responseData.coupon = checkout.coupon;
                responseData.couponApplied = result.couponApplied || null;
                responseData.discount = discount;
                const discountPct = totalAmount > 0 ? Math.round((discount / totalAmount) * 10000) / 100 : 0;
                responseData.discountPercentage = discountPct;
                responseData.originalTotal = totalAmount;
            }

            const gb = checkout.gstBreakdown;
            const eventPrice = gb?.finalSummary?.totalBaseAmount ?? gb?.summary?.totalBaseAmount ?? Math.round((totalAmount - discount) / (1 + (gb?.gstRate ?? 18) / 100) * 100) / 100;
            const tax = gb?.finalSummary?.totalGst ?? gb?.summary?.totalGst ?? Math.round((totalAmount - discount - eventPrice) * 100) / 100;
            responseData.priceBreakdown = {
                eventPrice,
                discount,
                tax,
                total: finalAmount,
                currency: 'SGD',
                gstRate: gb?.gstRate ?? 18
            };

            if (gb?.items?.length) {
                responseData.items = gb.items.map((i: any) => ({
                    id: i.eventId,
                    name: i.eventName,
                    actualPrice: i.baseAmount,
                    gstPrice: i.gstAmount
                }));
            } else {
                responseData.items = [];
            }

            return response.status(201).json({
                success: true,
                message: successMessage,
                data: responseData
            });

        } catch (error: any) {
            console.error('❌ Create checkout failed:', error);
            return response.status(400).json({
                success: false,
                message: error.message || 'Failed to create checkout session',
                error: error.message
            });
        }
    }

    @Post(':eventId')
    async addToCart(@Param('eventId') eventId: string, @Res() response: Response, @Request() req: any) {
        const userId = req.user.id; // Extract user ID from the request
        const role = req.user.role; // Extract user role from the request

        if (role !== 'user') {
            return response.status(403).json({
                success: false,
                message: 'Access denied. Only users can add to cart.',
            });
        }

        if (!eventId) {
            return response.status(400).json({
                success: false,
                message: 'Event ID is required.',
            });
        }

        const eventExists = await this.eventService.getEventById(eventId);
        if (!eventExists) {
            return response.status(404).json({
                success: false,
                message: 'Event not found.',
            });
        }

        const exists = await this.cartService.cartExists(userId, eventId);
        if (exists) {
            return response.status(409).json({
                success: false,
                message: 'Cart entry already exists for this event.',
            });
        }

        // Create the cartDto with userId and eventId from params
        await this.cartService.addToCart({ eventId, userId });
        return response.status(201).json({
            success: true,
            message: 'Item added to cart successfully'
        });
    }

    @Get()
    async getAllCarts(@Res() response: Response, @Request() req: any) {
        const userId = req.user.id; // Get the current logged-in user's ID
        const carts = await this.cartService.getUserCarts(userId);
        return response.status(200).json({
            success: true,
            length: carts.length, // 👈 Add total cart items
            message: 'Carts retrieved successfully',
            data: carts,
        });
    }

    @Get('checkouts')
    async getCompletedCheckouts(@Request() req: any, @Res() response: Response) {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            if (role !== 'user') {
                return response.status(403).json({
                    success: false,
                    message: 'Access denied. Only users can view checkout data.',
                });
            }

            const completedCheckouts = await this.checkoutService.getCompletedCheckouts(userId);
            const data = await Promise.all(
                completedCheckouts.map((c: any) => this.buildEnrichedCheckoutData(c.checkoutId, userId, req))
            );

            return response.status(200).json({
                success: true,
                message: 'Checkouts retrieved successfully',
                count: data.length,
                data,
            });

        } catch (error: any) {
            console.error('❌ Get checkouts failed:', error);
            return response.status(400).json({
                success: false,
                message: error.message || 'Failed to retrieve checkouts',
                error: error.message
            });
        }
    }

    @Get('checkouts/:checkoutId')
    async getCheckoutById(@Param('checkoutId') checkoutId: string, @Request() req: any, @Res() response: Response) {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            if (role !== 'user') {
                return response.status(403).json({
                    success: false,
                    message: 'Access denied. Only users can view checkout data.',
                });
            }

            if (!checkoutId) {
                return response.status(400).json({
                    success: false,
                    message: 'Checkout ID is required.',
                });
            }

            const data = await this.buildEnrichedCheckoutData(checkoutId, userId, req);

            return response.status(200).json({
                success: true,
                message: 'Checkout details retrieved successfully',
                data,
            });

        } catch (error: any) {
            console.error('❌ Get checkout by ID failed:', error);
            return response.status(400).json({
                success: false,
                message: error.message || 'Failed to retrieve checkout details',
                error: error.message
            });
        }
    }

    /** My events: only status, eventId, eventName. GET api/carts/my-events */
    @Get('my-events')
    async getMyParticipatedEvents(@Request() req: any, @Res() response: Response) {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            if (role !== 'user') {
                return response.status(403).json({
                    success: false,
                    message: 'Access denied. Only users can view their participated events.',
                });
            }

            const data = await this.cartService.getMyParticipatedEvents(userId);

            return response.status(200).json({
                success: true,
                message: 'Participated events retrieved successfully',
                count: data.length,
                data,
            });
        } catch (error: any) {
            console.error('❌ Get my participated events failed:', error);
            return response.status(400).json({
                success: false,
                message: error.message || 'Failed to retrieve participated events',
                error: error.message
            });
        }
    }

    @Get(':id')
    async getCartById(@Param('id') id: string, @Request() req: any, @Res() response: Response) {
        const userId = req.user.id;
        const cart = await this.cartService.getCartById(id, userId);
        return response.status(200).json({
            success: true,
            message: 'Cart retrieved successfully',
            data: cart,
        });
    }
    
    @Delete(':id')
    async deleteCart(@Param('id') id: string, @Request() req: any, @Res() response: Response) {
        const userId = req.user.id;
        const result = await this.cartService.deleteCart(id, userId);
        return response.status(200).json(result);
    }

    /** Shared: builds enriched checkout response (items, cartItems, priceBreakdown) - used by GET checkouts and GET checkouts/:id */
    private async buildEnrichedCheckoutData(checkoutId: string, userId: string, req: any): Promise<any> {
            const checkout = await this.checkoutService.getCheckoutById(checkoutId, userId);

            // Fetch full cart item details with event information
            let fullCartItems: any[] = [];
            
            if (checkout.cartItems && checkout.cartItems.length > 0) {
                // Get cartIds from checkoutCartItems relation (mapped from getCheckoutById)
                const checkoutCartItems = checkout.cartItems; // This comes from checkoutCartItems relation via getCheckoutById
                const cartIds = checkoutCartItems.map((item: any) => item.cartId).filter((id: string) => id);
                const eventIds = checkoutCartItems.map((item: any) => item.eventId).filter((id: string) => id);
                
                if (cartIds.length > 0 && eventIds.length > 0) {
                    const cartResult = await this.cartService.getCartItemsByIds(userId, cartIds);
                    
                    console.log('🔍 Cart Result:', {
                        itemsCount: cartResult.items?.length || 0,
                        totalAmount: cartResult.totalAmount
                    });
                    
                    // Fetch event details for each event
                    const eventDetailsPromises = eventIds.map(async (eventId: string) => {
                        try {
                            const event = await this.eventService.getEventById(eventId);
                            return {
                                id: event.id,
                                name: event.name,
                                price: event.price,
                                gstRate: event.gstRate != null ? Number(event.gstRate) : 18,
                                currency: event.currency || 'USD',
                                startDate: event.startDate,
                                endDate: event.endDate,
                                startTime: event.startTime,
                                endTime: event.endTime,
                                location: event.location,
                                venue: event.venue,
                                country: event.country,
                                type: event.type
                            };
                        } catch (error) {
                            console.error(`Error fetching event ${eventId}:`, error);
                            return null;
                        }
                    });
                    
                    const eventDetailsArray = await Promise.all(eventDetailsPromises);
                    const eventDetailsMap = new Map();
                    eventDetailsArray.forEach((event, index) => {
                        if (event) {
                            eventDetailsMap.set(eventIds[index], event);
                        } else {
                            console.warn(`⚠️ Event ${eventIds[index]} not found or failed to load`);
                        }
                    });
                    
                    console.log('🔍 Event Details Map:', {
                        mapSize: eventDetailsMap.size,
                        eventIds: Array.from(eventDetailsMap.keys())
                    });
                    
                    // Combine cart item info with event info
                    // Map in the same order as checkoutCartItems to maintain order
                    fullCartItems = checkoutCartItems.map((checkoutItem: any) => {
                        // Find matching cart item from cartResult
                        const cartItem = cartResult.items.find((ci: any) => ci.cartId === checkoutItem.cartId);
                        // Get event info from map
                        const eventInfo = eventDetailsMap.get(checkoutItem.eventId);
                        
                        // Use event info if available, otherwise fallback to cart item data
                        const finalEventInfo = eventInfo || (cartItem ? {
                            id: checkoutItem.eventId,
                            name: cartItem.eventName,
                            price: cartItem.price,
                            gstRate: cartItem.gstRate != null ? Number(cartItem.gstRate) : 18,
                            currency: 'USD',
                            image: cartItem.image,
                            images: [],
                            startDate: cartItem.startDate,
                            endDate: null,
                            startTime: null,
                            endTime: null,
                            location: null,
                            venue: null,
                            country: null,
                            type: null
                        } : null);
                        
                        if (!finalEventInfo) {
                            console.error(`⚠️ Could not find event info for eventId: ${checkoutItem.eventId}`);
                            return null;
                        }
                        
                        // Ensure cartId is always present
                        const finalCartId = checkoutItem.cartId || cartItem?.cartId;
                        if (!finalCartId) {
                            console.error(`⚠️ CartId missing for checkoutItem:`, checkoutItem);
                            return null;
                        }
                        
                        // Ensure price is a valid number
                        const eventPrice = finalEventInfo.price ? Number(finalEventInfo.price) : (cartItem?.price ? Number(cartItem.price) : 0);
                        
                        return {
                            // Cart item information - always include cartId
                            cartId: finalCartId,
                            
                            // Event information (small/basic info)
                            event: {
                                id: finalEventInfo.id || checkoutItem.eventId,
                                name: finalEventInfo.name || cartItem?.eventName || 'Unknown Event',
                                price: eventPrice, // Always a number
                                gstRate: finalEventInfo.gstRate != null ? Number(finalEventInfo.gstRate) : 18,
                                currency: finalEventInfo.currency || 'USD',
                                startDate: finalEventInfo.startDate || cartItem?.startDate || null,
                                endDate: finalEventInfo.endDate || null,
                                startTime: finalEventInfo.startTime || null,
                                endTime: finalEventInfo.endTime || null,
                                location: finalEventInfo.location || null,
                                venue: finalEventInfo.venue || null,
                                country: finalEventInfo.country || null,
                                type: finalEventInfo.type || null
                            }
                        };
                    }).filter((item: any) => item !== null); // Remove any null items
                }
            }

            // Get coupon details if coupon code exists
            let couponDetails = null;
            if (checkout.couponCode) {
                try {
                    const couponService = this.cartService['couponService'];
                    const coupon = await couponService.getCouponByName(checkout.couponCode);
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

            // Calculate original total from cart items (before discount)
            let originalTotal = 0;
            if (fullCartItems.length > 0) {
                originalTotal = fullCartItems.reduce((sum: number, item: any) => {
                    // Ensure price is a number and use event price
                    const itemPrice = item?.event?.price ? Number(item.event.price) : 0;
                    return sum + itemPrice;
                }, 0);
                
                // If calculated total is 0, try to get from checkout totalAmount + discount
                if (originalTotal === 0 && checkout.totalAmount) {
                    originalTotal = Number(checkout.totalAmount) + Number(checkout.discount || 0);
                }
            } else {
                // Fallback: if cart items not loaded, use checkout totalAmount + discount
                originalTotal = Number(checkout.totalAmount) + Number(checkout.discount || 0);
            }

            // Get discount and final amount from checkout
            const discount = Number(checkout.discount || 0);
            const finalAmount = Number(checkout.totalAmount); // This is already the discounted amount if coupon is applied

            // Calculate original total correctly - if discount exists, original = final + discount
            // Otherwise, use the calculated total from cart items
            const actualOriginalTotal = discount > 0 ? finalAmount + discount : originalTotal;
            const actualFinalAmount = discount > 0 ? finalAmount : actualOriginalTotal;

            // Prepare response data
            const responseData: any = {
                checkoutId: checkout.checkoutId,
                orderId: checkout.orderId || null,
                status: checkout.status,
                totalAmount: actualFinalAmount, // Show final amount (with or without discount)
                itemCount: fullCartItems.length,
                user: {
                    id: req.user.id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    email: req.user.email,
                },
                createdAt: checkout.createdAt,
                completedAt: checkout.completedAt || null,
                isCompleted: checkout.isCompleted || false,
                // Payment URLs and methods will be available in the checkout session
                paymentMethods: {
                    inAppPayment: true,
                    savedPaymentMethods: true,
                    cardValidation: true
                },
                // Payment information (if available)
                paymentGateway: checkout.paymentGateway || null,
                paymentMethod: checkout.paymentMethod || null,
                transactionId: checkout.transactionId || null
            };

            // Add coupon-related fields only if coupon is applied
            if (checkout.couponCode) {
                responseData.couponCode = checkout.couponCode;
                responseData.coupon = couponDetails;
                responseData.discount = discount;
                responseData.originalTotal = actualOriginalTotal;
            }

            // Price breakdown: eventPrice, discount, tax, total. Prefer gstBreakdown; if missing/zeros, derive from fullCartItems using each event's gstRate.
            const gb = checkout.gstBreakdown;
            let eventPrice = gb?.finalSummary?.totalBaseAmount ?? gb?.summary?.totalBaseAmount;
            let tax = gb?.finalSummary?.totalGst ?? gb?.summary?.totalGst;
            let breakdownGstRate = gb?.gstRate ?? 18;
            const breakdownHasZeros = (eventPrice == null || eventPrice === 0) && (tax == null || tax === 0);
            if (breakdownHasZeros && fullCartItems?.length > 0) {
                eventPrice = fullCartItems.reduce((s: number, item: any) => s + (Number(item?.event?.price) || 0), 0);
                eventPrice = Math.round(eventPrice * 100) / 100;
                tax = fullCartItems.reduce((s: number, item: any) => {
                    const base = Number(item?.event?.price) || 0;
                    const rate = item?.event?.gstRate != null ? Number(item.event.gstRate) : 18;
                    return s + Math.round(base * (rate / 100) * 100) / 100;
                }, 0);
                tax = Math.round(tax * 100) / 100;
                breakdownGstRate = fullCartItems.length > 0
                    ? fullCartItems.reduce((s: number, item: any) => s + (item?.event?.gstRate != null ? Number(item.event.gstRate) : 18), 0) / fullCartItems.length
                    : 18;
                breakdownGstRate = Math.round(breakdownGstRate * 100) / 100;
            }
            if (eventPrice == null) eventPrice = Math.round(actualFinalAmount / (1 + breakdownGstRate / 100) * 100) / 100;
            if (tax == null) tax = Math.round((actualFinalAmount - eventPrice) * 100) / 100;
            responseData.priceBreakdown = {
                eventPrice,
                discount: discount,
                tax,
                total: actualFinalAmount,
                currency: 'SGD',
                gstRate: breakdownGstRate
            };

            // Items: only id, name, actual price (base), gst price. Use event's gstRate when gb missing or building from fullCartItems.
            if (gb?.items?.length) {
                responseData.items = gb.items.map((i: any) => ({
                    id: i.eventId,
                    name: i.eventName,
                    actualPrice: i.baseAmount,
                    gstPrice: i.gstAmount
                }));
            } else if (fullCartItems?.length) {
                responseData.items = fullCartItems.map((item: any) => {
                    const base = Number(item?.event?.price) || 0;
                    const gstRate = item?.event?.gstRate != null ? Number(item.event.gstRate) : (gb?.gstRate ?? 18);
                    const gstAmount = Math.round(base * (gstRate / 100) * 100) / 100;
                    return {
                        id: item?.event?.id ?? item?.eventId,
                        name: item?.event?.name ?? 'Event',
                        actualPrice: base,
                        gstPrice: gstAmount
                    };
                });
            } else {
                responseData.items = [];
            }

            responseData.cartItems = fullCartItems.map((item: any) => {
                const base = Number(item?.event?.price) || 0;
                const gstRate = item?.event?.gstRate != null ? Number(item.event.gstRate) : (gb?.gstRate ?? 18);
                const gstAmount = Math.round(base * (gstRate / 100) * 100) / 100;
                return {
                    cartId: item.cartId,
                    eventId: item?.event?.id ?? item?.eventId,
                    event: item?.event ?? null,
                    actualPrice: base,
                    gstPrice: gstAmount,
                    totalPrice: base + gstAmount
                };
            });

            return responseData;
    }

}