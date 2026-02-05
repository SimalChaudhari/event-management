import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { CheckoutWebhookController } from './checkout-webhook.controller';
import { WooShPayService } from './wooshpay.service';
import { Checkout } from './checkout.entity';
import { CheckoutCartItem } from './checkout-cart-item.entity';
import { Refund } from './refund.entity';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';
import { Cart } from 'cart/cart.entity';
import { Order } from 'order/order.entity';
import { OrderItemEntity } from 'order/event.item.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { Coupon } from 'coupon/coupon.entity';
import { CouponUsage } from 'coupon/coupon-usage.entity';
import { CouponService } from 'coupon/coupon.service';
import { JwtModule } from '@nestjs/jwt';
import { CartModule } from 'cart/cart.module';

@Module({
    imports: [
        forwardRef(() => CartModule),
        TypeOrmModule.forFeature([
            Checkout,
            CheckoutCartItem,
            Refund,
            UserEntity,
            Event,
            Cart,
            Order,
            OrderItemEntity,
            RegisterEvent,
            Coupon,
            CouponUsage,
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {},
        }),
    ],
    providers: [CheckoutService, CouponService, WooShPayService],
    controllers: [CheckoutController, CheckoutWebhookController],   
    exports: [CheckoutService],
})
export class CheckoutModule {}
