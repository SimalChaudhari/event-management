// src/modules/speaker.module.ts
import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Speaker } from './speaker.entity';
import { SpeakerService } from './speaker.service';
import { SpeakerController } from './speaker.controller';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Module({
    imports: [TypeOrmModule.forFeature([Speaker])],
    providers: [SpeakerService, ErrorHandlerService],
    controllers: [SpeakerController],
})
export class SpeakerModule {}