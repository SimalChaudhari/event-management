// src/utils/utils.module.ts
import { Module } from '@nestjs/common';
import { ErrorHandlerService } from './services/error-handler.service';
import { SurveyUtilityService } from './services/survey-utility.service';
import { SurveyModule } from '../survey/survey.module';

@Module({
  imports: [SurveyModule], // Import Survey Module
  providers: [ErrorHandlerService, SurveyUtilityService],
  exports: [ErrorHandlerService, SurveyUtilityService], // Export for other modules
})
export class UtilsModule {} 