//users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserEntity } from './users.entity';
import { JwtModule } from '@nestjs/jwt';
import { ErrorHandlerService } from 'utils/services/error-handler.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
  ],
    providers: [UserService,ErrorHandlerService],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}

