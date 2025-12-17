import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryDto } from './category.dto';
import {
  DuplicateResourceException,
  ResourceNotFoundException,
} from 'utils/exceptions/custom-exceptions';
import { ErrorHandlerService } from 'utils/services/error-handler.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private errorHandler: ErrorHandlerService,
  ) {}

  async createCategory(categoryDto: CategoryDto) {
    try {
      // Check if category with same name already exists
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: categoryDto.name },
      });

      if (existingCategory) {
        throw new DuplicateResourceException(
          `Category ${categoryDto.name}`
        );
      }
      const category = await this.categoryRepository.create(categoryDto);
      const savedCategory = await this.categoryRepository.save(category);
      return savedCategory;
    } catch (error) {
      if (error instanceof DuplicateResourceException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Category creation');
    }
  }

  async getAllCategories(
    filters?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{
    data: any[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      // If pagination is not provided, return all data
      const hasPagination = filters?.page !== undefined || filters?.limit !== undefined;
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const search = filters?.search;
      const sortBy = filters?.sortBy || 'createdAt';
      const sortOrder = filters?.sortOrder || 'DESC';

      // Build query builder
      const queryBuilder = this.categoryRepository.createQueryBuilder('category');

      // Apply search filter - search in name and description
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.toLowerCase().trim()}%`;
        queryBuilder.andWhere(
          '(LOWER(category.name) LIKE :searchTerm OR ' +
          'LOWER(category.description) LIKE :searchTerm)',
          { searchTerm },
        );
      }

      // Apply sorting
      if (sortBy === 'name' || sortBy === 'description' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
        queryBuilder.orderBy(`category.${sortBy}`, sortOrder);
      } else {
        // Default sorting
        queryBuilder.orderBy('category.createdAt', sortOrder);
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination only if pagination parameters are provided
      let categories;
      if (hasPagination) {
        const skip = (page - 1) * limit;
        categories = await queryBuilder.skip(skip).take(limit).getMany();
      } else {
        // No pagination - return all data
        categories = await queryBuilder.getMany();
      }

      // Return response with or without pagination
      if (hasPagination) {
        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
          data: categories,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
          },
        };
      } else {
        // No pagination - return all data without pagination metadata
        return {
          data: categories,
        };
      }
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Category retrieval');
    }
  }

  async getCategoryById(id: string) {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) {
        throw new ResourceNotFoundException('Category', id);
      }
      return category;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Category retrieval by ID');
    }
  }

  async updateCategory(id: string, categoryDto: Partial<CategoryDto>) {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) {
        throw new ResourceNotFoundException('Category', id);
      }

      // Check if name is being updated and if it conflicts with existing category
      if (categoryDto.name && categoryDto.name !== category.name) {
        const existingCategory = await this.categoryRepository.findOne({
          where: { name: categoryDto.name },
        });

        if (existingCategory) {
          throw new DuplicateResourceException(
            `Category ${categoryDto.name}`
          );
        }
      }

      const updatedCategory = await this.categoryRepository.save({
        ...category,
        ...categoryDto,
      });
      return updatedCategory;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Category update');
    }
  }

  async deleteCategory(id: string) {
    try {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new ResourceNotFoundException('Category', id);
    }

    await this.categoryRepository.remove(category);
    return {
      success: true,
      message: 'Category deleted successfully',
    };
  } catch (error) {
  
    if (error instanceof ResourceNotFoundException) {
      throw error;
    }
    this.errorHandler.handleDatabaseError(error, 'Category deletion');
  }
}
}
