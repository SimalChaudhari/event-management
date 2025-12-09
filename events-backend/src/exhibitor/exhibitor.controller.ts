// src/controllers/exhibitor.controller.ts
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
    UseInterceptors,
    UploadedFiles,
    NotFoundException,
    Request,
    HttpStatus,
    UseGuards,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { promisify } from 'util';
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
import { ExhibitorUpdatePermissionGuard } from './exhibitor-update-permission.guard';

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
   * Safely delete a file with retry logic for Windows file locking issues
   * Ensures file is deleted from filesystem even if there are permission issues
   */
  private async deleteFileSafely(filePath: string, retries = 5, delay = 200): Promise<void> {
    const unlinkAsync = promisify(fs.unlink);
    const accessAsync = promisify(fs.access);
    
    // First check if file exists
    try {
      await accessAsync(filePath, fs.constants.F_OK);
    } catch {
      // File doesn't exist, consider it already deleted
      return;
    }
    
    for (let i = 0; i < retries; i++) {
      try {
        // Try to delete the file
        await unlinkAsync(filePath);
        
        // Verify file is actually deleted
        try {
          await accessAsync(filePath, fs.constants.F_OK);
          // File still exists, continue to retry
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            continue;
          }
        } catch {
          // File successfully deleted (access check failed = file doesn't exist)
          return;
        }
      } catch (error: any) {
        // If it's the last retry, try one more aggressive approach
        if (i === retries - 1) {
          // Last attempt: try with chmod to remove read-only flag (Windows)
          try {
            const chmodAsync = promisify(fs.chmod);
            await chmodAsync(filePath, 0o666); // Make file writable
            await unlinkAsync(filePath);
            return;
          } catch (finalError: any) {
            // If still fails, throw the original error
            throw error;
          }
        }
        
        // If it's a permission error (EPERM) or file in use (EBUSY), wait and retry
        if (error.code === 'EPERM' || error.code === 'EBUSY' || error.code === 'EACCES' || error.code === 'ENOENT') {
          // ENOENT means file doesn't exist (already deleted), which is fine
          if (error.code === 'ENOENT') {
            return;
          }
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }
  }

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

      // Handle booth banner from body (can be JSON string or array)
      if (exhibitorDto.boothBanner) {
        if (typeof exhibitorDto.boothBanner === 'string') {
          try {
            exhibitorDto.boothBanner = JSON.parse(exhibitorDto.boothBanner);
          } catch (e) {
            // If parsing fails, treat as empty array
            exhibitorDto.boothBanner = [];
          }
        }
      }

      // Apply processed files to DTO
      if (fileProcessing.processedFiles) {
        // Handle booth banner - combine existing from DTO with new uploaded files
        if (fileProcessing.processedFiles.boothBanner) {
          const allBoothBanner = exhibitorDto.boothBanner && Array.isArray(exhibitorDto.boothBanner) 
            ? [...exhibitorDto.boothBanner] 
            : [];
          
          // Add new uploaded booth banner files (format: {value: "path"})
          allBoothBanner.push(...fileProcessing.processedFiles.boothBanner);
          exhibitorDto.boothBanner = allBoothBanner;
        } else if (exhibitorDto.boothBanner && Array.isArray(exhibitorDto.boothBanner)) {
          // Normalize format: convert strings to {value: string} objects
          exhibitorDto.boothBanner = exhibitorDto.boothBanner.map((item: any) => {
            if (typeof item === 'object' && item.value) {
              return { value: item.value };
            }
            return { value: typeof item === 'string' ? item : item.value || item };
          });
        }
        
        // Handle flyers - ensure all have unique IDs
        if (fileProcessing.processedFiles.flyers) {
          const flyersWithIds = fileProcessing.processedFiles.flyers.map((flyer: { name: string; flyer: string }) => ({
            ...flyer,
            id: uuidv4(), // Always generate unique ID for new flyers
          }));
          exhibitorDto.flyers = flyersWithIds;
        }
        
        // Handle documents - ensure all have unique IDs
        if (fileProcessing.processedFiles.documents) {
          const documentsWithIds = fileProcessing.processedFiles.documents.map((doc: { name: string; document: string }) => ({
            ...doc,
            id: uuidv4(), // Always generate unique ID for new documents
          }));
          exhibitorDto.documents = documentsWithIds;
        }

        // Handle event images - ensure all have unique IDs
        if (fileProcessing.processedFiles.eventImages) {
          const eventImagesWithIds = fileProcessing.processedFiles.eventImages.map((img: { name: string; eventImage: string }) => ({
            ...img,
            id: uuidv4(), // Always generate unique ID for new event images
          }));
          exhibitorDto.eventImages = eventImagesWithIds;
        }
        
        // Apply other processed files (excluding boothBanner, flyers, documents, eventImages which are handled above)
        const { boothBanner, flyers, documents, eventImages, ...otherFiles } = fileProcessing.processedFiles;
        Object.assign(exhibitorDto, otherFiles);
      }
      
      // Ensure existing flyers in DTO also have IDs (if provided without file upload)
      if (exhibitorDto.flyers && exhibitorDto.flyers.length > 0) {
        exhibitorDto.flyers = exhibitorDto.flyers.map((flyer: any) => ({
          ...flyer,
          id: flyer.id || uuidv4(), // Generate ID if missing
        }));
      }

      // Ensure existing documents in DTO also have IDs (if provided without file upload)
      if (exhibitorDto.documents && exhibitorDto.documents.length > 0) {
        exhibitorDto.documents = exhibitorDto.documents.map((doc: any) => ({
          ...doc,
          id: doc.id || uuidv4(), // Generate ID if missing
        }));
      }

      // Ensure existing event images in DTO also have IDs (if provided without file upload)
      if (exhibitorDto.eventImages && exhibitorDto.eventImages.length > 0) {
        exhibitorDto.eventImages = exhibitorDto.eventImages.map((img: any) => ({
          ...img,
          id: img.id || uuidv4(), // Generate ID if missing
        }));
      }

      // Ensure existing documents in DTO also have IDs (if provided without file upload)
      if (exhibitorDto.documents && exhibitorDto.documents.length > 0) {
        exhibitorDto.documents = exhibitorDto.documents.map((doc: any) => ({
          ...doc,
          id: doc.id || uuidv4(), // Generate ID if missing
        }));
      }

      // Ensure existing event images in DTO also have IDs (if provided without file upload)
      if (exhibitorDto.eventImages && exhibitorDto.eventImages.length > 0) {
        exhibitorDto.eventImages = exhibitorDto.eventImages.map((img: any) => ({
          ...img,
          id: img.id || uuidv4(), // Generate ID if missing
        }));
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
   * Get all exhibitors with search filter and pagination
   * If eventId is provided, only returns exhibitors associated with that event
   * Access: Admin and Exhibitor users only
   */
  @Get('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async getAllExhibitors(
    @Query('eventId') eventId: string | undefined,
    @Query()
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const userRole = req.user?.role;

      // Exhibitor users can only access data when eventId is provided
      if (userRole === UserRole.Exhibitor && !eventId) {
        return response.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: 'Event ID is required for exhibitor users',
        });
      }

      // Extract and process filter parameters
      const processedFilters = {
        page: filters.page ? Number(filters.page) : undefined,
        limit: filters.limit ? Number(filters.limit) : undefined,
        search: filters.search?.trim() || undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortOrder || undefined,
      };

      const result = await this.exhibitorService.getAllExhibitors(eventId, processedFilters);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: eventId 
          ? 'Exhibitors for event retrieved successfully' 
          : 'Exhibitors retrieved successfully',
        data: result.data,
        metadata: {
          ...result.pagination,
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
  @UseGuards(JwtAuthGuard, RolesGuard, ExhibitorUpdatePermissionGuard)
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
      // Handle booth banner from body (can be JSON string or array)
      if (exhibitorDto.boothBanner) {
        if (typeof exhibitorDto.boothBanner === 'string') {
          try {
            exhibitorDto.boothBanner = JSON.parse(exhibitorDto.boothBanner);
          } catch (e) {
            // If parsing fails, treat as empty array
            exhibitorDto.boothBanner = [];
          }
        }
      }

      // Process new files safely
      const fileProcessing = ExhibitorFileUtils.processFilesSafely(files, {
        flyerNames: exhibitorDto.flyerNames,
        documentNames: exhibitorDto.documentNames,
        eventImageNames: exhibitorDto.eventImageNames,
      });

      if (!fileProcessing.success) {
        throw new BadRequestException(`File validation failed: ${fileProcessing.errors?.join(', ')}`);
      }

      // Get existing exhibitor to preserve existing flyers
      const existingExhibitor = await this.exhibitorService.getExhibitorEntityById(id);

      // Handle combining existing and new files
      if (fileProcessing.processedFiles) {
        // Handle flyers - combine existing and new
        if (fileProcessing.processedFiles.flyers) {
          const allFlyers = [];
          
          // Add existing flyers from database (preserve all existing flyers)
          if (existingExhibitor.flyers && existingExhibitor.flyers.length > 0) {
            // Ensure existing flyers have IDs
            const existingFlyersWithIds = existingExhibitor.flyers.map(flyer => ({
              ...flyer,
              id: flyer.id || uuidv4(), // Generate ID if missing
            }));
            allFlyers.push(...existingFlyersWithIds);
          }
          
          // Add new flyers with generated IDs
          const newFlyers = fileProcessing.processedFiles.flyers.map((flyer: { name: string; flyer: string }) => ({
            ...flyer,
            id: uuidv4(), // Generate unique ID for new flyers
          }));
          allFlyers.push(...newFlyers);
          exhibitorDto.flyers = allFlyers;
        }

        // Handle documents - combine existing and new
        if (fileProcessing.processedFiles.documents) {
          const allDocuments: Array<{ id: string; name: string; document: string }> = [];
          
          // Add existing documents from database (preserve all existing documents)
          if (existingExhibitor.documents && existingExhibitor.documents.length > 0) {
            // Ensure existing documents have IDs (required field)
            const existingDocumentsWithIds = existingExhibitor.documents.map(doc => ({
              name: doc.name,
              document: doc.document,
              id: doc.id || uuidv4(), // Generate ID if missing (should always have ID)
            }));
            allDocuments.push(...existingDocumentsWithIds);
          }
          
          // Add new documents with generated IDs (always required)
          const newDocuments: Array<{ id: string; name: string; document: string }> = fileProcessing.processedFiles.documents.map((doc: { name: string; document: string }) => ({
            name: doc.name,
            document: doc.document,
            id: uuidv4(), // Always generate unique ID for new documents
          }));
          allDocuments.push(...newDocuments);
          exhibitorDto.documents = allDocuments;
        } else if (exhibitorDto.documents && exhibitorDto.documents.length > 0) {
          // If documents are provided in DTO without file upload, ensure they have IDs
          exhibitorDto.documents = exhibitorDto.documents.map((doc: any) => ({
            name: doc.name,
            document: doc.document,
            id: doc.id || uuidv4(), // Generate ID if missing
          }));
        }

        // Handle event images - combine existing and new
        if (fileProcessing.processedFiles.eventImages) {
          const allEventImages: Array<{ id: string; name: string; eventImage: string }> = [];
          
          // Add existing event images from database (preserve all existing event images)
          if (existingExhibitor.eventImages && existingExhibitor.eventImages.length > 0) {
            // Ensure existing event images have IDs (required field)
            const existingEventImagesWithIds = existingExhibitor.eventImages.map(img => ({
              name: img.name,
              eventImage: img.eventImage,
              id: img.id || uuidv4(), // Generate ID if missing (should always have ID)
            }));
            allEventImages.push(...existingEventImagesWithIds);
          }
          
          // Add new event images with generated IDs (always required)
          const newEventImages: Array<{ id: string; name: string; eventImage: string }> = fileProcessing.processedFiles.eventImages.map((img: { name: string; eventImage: string }) => ({
            name: img.name,
            eventImage: img.eventImage,
            id: uuidv4(), // Always generate unique ID for new event images
          }));
          allEventImages.push(...newEventImages);
          exhibitorDto.eventImages = allEventImages;
        } else if (exhibitorDto.eventImages && exhibitorDto.eventImages.length > 0) {
          // If event images are provided in DTO without file upload, ensure they have IDs
          exhibitorDto.eventImages = exhibitorDto.eventImages.map((img: any) => ({
            name: img.name,
            eventImage: img.eventImage,
            id: img.id || uuidv4(), // Generate ID if missing
          }));
        }

        // Handle logo
        if (fileProcessing.processedFiles.logo) {
          exhibitorDto.logo = fileProcessing.processedFiles.logo;
        }

        // Handle booth banner - ADD new banners to existing ones (like flyers)
        if (fileProcessing.processedFiles.boothBanner) {
          const allBoothBanner = [];
          
          // Add existing booth banners from database (preserve all existing banners)
          if (existingExhibitor.boothBanners && existingExhibitor.boothBanners.length > 0) {
            const existingBanners = existingExhibitor.boothBanners.map(bb => ({
              id: bb.id, // Preserve existing ID
              value: bb.banner, // Use banner field as value
            }));
            allBoothBanner.push(...existingBanners);
          }
          
          // Add new uploaded booth banner files (format: {value: "path"})
          // fileProcessing.processedFiles.boothBanner returns array of {value: string} objects
          const newBanners = fileProcessing.processedFiles.boothBanner.map((banner: any) => {
            // Extract value from object (it's already in {value: "path"} format)
            return {
              value: typeof banner === 'object' && banner.value ? banner.value : String(banner)
            };
          });
          allBoothBanner.push(...newBanners);
          exhibitorDto.boothBanner = allBoothBanner;
        } else if (exhibitorDto.boothBanner && Array.isArray(exhibitorDto.boothBanner)) {
          // If boothBanner is provided in DTO without new files, preserve existing and merge
          const allBoothBanner = [];
          
          // Add existing booth banners from database
          if (existingExhibitor.boothBanners && existingExhibitor.boothBanners.length > 0) {
            const existingBanners = existingExhibitor.boothBanners.map(bb => ({
              id: bb.id,
              value: bb.banner,
            }));
            allBoothBanner.push(...existingBanners);
          }
          
          // Normalize and add DTO banners (these are new links/URLs to add)
          const normalizedBanners = exhibitorDto.boothBanner.map((item: any) => {
            if (typeof item === 'object' && item.value) {
              return { value: item.value };
            }
            return { value: typeof item === 'string' ? item : item.value || item };
          });
          allBoothBanner.push(...normalizedBanners);
          exhibitorDto.boothBanner = allBoothBanner;
        }
        // If boothBanner is not provided in DTO and no new files, it will remain undefined
        // and won't overwrite existing values (preserves existing booth banner)
      } else if (exhibitorDto.boothBanner && Array.isArray(exhibitorDto.boothBanner)) {
        // If only DTO provided without file processing, combine with existing
        const allBoothBanner = [];
        
        // Add existing booth banners from database
        if (existingExhibitor.boothBanners && existingExhibitor.boothBanners.length > 0) {
          const existingBanners = existingExhibitor.boothBanners.map(bb => ({
            id: bb.id,
            value: bb.banner,
          }));
          allBoothBanner.push(...existingBanners);
        }
        
        // Normalize and add DTO banners
        const normalizedBanners = exhibitorDto.boothBanner.map((item: any) => {
          if (typeof item === 'object' && item.value) {
            return { value: item.value };
          }
          return { value: typeof item === 'string' ? item : item.value || item };
        });
        allBoothBanner.push(...normalizedBanners);
        exhibitorDto.boothBanner = allBoothBanner;
      }
      // If boothBanner is not provided in DTO and no files uploaded, leave it undefined
      // This preserves existing booth banner in database

      // Get user info
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userEmail = req.user?.email;

      // Permission check is now handled by ExhibitorUpdatePermissionGuard (runs BEFORE interceptor)
      // So files are only uploaded if permission is granted

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
   * Remove individual flyer from exhibitor by flyer ID
   * Access: Admin and Exhibitor users only
   */
  @Delete('flyers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async removeExhibitorFlyer(
    @Param('id') exhibitorId: string,
    @Body() body: { flyerId: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(exhibitorId);
      const { flyerId } = body;

      if (!flyerId) {
        throw new BadRequestException('flyerId is required');
      }

      // Find flyer by ID
      if (!exhibitor.flyers || exhibitor.flyers.length === 0) {
        throw new ResourceNotFoundException('Flyer', flyerId);
      }

      const flyerToRemove = exhibitor.flyers.find(flyer => flyer.id === flyerId);
      
      if (!flyerToRemove) {
        throw new ResourceNotFoundException('Flyer', flyerId);
      }

      // Remove flyer from filesystem with error handling
      const fullPath = path.join(__dirname, '..', '..', flyerToRemove.flyer);
      try {
        // Use async unlink with retry for Windows file locking issues
        // This will ensure file is deleted from folder
        await this.deleteFileSafely(fullPath);
      } catch (fileError: any) {
        // If file still exists after all retries, log error but continue
        const fileExists = fs.existsSync(fullPath);
        if (fileExists) {
          console.error(`Failed to delete file after retries: ${fullPath}`, fileError);
          this.errorHandler.logError(
            fileError,
            `File deletion failed for flyer: ${flyerToRemove.flyer}. File may need manual deletion.`,
            req.user?.id,
          );
        }
      }

      // Remove flyer from array by ID
      const updatedFlyers = exhibitor.flyers.filter(flyer => flyer.id !== flyerId);
      await this.exhibitorService.updateExhibitorFlyers(exhibitorId, updatedFlyers);

      // Get updated exhibitor
      const updatedExhibitor = await this.exhibitorService.getExhibitorById(exhibitorId);

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
   * Remove individual document from exhibitor by document ID
   * Access: Admin and Exhibitor users only
   */
  @Delete('documents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async removeExhibitorDocument(
    @Param('id') exhibitorId: string,
    @Body() body: { documentId: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(exhibitorId);
      const { documentId } = body;

      if (!documentId) {
        throw new BadRequestException('documentId is required');
      }

      // Find document by ID
      if (!exhibitor.documents || exhibitor.documents.length === 0) {
        throw new ResourceNotFoundException('Document', documentId);
      }

      const documentToRemove = exhibitor.documents.find(doc => doc.id === documentId);
      
      if (!documentToRemove) {
        throw new ResourceNotFoundException('Document', documentId);
      }

      // Remove document from filesystem with error handling
      const fullPath = path.join(__dirname, '..', '..', documentToRemove.document);
      try {
        // Use async unlink with retry for Windows file locking issues
        // This will ensure file is deleted from folder
        await this.deleteFileSafely(fullPath);
      } catch (fileError: any) {
        // If file still exists after all retries, log error but continue
        const fileExists = fs.existsSync(fullPath);
        if (fileExists) {
          console.error(`Failed to delete file after retries: ${fullPath}`, fileError);
          this.errorHandler.logError(
            fileError,
            `File deletion failed for document: ${documentToRemove.document}. File may need manual deletion.`,
            req.user?.id,
          );
        }
      }

      // Remove document from array by ID
      const updatedDocuments = exhibitor.documents.filter(doc => doc.id !== documentId);
      await this.exhibitorService.updateExhibitorDocuments(exhibitorId, updatedDocuments);

      // Get updated exhibitor
      const updatedExhibitor = await this.exhibitorService.getExhibitorById(exhibitorId);

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
   * Remove individual event image from exhibitor by event image ID
   * Access: Admin and Exhibitor users only
   */
  @Delete('eventImages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async removeExhibitorEventImage(
    @Param('id') exhibitorId: string,
    @Body() body: { eventImageId: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(exhibitorId);
      const { eventImageId } = body;

      if (!eventImageId) {
        throw new BadRequestException('eventImageId is required');
      }

      // Find event image by ID
      if (!exhibitor.eventImages || exhibitor.eventImages.length === 0) {
        throw new ResourceNotFoundException('Event image', eventImageId);
      }

      const eventImageToRemove = exhibitor.eventImages.find(img => img.id === eventImageId);
      
      if (!eventImageToRemove) {
        throw new ResourceNotFoundException('Event image', eventImageId);
      }

      // Remove event image from filesystem with error handling
      const fullPath = path.join(__dirname, '..', '..', eventImageToRemove.eventImage);
      if (fs.existsSync(fullPath)) {
        try {
          // Use async unlink with retry for Windows file locking issues
          await this.deleteFileSafely(fullPath);
        } catch (fileError) {
          // Log the error but continue with database deletion
          // File might be locked or permission issue, but we still remove from DB
          console.warn(`Failed to delete file ${fullPath}:`, fileError);
          this.errorHandler.logError(
            fileError,
            `File deletion warning for event image: ${eventImageToRemove.eventImage}`,
            req.user?.id,
          );
        }
      }

      // Remove event image from array by ID
      const updatedEventImages = exhibitor.eventImages.filter(img => img.id !== eventImageId);
      await this.exhibitorService.updateExhibitorEventImages(exhibitorId, updatedEventImages);

      // Get updated exhibitor
      const updatedExhibitor = await this.exhibitorService.getExhibitorById(exhibitorId);

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
   * Remove individual item from booth banner (image, video, or link)
   * Access: Admin and Exhibitor users only
   */
  @Delete('boothBanner/:id/:bannerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async removeBoothBannerItem(
    @Param('id') id: string, // Exhibitor ID
    @Param('bannerId') bannerId: string, // Booth Banner ID
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Get user info for permission check
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userEmail = req.user?.email;

      // Check permission: Only admin or the exhibitor owner can delete booth banner items
      if (userRole === 'exhibitor' && userId) {
        const userCanUpdate = await this.exhibitorService.canUserUpdateExhibitor(
          id,
          userId,
          userEmail,
        );

        if (!userCanUpdate) {
          throw new ForbiddenException(
            'You do not have permission to delete booth banner items from this exhibitor. You can only delete items from your own exhibitor profile.',
          );
        }
      }

      // Delete the booth banner using the new table structure
      await this.exhibitorService.deleteBoothBanner(bannerId, id);

      // Get updated exhibitor
      const updatedExhibitor = await this.exhibitorService.getExhibitorById(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Booth banner item removed successfully',
        data: updatedExhibitor,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Booth banner item removal', req.user?.id);
      throw error;
    }
  }

  /**
   * Delete all booth banners for an exhibitor
   * Access: Admin and Exhibitor users only
   */
  @Delete('boothBanner/:id/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async removeAllBoothBanners(
    @Param('id') id: string, // Exhibitor ID
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Get user info for permission check
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userEmail = req.user?.email;

      // Check permission: Only admin or the exhibitor owner can delete all booth banners
      if (userRole === 'exhibitor' && userId) {
        const userCanUpdate = await this.exhibitorService.canUserUpdateExhibitor(
          id,
          userId,
          userEmail,
        );

        if (!userCanUpdate) {
          throw new ForbiddenException(
            'You do not have permission to delete booth banners from this exhibitor. You can only delete banners from your own exhibitor profile.',
          );
        }
      }

      // Delete all booth banners
      await this.exhibitorService.deleteAllBoothBanners(id);

      // Get updated exhibitor
      const updatedExhibitor = await this.exhibitorService.getExhibitorById(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'All booth banners removed successfully',
        data: updatedExhibitor,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'All booth banners removal', req.user?.id);
      throw error;
    }
  }

  /**
   * Download single flyer by ID
   * Access: Admin and Exhibitor users only
   */
  @Get('flyers/:exhibitorId/:flyerId/download')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async downloadFlyer(
    @Param('exhibitorId') exhibitorId: string,
    @Param('flyerId') flyerId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(exhibitorId);
      
      if (!exhibitor.flyers || exhibitor.flyers.length === 0) {
        throw new ResourceNotFoundException('Flyer', flyerId);
      }

      const flyer = exhibitor.flyers.find(f => f.id === flyerId);
      if (!flyer) {
        throw new ResourceNotFoundException('Flyer', flyerId);
      }

      const filePath = path.join(__dirname, '..', '..', flyer.flyer);
      if (!fs.existsSync(filePath)) {
        throw new ResourceNotFoundException('Flyer file', flyer.flyer);
      }

      const fileName = path.basename(flyer.flyer);
      response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(flyer.name || fileName)}"`);
      response.setHeader('Content-Type', 'application/octet-stream');
      
      return response.sendFile(path.resolve(filePath));
    } catch (error) {
      this.errorHandler.logError(error, 'Flyer download', req.user?.id);
      throw error;
    }
  }

  /**
   * Download all flyers as ZIP
   * Access: Admin and Exhibitor users only
   */
  @Get('flyers/:exhibitorId/download-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async downloadAllFlyers(
    @Param('exhibitorId') exhibitorId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const archiver = require('archiver');
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(exhibitorId);
      
      if (!exhibitor.flyers || exhibitor.flyers.length === 0) {
        throw new BadRequestException('No flyers found to download');
      }

      const archive = archiver('zip', { zlib: { level: 9 } });
      response.attachment(`exhibitor-${exhibitorId}-flyers.zip`);
      archive.pipe(response);

      let addedFiles = 0;
      for (const flyer of exhibitor.flyers) {
        const filePath = path.join(__dirname, '..', '..', flyer.flyer);
        if (fs.existsSync(filePath)) {
          const fileName = flyer.name || path.basename(flyer.flyer);
          archive.file(filePath, { name: fileName });
          addedFiles++;
        }
      }

      if (addedFiles === 0) {
        throw new BadRequestException('No valid flyer files found to download');
      }

      await archive.finalize();
    } catch (error) {
      this.errorHandler.logError(error, 'All flyers download', req.user?.id);
      throw error;
    }
  }

  /**
   * Download single document by ID
   * Access: Admin and Exhibitor users only
   */
  @Get('documents/:exhibitorId/:documentId/download')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async downloadDocument(
    @Param('exhibitorId') exhibitorId: string,
    @Param('documentId') documentId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(exhibitorId);
      
      if (!exhibitor.documents || exhibitor.documents.length === 0) {
        throw new ResourceNotFoundException('Document', documentId);
      }

      const document = exhibitor.documents.find(d => d.id === documentId);
      if (!document) {
        throw new ResourceNotFoundException('Document', documentId);
      }

      const filePath = path.join(__dirname, '..', '..', document.document);
      if (!fs.existsSync(filePath)) {
        throw new ResourceNotFoundException('Document file', document.document);
      }

      const fileName = path.basename(document.document);
      response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.name || fileName)}"`);
      response.setHeader('Content-Type', 'application/octet-stream');
      
      return response.sendFile(path.resolve(filePath));
    } catch (error) {
      this.errorHandler.logError(error, 'Document download', req.user?.id);
      throw error;
    }
  }

  /**
   * Download all documents as ZIP
   * Access: Admin and Exhibitor users only
   */
  @Get('documents/:exhibitorId/download-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async downloadAllDocuments(
    @Param('exhibitorId') exhibitorId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const archiver = require('archiver');
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(exhibitorId);
      
      if (!exhibitor.documents || exhibitor.documents.length === 0) {
        throw new BadRequestException('No documents found to download');
      }

      const archive = archiver('zip', { zlib: { level: 9 } });
      response.attachment(`exhibitor-${exhibitorId}-documents.zip`);
      archive.pipe(response);

      let addedFiles = 0;
      for (const document of exhibitor.documents) {
        const filePath = path.join(__dirname, '..', '..', document.document);
        if (fs.existsSync(filePath)) {
          const fileName = document.name || path.basename(document.document);
          archive.file(filePath, { name: fileName });
          addedFiles++;
        }
      }

      if (addedFiles === 0) {
        throw new BadRequestException('No valid document files found to download');
      }

      await archive.finalize();
    } catch (error) {
      this.errorHandler.logError(error, 'All documents download', req.user?.id);
      throw error;
    }
  }

  /**
   * Download single event image by ID
   * Access: Admin and Exhibitor users only
   */
  @Get('eventImages/:exhibitorId/:eventImageId/download')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async downloadEventImage(
    @Param('exhibitorId') exhibitorId: string,
    @Param('eventImageId') eventImageId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(exhibitorId);
      
      if (!exhibitor.eventImages || exhibitor.eventImages.length === 0) {
        throw new ResourceNotFoundException('Event image', eventImageId);
      }

      const eventImage = exhibitor.eventImages.find(img => img.id === eventImageId);
      if (!eventImage) {
        throw new ResourceNotFoundException('Event image', eventImageId);
      }

      const filePath = path.join(__dirname, '..', '..', eventImage.eventImage);
      if (!fs.existsSync(filePath)) {
        throw new ResourceNotFoundException('Event image file', eventImage.eventImage);
      }

      const fileName = path.basename(eventImage.eventImage);
      response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(eventImage.name || fileName)}"`);
      response.setHeader('Content-Type', 'application/octet-stream');
      
      return response.sendFile(path.resolve(filePath));
    } catch (error) {
      this.errorHandler.logError(error, 'Event image download', req.user?.id);
      throw error;
    }
  }

  /**
   * Download all event images as ZIP
   * Access: Admin and Exhibitor users only
   */
  @Get('eventImages/:exhibitorId/download-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async downloadAllEventImages(
    @Param('exhibitorId') exhibitorId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const archiver = require('archiver');
      const exhibitor = await this.exhibitorService.getExhibitorEntityById(exhibitorId);
      
      if (!exhibitor.eventImages || exhibitor.eventImages.length === 0) {
        throw new BadRequestException('No event images found to download');
      }

      const archive = archiver('zip', { zlib: { level: 9 } });
      response.attachment(`exhibitor-${exhibitorId}-event-images.zip`);
      archive.pipe(response);

      let addedFiles = 0;
      for (const eventImage of exhibitor.eventImages) {
        const filePath = path.join(__dirname, '..', '..', eventImage.eventImage);
        if (fs.existsSync(filePath)) {
          const fileName = eventImage.name || path.basename(eventImage.eventImage);
          archive.file(filePath, { name: fileName });
          addedFiles++;
        }
      }

      if (addedFiles === 0) {
        throw new BadRequestException('No valid event image files found to download');
      }

      await archive.finalize();
    } catch (error) {
      this.errorHandler.logError(error, 'All event images download', req.user?.id);
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