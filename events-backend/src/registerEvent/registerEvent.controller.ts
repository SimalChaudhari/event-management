import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards, HttpStatus, Query } from '@nestjs/common';
import { RegisterEventService } from './registerEvent.service';
import { CreateRegisterEventDto, UpdateRegisterEventDto, AdminCreateRegisterEventDto } from './registerEvent.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { Request, Response } from 'express';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import {
  ValidationException
} from '../utils/exceptions/custom-exceptions';
import { TabVisibilityFilterUtil } from '../utils/tab-visibility-filter.util';

@Controller('api/register-events')
@UseGuards(JwtAuthGuard)
export class RegisterEventController {
  constructor(
    private readonly registerEventService: RegisterEventService,
    private readonly errorHandler: ErrorHandlerService,

  ) {}

  @Post('create')
  async createRegisterEvent(
    @Req() req: Request,
    @Body() createRegisterEventDto: CreateRegisterEventDto, // No userId needed - comes from JWT token
    @Res() response: Response,
  ) {
    try {
      // Get user ID from JWT token (authenticated user)
      const userId = req.user.id;
      
      // Create registration using the authenticated user's ID
      const registration = await this.registerEventService.createRegisterEvent(userId, createRegisterEventDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event registration created successfully',
        data: registration,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Register Event creation', req.user?.id);
      throw error;
    }
  }

  @Post('admin/create')
  async adminCreateRegisterEvent(
    @Req() req: Request,
    @Body() createRegisterEventDto: AdminCreateRegisterEventDto, // userId required for admin
    @Res() response: Response,
  ) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        throw new ValidationException('Only admin can create registrations for other users');
      }

      // Set isCreatedByAdmin to true for admin-created registrations
      createRegisterEventDto.isCreatedByAdmin = true;
      
      // Use the userId from the request body (admin specifies which user to register)
      const userId = createRegisterEventDto.userId;
      if (!userId) {
        throw new ValidationException('userId is required for admin registration');
      }

      const registration = await this.registerEventService.createRegisterEvent(userId, createRegisterEventDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Admin registration created successfully',
        data: registration,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Admin Register Event creation', req.user?.id);
      throw error;
    }
  }

  @Put('admin/update/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async adminUpdateRegisterEvent(
    @Param('id') id: string,
    @Body() updateRegisterEventDto: UpdateRegisterEventDto,
    @Res() response: Response,
    @Req() req: Request,
  ) {
    try {
      const updatedRegistration = await this.registerEventService.adminUpdateRegisterEvent(id, updateRegisterEventDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Registration updated successfully',
        data: updatedRegistration,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Admin Register Event update', req.user?.id);
      throw error;
    }
  }

  @Delete('admin/delete/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async adminDeleteRegisterEvent(
    @Param('id') id: string,
    @Res() response: Response,
    @Req() req: Request,
  ) {
    try {
      await this.registerEventService.adminDeleteRegisterEvent(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Registration deleted successfully',
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Admin Register Event deletion', req.user?.id);
      throw error;
    }
  }

  @Get('all')
  async getAll(
    @Req() req: Request, 
    @Res() response: Response,
    @Query('filter') filter?: string,
    @Query('user') userFilter?: string,
    @Query('event') eventFilter?: string,
    @Query('userId') filterUserId?: string,
    @Query('eventId') filterEventId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ) {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const result = await this.registerEventService.findAll(userId, role, {
        filter,
        userFilter,
        eventFilter,
        userId: filterUserId,
        eventId: filterEventId,
        startDate,
        endDate,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
        sortBy,
        sortOrder
      });
      
      // Apply tab visibility filtering to events in the result
      if (result?.data && Array.isArray(result.data)) {
        // Each item in result.data has structure: { event: EventObject, user: UserObject, ... }
        const filteredData = result.data.map((item) => {
          if (item.event) {
            return {
              ...item,
              event: TabVisibilityFilterUtil.filterEventDataByTabVisibility(item.event, role)
            };
          }
          return item;
        }) as typeof result.data;
        result.data = filteredData;
      }
      
      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Register Event retrieval', req.user?.id);
      throw error;
    }
  }
  
  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: Request, @Res() response: Response) {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const result = await this.registerEventService.findOne(id, userId, role);
      
      // Apply tab visibility filtering to the event in the result
      if (result?.data?.event) {
        result.data.event = TabVisibilityFilterUtil.filterEventDataByTabVisibility(result.data.event, role);
      }
      
      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Register Event retrieval by ID', req.user?.id);
      throw error;
    }
  }

  @Get('export/event/:eventId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async exportRegisteredUsersByEvent(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Req() req: Request,
  ) {
    try {
      const csvContent = await this.registerEventService.exportRegisteredUsersByEvent(eventId);
      
      // Set response headers for CSV download
      response.setHeader('Content-Type', 'text/csv');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="event-registrations-${eventId}-${new Date().toISOString().split('T')[0]}.csv"`,
      );
      
      return response.status(HttpStatus.OK).send(csvContent);
    } catch (error) {
      this.errorHandler.logError(error, 'Export registered users by event', req.user?.id);
      throw error;
    }
  }

  @Get(':id/receipt')
  async downloadReceipt(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      const receiptData = await this.registerEventService.getReceiptData(id, userId, role);
      
      if (!receiptData) {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Receipt not found or checkout not completed',
        });
      }

      // Generate and send PDF
      const { PDFReceiptUtils } = await import('../utils/pdf-receipt.utils');
      PDFReceiptUtils.generateReceiptPDF(receiptData, response);
    } catch (error) {
      this.errorHandler.logError(error, 'Download receipt', req.user?.id);
      throw error;
    }
  }
}

@Controller('api/public/events')
export class PublicRegisterEventController {
  constructor(
    private readonly registerEventService: RegisterEventService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Get(':eventId/participants')
  async getPublicParticipants(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Query('search') search?: string,
  ) {
    try {
      const participants =
        await this.registerEventService.getPublicParticipants(eventId, search);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Participants retrieved successfully',
        data: participants ?? [],
        metadata: {
          total: participants?.length ?? 0,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Public event participants retrieval',
      );
      throw error;
    }
  }
}