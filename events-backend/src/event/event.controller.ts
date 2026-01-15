// src/controllers/event.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  NotFoundException,
  UploadedFiles,
  Request,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EventService } from './event.service';
import { EventDto, EventType } from './event.dto';
import path from 'path';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import * as fs from 'fs';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import { ResourceNotFoundException } from '../utils/exceptions/custom-exceptions';
import { FileUploadUtils, FileUploadConfig } from '../utils/filesUploadFormat/file-upload.utils';
import { TabVisibilityFilterUtil } from '../utils/tab-visibility-filter.util';
import { EventNotificationService } from '../utils/event-notification.service';
import { ProgrammeService } from '../programme/programme.service';
import { FilterService } from '../service/filter.service';
import {
  CreateProgrammeTrackDto,
  UpdateProgrammeTrackDto,
  CreateProgrammeSessionDto,
  UpdateProgrammeSessionDto,
  UpdateProgrammeTrackOrderDto,
} from '../programme/programme.dto';

@Controller('api/events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly eventNotificationService: EventNotificationService,
    private readonly programmeService: ProgrammeService,
    private readonly filterService: FilterService,
  ) {}

  @Post('create')
  @Roles(UserRole.Admin)
  @UseInterceptors(FileUploadUtils.createEventFileInterceptor())
    async createEvent(
    @Body() eventDto: EventDto,
    @UploadedFiles() files: FileUploadConfig,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // First validate and process files safely
      const fileProcessing = FileUploadUtils.processFilesSafely(files);
      if (!fileProcessing.success) {
        // Files are invalid, they've already been cleaned up
        throw new BadRequestException(`File validation failed: ${fileProcessing.errors?.join(', ')}`);
      }

      // Process files safely
      if (fileProcessing.processedFiles?.images && fileProcessing.processedFiles.images.length > 0) {
        eventDto.images = fileProcessing.processedFiles.images;
      }

      // Parse JSON strings from FormData for stamps
      if (eventDto.eventStampIds && typeof eventDto.eventStampIds === 'string') {
        try {
          eventDto.eventStampIds = JSON.parse(eventDto.eventStampIds);
        } catch (e) {
          eventDto.eventStampIds = [];
        }
      }

      if (eventDto.newStamps && typeof eventDto.newStamps === 'string') {
        try {
          eventDto.newStamps = JSON.parse(eventDto.newStamps);
        } catch (e) {
          eventDto.newStamps = [];
        }
      }

      // Handle new stamps creation - process stamp images if provided
      if (fileProcessing.processedFiles?.eventStampImages && fileProcessing.processedFiles.eventStampImages.length > 0) {
        // If newStamps array is provided, add image paths to each stamp
        if (eventDto.newStamps && Array.isArray(eventDto.newStamps)) {
          // Match images to stamps by index (assuming same order)
          eventDto.newStamps = eventDto.newStamps.map((stamp, index) => ({
            ...stamp,
            image: fileProcessing.processedFiles.eventStampImages[index] || stamp.image,
          }));
        }
      }

      if (fileProcessing.processedFiles?.documents && fileProcessing.processedFiles.documents.length > 0) {
        eventDto.documents = fileProcessing.processedFiles.documents;
        
        // Handle document names - get from body or use original filenames
        if (eventDto.documentNames) {
          // If names are provided in body, use them
          const names = Array.isArray(eventDto.documentNames) 
            ? eventDto.documentNames 
            : [eventDto.documentNames];
          eventDto.documentNames = names;
        } else {
          // Use original filenames as fallback
          const originalNames = files.documents?.map((doc) => doc.originalname) || [];
          eventDto.documentNames = originalNames;
        }
      }

      // Handle floor plan
      if (fileProcessing.processedFiles?.floorPlan) {
        eventDto.floorPlan = fileProcessing.processedFiles.floorPlan;
      }

      // Handle background image
      if (fileProcessing.processedFiles?.backgroundImage) {
        eventDto.backgroundImage = fileProcessing.processedFiles.backgroundImage;
      }

      const savedEvent = await this.eventService.createEvent(eventDto);

    const successResponse: SuccessResponse = {
      success: true,
      message: 'Event created successfully',
      data: savedEvent,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    return response.status(HttpStatus.CREATED).json(successResponse);
         } catch (error: any) {
       // Clean up uploaded files if error occurs
       FileUploadUtils.cleanupUploadedFiles(files);
       
       if (error.code === 'LIMIT_FILE_SIZE') {
         this.errorHandler.handleFileUploadError(error, 'Event File Upload');
       }
       
       this.errorHandler.logError(error, 'Event creation', req.user?.id);
       throw error;
     }
  }

  @Get()
  async getAllEvents(
    @Query()
    filters: {
      keyword?: string;
      startDate?: string;
      endDate?: string;
      publishStartDate?: string; // Publish start date filter
      publishEndDate?: string; // Publish end date filter
      type?: EventType;
      price?: number;
      location?: string;
      category?: string;
      eventName?: string; // Event name filter
      globalSearch?: string; // Global search term
      page?: number; // Pagination: page number
      limit?: number; // Pagination: items per page
      search?: string; // Pagination: search term
      sortBy?: string; // Pagination: sort field
      sortOrder?: 'ASC' | 'DESC'; // Pagination: sort order
    },
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id; // Get user ID from JWT token
      const userRole = req?.user?.role; // Get actual role from JWT

      // Extract pagination parameters
      const { page, limit, sortBy, sortOrder, ...eventFilters } = filters;

      // Use common filter service to process pagination
      // This removes page/limit if they weren't in the raw query
      const paginationFilters = this.filterService.processFiltersWithPagination(
        { page, limit, sortBy, sortOrder },
        req.query
      );

      // Convert string query parameters to appropriate types
      const processedFilters = {
        ...eventFilters,
        // globalSearch should be a string for search terms
        globalSearch: typeof eventFilters.globalSearch === 'string' ? eventFilters.globalSearch : undefined,
        // eventName should be a string for event name filtering
        eventName: typeof eventFilters.eventName === 'string' ? eventFilters.eventName : undefined,
        // Add pagination parameters (will be undefined if not in raw query)
        page: paginationFilters.page,
        limit: paginationFilters.limit,
        sortBy: paginationFilters.sortBy || undefined,
        sortOrder: paginationFilters.sortOrder || undefined,
      };

      const result = await this.eventService.getAllEvents(processedFilters, userId, userRole);
      
      // Filter data for each event based on tab visibility for non-admin users
      const filteredResult = TabVisibilityFilterUtil.filterEventResultByTabVisibility(result, userRole);
      
      // Build metadata with pagination from service
      const metadata: any = {
        total: result.pagination?.total || filteredResult.events?.length || 0,
        timestamp: new Date().toISOString(),
        ...(result.metadata?.globalSearch !== undefined && { globalSearch: result.metadata.globalSearch }),
        ...(result.metadata?.searchKeyword && { searchKeyword: result.metadata.searchKeyword }),
      };

      // Add pagination fields from service
      if (result.pagination) {
        metadata.page = result.pagination.page;
        metadata.limit = result.pagination.limit;
        metadata.totalPages = result.pagination.totalPages;
        metadata.hasNext = result.pagination.hasNext;
        metadata.hasPrev = result.pagination.hasPrev;
      }

      // Add additional metadata fields if they exist (for global search)
      if (result.metadata) {
        if (result.metadata.totalSpeakers !== undefined) metadata.totalSpeakers = result.metadata.totalSpeakers;
        if (result.metadata.totalCategories !== undefined) metadata.totalCategories = result.metadata.totalCategories;
        if (result.metadata.totalExhibitors !== undefined) metadata.totalExhibitors = result.metadata.totalExhibitors;
        if (result.metadata.totalSurveySessions !== undefined) metadata.totalSurveySessions = result.metadata.totalSurveySessions;
        if (result.metadata.totalMatches !== undefined) metadata.totalMatches = result.metadata.totalMatches;
      }

      const successResponse: any = {
        success: true,
        message: 'Events retrieved successfully',
        events: filteredResult.events || [],
        ...(filteredResult.speakers && { speakers: filteredResult.speakers }),
        ...(filteredResult.categories && { categories: filteredResult.categories }),
        ...(filteredResult.exhibitors && { exhibitors: filteredResult.exhibitors }),
        ...(filteredResult.surveySessions && { surveySessions: filteredResult.surveySessions }),
        ...(filteredResult.filter && { filter: filteredResult.filter }),
        metadata: metadata,
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Events retrieval', req.user?.id);
      throw error;
    }
  }

  @Get('dropdown-list')
  async getEventDropdownList(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const userRole = req.user?.role;
      const summaries = await this.eventService.getEventSummariesForRegistration(userRole);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Event summaries retrieved successfully',
        data: summaries,
        metadata: {
          count: summaries.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.errorHandler.logError(error, 'Event dropdown list retrieval', req.user?.id);
      throw error;
    }
  }

  @Put(':id/tab-visibility')
  @Roles(UserRole.Admin)
  async updateTabVisibility(
    @Param('id') id: string,
    @Body() tabVisibility: {
      speakers?: boolean;
      documents?: boolean;
      floorplan?: boolean;
      gallery?: boolean;
      stamps?: boolean;
      survey?: boolean;
      exhibitors?: boolean;
      categories?: boolean;
      agenda?: boolean;
      adminInfo?: boolean;
      engagement?: boolean;
    },
    @Res() response: Response,
  ) {
    try {
      console.log('🔧 Updating tab visibility:', {
        eventId: id,
        tabVisibilitySettings: tabVisibility
      });
      
      const updatedEvent = await this.eventService.updateTabVisibility(id, tabVisibility);
      
      console.log('✅ Tab visibility updated successfully:', {
        eventId: updatedEvent.id,
        newTabVisibility: updatedEvent.tabVisibility
      });
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event tab visibility updated successfully',
        data: updatedEvent,
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error:any) {
      console.error('❌ Error updating tab visibility:', error);
      this.errorHandler.logError(error, 'Tab visibility update');
      throw error;
    }
  }

  @Get(':id')
  async getEventById(
    @Param('id') id: string, 
    @Request() req: any,
    @Res() response: Response
  ) {
    try {
      const userId = req.user?.id; // Get user ID from JWT token
      const userRole = req?.user?.role; // Get actual role from JWT
      const event = await this.eventService.getEventById(id, userId, userRole);
      
      // Filter data based on tab visibility for non-admin users
      const filteredEvent = TabVisibilityFilterUtil.filterEventDataByTabVisibility(event, userRole);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event retrieved successfully',
        data: filteredEvent,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event retrieval by ID', req.user?.id);
      throw error;
    }
  }

  @Put('update/:id')
  @Roles(UserRole.Admin)
  @UseInterceptors(FileUploadUtils.createEventFileInterceptor())
  async updateEvent(
    @Param('id') id: string,
    @Body() eventDto: EventDto,
    @UploadedFiles() files: FileUploadConfig,
    @Res() response: Response,
    @Request() req: any,
  ) {
    let existingEvent = null;
    
    try {
      // Get existing event first
      existingEvent = await this.eventService.getEventEntityById(id);
      
      // Handle images - combine existing and new images
      const allImages = [];
      
      // Add existing images from originalImages field
      if (eventDto.originalImages) {
        const originalImages = Array.isArray(eventDto.originalImages) 
          ? eventDto.originalImages 
          : [eventDto.originalImages];
        allImages.push(...originalImages);
      }
      
             // Add new uploaded images
       if (files.images && files.images.length > 0) {
         // Validate new images before processing
         const imageValidation = FileUploadUtils.validateUploadedFiles({ images: files.images });
         if (!imageValidation.isValid) {
           // Clean up invalid images immediately
           FileUploadUtils.cleanupUploadedFiles({ images: files.images });
           throw new BadRequestException(`Image validation failed: ${imageValidation.errors.join(', ')}`);
         }
         
         const newImages = files.images.map(
           (img) => `uploads/event/images/${img.filename}`,
         );
         allImages.push(...newImages);
       }
      
      // Set the combined images
      if (allImages.length > 0) {
        eventDto.images = allImages;
      }

      // Handle documents - combine existing and new documents
      const allDocuments = [];
      const allDocumentNames = [];
      
      // Add existing documents from originalDocuments field
      if (eventDto.originalDocuments) {
        const originalDocuments = Array.isArray(eventDto.originalDocuments) 
          ? eventDto.originalDocuments 
          : [eventDto.originalDocuments];
        allDocuments.push(...originalDocuments);
        
        // Add existing document names
        if (eventDto.originalDocumentNames) {
          const originalDocumentNames = Array.isArray(eventDto.originalDocumentNames) 
            ? eventDto.originalDocumentNames 
            : [eventDto.originalDocumentNames];
          allDocumentNames.push(...originalDocumentNames);
        }
      }
      
             // Add new uploaded documents
       if (files.documents && files.documents.length > 0) {
         // Validate new documents before processing
         const documentValidation = FileUploadUtils.validateUploadedFiles({ documents: files.documents });
         if (!documentValidation.isValid) {
           // Clean up invalid documents immediately
           FileUploadUtils.cleanupUploadedFiles({ documents: files.documents });
           throw new BadRequestException(`Document validation failed: ${documentValidation.errors.join(', ')}`);
         }
         
         const newDocuments = files.documents.map(
           (doc) => `uploads/event/documents/${doc.filename}`,
         );
         allDocuments.push(...newDocuments);
        
        // Handle document names for new uploads - get from body or use original filenames
        if (eventDto.documentNames) {
          // If names are provided in body for new uploads, use them
          const newNames = Array.isArray(eventDto.documentNames) 
            ? eventDto.documentNames 
            : [eventDto.documentNames];
          allDocumentNames.push(...newNames);
        } else {
          // Use original filenames as fallback for new uploads
          const newDocumentNames = files.documents.map(
            (doc) => doc.originalname
          );
          allDocumentNames.push(...newDocumentNames);
        }
      }
      
      // Set the combined documents and document names
      if (allDocuments.length > 0) {
        eventDto.documents = allDocuments;
        eventDto.documentNames = allDocumentNames;
      }

             // Handle floor plan - single image only
       if (files.floorPlan && files.floorPlan.length > 0) {
         // Validate new floor plan before processing
         const floorPlanValidation = FileUploadUtils.validateUploadedFiles({ floorPlan: files.floorPlan });
         if (!floorPlanValidation.isValid) {
           // Clean up invalid floor plan immediately
           FileUploadUtils.cleanupUploadedFiles({ floorPlan: files.floorPlan });
           throw new BadRequestException(`Floor plan validation failed: ${floorPlanValidation.errors.join(', ')}`);
         }
         
         // New floor plan uploaded - replace existing
         eventDto.floorPlan = `uploads/event/floorPlan/${files.floorPlan[0].filename}`;
       } else if (eventDto.originalFloorPlan) {
        // Keep existing floor plan if no new one uploaded
        eventDto.floorPlan = eventDto.originalFloorPlan;
      }

      // Parse JSON strings from FormData for stamps
      if (eventDto.eventStampIds !== undefined) {
        let stampIdsValue: string | string[] | any = eventDto.eventStampIds;
        
        if (typeof stampIdsValue === 'string') {
          const stampIdsStr: string = stampIdsValue;
          try {
            const parsed = JSON.parse(stampIdsStr);
            // Ensure it's an array
            stampIdsValue = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            // If parsing fails, try to treat as comma-separated string
            if (stampIdsStr.includes(',')) {
              stampIdsValue = stampIdsStr.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
            } else {
              // Single ID or empty
              stampIdsValue = stampIdsStr.trim().length > 0 ? [stampIdsStr.trim()] : [];
            }
          }
        } else if (!Array.isArray(stampIdsValue)) {
          // If it's not a string and not an array, convert to array
          stampIdsValue = [];
        }
        // Ensure all IDs are strings and filter out empty values
        if (Array.isArray(stampIdsValue)) {
          eventDto.eventStampIds = stampIdsValue
            .map((id: any) => String(id).trim())
            .filter((id: string) => id.length > 0);
        } else {
          eventDto.eventStampIds = [];
        }
      }

      if (eventDto.newStamps && typeof eventDto.newStamps === 'string') {
        try {
          eventDto.newStamps = JSON.parse(eventDto.newStamps);
        } catch (e) {
          // If parsing fails, treat as empty array
          eventDto.newStamps = [];
        }
      }

      // Handle new stamps creation - process stamp images if provided
      if (files.eventStampImages && files.eventStampImages.length > 0) {
        // Validate new event stamp images before processing
        const eventStampValidation = FileUploadUtils.validateUploadedFiles({ eventStampImages: files.eventStampImages });
        if (!eventStampValidation.isValid) {
          // Clean up invalid event stamp images immediately
          FileUploadUtils.cleanupUploadedFiles({ eventStampImages: files.eventStampImages });
          throw new BadRequestException(`Event stamp image validation failed: ${eventStampValidation.errors.join(', ')}`);
        }
        
        // If newStamps array is provided, add image paths to each stamp
        if (eventDto.newStamps && Array.isArray(eventDto.newStamps)) {
          // Match images to stamps by index (assuming same order)
          const newEventStampImages = files.eventStampImages.map(
            (img) => `uploads/eventStamps/${img.filename}`,
          );
          eventDto.newStamps = eventDto.newStamps.map((stamp, index) => ({
            ...stamp,
            image: newEventStampImages[index] || stamp.image,
          }));
        }
      }

       // Handle background image - single image only
       if (files.backgroundImage && files.backgroundImage.length > 0) {
         // Validate new background image before processing
         const backgroundValidation = FileUploadUtils.validateUploadedFiles({ backgroundImage: files.backgroundImage });
         if (!backgroundValidation.isValid) {
           // Clean up invalid background image immediately
           FileUploadUtils.cleanupUploadedFiles({ backgroundImage: files.backgroundImage });
           throw new BadRequestException(`Background image validation failed: ${backgroundValidation.errors.join(', ')}`);
         }
         
         // New background image uploaded - replace existing
         eventDto.backgroundImage = `uploads/event/background/${files.backgroundImage[0].filename}`;
       } else if (eventDto.originalBackgroundImage) {
         // Keep existing background image if no new one uploaded
         eventDto.backgroundImage = eventDto.originalBackgroundImage;
       }

      const updatedEvent = await this.eventService.updateEvent(id, eventDto);

      // Send notification to all registered users about event update
      try {
  
        const changes = this.detectEventChanges(existingEvent, eventDto);
     
        if (changes.length > 0) {
         
          await this.eventNotificationService.sendEventUpdateNotification(
            id,
            updatedEvent.name || 'Event',
            changes
          );
        } else {
          console.log('⚠️ No changes detected, skipping notification');
        }
      } catch (notificationError) {
        console.error('❌ Failed to send event update notification:', notificationError);
        // Don't fail the update if notification fails
      }

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
         } catch (error: any) {
       // Clean up uploaded files if error occurs
       FileUploadUtils.cleanupUploadedFiles(files);
       
       if (error.code === 'LIMIT_FILE_SIZE') {
         this.errorHandler.handleFileUploadError(error, 'Event File Upload');
       }
       
       this.errorHandler.logError(error, 'Event update', req.user?.id);
       throw error;
     }
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteEvent(@Param('id') id: string, @Res() response: Response, @Request() req: any) {
    try {
      // Get event details before deletion for notification
      const eventToDelete = await this.eventService.getEventEntityById(id);
      
      const result = await this.eventService.deleteEvent(id);
      
      // Send notification to all registered users about event cancellation
      try {
        await this.eventNotificationService.sendEventCancellationNotification(
          id,
          eventToDelete.name || 'Event',
          'Event has been cancelled by admin'
        );
      } catch (notificationError) {
        console.error('Failed to send event cancellation notification:', notificationError);
        // Don't fail the deletion if notification fails
      }
      
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
      this.errorHandler.logError(error, 'Event deletion', req.user?.id);
      throw error;
    }
  }

  // Remove individual image
  @Delete('images/:id')
  @Roles(UserRole.Admin)
  async removeEventImage(
    @Param('id') id: string,
    @Body() body: { imagePath: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const event = await this.eventService.getEventEntityById(id);
      const { imagePath } = body;

      if (!event.images || !event.images.includes(imagePath)) {
        throw new ResourceNotFoundException('Image', 'in this event');
      }

      // Remove image from filesystem
      const fullPath = path.join(__dirname, '..', '..', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      const updatedImages = event.images.filter(img => img !== imagePath);
      await this.eventService.updateEventImages(id, updatedImages);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Image removed successfully',
        data: { images: updatedImages },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event image removal', req.user?.id);
      throw error;
    }
  }

  // Remove individual document
  @Delete('documents/:id')
  @Roles(UserRole.Admin)
  async removeEventDocument(
    @Param('id') id: string,
    @Body() body: { documentPath: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const event = await this.eventService.getEventEntityById(id);
      const { documentPath } = body;

      if (!event.documents || !event.documents.includes(documentPath)) {
        throw new ResourceNotFoundException('Document', 'in this event');
      }

      // Remove document from filesystem
      const fullPath = path.join(__dirname, '..', '..', documentPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      const updatedDocuments = event.documents.filter(doc => doc !== documentPath);
      await this.eventService.updateEventDocuments(id, updatedDocuments);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Document removed successfully',
        data: { documents: updatedDocuments },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event document removal', req.user?.id);
      throw error;
    }
  }

    // Remove event stamp association (not the stamp itself, just the association)
    @Delete('event-stamps/:eventId/:stampId')
    @Roles(UserRole.Admin)
    async removeEventStampAssociation(
      @Param('eventId') eventId: string,
      @Param('stampId') stampId: string,
      @Res() response: Response,
      @Request() req: any,
    ) {
      try {
        const event = await this.eventService.getEventEntityById(eventId);
        if (!event) {
          throw new ResourceNotFoundException('Event', eventId);
        }

        // Get current stamps for this event
        const eventStampService = this.eventService['eventStampService'];
        const currentStamps = await eventStampService.getStampsByEventId(eventId);
        const updatedStampIds = currentStamps
          .filter(stamp => stamp.id !== stampId)
          .map(stamp => stamp.id);

        // Update associations
        await eventStampService.associateStampsToEvent(eventId, updatedStampIds);

        const successResponse: SuccessResponse = {
          success: true,
          message: 'Event stamp association removed successfully',
          data: { eventStampIds: updatedStampIds },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        };

        return response.status(HttpStatus.OK).json(successResponse);
      } catch (error) {
        this.errorHandler.logError(error, 'Event stamp association removal', req.user?.id);
        throw error;
      }
    }
  

    




  // Get event booths with search filter and pagination
  @Get(':id/booths')
  async getEventBooths(
    @Param('id') id: string,
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
      // Extract and process filter parameters
      const processedFilters = {
        page: filters.page ? Number(filters.page) : undefined,
        limit: filters.limit ? Number(filters.limit) : undefined,
        search: filters.search?.trim() || undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortOrder || undefined,
      };

      const result = await this.eventService.getEventBooths(id, processedFilters);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event booths retrieved successfully',
        data: result.data,
        metadata: {
          ...result.pagination,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event booths retrieval', req.user?.id);
      throw error;
    }
  }


  // Remove floor plan
  @Delete('floor-plan/:id')
  @Roles(UserRole.Admin)
  async removeEventFloorPlan(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const event = await this.eventService.getEventEntityById(id);

      if (!event.floorPlan) {
        throw new ResourceNotFoundException('Floor plan', 'in this event');
      }

      // Delete floor plan from filesystem
      const fullPath = path.join(__dirname, '..', '..', event.floorPlan);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      await this.eventService.updateEventFloorPlan(id, null);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Floor plan removed successfully',
        data: { floorPlan: "" },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event floor plan removal', req.user?.id);
      throw error;
    }
  }

  // Remove background image
  @Delete('background-image/:id')
  @Roles(UserRole.Admin)
  async removeEventBackgroundImage(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const event = await this.eventService.getEventEntityById(id);

      if (!event.backgroundImage) {
        throw new ResourceNotFoundException('Background image', 'in this event');
      }

      // Delete background image from filesystem
      const fullPath = path.join(__dirname, '..', '..', event.backgroundImage);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      await this.eventService.updateEventBackgroundImage(id, null);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Background image removed successfully',
        data: { backgroundImage: "" },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event background image removal', req.user?.id);
      throw error;
    }
  }

  /**
   * Helper method to detect what fields were changed in event update
   */
  private detectEventChanges(oldEvent: any, newEvent: any): string[] {
    const changes: string[] = [];
    
   
    // Check for actual changes (not just undefined vs defined)
    if (newEvent.name !== undefined && oldEvent?.name !== newEvent.name) {
     
      changes.push('Event Name');
    }
    if (newEvent.description !== undefined && oldEvent?.description !== newEvent.description) {
     
      changes.push('Description');
    }
    if (newEvent.startDate !== undefined && oldEvent?.startDate !== newEvent.startDate) {
   
      changes.push('Start Date');
    }
    if (newEvent.endDate !== undefined && oldEvent?.endDate !== newEvent.endDate) {
   
      changes.push('End Date');
    }
    if (newEvent.startTime !== undefined && oldEvent?.startTime !== newEvent.startTime) {
    
      changes.push('Start Time');
    }
    if (newEvent.endTime !== undefined && oldEvent?.endTime !== newEvent.endTime) {
    
      changes.push('End Time');
    }
    // Combined time field check
    if (newEvent.time !== undefined && oldEvent?.time !== newEvent.time) {
   
      changes.push('Time');
    }
    if (newEvent.location !== undefined && oldEvent?.location !== newEvent.location) {

      changes.push('Location');
    }
    if (newEvent.price !== undefined && oldEvent?.price !== newEvent.price) {
    
      changes.push('Price');
    }
    if (newEvent.capacity !== undefined && oldEvent?.capacity !== newEvent.capacity) {

      changes.push('Capacity');
    }
    if (newEvent.eventType !== undefined && oldEvent?.eventType !== newEvent.eventType) {
    
      changes.push('Event Type');
    }
    if (newEvent.status !== undefined && oldEvent?.status !== newEvent.status) {
    
      changes.push('Status');
    }
    if (newEvent.images !== undefined && oldEvent?.images !== newEvent.images) {
     
      changes.push('Images');
    }
    if (newEvent.documents !== undefined && oldEvent?.documents !== newEvent.documents) {
    
      changes.push('Documents');
    }
    

    return changes;
  }

  // Programme Management Endpoints - Integrated into Event Controller
  // Track Management
  @Post(':eventId/programme/tracks')
  @Roles(UserRole.Admin)
  async createProgrammeTrack(
    @Param('eventId') eventId: string,
    @Body() createTrackDto: CreateProgrammeTrackDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const track = await this.programmeService.createTrack(eventId, createTrackDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme track created successfully',
        data: track,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Create Programme Track', req.user?.id);
      throw error;
    }
  }

  @Get(':eventId/programme/tracks')
  async getProgrammeTracks(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const tracks = await this.programmeService.getTracksByEvent(eventId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme tracks retrieved successfully',
        data: tracks,
        metadata: {
          total: tracks.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Get Programme Tracks', req.user?.id);
      throw error;
    }
  }

  @Put(':eventId/programme/tracks/:trackId')
  @Roles(UserRole.Admin)
  async updateProgrammeTrack(
    @Param('eventId') eventId: string,
    @Param('trackId') trackId: string,
    @Body() updateTrackDto: UpdateProgrammeTrackDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Verify track belongs to event
      const tracks = await this.programmeService.getTracksByEvent(eventId);
      const track = tracks.find(t => t.id === trackId);
      if (!track) {
        throw new NotFoundException('Programme track not found for this event');
      }

      const updatedTrack = await this.programmeService.updateTrack(trackId, updateTrackDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme track updated successfully',
        data: updatedTrack,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Update Programme Track', req.user?.id);
      throw error;
    }
  }

  @Delete(':eventId/programme/tracks/:trackId')
  @Roles(UserRole.Admin)
  async deleteProgrammeTrack(
    @Param('eventId') eventId: string,
    @Param('trackId') trackId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Verify track belongs to event
      const tracks = await this.programmeService.getTracksByEvent(eventId);
      const track = tracks.find(t => t.id === trackId);
      if (!track) {
        throw new NotFoundException('Programme track not found for this event');
      }

      await this.programmeService.deleteTrack(trackId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme track deleted successfully',
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Delete Programme Track', req.user?.id);
      throw error;
    }
  }

  @Put(':eventId/programme/tracks/reorder')
  @Roles(UserRole.Admin)
  async reorderProgrammeTracks(
    @Param('eventId') eventId: string,
    @Body() updateOrderDto: UpdateProgrammeTrackOrderDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Verify all tracks belong to event
      const tracks = await this.programmeService.getTracksByEvent(eventId);
      const trackIds = new Set(tracks.map(t => t.id));
      const allTracksBelongToEvent = updateOrderDto.items.every(item => trackIds.has(item.id));
      
      if (!allTracksBelongToEvent) {
        throw new BadRequestException('All tracks must belong to the specified event');
      }

      await this.programmeService.reorderTracks(updateOrderDto.items);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme track order updated successfully',
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Reorder Programme Tracks', req.user?.id);
      throw error;
    }
  }

  // Session Management
  @Post(':eventId/programme/sessions')
  @Roles(UserRole.Admin)
  async createProgrammeSession(
    @Param('eventId') eventId: string,
    @Body() createSessionDto: CreateProgrammeSessionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Verify track belongs to event
      const tracks = await this.programmeService.getTracksByEvent(eventId);
      const track = tracks.find(t => t.id === createSessionDto.trackId);
      if (!track) {
        throw new BadRequestException('Track does not belong to this event');
      }

      const session = await this.programmeService.createSession(createSessionDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme session created successfully',
        data: session,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Create Programme Session', req.user?.id);
      throw error;
    }
  }

  @Get(':eventId/programme/sessions')
  async getProgrammeSessions(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const sessions = await this.programmeService.getSessionsByEvent(eventId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme sessions retrieved successfully',
        data: sessions,
        metadata: {
          total: sessions.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Get Programme Sessions', req.user?.id);
      throw error;
    }
  }

  @Put(':eventId/programme/sessions/:sessionId')
  @Roles(UserRole.Admin)
  async updateProgrammeSession(
    @Param('eventId') eventId: string,
    @Param('sessionId') sessionId: string,
    @Body() updateSessionDto: UpdateProgrammeSessionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Verify session belongs to event
      const sessions = await this.programmeService.getSessionsByEvent(eventId);
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new NotFoundException('Programme session not found for this event');
      }

      const updatedSession = await this.programmeService.updateSession(sessionId, updateSessionDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme session updated successfully',
        data: updatedSession,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Update Programme Session', req.user?.id);
      throw error;
    }
  }

  @Delete(':eventId/programme/sessions/:sessionId')
  @Roles(UserRole.Admin)
  async deleteProgrammeSession(
    @Param('eventId') eventId: string,
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Verify session belongs to event
      const sessions = await this.programmeService.getSessionsByEvent(eventId);
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new NotFoundException('Programme session not found for this event');
      }

      await this.programmeService.deleteSession(sessionId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme session deleted successfully',
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Delete Programme Session', req.user?.id);
      throw error;
    }
  }

  @Get(':eventId/programme/tracks/:trackId/sessions')
  async getProgrammeSessionsByTrack(
    @Param('eventId') eventId: string,
    @Param('trackId') trackId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Verify track belongs to event
      const tracks = await this.programmeService.getTracksByEvent(eventId);
      const track = tracks.find(t => t.id === trackId);
      if (!track) {
        throw new NotFoundException('Programme track not found for this event');
      }

      const sessions = await this.programmeService.getSessionsByTrack(trackId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme sessions retrieved successfully',
        data: sessions,
        metadata: {
          total: sessions.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Get Programme Sessions by Track', req.user?.id);
      throw error;
    }
  }

}
