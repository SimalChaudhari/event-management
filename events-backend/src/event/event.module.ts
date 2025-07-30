// src/modules/event.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event, EventExhibitor } from './event.entity';
import { JwtModule } from '@nestjs/jwt';
import { EventCategory, EventSpeaker } from './event-speaker.entity';
import { SpeakerService } from 'speaker/speaker.service';
import { Speaker } from 'speaker/speaker.entity';
import { Cart } from 'cart/cart.entity';
import { OrderModule } from 'order/order.module';
import { Category } from 'category/category.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Exhibitor } from 'exhibitor/exhibitor.entity';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { UtilsModule } from '../utils/utils.module'; // Import Utils Module

@Module({
    imports: [
      TypeOrmModule.forFeature([
        Event,
        EventSpeaker,
        EventCategory,
        Speaker,
        Cart,
        Category,
        RegisterEvent,
        FavoriteEvent,
        EventExhibitor,
        Exhibitor,
      ]),
      UtilsModule, // Import Utils Module instead of individual services
      JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: { },
      }),
      OrderModule,
    ],
    providers: [EventService, ErrorHandlerService],
    controllers: [EventController],
})
export class EventModule {}