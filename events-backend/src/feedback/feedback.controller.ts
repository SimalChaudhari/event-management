import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackDto } from './feedback.dto';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';

@Controller('api/feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  // Submit feedback
  @Post(':eventId')
  async create(@Param('eventId') eventId: string, @Body() dto: FeedbackDto) {
    dto.eventId = eventId;
    return this.feedbackService.createFeedback(dto);
  }

  // Get all feedbacks for an event
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async getAll(@Param('eventId') eventId: string) {
    const feedbacks = await this.feedbackService.getFeedbacksByEvent(eventId);

    // Remove eventId from the object
    const data = feedbacks.map((fb) => {
      // Destructure and exclude eventId
      const { eventId, ...rest } = fb;
      return rest;
    });

    return {
      success: true,
      message:
      data.length > 0
          ? 'Feedbacks fetched successfully'
          : 'No feedback found for this event',
      total: data.length,
      data: data,
    };
  }
}
