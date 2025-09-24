import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserEntity } from '../user/users.entity';
import { OAuthAuthService } from './oauth-auth.service';
import { OAuthAuthController } from './oauth-auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  providers: [OAuthAuthService],
  controllers: [OAuthAuthController],
  exports: [OAuthAuthService],
})
export class SSOModule {}
