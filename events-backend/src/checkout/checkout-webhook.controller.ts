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
        console.log('🔔 WooShPay webhook received at:',new Date().toISOString());
        try {
            // Enhanced logging for debugging
             console.log('🎉 Real-time payment processing');
            // Temporarily skip signature verification due to WooShPay signature format issues
            const signature = req.headers['wooshpay-signature'] as string;
            if (signature && process.env.NODE_ENV === 'production') {
                const payload = JSON.stringify(webhookData);
                
                try {
                    if (!this.wooShPayService.verifyWebhookSignature(payload, signature)) {
                        console.error('❌ Webhook signature verification failed');
                        return response.status(HttpStatus.UNAUTHORIZED).json({
                            success: false,
                            message: 'Webhook signature verification failed',
                        });
                    }
                    console.log('✅ Webhook signature verified successfully');
                } catch (error: any) {
                    console.log('⚠️ Signature verification failed, but continuing in development mode:', error.message);
                }
            } else {
                console.log('⚠️ Skipping signature verification (development mode)');
            }
            
            // Process webhook event according to WooShPay format
            console.log('🔄 Processing webhook event...');
            await this.checkoutService.processPaymentCompletion(webhookData);
            
            console.log('✅ WooShPay webhook processed successfully\n');
            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Payment processed successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            console.error('❌ WooShPay webhook processing error:', {
                message: error.message,
                stack: error.stack,
                webhookType: webhookData?.type,
                eventId: webhookData?.id,
                timestamp: new Date().toISOString()
            });

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

    // Only real webhook processing - test endpoints removed for production
}
