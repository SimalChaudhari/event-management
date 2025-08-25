
import { UserUtils } from '../user.utils';
import { ExhibitorUtils } from '../exhibitor.utils';
import { getEventColor } from 'utils/event-color.util';

export class GlobalSearchUtils {
  /**
   * Get matched fields for event search results
   */
  static getMatchedEventFields(event: any, keyword: string): string[] {
    const matchedFields: string[] = [];
    const keywordLower = keyword.toLowerCase();
    
    if (event.name && event.name.toLowerCase().includes(keywordLower)) {
      matchedFields.push('name');
    }
    if (event.description && event.description.toLowerCase().includes(keywordLower)) {
      matchedFields.push('description');
    }
    if (event.venue && event.venue.toLowerCase().includes(keywordLower)) {
      matchedFields.push('venue');
    }
    if (event.location && event.location.toLowerCase().includes(keywordLower)) {
      matchedFields.push('location');
    }
    if (event.country && event.country.toLowerCase().includes(keywordLower)) {
      matchedFields.push('country');
    }
    
    return matchedFields;
  }

  /**
   * Get matched fields for speaker search results
   */
  static getMatchedSpeakerFields(speaker: any, keyword: string): string[] {
    const matchedFields: string[] = [];
    const keywordLower = keyword.toLowerCase();
    
    if (speaker.firstName && speaker.firstName.toLowerCase().includes(keywordLower)) {
      matchedFields.push('firstName');
    }
    if (speaker.lastName && speaker.lastName.toLowerCase().includes(keywordLower)) {
      matchedFields.push('lastName');
    }
    if (speaker.speakerProfile?.companyName && speaker.speakerProfile.companyName.toLowerCase().includes(keywordLower)) {
      matchedFields.push('companyName');
    }
    if (speaker.speakerProfile?.position && speaker.speakerProfile.position.toLowerCase().includes(keywordLower)) {
      matchedFields.push('position');
    }
    
    return matchedFields;
  }

  /**
   * Get matched fields for exhibitor search results
   */
  static getMatchedExhibitorFields(exhibitor: any, keyword: string): string[] {
    const matchedFields: string[] = [];
    const keywordLower = keyword.toLowerCase();
    
    if (exhibitor.companyName && exhibitor.companyName.toLowerCase().includes(keywordLower)) {
      matchedFields.push('companyName');
    }
    if (exhibitor.companyDescription && exhibitor.companyDescription.toLowerCase().includes(keywordLower)) {
      matchedFields.push('companyDescription');
    }
    if (exhibitor.email && exhibitor.email.toLowerCase().includes(keywordLower)) {
      matchedFields.push('email');
    }
    
    return matchedFields;
  }

  /**
   * Get matched fields for category search results
   */
  static getMatchedCategoryFields(category: any, keyword: string): string[] {
    const matchedFields: string[] = [];
    const keywordLower = keyword.toLowerCase();
    
    if (category.name && category.name.toLowerCase().includes(keywordLower)) {
      matchedFields.push('name');
    }
    if (category.description && category.description.toLowerCase().includes(keywordLower)) {
      matchedFields.push('description');
    }
    
    return matchedFields;
  }

  /**
   * Get matched fields for survey search results
   */
  static getMatchedSurveyFields(survey: any, keyword: string): string[] {
    const matchedFields: string[] = [];
    const keywordLower = keyword.toLowerCase();
    
    if (survey.title && survey.title.toLowerCase().includes(keywordLower)) {
      matchedFields.push('title');
    }
    
    return matchedFields;
  }

  /**
   * Format event data for global search results
   */
  static formatEventForGlobalSearch(event: any, keyword: string) {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      startTime: event.startTime,
      endDate: event.endDate,
      endTime: event.endTime,
      location: event.location,
      venue: event.venue,
      type: event.type,
      price: event.price,
      currency: event.currency,
      images: event.images,
      color: getEventColor(event.type),
      matchedFields: this.getMatchedEventFields(event, keyword)
    };
  }

  /**
   * Format speaker data for global search results
   */
  static formatSpeakerForGlobalSearch(speaker: any, keyword: string) {
    return {
      id: speaker.id,
      firstName: speaker.firstName,
      lastName: speaker.lastName,
      email: speaker.email,
      position: speaker.speakerProfile?.position || '',
      companyName: speaker.speakerProfile?.companyName || '',
      profilePicture: speaker.profilePicture,
      matchedFields: this.getMatchedSpeakerFields(speaker, keyword),
      events: speaker.eventSpeakers?.map((es: any) => es.event ? {
        id: es.event.id,
        name: es.event.name,
        startDate: es.event.startDate,
        location: es.event.location
      } : null).filter(Boolean) || []
    };
  }

  /**
   * Format exhibitor data for global search results
   */
  static formatExhibitorForGlobalSearch(exhibitor: any, keyword: string) {
    return {
      ...ExhibitorUtils.getBasicExhibitorInfo(exhibitor),
      matchedFields: this.getMatchedExhibitorFields(exhibitor, keyword),
      events: exhibitor.eventExhibitors?.map((ee: any) => ee.event ? {
        id: ee.event.id,
        name: ee.event.name,
        startDate: ee.event.startDate,
        location: ee.event.location
      } : null).filter(Boolean) || []
    };
  }

  /**
   * Format category data for global search results
   */
  static formatCategoryForGlobalSearch(eventCategory: any, keyword: string) {
    if (!eventCategory.category || !eventCategory.event) {
      return null;
    }

    return {
      id: eventCategory.category.id,
      name: eventCategory.category.name,
      description: eventCategory.category.description,
      status: eventCategory.category.status,
      matchedFields: this.getMatchedCategoryFields(eventCategory.category, keyword),
      events: [{
        id: eventCategory.event.id,
        name: eventCategory.event.name,
        startDate: eventCategory.event.startDate,
        location: eventCategory.event.location
      }]
    };
  }

  /**
   * Format survey data for global search results
   */
  static formatSurveyForGlobalSearch(survey: any, keyword: string) {
    return {
      id: survey.id,
      title: survey.title,
      startDate: survey.startDate,
      startTime: survey.startTime,
      endDate: survey.endDate,
      endTime: survey.endTime,
      isActive: survey.isActive,
      matchedFields: this.getMatchedSurveyFields(survey, keyword),
      event: survey.event ? {
        id: survey.event.id,
        name: survey.event.name,
        startDate: survey.event.startDate,
        location: survey.event.location
      } : null
    };
  }

  /**
   * Build complete global search results
   */
  static buildGlobalSearchResults(
    events: any[],
    speakers: any[],
    exhibitors: any[],
    eventCategories: any[],
    surveys: any[],
    keyword: string
  ) {
    const results: any = {
      events: events.map(event => this.formatEventForGlobalSearch(event, keyword)),
      speakers: speakers.map(speaker => this.formatSpeakerForGlobalSearch(speaker, keyword)),
      exhibitors: exhibitors.map(exhibitor => this.formatExhibitorForGlobalSearch(exhibitor, keyword)),
      categories: eventCategories
        .map(eventCategory => this.formatCategoryForGlobalSearch(eventCategory, keyword))
        .filter(Boolean), // Remove null entries
      surveys: surveys.map(survey => this.formatSurveyForGlobalSearch(survey, keyword)),
      totalResults: 0
    };

    // Calculate total results
    results.totalResults = results.events.length + results.speakers.length + 
                         results.exhibitors.length + results.categories.length + results.surveys.length;

    return results;
  }

  /**
   * Get matched fields for general event search (used in getAllEvents)
   */
  static findMatchedFields(event: any, keyword: string): string[] {
    const matchedFields: string[] = [];
    const keywordLower = keyword.toLowerCase();

    const fieldsToCheck = [
      'name',
      'description',
      'venue',
      'location',
      'country',
      'type',
      'price',
      'currency',
      'latitude',
      'longitude',
    ];

    fieldsToCheck.forEach((field) => {
      if (
        event[field] &&
        event[field].toString().toLowerCase().includes(keywordLower)
      ) {
        matchedFields.push(field);
      }
    });

    return matchedFields;
  }

  /**
   * Get matched event fields for global search (alternative method)
   */
  static getMatchedEventFieldsForGlobal(event: any, keyword: string): any {
    const matchedFields: any = {};
    const keywordLower = keyword.toLowerCase();
    
    if (event.name && event.name.toLowerCase().includes(keywordLower)) {
      matchedFields.name = event.name;
    }
    if (event.description && event.description.toLowerCase().includes(keywordLower)) {
      matchedFields.description = event.description;
    }
    if (event.venue?.toLowerCase().includes(keywordLower)) {
      matchedFields.venue = event.venue;
    }
    if (event.location?.toLowerCase().includes(keywordLower)) {
      matchedFields.location = event.location;
    }
    
    return matchedFields;
  }

  /**
   * Validate global search parameters
   */
  static validateGlobalSearchParams(filters: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!filters.keyword) {
      errors.push('Keyword is required for global search');
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }

    if (filters.page && filters.page < 1) {
      errors.push('Page must be greater than 0');
    }

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        errors.push('Invalid date format');
      } else if (startDate > endDate) {
        errors.push('Start date must be before end date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate pagination offset
   */
  static calculatePaginationOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Sanitize search keyword
   */
  static sanitizeKeyword(keyword: string): string {
    if (!keyword) return '';
    
    // Remove special characters that could cause SQL injection
    // Keep alphanumeric, spaces, and common punctuation
    return keyword.replace(/[^\w\s\-.,!?]/g, '').trim();
  }

  /**
   * Build search highlight data
   */
  static buildSearchHighlights(entity: any, keyword: string, entityType: 'event' | 'speaker' | 'exhibitor' | 'category' | 'survey'): any {
    const keywordLower = keyword.toLowerCase();
    const highlights: any = {};

    switch (entityType) {
      case 'event':
        highlights.name = entity.name && entity.name.toLowerCase().includes(keywordLower);
        highlights.description = entity.description && entity.description.toLowerCase().includes(keywordLower);
        highlights.venue = entity.venue && entity.venue.toLowerCase().includes(keywordLower);
        highlights.location = entity.location && entity.location.toLowerCase().includes(keywordLower);
        highlights.country = entity.country && entity.country.toLowerCase().includes(keywordLower);
        break;

      case 'speaker':
        highlights.firstName = entity.firstName && entity.firstName.toLowerCase().includes(keywordLower);
        highlights.lastName = entity.lastName && entity.lastName.toLowerCase().includes(keywordLower);
        highlights.companyName = entity.speakerProfile?.companyName && entity.speakerProfile.companyName.toLowerCase().includes(keywordLower);
        highlights.position = entity.speakerProfile?.position && entity.speakerProfile.position.toLowerCase().includes(keywordLower);
        break;

      case 'exhibitor':
        highlights.companyName = entity.companyName && entity.companyName.toLowerCase().includes(keywordLower);
        highlights.companyDescription = entity.companyDescription && entity.companyDescription.toLowerCase().includes(keywordLower);
        highlights.email = entity.email && entity.email.toLowerCase().includes(keywordLower);
        break;

      case 'category':
        highlights.name = entity.name && entity.name.toLowerCase().includes(keywordLower);
        highlights.description = entity.description && entity.description.toLowerCase().includes(keywordLower);
        break;

      case 'survey':
        highlights.title = entity.title && entity.title.toLowerCase().includes(keywordLower);
        break;
    }

    return highlights;
  }
}
