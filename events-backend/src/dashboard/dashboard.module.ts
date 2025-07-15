import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import { Event } from '../event/event.entity';
import { Order } from '../order/order.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { UserEntity } from 'user/users.entity';
import { JwtModule } from '@nestjs/jwt';
import { OrderItemEntity } from 'order/event.item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, Event, Order, RegisterEvent,OrderItemEntity]),
    JwtModule.register({
        secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
        signOptions: { }, // Set your token expiration
      }),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {} 