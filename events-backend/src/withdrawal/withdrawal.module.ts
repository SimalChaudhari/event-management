
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import { Withdrawal } from './withdrawal.entity';
import { Order } from 'order/order.entity';
import { JwtModule } from '@nestjs/jwt';
import { Event } from 'event/event.entity';
import { OrderItemEntity } from 'order/event.item.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Withdrawal,Order,Event,OrderItemEntity,RegisterEvent]),
  JwtModule.register({
    secret: process.env.JWT_SECRET,  // Use JWT secret from .env file
    signOptions: {},  // Set token expiration
  }),
],
  controllers: [WithdrawalController],
  providers: [WithdrawalService],
})
export class WithdrawalModule {}
