// src/modules/qa.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { QAController, QAAnswerController } from './qa.controller';
import { QAService } from './qa.service';
import { SurveyQuestion, SurveyAnswer } from './qa.entity';
import { Survey, SurveySession } from './survey.entity';
import { Event } from '../event/event.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SurveyQuestion, SurveyAnswer, Survey, SurveySession, Event]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { },
    }),
  ],
  controllers: [QAController, QAAnswerController],
  providers: [QAService, ErrorHandlerService],
  exports: [QAService],
})
export class QAModule {}
