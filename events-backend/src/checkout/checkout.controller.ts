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
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CheckoutService } from './checkout.service';
import { WooShPayService } from './wooshpay.service';
import { PaymentMethodService } from './payment-method.service';
import {
  validateCard,
  detectCardTypeRealtime,
} from '../utils/card-validation.utils';
import { ErrorHandlerUtil } from '../utils/error-handler.util';
import {
  CreateCheckoutDto,
  CheckoutStatus,
  PaymentGateway,
  InAppPaymentDto,
  InAppPaymentWithSavedMethodDto,
  UpdateCardDto,
} from './checkout.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';

@Controller('api/checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly wooShPayService: WooShPayService,
    private readonly paymentMethodService: PaymentMethodService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createCheckout(
    @Req() req: Request,
    @Body() dto: CreateCheckoutDto,
    @Res() response: Response,
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

  @Get('session/:checkoutId')
  async getCheckoutSession(
    @Param('checkoutId') checkoutId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const checkout = await this.checkoutService.getCheckoutById(
        checkoutId,
        userId,
      );

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

  // Get checkout with saved payment methods
  @Get('session/:checkoutId/with-payment-methods')
  async getCheckoutWithPaymentMethods(
    @Param('checkoutId') checkoutId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const checkout = await this.checkoutService.getCheckoutById(
        checkoutId,
        userId,
      );
      const savedPaymentMethods =
        await this.checkoutService.getUserSavedPaymentMethods(userId);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Checkout session with payment methods retrieved successfully',
        data: {
          checkout: checkout,
          savedPaymentMethods: savedPaymentMethods,
          hasDefaultPaymentMethod: savedPaymentMethods.some(
            (pm) => pm.isDefault,
          ),
          totalSavedCards: savedPaymentMethods.length,
        },
      });
    } catch (error: any) {
      return response.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message || 'Checkout session not found',
      });
    }
  }

  // Public endpoint for payment success page (no JWT required)
  @Get('success/:checkoutId')
  async getPaymentSuccessDetails(
    @Param('checkoutId') checkoutId: string,
    @Res() response: Response,
  ) {
    try {
      // Get checkout details without user authentication for success page
      const checkout =
        await this.checkoutService.getCheckoutByIdPublic(checkoutId);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment success details retrieved',
        data: {
          checkoutId: checkout.checkoutId,
          status: checkout.status,
          totalAmount: checkout.totalAmount,
          cartItems: checkout.cartItems,
          isCompleted: checkout.isCompleted,
          completedAt: checkout.completedAt,
          user: {
            firstName: checkout.user?.firstName,
            email: checkout.user?.email,
          },
        },
      });
    } catch (error: any) {
      return response.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message || 'Payment details not found',
      });
    }
  }

  @Get('history')
  async getUserCheckouts(@Req() req: Request, @Res() response: Response) {
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
    @Res() response: Response,
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

  // Get payment status (user-friendly)
  @Get('payment-status/:checkoutId')
  async getPaymentStatus(
    @Param('checkoutId') checkoutId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const checkout = await this.checkoutService.getCheckoutById(
        checkoutId,
        userId,
      );

      // User-friendly status messages
      let userMessage = '';
      let statusColor = '';

      switch (checkout.status) {
        case 'Pending':
          userMessage = 'Payment is ready to process';
          statusColor = 'blue';
          break;
        case 'Processing':
          userMessage = 'Payment is being processed...';
          statusColor = 'orange';
          break;
        case 'Completed':
          userMessage = 'Payment completed successfully!';
          statusColor = 'green';
          break;
        case 'Failed':
          userMessage = 'Payment failed. Please try again.';
          statusColor = 'red';
          break;
        case 'Cancelled':
          userMessage = 'Payment was cancelled';
          statusColor = 'gray';
          break;
        default:
          userMessage = 'Payment status unknown';
          statusColor = 'gray';
      }

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment status retrieved successfully',
        data: {
          checkoutId: checkout.checkoutId,
          status: checkout.status,
          userMessage: userMessage,
          statusColor: statusColor,
          isCompleted: checkout.isCompleted,
          completedAt: checkout.completedAt,
          // Only include sensitive data if needed
          ...(checkout.isCompleted && {
            transactionId: checkout.transactionId,
          }),
        },
      });
    } catch (error: any) {
      return response.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message:
          'Unable to retrieve payment information. Please contact support if this issue persists.',
      });
    }
  }

  // Webhook endpoints moved to checkout-webhook.controller.ts (no JWT authentication)

  // ============ IN-APP PAYMENT ENDPOINTS ============

  /**
   * Create and save a new payment method (card) without processing payment
   * Perfect for adding cards to user's saved payment methods
   */
  @Post('in-app/create-card')
  @HttpCode(HttpStatus.CREATED)
  async createCard(
    @Req() req: Request,
    @Body() dto: InAppPaymentDto,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      console.log('💳 Creating new payment method for user:', userId);

      // Create and save payment method using the PaymentMethodService
      const result = await this.paymentMethodService.createAndSavePaymentMethod(
        userId,
        {
          cardNumber: dto.cardNumber,
          expMonth: dto.expMonth,
          expYear: dto.expYear,
          cvc: dto.cvc,
          cardholderName: dto.cardholderName,
          billingEmail: dto.billingEmail,
          billingPhone: dto.billingPhone,
          nickname: dto.nickname,
          setAsDefault: dto.setAsDefault,
        }
      );

      return response.status(HttpStatus.CREATED).json({
        success: true,
        message: result.message,
        isDuplicate: result.isDuplicate,
        data: {
          id: result.paymentMethod.id,
          displayName: result.paymentMethod.getDisplayName(),
          maskedCardNumber: result.paymentMethod.getMaskedCardNumber(),
          cardIcon: result.paymentMethod.getCardIcon(),
          brand: result.paymentMethod.brand,
          expiryDisplay: result.paymentMethod.getExpiryDisplay(),
          isDefault: result.paymentMethod.isDefault,
          isExpired: result.paymentMethod.isExpired(),
        },
      });
    } catch (error: any) {
      console.error('❌ Card creation failed:', error);
      
      // Use ErrorHandlerUtil to get proper status code and message
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to create payment method');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  /**
   * Update existing payment method (card) details
   */
  @Put('in-app/update-card/:paymentMethodId')
  @HttpCode(HttpStatus.OK)
  async updateCard(
    @Param('paymentMethodId') paymentMethodId: string,
    @Body() dto: UpdateCardDto,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      console.log('💳 Updating payment method for user:', userId);

      const paymentMethod = await this.paymentMethodService.updatePaymentMethod(
        userId,
        paymentMethodId,
        dto
      );

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment method updated successfully',
        data: {
          id: paymentMethod.id,
          displayName: paymentMethod.getDisplayName(),
          maskedCardNumber: paymentMethod.getMaskedCardNumber(),
          cardIcon: paymentMethod.getCardIcon(),
          brand: paymentMethod.brand,
          expiryDisplay: paymentMethod.getExpiryDisplay(),
          isDefault: paymentMethod.isDefault,
          isExpired: paymentMethod.isExpired(),
        },
      });
    } catch (error: any) {
      console.error('❌ Card update failed:', error);
      
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to update payment method');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  /**
   * Delete existing payment method (card)
   */
  @Delete('in-app/delete-card/:paymentMethodId')
  @HttpCode(HttpStatus.OK)
  async deleteCard(
    @Param('paymentMethodId') paymentMethodId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      console.log('💳 Deleting payment method for user:', userId);

      await this.paymentMethodService.deletePaymentMethod(userId, paymentMethodId);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment method deleted successfully',
      });
    } catch (error: any) {
      console.error('❌ Card deletion failed:', error);
      
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to delete payment method');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  /**
   * Get payment method by ID
   */
  @Get('in-app/get-card/:paymentMethodId')
  @HttpCode(HttpStatus.OK)
  async getCardById(
    @Param('paymentMethodId') paymentMethodId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      console.log('💳 Getting payment method for user:', userId);

      const paymentMethod = await this.paymentMethodService.getPaymentMethodById(
        userId,
        paymentMethodId
      );

      if (!paymentMethod) {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Payment method not found',
        });
      }

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment method retrieved successfully',
        data: {
          id: paymentMethod.id,
          displayName: paymentMethod.getDisplayName(),
          maskedCardNumber: paymentMethod.getMaskedCardNumber(),
          cardIcon: paymentMethod.getCardIcon(),
          brand: paymentMethod.brand,
          expiryDisplay: paymentMethod.getExpiryDisplay(),
          isDefault: paymentMethod.isDefault,
          isExpired: paymentMethod.isExpired(),
        },
      });
    } catch (error: any) {
      console.error('❌ Get card failed:', error);
      
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to get payment method');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  /**
   * Process payment with saved payment method (1-click payment in-app)
   */
  @Post('in-app/pay-with-saved-method')
  @HttpCode(HttpStatus.OK)
  async processInAppPaymentWithSavedMethod(
    @Req() req: Request,
    @Body() dto: InAppPaymentWithSavedMethodDto,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      console.log('⚡ Processing in-app payment with saved method');

      const result =
        await this.checkoutService.processInAppPaymentWithSavedMethod(
          userId,
          dto,
        );

      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.success
          ? 'Payment completed instantly!'
          : 'Payment requires additional authentication',
        data: {
          checkoutId: dto.checkoutId,
          transactionId: result.transactionId,
          status: result.status,
          isCompleted: result.isCompleted,
          requiresAction: result.requiresAction,
          nextAction: result.nextAction,
          paymentMethod: result.paymentMethod,
          amount: result.amount,
          currency: result.currency,
        },
      });
    } catch (error: any) {
      console.error('❌ In-app payment with saved method failed:', error);
      
      // Use ErrorHandlerUtil to get proper status code and message
      try {
        ErrorHandlerUtil.handleError(error, 'In-app payment with saved method failed');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  /**
   * Get user's saved payment methods (RBI Compliant - no sensitive data)
   */
  @Get('saved-payment-methods')
  @HttpCode(HttpStatus.OK)
  async getSavedPaymentMethods(@Req() req: Request, @Res() response: Response) {
    try {
      const userId = req.user.id;
      const paymentMethods =
        await this.checkoutService.getUserSavedPaymentMethods(userId);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Saved payment methods retrieved successfully',
        data: {
          paymentMethods: paymentMethods.map((pm) => ({
            id: pm.id,
            displayName: pm.displayName,
            maskedCardNumber: pm.maskedCardNumber,
            cardIcon: pm.cardIcon,
            brand: pm.brand,
            expiryDisplay: pm.expiryDisplay,
            isDefault: pm.isDefault,
            isExpired: pm.isExpired,
          })),
        },
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  }

  /**
   * Get usage statistics for a specific payment method
   */
  @Get('payment-method/:paymentMethodId/usage-stats')
  @HttpCode(HttpStatus.OK)
  async getPaymentMethodUsageStats(
    @Param('paymentMethodId') paymentMethodId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const usageStats =
        await this.paymentMethodService.getPaymentMethodUsageStats(
          userId,
          paymentMethodId,
        );

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment method usage statistics retrieved successfully',
        data: usageStats,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  }


  /**
   * Real-time card validation for payment forms
   */
  @Post('validate-card')
  @HttpCode(HttpStatus.OK)
  async validateCardDetails(
    @Body()
    dto: {
      cardNumber: string;
      cvv?: string;
      expMonth?: number;
      expYear?: number;
    },
  ) {
    try {
      const cardValidation = validateCard(dto.cardNumber, dto.cvv);

      // Detect card type for additional info
      const cardType = detectCardTypeRealtime(dto.cardNumber);

      return {
        success: true,
        message: 'Card validation completed',
        data: {
          isValid: cardValidation.isValid,
          cardType: {
            type: cardValidation.cardType.type,
            name: cardValidation.cardType.name,
            logo: cardValidation.cardType.logo,
            color: cardValidation.cardType.color,
            region: cardValidation.cardType.region,
            country: cardValidation.cardType.country,
          },
          validation: {
            isLuhnValid: cardValidation.isLuhnValid,
            isValidLength: cardValidation.cardType.validLengths.includes(
              dto.cardNumber.replace(/\D/g, '').length,
            ),
            isValidCVV: dto.cvv
              ? cardValidation.cardType.cvvLength === dto.cvv.length
              : true,
            cvvLength: cardValidation.cardType.cvvLength,
            validLengths: cardValidation.cardType.validLengths,
          },
          formatted: {
            cardNumber: cardValidation.formattedNumber,
            maskedNumber: cardValidation.maskedNumber,
          },
          binInfo: {
            bin: dto.cardNumber.substring(0, 6),
            brand: cardValidation.cardType.name,
          },
        },
      };
    } catch (error: any) {
      // Use ErrorHandlerUtil for proper error handling
      try {
        ErrorHandlerUtil.handleError(error, 'Card validation failed');
      } catch (handledError: any) {
        return {
          success: false,
          message: handledError.message,
          error: handledError.message,
          data: {
            isValid: false,
            cardType: { type: 'unknown', name: 'Unknown Card' },
          },
        };
      }
    }
  }
}
