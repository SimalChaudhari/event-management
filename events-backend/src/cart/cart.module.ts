// src/modules/cart.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './cart.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { JwtModule } from '@nestjs/jwt';
import { EventService } from 'event/event.service';
import { Event, EventExhibitor } from 'event/event.entity';
import { EventModule } from 'event/event.module';
import { EventCategory, EventSpeaker } from 'event/event-speaker.entity';
import { Category } from 'category/category.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Exhibitor } from 'exhibitor/exhibitor.entity';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { Survey, SurveyResponse, SurveySession } from 'survey/survey.entity';
import { SurveyService } from 'survey/survey.service';
import { UtilsModule } from 'utils/utils.module';
import { UserEntity } from 'user/users.entity';


@Module({
    imports: [TypeOrmModule.forFeature([Cart,Event,EventSpeaker,
      Survey,
      UserEntity,
      SurveySession,    // Add this
      SurveyResponse,    // Add this
      EventCategory,Category,UserEntity,RegisterEvent,FavoriteEvent,EventExhibitor,Exhibitor,Survey]),
      UtilsModule, // Import Utils Module instead of individual services
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
    EventModule, // Add EventModule here
  ],
    providers: [CartService,EventService,SurveyService,ErrorHandlerService  ],
    controllers: [CartController],
})
export class CartModule {}