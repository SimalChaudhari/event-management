//users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { QrScanController } from './qr-scan.controller';
import { UserEntity } from './users.entity';
import { AddressEntity } from './address.entity';
import { SpeakerProfile } from './speaker-profile.entity';
import { SpeakerProfileService } from './speaker-profile.service';
import { AddressService } from './address.service';
import { JwtModule } from '@nestjs/jwt';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { EmailService } from '../service/email.service';
import { AuthModule } from '../auth/auth.module';
import { FilterModule } from '../service/filter.module';

@Module({
    imports: [
      TypeOrmModule.forFeature([UserEntity, AddressEntity, SpeakerProfile]),
      JwtModule.register({
        secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
        signOptions: { }, // Set your token expiration
      }),
      forwardRef(() => AuthModule), // Use forwardRef to avoid circular dependency
      FilterModule, // Import FilterModule to use FilterService
    ],
    providers: [UserService, SpeakerProfileService, AddressService, ErrorHandlerService, EmailService],
    controllers: [UserController, QrScanController],
    exports: [UserService, SpeakerProfileService],
})
export class UserModule {}

