// src/survey/survey.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { Survey, SurveyResponse, SurveySession } from './survey.entity';
import { SurveyQuestion, SurveyAnswer } from './qa.entity';
import { Event } from '../event/event.entity';
import { UserEntity } from 'user/users.entity';
import { JwtModule } from '@nestjs/jwt';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { SurveyUtils } from '../utils/survey-utils';
import { QAModule } from './qa.module';
import { FilterModule } from '../service/filter.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveyResponse, SurveySession, SurveyQuestion, SurveyAnswer, Event, UserEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
    QAModule,
    FilterModule, // Import FilterModule for pagination
  ],
  providers: [SurveyService, ErrorHandlerService, SurveyUtils],
  controllers: [SurveyController],
  exports: [SurveyService], // Export for use in other modules
})
export class SurveyModule {}