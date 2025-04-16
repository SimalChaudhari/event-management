// src/modules/event.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event } from './event.entity';
import { JwtModule } from '@nestjs/jwt';
import { EventSpeaker } from './event-speaker.entity';
import { SpeakerService } from 'speaker/speaker.service';
import { Speaker } from 'speaker/speaker.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Event,EventSpeaker,Speaker]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
  ],
    providers: [EventService],
    controllers: [EventController],
})
export class EventModule {}