import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionalOffer } from './promotional-offer.entity';
import { PromotionalOfferService } from './promotional-offer.service';
import { PromotionalOfferController } from './promotional-offer.controller';
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([PromotionalOffer, Exhibitor]),
    JwtModule.register({
    secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
    signOptions: { }, // Set your token expiration
  }),
],
  providers: [PromotionalOfferService],
  controllers: [PromotionalOfferController],
  exports: [PromotionalOfferService],
})
export class PromotionalOfferModule {} 