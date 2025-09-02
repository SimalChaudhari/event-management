import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AgendaCategoryService } from './agenda-category.service';
import {
  CreateAgendaCategoryDto,
  UpdateAgendaCategoryDto,
  BulkUpdateAgendaCategoryDto,
  DeleteAgendaCategoryDto,
} from './agenda-category.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';

@Controller('api/agenda-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaCategoryController {
  constructor(
    private readonly agendaCategoryService: AgendaCategoryService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Create a new agenda category
  @Post()
  async create(
    @Body() createDto: CreateAgendaCategoryDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const category = await this.agendaCategoryService.create(createDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Agenda category created successfully',
        data: category,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Agenda category creation',
        req.user?.id,
      );
      throw error;
    }
  }

  // Get all agenda categories
  @Get()
  async findAll(
    @Res() response: Response,
    @Request() req: any,
    @Query('includeInactive') includeInactive?: string,
  ) {
    try {
      const includeInactiveFlag = includeInactive === 'true';
      const categories = await this.agendaCategoryService.findAll(includeInactiveFlag);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Agenda categories retrieved successfully',
        data: categories,
        metadata: {
          total: categories.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Agenda categories retrieval',
        req.user?.id,
      );
      throw error;
    }
  }

  // Get agenda categories with statistics
  @Get('stats')
  async getCategoriesWithStats(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const categoriesWithStats = await this.agendaCategoryService.getCategoriesWithStats();

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Agenda categories with statistics retrieved successfully',
        data: categoriesWithStats,
        metadata: {
          total: categoriesWithStats.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Agenda categories stats retrieval',
        req.user?.id,
      );
      throw error;
    }
  }

  // Get agenda category by ID
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!id) {
        throw new BadRequestException('Category ID is required');
      }

      const category = await this.agendaCategoryService.findOne(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Agenda category retrieved successfully',
        data: category,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Agenda category retrieval',
        req.user?.id,
      );
      throw error;
    }
  }

  // Update agenda category
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgendaCategoryDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!id) {
        throw new BadRequestException('Category ID is required');
      }

      const category = await this.agendaCategoryService.update(id, updateDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Agenda category updated successfully',
        data: category,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Agenda category update',
        req.user?.id,
      );
      throw error;
    }
  }

  // Delete agenda category
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Body() deleteDto: DeleteAgendaCategoryDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!id) {
        throw new BadRequestException('Category ID is required');
      }

      const result = await this.agendaCategoryService.remove(id, deleteDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Agenda category deletion',
        req.user?.id,
      );
      throw error;
    }
  }

  // Bulk update agenda categories
  @Put('bulk/update')
  async bulkUpdate(
    @Body() bulkUpdateDto: BulkUpdateAgendaCategoryDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.agendaCategoryService.bulkUpdate(bulkUpdateDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Bulk agenda category update',
        req.user?.id,
      );
      throw error;
    }
  }

  // Create default agenda categories
  @Post('create-defaults')
  async createDefaultCategories(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.agendaCategoryService.createDefaultCategories();

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Default agenda categories creation',
        req.user?.id,
      );
      throw error;
    }
  }
}
