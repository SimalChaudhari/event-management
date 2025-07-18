// src/modules/eventStamp.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventStampController } from './eventStamp.controller';
import { EventStampService } from './eventStamp.service';
import { EventStamp } from './eventStamp.entity';
import { Event } from 'event/event.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([EventStamp, Event]),
  JwtModule.register({
    secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
    signOptions: { }, // Set your token expiration
  }),
],
  controllers: [EventStampController],
  providers: [EventStampService],
  exports: [EventStampService],
})
export class EventStampModule {} 