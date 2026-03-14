import { Injectable } from '@nestjs/common';
import { toDisplayPrice } from './price.util';

function coercePrices(event: any): any {
  if (!event) return event;
  const out: any = { ...event };
  if (event.price !== undefined) out.price = toDisplayPrice(event.price);
  if (event.earlyBirdPrice !== undefined) out.earlyBirdPrice = toDisplayPrice(event.earlyBirdPrice);
  return out;
}

@Injectable()
export class TabVisibilityFilterUtil {
  
  /**
   * Filters event data based on tab visibility settings for non-admin users
   * @param event - The event object to filter
   * @param userRole - The user's role (admin, user, etc.)
   * @returns Filtered event object
   */
  static filterEventDataByTabVisibility(event: any, userRole?: string): any {
    // Admin users always get full data; set allowAttendeeSearch from tab visibility or default true
    if (userRole === 'admin') {
      const allowAttendeeSearch =
        event?.tabVisibility == null
          ? true
          : (event.tabVisibility.chat !== false || event.tabVisibility.agenda !== false);
      return coercePrices({ ...event, allowAttendeeSearch });
    }

    // If no tab visibility settings, return original event (default: allow attendee search)
    if (!event?.tabVisibility) {
      return coercePrices({ ...event, allowAttendeeSearch: true });
    }

    console.log('🔍 Filtering event data:', {
      eventId: event.id,
      eventName: event.eventName,
      tabVisibility: event.tabVisibility,
      originalGalleries: event.galleries?.length || 0,
      originalSurveys: event.surveys?.length || 0,
      originalExhibitors: event.exhibitors?.length || 0,
      originalCategories: event.categories?.length || 0,
      originalProgrammeTracks: event.programmeTracks?.length || 0
    });

    const filteredEvent = coercePrices({ ...event });
    
    // Remove galleries if gallery tab is disabled
    if (event.tabVisibility.gallery === false) {
      console.log('🚫 Removing galleries for event:', event.id);
      filteredEvent.galleries = [];
    }
    
    // Remove surveys if survey tab is disabled
    if (event.tabVisibility.survey === false) {
      console.log('🚫 Removing surveys for event:', event.id);
      filteredEvent.surveys = [];
      filteredEvent.surveyDetails = null;
    }
    
    // Remove exhibitors if exhibitors tab is disabled
    if (event.tabVisibility.exhibitors === false) {
      console.log('🚫 Removing exhibitors for event:', event.id);
      filteredEvent.exhibitors = [];
      filteredEvent.eventExhibitors = [];
      filteredEvent.exhibitorsData = {
        exhibitorDescription: '',
        exhibitors: [],
      };
    }
    
    // Remove speakers if speakers tab is disabled
    if (event.tabVisibility.speakers === false) {
      console.log('🚫 Removing speakers for event:', event.id);
      filteredEvent.speakers = [];
      filteredEvent.eventSpeakers = [];
      filteredEvent.speakersData = [];
    }
    
    
    // Remove floor plan if floorplan tab is disabled
    if (event.tabVisibility.floorplan === false) {
      console.log('🚫 Removing floor plan for event:', event.id);
      filteredEvent.floorPlan = null;
    }
    
    // Remove event stamps if stamps tab is disabled
    if (event.tabVisibility.stamps === false) {
      console.log('🚫 Removing stamps for event:', event.id);
      // Handle both new structure { description, stamps: [...] } and old structure (array)
      if (Array.isArray(filteredEvent.eventStamps)) {
        filteredEvent.eventStamps = [];
      } else if (filteredEvent.eventStamps && typeof filteredEvent.eventStamps === 'object') {
        filteredEvent.eventStamps = { description: '', stamps: [] };
      }
    }

    // Remove documents if documents tab is disabled
    if (event.tabVisibility.documents === false) {
      console.log('🚫 Removing documents for event:', event.id);
      filteredEvent.documents = [];
      filteredEvent.documentNames = [];
    }
    
    // Remove agenda if agenda tab is disabled
    if (event.tabVisibility.agenda === false) {
      console.log('🚫 Removing agenda for event:', event.id);
      filteredEvent.myAgendas = [];
    }
    
    // Remove admin info if adminInfo tab is disabled
    if (event.tabVisibility.adminInfo === false) {
      console.log('🚫 Removing admin info for event:', event.id);
      filteredEvent.adminInfo = null;
      filteredEvent.isCreatedByAdmin = false;
    }
    
    // Remove programme if programme tab is disabled
    if (event.tabVisibility.programme === false) {
      console.log('🚫 Removing programme for event:', event.id);
      filteredEvent.programmeTracks = [];
    }

    // Remove engagement data if engagement tab is disabled
    if (event.tabVisibility.engagement === false) {
      console.log('🚫 Removing engagement data for event:', event.id);
      filteredEvent.programmeTracks = [];
    }

    // Remove categories if categories tab is disabled
    if (event.tabVisibility.categories === false) {
      console.log('🚫 Removing categories for event:', event.id);
      filteredEvent.categories = [];
      filteredEvent.categoriesData = [];
    }

    // Remove chatroom if chat tab is disabled
    if (event.tabVisibility.chat === false) {
      console.log('🚫 Removing chat for event:', event.id);
      filteredEvent.chatroom = null;
    }

    // Allow attendee search in global search only when at least one of Chat or Agenda is enabled
    filteredEvent.allowAttendeeSearch =
      event.tabVisibility.chat !== false || event.tabVisibility.agenda !== false;
    
    console.log('✅ Filtered event data:', {
      eventId: filteredEvent.id,
      filteredGalleries: filteredEvent.galleries?.length || 0,
      filteredSurveys: filteredEvent.surveys?.length || 0,
      filteredExhibitors: filteredEvent.exhibitors?.length || 0,
      filteredCategories: filteredEvent.categories?.length || 0
    });
    
    return filteredEvent;
  }

  /**
   * Filters an array of events based on tab visibility settings
   * @param events - Array of events to filter
   * @param userRole - The user's role (admin, user, etc.)
   * @returns Array of filtered events
   */
  static filterEventsArrayByTabVisibility(events: any[], userRole?: string): any[] {
    if (!events || events.length === 0) {
      return events;
    }

    console.log('🔍 Filtering events array:', {
      userRole,
      isAdmin: userRole === 'admin',
      totalEvents: events.length,
      firstEventTabVisibility: events[0]?.tabVisibility
    });

    if (userRole === 'admin') {
      console.log('✅ Admin user - skipping tab visibility filtering');
      return events;
    }

    console.log('🚫 Applying tab visibility filtering for non-admin user');
    return events.map(event => {
      if (event?.tabVisibility) {
        return this.filterEventDataByTabVisibility(event, userRole);
      }
      return event;
    });
  }

  /**
   * Filters event result object (with events array and metadata) based on tab visibility
   * @param result - Result object containing events array and metadata
   * @param userRole - The user's role (admin, user, etc.)
   * @returns Filtered result object
   */
  static filterEventResultByTabVisibility(result: any, userRole?: string): any {
    if (!result) {
      return result;
    }

    // If result has events array, filter it
    if (result.events && Array.isArray(result.events)) {
      return {
        ...result,
        events: this.filterEventsArrayByTabVisibility(result.events, userRole)
      };
    }

    // If result is a single event, filter it
    if (result.id) {
      return this.filterEventDataByTabVisibility(result, userRole);
    }

    return result;
  }
}
