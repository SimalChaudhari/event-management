import { SelectQueryBuilder } from 'typeorm';
import { Event } from '../../event/event.entity';
import { EventType } from '../../event/event.dto';

export class EventQueryBuilderUtils {
  /**
   * Build base query with all necessary joins for event search
   */
  static buildBaseQuery(queryBuilder: SelectQueryBuilder<Event>): SelectQueryBuilder<Event> {
    return queryBuilder
      .leftJoinAndSelect('event.eventSpeakers', 'eventSpeaker')
      .leftJoinAndSelect('eventSpeaker.speaker', 'speaker')
      .leftJoinAndSelect('speaker.speakerProfile', 'speakerProfile')
      .leftJoinAndSelect('event.category', 'eventCategory')
      .leftJoinAndSelect('eventCategory.category', 'category')
      .leftJoinAndSelect('event.eventExhibitors', 'eventExhibitor')
      .leftJoinAndSelect('eventExhibitor.exhibitor', 'exhibitor')
      .leftJoinAndSelect('exhibitor.promotionalOffers', 'promotionalOffers')
      .leftJoinAndSelect('event.galleries', 'galleries');
  }

  /**
   * Apply keyword search filter
   */
  static applyKeywordFilter(
    queryBuilder: SelectQueryBuilder<Event>,
    keyword: string
  ): SelectQueryBuilder<Event> {
    const keywordLower = keyword.toLowerCase();
    return queryBuilder.where(
      'LOWER(event.name) LIKE :keyword OR LOWER(event.description) LIKE :keyword OR LOWER(event.venue) LIKE :keyword OR LOWER(event.location) LIKE :keyword OR LOWER(event.country) LIKE :keyword OR LOWER(CAST(event.price AS TEXT)) LIKE :keyword OR LOWER(event.currency) LIKE :keyword OR LOWER(CAST(event.latitude AS TEXT)) LIKE :keyword OR LOWER(CAST(event.longitude AS TEXT)) LIKE :keyword',
      { keyword: `%${keywordLower}%` }
    );
  }

  /**
   * Apply date range filter
   */
  static applyDateRangeFilter(
    queryBuilder: SelectQueryBuilder<Event>,
    startDate: string,
    endDate: string
  ): SelectQueryBuilder<Event> {
    return queryBuilder.andWhere(
      'event.startDate >= :startDate AND event.endDate <= :endDate',
      { startDate, endDate }
    );
  }

  /**
   * Apply event type filter
   */
  static applyEventTypeFilter(
    queryBuilder: SelectQueryBuilder<Event>,
    type: EventType
  ): SelectQueryBuilder<Event> {
    return queryBuilder.andWhere('event.type = :type', { type });
  }

  /**
   * Apply category filter
   */
  static applyCategoryFilter(
    queryBuilder: SelectQueryBuilder<Event>,
    categoryName: string
  ): SelectQueryBuilder<Event> {
    const categoryNameLower = categoryName.toLowerCase();
    return queryBuilder.andWhere('LOWER(category.name) LIKE :categoryName', {
      categoryName: `%${categoryNameLower}%`,
    });
  }

  /**
   * Apply upcoming events filter
   */
  static applyUpcomingFilter(
    queryBuilder: SelectQueryBuilder<Event>
  ): SelectQueryBuilder<Event> {
    const today = new Date();
    return queryBuilder.andWhere('event.startDate >= :today', { today });
  }

  /**
   * Apply location filter
   */
  static applyLocationFilter(
    queryBuilder: SelectQueryBuilder<Event>,
    location: string
  ): SelectQueryBuilder<Event> {
    const locationLower = location.toLowerCase();
    return queryBuilder.andWhere('LOWER(event.location) LIKE :location', {
      location: `%${locationLower}%`,
    });
  }

  /**
   * Apply price range filter
   */
  static applyPriceRangeFilter(
    queryBuilder: SelectQueryBuilder<Event>,
    minPrice?: number,
    maxPrice?: number,
    currency?: string
  ): SelectQueryBuilder<Event> {
    if (minPrice !== undefined) {
      queryBuilder.andWhere('event.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('event.price <= :maxPrice', { maxPrice });
    }
    if (currency) {
      queryBuilder.andWhere('event.currency = :currency', { currency });
    }
    return queryBuilder;
  }

  /**
   * Apply country filter
   */
  static applyCountryFilter(
    queryBuilder: SelectQueryBuilder<Event>,
    country: string
  ): SelectQueryBuilder<Event> {
    const countryLower = country.toLowerCase();
    return queryBuilder.andWhere('LOWER(event.country) LIKE :country', {
      country: `%${countryLower}%`,
    });
  }

  /**
   * Apply speaker filter
   */
  static applySpeakerFilter(
    queryBuilder: SelectQueryBuilder<Event>,
    speakerName: string
  ): SelectQueryBuilder<Event> {
    const speakerNameLower = speakerName.toLowerCase();
    return queryBuilder.andWhere(
      'LOWER(speaker.firstName) LIKE :speakerName OR LOWER(speaker.lastName) LIKE :speakerName',
      { speakerName: `%${speakerNameLower}%` }
    );
  }

  /**
   * Apply exhibitor filter
   */
  static applyExhibitorFilter(
    queryBuilder: SelectQueryBuilder<Event>,
    exhibitorName: string
  ): SelectQueryBuilder<Event>
  {
    const exhibitorNameLower = exhibitorName.toLowerCase();
    return queryBuilder.andWhere(
      'LOWER(exhibitor.companyName) LIKE :exhibitorName OR LOWER(exhibitor.companyDescription) LIKE :exhibitorName',
      { exhibitorName: `%${exhibitorNameLower}%` }
    );
  }

  /**
   * Apply pagination
   */
  static applyPagination(
    queryBuilder: SelectQueryBuilder<Event>,
    limit: number,
    offset: number
  ): SelectQueryBuilder<Event> {
    return queryBuilder.limit(limit).offset(offset);
  }

  /**
   * Apply sorting
   */
  static applySorting(
    queryBuilder: SelectQueryBuilder<Event>,
    sortBy: string = 'startDate',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): SelectQueryBuilder<Event> {
    const validSortFields = [
      'name', 'startDate', 'endDate', 'price', 'createdAt', 'updatedAt'
    ];
    
    if (validSortFields.includes(sortBy)) {
      return queryBuilder.orderBy(`event.${sortBy}`, sortOrder);
    }
    
    // Default sorting by start date
    return queryBuilder.orderBy('event.startDate', 'ASC');
  }

  /**
   * Build complete search query with all filters
   */
  static buildSearchQuery(
    queryBuilder: SelectQueryBuilder<Event>,
    filters: {
      keyword?: string;
      startDate?: string;
      endDate?: string;
      type?: EventType;
      upcoming?: boolean;
      category?: string;
      location?: string;
      country?: string;
      speaker?: string;
      exhibitor?: string;
      minPrice?: number;
      maxPrice?: number;
      currency?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }
  ): SelectQueryBuilder<Event> {
    // Apply base query with joins
    this.buildBaseQuery(queryBuilder);

    // Apply filters
    if (filters.keyword) {
      this.applyKeywordFilter(queryBuilder, filters.keyword);
    }

    if (filters.startDate && filters.endDate) {
      this.applyDateRangeFilter(queryBuilder, filters.startDate, filters.endDate);
    }

    if (filters.type) {
      this.applyEventTypeFilter(queryBuilder, filters.type);
    }

    if (filters.category) {
      this.applyCategoryFilter(queryBuilder, filters.category);
    }

    if (filters.upcoming) {
      this.applyUpcomingFilter(queryBuilder);
    }

    if (filters.location) {
      this.applyLocationFilter(queryBuilder, filters.location);
    }

    if (filters.country) {
      this.applyCountryFilter(queryBuilder, filters.country);
    }

    if (filters.speaker) {
      this.applySpeakerFilter(queryBuilder, filters.speaker);
    }

    if (filters.exhibitor) {
      this.applyExhibitorFilter(queryBuilder, filters.exhibitor);
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.currency) {
      this.applyPriceRangeFilter(
        queryBuilder,
        filters.minPrice,
        filters.maxPrice,
        filters.currency
      );
    }

    // Apply sorting
    this.applySorting(queryBuilder, filters.sortBy, filters.sortOrder);

    return queryBuilder;
  }

  /**
   * Build global search query for events only
   */
  static buildGlobalEventSearchQuery(
    queryBuilder: SelectQueryBuilder<Event>,
    keyword: string,
    filters: {
      startDate?: string;
      endDate?: string;
      location?: string;
    } = {}
  ): SelectQueryBuilder<Event> {
    const keywordLower = keyword.toLowerCase();
    
    queryBuilder
      .leftJoinAndSelect('event.category', 'eventCategory')
      .leftJoinAndSelect('eventCategory.category', 'category')
      .where(
        'LOWER(event.name) LIKE :keyword OR LOWER(event.description) LIKE :keyword OR LOWER(event.venue) LIKE :keyword OR LOWER(event.location) LIKE :keyword OR LOWER(event.country) LIKE :keyword',
        { keyword: `%${keywordLower}%` }
      );

    if (filters.startDate && filters.endDate) {
      this.applyDateRangeFilter(queryBuilder, filters.startDate, filters.endDate);
    }

    if (filters.location) {
      this.applyLocationFilter(queryBuilder, filters.location);
    }

    return queryBuilder;
  }

  /**
   * Build speaker search query
   */
  static buildSpeakerSearchQuery(
    queryBuilder: SelectQueryBuilder<any>,
    keyword: string,
    limit: number,
    offset: number
  ): SelectQueryBuilder<any> {
    const keywordLower = keyword.toLowerCase();
    
    return queryBuilder
      .leftJoinAndSelect('user.eventSpeakers', 'eventSpeaker')
      .leftJoinAndSelect('eventSpeaker.event', 'event')
      .leftJoinAndSelect('user.speakerProfile', 'speakerProfile')
      .where(
        'user.role = :role AND (LOWER(user.firstName) LIKE :keyword OR LOWER(user.lastName) LIKE :keyword OR LOWER(speakerProfile.companyName) LIKE :keyword OR LOWER(speakerProfile.position) LIKE :keyword)',
        { role: 'Speaker', keyword: `%${keywordLower}%` }
      )
      .limit(limit)
      .offset(offset);
  }

  /**
   * Build exhibitor search query
   */
  static buildExhibitorSearchQuery(
    queryBuilder: SelectQueryBuilder<any>,
    keyword: string,
    limit: number,
    offset: number
  ): SelectQueryBuilder<any> {
    const keywordLower = keyword.toLowerCase();
    
    return queryBuilder
      .leftJoinAndSelect('exhibitor.eventExhibitors', 'eventExhibitor')
      .leftJoinAndSelect('eventExhibitor.event', 'event')
      .where(
        'LOWER(exhibitor.companyName) LIKE :keyword OR LOWER(exhibitor.companyDescription) LIKE :keyword OR LOWER(exhibitor.email) LIKE :keyword',
        { keyword: `%${keywordLower}%` }
      )
      .limit(limit)
      .offset(offset);
  }

  /**
   * Build category search query
   */
  static buildCategorySearchQuery(
    queryBuilder: SelectQueryBuilder<any>,
    keyword: string,
    limit: number,
    offset: number
  ): SelectQueryBuilder<any> {
    const keywordLower = keyword.toLowerCase();
    
    return queryBuilder
      .leftJoinAndSelect('eventCategory.category', 'category')
      .leftJoinAndSelect('eventCategory.event', 'event')
      .where(
        'LOWER(category.name) LIKE :keyword OR LOWER(category.description) LIKE :keyword',
        { keyword: `%${keywordLower}%` }
      )
      .limit(limit)
      .offset(offset);
  }

  /**
   * Build survey search query
   */
  static buildSurveySearchQuery(
    queryBuilder: SelectQueryBuilder<any>,
    keyword: string,
    filters: {
      startDate?: string;
      endDate?: string;
    } = {},
    limit: number,
    offset: number
  ): SelectQueryBuilder<any> {
    const keywordLower = keyword.toLowerCase();
    
    queryBuilder
      .leftJoinAndSelect('survey.event', 'event')
      .leftJoinAndSelect('event.surveys', 'surveys')
      .where('LOWER(survey.title) LIKE :keyword', { keyword: `%${keywordLower}%` });

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'survey.startDate >= :startDate AND survey.endDate <= :endDate',
        { startDate: filters.startDate, endDate: filters.endDate }
      );
    }

    return queryBuilder.limit(limit).offset(offset);
  }
}
