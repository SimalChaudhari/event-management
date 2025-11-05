import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EngagementQnaController } from './engagement-qna.controller';
import { EngagementQnaService } from './engagement-qna.service';
import { EngagementQnaGateway } from './engagement-qna.gateway';
import { EngagementQnaQuestion, EngagementQnaLike, EngagementQnaShareLink, EngagementQnaQuestionShareLink, EngagementQnaTrackShareLink } from './engagement-qna.entity';
import { Engagement } from '../engagement/engagement.entity';
import { UserEntity } from '../user/users.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { ProgrammeSession } from '../programme/programme-session.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { EngagementModule } from '../engagement/engagement.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [
        TypeOrmModule.forFeature([
          EngagementQnaQuestion,
          EngagementQnaLike,
          EngagementQnaShareLink,
          EngagementQnaQuestionShareLink,
          EngagementQnaTrackShareLink,
          Engagement,
          UserEntity,
          RegisterEvent,
          ProgrammeSession,
          ProgrammeTrack,
        ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
    forwardRef(() => EngagementModule),
    UtilsModule,
  ],
  controllers: [EngagementQnaController],
  providers: [EngagementQnaService, EngagementQnaGateway, ErrorHandlerService],
  exports: [EngagementQnaService, EngagementQnaGateway],
})
export class EngagementQnaModule {}

