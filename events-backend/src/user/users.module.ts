//users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserEntity } from './users.entity';
import { SpeakerProfile } from './speaker-profile.entity';
import { SpeakerProfileService } from './speaker-profile.service';
import { JwtModule } from '@nestjs/jwt';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { EmailService } from '../service/email.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, SpeakerProfile]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
  ],
    providers: [UserService, SpeakerProfileService, ErrorHandlerService, EmailService],
    controllers: [UserController],
    exports: [UserService, SpeakerProfileService],
})
export class UserModule {}

