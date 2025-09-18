import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';

export interface WooShPayConfig {
    baseUrl: string;
    secretKey: string;
    testMode: boolean;
    webhookSecret?: string;
}

export interface PaymentIntentData {
    amount: number;
    currency: string;
    merchant_order_id: string;
    return_url: string;
    cancel_url: string;
    metadata: Record<string, any>;
    confirm?: boolean;
}

export interface PaymentLinkData {
    amount: number;
    currency: string;
    description: string;
    reference: string;
    success_url: string;
    cancel_url: string;
    metadata: Record<string, any>;
    expires_at?: string;
}

export interface CheckoutSessionData {
    cancel_url: string;
    success_url: string;
    mode: 'payment';
    line_items: Array<{
        price_data: {
            currency: string;
            unit_amount: number;
            product_data: {
                name: string;
                description?: string;
            };
        };
        quantity: number;
    }>;
    metadata?: Record<string, any>;
}

@Injectable()
export class WooShPayService {
    private readonly logger = new Logger(WooShPayService.name);

    constructor() {}

    /**
     * Get WooShPay configuration from environment
     */
    private getConfig(): WooShPayConfig {
        const config: WooShPayConfig = {
            baseUrl: process.env.WOOSHPay_TEST_MODE === 'true' 
                ? 'https://apitest.wooshpay.com' 
                : 'https://api.wooshpay.com',
            secretKey: process.env.WOOSHPay_API_KEY || '',
            testMode: process.env.WOOSHPay_TEST_MODE === 'true',
            webhookSecret: process.env.WOOSHPay_WEBHOOK_SECRET,
        };

        if (!config.secretKey || config.secretKey === 'your_wooshpay_secret_key_here') {
            throw new BadRequestException(
                'WooShPay API key not configured. Please set WOOSHPay_API_KEY in your .env file. ' +
                'Get your API key from WooShPay dashboard.'
            );
        }

        return config;
    }

    /**
     * Create Basic Auth header for WooShPay API
     */
    private createAuthHeader(secretKey: string): string {
        return Buffer.from(`${secretKey}:`).toString('base64');
    }

    /**
     * Make authenticated API request to WooShPay
     */
    private async makeApiRequest<T>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        endpoint: string,
        data?: any
    ): Promise<T> {
        const config = this.getConfig();
        const basicAuth = this.createAuthHeader(config.secretKey);

        const requestConfig = {
            method,
            url: `${config.baseUrl}${endpoint}`,
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/json',
            },
            data,
        };

        this.logger.log(`Making ${method} request to ${endpoint}`, {
            testMode: config.testMode,
            endpoint,
        });

        try {
            const response = await axios(requestConfig);
            
            this.logger.log(`API request successful`, {
                endpoint,
                status: response.status,
                responseId: response.data?.id,
            });

            return response.data;
        } catch (error: any) {
            console.log(error);
            this.logger.error(`API request failed`, {
                endpoint,
                status: error.response?.status,
                statusText: error.response?.statusText,
                error: error.response?.data,
            });

            if (error.response?.status === 401) {
                throw new BadRequestException('WooShPay authentication failed. Check API key.');
            } else if (error.response?.status === 403) {
                throw new BadRequestException('WooShPay access denied. Check permissions.');
            } else if (error.response?.status === 400) {
                throw new BadRequestException(`WooShPay validation error: ${error.response?.data?.message || 'Invalid request'}`);
            } else if (error.response?.status === 422) {
                throw new BadRequestException(`WooShPay parameter error: ${error.response?.data?.message || 'Invalid parameters'}`);
            }

            throw new InternalServerErrorException(`WooShPay API error: ${error.message}`);
        }
    }

    /**
     * Create PaymentIntent with WooShPay
     */
    async createPaymentIntent(data: PaymentIntentData): Promise<any> {
        const config = this.getConfig();

        this.logger.log('Creating PaymentIntent', {
            amount: data.amount,
            currency: data.currency,
            merchant_order_id: data.merchant_order_id,
            testMode: config.testMode,
        });

        const paymentIntent = await this.makeApiRequest<any>('POST', '/v1/payment_intents', data);

        // Log test card information in test mode
        if (config.testMode) {
            this.logger.log('🧪 TEST MODE - Available test cards:');
            this.logger.log('✅ Success: 4111111111111111, Exp: 12/25, CVV: 123');
            this.logger.log('❌ Decline: 4000000000000002, Exp: 12/25, CVV: 123');
        }

        return paymentIntent;
    }

    /**
     * Create Checkout Session with WooShPay (Official API) - Structured Method
     */
    async createCheckoutSession(data: CheckoutSessionData): Promise<any> {
        const config = this.getConfig();
        
        this.logger.log('Creating Checkout Session', {
            lineItems: data.line_items?.length || 0,
            mode: data.mode,
            currency: data.line_items?.[0]?.price_data?.currency,
            testMode: config.testMode,
        });

        const checkoutSession = await this.makeApiRequest<any>('POST', '/v1/checkout/sessions', data);
        
        // Log the response for debugging
        this.logger.log('Checkout Session created successfully', {
            id: checkoutSession.id,
            url: checkoutSession.url,
            status: checkoutSession.status,
        });

        // Log test card information in test mode
        if (config.testMode) {
            this.logger.log('🧪 TEST MODE - Available test cards for checkout:');
            this.logger.log('✅ Success: 4111111111111111, Exp: 12/25, CVV: 123');
            this.logger.log('❌ Decline: 4000000000000002, Exp: 12/25, CVV: 123');
            this.logger.log('🔗 Payment URL: ' + checkoutSession.url);
        }

        return checkoutSession;
    }

    /**
     * Create Checkout Session from Cart Items - Helper Method
     */
    async createCheckoutSessionFromCart(
        checkoutId: string,
        cartItems: any[],
        totalAmount: number,
        successUrl: string,
        cancelUrl: string,
        metadata: Record<string, any> = {}
    ): Promise<any> {
        // Convert cart items to line items format
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: 'USD', // You can make this configurable
                unit_amount: Math.round(Number(item.price) * 100), // Convert to cents
                product_data: {
                    name: item.eventName || `Event ${item.eventId}`,
                    description: `Event registration for ${item.eventName || item.eventId}`,
                },
            },
            quantity: 1,
        }));

        const checkoutSessionData: CheckoutSessionData = {
            cancel_url: cancelUrl,
            success_url: successUrl,
            mode: 'payment',
            line_items: lineItems,
            metadata: {
                checkout_id: checkoutId,
                ...metadata,
            },
        };

        return await this.createCheckoutSession(checkoutSessionData);
    }

    /**
     * Create Payment Link with WooShPay (Fallback method)
     */
    async createPaymentLink(data: PaymentLinkData): Promise<any> {
        this.logger.log('Creating Payment Link', {
            amount: data.amount,
            currency: data.currency,
            reference: data.reference,
        });

        const paymentLink = await this.makeApiRequest<any>('POST', '/v1/payment_links', data);
        return paymentLink;
    }

    /**
     * Retrieve PaymentIntent details
     */
    async getPaymentIntent(paymentIntentId: string): Promise<any> {
        return await this.makeApiRequest<any>('GET', `/v1/payment_intents/${paymentIntentId}`);
    }

    /**
     * Retrieve Payment Link details
     */
    async getPaymentLink(paymentLinkId: string): Promise<any> {
        return await this.makeApiRequest<any>('GET', `/v1/payment_links/${paymentLinkId}`);
    }

    /**
     * Generate payment URL based on WooShPay response
     */
    generatePaymentUrl(paymentData: any, type: 'payment_intent' | 'payment_link' | 'checkout_session' = 'payment_intent'): string {
        const config = this.getConfig();
        
        // Try to get URL from WooShPay response first (Official API response)
        if (paymentData.url) {
            return paymentData.url; // Checkout Session URL
        } else if (paymentData.checkout_url) {
            return paymentData.checkout_url;
        } else if (paymentData.payment_url) {
            return paymentData.payment_url;
        } else if (paymentData.next_action?.redirect_to_url?.url) {
            return paymentData.next_action.redirect_to_url.url;
        }

        // Construct URL manually based on WooShPay documentation structure
        const baseUrl = config.testMode ? 'https://apitest.wooshpay.com' : 'https://api.wooshpay.com';
        
        if (type === 'checkout_session') {
            // For checkout sessions, use the session structure
            return config.testMode
                ? `https://checkout-test.wooshpay.com/sessions/${paymentData.id}`
                : `https://checkout.wooshpay.com/sessions/${paymentData.id}`;
        } else if (type === 'payment_link') {
            // For payment links, use the payment link structure
            return config.testMode 
                ? `https://dashboard.wooshpay.com/test/paymentLink/${paymentData.id}`
                : `https://dashboard.wooshpay.com/paymentLink/${paymentData.id}`;
        } else {
            // For payment intents, use the payment intent structure  
            return config.testMode
                ? `https://dashboard.wooshpay.com/test/paymentLink?payment_intent=${paymentData.id}`
                : `https://dashboard.wooshpay.com/paymentLink?payment_intent=${paymentData.id}`;
        }
    }

    /**
     * Verify webhook signature for security
     */
    verifyWebhookSignature(payload: string, signature: string): boolean {
        const config = this.getConfig();
        
        if (!config.webhookSecret) {
            this.logger.warn('Webhook secret not configured - skipping signature verification');
            return true; // Allow in development, but log warning
        }

        try {
            const expectedSignature = crypto
                .createHmac('sha256', config.webhookSecret)
                .update(payload)
                .digest('hex');

            const providedSignature = signature.replace('sha256=', '');
            
            const isValid = crypto.timingSafeEqual(
                Buffer.from(expectedSignature, 'hex'),
                Buffer.from(providedSignature, 'hex')
            );

            if (!isValid) {
                this.logger.error('Webhook signature verification failed');
            }

            return isValid;
        } catch (error) {
            this.logger.error('Error verifying webhook signature', error);
            return false;
        }
    }

    /**
     * Handle webhook events
     */
    processWebhookEvent(eventType: string, eventData: any): void {
        this.logger.log(`Processing webhook event: ${eventType}`, {
            eventType,
            objectId: eventData.id,
            status: eventData.status,
        });

        switch (eventType) {
            case 'payment_intent.succeeded':
                this.logger.log('Payment succeeded', { paymentIntentId: eventData.id });
                break;
            case 'payment_intent.payment_failed':
                this.logger.log('Payment failed', { paymentIntentId: eventData.id });
                break;
            case 'payment_link.paid':
                this.logger.log('Payment link paid', { paymentLinkId: eventData.id });
                break;
            default:
                this.logger.log(`Unhandled webhook event: ${eventType}`);
        }
    }

    /**
     * Create refund for a payment
     */
    async createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<any> {
        const refundData: any = {
            payment_intent: paymentIntentId,
        };

        if (amount) {
            refundData.amount = amount;
        }

        if (reason) {
            refundData.reason = reason;
        }

        this.logger.log('Creating refund', {
            paymentIntentId,
            amount,
            reason,
        });

        return await this.makeApiRequest<any>('POST', '/v1/refunds', refundData);
    }

    /**
     * Get dispute details
     */
    async getDispute(disputeId: string): Promise<any> {
        return await this.makeApiRequest<any>('GET', `/v1/disputes/${disputeId}`);
    }

    /**
     * Update dispute with evidence
     */
    async updateDispute(disputeId: string, evidence: any): Promise<any> {
        this.logger.log('Updating dispute with evidence', { disputeId });
        return await this.makeApiRequest<any>('POST', `/v1/disputes/${disputeId}`, evidence);
    }
}
