// src/modules/event.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event } from './event.entity';
import { JwtModule } from '@nestjs/jwt';
import { EventCategory, EventSpeaker } from './event-speaker.entity';
import { SpeakerService } from 'speaker/speaker.service';
import { Speaker } from 'speaker/speaker.entity';
import { Cart } from 'cart/cart.entity';
import { OrderModule } from 'order/order.module';
import { Category } from 'category/category.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Event,
      EventSpeaker,EventCategory,Speaker,Cart,Category,RegisterEvent,FavoriteEvent]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
    OrderModule, // Import the OrderModule
  ],
    providers: [EventService],
    controllers: [EventController],
})
export class EventModule {}