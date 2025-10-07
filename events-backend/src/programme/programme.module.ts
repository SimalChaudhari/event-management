import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ProgrammeTrack } from './programme-track.entity';
import { ProgrammeSession } from './programme-session.entity';
import { ProgrammeService } from './programme.service';
import { ProgrammeController } from './programme.controller';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgrammeTrack,
      ProgrammeSession,
      UserEntity,
      Event,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  providers: [ProgrammeService, ErrorHandlerService],
  controllers: [ProgrammeController],
  exports: [ProgrammeService],
})
export class ProgrammeModule {}
