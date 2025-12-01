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
  UploadedFile,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Response } from 'express';
import * as fs from 'fs';

import { PromotionalOfferService } from './promotional-offer.service';
import { CreatePromotionalOfferDto, UpdatePromotionalOfferDto } from './promotional-offer.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { UserRole } from '../user/users.entity';

@Controller('api/promotional-offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionalOfferController {
  constructor(private readonly promotionalOfferService: PromotionalOfferService) {}

  @Post('create')
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destinationPath = './uploads/promotional-offers';
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
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async createPromotionalOffer(
    @Body() createDto: CreatePromotionalOfferDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userEmail = req.user?.email;

      if (file) {
        createDto.image = `uploads/promotional-offers/${file.filename}`;
      }

      const promotionalOffer = await this.promotionalOfferService.createPromotionalOffer(
        createDto,
        userId,
        userRole,
        userEmail,
      );
      return response.status(201).json({
        success: true,
        message: 'Promotional offer created successfully',
        data: promotionalOffer,
      });
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (file) {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'promotional-offers', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      throw error;
    }
  }

  @Get()
  async getAllPromotionalOffers(
    @Res() response: Response,
    @Query('exhibitorId') exhibitorId?: string,
  ) {
    const promotionalOffers = exhibitorId 
      ? await this.promotionalOfferService.getPromotionalOffersByExhibitor(exhibitorId)
      : await this.promotionalOfferService.getAllPromotionalOffers();
    
    return response.status(200).json({
      success: true,
      message: exhibitorId 
        ? `Promotional offers for exhibitor ${exhibitorId} retrieved successfully`
        : 'All promotional offers retrieved successfully',
      data: promotionalOffers,
    });
  }

  @Get(':id')
  async getPromotionalOfferById(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const promotionalOffer = await this.promotionalOfferService.getPromotionalOfferById(id);
    return response.status(200).json({
      success: true,
      message: 'Promotional offer retrieved successfully',
      data: promotionalOffer,
    });
  }

  @Get('exhibitor/:exhibitorId')
  async getPromotionalOffersByExhibitor(
    @Param('exhibitorId') exhibitorId: string,
    @Res() response: Response,
  ) {
    const promotionalOffers = await this.promotionalOfferService.getPromotionalOffersByExhibitor(exhibitorId);
    return response.status(200).json({
      success: true,
      message: 'Promotional offers retrieved successfully',
      data: promotionalOffers,
    });
  }

  @Put('update/:id')
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destinationPath = './uploads/promotional-offers';
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
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async updatePromotionalOffer(
    @Param('id') id: string,
    @Body() updateDto: UpdatePromotionalOfferDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userEmail = req.user?.email;

      const existingOffer = await this.promotionalOfferService.getPromotionalOfferById(id);

      if (file) {
        // Delete old image if exists
        if (existingOffer.image) {
          const oldImagePath = path.join(__dirname, '..', '..', existingOffer.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateDto.image = `uploads/promotional-offers/${file.filename}`;
      }

      const updatedOffer = await this.promotionalOfferService.updatePromotionalOffer(
        id,
        updateDto,
        userId,
        userRole,
        userEmail,
      );
      return response.status(200).json({
        success: true,
        message: 'Promotional offer updated successfully',
        data: updatedOffer,
      });
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (file) {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'promotional-offers', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      throw error;
    }
  }

  @Put('toggle-status/:id')
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async togglePromotionalOfferStatus(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;

    const promotionalOffer = await this.promotionalOfferService.togglePromotionalOfferStatus(
      id,
      userId,
      userRole,
      userEmail,
    );
    return response.status(200).json({
      success: true,
      message: 'Promotional offer status toggled successfully',
      data: promotionalOffer,
    });
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin, UserRole.Exhibitor)
  async deletePromotionalOffer(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;

    await this.promotionalOfferService.deletePromotionalOffer(id, userId, userRole, userEmail);
    return response.status(200).json({
      success: true,
      message: 'Promotional offer deleted successfully',
    });
  }
} 