import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon } from './coupon.entity';
import { CouponUsage } from './coupon-usage.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, CouponUsage]),
    JwtModule.register({
        secret: process.env.JWT_SECRET,  // Use JWT secret from .env file
        signOptions: {},  // Set token expiration
      }),
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService], // Export service so other modules can use it
})
export class CouponModule {}
