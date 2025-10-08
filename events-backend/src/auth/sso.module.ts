import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { BillingDetail } from '../registerEvent/billing-detail.entity';
import { SSOSyncService } from './sso-sync.service';
import { OAuthAuthService } from './oauth-auth.service';
import { OAuthAuthController } from './oauth-auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      Event,
      RegisterEvent,
      BillingDetail,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  providers: [
    SSOSyncService,
    OAuthAuthService,
  ],
  controllers: [OAuthAuthController],
  exports: [
    OAuthAuthService,
    SSOSyncService,
  ],
})
export class SSOModule {}
