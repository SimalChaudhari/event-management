import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { AddressEntity } from './address.entity';
import { UserEntity } from './users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([AddressEntity, UserEntity]),
  JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: {},
  }),
],
  controllers: [AddressController],
  providers: [AddressService, ErrorHandlerService],
  exports: [AddressService],
})
export class AddressModule {}
