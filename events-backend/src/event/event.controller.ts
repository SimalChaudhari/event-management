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
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EventService } from './event.service';
import { EventDto, EventType } from './event.dto';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import * as fs from 'fs';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import { ResourceNotFoundException } from '../utils/exceptions/custom-exceptions';

@Controller('api/events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Post('create')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
      { name: 'floorPlan', maxCount: 1 }, // Add floor plan field
      { name: 'eventStampImages', maxCount: 10 }, // Add event stamp images

    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'images') {
            cb(null, './uploads/event/images');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/event/documents');
          } else if (file.fieldname === 'floorPlan') {
            cb(null, './uploads/event/floorPlan'); // New directory for floor plan
          } else if (file.fieldname === 'eventStampImages') {
            cb(null, './uploads/eventStamps/images'); // Event stamp images
          } else {
            cb(null, './uploads/event/images'); // Default
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {

        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
     
        if (file.fieldname === 'images' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
          cb(null, true);
        } else if (file.fieldname === 'floorPlan' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'eventStampImages' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed types for images: JPEG, JPG, PNG, GIF. For documents: PDF only.`), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async createEvent(
    @Body() eventDto: EventDto,
    @UploadedFiles() files: { images?: Express.Multer.File[], documents?: Express.Multer.File[], 
      floorPlan?: Express.Multer.File[],
      eventStampImages?: Express.Multer.File[]
    
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (files.images && files.images.length > 0) {
        eventDto.images = files.images.map(
          (img) => `uploads/event/images/${img.filename}`,
        );
      }

      if (files.eventStampImages && files.eventStampImages.length > 0) {
        eventDto.eventStampImages = files.eventStampImages.map(
          (img) => `uploads/eventStamps/images/${img.filename}`,
        );
      }

    
      if (files.documents && files.documents.length > 0) {
        eventDto.documents = files.documents.map(
          (doc) => `uploads/event/documents/${doc.filename}`,
        );
        
        // Handle document names - get from body or use original filenames
        if (eventDto.documentNames) {
          // If names are provided in body, use them
          const names = Array.isArray(eventDto.documentNames) 
            ? eventDto.documentNames 
            : [eventDto.documentNames];
          eventDto.documentNames = names;
        } else {
          // Use original filenames as fallback
          eventDto.documentNames = files.documents.map(
            (doc) => doc.originalname
          );
        }
      }

     // Handle floor plan
     if (files.floorPlan && files.floorPlan.length > 0) {
      eventDto.floorPlan = `uploads/event/floorPlan/${files.floorPlan[0].filename}`;
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
      this.cleanupUploadedFiles(files);
      
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
    },
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id; // Get user ID from JWT token
      const userRole = req?.user?.role; // Get actual role from JWT

      const events = await this.eventService.getAllEvents(filters, userId, userRole);
      
      const successResponse: any = {
        success: true,
        message: 'Events retrieved successfully',
        events: events,
        metadata: {
          total: events.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Events retrieval', req.user?.id);
      throw error;
    }
  }

  @Get('search/global')
  async globalSearch(
    @Query() queryParams: any,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      const userRole = req?.user?.role;

      // Parse and validate query parameters
      const searchFilters = {
        keyword: queryParams.keyword,
        location: queryParams.location,
        venue: queryParams.venue,
        country: queryParams.country,
        type: queryParams.type,
        category: queryParams.category,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        minPrice: queryParams.minPrice ? parseFloat(queryParams.minPrice) : undefined,
        maxPrice: queryParams.maxPrice ? parseFloat(queryParams.maxPrice) : undefined,
        currency: queryParams.currency,
        page: queryParams.page ? parseInt(queryParams.page) : 1,
        limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
        sortBy: queryParams.sortBy || 'startDate',
        sortOrder: queryParams.sortOrder || 'ASC',
        include: queryParams.include || 'all',
      };

      // Validate at least one search parameter is provided
      if (!searchFilters.keyword && !searchFilters.location && !searchFilters.venue && 
          !searchFilters.country && !searchFilters.type && !searchFilters.category && 
          !searchFilters.startDate && !searchFilters.endDate && 
          searchFilters.minPrice === undefined && searchFilters.maxPrice === undefined && 
          !searchFilters.currency) {
        throw new BadRequestException('At least one search parameter must be provided');
      }

      // Use the existing getAllEvents method with enhanced filters
      const events = await this.eventService.getAllEvents(searchFilters, userId, userRole);
      
      // Generate search suggestions if no results found
      let searchSuggestions: string[] = [];
      let alternativeResults: any[] = [];
      
      if (events.length === 0) {
        // Generate search suggestions based on the keyword
        if (searchFilters.keyword) {
          searchSuggestions = this.generateSearchSuggestions(searchFilters.keyword);
          
          // Try to find alternative results with broader search
          const alternativeFilters = { ...searchFilters };
          if (searchFilters.keyword.length > 3) {
            alternativeFilters.keyword = searchFilters.keyword.substring(0, Math.floor(searchFilters.keyword.length * 0.7));
            alternativeResults = await this.eventService.getAllEvents(alternativeFilters, userId, userRole);
          }
        }
      }

      const successResponse: any = {
        success: true,
        message: events.length > 0 ? 'Global search completed successfully' : 'No exact matches found',
        events: events,
        filters: searchFilters,
        metadata: {
          total: events.length,
          timestamp: new Date().toISOString(),
          searchQuality: this.calculateSearchQuality(searchFilters, events.length),
        },
      };

      // Add search suggestions and alternatives if no results
      if (events.length === 0) {
        successResponse.searchSuggestions = searchSuggestions;
        if (alternativeResults.length > 0) {
          successResponse.alternativeResults = {
            message: 'Showing similar results',
            events: alternativeResults.slice(0, 5), // Limit to 5 alternative results
            count: alternativeResults.length,
          };
        }
      }

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Global search', req.user?.id);
      throw error;
    }
  }

  // Advanced search with multiple filters
  @Post('search/advanced')
  async advancedSearch(
    @Body() searchBody: {
      keyword?: string;
      filters?: {
        location?: string;
        venue?: string;
        country?: string;
        type?: EventType;
        category?: string;
        startDate?: string;
        endDate?: string;
        minPrice?: number;
        maxPrice?: number;
        currency?: string;
        hasSurvey?: boolean;
        hasSpeakers?: boolean;
        hasExhibitors?: boolean;
        isUpcoming?: boolean;
      };
      pagination?: {
        page: number;
        limit: number;
      };
      sorting?: {
        field: string;
        order: 'ASC' | 'DESC';
      };
    },
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      const userRole = req?.user?.role;

      if (!searchBody.keyword && !searchBody.filters) {
        throw new BadRequestException('Either keyword or filters must be provided');
      }

      // Build search filters
      const searchFilters: any = {
        keyword: searchBody.keyword,
        ...searchBody.filters,
        page: searchBody.pagination?.page || 1,
        limit: searchBody.pagination?.limit || 20,
        sortBy: searchBody.sorting?.field || 'startDate',
        sortOrder: searchBody.sorting?.order || 'ASC',
      };

      // Use the enhanced getAllEvents method
      const events = await this.eventService.getAllEvents(searchFilters, userId, userRole);

      const successResponse: any = {
        success: true,
        message: 'Advanced search completed successfully',
        events: events,
        filters: searchFilters,
        metadata: {
          total: events.length,
          timestamp: new Date().toISOString(),
          searchQuality: this.calculateSearchQuality(searchFilters, events.length),
          pagination: {
            page: searchFilters.page,
            limit: searchFilters.limit,
            totalPages: Math.ceil(events.length / searchFilters.limit),
          },
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Advanced search', req.user?.id);
      throw error;
    }
  }

  // Search suggestions endpoint
  @Get('search/suggestions')
  async getSearchSuggestions(
    @Query('q') query: string,
    @Res() response: Response,
  ) {
    try {
      if (!query || query.trim().length < 2) {
        throw new BadRequestException('Query must be at least 2 characters long');
      }

      const suggestions = this.generateSearchSuggestions(query.trim());
      
      const successResponse: any = {
        success: true,
        message: 'Search suggestions generated successfully',
        query: query.trim(),
        suggestions: suggestions,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      throw error;
    }
  }

  // Helper method to generate search suggestions
  private generateSearchSuggestions(keyword: string): string[] {
    const suggestions: string[] = [];
    const keywordLower = keyword.toLowerCase();

    // Common search suggestions
    const commonSuggestions = [
      'Try searching with fewer words',
      'Check spelling',
      'Use broader terms',
      'Try different date ranges',
      'Search by location instead of venue',
    ];

    // Keyword-specific suggestions
    if (keywordLower.includes('tech') || keywordLower.includes('technology')) {
      suggestions.push('Try: "Technology Conference", "Tech Summit", "Digital Innovation"');
    }
    
    if (keywordLower.includes('business') || keywordLower.includes('corporate')) {
      suggestions.push('Try: "Business Conference", "Corporate Event", "Professional Development"');
    }
    
    if (keywordLower.includes('music') || keywordLower.includes('concert')) {
      suggestions.push('Try: "Music Festival", "Concert", "Live Performance"');
    }
    
    if (keywordLower.includes('food') || keywordLower.includes('culinary')) {
      suggestions.push('Try: "Food Festival", "Culinary Event", "Gastronomy"');
    }

    // Add common suggestions
    suggestions.push(...commonSuggestions);

    return suggestions;
  }

  // Helper method to calculate search quality score
  private calculateSearchQuality(filters: any, resultCount: number): string {
    let quality = 'Good';
    
    if (resultCount === 0) {
      quality = 'No Results';
    } else if (resultCount < 5) {
      quality = 'Limited Results';
    } else if (resultCount > 50) {
      quality = 'Too Many Results';
    }
    
    return quality;
  }

  @Get('search/quick')
  async quickSearch(
    @Query('q') query: string,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      const userRole = req?.user?.role;

      if (!query || query.trim().length === 0) {
        throw new BadRequestException('Query parameter "q" is required');
      }

      if (query.trim().length < 2) {
        throw new BadRequestException('Query must be at least 2 characters long');
      }

      // Use existing getAllEvents with minimal filters for quick search
      const searchFilters = {
        keyword: query.trim(),
        upcoming: true, // Focus on upcoming events
      };

      const events = await this.eventService.getAllEvents(searchFilters, userId, userRole);
      
      const successResponse: any = {
        success: true,
        message: 'Quick search completed successfully',
        events: events.slice(0, 10), // Limit to 10 results for quick search
        query: query.trim(),
        metadata: {
          total: Math.min(events.length, 10),
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Quick search', req.user?.id);
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
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event retrieved successfully',
        data: event,
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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
      { name: 'floorPlan', maxCount: 1 }, // Add floor plan field
      { name: 'eventStampImages', maxCount: 10 }, // Add event stamp images
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'images') {
            cb(null, './uploads/event/images');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/event/documents');
          } else if (file.fieldname === 'floorPlan') {
            cb(null, './uploads/event/floorPlan'); // New directory for floor plan
          } else if (file.fieldname === 'eventStampImages') {
            cb(null, './uploads/eventStamps/images'); // Event stamp images
          } else {
            cb(null, './uploads/event/images'); // Default
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {

      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
     
       if (file.fieldname === 'images' && allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
        cb(null, true);
      } else if (file.fieldname === 'floorPlan' && allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else if (file.fieldname === 'eventStampImages' && allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types for images: JPEG, JPG, PNG, GIF. For documents: PDF only.`), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }),
)
  async updateEvent(
    @Param('id') id: string,
    @Body() eventDto: EventDto,
    @UploadedFiles() files: { 
      images?: Express.Multer.File[], 
      documents?: Express.Multer.File[], 
      floorPlan?: Express.Multer.File[],
      eventStampImages?: Express.Multer.File[]
    },
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
      this.cleanupUploadedFiles(files);
      
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
      const result = await this.eventService.deleteEvent(id);
      
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

  // Helper method to clean up uploaded files
  private cleanupUploadedFiles(files: any) {
    if (files.images) {
      files.images.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'event', 'images', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
    if (files.documents) {
      files.documents.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'event', 'documents', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
    if (files.floorPlan) {
      files.floorPlan.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'event', 'floorPlan', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
    if (files.eventStampImages) {
      files.eventStampImages.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'eventStamps', 'images', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
  }
}
