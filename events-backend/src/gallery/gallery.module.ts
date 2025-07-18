// src/gallery/gallery.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { Event, EventExhibitor } from 'event/event.entity';
import { JwtModule } from '@nestjs/jwt';
import { Gallery } from './gallery.entity';
import { EventService } from 'event/event.service';
import { EventCategory, EventSpeaker } from 'event/event-speaker.entity';
import { Exhibitor } from 'exhibitor/exhibitor.entity';
import { Category } from 'category/category.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Speaker } from 'speaker/speaker.entity';
import { Cart } from 'cart/cart.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Gallery, EventSpeaker, EventCategory, EventExhibitor, Exhibitor, Category, RegisterEvent, FavoriteEvent, Speaker, Cart]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use JWT secret from .env file
      signOptions: {}, // Set token expiration
    }),
  ],

  controllers: [GalleryController],
  providers: [GalleryService, EventService],
  exports: [GalleryService],
})
export class GalleryModule {}
