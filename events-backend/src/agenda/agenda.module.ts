import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { EventAgenda } from './agenda.entity';
import { Event } from '../event/event.entity';
import { UtilsModule } from '../utils/utils.module';
import { JwtModule } from '@nestjs/jwt';
import { UserEntity } from 'user/users.entity';
import { EmailService } from 'service/email.service';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventAgenda,
      UserEntity,
      Event,
      RegisterEvent,
    ]),
    UtilsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret from the .env file
      signOptions: { }, // Set your token expiration
    }),
  ],
  providers: [AgendaService, EmailService],
  controllers: [AgendaController],
  exports: [AgendaService],
})
export class AgendaModule {}
