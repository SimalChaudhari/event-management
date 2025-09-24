import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentMethodService } from './payment-method.service';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { ErrorHandlerUtil } from '../utils/error-handler.util';

@Controller('api/payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  // Instant payment with saved card token (no card re-entry needed!)
  @Post(':paymentMethodId/instant-pay')
  async instantPayWithSavedCard(
    @Param('paymentMethodId') paymentMethodId: string,
    @Body() body: {
      checkoutId: string;
      amount: number;
    },
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      
      // Get saved payment method
      const allPaymentMethods = await this.paymentMethodService.getUserPaymentMethods(userId);
      const paymentMethod = allPaymentMethods.find(pm => pm.id === paymentMethodId);
      
      if (!paymentMethod) {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Saved payment method not found',
        });
      }

      // Create instant payment with saved token (no card re-entry!)
      const result = await this.paymentMethodService.createPaymentWithSavedMethod(
        userId,
        paymentMethodId,
        body.amount,
        'USD',
        body.checkoutId
      );

      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.status === 'completed' ? 'Payment completed instantly!' : 'Payment verification required',
        data: {
          checkoutId: body.checkoutId,
          transactionId: result.transactionId,
          status: result.status,
          paymentUrl: result.paymentUrl,
          amount: result.amount,
          currency: result.currency,
          paymentMethod: {
            displayName: paymentMethod.displayName,
            maskedCard: paymentMethod.maskedCardNumber,
            brand: paymentMethod.brand,
          },
          nextAction: result.status === 'requires_confirmation' ? {
            type: 'redirect_for_verification',
            message: 'Complete 3D Secure verification'
          } : null
        },
      });
    } catch (error: any) {
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to process instant payment');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  // Get user's saved payment methods (Amazon/Flipkart style)
  @Get()
  async getUserPaymentMethods(
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const paymentMethods = await this.paymentMethodService.getUserPaymentMethods(userId);

      console.log(`🔍 Retrieved ${paymentMethods.length} payment methods for user ${userId}`);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Saved payment methods retrieved successfully',
        count: paymentMethods.length,
        data: paymentMethods,
        debug: {
          userId: userId,
          timestamp: new Date().toISOString(),
          note: paymentMethods.length === 0 ? 'No cards saved yet. Make a payment to auto-save card.' : 'Cards found!'
        }
      });
    } catch (error: any) {
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to retrieve payment methods');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  // Get default payment method
  @Get('default')
  async getDefaultPaymentMethod(
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const defaultPaymentMethod = await this.paymentMethodService.getDefaultPaymentMethod(userId);

      if (!defaultPaymentMethod) {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'No default payment method found',
        });
      }

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Default payment method retrieved',
        data: {
          id: defaultPaymentMethod.id,
          wooshpayPaymentMethodId: defaultPaymentMethod.wooshpayPaymentMethodId,
          displayName: defaultPaymentMethod.getDisplayName(),
          maskedCardNumber: defaultPaymentMethod.getMaskedCardNumber(),
          brand: defaultPaymentMethod.brand,
          funding: defaultPaymentMethod.funding,
          expiryDisplay: defaultPaymentMethod.getExpiryDisplay(),
          isExpired: defaultPaymentMethod.isExpired(),
          cardIcon: defaultPaymentMethod.getCardIcon(),
          country: defaultPaymentMethod.country,
        },
      });
    } catch (error: any) {
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to retrieve default payment method');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  // Set default payment method
  @Put('default/:paymentMethodId')
  async setDefaultPaymentMethod(
    @Param('paymentMethodId') paymentMethodId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      await this.paymentMethodService.setDefaultPaymentMethod(userId, paymentMethodId);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Default payment method updated successfully',
      });
    } catch (error: any) {
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to update default payment method');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  // Update payment method nickname
  @Put(':paymentMethodId/nickname')
  async updatePaymentMethodNickname(
    @Param('paymentMethodId') paymentMethodId: string,
    @Body() body: { nickname: string },
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const updatedPaymentMethod = await this.paymentMethodService.updateNickname(
        userId,
        paymentMethodId,
        body.nickname,
      );

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment method nickname updated successfully',
        data: {
          id: updatedPaymentMethod.id,
          displayName: updatedPaymentMethod.getDisplayName(),
          nickname: updatedPaymentMethod.nickname,
        },
      });
    } catch (error: any) {
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to update payment method nickname');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }

  // Delete saved payment method
  @Delete(':paymentMethodId')
  async deletePaymentMethod(
    @Param('paymentMethodId') paymentMethodId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      await this.paymentMethodService.deletePaymentMethod(userId, paymentMethodId);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment method deleted successfully',
      });
    } catch (error: any) {
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

  // Create payment using saved payment method (1-click payment)
  @Post(':paymentMethodId/pay')
  async payWithSavedMethod(
    @Param('paymentMethodId') paymentMethodId: string,
    @Body() body: {
      checkoutId: string;
      amount: number;
      currency?: string;
    },
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      
      const paymentIntent = await this.paymentMethodService.createPaymentWithSavedMethod(
        userId,
        paymentMethodId,
        body.amount,
        body.currency || 'USD',
        body.checkoutId,
      );

      return response.status(HttpStatus.OK).json({
        success: true,
        message: '1-click payment initiated successfully',
        data: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret,
          amount: body.amount,
          currency: body.currency || 'USD',
        },
      });
    } catch (error: any) {
      try {
        ErrorHandlerUtil.handleError(error, 'Failed to process 1-click payment');
      } catch (handledError: any) {
        return response.status(handledError.getStatus()).json({
          success: false,
          message: handledError.message,
          error: handledError.message,
        });
      }
    }
  }
}
