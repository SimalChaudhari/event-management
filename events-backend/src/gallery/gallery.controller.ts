// src/gallery/gallery.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  NotFoundException,
  Post,
  UseInterceptors,
  Body,
  UploadedFiles,
  Put,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { GalleryService } from './gallery.service';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GalleryDto, UpdateGalleryDto } from './gallery.dto';
import path from 'path';
import * as fs from 'fs';
import { EventService } from 'event/event.service';

@Controller('api/gallery')
@UseGuards(JwtAuthGuard)
export class GalleryController {
  constructor(private readonly galleryService: GalleryService, private readonly eventService: EventService) {}


  @Get()
  async getAllGalleryItems(
    @Query()
    filters: {
      keyword?: string;
      type?: 'images' | 'documents' | 'all';
      eventId?: string;
    },
    @Res() response: Response,
  ) {
    try {
      const galleryItems = await this.galleryService.getAllGalleryItems(filters);
      
      return response.status(200).json({
        success: true,
        message: 'Gallery items retrieved successfully',
        total: galleryItems.length,
        data: galleryItems,
      });
    } catch (error) {
      throw error;
    }
  }

  @Get('event/:eventId')
  async getGalleryByEvent(
    @Param('eventId') eventId: string,
    @Query()
    filters: {
      type?: 'images' | 'documents' | 'all';
    },
    @Res() response: Response,
  ) {
    try {
      const galleryItems = await this.galleryService.getGalleryByEvent(eventId, filters);
      
      if (!galleryItems) {
        throw new NotFoundException('Event not found or no gallery items available');
      }

      return response.status(200).json({
        success: true,
        message: 'Event gallery retrieved successfully',
        eventId: eventId,
        total: galleryItems.images.length + galleryItems.documents.length,
        data: galleryItems,
      });
    } catch (error) {
      throw error;
    }
  }


  @Post('create-or-update')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'galleryImages', maxCount: 500 }, // Up to 500 images
    ], {
      storage: diskStorage({
        destination: './uploads/gallery/images',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.fieldname === 'galleryImages' && file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only images are allowed.'), false);
        }
      },
    }),
  )
  async createOrUpdateGallery(
    @Body() galleryDto: GalleryDto,
    @UploadedFiles() files: { galleryImages?: Express.Multer.File[] },
    @Res() response: Response,
  ) {
    try { 
      if (files.galleryImages && files.galleryImages.length > 0) {
        galleryDto.galleryImages = files.galleryImages.map(
          (img) => `uploads/gallery/images/${img.filename}`,
        );
      }
      
      // Check if event exists
      const event = await this.eventService.getEventEntityById(galleryDto.eventId);
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const gallery = await this.galleryService.createOrUpdateGallery(galleryDto);

      // Check if gallery was created or updated
      const isNewGallery = !gallery.data.id || gallery.data.createdAt === gallery.data.updatedAt;

      return response.status(201).json({
        success: true,
        message: isNewGallery ? 'Gallery created successfully' : 'Gallery updated successfully',
        data: gallery,
        action: isNewGallery ? 'created' : 'updated'
      });
    } catch (error) {
      // Clean up uploaded files if error occurs
      if (files.galleryImages && files.galleryImages.length > 0) {
        files.galleryImages.forEach((file) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'gallery',
            'images',
            file.filename,
          );
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }
        });
      }
      throw error;
    }
  }

  @Get('get-all')
  async getAllGalleries(@Res() response: Response) {
    const galleries = await this.galleryService.getAllGalleries();
    return response.status(200).json({
      success: true,
      message: 'Galleries retrieved successfully',
      data: galleries,
    });
  }

  @Get(':id')
  async getGalleryById(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const gallery = await this.galleryService.getGalleryById(id);
    return response.status(200).json({
      success: true,
      message: 'Gallery retrieved successfully',
      data: gallery,
    });
  }

 // DELETE COMPLETE GALLERY
 @Delete('delete/:id')
 @Roles(UserRole.Admin)
 async deleteGallery(@Param('id') id: string, @Res() response: Response) {
   try {
     const result = await this.galleryService.deleteGallery(id);
     return response.status(200).json({
       success: true,
       message: result.message,
     });
   } catch (error) {
     throw error;
   }
 }

 // DELETE SPECIFIC IMAGE BY PATH
 @Delete('delete-image/:galleryId')
 @Roles(UserRole.Admin)
 async deleteSpecificGalleryImage(
   @Param('galleryId') galleryId: string,
   @Body() body: { imagePath: string },
   @Res() response: Response,
 ) {
   try {
     if (!body.imagePath) {
       throw new BadRequestException('Image path is required');
     }

     const result = await this.galleryService.deleteSpecificGalleryImage(galleryId, body.imagePath);
     return response.status(200).json({
       success: true,
       message: result.message,
       data: result.data,
     });
   } catch (error) {
     throw error;
   }
 }


 // CLEAR ALL IMAGES FROM GALLERY
 @Delete('clear/:galleryId')
 @Roles(UserRole.Admin)
 async clearAllGalleryImages(
   @Param('galleryId') galleryId: string,
   @Res() response: Response,
 ) {
   try {
     const result = await this.galleryService.clearAllGalleryImages(galleryId);
     return response.status(200).json({
       success: true,
       message: result.message,
       data: result.data,
     });
   } catch (error) {
     throw error;
   }
 }

}