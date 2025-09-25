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
import { QnaUtils } from './qna.utils';
import { Survey, SurveySession, SurveyResponse } from '../survey/survey.entity';
import { Event } from '../event/event.entity';
import { QnaQuestion, QnaLike } from '../qna/qna.entity';
import { UserEntity } from '../user/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveySession, SurveyResponse, Event, QnaQuestion, QnaLike, UserEntity]),
  ],
  providers: [ErrorHandlerService, SurveyUtils, EmailUtils, EventValidationUtils, EventQueryBuilderUtils, GlobalSearchUtils, FileUploadUtils, AgendaUtils, QnaUtils],
  exports: [ErrorHandlerService, SurveyUtils, EmailUtils, EventValidationUtils, EventQueryBuilderUtils, GlobalSearchUtils, FileUploadUtils, AgendaUtils, QnaUtils],
})
export class UtilsModule {} 