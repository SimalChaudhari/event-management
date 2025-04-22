// src/services/speaker.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Speaker } from './speaker.entity';
import { SpeakerDto } from './speaker.dto';
import path from 'path';
import * as fs from 'fs';

@Injectable()
export class SpeakerService {
  constructor(
    @InjectRepository(Speaker)
    private speakerRepository: Repository<Speaker>,
  ) {}

  async createSpeaker(speakerDto: SpeakerDto) {
    const speaker = await this.speakerRepository.create(speakerDto);
    const savedSpeaker = await this.speakerRepository.save(speaker);
    return savedSpeaker;
  }

  async getAllSpeakers() {
    const speakers = await this.speakerRepository.find();
    return speakers;
  }

  async getSpeakerById(id: string) {
    const speaker = await this.speakerRepository.findOne({ where: { id } });
    if (!speaker) throw new NotFoundException('Speaker not found');
    return speaker;
  }

  async updateSpeaker(id: string, speakerDto: Partial<SpeakerDto>) {
    const speaker = await this.speakerRepository.findOne({ where: { id } });
    if (!speaker) throw new NotFoundException('Speaker not found');
    const updatedSpeaker = await this.speakerRepository.save({
      ...speaker,
      ...speakerDto,
    });
    return updatedSpeaker;
  }

  async deleteSpeaker(id: string) {
    const speaker = await this.speakerRepository.findOne({ where: { id } });
    if (!speaker) throw new NotFoundException('Speaker not found');

    // Delete profile picture from filesystem if exists
    if (speaker.speakerProfile) {
      const filePath = path.resolve(speaker.speakerProfile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.speakerRepository.remove(speaker);
    return {
      success: true,
      message: 'Speaker deleted successfully',
      messageLength: 'Speaker deleted successfully'.length,
      data: null,
    };
  }
}
