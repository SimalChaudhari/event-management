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
            couponCode?: string  // Optional - can be null or empty
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
            if (body.couponCode && body.couponCode.trim() !== '') {
                try {
                    const couponResult = await this.cartService.applyCoupon(userId, body.selectedCartIds, body.couponCode);
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
                        message: error.message || 'Invalid coupon code',
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
            const checkoutDto: CreateCheckoutDto = {
                cartItems: checkoutItems,
                totalAmount: finalAmount,
                couponCode: body.couponCode || undefined,
                useSelectedItemsOnly: true,
            };

            // Create checkout session
            const checkout = await this.checkoutService.createCheckout(userId, checkoutDto);

            // Determine success message based on coupon application
            const successMessage = body.couponCode && body.couponCode.trim() !== '' 
                ? 'Checkout session created successfully with coupon applied'
                : 'Checkout session created successfully';

            return response.status(201).json({
                success: true,
                message: successMessage,
                data: {
                    checkoutId: checkout.checkoutId,
                    status: checkout.status,
                    totalAmount: checkout.totalAmount,
                    discount: checkout.discount,
                    couponCode: checkout.couponCode,
                    couponApplied: result.couponApplied || null,
                    cartItems: checkout.cartItems,
                    itemCount: checkout.cartItems.length,
                    user: checkout.user,
                    createdAt: checkout.createdAt,
                    // Price breakdown
                    priceBreakdown: {
                        subtotal: totalAmount,
                        discount: discount,
                        total: finalAmount,
                        currency: 'USD',
                        gstInclusive: true
                    },
                    // Payment URLs and methods will be available in the checkout session
                    paymentMethods: {
                        inAppPayment: true,
                        savedPaymentMethods: true,
                        cardValidation: true
                    }
                }
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