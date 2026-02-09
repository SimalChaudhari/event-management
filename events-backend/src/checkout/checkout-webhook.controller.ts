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
        const isProduction = process.env.NODE_ENV === 'production';
        const skipVerify = process.env.WOOSHPay_WEBHOOK_SKIP_VERIFY === 'true';

        console.log('🔔 [WEBHOOK] Received at', new Date().toISOString(), '| NODE_ENV=', process.env.NODE_ENV, '| isProduction=', isProduction);
        console.log('🔔 [WEBHOOK] Payload keys:', webhookData ? Object.keys(webhookData) : 'null');
        console.log('🔔 [WEBHOOK] type=', webhookData?.type, '| event_type=', webhookData?.event_type, '| data?.object?.metadata=', webhookData?.data?.object?.metadata);
        if (webhookData && typeof webhookData === 'object') {
            try {
                console.log('🔔 [WEBHOOK] Full payload (truncated):', JSON.stringify(webhookData).slice(0, 800));
            } catch (_) {}
        }

        try {
            const signature = (req.headers['wooshpay-signature'] || req.headers['x-wooshpay-signature']) as string;
            const hasSignature = !!signature;
            const rawBody = (req as any).rawBody;
            const hasRawBody = typeof rawBody === 'string' && rawBody.length > 0;

            console.log('🔔 [WEBHOOK] hasSignature=', hasSignature, '| hasRawBody=', hasRawBody);

            if (isProduction && !skipVerify) {
                const payload = hasRawBody ? rawBody : JSON.stringify(webhookData);
                const livemode = webhookData?.livemode;
                try {
                    if (!hasRawBody) {
                        console.warn('⚠️ [WEBHOOK] No raw body – signature verification may fail. Ensure main.ts stores req.rawBody for webhook requests.');
                    }
                    if (!signature || !this.wooShPayService.verifyWebhookSignature(payload, signature, livemode)) {
                        console.error('❌ [WEBHOOK] Signature verification FAILED. For test events (livemode: false) set WOOSHPay_WEBHOOK_SECRET_TEST. For live use WOOSHPay_WEBHOOK_SECRET. Check webhook URL in WooShPay dashboard.');
                        return response.status(HttpStatus.UNAUTHORIZED).json({
                            success: false,
                            message: 'Webhook signature verification failed',
                        });
                    }
                    console.log('✅ [WEBHOOK] Signature verified');
                } catch (error: any) {
                    console.error('❌ [WEBHOOK] Signature error:', error?.message);
                    return response.status(HttpStatus.UNAUTHORIZED).json({
                        success: false,
                        message: 'Webhook signature verification failed',
                    });
                }
            } else {
                if (skipVerify && isProduction) {
                    console.warn('⚠️ [WEBHOOK] SKIP_VERIFY=true – signature check disabled. Remove in production after debugging.');
                } else {
                    console.log('🔔 [WEBHOOK] Signature check skipped (development or SKIP_VERIFY)');
                }
            }

            console.log('🔔 [WEBHOOK] Calling processPaymentCompletion...');
            await this.checkoutService.processPaymentCompletion(webhookData);

            console.log('✅ [WEBHOOK] Processed successfully');
            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Payment processed successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            console.error('❌ [WEBHOOK] Error:', error?.message);
            console.error('❌ [WEBHOOK] Stack:', error?.stack);
            console.error('❌ [WEBHOOK] webhookType=', webhookData?.type, 'eventId=', webhookData?.id);

            try {
                ErrorHandlerUtil.handleError(error, 'Webhook processing failed');
            } catch (handledError: any) {
                return response.status(handledError.getStatus()).json({
                    success: false,
                    message: handledError.message,
                    error: handledError.message,
                    timestamp: new Date().toISOString()
                });
            }
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
