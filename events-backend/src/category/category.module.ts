// src/modules/category.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { JwtModule } from '@nestjs/jwt';
import { ErrorHandlerService } from 'utils/services/error-handler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: {}, // Set your token expiration
    }),
  ],
  providers: [CategoryService, ErrorHandlerService],
  controllers: [CategoryController],
  exports: [CategoryService],
})
export class CategoryModule {}
