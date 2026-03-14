import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { Event } from '../event/event.entity';
import { UserEntity } from '../user/users.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { SalesforceService } from './salesforce.service';
import { SalesforceSyncService } from './salesforce-sync.service';
import { SalesforceEmailService } from './salesforce-email.service';
import { SalesforceController } from './salesforce.controller';
import { SalesforceSyncSetting } from './salesforce-sync-setting.entity';
import { UtilsModule } from '../utils/utils.module';
import { EmailService } from '../service/email.service';

@Module({
  imports: [
    ScheduleModule,
    TypeOrmModule.forFeature([Event, UserEntity, RegisterEvent, SalesforceSyncSetting]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
    UtilsModule,
  ],
  controllers: [SalesforceController],
  providers: [SalesforceService, SalesforceSyncService, SalesforceEmailService, EmailService],
  exports: [SalesforceService, SalesforceSyncService],
})
export class SalesforceModule {}
