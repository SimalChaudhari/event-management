// src/gallery/gallery.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Post,
  UseInterceptors,
  Body,
  UploadedFiles,
  Delete,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { Public } from 'jwt/public.decorator';
import { GalleryService } from './gallery.service';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GalleryDto } from './gallery.dto';
import path from 'path';
import * as fs from 'fs';

import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';

@Controller('api/gallery')
@UseGuards(JwtAuthGuard)
export class GalleryController {
  constructor(
    private readonly galleryService: GalleryService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Fot Events
  @Get()
  async getAllGalleryItems(
    @Query()
    filters: {
      keyword?: string;
      type?: 'images' | 'documents' | 'all';
      eventId?: string;
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const galleryItems =
        await this.galleryService.getAllGalleryItems(filters);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Gallery items retrieved successfully',
        data: galleryItems,
        metadata: {
          total: galleryItems.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Gallery items retrieval',
        req.user?.id,
      );
      throw error;
    }
  }

  /** Get gallery tracks for an event. With query page/limit → paginated; otherwise returns all tracks. */
  @Get('event/:eventId/tracks')
  async getGalleryTracksByEvent(
    @Param('eventId') eventId: string,
    @Query()
    query: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      keyword?: string;
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const usePagination = query.page !== undefined && query.limit !== undefined;
      if (usePagination) {
        const result = await this.galleryService.getGalleryTracksByEventPaginated(eventId, {
          page: query.page ? Number(query.page) : 1,
          limit: query.limit ? Number(query.limit) : 10,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder as 'ASC' | 'DESC' | undefined,
          keyword: query.keyword,
        });
        const successResponse = {
          success: true,
          message: 'Event gallery tracks retrieved successfully',
          data: result.tracks,
          metadata: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            eventId: result.eventId,
            eventName: result.eventName,
            timestamp: new Date().toISOString(),
          },
        } as SuccessResponse;
        return response.status(HttpStatus.OK).json(successResponse);
      }
      const result = await this.galleryService.getGalleryTracksByEvent(eventId);
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event gallery tracks retrieved successfully',
        data: result,
        metadata: {
          total: result.tracks.length,
          timestamp: new Date().toISOString(),
        },
      };
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Gallery tracks by event',
        req.user?.id,
      );
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
    @Request() req: any,
  ) {
    try {
      const galleryItems = await this.galleryService.getGalleryByEvent(
        eventId,
        filters,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event gallery retrieved successfully',
        data: {
          // eventId: eventId,
          ...galleryItems,
        },
        metadata: {
          total: galleryItems.images.length + galleryItems.documents.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Gallery retrieval by event',
        req.user?.id,
      );
      throw error;
    }
  }

  // For Event Gallery

  @Post('create-or-update/:eventId')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'galleryImages', maxCount: 500 }], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destinationPath = './uploads/gallery/images';
          // Create directory if it doesn't exist
          if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath, { recursive: true });
          }
          cb(null, destinationPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedImageTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
        ];
        if (
          file.fieldname === 'galleryImages' &&
          allowedImageTypes.includes(file.mimetype)
        ) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Invalid file type. Allowed types for images: JPEG, JPG, PNG, GIF.`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async createOrUpdateGallery(
    @Param('eventId') eventId: string,
    @Body() galleryDto: GalleryDto,
    @UploadedFiles() files: { galleryImages?: Express.Multer.File[] },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (files.galleryImages && files.galleryImages.length > 0) {
        galleryDto.galleryImages = files.galleryImages.map(
          (img) => `uploads/gallery/images/${img.filename}`,
        );
      }

      const gallery = await this.galleryService.createOrUpdateGallery(
        eventId,
        galleryDto,
      );

      // Use the isNew flag from service instead of comparing timestamps
      const isNewGallery = gallery.isNew;

      const successResponse: SuccessResponse = {
        success: true,
        message: isNewGallery ? 'Gallery created successfully' : 'Gallery updated successfully',
        data: {
          ...gallery,
          action: isNewGallery ? 'created' : 'updated',
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
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

      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Gallery Images Upload');
      }

      this.errorHandler.logError(
        error,
        'Gallery creation/update',
        req.user?.id,
      );
      throw error;
    }
  }

  /** Single image download (Public – for gallery view & event listing). path = relative e.g. uploads/gallery/images/xxx.jpg */
  @Get('download/image')
  @Public()
  async downloadSingleImage(
    @Query('path') imagePath: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!imagePath || typeof imagePath !== 'string') {
        throw new ValidationException('Query parameter path is required');
      }
      const normalized = imagePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
      if (!normalized.startsWith('uploads/gallery/images/') || normalized.includes('..')) {
        throw new BadRequestException('Invalid image path');
      }
      const filePath = path.join(process.cwd(), normalized);
      if (!fs.existsSync(filePath)) {
        throw new ResourceNotFoundException('Image', imagePath);
      }
      const fileName = path.basename(normalized);
      response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      response.setHeader('Content-Type', 'application/octet-stream');
      return response.sendFile(path.resolve(filePath));
    } catch (error) {
      this.errorHandler.logError(error, 'Gallery single image download', req.user?.id);
      throw error;
    }
  }

  /** Download all images of a gallery track as ZIP (Public – for gallery view & event listing). */
  @Get('download/all/:galleryId')
  @Public()
  async downloadAllGalleryImages(
    @Param('galleryId') galleryId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      await this.streamAllGalleryImagesAsZip(galleryId, response);
    } catch (error) {
      this.errorHandler.logError(error, 'Gallery all images download', req.user?.id);
      throw error;
    }
  }

  /** Get download URL for all gallery images. Frontend shows this link; on click, ZIP downloads (Public). */
  @Get('download-all-url/:galleryId')
  @Public()
  async getDownloadAllGalleryUrl(
    @Param('galleryId') galleryId: string,
    @Request() req: any,
  ) {
    const gallery = await this.galleryService.getGalleryById(galleryId);
    if (!gallery.galleryImages || gallery.galleryImages.length === 0) {
      throw new BadRequestException('No images found to download');
    }
    const protocol = req.protocol || 'https';
    const host = req.get?.('host') || req.headers?.host || '';
    const baseUrl = `${protocol}://${host}`;
    const downloadUrl = `${baseUrl}/api/gallery/download/all/${galleryId}`;
    return {
      success: true,
      downloadUrl,
      message: 'Use this URL as link – when user clicks, ZIP will download',
    };
  }

  private async streamAllGalleryImagesAsZip(galleryId: string, response: Response): Promise<void> {
    const gallery = await this.galleryService.getGalleryById(galleryId);
    if (!gallery.galleryImages || gallery.galleryImages.length === 0) {
      throw new BadRequestException('No images found to download');
    }
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    const safeTitle = (gallery.trackTitle || 'gallery').replace(/[^a-zA-Z0-9-_]/g, '_');
    response.attachment(`gallery-${safeTitle}-${galleryId}.zip`);
    archive.pipe(response);
    let added = 0;
    for (let i = 0; i < gallery.galleryImages.length; i++) {
      const relPath = gallery.galleryImages[i];
      const fullPath = path.join(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(relPath);
        archive.file(fullPath, { name: `image_${i + 1}${ext}` });
        added++;
      }
    }
    if (added === 0) {
      throw new BadRequestException('No valid image files found to download');
    }
    await archive.finalize();
  }

  @Get('get-all')
  async getAllGalleries(
    @Query()
    filters: {
      keyword?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Process filter parameters
      const processedFilters = {
        keyword: filters.keyword?.trim() || undefined,
        page: filters.page ? Number(filters.page) : undefined,
        limit: filters.limit ? Number(filters.limit) : undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortOrder || undefined,
      };

      const result = await this.galleryService.getAllGalleries(processedFilters);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Galleries retrieved successfully',
        data: result.data,
        metadata: {
          ...(result.pagination || {}),
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Galleries retrieval', req.user?.id);
      throw error;
    }
  }

  @Get(':id')
  async getGalleryById(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const gallery = await this.galleryService.getGalleryById(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Gallery retrieved successfully',
        data: gallery,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Gallery retrieval by ID',
        req.user?.id,
      );
      throw error;
    }
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteGallery(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.galleryService.deleteGallery(id);

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
      this.errorHandler.logError(error, 'Gallery deletion', req.user?.id);
      throw error;
    }
  }

  @Delete('delete-image/:galleryId')
  @Roles(UserRole.Admin)
  async deleteSpecificGalleryImage(
    @Param('galleryId') galleryId: string,
    @Body() body: { imagePath: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!body.imagePath) {
        throw new ValidationException('Image path is required');
      }

      const result = await this.galleryService.deleteSpecificGalleryImage(
        galleryId,
        body.imagePath,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Gallery image deletion', req.user?.id);
      throw error;
    }
  }

  @Delete('clear/:galleryId')
  @Roles(UserRole.Admin)
  async clearAllGalleryImages(
    @Param('galleryId') galleryId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.galleryService.clearAllGalleryImages(galleryId);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Gallery images clearing',
        req.user?.id,
      );
      throw error;
    }
  }
}
