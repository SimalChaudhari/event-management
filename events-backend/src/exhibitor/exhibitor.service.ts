import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { ExhibitorDto } from './exhibitor.dto';
import path from 'path';
import * as fs from 'fs';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  ValidationException,
  ForeignKeyConstraintException,
} from '../utils/exceptions/custom-exceptions';

@Injectable()
export class ExhibitorService {
  constructor(
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
    private readonly errorHandler: ErrorHandlerService, // Add this
  ) {}

  async createExhibitor(exhibitorDto: ExhibitorDto): Promise<Exhibitor> {
    try {
      // Check if email already exists
      const existingExhibitor = await this.exhibitorRepository.findOne({
        where: { email: exhibitorDto.email },
      });
      if (existingExhibitor) {
        throw new DuplicateResourceException(`Exhibitor ${exhibitorDto.email}`);
      }

      const exhibitor = this.exhibitorRepository.create(exhibitorDto);
      const savedExhibitor = await this.exhibitorRepository.save(exhibitor);
      
      // Return exhibitor with relations
      return await this.exhibitorRepository.findOne({
        where: { id: savedExhibitor.id },
        relations: ['promotionalOffers']
      }) || savedExhibitor;
    } catch (error) {
      if (error instanceof DuplicateResourceException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor creation');
    }
  }

  async getAllExhibitors(): Promise<any[]> {
    try {
      const exhibitors = await this.exhibitorRepository.find({
        relations: ['promotionalOffers'],
      });
      
      // Format response with documents like events
      return exhibitors.map(exhibitor => {
        // Format documents with names
        let formattedDocuments: { name: string; document: string }[] = [];
        if (exhibitor.documents && exhibitor.documentNames) {
          formattedDocuments = exhibitor.documents.map((doc, index) => ({
            name: exhibitor.documentNames?.[index] || `Document ${index + 1}`,
            document: doc
          }));
        } else if (exhibitor.documents) {
          // Fallback if no names are provided
          formattedDocuments = exhibitor.documents.map((doc, index) => ({
            name: `Document ${index + 1}`,
            document: doc
          }));
        }

        // Format flyers with names
        let formattedFlyers: { name: string; flyer: string }[] = [];
        if (exhibitor.flyers && exhibitor.flyerNames) {
          formattedFlyers = exhibitor.flyers.map((flyer, index) => ({
            name: exhibitor.flyerNames?.[index] || `Flyer ${index + 1}`,
            flyer: flyer
          }));
        } else if (exhibitor.flyers) {
          formattedFlyers = exhibitor.flyers.map((flyer, index) => ({
            name: `Flyer ${index + 1}`,
            flyer: flyer
          }));
        }

        // Format event images with names
        let formattedEventImages: { name: string; eventImage: string }[] = [];
        if (exhibitor.eventImages && exhibitor.eventImageNames) {
          formattedEventImages = exhibitor.eventImages.map((eventImage, index) => ({
            name: exhibitor.eventImageNames?.[index] || `Event Image ${index + 1}`,
            eventImage: eventImage
          }));
        } else if (exhibitor.eventImages) {
          formattedEventImages = exhibitor.eventImages.map((eventImage, index) => ({
            name: `Event Image ${index + 1}`,
            eventImage: eventImage
          }));
        }

        const { 
          documents,
          documentNames,
          flyers,
          flyerNames,
          eventImages,
          eventImageNames,
          ...exhibitorData 
        } = exhibitor;

        return {
          ...exhibitorData,
          documents: formattedDocuments,
          flyers: formattedFlyers,
          eventImages: formattedEventImages
        };
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Exhibitors retrieval');
    }
  }

  async getExhibitorById(id: string): Promise<any> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ 
        where: { id },
        relations: ['promotionalOffers'],
      });
      
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // Format documents with names
      let formattedDocuments: { name: string; document: string }[] = [];
      if (exhibitor.documents && exhibitor.documentNames) {
        formattedDocuments = exhibitor.documents.map((doc, index) => ({
          name: exhibitor.documentNames?.[index] || `Document ${index + 1}`,
          document: doc
        }));
      } else if (exhibitor.documents) {
        formattedDocuments = exhibitor.documents.map((doc, index) => ({
          name: `Document ${index + 1}`,
          document: doc
        }));
      }

      // Format flyers with names
      let formattedFlyers: { name: string; flyer: string }[] = [];
      if (exhibitor.flyers && exhibitor.flyerNames) {
        formattedFlyers = exhibitor.flyers.map((flyer, index) => ({
          name: exhibitor.flyerNames?.[index] || `Flyer ${index + 1}`,
          flyer: flyer
        }));
      } else if (exhibitor.flyers) {
        formattedFlyers = exhibitor.flyers.map((flyer, index) => ({
          name: `Flyer ${index + 1}`,
          flyer: flyer
        }));
      }

      // Format event images with names
      let formattedEventImages: { name: string; eventImage: string }[] = [];
      if (exhibitor.eventImages && exhibitor.eventImageNames) {
        formattedEventImages = exhibitor.eventImages.map((eventImage, index) => ({
          name: exhibitor.eventImageNames?.[index] || `Event Image ${index + 1}`,
          eventImage: eventImage
        }));
      } else if (exhibitor.eventImages) {
        formattedEventImages = exhibitor.eventImages.map((eventImage, index) => ({
          name: `Event Image ${index + 1}`,
          eventImage: eventImage
        }));
      }

      const { 
        documents, 
        documentNames, 
        flyers,
        flyerNames,
        eventImages,
        eventImageNames,
        ...exhibitorData 
      } = exhibitor;

      return {
        ...exhibitorData,
        documents: formattedDocuments,
        flyers: formattedFlyers,
        eventImages: formattedEventImages
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor retrieval by ID');
    }
  }

  async getExhibitorEntityById(id: string): Promise<Exhibitor> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }
      return exhibitor;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor entity retrieval by ID');
    }
  }

  async updateExhibitor(id: string, exhibitorDto: Partial<ExhibitorDto>): Promise<Exhibitor> {
    try {
      const exhibitor = await this.getExhibitorEntityById(id);
      
      // Check if email is being changed and if it already exists
      if (exhibitorDto.email && exhibitorDto.email !== exhibitor.email) {
        const existingExhibitor = await this.exhibitorRepository.findOne({
          where: { email: exhibitorDto.email },
        });
        if (existingExhibitor) {
          throw new DuplicateResourceException(`Exhibitor ${exhibitorDto.email}`);
        }
      }

      Object.assign(exhibitor, exhibitorDto);
      const savedExhibitor = await this.exhibitorRepository.save(exhibitor);
      
      // Return exhibitor with relations
      return await this.exhibitorRepository.findOne({
        where: { id: savedExhibitor.id },
        relations: ['promotionalOffers']
      }) || savedExhibitor;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor update');
    }
  }

  async deleteExhibitor(id: string): Promise<{ message: string }> {
    try {
      const exhibitor = await this.getExhibitorEntityById(id);
      
      // Delete associated files
      this.deleteExhibitorFiles(exhibitor);

      await this.exhibitorRepository.remove(exhibitor);
      return { message: 'Exhibitor deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor deletion');
    }
  }

  async updateExhibitorFiles(
    id: string,
    fileType: 'flyers' | 'documents' | 'eventImages',
    files: string[],
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      exhibitor[fileType] = files;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, `Exhibitor ${fileType} update`);
    }
  }

  async updateExhibitorDocuments(
    id: string,
    documents: string[],
    documentNames: string[],
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      exhibitor.documents = documents;
      exhibitor.documentNames = documentNames;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor documents update');
    }
  }

  // Helper method to delete exhibitor files
  private deleteExhibitorFiles(exhibitor: Exhibitor) {
    try {
      // Delete flyers if they exist
      if (exhibitor.flyers && exhibitor.flyers.length > 0) {
        exhibitor.flyers.forEach((flyerPath) => {
          const filePath = path.resolve(flyerPath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Delete documents if they exist
      if (exhibitor.documents && exhibitor.documents.length > 0) {
        exhibitor.documents.forEach((docPath) => {
          const filePath = path.resolve(docPath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Delete event images if they exist
      if (exhibitor.eventImages && exhibitor.eventImages.length > 0) {
        exhibitor.eventImages.forEach((imagePath) => {
          const filePath = path.resolve(imagePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    } catch (fileError) {
      this.errorHandler.logError(fileError, 'Exhibitor file deletion', exhibitor.id);
      // Continue with exhibitor deletion even if file deletion fails
    }
  }
}