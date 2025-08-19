import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey, SurveySession, SurveyResponse } from '../survey/survey.entity';

@Injectable()
export class SurveyUtils {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(SurveySession)
    private surveySessionRepository: Repository<SurveySession>,
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
  ) {}

  async getSurveyDetailsByEventId(eventId: string, userId?: string): Promise<any> {
    try {
      console.log(`🔍 getSurveyDetailsByEventId called with eventId: ${eventId}, userId: ${userId}`);
      
      const survey = await this.surveyRepository.findOne({
        where: { eventId: eventId, isActive: true },
      });
      
      if (!survey) {
        console.log(`❌ No survey found for eventId: ${eventId}`);
        return null;
      }

      console.log(`✅ Survey found: ${survey.id} for event: ${eventId}`);

      const sessions = await this.surveySessionRepository.find({
        where: { surveyId: survey.id, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      console.log(`📝 Found ${sessions.length} sessions for survey: ${survey.id}`);

      // If userId is provided, check feedback status for each session
      let sessionsWithFeedbackStatus = sessions;
      if (userId) {
        console.log(`👤 Checking feedback status for userId: ${userId}`);
        
        // DEBUG: Let's also check all feedback responses in the system
        const allFeedbacks = await this.surveyResponseRepository.find();
        console.log(`🔍 Total feedback responses in system: ${allFeedbacks.length}`);
        console.log(`🔍 All feedbacks:`, allFeedbacks.map(f => ({ 
          id: f.id, 
          sessionId: f.sessionId, 
          userId: f.userId, 
          surveyId: f.surveyId,
          eventId: f.eventId 
        })));
        
        // Get all feedback responses for this user and survey
        const userFeedbacks = await this.surveyResponseRepository.find({
          where: { userId: userId, surveyId: survey.id },
        });


        // Create a map for quick lookup
        const feedbackMap = new Map();
        userFeedbacks.forEach(feedback => {
          feedbackMap.set(feedback.sessionId, true);
          console.log(`✅ Added feedback mapping: sessionId ${feedback.sessionId} = true`);
        });

        // Add isFeedback property to each session
        sessionsWithFeedbackStatus = sessions.map(session => {
          const hasFeedback = feedbackMap.has(session.id);
          console.log(`🎯 Session ${session.id} (${session.name}): isFeedback = ${hasFeedback}`);
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
}
