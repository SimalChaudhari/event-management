// src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/users.module';
import { EventModule } from 'event/event.module';
import { SpeakerModule } from 'speaker/speaker.module';
import { CartModule } from 'cart/cart.module';
import { RegisterEventModule } from 'registerEvent/registerEvent.module';
import { CountriesModule } from './countries/countries.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TokenBlacklistMiddleware } from 'middleware/tokenBlacklistMiddleware';
import { WithdrawalModule } from 'withdrawal/withdrawal.module';
import { SettingModule } from 'settings/setting.module';
import { FavoriteEventModule } from 'favorite-event/favorite-event.module';
import { FeedbackModule } from 'feedback/feedback.module';
import { CouponModule } from 'coupon/coupon.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CategoryModule } from 'category/category.module';
import { GalleryModule } from 'gallery/gallery.module';
import { ExhibitorModule } from 'exhibitor/exhibitor.module';
import { PromotionalOfferModule } from 'promotional-offer/promotional-offer.module';
import { SurveyModule } from 'survey/survey.module';

import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { GlobalExceptionFilter } from './utils/global-exception.filter';
import { ValidationPipe } from './validation/validation.pipe';
import { ErrorHandlerService } from './utils/services/error-handler.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      // ssl: true,
      // extra: {
      //   ssl: {
      //     rejectUnauthorized: false,
      //   },
      // },
    }),
    AuthModule,
    SettingModule,
    UserModule,
    GalleryModule,
    ExhibitorModule,
    GalleryModule,
    PromotionalOfferModule,
    SurveyModule,
    EventModule, SpeakerModule, CartModule,WithdrawalModule, RegisterEventModule, CountriesModule,FavoriteEventModule,FeedbackModule,CouponModule,CategoryModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    }),
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ErrorHandlerService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenBlacklistMiddleware)
      .forRoutes('*'); // Apply to all routes that require authentication
  }
}
