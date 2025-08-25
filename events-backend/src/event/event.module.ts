// src/modules/event.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event, EventExhibitor } from './event.entity';
import { EventBooth } from './event-booth.entity';
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
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { UtilsModule } from '../utils/utils.module'; // Import Utils Module
import { EmailService } from '../service/email.service';
import { AgendaModule } from '../agenda/agenda.module';

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
        EventAgenda,
        Exhibitor,
        Survey,
        SurveySession,
      ]),
      UtilsModule, // Import Utils Module instead of individual services
      JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: { },
      }),
      OrderModule,
      AgendaModule,
    ],
    providers: [EventService, ErrorHandlerService, EmailService],
    controllers: [EventController],
})
export class EventModule {}