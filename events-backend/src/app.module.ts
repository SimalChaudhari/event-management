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
import { join } from 'path';

import { CacheModule } from '@nestjs/cache-manager';
import { TokenBlacklistMiddleware } from 'middleware/tokenBlacklistMiddleware';
console.log(join(__dirname, '..', 'uploads'))
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
    UserModule,
    EventModule, SpeakerModule, CartModule, RegisterEventModule, CountriesModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenBlacklistMiddleware)
      .forRoutes('*'); // Apply to all routes that require authentication
  }
}
