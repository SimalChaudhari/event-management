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

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEvent, Event, UserEntity, RegisterEvent]),
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