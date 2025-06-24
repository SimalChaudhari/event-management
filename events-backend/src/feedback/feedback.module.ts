import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from './feedback.entity';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
  ],
  providers: [FeedbackService],
  controllers: [FeedbackController],
})
export class FeedbackModule {}