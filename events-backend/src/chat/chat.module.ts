// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatQuestion, ChatLike, ChatResponse } from './chat.entity';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from './broadcast.service';
import { BroadcastRoom, BroadcastMessage, RoomParticipant } from './broadcast.entity';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';
import { Speaker } from 'speaker/speaker.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Q&A Entities
      ChatQuestion,
      ChatLike,
      ChatResponse,
      // Broadcast Entities
      BroadcastRoom,
      BroadcastMessage,
      RoomParticipant,
      // Common Entities
      UserEntity,
      Event,
      Speaker,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  controllers: [ChatController, BroadcastController],
  providers: [ChatService, BroadcastService, ErrorHandlerService],
  exports: [ChatService, BroadcastService],
})
export class ChatModule {} 