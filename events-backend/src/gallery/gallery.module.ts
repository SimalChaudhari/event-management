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
import { Cart } from 'cart/cart.entity';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { Survey, SurveySession, SurveyResponse } from 'survey/survey.entity'; // Add all survey entities
import { SurveyService } from 'survey/survey.service';
import { UtilsModule } from 'utils/utils.module';
import { UserEntity } from 'user/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event, 
      UserEntity,
      Gallery, 
      EventSpeaker, 
      EventCategory, 
      EventExhibitor, 
      Exhibitor, 
      Category, 
      RegisterEvent, 
      FavoriteEvent, 
      UserEntity, 
      Cart,
      Survey,
      SurveySession,   // Add this
      SurveyResponse   // Add this - यह missing था!
    ]),
    UtilsModule, // Import Utils Module instead of individual services
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  controllers: [GalleryController],
  providers: [GalleryService, EventService, SurveyService, ErrorHandlerService],
  exports: [GalleryService],
})
export class GalleryModule {}
