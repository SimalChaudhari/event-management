import {
  Controller,
  HttpStatus,
  Param,
  Get,
  Delete,
  Res,
  UseGuards,
  Put,
  Body,
  Request,
  Post,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { AttendanceService } from './attendance.service';
import { EventQRCodeService } from './event-qr-code.service';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { UserRole } from '../user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import {
  CheckInByQRCodeDto,
  ManualCheckInDto,
  CheckOutDto,
  UpdateAttendanceDto,
  CreateEventQRCodeDto,
  UpdateEventQRCodeDto,
  ContactExchangeDto,
  CollectExhibitorStampDto,
  SelfCheckInDto,
} from './attendance.dto';

@Controller('api/attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly eventQRCodeService: EventQRCodeService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  /**
   * Scan QR code for attendance check-in (Public endpoint for external scanners)
   * This endpoint can be used by external QR code scanning devices
   */
  @Post('scan-qr-code')
  async scanQRCodeForAttendance(
    @Body() scanData: { qrCodeId: string; eventId: string },
    @Res() response: Response,
  ) {
    try {
      const result = await this.attendanceService.scanQRCodeForAttendance(
        scanData.qrCodeId,
        scanData.eventId,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'QR code scanning for attendance', undefined);
      throw error;
    }
  }

  /**
   * Check in user by scanning their QR code (Admin only)
   */
  @Post('check-in-qr-code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async checkInByQRCode(
    @Body() checkInData: CheckInByQRCodeDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Admin not authenticated',
        });
      }

      const attendance = await this.attendanceService.checkInByQRCode(
        checkInData,
        adminUserId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'User checked in successfully via QR code',
        data: attendance,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'QR code check-in', req.user?.id);
      throw error;
    }
  }

  /**
   * Manual check-in by admin (for users without QR codes or as backup)
   */
  @Post('manual-check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async manualCheckIn(
    @Body() checkInData: ManualCheckInDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Admin not authenticated',
        });
      }

      const attendance = await this.attendanceService.manualCheckIn(
        checkInData,
        adminUserId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'User checked in successfully manually',
        data: attendance,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Manual check-in', req.user?.id);
      throw error;
    }
  }

  /**
   * Check out user from event (Admin only)
   */
  @Post('check-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async checkOut(
    @Body() checkOutData: CheckOutDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Admin not authenticated',
        });
      }

      const attendance = await this.attendanceService.checkOut(
        checkOutData,
        adminUserId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'User checked out successfully',
        data: attendance,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Check-out', req.user?.id);
      throw error;
    }
  }

  /**
   * Get attendance records for a specific event (Admin only)
   */
  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async getEventAttendance(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const attendance = await this.attendanceService.getEventAttendance(eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event attendance retrieved successfully',
        data: attendance,
        metadata: {
          total: attendance.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event attendance retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Get attendance records for a specific user (Admin only)
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async getUserAttendance(
    @Param('userId') userId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const attendance = await this.attendanceService.getUserAttendance(userId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'User attendance retrieved successfully',
        data: attendance,
        metadata: {
          total: attendance.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'User attendance retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Get attendance statistics for an event (Admin only)
   */
  @Get('event/:eventId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async getEventAttendanceStats(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const stats = await this.attendanceService.getEventAttendanceStats(eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event attendance statistics retrieved successfully',
        data: stats,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event attendance statistics', req.user?.id);
      throw error;
    }
  }

  /**
   * Update attendance record (Admin only)
   */
  @Put('update/:attendanceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async updateAttendance(
    @Param('attendanceId') attendanceId: string,
    @Body() updateData: UpdateAttendanceDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const attendance = await this.attendanceService.updateAttendance(
        attendanceId,
        updateData,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Attendance record updated successfully',
        data: attendance,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Attendance update', req.user?.id);
      throw error;
    }
  }

  /**
   * Delete attendance record (Admin only)
   */
  @Delete('delete/:attendanceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async deleteAttendance(
    @Param('attendanceId') attendanceId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.attendanceService.deleteAttendance(attendanceId);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Attendance deletion', req.user?.id);
      throw error;
    }
  }

  /**
   * Get all attendance records (Admin only)
   */
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async getAllAttendance(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // This would need to be implemented in the service if you want to get all attendance records
      // For now, returning a message indicating this endpoint needs implementation
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Get all attendance endpoint - implementation needed',
        data: [],
        metadata: {
          total: 0,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'All attendance retrieval', req.user?.id);
      throw error;
    }
  }

  // ===== EVENT QR CODE MANAGEMENT (Admin Only) =====

  /**
   * Generate simple Event QR code (similar to user QR code)
   * - This generates a QR code that can be scanned for event check-in
   * - The QR code contains event information and can be used by attendees
   */
  @Get('event-qr-code/generate/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async generateEventQRCode(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const qrCodeData = await this.eventQRCodeService.generateSimpleEventQRCode(eventId);
      
      const successResponse = {
        success: true,
        message: 'Event QR code generated successfully',
        data: {
          ...qrCodeData,
          purpose: 'event_check_in',
          scanInstructions: 'Scan this QR code to check in to the event',
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event QR code generation', req.user?.id);
      throw error;
    }
  }

  /**
   * Get event information from scanned QR code (Public)
   * - Public endpoint that doesn't require authentication
   * - Returns event information when QR code is scanned
   */
  @Get('event-qr-code/scan/:qrCodeId')
  async scanEventQRCode(
    @Param('qrCodeId') qrCodeId: string,
    @Res() response: Response,
  ) {
    try {
      const eventInfo = await this.eventQRCodeService.getEventInfoFromQRCode(qrCodeId);
      
      const successResponse = {
        success: true,
        message: 'Event information retrieved successfully',
        data: eventInfo,
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event QR code scanning', undefined);
      throw error;
    }
  }

  /**
   * Create a new event QR code for organizers
   */
  @Post('event-qr-codes/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async createEventQRCode(
    @Body() createDto: CreateEventQRCodeDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Admin not authenticated',
        });
      }

      const eventQRCode = await this.eventQRCodeService.createEventQRCode(
        createDto,
        adminUserId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event QR code created successfully',
        data: eventQRCode,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event QR code creation', req.user?.id);
      throw error;
    }
  }

  /**
   * Update an existing event QR code
   */
  @Put('event-qr-codes/update/:qrCodeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async updateEventQRCode(
    @Param('qrCodeId') qrCodeId: string,
    @Body() updateDto: UpdateEventQRCodeDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const eventQRCode = await this.eventQRCodeService.updateEventQRCode(
        qrCodeId,
        updateDto,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event QR code updated successfully',
        data: eventQRCode,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event QR code update', req.user?.id);
      throw error;
    }
  }

  /**
   * Get all event QR codes for an event
   */
  @Get('event-qr-codes/event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async getEventQRCodes(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const eventQRCodes = await this.eventQRCodeService.getEventQRCodes(eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event QR codes retrieved successfully',
        data: eventQRCodes,
        metadata: {
          total: eventQRCodes.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event QR codes retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Delete an event QR code
   */
  @Delete('event-qr-codes/delete/:qrCodeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async deleteEventQRCode(
    @Param('qrCodeId') qrCodeId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.eventQRCodeService.deleteEventQRCode(qrCodeId);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event QR code deletion', req.user?.id);
      throw error;
    }
  }

  // ===== USER SELF-SERVICE ENDPOINTS (Authenticated Users) =====

  /**
   * Self check-in via event QR code
   */
  @Post('self-check-in')
  @UseGuards(JwtAuthGuard)
  async selfCheckIn(
    @Body() selfCheckInDto: SelfCheckInDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.eventQRCodeService.handleSelfCheckIn(
        selfCheckInDto,
        userId,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Self check-in', req.user?.id);
      throw error;
    }
  }

  /**
   * Exchange contact information with another user
   */
  @Post('contact-exchange')
  @UseGuards(JwtAuthGuard)
  async contactExchange(
    @Body() contactExchangeDto: ContactExchangeDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.eventQRCodeService.handleContactExchange(
        contactExchangeDto,
        userId,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Contact exchange', req.user?.id);
      throw error;
    }
  }

  /**
   * Collect exhibitor stamp
   */
  @Post('exhibitor-stamp')
  @UseGuards(JwtAuthGuard)
  async collectExhibitorStamp(
    @Body() stampDto: CollectExhibitorStampDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.eventQRCodeService.handleExhibitorStampCollection(
        stampDto,
        userId,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Exhibitor stamp collection', req.user?.id);
      throw error;
    }
  }

  /**
   * Get user's contact exchanges
   */
  @Get('contact-exchanges')
  @UseGuards(JwtAuthGuard)
  async getUserContactExchanges(
    @Request() req: any,
    @Res() response: Response,
    @Query('eventId') eventId?: string,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const contactExchanges = await this.eventQRCodeService.getUserContactExchanges(
        userId,
        eventId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Contact exchanges retrieved successfully',
        data: contactExchanges,
        metadata: {
          total: contactExchanges.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Contact exchanges retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Get user's exhibitor stamps
   */
  @Get('exhibitor-stamps')
  @UseGuards(JwtAuthGuard)
  async getUserExhibitorStamps(
    @Request() req: any,
    @Res() response: Response,
    @Query('eventId') eventId?: string,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const exhibitorStamps = await this.eventQRCodeService.getUserExhibitorStamps(
        userId,
        eventId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Exhibitor stamps retrieved successfully',
        data: exhibitorStamps,
        metadata: {
          total: exhibitorStamps.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Exhibitor stamps retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Generate QR code image for an event QR code
   */
  @Get('event-qr-codes/:qrCodeId/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async generateEventQRCodeImage(
    @Param('qrCodeId') qrCodeId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const qrCodeImage = await this.eventQRCodeService.generateEventQRCodeImage(qrCodeId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event QR code image generated successfully',
        data: { qrCodeImage },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event QR code image generation', req.user?.id);
      throw error;
    }
  }
}
