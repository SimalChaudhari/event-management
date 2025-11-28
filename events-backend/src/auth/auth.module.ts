// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { UserEntity } from './../user/users.entity';
import { AddressEntity } from './../user/address.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { Event } from '../event/event.entity';
import { EmailService } from './../service/email.service';
import { AddressService } from './../user/address.service';
import { ErrorHandlerService } from './../utils/services/error-handler.service';
import { CsvUploadLogModule } from '../logs/csv-upload-log.module';
import { EmailBatchService } from '../utils/email-batch.service';
import { CsvProcessorService } from '../utils/csv-processor.service';
import { SSOModule } from './sso.module';
import { OAuthAuthService } from './oauth-auth.service';
import { UserModule } from '../user/users.module';
import { EmailTemplateModule } from '../email-template/email-template.module';


dotenv.config(); // Load environment variables
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AddressEntity, RegisterEvent, Event]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
    CsvUploadLogModule,
    SSOModule, // Import SSOModule to get OAuthAuthService
    forwardRef(() => UserModule), // Use forwardRef to avoid circular dependency
    EmailTemplateModule, // Import EmailTemplateModule for email templates
  ],
  providers: [
    AuthService, 
    EmailService, 
    AddressService, 
    ErrorHandlerService, 
    EmailBatchService, 
    CsvProcessorService,
    // Factory provider to inject OAuthAuthService into AuthService after both are created
    {
      provide: 'AUTH_SERVICE_INITIALIZER',
      useFactory: (authService: AuthService, oauthAuthService: OAuthAuthService) => {
        authService.setOAuthAuthService(oauthAuthService);
        return authService;
      },
      inject: [AuthService, OAuthAuthService],
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
