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

export interface FilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: any; // Allow additional filter properties
}

export interface QueryBuilderConfig<T extends ObjectLiteral> {
  queryBuilder: SelectQueryBuilder<T>;
  alias: string;
  defaultSortBy?: string;
  defaultSortOrder?: 'ASC' | 'DESC';
  searchFields?: string[]; // Fields to search in
  sortFieldMap?: { [key: string]: string }; // Map frontend field names to database fields (e.g., { position: 'speakerProfile.position' })
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

  /**
   * Check if pagination parameters were provided in raw query
   * This is needed because DTOs may have default values
   */
  hasPaginationParams(rawQuery: any): boolean {
    return rawQuery.page !== undefined || rawQuery.limit !== undefined;
  }

  /**
   * Process filters and remove pagination if not provided in raw query
   */
  processFiltersWithPagination(filters: FilterOptions, rawQuery: any): FilterOptions {
    const processedFilters = { ...filters };
    
    // If pagination params not in raw query, remove them
    if (!this.hasPaginationParams(rawQuery)) {
      delete processedFilters.page;
      delete processedFilters.limit;
    }
    
    return processedFilters;
  }

  /**
   * Apply conditional pagination to query builder
   * Returns all records if pagination not provided, otherwise paginated
   */
  async applyConditionalPagination<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    filters: FilterOptions,
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const hasPagination = filters.page !== undefined || filters.limit !== undefined;
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    // Get total count
    const total = await queryBuilder.getCount();

    let data: T[];
    if (hasPagination) {
      // Apply pagination
      const skip = (page - 1) * limit;
      data = await queryBuilder.skip(skip).take(limit).getMany();
    } else {
      // Return all records
      data = await queryBuilder.getMany();
    }

    const totalPages = hasPagination ? Math.ceil(total / limit) : 1;

    return {
      data,
      pagination: {
        page: hasPagination ? page : 1,
        limit: hasPagination ? limit : total,
        total,
        totalPages,
        hasNext: hasPagination ? page < totalPages : false,
        hasPrev: hasPagination ? page > 1 : false,
      },
    };
  }

  /**
   * Apply sorting with support for field mapping (e.g., position -> speakerProfile.position)
   */
  applySortingWithMapping<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    sortBy: string | undefined,
    sortOrder: 'ASC' | 'DESC',
    defaultSortBy: string,
    alias: string = 'entity',
    sortFieldMap?: { [key: string]: string },
  ): SelectQueryBuilder<T> {
    const fieldToSort = sortBy || defaultSortBy;
    
    // Check if field needs mapping (e.g., position -> speakerProfile.position)
    let orderBy: string;
    if (sortFieldMap && sortFieldMap[fieldToSort]) {
      orderBy = sortFieldMap[fieldToSort];
    } else {
      orderBy = `${alias}.${fieldToSort}`;
    }
    
    return queryBuilder.orderBy(orderBy, sortOrder);
  }

  /**
   * Apply advanced search with multiple words support
   * Each word must match in any of the search fields (AND condition between words)
   */
  applyAdvancedSearch<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    search: string | undefined,
    searchFields: string[],
    alias: string = 'entity',
  ): SelectQueryBuilder<T> {
    if (!search || !searchFields.length) {
      return queryBuilder;
    }

    const searchLower = search.toLowerCase().trim();
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    
    // Remove duplicate words while preserving order
    const uniqueWords = Array.from(new Set(searchWords));
    
    if (uniqueWords.length > 1) {
      // Multiple words: each word must match in any field (AND condition between words)
      const conditions: string[] = [];
      const params: any = {};
      
      uniqueWords.forEach((word, index) => {
        const wordParam = `searchWord${index}`;
        params[wordParam] = `%${word}%`;
        const fieldConditions = searchFields.map(
          (field) => `LOWER(${alias}.${field}) LIKE :${wordParam}`,
        );
        conditions.push(`(${fieldConditions.join(' OR ')})`);
      });
      
      // All words must match (AND condition)
      queryBuilder.andWhere(`(${conditions.join(' AND ')})`, params);
    } else {
      // Single word: search in all fields
      const searchTerm = `%${uniqueWords[0]}%`;
      const fieldConditions = searchFields.map(
        (field) => `LOWER(${alias}.${field}) LIKE :searchTerm`,
      );
      queryBuilder.andWhere(
        `(${fieldConditions.join(' OR ')})`,
        { searchTerm },
      );
    }
    
    return queryBuilder;
  }

  /**
   * Complete query builder setup with pagination, sorting, and search
   * This is a convenience method that combines all common operations
   */
  async buildAndExecuteQuery<T extends ObjectLiteral>(
    config: QueryBuilderConfig<T>,
    filters: FilterOptions,
  ): Promise<PaginatedResult<T>> {
    const {
      queryBuilder,
      alias,
      defaultSortBy = 'updatedAt',
      defaultSortOrder = 'DESC',
      searchFields = [],
      sortFieldMap = {},
    } = config;

    const sortBy = filters.sortBy || defaultSortBy;
    const sortOrder = filters.sortOrder || defaultSortOrder;

    // Apply search
    if (filters.search && searchFields.length > 0) {
      this.applyAdvancedSearch(queryBuilder, filters.search, searchFields, alias);
    }

    // Apply sorting
    this.applySortingWithMapping(
      queryBuilder,
      sortBy,
      sortOrder,
      defaultSortBy,
      alias,
      sortFieldMap,
    );

    // Apply conditional pagination and get results
    return await this.applyConditionalPagination(queryBuilder, filters);
  }
}

