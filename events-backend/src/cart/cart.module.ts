// src/modules/cart.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './cart.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { JwtModule } from '@nestjs/jwt';
import { EventService } from 'event/event.service';
import { Event } from 'event/event.entity';
import { EventModule } from 'event/event.module';
import { EventCategory, EventSpeaker } from 'event/event-speaker.entity';
import { Speaker } from 'speaker/speaker.entity';
import { Category } from 'category/category.entity';


@Module({
    imports: [TypeOrmModule.forFeature([Cart,Event,EventSpeaker,EventCategory,Category,Speaker]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
    EventModule, // Add EventModule here
  ],
    providers: [CartService,EventService],
    controllers: [CartController],
})
export class CartModule {}