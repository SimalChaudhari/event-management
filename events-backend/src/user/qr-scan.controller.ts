//qr-scan.controller.ts
import {
  Controller,
  HttpStatus,
  Param,
  Get,
  Res,
} from '@nestjs/common';

import { Response } from 'express';
import { UserService } from './users.service';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Controller('')
export class QrScanController {
  constructor(
    private readonly userService: UserService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  /**
   * Get user information by ID (for QR code scanning)
   * - Public endpoint that doesn't require authentication
   * - Returns user information when QR code is scanned
   * - Route: GET /:id
   */
  @Get(':id')
  async scanQRCode(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const userInfo = await this.userService.getUserInfoFromQRCode(id);
      
      const successResponse = {
        success: true,
        message: 'User information retrieved successfully',
        data: userInfo,
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'QR code scanning', undefined);
      throw error;
    }
  }
}
