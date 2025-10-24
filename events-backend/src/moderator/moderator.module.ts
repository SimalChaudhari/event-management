import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ModeratorController } from './moderator.controller';
import { ModeratorService } from './moderator.service';
import { Moderator } from './moderator.entity';
import { ModeratorEvent } from './moderator-event.entity';
import { Event } from '../event/event.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { ProgrammeSession } from '../programme/programme-session.entity';
import { EmailService } from '../service/email.service';
import { UserEntity } from '../user/users.entity';
import { EngagementQnaQuestion } from '../engagement-qna/engagement-qna.entity';
import { Engagement } from '../engagement/engagement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Moderator,
      ModeratorEvent,
      Event,
      ProgrammeTrack,
      ProgrammeSession,
      UserEntity,
      EngagementQnaQuestion,
      Engagement,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  controllers: [ModeratorController],
  providers: [ModeratorService, EmailService],
  exports: [ModeratorService],
})
export class ModeratorModule {}

