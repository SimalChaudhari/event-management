import { 
    Controller, 
    Post, 
    Body, 
    Res, 
    Req, 
    HttpStatus,
    HttpCode 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CheckoutService } from './checkout.service';
import { WooShPayService } from './wooshpay.service';
import { ErrorHandlerUtil } from '../utils/error-handler.util';

// Separate controller for webhook endpoints (no JWT authentication required)
@Controller('api/checkout')
export class CheckoutWebhookController {
    constructor(
        private readonly checkoutService: CheckoutService,
        private readonly wooShPayService: WooShPayService,
    ) {}

    // Webhook endpoint for WooShPay payment completion
    // NOTE: This endpoint should NOT have JWT guard as it's called by WooShPay servers
    @Post('webhook/wooshpay')
    @HttpCode(HttpStatus.OK)
    async wooShPayWebhook(
        @Body() webhookData: any,
        @Req() req: Request,
        @Res() response: Response
    ) {
        const skipVerify = process.env.WOOSHPay_WEBHOOK_SKIP_VERIFY === 'true';
        const signature = (req.headers['wooshpay-signature'] || req.headers['x-wooshpay-signature']) as string;
        const rawBody = (req as any).rawBody;
        const hasRawBody = typeof rawBody === 'string' && rawBody.length > 0;

        try {
            if (!skipVerify) {
                const payload = hasRawBody ? rawBody : JSON.stringify(webhookData);
                const verified = !!signature && this.wooShPayService.verifyWebhookSignature(payload, signature);
                if (!verified) {
                    return response.status(HttpStatus.UNAUTHORIZED).json({
                        success: false,
                        message: 'Webhook signature verification failed',
                    });
                }
            }
            await this.checkoutService.processPaymentCompletion(webhookData);
            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Payment processed successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error: any) {
            try {
                ErrorHandlerUtil.handleError(error, 'Webhook processing failed');
            } catch (handledError: any) {
                return response.status(handledError.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: handledError.message ?? 'Webhook processing failed',
                    timestamp: new Date().toISOString(),
                });
            }
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error?.message ?? 'Webhook processing failed',
                timestamp: new Date().toISOString(),
            });
        }
    }

    // Test webhook endpoint for development (remove in production)
    @Post('webhook/test')
    @HttpCode(HttpStatus.OK)
    async testWebhook(
        @Body() testData: any,
        @Res() response: Response
    ) {
        console.log('🧪 Test webhook received:', testData);
        
        try {
            // Simulate checkout session completed webhook (Checkout Session flow)
            const mockWebhookData = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: testData.sessionId || 'cs_test_1234567890',
                        status: 'complete',
                        metadata: {
                            checkout_id: testData.checkoutId
                        }
                    }
                }
            };
            
            await this.checkoutService.processPaymentCompletion(mockWebhookData);
            
            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Test webhook processed successfully',
                data: mockWebhookData
            });
        } catch (error: any) {
            console.error('❌ Test webhook error:', error);
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: error.message || 'Test webhook failed'
            });
        }
    }

    // Only real webhook processing - test endpoints removed for production
}
