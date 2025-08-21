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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'flyers', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
      { name: 'eventImages', maxCount: 10 },
      { name: 'logo', maxCount: 1 }, // Add logo upload
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'flyers') {
            cb(null, './uploads/exhibitor/flyers');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/exhibitor/documents');
          } else if (file.fieldname === 'eventImages') {
            cb(null, './uploads/exhibitor/eventImages');
          } else if (file.fieldname === 'logo') {
            cb(null, './uploads/exhibitor/logos'); // Add logo directory
          } else {
            cb(null, './uploads/exhibitor/flyers');
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        
        if (file.fieldname === 'flyers' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'eventImages' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'logo' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
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
  async createExhibitor(
    @Body() exhibitorDto: ExhibitorDto,
    @UploadedFiles() files: { 
      flyers?: Express.Multer.File[], 
      documents?: Express.Multer.File[], 
      eventImages?: Express.Multer.File[],
      logo?: Express.Multer.File[], // Add logo field
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Handle logo upload
      if (files.logo && files.logo.length > 0) {
        exhibitorDto.logo = `uploads/exhibitor/logos/${files.logo[0].filename}`;
      }

      // Handle flyers
      if (files.flyers && files.flyers.length > 0) {
        exhibitorDto.flyers = files.flyers.map(
          (file) => `uploads/exhibitor/flyers/${file.filename}`,
        );

        // Handle flyer names
        if (exhibitorDto.flyerNames) {
          const names = Array.isArray(exhibitorDto.flyerNames) 
            ? exhibitorDto.flyerNames 
            : [exhibitorDto.flyerNames];
          exhibitorDto.flyerNames = names;
        } else {
          // Use original filenames as fallback
          exhibitorDto.flyerNames = files.flyers.map(
            (file) => file.originalname
          );
        }
      }

      // Handle documents
      if (files.documents && files.documents.length > 0) {
        exhibitorDto.documents = files.documents.map(
          (doc) => `uploads/exhibitor/documents/${doc.filename}`,
        );

        if (exhibitorDto.documentNames) {
          const names = Array.isArray(exhibitorDto.documentNames) 
            ? exhibitorDto.documentNames 
            : [exhibitorDto.documentNames];
          exhibitorDto.documentNames = names;
        } else {
          exhibitorDto.documentNames = files.documents.map(
            (doc) => doc.originalname
          );
        }
      }

      // Handle event images
      if (files.eventImages && files.eventImages.length > 0) {
        exhibitorDto.eventImages = files.eventImages.map(
          (file) => `uploads/exhibitor/eventImages/${file.filename}`,
        );

        // Handle event image names
        if (exhibitorDto.eventImageNames) {
          const names = Array.isArray(exhibitorDto.eventImageNames) 
            ? exhibitorDto.eventImageNames 
            : [exhibitorDto.eventImageNames];
          exhibitorDto.eventImageNames = names;
        } else {
          exhibitorDto.eventImageNames = files.eventImages.map(
            (file) => file.originalname
          );
        }
      }

      const exhibitor = await this.exhibitorService.createExhibitor(exhibitorDto);
      return this.formatExhibitorResponse(exhibitor, response, 'Exhibitor created successfully', HttpStatus.CREATED);
    } catch (error: any) {
      // Clean up uploaded files if error occurs
      this.cleanupFiles(files);
      
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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'flyers', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
      { name: 'eventImages', maxCount: 10 },
      { name: 'logo', maxCount: 1 }, // Add logo upload
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'flyers') {
            cb(null, './uploads/exhibitor/flyers');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/exhibitor/documents');
          } else if (file.fieldname === 'eventImages') {
            cb(null, './uploads/exhibitor/eventImages');
          } else if (file.fieldname === 'logo') {
            cb(null, './uploads/exhibitor/logos'); // Add logo directory
          } else {
            cb(null, './uploads/exhibitor/flyers');
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        
        if (file.fieldname === 'flyers' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'eventImages' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'logo' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
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
  async updateExhibitor(
    @Param('id') id: string,
    @Body() exhibitorDto: ExhibitorDto,
    @UploadedFiles() files: { 
      flyers?: Express.Multer.File[], 
      documents?: Express.Multer.File[], 
      eventImages?: Express.Multer.File[],
      logo?: Express.Multer.File[], // Add logo field
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    let existingExhibitor = null;
    
    try {
      // Get existing exhibitor first
      existingExhibitor = await this.exhibitorService.getExhibitorEntityById(id);
      
      // Handle logo upload
      if (files.logo && files.logo.length > 0) {
        exhibitorDto.logo = `uploads/exhibitor/logos/${files.logo[0].filename}`;
      }
      
      // Handle flyers - combine existing and new
      const allFlyers = [];
      const allFlyerNames = [];
      
      if (exhibitorDto.originalFlyers) {
        const originalFlyers = Array.isArray(exhibitorDto.originalFlyers) 
          ? exhibitorDto.originalFlyers 
          : [exhibitorDto.originalFlyers];
        allFlyers.push(...originalFlyers);
        
        // Add existing flyer names
        if (exhibitorDto.originalFlyerNames) {
          const originalFlyerNames = Array.isArray(exhibitorDto.originalFlyerNames) 
            ? exhibitorDto.originalFlyerNames 
            : [exhibitorDto.originalFlyerNames];
          allFlyerNames.push(...originalFlyerNames);
        }
      }
      
      if (files.flyers && files.flyers.length > 0) {
        const newFlyers = files.flyers.map(
          (file) => `uploads/exhibitor/flyers/${file.filename}`,
        );
        allFlyers.push(...newFlyers);
        
        // Handle flyer names for new uploads
        if (exhibitorDto.flyerNames) {
          const newNames = Array.isArray(exhibitorDto.flyerNames) 
            ? exhibitorDto.flyerNames 
            : [exhibitorDto.flyerNames];
          allFlyerNames.push(...newNames);
        } else {
          // Use original filenames as fallback for new uploads
          const newFlyerNames = files.flyers.map(
            (file) => file.originalname
          );
          allFlyerNames.push(...newFlyerNames);
        }
      }
      
      if (allFlyers.length > 0) {
        exhibitorDto.flyers = allFlyers;
        exhibitorDto.flyerNames = allFlyerNames;
      }

      // Handle documents - combine existing and new
      const allDocuments = [];
      const allDocumentNames = [];
      
      // Add existing documents from originalDocuments field
      if (exhibitorDto.originalDocuments) {
        const originalDocuments = Array.isArray(exhibitorDto.originalDocuments) 
          ? exhibitorDto.originalDocuments 
          : [exhibitorDto.originalDocuments];
        allDocuments.push(...originalDocuments);
        
        // Add existing document names
        if (exhibitorDto.originalDocumentNames) {
          const originalDocumentNames = Array.isArray(exhibitorDto.originalDocumentNames) 
            ? exhibitorDto.originalDocumentNames 
            : [exhibitorDto.originalDocumentNames];
          allDocumentNames.push(...originalDocumentNames);
        }
      }
      
      // Add new uploaded documents
      if (files.documents && files.documents.length > 0) {
        const newDocuments = files.documents.map(
          (doc) => `uploads/exhibitor/documents/${doc.filename}`,
        );
        allDocuments.push(...newDocuments);
        
        // Handle document names for new uploads
        if (exhibitorDto.documentNames) {
          const newNames = Array.isArray(exhibitorDto.documentNames) 
            ? exhibitorDto.documentNames 
            : [exhibitorDto.documentNames];
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
        exhibitorDto.documents = allDocuments;
        exhibitorDto.documentNames = allDocumentNames;
      }

      // Handle event images - combine existing and new
      const allEventImages = [];
      const allEventImageNames = [];
      
      if (exhibitorDto.originalEventImages) {
        const originalEventImages = Array.isArray(exhibitorDto.originalEventImages) 
          ? exhibitorDto.originalEventImages 
          : [exhibitorDto.originalEventImages];
        allEventImages.push(...originalEventImages);
        
        // Add existing event image names
        if (exhibitorDto.originalEventImageNames) {
          const originalEventImageNames = Array.isArray(exhibitorDto.originalEventImageNames) 
            ? exhibitorDto.originalEventImageNames 
            : [exhibitorDto.originalEventImageNames];
          allEventImageNames.push(...originalEventImageNames);
        }
      }
      
      if (files.eventImages && files.eventImages.length > 0) {
        const newEventImages = files.eventImages.map(
          (file) => `uploads/exhibitor/eventImages/${file.filename}`,
        );
        allEventImages.push(...newEventImages);
        
        // Handle event image names for new uploads
        if (exhibitorDto.eventImageNames) {
          const newNames = Array.isArray(exhibitorDto.eventImageNames) 
            ? exhibitorDto.eventImageNames 
            : [exhibitorDto.eventImageNames];
          allEventImageNames.push(...newNames);
        } else {
          // Use original filenames as fallback for new uploads
          const newEventImageNames = files.eventImages.map(
            (file) => file.originalname
          );
          allEventImageNames.push(...newEventImageNames);
        }
      }
      
      if (allEventImages.length > 0) {
        exhibitorDto.eventImages = allEventImages;
        exhibitorDto.eventImageNames = allEventImageNames;
      }

      const updatedExhibitor = await this.exhibitorService.updateExhibitor(id, exhibitorDto);

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
      this.cleanupFiles(files);
      
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

      if (!exhibitor.flyers || !exhibitor.flyers.includes(flyerPath)) {
        throw new ResourceNotFoundException('Flyer', 'in this exhibitor');
      }

      // Remove flyer from filesystem
      const fullPath = path.join(__dirname, '..', '..', flyerPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      const updatedFlyers = exhibitor.flyers.filter(flyer => flyer !== flyerPath);
      await this.exhibitorService.updateExhibitorFiles(id, 'flyers', updatedFlyers);

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

      if (!exhibitor.documents || !exhibitor.documents.includes(documentPath)) {
        throw new ResourceNotFoundException('Document', 'in this exhibitor');
      }

      // Find the index of the document to remove
      const documentIndex = exhibitor.documents.indexOf(documentPath);

      // Remove document from filesystem
      const fullPath = path.join(__dirname, '..', '..', documentPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      // Remove document and corresponding name from arrays
      const updatedDocuments = exhibitor.documents.filter(doc => doc !== documentPath);
      const updatedDocumentNames = exhibitor.documentNames ? 
        exhibitor.documentNames.filter((_, index) => index !== documentIndex) : [];

      // Update both documents and documentNames
      await this.exhibitorService.updateExhibitorDocuments(id, updatedDocuments, updatedDocumentNames);

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

      if (!exhibitor.eventImages || !exhibitor.eventImages.includes(eventImagePath)) {
        throw new ResourceNotFoundException('Event image', 'in this exhibitor');
      }

      // Remove event image from filesystem
      const fullPath = path.join(__dirname, '..', '..', eventImagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      // Remove event image from database
      const updatedEventImages = exhibitor.eventImages.filter(image => image !== eventImagePath);
      await this.exhibitorService.updateExhibitorFiles(id, 'eventImages', updatedEventImages);

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

  // Helper method to clean up uploaded files
  private cleanupFiles(files: any) {
    if (files.flyers) {
      files.flyers.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'exhibitor', 'flyers', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
    if (files.documents) {
      files.documents.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'exhibitor', 'documents', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
    if (files.eventImages) {
      files.eventImages.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'exhibitor', 'eventImages', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
    if (files.logo) {
      files.logo.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'exhibitor', 'logos', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
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