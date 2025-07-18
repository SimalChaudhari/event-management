import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RegisterEvent } from './registerEvent.entity';
import { RegisterEventService } from './registerEvent.service';
import { RegisterEventController } from './registerEvent.controller';
import { Event, EventExhibitor } from 'event/event.entity';
import { Order } from 'order/order.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Exhibitor } from 'exhibitor/exhibitor.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([RegisterEvent, Event, Order, FavoriteEvent,EventExhibitor,Exhibitor]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,  // Use JWT secret from .env file
            signOptions: {},  // Set token expiration
        }),
    ],
    providers: [RegisterEventService],
    controllers: [RegisterEventController],
    exports: [RegisterEventService], // Export the service to be used in other modules
})
export class RegisterEventModule {}