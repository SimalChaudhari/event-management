import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { UserRole } from '../user/users.entity';
import { SalesforceService } from './salesforce.service';
import { SalesforceSyncService } from './salesforce-sync.service';
import { SalesforceEmailService } from './salesforce-email.service';
import {
  SalesforceCreateRegistrationDto,
  SalesforceAttendanceDto,
} from './salesforce.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Controller('api/salesforce')
export class SalesforceController {
  constructor(
    private readonly salesforceService: SalesforceService,
    private readonly syncService: SalesforceSyncService,
    private readonly emailService: SalesforceEmailService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Post('send-registration-emails/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async sendRegistrationEmails(
    @Param('eventId') eventId: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.emailService.sendRegistrationEmailsForEvent(eventId);
      return res.status(HttpStatus.OK).json({
        success: result.success,
        message: result.message,
        data: {
          eventName: result.eventName,
          totalEligible: result.totalEligible,
          sentWithCredentials: result.sentWithCredentials,
          sentWithQROnly: result.sentWithQROnly,
          failed: result.failed,
          errors: result.errors,
        },
      });
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Salesforce send registration emails',
        undefined,
      );
      throw error;
    }
  }

  @Post('sync/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async syncEvents(@Res() res: Response) {
    try {
      const result = await this.syncService.syncEvents();
      return res.status(HttpStatus.OK).json({
        success: result.success,
        message: result.message,
        data: {
          created: result.created,
          updated: result.updated,
          existing: result.existing,
          errors: result.errors,
        },
      });
    } catch (error) {
      this.errorHandler.logError(error, 'Salesforce sync events', undefined);
      throw error;
    }
  }

  @Post('sync/registrations/:accountId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async syncRegistrations(
    @Param('accountId') accountId: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.syncService.syncRegistrationsForAccount(accountId);
      return res.status(HttpStatus.OK).json({
        success: result.success,
        message: result.message,
        data: {
          accountId: result.accountId,
          usersCreated: result.usersCreated,
          registrationsCreated: result.registrationsCreated,
          registrationsExisting: result.registrationsExisting,
          errors: result.errors,
        },
      });
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Salesforce sync registrations',
        undefined,
      );
      throw error;
    }
  }

  @Get('picklist/residential-declaration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async getResidentialDeclarationPicklist(
    @Res() res: Response,
    @Query('recordTypeId') recordTypeId?: string,
  ) {
    try {
      const id = recordTypeId || '01228000000useCAAQ';
      const data = await this.salesforceService.getResidentialDeclarationPicklist(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: data.values,
        defaultValue: data.defaultValue,
      });
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Salesforce picklist residential declaration',
        undefined,
      );
      throw error;
    }
  }

  @Post('registration/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async createCourseRegistration(
    @Body() dto: SalesforceCreateRegistrationDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.salesforceService.createCourseRegistration(dto);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Registration created in Salesforce',
        data,
      });
    } catch (error) {
      this.errorHandler.logError(
        error,
        'Salesforce create course registration',
        undefined,
      );
      throw error;
    }
  }

  @Post('attendance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async postAttendance(
    @Body() dto: SalesforceAttendanceDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.salesforceService.postAttendance(dto);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Attendance posted to Salesforce',
        data,
      });
    } catch (error) {
      this.errorHandler.logError(error, 'Salesforce post attendance', undefined);
      throw error;
    }
  }
}
