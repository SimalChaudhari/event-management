// src/polling/polling.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollingService } from './polling.service';
import { PollingController } from './polling.controller';
import { QuizQuestion, QuizOption, UserQuizAttempt, UserQuizAnswer } from './polling.entity';
import { Event } from '../event/event.entity';
import { UserEntity } from 'user/users.entity';
import { JwtModule } from '@nestjs/jwt';
import { ErrorHandlerService } from 'utils/services/error-handler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizQuestion, 
      QuizOption, 
      UserQuizAttempt, 
      UserQuizAnswer, 
      Event, 
      UserEntity
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  providers: [PollingService, ErrorHandlerService],
  controllers: [PollingController],
  exports: [PollingService],
})
export class PollingModule {} 