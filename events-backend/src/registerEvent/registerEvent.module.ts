import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RegisterEvent } from './registerEvent.entity';
import { RegisterEventService } from './registerEvent.service';
import { PublicRegisterEventController, RegisterEventController } from './registerEvent.controller';
import { AdminInfo } from './admin-info.entity';
import { AdminInfoService } from './admin-info.service';
import { AdminInfoController } from './admin-info.controller';
import { BillingDetail } from './billing-detail.entity';
import { Event, EventExhibitor } from 'event/event.entity';
import { Order } from 'order/order.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Exhibitor } from 'exhibitor/exhibitor.entity';
import { UserEntity } from 'user/users.entity';
import { EventAgenda } from '../agenda/agenda.entity';
import { Engagement } from '../engagement/engagement.entity';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { UtilsModule } from 'utils/utils.module';
import { EventNotificationService } from '../utils/event-notification.service';
import { NotificationUtil } from '../utils/notification.util';
import { EventNotification, EventNotificationRead } from '../settings/event-notification.entity';
import { PushNotification, UserPermissions, PermissionTemplate } from '../settings/setting.entity';
import { EngagementModule } from '../engagement/engagement.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { Checkout } from '../checkout/checkout.entity';
import { CheckoutCartItem } from '../checkout/checkout-cart-item.entity';
import { EventStaff } from '../event/event-staff.entity';
import { ExhibitorRating } from '../exhibitor/exhibitor-rating.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([RegisterEvent, AdminInfo, BillingDetail, Event, Order, FavoriteEvent, EventExhibitor, Exhibitor, UserEntity, EventAgenda, Engagement, EventNotification, EventNotificationRead, PushNotification, UserPermissions, PermissionTemplate, Checkout, CheckoutCartItem, EventStaff, ExhibitorRating]), UtilsModule,
        EngagementModule,
        CheckoutModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,  // Use JWT secret from .env file
            signOptions: {},  // Set token expiration
        }),
    ],
    providers: [RegisterEventService, AdminInfoService, ErrorHandlerService, EventNotificationService, NotificationUtil],
    controllers: [RegisterEventController, PublicRegisterEventController, AdminInfoController],
    exports: [RegisterEventService, AdminInfoService], // Export the service to be used in other modules
})
export class RegisterEventModule {}