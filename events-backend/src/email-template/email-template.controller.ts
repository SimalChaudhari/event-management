import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto, RenderEmailTemplateDto } from './email-template.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';

@Controller('api/email-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailTemplateController {
  constructor(
    private readonly emailTemplateService: EmailTemplateService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Post('create')
  @Roles(UserRole.Admin)
  async createTemplate(
    @Body() dto: CreateEmailTemplateDto,
    @Res() res: Response,
  ): Promise<Response<SuccessResponse>> {
    try {
      const template = await this.emailTemplateService.createTemplate(dto);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Email template created successfully',
        data: template,
      });
    } catch (error) {
      this.errorHandler.logError(error, 'Email template creation');
      throw error;
    }
  }

  @Get()
  @Roles(UserRole.Admin)
  async getAllTemplates(
    @Res() res: Response,
    @Query('type') type?: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<Response<SuccessResponse>> {
    try {
      let templates;
      if (type) {
        templates = await this.emailTemplateService.getTemplatesByType(type);
      } else if (activeOnly === 'true') {
        templates = await this.emailTemplateService.getActiveTemplates();
      } else {
        templates = await this.emailTemplateService.getAllTemplates();
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Email templates retrieved successfully',
        data: templates,
      });
    } catch (error) {
      this.errorHandler.logError(error, 'Email template retrieval');
      throw error;
    }
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  async getTemplateById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response<SuccessResponse>> {
    try {
      const template = await this.emailTemplateService.getTemplateById(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Email template retrieved successfully',
        data: template,
      });
    } catch (error) {
      this.errorHandler.logError(error, 'Email template retrieval');
      throw error;
    }
  }

  @Put('update/:id')
  @Roles(UserRole.Admin)
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
    @Res() res: Response,
  ): Promise<Response<SuccessResponse>> {
    try {
      const template = await this.emailTemplateService.updateTemplate(id, dto);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Email template updated successfully',
        data: template,
      });
    } catch (error) {
      this.errorHandler.logError(error, 'Email template update');
      throw error;
    }
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteTemplate(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response<SuccessResponse>> {
    try {
      const result = await this.emailTemplateService.deleteTemplate(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      this.errorHandler.logError(error, 'Email template deletion');
      throw error;
    }
  }

  @Post('render')
  @Roles(UserRole.Admin)
  async renderTemplate(
    @Body() dto: RenderEmailTemplateDto,
    @Res() res: Response,
  ): Promise<Response<SuccessResponse>> {
    try {
      const rendered = await this.emailTemplateService.renderTemplate(dto);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Template rendered successfully',
        data: rendered,
      });
    } catch (error) {
      this.errorHandler.logError(error, 'Email template render');
      throw error;
    }
  }
}

