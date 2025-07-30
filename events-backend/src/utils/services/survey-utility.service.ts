// src/utils/services/survey-utility.service.ts
import { Injectable } from '@nestjs/common';
import { SurveyService } from '../../survey/survey.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable()
export class SurveyUtilityService {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  /**
   * Get survey details for an event with error handling
   * @param eventId - Event ID
   * @param userRole - User role (admin/user)
   * @param userId - Optional user ID for feedback status
   * @returns Survey details or null if no survey exists
   */
  async getEventSurveyDetails(
    eventId: string,
    userRole: string,
    userId?: string,
  ) {
    try {
      // Direct call to Survey Service method
      const surveyDetails = await this.surveyService.getSurveyDetailByEventId(
        eventId,
        userRole,
        userId,
      );

      return surveyDetails;
    } catch (error: any) {
      // If no survey found, return null (not an error for event)
      if (error.message?.includes('Survey not found')) {
        return null;
      }
      this.errorHandler.logError(error, 'Get event survey details', eventId);
      return null;
    }
  }

  /**
   * Get survey summary for list views
   * @param surveyDetails - Full survey details
   * @returns Compact survey summary
   */
  getSurveySummary(surveyDetails: any) {
    if (!surveyDetails) return null;

    return {
      surveyId: surveyDetails.id,
      surveyTitle: surveyDetails.title,
      totalSessions: Array.isArray(surveyDetails.sessions)
        ? surveyDetails.sessions.length
        : surveyDetails.sessions ? 1 : 0,
      hasActiveSessions: !!surveyDetails.sessions,
      isActive: surveyDetails.isActive,
    };
  }

  /**
   * Get multiple events' survey details efficiently
   * @param eventIds - Array of event IDs
   * @param userRole - User role
   * @param userId - Optional user ID
   * @returns Map of eventId -> survey details
   */
  async getBulkEventSurveyDetails(
    eventIds: string[],
    userRole: string,
    userId?: string,
  ): Promise<Map<string, any>> {
    const surveyMap = new Map<string, any>();

    // Process in parallel for better performance
    const surveyPromises = eventIds.map(async (eventId) => {
      const surveyDetails = await this.getEventSurveyDetails(
        eventId,
        userRole,
        userId,
      );
      return { eventId, surveyDetails };
    });

    const results = await Promise.all(surveyPromises);

    results.forEach(({ eventId, surveyDetails }) => {
      surveyMap.set(eventId, surveyDetails);
    });

    return surveyMap;
  }

  /**
   * Check if event has active survey
   * @param eventId - Event ID
   * @returns boolean
   */
  async hasActiveSurvey(eventId: string): Promise<boolean> {
    try {
      const surveyDetails = await this.surveyService.getSurveyDetailByEventId(
        eventId,
        'admin', // Use admin to get all details
      );
      return surveyDetails?.isActive || false;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Get survey session count for an event
   * @param eventId - Event ID
   * @returns Number of sessions
   */
  async getEventSessionCount(eventId: string): Promise<number> {
    try {
      const surveyDetails = await this.surveyService.getSurveyDetailByEventId(
        eventId,
        'admin',
      );
      
      if (!surveyDetails?.sessions) return 0;
      
      return Array.isArray(surveyDetails.sessions)
        ? surveyDetails.sessions.length
        : 1;
    } catch (error: any) {
      return 0;
    }
  }
} 