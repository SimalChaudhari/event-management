import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceGateway } from './attendance.gateway';
import { EventQRCodeService } from './event-qr-code.service';
import { EventAttendance } from './attendance.entity';
import { EventQRCode } from './event-qr-code.entity';
import { ContactExchange } from './contact-exchange.entity';
import { ExhibitorStamp } from './exhibitor-stamp.entity';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { AdminInfo } from '../registerEvent/admin-info.entity';
import { UtilsModule } from '../utils/utils.module';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventAttendance,
      EventQRCode,
      ContactExchange,
      ExhibitorStamp,
      UserEntity,
      Event,
      RegisterEvent,
      AdminInfo,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { },
    }),
    UtilsModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceGateway, EventQRCodeService],
  exports: [AttendanceService, AttendanceGateway, EventQRCodeService],
})
export class AttendanceModule {}
