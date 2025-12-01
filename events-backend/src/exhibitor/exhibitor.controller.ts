// src/controllers/exhibitor.controller.ts
import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    Res,
    UseInterceptors,
    UploadedFiles,
    NotFoundException,
    Request,
    HttpStatus,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { ExhibitorService } from './exhibitor.service';
import { ExhibitorDto } from './exhibitor.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import { ResourceNotFoundException } from '../utils/exceptions/custom-exceptions';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { UserRole } from '../user/users.entity';
import { ExhibitorFileUtils, ExhibitorFileUploadConfig } from '../utils/exhibitor-file.utils';

/**
 * Exhibitor Controller
 * 
 * Access Control:
 * - GET operations: Accessible to all users (no authentication required)
 * - CREATE, UPDATE, DELETE operations: Only accessible to Admin and Exhibitor users
 * - File management operations: Only accessible to Admin and Exhibitor users
 */
@Controller('api/exhibitors')
export class ExhibitorController {
  constructor(
    private readonly exhibitorService: ExhibitorService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  /**
   * Create a new exhibitor
   * Access: Admin and Exhibitor users only
   */
  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  @UseInterceptors(ExhibitorFileUtils.createExhibitorFileInterceptor())
  async createExhibitor(
    @Body() exhibitorDto: ExhibitorDto,
    @UploadedFiles() files: ExhibitorFileUploadConfig,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Process files safely
      const fileProcessing = ExhibitorFileUtils.processFilesSafely(files, {
        flyerNames: exhibitorDto.flyerNames,
        documentNames: exhibitorDto.documentNames,
        eventImageNames: exhibitorDto.eventImageNames,
      });

      if (!fileProcessing.success) {
        throw new BadRequestException(`File validation failed: ${fileProcessing.errors?.join(', ')}`);
      }

      // Apply processed files to DTO
      if (fileProcessing.processedFiles) {
        Object.assign(exhibitorDto, fileProcessing.processedFiles);
      }

      const exhibitor = await this.exhibitorService.createExhibitor(exhibitorDto);
      return this.formatExhibitorResponse(exhibitor, response, 'Exhibitor created successfully', HttpStatus.CREATED);
    } catch (error: any) {
      // Clean up uploaded files if error occurs
      ExhibitorFileUtils.cleanupUploadedFiles(files);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Exhibitor File Upload');
      }
      
      this.errorHandler.logError(error, 'Exhibitor creation', req.user?.id);
      throw error;
    }
  }

  /**
   * Get all exhibitors
   * Access: All users (no authentication required)
   */
  @Get()
  async getAllExhibitors(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitors = await this.exhibitorService.getAllExhibitors();
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Exhibitors retrieved successfully',
        data: exhibitors,
        metadata: {
          total: exhibitors.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Exhibitors retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Get all exhibitors with event-wise booth and staff information
   * Access: Admin and Exhibitor users only
   */
  @Get('staff-members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async getAllExhibitorsWithEventDetails(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userEmail = req.user?.email;
      
      const result = await this.exhibitorService.getAllExhibitorsWithEventDetails(userId, userRole, userEmail);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Staff members retrieved successfully',
        data: result,
        metadata: {
          total: result?.memberStaff?.length || 0,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Exhibitors with event details retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Get all events where logged-in user is an exhibitor (staff member)
   * Shows all events regardless of company
   * Access: Admin and Exhibitor users only
   */
  @Get('my-exhibitor-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async getMyExhibitorEvents(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.exhibitorService.getUserExhibitorEvents(userId, userRole);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Exhibitor events retrieved successfully',
        data: result,
        metadata: {
          total: result?.events?.length || 0,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'My exhibitor events retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Get staff member user details by user ID
   * Access: Admin and Exhibitor users only
   * Non-admin users can only view staff members from the same event(s)
   * This route must be defined BEFORE 'staff-member/:id' to avoid route conflicts
   */
  @Get('staff-member/user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async getStaffMemberUserDetails(
    @Param('userId') userId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const loggedInUserId = req.user?.id;
      const loggedInUserRole = req.user?.role;

      if (!loggedInUserId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const staffMember = await this.exhibitorService.getStaffMemberUserDetails(
        userId,
        loggedInUserId,
        loggedInUserRole,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Staff member details retrieved successfully',
        data: staffMember,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Staff member user details retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Get exhibitor by ID
   * Access: All users (no authentication required)
   */
  @Get(':id')
  async getExhibitorById(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorById(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Exhibitor retrieved successfully',
        data: exhibitor,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Exhibitor retrieval by ID', req.user?.id);
      throw error;
    }
  }

  /**
   * Update an exhibitor
   * Access: Admin and Exhibitor users only
   */
  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  @UseInterceptors(ExhibitorFileUtils.createExhibitorFileInterceptor())
  async updateExhibitor(
    @Param('id') id: string,
    @Body() exhibitorDto: ExhibitorDto,
    @UploadedFiles() files: ExhibitorFileUploadConfig,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Process new files safely
      const fileProcessing = ExhibitorFileUtils.processFilesSafely(files, {
        flyerNames: exhibitorDto.flyerNames,
        documentNames: exhibitorDto.documentNames,
        eventImageNames: exhibitorDto.eventImageNames,
      });

      if (!fileProcessing.success) {
        throw new BadRequestException(`File validation failed: ${fileProcessing.errors?.join(', ')}`);
      }

      // Handle combining existing and new files
      if (fileProcessing.processedFiles) {
        // Handle flyers - combine existing and new
        if (fileProcessing.processedFiles.flyers) {
          const allFlyers = [];
          
          // Add existing flyers
          if (exhibitorDto.originalFlyers) {
            const originalFlyers = Array.isArray(exhibitorDto.originalFlyers) 
              ? exhibitorDto.originalFlyers 
              : [exhibitorDto.originalFlyers];
            allFlyers.push(...originalFlyers);
          }
          
          // Add new flyers
          allFlyers.push(...fileProcessing.processedFiles.flyers);
          exhibitorDto.flyers = allFlyers;
        }

        // Handle documents - combine existing and new
        if (fileProcessing.processedFiles.documents) {
          const allDocuments = [];
          
          // Add existing documents
          if (exhibitorDto.originalDocuments) {
            const originalDocuments = Array.isArray(exhibitorDto.originalDocuments) 
              ? exhibitorDto.originalDocuments 
              : [exhibitorDto.originalDocuments];
            allDocuments.push(...originalDocuments);
          }
          
          // Add new documents
          allDocuments.push(...fileProcessing.processedFiles.documents);
          exhibitorDto.documents = allDocuments;
        }

        // Handle event images - combine existing and new
        if (fileProcessing.processedFiles.eventImages) {
          const allEventImages = [];
          
          // Add existing event images
          if (exhibitorDto.originalEventImages) {
            const originalEventImages = Array.isArray(exhibitorDto.originalEventImages) 
              ? exhibitorDto.originalEventImages 
              : [exhibitorDto.originalEventImages];
            allEventImages.push(...originalEventImages);
          }
          
          // Add new event images
          allEventImages.push(...fileProcessing.processedFiles.eventImages);
          exhibitorDto.eventImages = allEventImages;
        }

        // Handle logo
        if (fileProcessing.processedFiles.logo) {
          exhibitorDto.logo = fileProcessing.processedFiles.logo;
        }
      }

      // Get user info for permission check
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userEmail = req.user?.email;

      const updatedExhibitor = await this.exhibitorService.updateExhibitor(
        id,
        exhibitorDto,
        userId,
        userRole,
        userEmail,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Exhibitor updated successfully',
        data: updatedExhibitor,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      // Clean up uploaded files if error occurs
      ExhibitorFileUtils.cleanupUploadedFiles(files);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Exhibitor File Upload');
      }
      
      this.errorHandler.logError(error, 'Exhibitor update', req.user?.id);
      throw error;
    }
  }

  /**
   * Delete an exhibitor
   * Access: Admin and Exhibitor users only
   */
  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async deleteExhibitor(
    @Param('id') id: string, 
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.exhibitorService.deleteExhibitor(id);
      
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
      this.errorHandler.logError(error, 'Exhibitor deletion', req.user?.id);
      throw error;
    }
  }

  /**
   * Remove individual flyer from exhibitor
   * Access: Admin and Exhibitor users only
   */
  @Delete('flyers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async removeExhibitorFlyer(
    @Param('id') id: string,
    @Body() body: { flyerPath: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(id);
      const { flyerPath } = body;

      if (!exhibitor.flyers || !exhibitor.flyers.some(flyer => flyer.flyer === flyerPath)) {
        throw new ResourceNotFoundException('Flyer', 'in this exhibitor');
      }

      // Remove flyer from filesystem
      const fullPath = path.join(__dirname, '..', '..', flyerPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      const updatedFlyers = exhibitor.flyers.filter(flyer => flyer.flyer !== flyerPath);
      await this.exhibitorService.updateExhibitorFlyers(id, updatedFlyers);

      // Get updated exhibitor
      const updatedExhibitor = await this.exhibitorService.getExhibitorById(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Flyer removed successfully',
        data: updatedExhibitor,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Exhibitor flyer removal', req.user?.id);
      throw error;
    }
  }

  /**
   * Remove individual document from exhibitor
   * Access: Admin and Exhibitor users only
   */
  @Delete('documents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async removeExhibitorDocument(
    @Param('id') id: string,
    @Body() body: { documentPath: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(id);
      const { documentPath } = body;

      if (!exhibitor.documents || !exhibitor.documents.some(doc => doc.document === documentPath)) {
        throw new ResourceNotFoundException('Document', 'in this exhibitor');
      }

      // Remove document from filesystem
      const fullPath = path.join(__dirname, '..', '..', documentPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      const updatedDocuments = exhibitor.documents.filter(doc => doc.document !== documentPath);
      await this.exhibitorService.updateExhibitorDocuments(id, updatedDocuments);

      // Get updated exhibitor
      const updatedExhibitor = await this.exhibitorService.getExhibitorById(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Document removed successfully',
        data: updatedExhibitor,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Exhibitor document removal', req.user?.id);
      throw error;
    }
  }

  /**
   * Remove individual event image from exhibitor
   * Access: Admin and Exhibitor users only
   */
  @Delete('eventImages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async removeExhibitorEventImage(
    @Param('id') id: string,
    @Body() body: { eventImagePath: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(id);
      const { eventImagePath } = body;

      if (!exhibitor.eventImages || !exhibitor.eventImages.some(image => image.eventImage === eventImagePath)) {
        throw new ResourceNotFoundException('Event image', 'in this exhibitor');
      }

      // Remove event image from filesystem
      const fullPath = path.join(__dirname, '..', '..', eventImagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      const updatedEventImages = exhibitor.eventImages.filter(image => image.eventImage !== eventImagePath);
      await this.exhibitorService.updateExhibitorEventImages(id, updatedEventImages);

      // Get updated exhibitor
      const updatedExhibitor = await this.exhibitorService.getExhibitorById(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event image removed successfully',
        data: updatedExhibitor,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Exhibitor event image removal', req.user?.id);
      throw error;
    }
  }

  /**
   * Get simplified list of events for report
   * Shows only events where user is staff member
   * Access: Admin and Exhibitor users only
   */
  @Get('report/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async getReportEventsList(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.exhibitorService.getReportEventsList(userId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Report events list retrieved successfully',
        data: result,
        metadata: {
          total: result?.events?.length || 0,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Report events list retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Get event statistics for report
   * Shows: event name, likes, monthly views, downloads, total leads
   * Access: Admin and Exhibitor users only
   */
  @Get('report/event/statistics/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async getEventReportStatistics(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.exhibitorService.getEventReportStatistics(eventId, userId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event statistics retrieved successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event report statistics retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Scan attendee QR code to collect lead
   * Exhibitor scans attendee's QR code to collect their contact details as a lead
   * Access: Admin and Exhibitor users only
   */
  @Post('scan-attendee-qr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async scanAttendeeQRCode(
    @Body() body: { qrCodeId: string; eventId: string; exhibitorId: string; notes?: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const { qrCodeId, eventId, exhibitorId, notes } = body;
      const scannedBy = req.user?.id;

      if (!scannedBy) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      if (!qrCodeId || !eventId || !exhibitorId) {
        throw new BadRequestException('Missing required fields: qrCodeId, eventId, exhibitorId');
      }

      const result = await this.exhibitorService.scanAttendeeQRCodeForLead(
        qrCodeId,
        eventId,
        exhibitorId,
        scannedBy,
        notes,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Attendee QR code scanning for lead collection', req.user?.id);
      throw error;
    }
  }

  // Helper method to format exhibitor response
  private formatExhibitorResponse(exhibitor: any, response: Response, message: string, statusCode: number) {
    const successResponse: SuccessResponse = {
      success: true,
      message,
      data: exhibitor,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    return response.status(statusCode).json(successResponse);
  }
} 