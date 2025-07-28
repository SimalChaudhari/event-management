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

@Controller('api/exhibitors')
export class ExhibitorController {
  constructor(
    private readonly exhibitorService: ExhibitorService,
    private readonly errorHandler: ErrorHandlerService, // Add this
  ) {}

  @Post('create')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'flyers', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
      { name: 'eventImages', maxCount: 10 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'flyers') {
            cb(null, './uploads/exhibitor/flyers');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/exhibitor/documents');
          } else if (file.fieldname === 'eventImages') {
            cb(null, './uploads/exhibitor/eventImages');
          } else {
            cb(null, './uploads/exhibitor/flyers'); // Default
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
      eventImages?: Express.Multer.File[]
    },
    @Res() response: Response,
    @Request() req: any, // Add this for user tracking
  ) {
    try {
      // Handle flyers
      if (files.flyers && files.flyers.length > 0) {
        exhibitorDto.flyers = files.flyers.map(
          (file) => `uploads/exhibitor/flyers/${file.filename}`,
        );
      }

      // Handle documents
      if (files.documents && files.documents.length > 0) {
        exhibitorDto.documents = files.documents.map(
          (doc) => `uploads/exhibitor/documents/${doc.filename}`,
        );

        if (exhibitorDto.documentNames) {
          // If names are provided in body, use them
          const names = Array.isArray(exhibitorDto.documentNames) 
            ? exhibitorDto.documentNames 
            : [exhibitorDto.documentNames];
          exhibitorDto.documentNames = names;
        } else {
          // Use original filenames as fallback
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
      }

      const exhibitor = await this.exhibitorService.createExhibitor(exhibitorDto);
      
      // Format documents for response
      let formattedDocuments: { name: string; document: string }[] = [];
      if (exhibitor.documents && exhibitor.documentNames) {
        formattedDocuments = exhibitor.documents.map((doc, index) => ({
          name: exhibitor.documentNames?.[index] || `Document ${index + 1}`,
          document: doc
        }));
      } else if (exhibitor.documents) {
        formattedDocuments = exhibitor.documents.map((doc, index) => ({
          name: `Document ${index + 1}`,
          document: doc
        }));
      }

      // Remove raw documents and documentNames from response
      const { 
        documents, 
        documentNames, 
        ...exhibitorData 
      } = exhibitor;

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Exhibitor created successfully',
        data: {
          ...exhibitorData,
          documents: formattedDocuments
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
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

  @Put('update/:id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'flyers', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
      { name: 'eventImages', maxCount: 10 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'flyers') {
            cb(null, './uploads/exhibitor/flyers');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/exhibitor/documents');
          } else if (file.fieldname === 'eventImages') {
            cb(null, './uploads/exhibitor/eventImages');
          } else {
            cb(null, './uploads/exhibitor/flyers'); // Default
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
      eventImages?: Express.Multer.File[]
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    let existingExhibitor = null;
    
    try {
      // Get existing exhibitor first
      existingExhibitor = await this.exhibitorService.getExhibitorEntityById(id);
      
      // Handle flyers - combine existing and new
      const allFlyers = [];
      if (exhibitorDto.originalFlyers) {
        const originalFlyers = Array.isArray(exhibitorDto.originalFlyers) 
          ? exhibitorDto.originalFlyers 
          : [exhibitorDto.originalFlyers];
        allFlyers.push(...originalFlyers);
      }
      if (files.flyers && files.flyers.length > 0) {
        const newFlyers = files.flyers.map(
          (file) => `uploads/exhibitor/flyers/${file.filename}`,
        );
        allFlyers.push(...newFlyers);
      }
      if (allFlyers.length > 0) {
        exhibitorDto.flyers = allFlyers;
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
             // If names are provided in body for new uploads, use them
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
      if (exhibitorDto.originalEventImages) {
        const originalEventImages = Array.isArray(exhibitorDto.originalEventImages) 
          ? exhibitorDto.originalEventImages 
          : [exhibitorDto.originalEventImages];
        allEventImages.push(...originalEventImages);
      }
      if (files.eventImages && files.eventImages.length > 0) {
        const newEventImages = files.eventImages.map(
          (file) => `uploads/exhibitor/eventImages/${file.filename}`,
        );
        allEventImages.push(...newEventImages);
      }
      if (allEventImages.length > 0) {
        exhibitorDto.eventImages = allEventImages;
      }

      const updatedExhibitor = await this.exhibitorService.updateExhibitor(id, exhibitorDto);

      // Format documents for response
      let formattedDocuments: { name: string; document: string }[] = [];
      if (updatedExhibitor.documents && updatedExhibitor.documentNames) {
        formattedDocuments = updatedExhibitor.documents.map((doc, index) => ({
          name: updatedExhibitor.documentNames?.[index] || `Document ${index + 1}`,
          document: doc
        }));
      } else if (updatedExhibitor.documents) {
        formattedDocuments = updatedExhibitor.documents.map((doc, index) => ({
          name: `Document ${index + 1}`,
          document: doc
        }));
      }

      // Remove raw documents and documentNames from response
      const { 
        documents, 
        documentNames, 
        ...exhibitorData 
      } = updatedExhibitor;

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Exhibitor updated successfully',
        data: {
          ...exhibitorData,
          documents: formattedDocuments
        },
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

  @Delete('delete/:id')
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

  // Remove individual flyer
  @Delete('flyers/:id')
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

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Flyer removed successfully',
        data: { flyers: updatedFlyers },
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

  // Remove individual document
  @Delete('documents/:id')
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

      // Format response
      let formattedDocuments: { name: string; document: string }[] = [];
      if (updatedDocuments.length > 0) {
        formattedDocuments = updatedDocuments.map((doc, index) => ({
          name: updatedDocumentNames[index] || `Document ${index + 1}`,
          document: doc
        }));
      }

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Document removed successfully',
        data: { documents: formattedDocuments },
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

  // Remove individual event image
  @Delete('eventImages/:id')
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

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event image removed successfully',
        data: { eventImages: updatedEventImages },
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
  }
} 