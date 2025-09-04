import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactInfoController } from './contact-info.controller';
import { ContactInfoService } from './contact-info.service';
import { ContactInfo } from './contact-info.entity';
import { UserEntity } from '../user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactInfo, UserEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  controllers: [ContactInfoController],
  providers: [ContactInfoService, ErrorHandlerService],
  exports: [ContactInfoService],
})
export class ContactInfoModule {}
