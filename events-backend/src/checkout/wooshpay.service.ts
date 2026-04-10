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

/** WooShPay payment_intent_data – billing and shipping shown on Payment page */
export interface WooShPayBillingDetails {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface WooShPayShippingDetails {
  name?: string;
  phone?: string;
  carrier?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface CheckoutSessionData {
  cancel_url: string;
  success_url: string;
  mode: 'payment';
  customer?: string;
  payment_method?: string;
  default_payment_method?: string;
  line_items: Array<{
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; description?: string };
    };
    quantity: number;
  }>;
  metadata?: Record<string, any>;
  /** When set, billing/shipping show on WooShPay Payment page; only pass when user has address */
  billing_address_collection?: 'required' | 'auto';
  shipping_address_collection?: { allowed_countries: string[] };
  payment_method_types?: string[];
  payment_intent_data?: {
    billing_details?: WooShPayBillingDetails;
    shipping?: WooShPayShippingDetails;
  };
}

/** WooShPay customer create payload - all fields optional except email recommended */
export interface WooShPayCustomerData {
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  address?: {
    city?: string;
    country?: string;
    line1?: string;
    line2?: string;
    postal_code?: string;
    state?: string;
  };
  shipping?: {
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
    name?: string;
    phone?: string;
  };
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
    const baseUrl =
      process.env.WOOSHPay_BASE_URL?.trim() ||
      (process.env.WOOSHPay_TEST_MODE === 'true' ? 'https://apitest.wooshpay.com' : 'https://api.wooshpay.com');
    const config: WooShPayConfig = {
      baseUrl,
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
   * Extract readable error message from WooShPay/axios payloads.
   */
  private extractApiMessage(error: any): string {
    const data = error?.response?.data;
    if (!data) return error?.message || 'Unknown error';
    if (typeof data === 'string') return data;
    return (
      data.message ||
      data.error_description ||
      data.error?.message ||
      data.error ||
      error?.message ||
      'Unknown error'
    );
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
    const basicAuth = this.createAuthHeader(config.secretKey);

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
      const apiMessage = this.extractApiMessage(error);
      this.logger.error(`API request failed`, {
        endpoint,
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.response?.data,
        readableError: apiMessage,
      });

      if (error.response?.status === 401) {
        throw new BadRequestException(
          'Payment service authentication failed. Please contact support or try again later.',
        );
      } else if (error.response?.status === 403) {
        throw new BadRequestException(
          'Payment service access denied. Please contact support.',
        );
      } else if (error.response?.status === 400) {
        throw new BadRequestException(
          `Invalid payment request: ${apiMessage}`,
        );
      } else if (error.response?.status === 422) {
        throw new BadRequestException(
          `Payment details are invalid: ${apiMessage}`,
        );
      } else if (error.response?.status === 429) {
        // Rate limit exceeded
        this.logger.warn('WooShPay rate limit exceeded. Please wait 1 minute before retrying.');
        throw new BadRequestException(
          'Too many payment requests right now. Please wait a minute and try again.',
        );
      } else if (error.response?.status === 402) {
        // Payment required / Refunds not enabled / Account limitation
        const msg = apiMessage
          ? `Payment cannot be processed: ${apiMessage}`
          : 'Payment cannot be processed for this account. Please contact support.';
        throw new BadRequestException(msg);
      } else if (error.response?.status >= 500) {
        throw new InternalServerErrorException(
          'Payment provider is temporarily unavailable. Please try again in a few minutes.',
        );
      }

      throw new InternalServerErrorException(
        `Payment processing failed: ${apiMessage}`,
      );
    }
  }

  /**
   * Verify webhook signature. Single WOOSHPay_WEBHOOK_SECRET (test account used in prod too).
   * Supports Stripe-style t=timestamp,v1=sig and plain HMAC-SHA256(payload); hex or base64.
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = process.env.WOOSHPay_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.warn('Webhook secret not configured - skipping signature verification');
      return true;
    }
    try {
      const raw = (signature || '').trim();
      if (!raw) return false;
      const tMatch = raw.match(/\bt=(\d+)/);
      const v1Match = raw.match(/\bv1=([a-zA-Z0-9+/=_-]+)/);
      const timestamp = tMatch ? tMatch[1] : null;
      let providedSignature = v1Match ? v1Match[1] : raw.replace(/^sha256=/, '').replace(/^v1=/, '').trim();
      if (!providedSignature) return false;

      let providedBuf = Buffer.from(providedSignature, 'hex');
      if (providedBuf.length === 0 && providedSignature.length > 0) {
        try {
          const base64 = providedSignature.replace(/-/g, '+').replace(/_/g, '/');
          providedBuf = Buffer.from(base64, 'base64');
        } catch {
          /* keep empty */
        }
      }

      const tryVerify = (signedPayload: string): boolean => {
        const expectedHex = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
        const expectedBuf = Buffer.from(expectedHex, 'hex');
        if (expectedBuf.length !== providedBuf.length) return false;
        return crypto.timingSafeEqual(expectedBuf, providedBuf);
      };
      if (timestamp) {
        if (tryVerify(`${timestamp}.${payload}`)) return true;
        if (tryVerify(payload)) return true;
        return false;
      }
      return tryVerify(payload);
    } catch {
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
      case 'checkout.session.completed':
        this.logger.log('Checkout session completed', { sessionId: eventData.id });
        break;
      case 'checkout.session.expired':
        this.logger.log('Checkout session expired (user did not complete in time)', {
          sessionId: eventData.id,
          checkoutId: eventData.metadata?.checkout_id,
        });
        break;
      case 'checkout.session.canceled':
        this.logger.log('Checkout session canceled (user refused payment)', {
          sessionId: eventData.id,
          checkoutId: eventData.metadata?.checkout_id,
        });
        break;
      case 'payment_link.paid':
        this.logger.log('Payment link paid', { paymentLinkId: eventData.id });
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${eventType}`);
    }
  }

  /**
   * Create refund for a payment (paymentId from checkout session / payment)
   */
  async createRefund(
    paymentId: string,
    amount?: number,
    reason?: string,
  ): Promise<any> {
    const refundData: any = {
      payment_intent: paymentId,
    };

    if (amount) {
      refundData.amount = amount;
    }

    if (reason) {
      refundData.reason = reason;
    }

    this.logger.log('Creating refund', {
      paymentId,
      amount,
      reason,
    });

    return await this.makeApiRequest<any>('POST', '/v1/refunds', refundData);
  }

  /**
   * Get refund details by ID (for user to track status)
   */
  async getRefund(refundId: string): Promise<any> {
    return await this.makeApiRequest<any>('GET', `/v1/refunds/${refundId}`);
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
   * Create Customer for Payment Method storage / Checkout Session flow
   * All fields optional; email recommended.
   */
  async createCustomer(customerData: WooShPayCustomerData): Promise<any> {
    this.logger.log('Creating WooShPay Customer', {
      email: customerData.email,
      name: customerData.name,
    });

    return await this.makeApiRequest<any>('POST', '/v1/customers', customerData);
  }

  /**
   * Create Checkout Session (redirect flow) – NOT Payment Intent.
   * POST https://apitest.wooshpay.com/v1/checkout/sessions
   * Body: { cancel_url, success_url, mode: "payment", customer: "cus_xxx", line_items }
   * Returns URL for user to complete payment on WooShPay hosted page.
   */
  async createCheckoutSession(data: CheckoutSessionData): Promise<any> {
    this.logger.log('Creating WooShPay Checkout Session', {
      mode: data.mode,
      customer: data.customer,
      lineItemsCount: data.line_items?.length ?? 0,
      payment_method: data.payment_method ?? '(none)',
      default_payment_method: data.default_payment_method ?? '(none)',
    });

    return await this.makeApiRequest<any>('POST', '/v1/checkout/sessions', data);
  }

  /**
   * Retrieve a Checkout Session by ID
   * GET /v1/checkout/sessions/{id}
   */
  async getCheckoutSession(sessionId: string): Promise<any> {
    return await this.makeApiRequest<any>('GET', `/v1/checkout/sessions/${sessionId}`);
  }

  /**
   * Expire a Checkout Session
   * POST /v1/checkout/sessions/{id}/expire
   */
  async expireCheckoutSession(sessionId: string): Promise<any> {
    return await this.makeApiRequest<any>('POST', `/v1/checkout/sessions/${sessionId}/expire`);
  }

  /**
   * List Checkout Sessions (retrieve all with optional limit)
   * GET /v1/checkout/sessions
   */
  async listCheckoutSessions(params?: { limit?: number }): Promise<any> {
    const query = params?.limit != null ? `?limit=${params.limit}` : '';
    return await this.makeApiRequest<any>('GET', `/v1/checkout/sessions${query}`);
  }

  /**
   * Retrieve Customer details
   */
  async getCustomer(customerId: string): Promise<any> {
    return await this.makeApiRequest<any>('GET', `/v1/customers/${customerId}`);
  }

  /**
   * Create Payment Method with Card Details (for saving card – not Payment Intent)
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
}
