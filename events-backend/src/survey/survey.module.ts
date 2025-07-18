// src/survey/survey.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { Survey, SurveyResponse, SurveySession } from './survey.entity';
import { Event } from '../event/event.entity';
import { UserEntity } from 'user/users.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveyResponse, Event, UserEntity, SurveySession]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
  ],
  providers: [SurveyService],
  controllers: [SurveyController],
  exports: [SurveyService], // Export for use in other modules
})
export class SurveyModule {}