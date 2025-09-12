import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatNotificationService } from './chat-notification.service';
import { ChatThread, ChatMessage, ChatParticipant } from './chat.entity';
import { UserEntity } from '../user/users.entity';
import { PushNotification } from '../settings/setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatThread, ChatMessage, ChatParticipant, UserEntity, PushNotification]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatNotificationService],
  exports: [ChatService, ChatGateway, ChatNotificationService],
})
export class ChatModule {}