// src/controllers/cart.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, Res, UseGuards, Request, forwardRef, Inject } from '@nestjs/common';
import { Response } from 'express';
import { CartService } from './cart.service';
import { CartDto } from './cart.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { EventService } from 'event/event.service';
import { CheckoutService } from 'checkout/checkout.service';
import { CreateCheckoutDto, InAppPaymentDto } from 'checkout/checkout.dto';


@Controller('api/carts')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(
        private readonly cartService: CartService,
        @Inject(forwardRef(() => EventService))
        private readonly eventService: EventService, // Inject EventService
        private readonly checkoutService: CheckoutService, // Inject CheckoutService
    ) {}
    @Post('')
    async addToCart(@Body() cartDto: CartDto, @Res() response: Response, @Request() req: any) {
        const userId = req.user.id; // Extract user ID from the request
        const role = req.user.role; // Extract user role from the request

        if (role !== 'user') {
            return response.status(403).json({
                success: false,
                message: 'Access denied. Only users can add to cart.',
            });
        }

        if (!cartDto.eventId) {
            return response.status(400).json({
                success: false,
                message: 'Event ID is required.',
            });
        }

        const eventId = cartDto.eventId;

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
    

        // Ensure eventId is provided in the request body
        if (!cartDto.eventId) {
            return response.status(400).json({
                success: false,
                message: 'Event ID is required.',
            });
        }

        // Create the cartDto with userId and eventId
         await this.cartService.addToCart({ ...cartDto, userId });
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

            // Get completed checkouts from checkout service
            const completedCheckouts = await this.checkoutService.getCompletedCheckouts(userId);

            return response.status(200).json({
                success: true,
                message: 'Completed checkouts retrieved successfully',
                count: completedCheckouts.length,
                data: completedCheckouts,
            });

        } catch (error: any) {
            console.error('❌ Get completed checkouts failed:', error);
            return response.status(400).json({
                success: false,
                message: error.message || 'Failed to retrieve completed checkouts',
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

            // Get specific completed checkout
            const checkout = await this.checkoutService.getCompletedCheckoutById(checkoutId, userId);

            return response.status(200).json({
                success: true,
                message: 'Checkout details retrieved successfully',
                data: checkout,
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

    @Post('create-checkout')
    async createCheckout(
        @Body() body: { 
            selectedCartIds: string[],
            couponId?: string  // Optional - can be null or empty
        },
        @Request() req: any,
        @Res() response: Response
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

            // Get selected cart items with full details
            let result = await this.cartService.getCartItemsByIds(userId, body.selectedCartIds);
            
            if (result.totalCount === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'No valid cart items found for checkout.',
                });
            }

            // Apply coupon if provided (optional)
            if (body.couponId && body.couponId.trim() !== '') {
                try {
                    // Get coupon by ID first, then apply using the code
                    const couponService = this.cartService['couponService']; // Access coupon service
                    const coupon = await couponService.getCouponById(body.couponId);
                    
                    const couponResult = await this.cartService.applyCoupon(userId, body.selectedCartIds, coupon.code);
                    // Update result with coupon data
                    result = {
                        ...result,
                        discount: couponResult.discount,
                        finalAmount: couponResult.finalAmount,
                        couponApplied: couponResult.couponApplied as any
                    };
                } catch (error: any) {
                    return response.status(400).json({
                        success: false,
                        message: error.message || 'Invalid coupon ID',
                        error: error.message
                    });
                }
            }

            // Convert cart items to checkout format - store only IDs for storage
            // But we still need to pass full data to checkout service for validation
            const checkoutItems = result.items.map(item => ({
                eventId: item.eventId,
                price: item.price,
                eventName: item.eventName
            }));

            // Prepare minimal cart data (only IDs) for storage after checkout creation
            const cartIdsMinimal = result.items.map(item => ({
                cartId: item.cartId,
                eventId: item.eventId
            }));

            // Calculate total amount (with or without coupon)
            const totalAmount = result.totalAmount;
            const discount = result.discount || 0;
            const finalAmount = totalAmount - discount;

            // Create checkout DTO
            let couponCodeForCheckout = undefined;
            if (body.couponId && body.couponId.trim() !== '') {
                // Get coupon code from coupon ID
                const couponService = this.cartService['couponService'];
                const coupon = await couponService.getCouponById(body.couponId);
                couponCodeForCheckout = coupon.code;
            }

            const checkoutDto: CreateCheckoutDto = {
                cartItems: checkoutItems,
                totalAmount: finalAmount,
                discount: discount, // ✅ Include the discount amount
                couponCode: couponCodeForCheckout,
                useSelectedItemsOnly: true,
            };

            // Create checkout session
            const checkout = await this.checkoutService.createCheckout(userId, checkoutDto);

            // Update checkout to store only IDs (minimal data) instead of full cart item data
            await this.checkoutService.updateCheckoutCartItems(checkout.checkoutId, cartIdsMinimal);

            // Determine success message based on coupon application
            const successMessage = body.couponId && body.couponId.trim() !== '' 
                ? 'Checkout session created successfully with coupon applied'
                : 'Checkout session created successfully';

            // Prepare response data based on whether coupon is applied
            // Return only IDs (minimal data) in response
            const responseData: any = {
                checkoutId: checkout.checkoutId,
                status: checkout.status,
                totalAmount: body.couponId && body.couponId.trim() !== '' 
                    ? finalAmount  // Show discounted amount when coupon applied
                    : totalAmount, // Show original amount when no coupon
                cartItems: cartIdsMinimal, // Only IDs (minimal data)
                itemCount: cartIdsMinimal.length,
                user: checkout.user,
                createdAt: checkout.createdAt,
                // Payment URLs and methods will be available in the checkout session
                paymentMethods: {
                    inAppPayment: true,
                    savedPaymentMethods: true,
                    cardValidation: true
                }
            };

            // Add coupon-related fields only if coupon is applied
            if (body.couponId && body.couponId.trim() !== '') {
                responseData.couponCode = checkout.couponCode;
                responseData.coupon = checkout.coupon;
                responseData.couponApplied = result.couponApplied || null;
                responseData.discount = discount;
                responseData.originalTotal = totalAmount;
                
                // Price breakdown with discount
                responseData.priceBreakdown = {
                    subtotal: totalAmount, // Original total
                    discount: discount, // Discount applied
                    total: finalAmount, // Final amount after discount
                    currency: 'USD',
                    gstInclusive: true
                };
            } else {
                // Price breakdown without discount
                responseData.priceBreakdown = {
                    subtotal: totalAmount, // Same as total when no discount
                    discount: 0, // No discount
                    total: totalAmount, // Same as subtotal
                    currency: 'USD',
                    gstInclusive: true
                };
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

    @Get('get-checkout/:checkoutId')
    async getCheckout(
        @Param('checkoutId') checkoutId: string,
        @Request() req: any,
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            if (role !== 'user') {
                return response.status(403).json({
                    success: false,
                    message: 'Access denied. Only users can view checkout sessions.',
                });
            }

            if (!checkoutId) {
                return response.status(400).json({
                    success: false,
                    message: 'Checkout ID is required.',
                });
            }

            // Get checkout session by checkoutId
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
                    const coupon = await couponService.getCouponByCode(checkout.couponCode);
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
                status: checkout.status,
                totalAmount: actualFinalAmount, // Show final amount (with or without discount)
                cartItems: fullCartItems, // Full cart item details
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
                
                // Price breakdown with discount
                responseData.priceBreakdown = {
                    subtotal: actualOriginalTotal, // Original total before discount
                    discount: discount, // Discount applied
                    total: actualFinalAmount, // Final amount after discount
                    currency: 'USD',
                    gstInclusive: true
                };
            } else {
                // Price breakdown without discount
                responseData.priceBreakdown = {
                    subtotal: actualOriginalTotal, // Same as total when no discount
                    discount: 0, // No discount
                    total: actualFinalAmount, // Same as subtotal
                    currency: 'USD',
                    gstInclusive: true
                };
            }

            return response.status(200).json({
                success: true,
                message: 'Checkout session retrieved successfully',
                data: responseData
            });

        } catch (error: any) {
            console.error('❌ Get checkout failed:', error);
            return response.status(400).json({
                success: false,
                message: error.message || 'Failed to retrieve checkout session',
                error: error.message
            });
        }
    }

    @Post('apply-coupon/:checkoutId')
    async applyCouponToCheckout(
        @Param('checkoutId') checkoutId: string,
        @Body() body: { 
            couponId?: string  // Optional - can be null or empty
        },
        @Request() req: any,
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            if (role !== 'user') {
                return response.status(403).json({
                    success: false,
                    message: 'Access denied. Only users can apply coupons.',
                });
            }

            if (!checkoutId) {
                return response.status(400).json({
                    success: false,
                    message: 'Checkout ID is required.',
                });
            }

            if (!body.couponId || body.couponId.trim() === '') {
                return response.status(400).json({
                    success: false,
                    message: 'Coupon ID is required.',
                });
            }

            // Get coupon by ID first, then get the code
            const couponService = this.cartService['couponService'];
            const coupon = await couponService.getCouponById(body.couponId);

            // Apply coupon to checkout
            const result = await this.checkoutService.applyCouponToCheckout(
                checkoutId,
                userId,
                coupon.code
            );

            return response.status(200).json({
                success: true,
                message: 'Coupon applied successfully',
                data: result
            });

        } catch (error: any) {
            console.error('❌ Apply coupon failed:', error);
            return response.status(400).json({
                success: false,
                message: error.message || 'Failed to apply coupon',
                error: error.message
            });
        }
    }

    @Post('process-payment')
    async processFinalPayment(
        @Body() body: { 
            checkoutId: string, // Use checkout ID instead of cart IDs
            paymentMethodId?: string, // For saved card payment
            cvc?: string, // For saved card payment
            // For new card payment
            cardNumber?: string,
            expMonth?: number,
            expYear?: number,
            cardCvc?: string,
            cardholderName?: string,
            billingEmail?: string,
            billingPhone?: string,
            savePaymentMethod?: boolean,
            // Other options
            notes?: string
        },
        @Request() req: any,
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            if (role !== 'user') {
                return response.status(403).json({
                    success: false,
                    message: 'Access denied. Only users can process payments.',
                });
            }

            if (!body.checkoutId) {
                return response.status(400).json({
                    success: false,
                    message: 'Checkout ID is required for payment processing.',
                });
            }

            // Validate payment method selection
            const hasSavedCardPayment = body.paymentMethodId && body.cvc;
            const hasNewCardPayment = body.cardNumber && body.expMonth && body.expYear && body.cardCvc;

            if (!hasSavedCardPayment && !hasNewCardPayment) {
                return response.status(400).json({
                    success: false,
                    message: 'Please select a payment method or provide new card details.',
                });
            }

            let paymentResult;

            if (hasSavedCardPayment) {
                // Process payment with saved method
                const paymentDto = {
                    checkoutId: body.checkoutId,
                    paymentMethodId: body.paymentMethodId!,
                    cvc: body.cvc!,
                    notes: body.notes
                };

                paymentResult = await this.checkoutService.processInAppPaymentWithSavedMethod(userId, paymentDto);
            } else {
                // Process payment with new card
                const paymentDto: InAppPaymentDto = {
                    checkoutId: body.checkoutId,
                    cardNumber: body.cardNumber!,
                    expMonth: body.expMonth!,
                    expYear: body.expYear!,
                    cvc: body.cardCvc!,
                    cardholderName: body.cardholderName,
                    billingEmail: body.billingEmail,
                    billingPhone: body.billingPhone,
                    savePaymentMethod: body.savePaymentMethod || false
                };

                paymentResult = await this.checkoutService.processInAppPaymentWithCard(userId, paymentDto);
            }

            return response.status(200).json({
                success: true,
                message: 'Payment processed successfully',
                data: {
                    checkoutId: body.checkoutId,
                    transactionId: paymentResult.transactionId,
                    status: paymentResult.status,
                    isCompleted: paymentResult.isCompleted,
                    requiresAction: paymentResult.requiresAction,
                    nextAction: paymentResult.nextAction,
                    paymentMethod: paymentResult.paymentMethod,
                    amount: paymentResult.amount,
                    currency: paymentResult.currency,
                    message: paymentResult.message,
                    paymentType: hasSavedCardPayment ? 'saved_card' : 'new_card'
                }
            });

        } catch (error: any) {
            console.error('❌ Process payment failed:', error);
            return response.status(400).json({
                success: false,
                message: error.message || 'Failed to process payment',
                error: error.message
            });
        }
    }

    
}