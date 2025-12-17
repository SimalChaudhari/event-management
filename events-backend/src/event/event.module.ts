// src/modules/event.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event, EventExhibitor } from './event.entity';
import { EventBooth } from './event-booth.entity';
import { EventStaff } from './event-staff.entity';
import { EventAgenda } from '../agenda/agenda.entity';
import { JwtModule } from '@nestjs/jwt';
import { EventCategory, EventSpeaker } from './event-speaker.entity';
import { UserEntity } from '../user/users.entity';
import { UserService } from '../user/users.service';
import { Cart } from 'cart/cart.entity';
import { OrderModule } from 'order/order.module';
import { Category } from 'category/category.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Exhibitor } from 'exhibitor/exhibitor.entity';
import { Survey, SurveySession } from '../survey/survey.entity';
import { Gallery } from '../gallery/gallery.entity';
import { OrderItemEntity } from '../order/event.item.entity';
import { EventAttendance } from '../attendance/attendance.entity';
import { Feedback } from '../feedback/feedback.entity';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { UtilsModule } from '../utils/utils.module'; // Import Utils Module
import { EmailService } from '../service/email.service';
import { AgendaModule } from '../agenda/agenda.module';
import { EventNotificationService } from '../utils/event-notification.service';
import { NotificationUtil } from '../utils/notification.util';
import { EventNotification, EventNotificationRead } from '../settings/event-notification.entity';
import { PushNotification, UserPermissions, PermissionTemplate } from '../settings/setting.entity';
import { ProgrammeModule } from '../programme/programme.module';
import { ProgrammeSession } from '../programme/programme-session.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { Engagement } from '../engagement/engagement.entity';
import { FilterModule } from '../service/filter.module';

@Module({
    imports: [
      TypeOrmModule.forFeature([
        Event,
        EventSpeaker,
        EventCategory,
        UserEntity,
        Cart,
        Category,
        RegisterEvent,
        FavoriteEvent,
        EventExhibitor,
        EventBooth,
        EventStaff,
        EventAgenda,
        Exhibitor,
        Survey,
        SurveySession,
        EventNotification,
        Engagement,
        EventNotificationRead,
        PushNotification,
        UserPermissions,
        PermissionTemplate,
        Gallery,
        OrderItemEntity,
        EventAttendance,
        Feedback,
        ProgrammeSession,
        ProgrammeTrack,
      ]),
      UtilsModule, // Import Utils Module instead of individual services
      JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: { },
      }),
      OrderModule,
      AgendaModule,
      ProgrammeModule,
      FilterModule, // Import FilterModule for pagination
    ],
    providers: [EventService, ErrorHandlerService, EmailService, EventNotificationService, NotificationUtil],
    controllers: [EventController],
    exports: [EventService],
})
export class EventModule {}