// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { UserEntity } from './../user/users.entity';
import { AddressEntity } from './../user/address.entity';
import { EmailService } from './../service/email.service';
import { AddressService } from './../user/address.service';
import { ErrorHandlerService } from './../utils/services/error-handler.service';
import { CsvUploadLogModule } from '../logs/csv-upload-log.module';
import { EmailBatchService } from '../utils/email-batch.service';
import { CsvProcessorService } from '../utils/csv-processor.service';
import { SSOModule } from './sso.module';


dotenv.config(); // Load environment variables
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AddressEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
    CsvUploadLogModule,
    SSOModule, // Import SSOModule to get OAuthAuthService
  ],
  providers: [AuthService, EmailService, AddressService, ErrorHandlerService, EmailBatchService, CsvProcessorService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
