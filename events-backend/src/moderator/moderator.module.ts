import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ModeratorController } from './moderator.controller';
import { ModeratorService } from './moderator.service';
import { Moderator } from './moderator.entity';
import { ModeratorEvent } from './moderator-event.entity';
import { Event } from '../event/event.entity';
import { EmailService } from '../service/email.service';
import { UserEntity } from '../user/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Moderator,
      ModeratorEvent,
      Event,
      UserEntity,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  controllers: [ModeratorController],
  providers: [ModeratorService, EmailService],
  exports: [ModeratorService],
})
export class ModeratorModule {}

