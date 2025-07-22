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
          'Category',
          'name',
          categoryDto.name,
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

  async getAllCategories() {
    try {
      const categories = await this.categoryRepository.find({
        order: { createdAt: 'DESC' },
      });
      return categories;
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
            'Category',
            'name',
            categoryDto.name,
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
