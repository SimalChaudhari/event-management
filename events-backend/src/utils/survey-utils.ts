import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey, SurveySession, SurveyResponse } from '../survey/survey.entity';
import { Event } from '../event/event.entity';

@Injectable()
export class SurveyUtils {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(SurveySession)
    private surveySessionRepository: Repository<SurveySession>,
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async getSurveyDetailsByEventId(
    eventId: string,
    userId?: string,
  ): Promise<any> {
    try {
      const survey = await this.surveyRepository.findOne({
        where: { eventId: eventId, isActive: true },
      });

      if (!survey) {
        return null;
      }

      const sessions = await this.surveySessionRepository.find({
        where: { surveyId: survey.id, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      // If userId is provided, check feedback status for each session
      let sessionsWithFeedbackStatus = sessions;
      if (userId) {
        // Get all feedback responses for this user and survey
        const userFeedbacks = await this.surveyResponseRepository.find({
          where: { userId: userId, surveyId: survey.id },
        });

        // Create a map for quick lookup
        const feedbackMap = new Map();
        userFeedbacks.forEach((feedback) => {
          feedbackMap.set(feedback.sessionId, true);
        });

        // Add isFeedback property to each session
        sessionsWithFeedbackStatus = sessions.map((session) => {
          const hasFeedback = feedbackMap.has(session.id);

          return {
            ...session,
            isFeedback: hasFeedback,
          };
        });
      } else {
        console.log(`⚠️ No userId provided, skipping feedback check`);
      }

      return {
        ...survey,
        sessions: sessionsWithFeedbackStatus,
      };
    } catch (error) {
      console.error('❌ Error fetching survey details:', error);
      return null;
    }
  }

  // Separate function to get event information with readable format
  async getEventInfoByEventId(eventId: string): Promise<any> {
    try {
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        console.log(`❌ No event found for eventId: ${eventId}`);
        return null;
      }

      // Format event information for better readability
      return {
        ...event,
      };
    } catch (error) {
      console.error('❌ Error fetching event info:', error);
      return null;
    }
  }
}
