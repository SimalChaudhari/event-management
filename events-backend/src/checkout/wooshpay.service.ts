import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
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
  return_url?: string;
  cancel_url?: string;
  metadata: Record<string, any>;
  confirm?: boolean;
  payment_method?: string;
  customer?: string;
  description?: string;
}

export interface InAppPaymentData {
  amount: number;
  currency: string;
  merchant_order_id: string;
  payment_method: string;
  customer_email: string;
  customer_name?: string;
  description?: string;
  metadata: Record<string, any>;
  save_payment_method?: boolean;
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
      baseUrl:
        process.env.WOOSHPay_TEST_MODE === 'true'
          ? 'https://apitest.wooshpay.com'
          : 'https://api.wooshpay.com',
      secretKey: process.env.WOOSHPay_API_KEY || '',
      testMode: process.env.WOOSHPay_TEST_MODE === 'true',
      webhookSecret: process.env.WOOSHPay_WEBHOOK_SECRET,
    };


    if (!config.secretKey) {
      throw new BadRequestException(
        'WooShPay API key not configured. Please set WOOSHPay_API_KEY in your .env file. ' +
          'Get your API key from WooShPay dashboard.',
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
    data?: any,
  ): Promise<T> {
    const config = this.getConfig();
    const basicAuth = this.createAuthHeader(process.env.WOOSHPay_SECRET_KEY || '');

    const requestConfig = {
      method,
      url: `${config.baseUrl}${endpoint}`,
      headers: {
        Authorization: `Basic ${basicAuth}`,
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
        throw new BadRequestException(
          'WooShPay authentication failed. Check API key.',
        );
      } else if (error.response?.status === 403) {
        throw new BadRequestException(
          'WooShPay access denied. Check permissions.',
        );
      } else if (error.response?.status === 400) {
        throw new BadRequestException(
          `WooShPay validation error: ${error.response?.data?.message || 'Invalid request'}`,
        );
      } else if (error.response?.status === 422) {
        throw new BadRequestException(
          `WooShPay parameter error: ${error.response?.data?.message || 'Invalid parameters'}`,
        );
      } else if (error.response?.status === 429) {
        // Rate limit exceeded
        this.logger.warn('WooShPay rate limit exceeded. Please wait 1 minute before retrying.');
        throw new BadRequestException(
          'WooShPay rate limit exceeded. Please wait 1 minute before retrying. For higher limits, complete KYC at https://dashboard.wooshpay.com',
        );
      }

      throw new InternalServerErrorException(
        `WooShPay API error: ${error.message}`,
      );
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

    // Ensure required URLs are provided
    const paymentIntentData = {
      ...data,
      return_url: data.return_url || `${process.env.FRONTEND_URL || 'https://example.com'}/payment/success`,
      cancel_url: data.cancel_url || `${process.env.FRONTEND_URL || 'https://example.com'}/payment/cancel`,
    };

    const paymentIntent = await this.makeApiRequest<any>(
      'POST',
      '/v1/payment_intents',
      paymentIntentData,
    );

    // Log test card information in test mode
    if (config.testMode) {
      this.logger.log('🧪 TEST MODE - Available test cards:');
      this.logger.log('✅ Success: 4111111111111111, Exp: 12/25, CVV: 123');
      this.logger.log('❌ Decline: 4000000000000002, Exp: 12/25, CVV: 123');
    }

    return paymentIntent;
  }



  /**
   * Retrieve PaymentIntent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<any> {
    return await this.makeApiRequest<any>(
      'GET',
      `/v1/payment_intents/${paymentIntentId}`,
    );
  }



  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const config = this.getConfig();

    if (!config.webhookSecret) {
      this.logger.warn(
        'Webhook secret not configured - skipping signature verification',
      );
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
        Buffer.from(providedSignature, 'hex'),
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
   * Handle webhook events (legacy method for basic logging)
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
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<any> {
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
    return await this.makeApiRequest<any>(
      'POST',
      `/v1/disputes/${disputeId}`,
      evidence,
    );
  }

  /**
   * Create Payment Method (WooShPay Payment Methods API)
   * Based on: https://docs.wooshpay.com/112149659e0
   */
  async createPaymentMethod(paymentMethodData: {
    type: 'card';
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
    billing_details?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        city?: string;
        country?: string;
        line1?: string;
        line2?: string;
        postal_code?: string;
        state?: string;
      };
    };
    metadata?: Record<string, any>;
  }): Promise<any> {
    this.logger.log('Creating Payment Method with WooShPay', {
      type: paymentMethodData.type,
      hasCard: !!paymentMethodData.card,
      hasBilling: !!paymentMethodData.billing_details,
    });

    const paymentMethod = await this.makeApiRequest<any>(
      'POST',
      '/v1/payment_methods',
      paymentMethodData,
    );

    this.logger.log('Payment Method created successfully', {
      id: paymentMethod.id,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
    });

    return paymentMethod;
  }

  /**
   * Retrieve Payment Method details
   */
  async getPaymentMethodDetails(paymentMethodId: string): Promise<any> {
    return await this.makeApiRequest<any>(
      'GET',
      `/v1/payment_methods/${paymentMethodId}`,
    );
  }

  /**
   * Update Payment Method
   */
  async updatePaymentMethod(
    paymentMethodId: string,
    updateData: {
      billing_details?: any;
      metadata?: Record<string, any>;
    },
  ): Promise<any> {
    this.logger.log('Updating Payment Method', { paymentMethodId });
    return await this.makeApiRequest<any>(
      'POST',
      `/v1/payment_methods/${paymentMethodId}`,
      updateData,
    );
  }

  /**
   * List all Payment Methods
   */
  async listPaymentMethods(customerId?: string, type?: string): Promise<any> {
    const params = new URLSearchParams();
    if (customerId) params.append('customer', customerId);
    if (type) params.append('type', type);

    const endpoint = `/v1/payment_methods${params.toString() ? `?${params.toString()}` : ''}`;
    
    return await this.makeApiRequest<any>('GET', endpoint);
  }

  /**
   * Attach Payment Method to Customer
   */
  async attachPaymentMethodToCustomer(
    paymentMethodId: string,
    customerId: string,
  ): Promise<any> {
    this.logger.log('Attaching Payment Method to Customer', {
      paymentMethodId,
      customerId,
    });

    return await this.makeApiRequest<any>(
      'POST',
      `/v1/payment_methods/${paymentMethodId}/attach`,
      { customer: customerId },
    );
  }

  /**
   * Detach Payment Method from Customer
   */
  async detachPaymentMethodFromCustomer(paymentMethodId: string): Promise<any> {
    this.logger.log('Detaching Payment Method from Customer', {
      paymentMethodId,
    });

    return await this.makeApiRequest<any>(
      'POST',
      `/v1/payment_methods/${paymentMethodId}/detach`,
    );
  }

  /**
   * Create Customer for Payment Method storage
   */
  async createCustomer(customerData: {
    email: string;
    name?: string;
    phone?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    this.logger.log('Creating WooShPay Customer', {
      email: customerData.email,
      name: customerData.name,
    });

    return await this.makeApiRequest<any>('POST', '/v1/customers', customerData);
  }

  /**
   * Retrieve Customer details
   */
  async getCustomer(customerId: string): Promise<any> {
    return await this.makeApiRequest<any>('GET', `/v1/customers/${customerId}`);
  }

  /**
   * Create Payment Intent for In-App Payment (Direct API)
   * This processes payment directly without external redirects
   */
  async createInAppPaymentIntent(data: InAppPaymentData): Promise<any> {
    const config = this.getConfig();

    this.logger.log('Creating In-App Payment Intent', {
      amount: data.amount,
      currency: data.currency,
      merchant_order_id: data.merchant_order_id,
      customer_email: data.customer_email,
      testMode: config.testMode,
    });

    const paymentIntentData = {
      amount: data.amount,
      currency: data.currency,
      merchant_order_id: data.merchant_order_id,
      payment_method: data.payment_method,
      confirm: true, // Confirm immediately for in-app payment
      description: data.description || `Event Registration - ${data.merchant_order_id}`,
      metadata: data.metadata,
      customer_email: data.customer_email,
      customer_name: data.customer_name,
      save_payment_method: data.save_payment_method || false,
      // Provide return URLs for in-app payments (required by WooShPay API)
      return_url: `${process.env.FRONTEND_URL || 'https://example.com'}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://example.com'}/payment/cancel`,
    };

    const paymentIntent = await this.makeApiRequest<any>(
      'POST',
      '/v1/payment_intents',
      paymentIntentData,
    );

    this.logger.log('In-App Payment Intent created successfully', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    // Log test card information in test mode
    if (config.testMode) {
      this.logger.log('🧪 TEST MODE - Available test cards for in-app payment:');
      this.logger.log('✅ Success: 4111111111111111, Exp: 12/25, CVV: 123');
      this.logger.log('❌ Decline: 4000000000000002, Exp: 12/25, CVV: 123');
      this.logger.log('🔐 3D Secure: 4000002500003155, Exp: 12/25, CVV: 123');
    }

    return paymentIntent;
  }

  /**
   * Confirm Payment Intent (for handling 3D Secure or additional authentication)
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<any> {
    this.logger.log('Confirming Payment Intent', {
      paymentIntentId,
      paymentMethodId,
    });

    const confirmData: any = {};
    if (paymentMethodId) {
      confirmData.payment_method = paymentMethodId;
    }

    const paymentIntent = await this.makeApiRequest<any>(
      'POST',
      `/v1/payment_intents/${paymentIntentId}/confirm`,
      confirmData,
    );

    this.logger.log('Payment Intent confirmed', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      requires_action: paymentIntent.status === 'requires_action',
    });

    return paymentIntent;
  }

  /**
   * Create Payment Method with Card Details (for in-app payment)
   */
  async createPaymentMethodWithCard(cardData: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
    name?: string; // Cardholder name
    billing_details?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  }): Promise<any> {
    this.logger.log('Creating Payment Method with Card Details', {
      hasCard: !!cardData,
      hasBilling: !!cardData.billing_details,
    });

    const paymentMethodData = {
      type: 'card',
      card: {
        number: cardData.number,
        exp_month: cardData.exp_month,
        exp_year: cardData.exp_year,
        cvc: cardData.cvc,
        name: cardData.name || cardData.billing_details?.name, // Required by WooShPay
      },
      billing_details: cardData.billing_details,
    };

    const paymentMethod = await this.makeApiRequest<any>(
      'POST',
      '/v1/payment_methods',
      paymentMethodData,
    );

    this.logger.log('Payment Method created with card details', {
      id: paymentMethod.id,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
    });

    return paymentMethod;
  }

  /**
   * Process In-App Payment with Card Details (One-step payment)
   */
  async processInAppPaymentWithCard(
    amount: number,
    currency: string,
    cardData: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
      name?: string;
    },
    customerData: {
      email: string;
      name?: string;
    },
    metadata: Record<string, any> = {},
  ): Promise<any> {
    this.logger.log('Processing In-App Payment with Card', {
      amount,
      currency,
      customer_email: customerData.email,
    });

    // Step 1: Create Payment Method
    const paymentMethod = await this.createPaymentMethodWithCard({
      ...cardData,
      billing_details: {
        name: customerData.name,
        email: customerData.email,
      },
    });

    // Step 2: Create and confirm Payment Intent
    const paymentIntent = await this.createInAppPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      merchant_order_id: metadata.checkout_id || `inapp_${Date.now()}`,
      payment_method: paymentMethod.id,
      customer_email: customerData.email,
      customer_name: customerData.name,
      description: `Event Registration - ${metadata.checkout_id || 'In-App Payment'}`,
      metadata,
      save_payment_method: true,
      confirm: true,
    });

    return {
      paymentIntent,
      paymentMethod,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
      status: paymentIntent.status,
    };
  }

  /**
   * Process In-App Payment with Saved Payment Method
   */
  async processInAppPaymentWithSavedMethod(
    amount: number,
    currency: string,
    paymentMethodId: string,
    customerEmail: string,
    metadata: Record<string, any> = {},
  ): Promise<any> {
    this.logger.log('Processing In-App Payment with Saved Method', {
      amount,
      currency,
      paymentMethodId,
      customer_email: customerEmail,
    });

    const paymentIntent = await this.createInAppPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      merchant_order_id: metadata.checkout_id || `inapp_${Date.now()}`,
      payment_method: paymentMethodId,
      customer_email: customerEmail,
      description: `Event Registration - ${metadata.checkout_id || 'In-App Payment'}`,
      metadata,
      confirm: true,
    });

    return {
      paymentIntent,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
      status: paymentIntent.status,
    };
  }
}
