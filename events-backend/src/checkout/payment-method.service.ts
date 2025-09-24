import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPaymentMethod, CardBrand, CardFunding } from './payment-method.entity';
import { UserEntity } from 'user/users.entity';
import { Checkout } from './checkout.entity';
import { WooShPayService } from './wooshpay.service';
import { CARD_TYPES } from '../utils/card-validation.utils';
import { ErrorHandlerUtil } from '../utils/error-handler.util';

export interface WooShPayCardData {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  country: string;
  funding: string;
  fingerprint: string;
}

export interface WooShPayBillingDetails {
  name: string;
  email: string;
  phone: string;
  address: {
    city: string;
    country: string;
    line1: string;
    line2: string;
    postal_code: string;
    state: string;
  };
}

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(UserPaymentMethod)
    private paymentMethodRepository: Repository<UserPaymentMethod>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Checkout)
    private checkoutRepository: Repository<Checkout>,
    private wooShPayService: WooShPayService,
  ) {}

  /**
   * Check if user already has this card (prevent duplicates for same user)
   */
  async checkDuplicateCard(userId: string, cardFingerprint: string): Promise<UserPaymentMethod | null> {
    if (!cardFingerprint) return null;
    
    const existingPaymentMethod = await this.paymentMethodRepository.findOne({
      where: { 
        userId, 
        fingerprint: cardFingerprint, 
        isDeleted: false,
        isActive: true 
      }
    });
    
    return existingPaymentMethod;
  }

  /**
   * Store payment method from WooShPay webhook/response
   * Based on WooShPay Payment Methods API documentation
   */
  async storePaymentMethodFromWooShPay(
    userId: string,
    wooshpayPaymentMethodId: string,
    cardData: WooShPayCardData,
    billingDetails?: WooShPayBillingDetails,
    wooshpayCustomerId?: string,
    shouldSave: boolean = true,
  ): Promise<UserPaymentMethod | null> {
    // If user doesn't want to save card, return null
    if (!shouldSave) {
      console.log('💳 User chose not to save payment method');
      return null;
    }
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for duplicate card for this user (same fingerprint)
    const duplicateCard = await this.checkDuplicateCard(userId, cardData.fingerprint);
    if (duplicateCard) {
      console.log('💳 Duplicate card detected for user, updating existing payment method:', {
        existingId: duplicateCard.id,
        wooshpayId: duplicateCard.wooshpayPaymentMethodId,
        newWooshpayId: wooshpayPaymentMethodId
      });
      
      // Update existing payment method with new WooShPay ID
      duplicateCard.wooshpayPaymentMethodId = wooshpayPaymentMethodId;
      duplicateCard.wooshpayCustomerId = wooshpayCustomerId;
      duplicateCard.usageCount += 1;
      duplicateCard.lastUsedAt = new Date();
      
      const updatedPaymentMethod = await this.paymentMethodRepository.save(duplicateCard);
      console.log('✅ Updated existing payment method');
      return updatedPaymentMethod;
    }

    // Check if payment method already exists (different user, same WooShPay ID)
    const existingPaymentMethod = await this.paymentMethodRepository.findOne({
      where: {
        wooshpayPaymentMethodId,
        isDeleted: false,
      },
    });

    if (existingPaymentMethod) {
      console.log('💳 Payment method already exists for different user, creating new entry');
      // Continue with creating new payment method for this user
    }

    // Map WooShPay card brand to our enum
    const brand = this.mapCardBrand(cardData.brand);
    const funding = this.mapCardFunding(cardData.funding);
    
    // Get CVV length for the card brand
    const cardType = CARD_TYPES[cardData.brand.toLowerCase()] || CARD_TYPES.unknown;
    const cvvLength = cardType.cvvLength;

    // Create new payment method
    const paymentMethod = this.paymentMethodRepository.create({
      user,
      userId,
      wooshpayPaymentMethodId,
      wooshpayCustomerId,
      last4: cardData.last4,
      brand,
      funding,
      expMonth: cardData.exp_month,
      expYear: cardData.exp_year,
      cvvLength,
      country: cardData.country,
      fingerprint: cardData.fingerprint,
      billingName: billingDetails?.name,
      billingEmail: billingDetails?.email,
      billingPhone: billingDetails?.phone,
      usageCount: 1,
      lastUsedAt: new Date(),
      isActive: true,
    });

    // If this is user's first payment method, make it default
    const userPaymentMethodsCount = await this.paymentMethodRepository.count({
      where: { userId, isDeleted: false },
    });

    if (userPaymentMethodsCount === 0) {
      paymentMethod.isDefault = true;
    } else if (shouldSave) {
      // If user is saving a new card, make it default (Amazon/Flipkart style)
      paymentMethod.isDefault = true;
      // Remove default from all other user's payment methods
      await this.paymentMethodRepository.update(
        { userId },
        { isDefault: false },
      );
    }

    const savedPaymentMethod = await this.paymentMethodRepository.save(paymentMethod);

    console.log('💳 Payment method stored from WooShPay:', {
      id: savedPaymentMethod.id,
      displayName: savedPaymentMethod.getDisplayName(),
      wooshpayId: wooshpayPaymentMethodId,
      isDefault: savedPaymentMethod.isDefault,
    });

    return savedPaymentMethod;
  }

  /**
   * Extract payment method from WooShPay webhook data
   */
  async extractAndStoreFromWebhook(
    userId: string,
    webhookData: any,
  ): Promise<UserPaymentMethod | null> {
    try {
      console.log('🔍 Full webhook data for payment method extraction:', JSON.stringify(webhookData, null, 2));
      
      const eventData = webhookData.data?.object;
      
      // Try to get payment method from different webhook structures
      let paymentMethodId = eventData?.payment_method;
      let paymentMethod = null;
      let cardData = null;
      let billingDetails = null;

      console.log('🔍 Initial payment method check:', {
        hasPaymentMethod: !!paymentMethodId,
        paymentMethodId: paymentMethodId,
        paymentMethodType: typeof paymentMethodId,
      });

      // If payment_method is a string ID, fetch the full details
      if (typeof paymentMethodId === 'string' && paymentMethodId.startsWith('pm_')) {
        console.log('🔍 Payment method is ID string, fetching details from WooShPay API...');
        try {
          const pmDetails = await this.wooShPayService.getPaymentMethodDetails(paymentMethodId);
          paymentMethod = pmDetails;
          cardData = pmDetails.card;
          billingDetails = pmDetails.billing_details;
          console.log('✅ Retrieved payment method details from WooShPay API');
        } catch (error: any) {
          console.log('⚠️ Could not retrieve payment method details from API:', error.message);
          // Use ErrorHandlerUtil for proper error handling
          ErrorHandlerUtil.handleError(error, 'Failed to retrieve payment method details');
        }
      } else if (typeof paymentMethodId === 'object') {
        // If payment_method is an object, use it directly
        paymentMethod = paymentMethodId;
        cardData = paymentMethod?.card;
        billingDetails = paymentMethod?.billing_details;
        paymentMethodId = paymentMethod?.id;
      }

      // If not found, try charges structure
      if (!paymentMethod) {
        console.log('🔍 Checking charges structure...');
        const charges = eventData?.charges?.data?.[0];
        if (charges?.payment_method_details?.card) {
          cardData = charges.payment_method_details.card;
          paymentMethod = { id: charges.payment_method };
          billingDetails = charges.billing_details;
          console.log('✅ Found payment method in charges structure');
        }
      }

      // If still not found, try latest_charge structure
      if (!paymentMethod && eventData?.latest_charge) {
        console.log('🔍 Checking latest_charge structure...');
        const charge = eventData.latest_charge;
        if (charge.payment_method_details?.card) {
          cardData = charge.payment_method_details.card;
          paymentMethod = { id: charge.payment_method };
          billingDetails = charge.billing_details;
          console.log('✅ Found payment method in latest_charge structure');
        }
      }

      if (!cardData || !paymentMethodId) {
        console.log('❌ No payment method data found in webhook after all attempts');
        console.log('📊 Available webhook fields:', Object.keys(eventData || {}));
        return null;
      }

      console.log('🔍 Final extracted payment method:', {
        paymentMethodId: paymentMethodId,
        last4: cardData.last4,
        brand: cardData.brand,
        funding: cardData.funding,
        expMonth: cardData.exp_month,
        expYear: cardData.exp_year,
      });

      return await this.storePaymentMethodFromWooShPay(
        userId,
        paymentMethodId,
        {
          brand: cardData.brand || 'unknown',
          last4: cardData.last4 || '0000',
          exp_month: cardData.exp_month || 12,
          exp_year: cardData.exp_year || 2025,
          country: cardData.country || 'US',
          funding: cardData.funding || 'credit',
          fingerprint: cardData.fingerprint || '',
        },
        billingDetails,
        eventData?.customer,
      );

    } catch (error: any) {
      console.error('❌ Error extracting payment method from webhook:', error.message);
      console.error('❌ Full error:', error);
      // Use ErrorHandlerUtil for proper error handling
      ErrorHandlerUtil.handleError(error, 'Failed to extract payment method from webhook');
      return null;
    }
  }

  /**
   * Get usage statistics for a payment method
   */
  private getUsageStats(paymentMethod: UserPaymentMethod): any {
    const now = new Date();
    const lastUsed = paymentMethod.lastUsedAt;
    const createdAt = paymentMethod.createdAt;
    
    // Calculate days since last use
    const daysSinceLastUse = lastUsed 
      ? Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    // Calculate days since creation
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate usage frequency
    const usageFrequency = daysSinceCreated > 0 
      ? Math.round((paymentMethod.usageCount / daysSinceCreated) * 30) // Uses per month
      : 0;
    
    // Usage status
    let usageStatus = 'new';
    if (paymentMethod.usageCount > 10) usageStatus = 'frequent';
    else if (paymentMethod.usageCount > 3) usageStatus = 'regular';
    else if (paymentMethod.usageCount > 1) usageStatus = 'occasional';
    
    // Last used display
    let lastUsedDisplay = 'Never used';
    if (lastUsed && daysSinceLastUse !== null) {
      if (daysSinceLastUse === 0) lastUsedDisplay = 'Today';
      else if (daysSinceLastUse === 1) lastUsedDisplay = 'Yesterday';
      else if (daysSinceLastUse < 7) lastUsedDisplay = `${daysSinceLastUse} days ago`;
      else if (daysSinceLastUse < 30) lastUsedDisplay = `${Math.floor(daysSinceLastUse / 7)} weeks ago`;
      else if (daysSinceLastUse < 365) lastUsedDisplay = `${Math.floor(daysSinceLastUse / 30)} months ago`;
      else lastUsedDisplay = `${Math.floor(daysSinceLastUse / 365)} years ago`;
    }
    
    return {
      totalUses: paymentMethod.usageCount,
      lastUsedDisplay,
      daysSinceLastUse,
      daysSinceCreated,
      usageFrequency,
      usageStatus,
      isRecentlyUsed: daysSinceLastUse !== null && daysSinceLastUse < 30,
      isFrequentlyUsed: paymentMethod.usageCount > 5
    };
  }

  /**
   * Get user's saved payment methods with usage statistics
   */
  async getUserPaymentMethods(userId: string): Promise<any[]> {
    const paymentMethods = await this.paymentMethodRepository.find({
      where: { userId, isDeleted: false, isActive: true },
      order: { isDefault: 'DESC', lastUsedAt: 'DESC' },
    });

    return paymentMethods.map((pm) => ({
      id: pm.id,
      wooshpayPaymentMethodId: pm.wooshpayPaymentMethodId,
      displayName: pm.getDisplayName(),
      maskedCardNumber: pm.getMaskedCardNumber(),
      cardIcon: pm.getCardIcon(),
      brand: pm.brand,
      funding: pm.funding,
      expiryDisplay: pm.getExpiryDisplay(),
      isDefault: pm.isDefault,
      isExpired: pm.isExpired(),
      usageCount: pm.usageCount,
      lastUsedAt: pm.lastUsedAt,
      usageStats: this.getUsageStats(pm),
      nickname: pm.nickname,
      country: pm.country,
      createdAt: pm.createdAt,
    }));
  }

  /**
   * Get usage statistics for a specific payment method
   */
  async getPaymentMethodUsageStats(userId: string, paymentMethodId: string): Promise<any> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId, isDeleted: false, isActive: true }
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    return {
      paymentMethod: {
        id: paymentMethod.id,
        displayName: paymentMethod.getDisplayName(),
        maskedCardNumber: paymentMethod.getMaskedCardNumber(),
        brand: paymentMethod.brand,
        expiryDisplay: paymentMethod.getExpiryDisplay(),
      },
      usageStats: this.getUsageStats(paymentMethod),
      usageHistory: await this.getUsageHistory(paymentMethod.id)
    };
  }

  /**
   * Get usage history for a payment method (optional - can be enhanced with order history)
   */
  private async getUsageHistory(paymentMethodId: string): Promise<any[]> {
    // This could be enhanced to show actual payment history from orders
    // For now, return basic usage info
    return [];
  }

  /**
   * Get default payment method
   */
  async getDefaultPaymentMethod(userId: string): Promise<UserPaymentMethod | null> {
    return await this.paymentMethodRepository.findOne({
      where: { userId, isDefault: true, isDeleted: false, isActive: true },
    });
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    // Remove default from all user's payment methods
    await this.paymentMethodRepository.update(
      { userId },
      { isDefault: false },
    );

    // Set new default
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId, isDeleted: false },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    paymentMethod.isDefault = true;
    await this.paymentMethodRepository.save(paymentMethod);
  }

  /**
   * Delete payment method (soft delete)
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId, isDeleted: false },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Soft delete
    paymentMethod.isDeleted = true;
    paymentMethod.isActive = false;
    await this.paymentMethodRepository.save(paymentMethod);

    // If this was default, set another as default
    if (paymentMethod.isDefault) {
      const nextPaymentMethod = await this.paymentMethodRepository.findOne({
        where: { userId, isDeleted: false, isActive: true },
        order: { lastUsedAt: 'DESC' },
      });

      if (nextPaymentMethod) {
        nextPaymentMethod.isDefault = true;
        await this.paymentMethodRepository.save(nextPaymentMethod);
      }
    }
  }

  /**
   * Update payment method nickname
   */
  async updateNickname(
    userId: string,
    paymentMethodId: string,
    nickname: string,
  ): Promise<UserPaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId, isDeleted: false },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    paymentMethod.nickname = nickname;
    return await this.paymentMethodRepository.save(paymentMethod);
  }

  /**
   * Create payment using saved payment method token
   */
  async createPaymentWithSavedMethod(
    userId: string,
    paymentMethodId: string,
    amount: number,
    currency: string = 'USD',
    checkoutId: string,
  ): Promise<any> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId, isDeleted: false, isActive: true },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Saved payment method not found');
    }

    if (paymentMethod.isExpired()) {
      throw new BadRequestException('Payment method has expired');
    }

    // Create payment intent with saved payment method token
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      merchant_order_id: checkoutId,
      return_url: `${process.env.FRONTEND_URL || 'https://example.com'}/payment/success?checkout_id=${checkoutId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://example.com'}/payment/cancel?checkout_id=${checkoutId}`,
      payment_method: paymentMethod.wooshpayPaymentMethodId,
      confirm: true,
      metadata: {
        checkout_id: checkoutId,
        user_id: userId,
        saved_payment_method: 'true',
      },
    };

    console.log('💳 Creating payment with saved method:', {
      paymentMethodId: paymentMethod.wooshpayPaymentMethodId,
      displayName: paymentMethod.getDisplayName(),
      amount: amount,
    });

    const paymentIntent = await this.wooShPayService.createPaymentIntent(paymentIntentData);

    // Update usage tracking
    paymentMethod.usageCount += 1;
    paymentMethod.lastUsedAt = new Date();
    await this.paymentMethodRepository.save(paymentMethod);

    // Enhanced response with next action instructions
    const response = {
      ...paymentIntent,
      nextAction: paymentIntent.status === 'requires_action' ? {
        type: 'redirect_to_url',
        redirectUrl: paymentIntent.next_action?.redirect_to_url?.url || 
                    `https://checkout.wooshpay.com/confirm/${paymentIntent.id}?client_secret=${paymentIntent.client_secret}`,
        instructions: 'User needs to complete 3D Secure authentication'
      } : null,
      paymentMethodUsed: {
        displayName: paymentMethod.getDisplayName(),
        maskedCard: paymentMethod.getMaskedCardNumber(),
        isDefault: paymentMethod.isDefault,
      }
    };

    console.log('📊 Payment Intent Response:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      requiresAction: paymentIntent.status === 'requires_action',
      nextActionUrl: response.nextAction?.redirectUrl,
    });

    return response;
  }

  /**
   * Map WooShPay card brand to our enum
   */
  private mapCardBrand(brand: string): CardBrand {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return CardBrand.VISA;
      case 'mastercard':
        return CardBrand.MASTERCARD;
      case 'amex':
      case 'american_express':
        return CardBrand.AMEX;
      case 'discover':
        return CardBrand.DISCOVER;
      case 'diners':
        return CardBrand.DINERS;
      case 'jcb':
        return CardBrand.JCB;
      case 'unionpay':
        return CardBrand.UNIONPAY;
      default:
        return CardBrand.UNKNOWN;
    }
  }

  /**
   * Map WooShPay funding type to our enum
   */
  private mapCardFunding(funding: string): CardFunding {
    switch (funding?.toLowerCase()) {
      case 'credit':
        return CardFunding.CREDIT;
      case 'debit':
        return CardFunding.DEBIT;
      case 'prepaid':
        return CardFunding.PREPAID;
      default:
        return CardFunding.UNKNOWN;
    }
  }

  /**
   * Create WooShPay customer
   */
  async createWooShPayCustomer(customerData: {
    email: string;
    name?: string;
    phone?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    return await this.wooShPayService.createCustomer(customerData);
  }

  /**
   * Get payment method by ID
   */
  async getPaymentMethodById(userId: string, paymentMethodId: string): Promise<UserPaymentMethod | null> {
    return await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId, isDeleted: false, isActive: true },
    });
  }


  /**
   * Create WooShPay payment method
   */
  async createWooShPayPaymentMethod(paymentMethodData: any): Promise<any> {
    return await this.wooShPayService.createPaymentMethod(paymentMethodData);
  }

  /**
   * Create and save a new payment method without processing payment
   * This is for adding cards to user's saved payment methods
   */
  async createAndSavePaymentMethod(
    userId: string,
    cardData: {
      cardNumber: string;
      expMonth: number;
      expYear: number;
      cvc: string;
      cardholderName?: string;
      billingEmail?: string;
      billingPhone?: string;
      nickname?: string;
      setAsDefault?: boolean;
    }
  ): Promise<{ paymentMethod: UserPaymentMethod; isDuplicate: boolean; message: string }> {
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create WooShPay payment method (this doesn't charge the card)
    const wooshpayPaymentMethod = await this.wooShPayService.createPaymentMethod({
      type: 'card',
      card: {
        number: cardData.cardNumber,
        exp_month: cardData.expMonth,
        exp_year: cardData.expYear,
        cvc: cardData.cvc,
      },
      billing_details: {
        name: cardData.cardholderName,
        email: cardData.billingEmail,
        phone: cardData.billingPhone,
      },
      metadata: {
        user_id: userId,
        created_for_saving: 'true',
      },
    });

    console.log('💳 WooShPay payment method created for saving:', {
      id: wooshpayPaymentMethod.id,
      last4: wooshpayPaymentMethod.card?.last4,
      brand: wooshpayPaymentMethod.card?.brand,
    });

    // Check for duplicate card for this user (same fingerprint)
    const duplicateCard = await this.checkDuplicateCard(userId, wooshpayPaymentMethod.card?.fingerprint);
    if (duplicateCard) {
      console.log('💳 Duplicate card detected for user, updating existing payment method');
      
      // Update existing payment method with new WooShPay ID
      duplicateCard.wooshpayPaymentMethodId = wooshpayPaymentMethod.id;
      duplicateCard.nickname = cardData.nickname || duplicateCard.nickname;
      
      // Set as default if requested
      if (cardData.setAsDefault) {
        // Remove default from all user's payment methods
        await this.paymentMethodRepository.update(
          { userId },
          { isDefault: false },
        );
        duplicateCard.isDefault = true;
      }
      
      const updatedPaymentMethod = await this.paymentMethodRepository.save(duplicateCard);
      console.log('✅ Updated existing payment method');
      return {
        paymentMethod: updatedPaymentMethod,
        isDuplicate: true,
        message: 'This card already exists in your saved payment methods and has been updated'
      };
    }

    // Map WooShPay card brand to our enum
    const brand = this.mapCardBrand(wooshpayPaymentMethod.card?.brand);
    const funding = this.mapCardFunding(wooshpayPaymentMethod.card?.funding);
    
    // Get CVV length for the card brand
    const cardType = CARD_TYPES[wooshpayPaymentMethod.card?.brand?.toLowerCase()] || CARD_TYPES.unknown;
    const cvvLength = cardType.cvvLength;

    // Check if this should be set as default
    const shouldSetAsDefault = cardData.setAsDefault !== false; // Default to true unless explicitly false
    let isDefault = shouldSetAsDefault;

    // If setting as default, remove default from all other user's payment methods
    if (isDefault) {
      await this.paymentMethodRepository.update(
        { userId },
        { isDefault: false },
      );
    } else {
      // If not setting as default, check if user has any payment methods
      const userPaymentMethodsCount = await this.paymentMethodRepository.count({
        where: { userId, isDeleted: false },
      });
      // If this is user's first payment method, make it default anyway
      isDefault = userPaymentMethodsCount === 0;
    }

    // Create new payment method
    const paymentMethod = this.paymentMethodRepository.create({
      userId,
      wooshpayPaymentMethodId: wooshpayPaymentMethod.id,
      wooshpayCustomerId: wooshpayPaymentMethod.customer,
      last4: wooshpayPaymentMethod.card?.last4,
      brand,
      funding,
      expMonth: wooshpayPaymentMethod.card?.exp_month,
      expYear: wooshpayPaymentMethod.card?.exp_year,
      cvvLength,
      country: wooshpayPaymentMethod.card?.country,
      fingerprint: wooshpayPaymentMethod.card?.fingerprint,
      billingName: cardData.cardholderName,
      billingEmail: cardData.billingEmail,
      billingPhone: cardData.billingPhone,
      nickname: cardData.nickname,
      isDefault,
      usageCount: 0, // New card, not used yet
      lastUsedAt: undefined, // New card, not used yet
      isActive: true,
    });

    const savedPaymentMethod = await this.paymentMethodRepository.save(paymentMethod);

    console.log('💳 Payment method created and saved:', {
      id: savedPaymentMethod.id,
      displayName: savedPaymentMethod.getDisplayName(),
      wooshpayId: wooshpayPaymentMethod.id,
      isDefault: savedPaymentMethod.isDefault,
      nickname: savedPaymentMethod.nickname,
    });

    return {
      paymentMethod: savedPaymentMethod,
      isDuplicate: false,
      message: 'Card added to your saved payment methods successfully'
    };
  }

  /**
   * Update existing payment method details
   */
  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    updateData: {
      cardholderName?: string;
      billingEmail?: string;
      billingPhone?: string;
      nickname?: string;
      setAsDefault?: boolean;
    }
  ): Promise<UserPaymentMethod> {
    // Find the payment method
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId, isDeleted: false, isActive: true },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Update fields if provided
    if (updateData.cardholderName !== undefined) {
      paymentMethod.billingName = updateData.cardholderName;
    }
    if (updateData.billingEmail !== undefined) {
      paymentMethod.billingEmail = updateData.billingEmail;
    }
    if (updateData.billingPhone !== undefined) {
      paymentMethod.billingPhone = updateData.billingPhone;
    }
    if (updateData.nickname !== undefined) {
      paymentMethod.nickname = updateData.nickname;
    }

    // Handle default setting
    if (updateData.setAsDefault === true) {
      // Remove default from all user's payment methods
      await this.paymentMethodRepository.update(
        { userId },
        { isDefault: false },
      );
      paymentMethod.isDefault = true;
    }

    const updatedPaymentMethod = await this.paymentMethodRepository.save(paymentMethod);

    console.log('💳 Payment method updated:', {
      id: updatedPaymentMethod.id,
      displayName: updatedPaymentMethod.getDisplayName(),
      nickname: updatedPaymentMethod.nickname,
      isDefault: updatedPaymentMethod.isDefault,
    });

    return updatedPaymentMethod;
  }
}
