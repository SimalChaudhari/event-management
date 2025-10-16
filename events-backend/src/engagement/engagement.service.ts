import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Engagement } from './engagement.entity';
import { CreateEngagementDto, UpdateEngagementDto } from './engagement.dto';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { UserUtils } from '../utils/user.utils';

@Injectable()
export class EngagementService {
  constructor(
    @InjectRepository(Engagement)
    private engagementRepository: Repository<Engagement>,
    @InjectRepository(ProgrammeTrack)
    private programmeTrackRepository: Repository<ProgrammeTrack>,
  ) {}

  /**
   * Create a new engagement
   */
  async createEngagement(createEngagementDto: CreateEngagementDto): Promise<Engagement> {
    // Verify that the programme track exists
    const track = await this.programmeTrackRepository.findOne({
      where: { id: createEngagementDto.trackId },
    });

    if (!track) {
      throw new NotFoundException(`Programme track with ID ${createEngagementDto.trackId} not found`);
    }

    const engagement = this.engagementRepository.create(createEngagementDto);
    return await this.engagementRepository.save(engagement);
  }

  /**
   * Get all engagements with formatted data
   */
  async getAllEngagements(): Promise<any[]> {
    const engagements = await this.engagementRepository.find({
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
      order: { createdAt: 'DESC' },
    });

    return UserUtils.formatEngagements(engagements);
  }

  /**
   * Get engagement by ID with formatted data
   */
  async getEngagementById(id: string): Promise<any> {
    const engagement = await this.engagementRepository.findOne({
      where: { id },
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
    });

    if (!engagement) {
      throw new NotFoundException(`Engagement with ID ${id} not found`);
    }

    const formatted = UserUtils.formatEngagements([engagement]);
    return formatted[0];
  }

  /**
   * Get engagements by track ID with formatted data
   */
  async getEngagementsByTrackId(trackId: string): Promise<any[]> {
    const engagements = await this.engagementRepository.find({
      where: { trackId },
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
      order: { createdAt: 'DESC' },
    });

    return UserUtils.formatEngagements(engagements);
  }

  /**
   * Update an engagement
   */
  async updateEngagement(id: string, updateEngagementDto: UpdateEngagementDto): Promise<Engagement> {
    const engagement = await this.getEngagementById(id);

    // If trackId is being updated, verify the new track exists
    if (updateEngagementDto.trackId) {
      const track = await this.programmeTrackRepository.findOne({
        where: { id: updateEngagementDto.trackId },
      });

      if (!track) {
        throw new NotFoundException(`Programme track with ID ${updateEngagementDto.trackId} not found`);
      }
    }

    Object.assign(engagement, updateEngagementDto);
    return await this.engagementRepository.save(engagement);
  }

  /**
   * Delete an engagement
   */
  async deleteEngagement(id: string): Promise<{ message: string }> {
    const engagement = await this.getEngagementById(id);
    await this.engagementRepository.remove(engagement);
    return { message: 'Engagement deleted successfully' };
  }

  /**
   * Get active engagements with formatted data
   */
  async getActiveEngagements(): Promise<any[]> {
    const engagements = await this.engagementRepository.find({
      where: { isActive: true },
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
      order: { createdAt: 'DESC' },
    });

    return UserUtils.formatEngagements(engagements);
  }

  /**
   * Toggle engagement active status
   */
  async toggleEngagementStatus(id: string): Promise<Engagement> {
    const engagement = await this.engagementRepository.findOne({
      where: { id },
    });
    
    if (!engagement) {
      throw new NotFoundException(`Engagement with ID ${id} not found`);
    }
    
    engagement.isActive = !engagement.isActive;
    return await this.engagementRepository.save(engagement);
  }

}

