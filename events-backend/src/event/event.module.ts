// src/modules/event.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { EventStampService } from './event-stamp.service';
import { EventStampController } from './event-stamp.controller';
import { Event, EventExhibitor } from './event.entity';
import { EventBooth } from './event-booth.entity';
import { EventStaff } from './event-staff.entity';
import { EventAgenda } from '../agenda/agenda.entity';
import { EventStamp } from './event-stamp.entity';
import { EventStampEvent } from './event-stamp-event.entity';
import { UserStampVisit } from './user-stamp-visit.entity';
import { JwtModule } from '@nestjs/jwt';
import { EventCategory, EventSpeaker } from './event-speaker.entity';
import { UserEntity } from '../user/users.entity';
import { UserService } from '../user/users.service';
import { Cart } from 'cart/cart.entity';
import { OrderModule } from 'order/order.module';
import { Category } from 'category/category.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { AdminInfo } from 'registerEvent/admin-info.entity';
import { BillingDetail } from 'registerEvent/billing-detail.entity';
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
import { ExhibitorRating } from '../exhibitor/exhibitor-rating.entity';
import { ExhibitorView } from '../exhibitor/exhibitor-view.entity';
import { ExhibitorLead } from '../exhibitor/exhibitor-lead.entity';
import { FilterModule } from '../service/filter.module';
import { SurveyQuestion, SurveyAnswer } from '../survey/qa.entity';
import { Withdrawal } from '../cart/withdrawal.entity';
import { ModeratorEvent } from '../moderator/moderator-event.entity';
import { QnaQuestion, QnaLike } from '../qna/qna.entity';
import { Poll, PollOption, PollVote, UserPollSession, UserPollVote } from '../polling/polling.entity';
import { ScheduledPushNotification } from '../scheduled-push-notification/scheduled-push-notification.entity';
import { EventQRCode } from '../attendance/event-qr-code.entity';
import { ContactExchange } from '../attendance/contact-exchange.entity';
import { Coupon } from '../coupon/coupon.entity';
import { ExhibitorModule } from '../exhibitor/exhibitor.module';

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
        AdminInfo,
        BillingDetail,
        FavoriteEvent,
        EventExhibitor,
        EventBooth,
        EventStaff,
        EventAgenda,
        Exhibitor,
        Survey,
        SurveySession,
        SurveyQuestion,
        SurveyAnswer,
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
        ExhibitorRating,
        ExhibitorView,
        ExhibitorLead,
        EventStamp,
        EventStampEvent,
        UserStampVisit,
        Withdrawal,
        ModeratorEvent,
        QnaQuestion,
        QnaLike,
        Poll,
        PollOption,
        PollVote,
        UserPollSession,
        UserPollVote,
        ScheduledPushNotification,
        EventQRCode,
        ContactExchange,
        Coupon,
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
      forwardRef(() => ExhibitorModule),
    ],
    providers: [EventService, EventStampService, ErrorHandlerService, EmailService, EventNotificationService, NotificationUtil],
    controllers: [EventController, EventStampController],
    exports: [EventService, EventStampService],
})
export class EventModule {}