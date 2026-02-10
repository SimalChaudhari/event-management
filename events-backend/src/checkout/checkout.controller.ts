import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CheckoutService } from './checkout.service';
import { WooShPayService } from './wooshpay.service';
import { ErrorHandlerUtil } from '../utils/error-handler.util';
import {
  CreateCheckoutDto,
  CheckoutStatus,
  PaymentGateway,
  WooShPayCustomerDto,
  CreateWooShPaySessionDto,
  CreateRefundDto,
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

  /** Step 1: Get or create WooShPay customer (call when user clicks checkout). Customer ID is saved on user table (wooshpayCustomerId). */
  @Post('wooshpay-customer')
  @HttpCode(HttpStatus.OK)
  async getOrCreateWooShPayCustomer(
    @Req() req: Request,
    @Body() dto: WooShPayCustomerDto,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const result = await this.checkoutService.getOrCreateWooShPayCustomer(userId, dto);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'WooShPay customer ready',
        data: result,
      });
    } catch (error: any) {
      return response.status(error.getStatus?.() ?? HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to get or create WooShPay customer',
      });
    }
  }

  /** Step 2: Create WooShPay Checkout Session. Redirects use evential:// deep link when PAYMENT_CALLBACK_DEEP_LINK=true. */
  @Post('wooshpay-session')
  @HttpCode(HttpStatus.OK)
  async createWooShPaySession(
    @Req() req: Request,
    @Body() dto: CreateWooShPaySessionDto,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const useDeepLink = process.env.PAYMENT_CALLBACK_DEEP_LINK === 'true';
      const itemName = (dto.itemName || process.env.PAYMENT_CALLBACK_ITEM_NAME || 'Event 1').trim();
      const checkoutIdEnc = encodeURIComponent(dto.checkoutId);
      const itemNameEnc = encodeURIComponent(itemName);

      let successUrl: string;
      let cancelUrl: string;
      if (useDeepLink) {
        successUrl = `evential://callback/payment?status=success&itemName=${itemNameEnc}&checkout_id=${checkoutIdEnc}`;
        cancelUrl = `evential://callback/payment?status=cancel&itemName=${itemNameEnc}&checkout_id=${checkoutIdEnc}`;
      } else {
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'https://example.com';
        successUrl = `${baseUrl}/payment/success?checkout_id=${checkoutIdEnc}`;
        cancelUrl = `${baseUrl}/payment/cancel?checkout_id=${checkoutIdEnc}`;
      }

      const currency = process.env.CHECKOUT_CURRENCY || 'USD';
      const result = await this.checkoutService.createWooShPayCheckoutSession(
        userId,
        dto.checkoutId,
        successUrl,
        cancelUrl,
        currency,
      );
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Checkout session created',
        data: result,
      });
    } catch (error: any) {
      return response.status(error.getStatus?.() ?? HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create checkout session',
      });
    }
  }

  /** Retrieve WooShPay Checkout Session by WooShPay session ID (GET /v1/checkout/sessions/{id}) */
  @Get('wooshpay-session/:sessionId')
  @HttpCode(HttpStatus.OK)
  async getWooShPaySession(
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
  ) {
    try {
      const session = await this.checkoutService.getWooShPaySession(sessionId);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'WooShPay session retrieved',
        data: session,
      });
    } catch (error: any) {
      return response.status(error.getStatus?.() ?? HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to retrieve WooShPay session',
      });
    }
  }

  /** Retrieve WooShPay session by our checkoutId */
  @Get('wooshpay-session/checkout/:checkoutId')
  @HttpCode(HttpStatus.OK)
  async getWooShPaySessionByCheckoutId(
    @Param('checkoutId') checkoutId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const session = await this.checkoutService.getWooShPaySessionByCheckoutId(userId, checkoutId);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'WooShPay session retrieved',
        data: session,
      });
    } catch (error: any) {
      return response.status(error.getStatus?.() ?? HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to retrieve WooShPay session',
      });
    }
  }

  /** Expire WooShPay Checkout Session by session ID (POST /v1/checkout/sessions/{id}/expire) */
  @Post('wooshpay-session/:sessionId/expire')
  @HttpCode(HttpStatus.OK)
  async expireWooShPaySession(
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.checkoutService.expireWooShPaySession(sessionId);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'WooShPay session expired',
        data: result,
      });
    } catch (error: any) {
      return response.status(error.getStatus?.() ?? HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to expire WooShPay session',
      });
    }
  }

  /** Expire WooShPay session by our checkoutId */
  @Post('wooshpay-session/checkout/:checkoutId/expire')
  @HttpCode(HttpStatus.OK)
  async expireWooShPaySessionByCheckoutId(
    @Param('checkoutId') checkoutId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const result = await this.checkoutService.expireWooShPaySessionByCheckoutId(userId, checkoutId);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'WooShPay session expired',
        data: result,
      });
    } catch (error: any) {
      return response.status(error.getStatus?.() ?? HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to expire WooShPay session',
      });
    }
  }

  /** List WooShPay Checkout Sessions (retrieve all, optional ?limit=) */
  @Get('wooshpay-sessions')
  @HttpCode(HttpStatus.OK)
  async listWooShPaySessions(
    @Req() req: Request,
    @Res() response: Response,
    @Query('limit') limit?: string,
  ) {
    try {
      const params = limit != null ? { limit: parseInt(limit, 10) } : undefined;
      const sessions = await this.checkoutService.listWooShPaySessions(params);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'WooShPay sessions retrieved',
        data: sessions,
      });
    } catch (error: any) {
      return response.status(error.getStatus?.() ?? HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to list WooShPay sessions',
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

  /** Get refund status for an order (user can track refund). */
  @Get('refund/status/:orderId')
  @HttpCode(HttpStatus.OK)
  async getRefundStatus(
    @Param('orderId') orderId: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const refunds = await this.checkoutService.getRefundStatusForOrder(
        orderId,
        userId,
      );
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Refund status retrieved',
        data: { orderId, refunds },
      });
    } catch (error: any) {
      return response.status(error.getStatus?.() ?? HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to get refund status',
      });
    }
  }

  /** Refund an order paid via WooShPay. Body: { amount?: number (cents), reason?: string }. Omit amount for full refund. */
  @Post('refund/:orderId')
  @HttpCode(HttpStatus.OK)
  async createRefund(
    @Param('orderId') orderId: string,
    @Body() dto: CreateRefundDto,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const result = await this.checkoutService.createRefundForOrder(
        orderId,
        userId,
        dto.amount,
        dto.reason,
      );
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Refund initiated successfully',
        data: result,
      });
    } catch (error: any) {
      return response.status(error.getStatus?.() ?? HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create refund',
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
}
