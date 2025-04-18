// events-backend/src/order/order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './order.entity';

import { JwtModule } from '@nestjs/jwt';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';
import { OrderItemEntity } from './event.item.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { Cart } from 'cart/cart.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order,UserEntity,Event,OrderItemEntity,RegisterEvent,Cart]),
    JwtModule.register({
        secret: process.env.JWT_SECRET,  // Use JWT secret from .env file
        signOptions: {},  // Set token expiration
      }),
],
    providers: [OrderService],
    controllers: [OrderController],
    exports: [OrderService], // Export the service to be used in other modules
})
export class OrderModule {}