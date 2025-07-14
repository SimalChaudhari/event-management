import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RegisterEvent } from './registerEvent.entity';
import { RegisterEventService } from './registerEvent.service';
import { RegisterEventController } from './registerEvent.controller';
import { Event } from 'event/event.entity';
import { Order } from 'order/order.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([RegisterEvent, Event, Order, FavoriteEvent]),
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