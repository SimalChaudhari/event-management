import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { CheckoutWebhookController } from './checkout-webhook.controller';
import { PaymentMethodController } from './payment-method.controller';
import { CardValidationController } from './card-validation.controller';

import { WooShPayService } from './wooshpay.service';
import { PaymentMethodService } from './payment-method.service';
import { UserPaymentMethod } from './payment-method.entity';
import { Checkout } from './checkout.entity';
import { CheckoutCartItem } from './checkout-cart-item.entity';
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
            UserPaymentMethod,
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
    providers: [CheckoutService, CouponService, WooShPayService, PaymentMethodService],
    controllers: [CheckoutController, CheckoutWebhookController, PaymentMethodController, CardValidationController],   
    exports: [CheckoutService],
})
export class CheckoutModule {}
