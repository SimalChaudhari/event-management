import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey, SurveySession } from '../survey/survey.entity';

@Injectable()
export class SurveyUtils {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(SurveySession)
    private surveySessionRepository: Repository<SurveySession>,
  ) {}

  async getSurveyDetailsByEventId(eventId: string): Promise<any> {
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
      
      return {
        ...survey,
        sessions: sessions,
      };
    } catch (error) {
      console.error('Error fetching survey details:', error);
      return null;
    }
  }
}
