import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { FeedbackDto } from './feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepo: Repository<Feedback>,
  ) {}

  // Create new feedback
  async createFeedback(dto: FeedbackDto) {
    try {
      if (!dto.name || !dto.feedback || !dto.title) {
        throw new BadRequestException('Missing required fields');
      }
      const feedback = this.feedbackRepo.create(dto);
      return await this.feedbackRepo.save(feedback);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Unable to save feedback');
    }
  }

  // Get all feedbacks for an event
  async getFeedbacksByEvent(eventId: string) {
    return this.feedbackRepo.find({
      where: { eventId },
      relations: ['event'], // It is necessary!
    });
  }
}