import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AgendaCategory } from './agenda-category.entity';
import { EventAgenda } from './agenda.entity';
import { 
  CreateAgendaCategoryDto,
  UpdateAgendaCategoryDto,
  BulkUpdateAgendaCategoryDto,
  DeleteAgendaCategoryDto
} from './agenda-category.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';

@Injectable()
export class AgendaCategoryService {
  constructor(
    @InjectRepository(AgendaCategory)
    private agendaCategoryRepository: Repository<AgendaCategory>,
    @InjectRepository(EventAgenda)
    private agendaRepository: Repository<EventAgenda>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Create a new agenda category
  async create(createDto: CreateAgendaCategoryDto) {
    try {
      // Check if category name already exists
      const existingCategory = await this.agendaCategoryRepository.findOne({
        where: { name: createDto.name },
      });

      if (existingCategory) {
        throw new ConflictException(`Category with name "${createDto.name}" already exists`);
      }

      // Create new category
      const category = this.agendaCategoryRepository.create({
        name: createDto.name,
        color: createDto.color,
        isActive: createDto.isActive ?? true,
      });

      const savedCategory = await this.agendaCategoryRepository.save(category);

      return this.formatCategoryResponse(savedCategory);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Agenda category creation');
    }
  }

  // Get all agenda categories
  async findAll(includeInactive: boolean = false) {
    try {
      const queryBuilder = this.agendaCategoryRepository.createQueryBuilder('category');

      if (!includeInactive) {
        queryBuilder.where('category.isActive = :isActive', { isActive: true });
      }

      queryBuilder.orderBy('category.name', 'ASC');

      const categories = await queryBuilder.getMany();

      // Get agenda count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const agendaCount = await this.agendaRepository.count({
            where: { category: { id: category.id } },
          });

          return {
            ...this.formatCategoryResponse(category),
            agendaCount,
          };
        })
      );

      return categoriesWithCount;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Agenda categories retrieval');
    }
  }

  // Get agenda category by ID
  async findOne(id: string) {
    try {
      const category = await this.agendaCategoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        throw new ResourceNotFoundException('Agenda category', id);
      }

      // Get agenda count for this category
      const agendaCount = await this.agendaRepository.count({
        where: { category: { id: category.id } },
      });

      return {
        ...this.formatCategoryResponse(category),
        agendaCount,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Agenda category retrieval');
    }
  }

  // Update agenda category
  async update(id: string, updateDto: UpdateAgendaCategoryDto) {
    try {
      const category = await this.agendaCategoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        throw new ResourceNotFoundException('Agenda category', id);
      }

      // Check if new name conflicts with existing category (if name is being updated)
      if (updateDto.name && updateDto.name !== category.name) {
        const existingCategory = await this.agendaCategoryRepository.findOne({
          where: { name: updateDto.name },
        });

        if (existingCategory) {
          throw new ConflictException(`Category with name "${updateDto.name}" already exists`);
        }
      }

      // Update category
      Object.assign(category, updateDto);
      const updatedCategory = await this.agendaCategoryRepository.save(category);

      return this.formatCategoryResponse(updatedCategory);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Agenda category update');
    }
  }

  // Delete agenda category
  async remove(id: string, deleteDto?: DeleteAgendaCategoryDto) {
    try {
      const category = await this.agendaCategoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        throw new ResourceNotFoundException('Agenda category', id);
      }

      // Check if category is being used by any agendas
      const agendaCount = await this.agendaRepository.count({
        where: { category: { id: category.id } },
      });

      if (agendaCount > 0) {
        if (deleteDto?.replacementCategoryId) {
          // Move agendas to replacement category
          const replacementCategory = await this.agendaCategoryRepository.findOne({
            where: { id: deleteDto.replacementCategoryId },
          });

          if (!replacementCategory) {
            throw new ResourceNotFoundException('Replacement agenda category', deleteDto.replacementCategoryId);
          }

          // Update all agendas to use the replacement category
          await this.agendaRepository.update(
            { category: { id: category.id } },
            { category: { id: deleteDto.replacementCategoryId } }
          );
        } else {
          throw new BadRequestException(
            `Cannot delete category "${category.name}" as it is being used by ${agendaCount} agenda(s). Please provide a replacement category or remove the agendas first.`
          );
        }
      }

      // Delete the category
      await this.agendaCategoryRepository.remove(category);

      return {
        message: `Category "${category.name}" deleted successfully`,
        deletedCategoryId: id,
        agendasMoved: agendaCount > 0 ? agendaCount : 0,
        replacementCategoryId: deleteDto?.replacementCategoryId || null,
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Agenda category deletion');
    }
  }

  // Bulk update agenda categories
  async bulkUpdate(bulkUpdateDto: BulkUpdateAgendaCategoryDto) {
    try {
      const { categoryIds, isActive } = bulkUpdateDto;

      if (categoryIds.length === 0) {
        throw new BadRequestException('No category IDs provided');
      }

      // Verify all categories exist
      const categories = await this.agendaCategoryRepository.findByIds(categoryIds);
      
      if (categories.length !== categoryIds.length) {
        const foundIds = categories.map(c => c.id);
        const missingIds = categoryIds.filter(id => !foundIds.includes(id));
        throw new ResourceNotFoundException('Agenda categories', missingIds.join(', '));
      }

      // Update categories
      const updateData: Partial<AgendaCategory> = {};
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      await this.agendaCategoryRepository.update(categoryIds, updateData);

      // Return updated categories
      const updatedCategories = await this.agendaCategoryRepository.findByIds(categoryIds);
      
      return {
        message: `Successfully updated ${updatedCategories.length} category(ies)`,
        updatedCategories: updatedCategories.map(category => this.formatCategoryResponse(category)),
        updatedCount: updatedCategories.length,
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Bulk agenda category update');
    }
  }

  // Get categories with agenda counts
  async getCategoriesWithStats() {
    try {
      const categories = await this.agendaCategoryRepository.find({
        order: { name: 'ASC' },
      });

      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const agendaCount = await this.agendaRepository.count({
            where: { category: { id: category.id } },
          });

          const activeAgendaCount = await this.agendaRepository.count({
            where: { 
              category: { id: category.id },
              isActive: true 
            },
          });

          return {
            ...this.formatCategoryResponse(category),
            agendaCount,
            activeAgendaCount,
          };
        })
      );

      return categoriesWithStats;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Agenda categories stats retrieval');
    }
  }

  // Create default agenda categories
  async createDefaultCategories() {
    try {
      const defaultCategories = [
        { name: 'Brainstorm', color: '#FF6B6B' },      // Red
        { name: 'Discussion', color: '#4ECDC4' },      // Teal
        { name: 'Presentation', color: '#45B7D1' },    // Blue
        { name: 'Workshop', color: '#96CEB4' },        // Green
        { name: 'Networking', color: '#FFEAA7' },      // Yellow
        { name: 'Break', color: '#DDA0DD' },           // Plum
        { name: 'QnA', color: '#98D8C8' },             // Mint
        { name: 'Panel', color: '#F7DC6F' },           // Light Yellow
        { name: 'Demo', color: '#BB8FCE' },            // Light Purple
        { name: 'Meeting', color: '#85C1E9' },         // Light Blue
      ];

      const createdCategories = [];

      for (const categoryData of defaultCategories) {
        // Check if category already exists
        const existingCategory = await this.agendaCategoryRepository.findOne({
          where: { name: categoryData.name },
        });

        if (!existingCategory) {
          const category = this.agendaCategoryRepository.create({
            name: categoryData.name,
            color: categoryData.color,
            isActive: true,
          });

          const savedCategory = await this.agendaCategoryRepository.save(category);
          createdCategories.push(this.formatCategoryResponse(savedCategory));
        } else {
          console.log(`Category "${categoryData.name}" already exists`);
        }
      }

      return {
        message: `Successfully created ${createdCategories.length} default categories`,
        createdCategories,
        totalRequested: defaultCategories.length,
        alreadyExisted: defaultCategories.length - createdCategories.length,
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Default categories creation');
    }
  }

  // Helper method to format category response
  private formatCategoryResponse(category: AgendaCategory) {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
