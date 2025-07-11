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
} from '@nestjs/common';
import { Response } from 'express';
import { CategoryService } from './category.service';
import { CategoryDto } from './category.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';

@Controller('api/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('create')
  @Roles(UserRole.Admin)
  async createCategory(
    @Body() categoryDto: CategoryDto,
    @Res() response: Response,
  ) {
    const category = await this.categoryService.createCategory(categoryDto);
    return response.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  }

  @Get('get')
  async getAllCategories(@Res() response: Response) {
    const categories = await this.categoryService.getAllCategories();
    return response.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
    });
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string, @Res() response: Response) {
    const category = await this.categoryService.getCategoryById(id);
    return response.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category,
    });
  }

  @Put('update/:id')
  @Roles(UserRole.Admin)
  async updateCategory(
    @Param('id') id: string,
    @Body() categoryDto: CategoryDto,
    @Res() response: Response,
  ) {
    const updatedCategory = await this.categoryService.updateCategory(id, categoryDto);
    return response.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteCategory(@Param('id') id: string, @Res() response: Response) {
    const result = await this.categoryService.deleteCategory(id);
    return response.status(200).json({
      success: true,
      message: result.message
    });
  }
}