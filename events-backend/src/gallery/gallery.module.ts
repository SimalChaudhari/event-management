// src/gallery/gallery.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { Event } from 'event/event.entity';
import { JwtModule } from '@nestjs/jwt';
import { Gallery } from './gallery.entity';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { UtilsModule } from 'utils/utils.module';
import { FilterModule } from '../service/filter.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event, 
      Gallery, 
    ]),
    UtilsModule, // Import Utils Module instead of individual services
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
    FilterModule, // Import FilterModule for pagination
  ],
  controllers: [GalleryController],
  providers: [GalleryService, ErrorHandlerService],
  exports: [GalleryService],
})
export class GalleryModule {}
