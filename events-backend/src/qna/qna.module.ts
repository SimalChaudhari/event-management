// src/qna/qna.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';
import { QnaQuestion, QnaLike } from './qna.entity';
import { Event } from 'event/event.entity';
import { UserEntity } from '../user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QnaQuestion,
      QnaLike,
      Event,
      UserEntity,
    ]),
    JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: {},
      }),
    ],

  controllers: [QnaController],
  providers: [QnaService, ErrorHandlerService],
  exports: [QnaService],
})
export class QnaModule {} 