import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryDto } from './category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async createCategory(categoryDto: CategoryDto) {
    // Check if category with same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: categoryDto.name },
    });
    
    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.categoryRepository.create(categoryDto);
    const savedCategory = await this.categoryRepository.save(category);
    return savedCategory;
  }

  async getAllCategories() {
    const categories = await this.categoryRepository.find({
      order: { createdAt: 'DESC' }
    });
    return categories;
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async updateCategory(id: string, categoryDto: Partial<CategoryDto>) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    // Check if name is being updated and if it conflicts with existing category
    if (categoryDto.name && categoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: categoryDto.name },
      });
      
      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const updatedCategory = await this.categoryRepository.save({
      ...category,
      ...categoryDto,
    });
    return updatedCategory;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    await this.categoryRepository.remove(category);
    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }
}