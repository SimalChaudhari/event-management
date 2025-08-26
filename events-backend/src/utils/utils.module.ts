// src/utils/utils.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorHandlerService } from './services/error-handler.service';
import { SurveyUtils } from './survey-utils';
import { EmailUtils } from './email.utils';
import { EventValidationUtils } from './validateEvents';
import { EventQueryBuilderUtils, GlobalSearchUtils } from './searchEvent';
import { FileUploadUtils } from './filesUploadFormat/file-upload.utils';
import { AgendaUtils } from './agenda.utils';
import { Survey, SurveySession, SurveyResponse } from '../survey/survey.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveySession, SurveyResponse]),
  ],
  providers: [ErrorHandlerService, SurveyUtils, EmailUtils, EventValidationUtils, EventQueryBuilderUtils, GlobalSearchUtils, FileUploadUtils, AgendaUtils],
  exports: [ErrorHandlerService, SurveyUtils, EmailUtils, EventValidationUtils, EventQueryBuilderUtils, GlobalSearchUtils, FileUploadUtils, AgendaUtils],
})
export class UtilsModule {} 