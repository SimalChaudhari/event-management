import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder, Repository, FindManyOptions, ObjectLiteral } from 'typeorm';
import { BaseFilterDto } from './filter.dto';

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class FilterService {
  /**
   * Apply pagination to a query builder
   */
  applyPagination<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 10,
  ): SelectQueryBuilder<T> {
    const skip = (page - 1) * limit;
    return queryBuilder.skip(skip).take(limit);
  }

  /**
   * Apply sorting to a query builder
   */
  applySorting<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    defaultSortBy: string = 'updatedAt',
  ): SelectQueryBuilder<T> {
    const orderBy = sortBy || defaultSortBy;
    return queryBuilder.orderBy(orderBy, sortOrder);
  }

  /**
   * Apply search filter to a query builder
   * Searches across multiple fields
   */
  applySearchFilter<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    search: string,
    searchFields: string[],
    alias: string = 'entity',
  ): SelectQueryBuilder<T> {
    if (!search || !searchFields.length) {
      return queryBuilder;
    }

    const searchTerm = `%${search.toLowerCase()}%`;
    const conditions = searchFields.map(
      (field) => `LOWER(${alias}.${field}) LIKE :searchTerm`,
    );

    return queryBuilder.andWhere(
      `(${conditions.join(' OR ')})`,
      { searchTerm },
    );
  }

  /**
   * Get paginated results from a query builder
   */
  async getPaginatedResults<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<T>> {
    // Clone the query builder to get total count
    const countQueryBuilder = queryBuilder.clone();
    const total = await countQueryBuilder.getCount();

    // Apply pagination to original query
    const skip = (page - 1) * limit;
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get paginated results from a repository with find options
   */
  async getPaginatedResultsFromRepository<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: FindManyOptions<T>,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<T>> {
    // Get total count
    const total = await repository.count(options);

    // Apply pagination
    const skip = (page - 1) * limit;
    const findOptions: FindManyOptions<T> = {
      ...options,
      skip,
      take: limit,
    };

    const data = await repository.find(findOptions);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Calculate pagination metadata
   */
  calculatePaginationMetadata(
    total: number,
    page: number,
    limit: number,
  ): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}

