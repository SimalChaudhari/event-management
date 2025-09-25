// src/controllers/cart.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, Res, UseGuards, Request } from '@nestjs/common';
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

            // Convert cart items to checkout format
            const checkoutItems = result.items.map(item => ({
                eventId: item.eventId,
                price: item.price,
                eventName: item.eventName
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

            // Determine success message based on coupon application
            const successMessage = body.couponId && body.couponId.trim() !== '' 
                ? 'Checkout session created successfully with coupon applied'
                : 'Checkout session created successfully';

            // Prepare response data based on whether coupon is applied
            const responseData: any = {
                checkoutId: checkout.checkoutId,
                status: checkout.status,
                totalAmount: body.couponId && body.couponId.trim() !== '' 
                    ? finalAmount  // Show discounted amount when coupon applied
                    : totalAmount, // Show original amount when no coupon
                cartItems: checkout.cartItems,
                itemCount: checkout.cartItems.length,
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