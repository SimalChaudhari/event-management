import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { ExhibitorDto } from './exhibitor.dto';
import path from 'path';
import * as fs from 'fs';

@Injectable()
export class ExhibitorService {
  constructor(
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
  ) {}

  async createExhibitor(exhibitorDto: ExhibitorDto): Promise<Exhibitor> {
    // Check if email already exists
    const existingExhibitor = await this.exhibitorRepository.findOne({
      where: { email: exhibitorDto.email },
    });
    if (existingExhibitor) {
      throw new ConflictException('Email already exists');
    }

    const exhibitor = this.exhibitorRepository.create(exhibitorDto);
    return await this.exhibitorRepository.save(exhibitor);
  }

  async getAllExhibitors(): Promise<Exhibitor[]> {
    return await this.exhibitorRepository.find({
      relations: ['promotionalOffers'],
    });
  }

  async getExhibitorById(id: string): Promise<Exhibitor> {
    const exhibitor = await this.exhibitorRepository.findOne({ 
      where: { id },
      relations: ['promotionalOffers'],
    });
    if (!exhibitor) {
      throw new NotFoundException('Exhibitor not found');
    }
    return exhibitor;
  }

  async updateExhibitor(id: string, exhibitorDto: Partial<ExhibitorDto>): Promise<Exhibitor> {
    const exhibitor = await this.getExhibitorById(id);
    
    // Check if email is being changed and if it already exists
    if (exhibitorDto.email && exhibitorDto.email !== exhibitor.email) {
      const existingExhibitor = await this.exhibitorRepository.findOne({
        where: { email: exhibitorDto.email },
      });
      if (existingExhibitor) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(exhibitor, exhibitorDto);
    return await this.exhibitorRepository.save(exhibitor);
  }

  async deleteExhibitor(id: string): Promise<void> {
    const exhibitor = await this.getExhibitorById(id);
    
    // Delete all associated files
    if (exhibitor.flyers && exhibitor.flyers.length > 0) {
      exhibitor.flyers.forEach((flyer) => {
        const filePath = path.join(__dirname, '..', '..', flyer);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    if (exhibitor.documents && exhibitor.documents.length > 0) {
      exhibitor.documents.forEach((doc) => {
        const filePath = path.join(__dirname, '..', '..', doc);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    if (exhibitor.eventImages && exhibitor.eventImages.length > 0) {
      exhibitor.eventImages.forEach((image) => {
        const filePath = path.join(__dirname, '..', '..', image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await this.exhibitorRepository.remove(exhibitor);
  }

  async updateExhibitorFiles(
    id: string,
    fileType: 'flyers' | 'documents' | 'eventImages',
    files: string[],
  ): Promise<Partial<Exhibitor>> {
    const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
    if (!exhibitor) throw new NotFoundException('Exhibitor not found!');

    exhibitor[fileType] = files;
    return await this.exhibitorRepository.save(exhibitor);
  }
}