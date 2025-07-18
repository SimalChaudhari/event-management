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
  } from '@nestjs/common';
  import { FileFieldsInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import path from 'path';
  import { Response } from 'express';
 
  import { v4 as uuidv4 } from 'uuid';
  import * as fs from 'fs';
import { ExhibitorService } from './exhibitor.service';
import { ExhibitorDto } from './exhibitor.dto';
  
  @Controller('api/exhibitors')
  export class ExhibitorController {
    constructor(private readonly exhibitorService: ExhibitorService) {}
  
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
          if (file.fieldname === 'flyers' && file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else if (file.fieldname === 'eventImages' && file.mimetype.startsWith('image/')) {
            cb(null, true);
          }  else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type for field'), false);
          }
        },
      }),
    )
    async createExhibitor(
      @Body() exhibitorDto: ExhibitorDto,
      @UploadedFiles() files: { 
        flyers?: Express.Multer.File[], 
        documents?: Express.Multer.File[], 
        eventImages?: Express.Multer.File[],
        promotionalOfferImages?: Express.Multer.File[]
      },
      @Res() response: Response,
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
            (file) => `uploads/exhibitor/documents/${file.filename}`,
          );
        }
  
        // Handle event images
        if (files.eventImages && files.eventImages.length > 0) {
          exhibitorDto.eventImages = files.eventImages.map(
            (file) => `uploads/exhibitor/eventImages/${file.filename}`,
          );
        }
  
        // Handle promotional offer images
        if (files.promotionalOfferImages && files.promotionalOfferImages.length > 0) {
          // Parse promotional offers from body and add image paths
          if (exhibitorDto.promotionalOffers) {
            const promotionalOffers = Array.isArray(exhibitorDto.promotionalOffers) 
              ? exhibitorDto.promotionalOffers 
              : [exhibitorDto.promotionalOffers];
            // सबसे पहले यह जांचें कि files.promotionalOfferImages वास्तव में परिभाषित है या नहीं
            if (files.promotionalOfferImages && Array.isArray(files.promotionalOfferImages)) {
              promotionalOffers.forEach((offer, index) => {
                if (files.promotionalOfferImages && files.promotionalOfferImages[index]) {
                  offer.image = `uploads/exhibitor/promotionalOffers/${files.promotionalOfferImages[index].filename}`;
                }
              });
            }
            exhibitorDto.promotionalOffers = promotionalOffers;
          }
        }
  
        const exhibitor = await this.exhibitorService.createExhibitor(exhibitorDto);
        return response.status(201).json({
          success: true,
          message: 'Exhibitor created successfully',
          data: exhibitor,
        });
      } catch (error) {
        // Clean up uploaded files if error occurs
        this.cleanupFiles(files);
        throw error;
      }
    }
  
    @Get()
    async getAllExhibitors(@Res() response: Response) {
      const exhibitors = await this.exhibitorService.getAllExhibitors();
      return response.status(200).json({
        success: true,
        message: 'Exhibitors retrieved successfully',
        data: exhibitors,
      });
    }
  
    @Get(':id')
    async getExhibitorById(
      @Param('id') id: string,
      @Res() response: Response,
    ) {
      const exhibitor = await this.exhibitorService.getExhibitorById(id);
      return response.status(200).json({
        success: true,
        message: 'Exhibitor retrieved successfully',
        data: exhibitor,
      });
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
          if (file.fieldname === 'flyers' && file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else if (file.fieldname === 'eventImages' && file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type for field'), false);
          }
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
        promotionalOfferImages?: Express.Multer.File[]
      },
      @Res() response: Response,
    ) {
      // Get existing exhibitor first
      const existingExhibitor = await this.exhibitorService.getExhibitorById(id).catch(() => null);

      // If exhibitor not found, delete newly uploaded files
      if (!existingExhibitor) {
        this.cleanupFiles(files);
        throw new NotFoundException('Exhibitor not found');
      }

      try {
        // Handle flyers - replace existing with new if uploaded
        if (files.flyers && files.flyers.length > 0) {
          // Delete existing flyers from filesystem
          if (existingExhibitor.flyers && existingExhibitor.flyers.length > 0) {
            this.deleteFilesFromFilesystem(existingExhibitor.flyers);
          }
          
          // Set new flyers
          exhibitorDto.flyers = files.flyers.map(
            (file) => `uploads/exhibitor/flyers/${file.filename}`,
          );
        } else if (exhibitorDto.originalFlyers) {
          // Keep existing flyers if no new files uploaded
          const originalFlyers = Array.isArray(exhibitorDto.originalFlyers) 
            ? exhibitorDto.originalFlyers 
            : [exhibitorDto.originalFlyers];
          exhibitorDto.flyers = originalFlyers;
        }

        // Handle documents - replace existing with new if uploaded
        if (files.documents && files.documents.length > 0) {
          // Delete existing documents from filesystem
          if (existingExhibitor.documents && existingExhibitor.documents.length > 0) {
            this.deleteFilesFromFilesystem(existingExhibitor.documents);
          }
          
          // Set new documents
          exhibitorDto.documents = files.documents.map(
            (file) => `uploads/exhibitor/documents/${file.filename}`,
          );
        } else if (exhibitorDto.originalDocuments) {
          // Keep existing documents if no new files uploaded
          const originalDocuments = Array.isArray(exhibitorDto.originalDocuments) 
            ? exhibitorDto.originalDocuments 
            : [exhibitorDto.originalDocuments];
          exhibitorDto.documents = originalDocuments;
        }

        // Handle event images - replace existing with new if uploaded
        if (files.eventImages && files.eventImages.length > 0) {
          // Delete existing event images from filesystem
          if (existingExhibitor.eventImages && existingExhibitor.eventImages.length > 0) {
            this.deleteFilesFromFilesystem(existingExhibitor.eventImages);
          }
          
          // Set new event images
          exhibitorDto.eventImages = files.eventImages.map(
            (file) => `uploads/exhibitor/eventImages/${file.filename}`,
          );
        } else if (exhibitorDto.originalEventImages) {
          // Keep existing event images if no new files uploaded
          const originalEventImages = Array.isArray(exhibitorDto.originalEventImages) 
            ? exhibitorDto.originalEventImages 
            : [exhibitorDto.originalEventImages];
          exhibitorDto.eventImages = originalEventImages;
        }

        const updatedExhibitor = await this.exhibitorService.updateExhibitor(id, exhibitorDto);

        return response.status(200).json({
          success: true,
          message: 'Exhibitor updated successfully',
          data: updatedExhibitor,
        });
      } catch (error) {
        // Clean up uploaded files if error occurs
        this.cleanupFiles(files);
        throw error;
      }
    }
  
    @Delete('delete/:id')
    async deleteExhibitor(@Param('id') id: string, @Res() response: Response) {
      await this.exhibitorService.deleteExhibitor(id);
      return response.status(200).json({
        success: true,
        message: 'Exhibitor deleted successfully',
      });
    }
  
    // Remove individual flyer
    @Delete('flyers/:id')
    async removeExhibitorFlyer(
      @Param('id') id: string,
      @Body() body: { flyerPath: string },
      @Res() response: Response,
    ) {
      try {
        const exhibitor = await this.exhibitorService.getExhibitorById(id);
        if (!exhibitor) {
          throw new NotFoundException('Exhibitor not found');
        }
  
        const { flyerPath } = body;
  
        // Check if flyer exists in exhibitor
        if (!exhibitor.flyers || !exhibitor.flyers.includes(flyerPath)) {
          throw new NotFoundException('Flyer not found in this exhibitor');
        }
  
        // Remove flyer from filesystem
        const fullPath = path.join(__dirname, '..', '..', flyerPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
  
        // Remove flyer from database
        const updatedFlyers = exhibitor.flyers.filter(flyer => flyer !== flyerPath);
        await this.exhibitorService.updateExhibitorFiles(id, 'flyers', updatedFlyers);
  
        return response.status(200).json({
          success: true,
          message: 'Flyer removed successfully',
          data: { flyers: updatedFlyers }
        });
      } catch (error) {
        throw error;
      }
    }
  
    // Remove individual document
    @Delete('documents/:id')
    async removeExhibitorDocument(
      @Param('id') id: string,
      @Body() body: { documentPath: string },
      @Res() response: Response,
    ) {
      try {
        const exhibitor = await this.exhibitorService.getExhibitorById(id);
        if (!exhibitor) {
          throw new NotFoundException('Exhibitor not found');
        }
  
        const { documentPath } = body;
  
        // Check if document exists in exhibitor
        if (!exhibitor.documents || !exhibitor.documents.includes(documentPath)) {
          throw new NotFoundException('Document not found in this exhibitor');
        }
  
        // Remove document from filesystem
        const fullPath = path.join(__dirname, '..', '..', documentPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
  
        // Remove document from database
        const updatedDocuments = exhibitor.documents.filter(doc => doc !== documentPath);
        await this.exhibitorService.updateExhibitorFiles(id, 'documents', updatedDocuments);
  
        return response.status(200).json({
          success: true,
          message: 'Document removed successfully',
          data: { documents: updatedDocuments }
        });
      } catch (error) {
        throw error;
      }
    }
  
    // Remove individual event image
    @Delete('eventImages/:id')
    async removeExhibitorEventImage(
      @Param('id') id: string,
      @Body() body: { eventImagePath: string },
      @Res() response: Response,
    ) {
      try {
        const exhibitor = await this.exhibitorService.getExhibitorById(id);
        if (!exhibitor) {
          throw new NotFoundException('Exhibitor not found');
        }
  
        const { eventImagePath } = body;
  
        // Check if event image exists in exhibitor
        if (!exhibitor.eventImages || !exhibitor.eventImages.includes(eventImagePath)) {
          throw new NotFoundException('Event image not found in this exhibitor');
        }
  
        // Remove event image from filesystem
        const fullPath = path.join(__dirname, '..', '..', eventImagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
  
        // Remove event image from database
        const updatedEventImages = exhibitor.eventImages.filter(image => image !== eventImagePath);
        await this.exhibitorService.updateExhibitorFiles(id, 'eventImages', updatedEventImages);
  
        return response.status(200).json({
          success: true,
          message: 'Event image removed successfully',
          data: { eventImages: updatedEventImages }
        });
      } catch (error) {
        throw error;
      }
    }
  
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
      if (files.promotionalOfferImages) {
        files.promotionalOfferImages.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'exhibitor', 'promotionalOffers', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }
        });
      }
    }

    // Add this new method to delete files from filesystem
    private deleteFilesFromFilesystem(filePaths: string[]) {
      filePaths.forEach((filePath) => {
        const fullPath = path.join(__dirname, '..', '..', filePath);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`Deleted file: ${filePath}`);
          } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
          }
        }
      });
    }
  } 