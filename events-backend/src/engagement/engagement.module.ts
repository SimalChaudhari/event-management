import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { Engagement } from './engagement.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { EngagementQnaQuestion } from '../engagement-qna/engagement-qna.entity';
import { Poll } from '../polling/polling.entity';
import { JwtModule } from '@nestjs/jwt';
import { EngagementPollingLink } from './engagement-polling.entity';
import { ProgrammeSession } from '../programme/programme-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Engagement, ProgrammeTrack, ProgrammeSession, EngagementQnaQuestion, Poll, EngagementPollingLink]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}

