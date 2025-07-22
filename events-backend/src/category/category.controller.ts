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
} from '@nestjs/common';
import { Response } from 'express';
import { CategoryService } from './category.service';
import { CategoryDto } from './category.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';

@Controller('api/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Post('create')
  @Roles(UserRole.Admin)
  async createCategory(
    @Body() categoryDto: CategoryDto,
    @Res() response: Response,
  ) {
    try {
      const category = await this.categoryService.createCategory(categoryDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Category created successfully',
        data: category,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Category creation', (response as any).user?.id);
      throw error; // Let global exception filter handle it
    }
  }

  @Get('get')
  async getAllCategories(@Res() response: Response) {
    try {
      const categories = await this.categoryService.getAllCategories();
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
        metadata: {
          total: categories.length,
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Category retrieval');
      throw error;
    }
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string, @Res() response: Response) {
    try {
      const category = await this.categoryService.getCategoryById(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Category retrieved successfully',
        data: category,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Category retrieval by ID');
      throw error;
    }
  }

  @Put('update/:id')
  @Roles(UserRole.Admin)
  async updateCategory(
    @Param('id') id: string,
    @Body() categoryDto: CategoryDto,
    @Res() response: Response,
  ) {
    try {
      const updatedCategory = await this.categoryService.updateCategory(id, categoryDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Category update', (response as any).user?.id);
      throw error;
    }
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteCategory(@Param('id') id: string, @Res() response: Response) {
    try {
      const result = await this.categoryService.deleteCategory(id);
      
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
      this.errorHandler.logError(error, 'Category deletion', (response as any).user?.id);
      throw error;
    }
  }
}
