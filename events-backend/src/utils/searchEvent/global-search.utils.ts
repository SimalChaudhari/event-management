
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
      speakingStartTime: speaker.speakingStartTime,
      speakingEndTime: speaker.speakingEndTime,
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
   * Performs global search across all event fields and returns only matched data sections
   */
  static performGlobalSearch(event: any, options: { keyword: string; caseSensitive?: boolean }): {
    hasMatch: boolean;
    matchedEvent: any;
    matchedFields: string[];
  } {
    const { keyword, caseSensitive = false } = options;
    const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
    const matchedFields: string[] = [];
    let hasMatch = false;

    // Create an object to store only matched data sections
    const matchedEvent: any = {};

    // Search in basic event fields
    const basicFields = [
      'name', 'description', 'startDate', 'endDate', 'startTime', 'endTime',
      'location', 'venue', 'country', 'type', 'price', 'currency',
      'latitude', 'longitude', 'floorPlan'
    ];

    let hasBasicFieldMatch = false;
    basicFields.forEach(field => {
      if (event[field] && this.isFieldMatch(event[field], searchKeyword, caseSensitive)) {
        matchedFields.push(field);
        hasBasicFieldMatch = true;
        hasMatch = true;
      }
    });

    // If basic fields match, add complete event basic info
    if (hasBasicFieldMatch) {
      matchedEvent.id = event.id;
      matchedEvent.name = event.name;
      matchedEvent.description = event.description;
      matchedEvent.startDate = event.startDate;
      matchedEvent.startTime = event.startTime;
      matchedEvent.endDate = event.endDate;
      matchedEvent.endTime = event.endTime;
      matchedEvent.location = event.location;
      matchedEvent.venue = event.venue;
      matchedEvent.latitude = event.latitude;
      matchedEvent.longitude = event.longitude;
      matchedEvent.country = event.country;
      matchedEvent.images = event.images;
      matchedEvent.type = event.type;
      matchedEvent.price = event.price;
      matchedEvent.currency = event.currency;
      matchedEvent.floorPlan = event.floorPlan;
      matchedEvent.createdAt = event.createdAt;
      matchedEvent.updatedAt = event.updatedAt;
      matchedEvent.enableLuckyDrawFeature = event.enableLuckyDrawFeature;
      matchedEvent.enableTableSeating = event.enableTableSeating;
      matchedEvent.color = event.color;

      // Highlight matching fields
      basicFields.forEach(field => {
        if (event[field] && this.isFieldMatch(event[field], searchKeyword, caseSensitive)) {
          matchedEvent[field] = this.highlightMatch(event[field], keyword, caseSensitive);
        }
      });
    }

    // Search in speakers data
    if (event.speakersData && Array.isArray(event.speakersData)) {
      const matchedSpeakers: any[] = [];
      event.speakersData.forEach((speaker: any, index: number) => {
        const speakerFields = ['name', 'email', 'position', 'companyName', 'description', 'location', 'speakingStartTime', 'speakingEndTime'];
        let speakerHasMatch = false;
        
        speakerFields.forEach(field => {
          if (speaker[field] && this.isFieldMatch(speaker[field], searchKeyword, caseSensitive)) {
            matchedFields.push(`speakersData[${index}].${field}`);
            speakerHasMatch = true;
          }
        });
        
        if (speakerHasMatch) {
          // Add complete speaker data with highlighted matching fields
          const matchedSpeaker = { ...speaker };
          speakerFields.forEach(field => {
            if (speaker[field] && this.isFieldMatch(speaker[field], searchKeyword, caseSensitive)) {
              matchedSpeaker[field] = this.highlightMatch(speaker[field], keyword, caseSensitive);
            }
          });
          matchedSpeakers.push(matchedSpeaker);
          hasMatch = true;
        }
      });
      
      if (matchedSpeakers.length > 0) {
        matchedEvent.speakersData = matchedSpeakers;
      }
    }

    // Search in categories data
    if (event.categoriesData && Array.isArray(event.categoriesData)) {
      const matchedCategories: any[] = [];
      event.categoriesData.forEach((category: any, index: number) => {
        const categoryFields = ['name', 'description'];
        let categoryHasMatch = false;
        
        categoryFields.forEach(field => {
          if (category[field] && this.isFieldMatch(category[field], searchKeyword, caseSensitive)) {
            matchedFields.push(`categoriesData[${index}].${field}`);
            categoryHasMatch = true;
          }
        });
        
        if (categoryHasMatch) {
          // Add complete category data with highlighted matching fields
          const matchedCategory = { ...category };
          categoryFields.forEach(field => {
            if (category[field] && this.isFieldMatch(category[field], searchKeyword, caseSensitive)) {
              matchedCategory[field] = this.highlightMatch(category[field], keyword, caseSensitive);
            }
          });
          matchedCategories.push(matchedCategory);
          hasMatch = true;
        }
      });
      
      if (matchedCategories.length > 0) {
        matchedEvent.categoriesData = matchedCategories;
      }
    }

    // Search in exhibitors data
    if (event.exhibitorsData) {
      const matchedExhibitors: any = {};
      
      if (event.exhibitorsData.exhibitorDescription && this.isFieldMatch(event.exhibitorsData.exhibitorDescription, searchKeyword, caseSensitive)) {
        matchedExhibitors.exhibitorDescription = this.highlightMatch(event.exhibitorsData.exhibitorDescription, keyword, caseSensitive);
        matchedFields.push('exhibitorsData.exhibitorDescription');
        hasMatch = true;
      }

      if (event.exhibitorsData.exhibitors && Array.isArray(event.exhibitorsData.exhibitors)) {
        const matchedExhibitorList: any[] = [];
        event.exhibitorsData.exhibitors.forEach((exhibitor: any, index: number) => {
          const exhibitorFields = ['companyName', 'companyDescription', 'email', 'mobile', 'uen', 'bothNumber'];
          let exhibitorHasMatch = false;
          
          exhibitorFields.forEach(field => {
            if (exhibitor[field] && this.isFieldMatch(exhibitor[field], searchKeyword, caseSensitive)) {
              matchedFields.push(`exhibitorsData.exhibitors[${index}].${field}`);
              exhibitorHasMatch = true;
            }
          });
          
          if (exhibitorHasMatch) {
            // Add complete exhibitor data with highlighted matching fields
            const matchedExhibitor = { ...exhibitor };
            exhibitorFields.forEach(field => {
              if (exhibitor[field] && this.isFieldMatch(exhibitor[field], searchKeyword, caseSensitive)) {
                matchedExhibitor[field] = this.highlightMatch(exhibitor[field], keyword, caseSensitive);
              }
            });
            matchedExhibitorList.push(matchedExhibitor);
            hasMatch = true;
          }
        });
        
        if (matchedExhibitorList.length > 0) {
          matchedExhibitors.exhibitors = matchedExhibitorList;
        }
      }
      
      if (Object.keys(matchedExhibitors).length > 0) {
        matchedEvent.exhibitorsData = matchedExhibitors;
      }
    }

    // Search in survey data
    if (event.surveyDetails) {
      const matchedSurvey: any = {};
      
      if (event.surveyDetails.title && this.isFieldMatch(event.surveyDetails.title, searchKeyword, caseSensitive)) {
        matchedSurvey.title = this.highlightMatch(event.surveyDetails.title, keyword, caseSensitive);
        matchedFields.push('surveyDetails.title');
        hasMatch = true;
      }

      if (event.surveyDetails.sessions && Array.isArray(event.surveyDetails.sessions)) {
        const matchedSessions: any[] = [];
        event.surveyDetails.sessions.forEach((session: any, index: number) => {
          const sessionFields = ['name', 'description'];
          let sessionHasMatch = false;
          
          sessionFields.forEach(field => {
            if (session[field] && this.isFieldMatch(session[field], searchKeyword, caseSensitive)) {
              matchedFields.push(`surveyDetails.sessions[${index}].${field}`);
              sessionHasMatch = true;
            }
          });
          
          if (sessionHasMatch) {
            // Add complete session data with highlighted matching fields
            const matchedSession = { ...session };
            sessionFields.forEach(field => {
              if (session[field] && this.isFieldMatch(session[field], searchKeyword, caseSensitive)) {
                matchedSession[field] = this.highlightMatch(session[field], keyword, caseSensitive);
              }
            });
            matchedSessions.push(matchedSession);
            hasMatch = true;
          }
        });
        
        if (matchedSessions.length > 0) {
          matchedSurvey.sessions = matchedSessions;
        }
      }
      
      if (Object.keys(matchedSurvey).length > 0) {
        // Add complete survey data with highlighted matching fields
        matchedSurvey.id = event.surveyDetails.id;
        matchedSurvey.eventId = event.surveyDetails.eventId;
        matchedSurvey.startDate = event.surveyDetails.startDate;
        matchedSurvey.startTime = event.surveyDetails.startTime;
        matchedSurvey.endDate = event.surveyDetails.endDate;
        matchedSurvey.endTime = event.surveyDetails.endTime;
        matchedSurvey.isActive = event.surveyDetails.isActive;
        matchedSurvey.createdAt = event.surveyDetails.createdAt;
        matchedSurvey.updatedAt = event.surveyDetails.updatedAt;
        matchedEvent.surveyDetails = matchedSurvey;
      }
    }

    // Search in documents
    if (event.documents && Array.isArray(event.documents)) {
      const matchedDocuments: any[] = [];
      event.documents.forEach((doc: any, index: number) => {
        if (doc.name && this.isFieldMatch(doc.name, searchKeyword, caseSensitive)) {
          matchedDocuments.push({
            name: this.highlightMatch(doc.name, keyword, caseSensitive),
            document: doc.document
          });
          matchedFields.push(`documents[${index}].name`);
          hasMatch = true;
        }
      });
      
      if (matchedDocuments.length > 0) {
        matchedEvent.documents = matchedDocuments;
      }
    }

    // Search in event stamps
    if (event.eventStamps) {
      if (event.eventStamps.description && this.isFieldMatch(event.eventStamps.description, searchKeyword, caseSensitive)) {
        matchedEvent.eventStamps = {
          description: this.highlightMatch(event.eventStamps.description, keyword, caseSensitive),
          images: event.eventStamps.images
        };
        matchedFields.push('eventStamps.description');
        hasMatch = true;
      }
    }

    // Search in galleries
    if (event.galleries && Array.isArray(event.galleries)) {
      const matchedGalleries: any[] = [];
      event.galleries.forEach((gallery: any, index: number) => {
        if (gallery.title && this.isFieldMatch(gallery.title, searchKeyword, caseSensitive)) {
          // Add complete gallery data with highlighted matching fields
          const matchedGallery = { ...gallery };
          matchedGallery.title = this.highlightMatch(gallery.title, keyword, caseSensitive);
          matchedGalleries.push(matchedGallery);
          matchedFields.push(`galleries[${index}].title`);
          hasMatch = true;
        }
      });
      
      if (matchedGalleries.length > 0) {
        matchedEvent.galleries = matchedGalleries;
      }
    }

    // Search in programme tracks
    if (event.programmeTracks && Array.isArray(event.programmeTracks)) {
      const matchedProgrammeTracks: any[] = [];
      event.programmeTracks.forEach((track: any, trackIndex: number) => {
        const trackFields = ['title', 'description'];
        let trackHasMatch = false;
        
        trackFields.forEach(field => {
          if (track[field] && this.isFieldMatch(track[field], searchKeyword, caseSensitive)) {
            matchedFields.push(`programmeTracks[${trackIndex}].${field}`);
            trackHasMatch = true;
          }
        });
        
        if (trackHasMatch) {
          // Add complete track data with highlighted matching fields
          const matchedTrack = { ...track };
          trackFields.forEach(field => {
            if (track[field] && this.isFieldMatch(track[field], searchKeyword, caseSensitive)) {
              matchedTrack[field] = this.highlightMatch(track[field], keyword, caseSensitive);
            }
          });
          
          // Search in track sessions
          if (track.sessions && Array.isArray(track.sessions)) {
            const matchedSessions: any[] = [];
            track.sessions.forEach((session: any, sessionIndex: number) => {
              const sessionFields = ['title', 'description', 'venue', 'startTime', 'endTime'];
              let sessionHasMatch = false;
              
              sessionFields.forEach(field => {
                if (session[field] && this.isFieldMatch(session[field], searchKeyword, caseSensitive)) {
                  matchedFields.push(`programmeTracks[${trackIndex}].sessions[${sessionIndex}].${field}`);
                  sessionHasMatch = true;
                }
              });
              
              if (sessionHasMatch) {
                // Add complete session data with highlighted matching fields
                const matchedSession = { ...session };
                sessionFields.forEach(field => {
                  if (session[field] && this.isFieldMatch(session[field], searchKeyword, caseSensitive)) {
                    matchedSession[field] = this.highlightMatch(session[field], keyword, caseSensitive);
                  }
                });
                matchedSessions.push(matchedSession);
                hasMatch = true;
              }
            });
            
            if (matchedSessions.length > 0) {
              matchedTrack.sessions = matchedSessions;
            }
          }
          
          matchedProgrammeTracks.push(matchedTrack);
          hasMatch = true;
        }
      });
      
      if (matchedProgrammeTracks.length > 0) {
        matchedEvent.programmeTracks = matchedProgrammeTracks;
      }
    }

    return {
      hasMatch,
      matchedEvent,
      matchedFields
    };
  }

  /**
   * Check if a field value matches the search keyword
   */
  private static isFieldMatch(value: any, keyword: string, caseSensitive: boolean): boolean {
    if (!value) return false;
    
    const fieldValue = caseSensitive ? value.toString() : value.toString().toLowerCase();
    const searchTerm = caseSensitive ? keyword : keyword.toLowerCase();
    
    return fieldValue.includes(searchTerm);
  }

  /**
   * Highlight the matching text in the field value
   */
  private static highlightMatch(value: any, keyword: string, caseSensitive: boolean): string {
    if (!value) return value;
    
    const fieldValue = value.toString();
    const searchTerm = caseSensitive ? keyword : keyword.toLowerCase();
    const fieldValueLower = caseSensitive ? fieldValue : fieldValue.toLowerCase();
    
    const index = fieldValueLower.indexOf(searchTerm);
    if (index === -1) return fieldValue;
    
    const before = fieldValue.substring(0, index);
    const match = fieldValue.substring(index, index + keyword.length);
    const after = fieldValue.substring(index + keyword.length);
    
    // Return highlighted text with HTML-like tags for frontend processing
    return `${before}<mark>${match}</mark>${after}`;
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
        highlights.speakingStartTime = entity.speakingStartTime && entity.speakingStartTime.toLowerCase().includes(keywordLower);
        highlights.speakingEndTime = entity.speakingEndTime && entity.speakingEndTime.toLowerCase().includes(keywordLower);
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
