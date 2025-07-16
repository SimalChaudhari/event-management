// src/gallery/gallery.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { Event } from 'event/event.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use JWT secret from .env file
      signOptions: {}, // Set token expiration
    }),
  ],

  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
