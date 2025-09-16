import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { EventAgenda } from './agenda.entity';
import { AgendaCategory } from './agenda-category.entity';
import { Event } from '../event/event.entity';
import { UtilsModule } from '../utils/utils.module';
import { JwtModule } from '@nestjs/jwt';
import { UserEntity } from 'user/users.entity';
import { EmailService } from 'service/email.service';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { NotificationGateway } from '../settings/notification.gateway';
import { NotificationUtil } from '../utils/notification.util';
import { EventNotification, EventNotificationRead } from '../settings/event-notification.entity';
import { PushNotification, UserPermissions, PermissionTemplate } from '../settings/setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventAgenda,
      AgendaCategory,
      UserEntity,
      Event,
      RegisterEvent,
      EventNotification,
      EventNotificationRead,
      PushNotification,
      UserPermissions,
      PermissionTemplate,
    ]),
    UtilsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
  ],
  providers: [AgendaService, EmailService, NotificationGateway, NotificationUtil],
  controllers: [AgendaController],
  exports: [AgendaService],
})
export class AgendaModule {}
