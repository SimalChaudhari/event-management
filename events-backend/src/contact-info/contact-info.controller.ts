import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ContactInfoService } from './contact-info.service';
import {
  CreateContactInfoDto,
  UpdateContactInfoDto,
  StoreScannedContactDto,
  GetScannedUserInfoDto,
  SyncContactsToPhoneDto,
} from './contact-info.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';

@Controller('api/contact-info')
@UseGuards(JwtAuthGuard)
export class ContactInfoController {
  constructor(
    private readonly contactInfoService: ContactInfoService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Post('create')
  async createContactInfo(
    @Body() createContactInfoDto: CreateContactInfoDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.contactInfoService.createContactInfo(
        createContactInfoDto,
        userId,
      );

      return response.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Create contact info', req.user?.id);
      throw error;
    }
  }

  @Post('get-scanned-user-info')
  async getScannedUserInfo(
    @Body() getScannedUserInfoDto: GetScannedUserInfoDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.contactInfoService.getScannedUserInfo(
        getScannedUserInfoDto,
        userId,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Get scanned user info', req.user?.id);
      throw error;
    }
  }

  @Post('store-scanned')
  async storeScannedContact(
    @Body() storeScannedContactDto: StoreScannedContactDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.contactInfoService.storeScannedContact(
        storeScannedContactDto,
        userId,
      );

      return response.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Store scanned contact', req.user?.id);
      throw error;
    }
  }

  @Get('get')
  async getAllContacts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.contactInfoService.getAllContacts(
        userId,
        parseInt(page),
        parseInt(limit),
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Get all contacts', req.user?.id);
      throw error;
    }
  }

  @Get(':id')
  async getContactById(
    @Param('id') contactId: string,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.contactInfoService.getContactById(
        contactId,
        userId,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Get contact by ID', req.user?.id);
      throw error;
    }
  }

  @Put('update/:id')
  async updateContact(
    @Param('id') contactId: string,
    @Body() updateContactInfoDto: UpdateContactInfoDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.contactInfoService.updateContact(
        contactId,
        updateContactInfoDto,
        userId,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Update contact', req.user?.id);
      throw error;
    }
  }

  @Delete('delete/:id')
  async deleteContact(
    @Param('id') contactId: string,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.contactInfoService.deleteContact(
        contactId,
        userId,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Delete contact', req.user?.id);
      throw error;
    }
  }

  @Post('sync-to-phone')
  async syncContactsToPhone(
    @Body() syncContactsToPhoneDto: SyncContactsToPhoneDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await this.contactInfoService.syncContactsToPhone(
        syncContactsToPhoneDto,
        userId,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Sync contacts to phone', req.user?.id);
      throw error;
    }
  }
}
