// src/utils/utils.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorHandlerService } from './services/error-handler.service';
import { SurveyUtils } from './survey-utils';
import { Survey, SurveySession, SurveyResponse } from '../survey/survey.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveySession, SurveyResponse]),
  ],
  providers: [ErrorHandlerService, SurveyUtils],
  exports: [ErrorHandlerService, SurveyUtils],
})
export class UtilsModule {} 