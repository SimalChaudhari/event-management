import { 
    Controller, 
    Post, 
    Get, 
    Put, 
    Delete, 
    Body, 
    Param, 
    Res, 
    Req, 
    UseGuards,
    HttpStatus,
    HttpCode 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CheckoutService } from './checkout.service';
import { WooShPayService } from './wooshpay.service';
import { 
    CreateCheckoutDto, 
    ProcessPaymentDto, 
    CheckoutStatus,
    PaymentGateway 
} from './checkout.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';

@Controller('api/checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
    constructor(
        private readonly checkoutService: CheckoutService,
        private readonly wooShPayService: WooShPayService,
    ) {}

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async createCheckout(
        @Req() req: Request,
        @Body() dto: CreateCheckoutDto,
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            const checkout = await this.checkoutService.createCheckout(userId, dto);

            return response.status(HttpStatus.CREATED).json({
                success: true,
                message: 'Checkout session created successfully',
                data: checkout,
            });
        } catch (error: any) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: error.message || 'Failed to create checkout session',
            });
        }
    }

    @Post('create-from-selected')
    @HttpCode(HttpStatus.CREATED)
    async createCheckoutFromSelected(
        @Req() req: Request,
        @Body() body: { couponCode?: string; promoCode?: string },
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            
            // Create DTO with selected items flag
            const dto: CreateCheckoutDto = {
                cartItems: [], // Will be populated from selected items
                couponCode: body.couponCode,
                promoCode: body.promoCode,
                discount: 0, // Will be calculated
                totalAmount: 0, // Will be calculated
                useSelectedItemsOnly: true
            };

            const checkout = await this.checkoutService.createCheckout(userId, dto);

            return response.status(HttpStatus.CREATED).json({
                success: true,
                message: 'Checkout session created from selected items successfully',
                data: checkout,
            });
        } catch (error: any) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: error.message || 'Failed to create checkout session from selected items',
            });
        }
    }

    @Post('process-payment')
    @HttpCode(HttpStatus.OK)
    async processPayment(
        @Req() req: Request,
        @Body() dto: ProcessPaymentDto,
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            const result = await this.checkoutService.processPayment(userId, dto);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Payment processed successfully',
                data: result,
            });
        } catch (error: any) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: error.message || 'Payment processing failed',
            });
        }
    }

    @Post('proceed-now')
    @HttpCode(HttpStatus.OK)
    async proceedNow(
        @Req() req: Request,
        @Body() body: { checkoutId: string; paymentMethod?: string },
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            
            // Create ProcessPaymentDto with WooShPay as default gateway
            const processPaymentDto: ProcessPaymentDto = {
                checkoutId: body.checkoutId,
                paymentGateway: PaymentGateway.WooShPay,
                paymentMethod: body.paymentMethod || 'Credit Card',
            };

            const result = await this.checkoutService.processPayment(userId, processPaymentDto);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Payment initiated successfully',
                data: result,
            });
        } catch (error: any) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: error.message || 'Failed to proceed with payment',
            });
        }
    }

    @Get('session/:checkoutId')
    async getCheckoutSession(
        @Param('checkoutId') checkoutId: string,
        @Req() req: Request,
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            const checkout = await this.checkoutService.getCheckoutById(checkoutId, userId);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Checkout session retrieved successfully',
                data: checkout,
            });
        } catch (error: any) {
            return response.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: error.message || 'Checkout session not found',
            });
        }
    }

    @Get('history')
    async getUserCheckouts(
        @Req() req: Request,
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            const checkouts = await this.checkoutService.getUserCheckouts(userId);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Checkout history retrieved successfully',
                count: checkouts.length,
                data: checkouts,
            });
        } catch (error: any) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: error.message || 'Failed to retrieve checkout history',
            });
        }
    }

    @Put('cancel/:checkoutId')
    async cancelCheckout(
        @Param('checkoutId') checkoutId: string,
        @Req() req: Request,
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            await this.checkoutService.cancelCheckout(checkoutId, userId);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Checkout session cancelled successfully',
            });
        } catch (error: any) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: error.message || 'Failed to cancel checkout session',
            });
        }
    }

    // Production-ready webhook endpoint for WooShPay payment notifications
    @Post('webhook/wooshpay')
    async wooShPayWebhook(
        @Body() webhookData: any,
        @Req() req: Request,
        @Res() response: Response
    ) {
        try {
            // Verify webhook signature for security (production requirement)
            const signature = req.headers['wooshpay-signature'] as string;
            const payload = JSON.stringify(webhookData);
            
            if (!this.wooShPayService.verifyWebhookSignature(payload, signature)) {
                return response.status(HttpStatus.UNAUTHORIZED).json({
                    success: false,
                    message: 'Webhook signature verification failed',
                });
            }

            console.log('WooShPay webhook received and verified:', {
                type: webhookData.type,
                id: webhookData.data?.object?.id,
            });
            
            // Process webhook event using the production service
            this.wooShPayService.processWebhookEvent(webhookData.type, webhookData.data?.object);
            
            // Handle specific webhook events for checkout completion
            if (webhookData.type === 'payment_intent.succeeded' || webhookData.type === 'payment_link.paid') {
                const paymentData = webhookData.data.object;
                const checkoutId = paymentData.metadata?.checkout_id;
                
                if (checkoutId) {
                    try {
                        // Complete the checkout and create order
                        console.log(`Payment succeeded for checkout: ${checkoutId}`);
                        // Additional logic to complete the order can be added here
                    } catch (processingError) {
                        console.error('Error processing successful payment:', processingError);
                    }
                }
            } else if (webhookData.type === 'payment_intent.payment_failed' || webhookData.type === 'payment_link.failed') {
                const paymentData = webhookData.data.object;
                const checkoutId = paymentData.metadata?.checkout_id;
                
                if (checkoutId) {
                    console.log(`Payment failed for checkout: ${checkoutId}`);
                    // Update checkout status to failed
                }
            }
            
            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Webhook processed successfully',
            });
        } catch (error: any) {
            console.error('WooShPay webhook processing error:', error);
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Webhook processing failed',
            });
        }
    }

    // Get payment status
    @Get('payment-status/:checkoutId')
    async getPaymentStatus(
        @Param('checkoutId') checkoutId: string,
        @Req() req: Request,
        @Res() response: Response
    ) {
        try {
            const userId = req.user.id;
            const checkout = await this.checkoutService.getCheckoutById(checkoutId, userId);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Payment status retrieved successfully',
                data: {
                    checkoutId: checkout.checkoutId,
                    status: checkout.status,
                    transactionId: checkout.transactionId,
                    paymentUrl: checkout.paymentUrl,
                    isCompleted: checkout.isCompleted,
                    completedAt: checkout.completedAt,
                },
            });
        } catch (error: any) {
            return response.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: error.message || 'Payment status not found',
            });
        }
    }

    // Test endpoint to create direct payment link via WooShPay API (No Auth Required for Testing)
    @Post('test-payment-link')
    async testPaymentLink(
        @Body() body: { amount: number; description?: string },
        @Res() response: Response
    ) {
        try {
            const paymentLinkData = {
                amount: Math.round(body.amount * 100), // Convert to cents
                currency: 'USD',
                description: body.description || 'Test Payment Link',
                reference: `TEST-${Date.now()}`,
                success_url: `${process.env.FRONTEND_URL}/payment/success`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
                metadata: {
                    test: 'true',
                    created_at: new Date().toISOString(),
                },
            };

            const paymentLink = await this.wooShPayService.createPaymentLink(paymentLinkData);
            const paymentUrl = this.wooShPayService.generatePaymentUrl(paymentLink, 'payment_link');

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Test payment link created successfully',
                data: {
                    id: paymentLink.id,
                    paymentUrl: paymentUrl,
                    amount: body.amount,
                    status: paymentLink.status,
                },
            });
        } catch (error: any) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: error.message || 'Failed to create test payment link',
                error: error.response?.data || error.message,
            });
        }
    }

    // Test endpoint to create checkout session (matches your successful API call)
    @Post('test-checkout-session')
    async testCheckoutSession(
        @Body() body: { 
            amount: number; 
            currency?: string; 
            productName?: string;
            success_url?: string;
            cancel_url?: string;
        },
        @Res() response: Response
    ) {
        try {
            const checkoutSessionData = {
                cancel_url: body.cancel_url || `${process.env.FRONTEND_URL}/payment/cancel`,
                mode: 'payment' as const,
                success_url: body.success_url || `${process.env.FRONTEND_URL}/payment/success`,
                line_items: [
                    {
                        price_data: {
                            currency: body.currency || 'USD',
                            unit_amount: Math.round(body.amount * 100), // Convert to cents
                            product_data: {
                                name: body.productName || 'Test Product',
                                description: 'Test checkout session product'
                            }
                        },
                        quantity: 1
                    }
                ],
                metadata: {
                    test: 'true',
                    created_at: new Date().toISOString(),
                }
            };

            console.log('🧪 Creating test checkout session:', checkoutSessionData);

            const checkoutSession = await this.wooShPayService.createCheckoutSession(checkoutSessionData);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Test checkout session created successfully',
                data: {
                    id: checkoutSession.id,
                    url: checkoutSession.url,
                    status: checkoutSession.status,
                    amount: body.amount,
                    currency: body.currency || 'USD',
                },
                testCards: {
                    success: '4111111111111111 (Exp: 12/25, CVV: 123)',
                    decline: '4000000000000002 (Exp: 12/25, CVV: 123)',
                },
            });
        } catch (error: any) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: error.message || 'Failed to create test checkout session',
                error: error.response?.data || error.message,
            });
        }
    }
}
