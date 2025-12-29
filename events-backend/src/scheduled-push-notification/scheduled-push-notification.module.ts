import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ScheduledPushNotificationController } from './scheduled-push-notification.controller';
import { ScheduledPushNotificationService } from './scheduled-push-notification.service';
import { ScheduledPushNotification } from './scheduled-push-notification.entity';
import { ScheduledPushNotificationDelivery } from './scheduled-push-notification-delivery.entity';
import { Event } from '../event/event.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { UserEntity } from '../user/users.entity';
import { PushNotification } from '../settings/setting.entity';
import { NotificationUtil } from '../utils/notification.util';
import { PushNotificationGateway } from './push-notification.gateway';
import { EventNotification, EventNotificationRead } from '../settings/event-notification.entity';
import { UserScheduledPushNotificationController } from './user-scheduled-push-notification.controller';
import { FilterModule } from '../service/filter.module';
import { UtilsModule } from '../utils/utils.module';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
    TypeOrmModule.forFeature([
      ScheduledPushNotification,
      ScheduledPushNotificationDelivery,
      Event,
      ProgrammeTrack,
      RegisterEvent,
      UserEntity,
      PushNotification,
      EventNotification,
      EventNotificationRead,
    ]),
    FilterModule, // Import FilterModule for pagination
    UtilsModule, // Import UtilsModule for ErrorHandlerService
  ],
  controllers: [ScheduledPushNotificationController, UserScheduledPushNotificationController],
  providers: [ScheduledPushNotificationService, NotificationUtil, PushNotificationGateway, ErrorHandlerService],
  exports: [ScheduledPushNotificationService],
})
export class ScheduledPushNotificationModule {}

