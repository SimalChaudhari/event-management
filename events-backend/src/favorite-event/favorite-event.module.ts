// src/modules/favorite-event.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteEventService } from './favorite-event.service';
import { FavoriteEventController } from './favorite-event.controller';
import { FavoriteEvent } from './favorite-event.entity';
import { Event } from 'event/event.entity';
import { UserEntity } from 'user/users.entity';
import { JwtModule } from '@nestjs/jwt';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { EventAgenda } from '../agenda/agenda.entity';
import { Engagement } from '../engagement/engagement.entity';
import { EventStaff } from '../event/event-staff.entity';
import { ExhibitorRating } from '../exhibitor/exhibitor-rating.entity';
import { UtilsModule } from 'utils/utils.module';
import { EventModule } from '../event/event.module';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEvent, Event, UserEntity,
     RegisterEvent, EventAgenda, Engagement, EventStaff, ExhibitorRating]),
     UtilsModule,
     EventModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
  ],
  providers: [FavoriteEventService],
  controllers: [FavoriteEventController],
  exports: [FavoriteEventService],
})
export class FavoriteEventModule {}