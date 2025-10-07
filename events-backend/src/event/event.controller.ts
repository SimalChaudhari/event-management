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

@Controller('api/events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly eventNotificationService: EventNotificationService,
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

      if (fileProcessing.processedFiles?.eventStampImages && fileProcessing.processedFiles.eventStampImages.length > 0) {
        eventDto.eventStampImages = fileProcessing.processedFiles.eventStampImages;
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
      type?: EventType;
      price?: number;
      location?: string;
      category?: string;
      eventName?: string; // Event name filter
      globalSearch?: string; // Global search term
    },
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id; // Get user ID from JWT token
      const userRole = req?.user?.role; // Get actual role from JWT

      // Convert string query parameters to appropriate types
      const processedFilters = {
        ...filters,
        // globalSearch should be a string for search terms
        globalSearch: typeof filters.globalSearch === 'string' ? filters.globalSearch : undefined,
        // eventName should be a string for event name filtering
        eventName: typeof filters.eventName === 'string' ? filters.eventName : undefined,
      };

      const result = await this.eventService.getAllEvents(processedFilters, userId, userRole);
      
      // Filter data for each event based on tab visibility for non-admin users
      const filteredResult = TabVisibilityFilterUtil.filterEventResultByTabVisibility(result, userRole);
      
      const successResponse: any = {
        success: true,
        message: 'Events retrieved successfully',
        ...filteredResult, // This will include events and metadata from the service
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Events retrieval', req.user?.id);
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

      // Handle event stamp images - combine existing and new images
      const allEventStampImages = [];
      
      // Add existing event stamp images from originalEventStampImages field
      if (eventDto.originalEventStampImages) {
        const originalEventStampImages = Array.isArray(eventDto.originalEventStampImages) 
          ? eventDto.originalEventStampImages 
          : [eventDto.originalEventStampImages];
        allEventStampImages.push(...originalEventStampImages);
      }
      
             // Add new uploaded event stamp images
       if (files.eventStampImages && files.eventStampImages.length > 0) {
         // Validate new event stamp images before processing
         const eventStampValidation = FileUploadUtils.validateUploadedFiles({ eventStampImages: files.eventStampImages });
         if (!eventStampValidation.isValid) {
           // Clean up invalid event stamp images immediately
           FileUploadUtils.cleanupUploadedFiles({ eventStampImages: files.eventStampImages });
           throw new BadRequestException(`Event stamp image validation failed: ${eventStampValidation.errors.join(', ')}`);
         }
         
         const newEventStampImages = files.eventStampImages.map(
           (img) => `uploads/eventStamps/images/${img.filename}`,
         );
         allEventStampImages.push(...newEventStampImages);
       }
      
      // Set the combined event stamp images
      if (allEventStampImages.length > 0) {
        eventDto.eventStampImages = allEventStampImages;
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

    // Remove individual event stamp image
    @Delete('event-stamps/images/:id')
    @Roles(UserRole.Admin)
    async removeEventStampImage(
      @Param('id') id: string,
      @Body() body: { imagePath: string },
      @Res() response: Response,
      @Request() req: any,
    ) {
      try {
        const event = await this.eventService.getEventEntityById(id);
        const { imagePath } = body;

        if (!event.eventStampImages || !event.eventStampImages.includes(imagePath)) {
          throw new ResourceNotFoundException('Event stamp image', 'in this event');
        }

        // Remove image from filesystem
        const fullPath = path.join(__dirname, '..', '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }

        const updatedEventStampImages = event.eventStampImages.filter(img => img !== imagePath);
        await this.eventService.updateEventStampImages(id, updatedEventStampImages);

        const successResponse: SuccessResponse = {
          success: true,
          message: 'Event stamp image removed successfully',
          data: { eventStampImages: updatedEventStampImages },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        };

        return response.status(HttpStatus.OK).json(successResponse);
      } catch (error) {
        this.errorHandler.logError(error, 'Event stamp image removal', req.user?.id);
        throw error;
      }
    }
  

    




  // Get event booths
  @Get(':id/booths')
  async getEventBooths(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const eventBooths = await this.eventService.getEventBooths(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event booths retrieved successfully',
        data: eventBooths,
        metadata: {
          total: eventBooths.length,
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


}
