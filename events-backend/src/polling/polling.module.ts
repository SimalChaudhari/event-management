// src/polling/polling.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollingService } from './polling.service';
import { PollingController } from './polling.controller';
import { Event } from '../event/event.entity';
import { UserEntity } from 'user/users.entity';
import { JwtModule } from '@nestjs/jwt';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { Speaker } from 'speaker/speaker.entity';
import { Poll, PollOption, PollVote, UserPollSession, UserPollVote } from './polling.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Poll, 
      PollOption, 
      PollVote, 
      UserPollSession,
      UserPollVote,
      Event, 
      Speaker, 
      UserEntity // Add this
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  controllers: [PollingController],
  providers: [PollingService, ErrorHandlerService],
  exports: [PollingService],
})
export class PollingModule {} 