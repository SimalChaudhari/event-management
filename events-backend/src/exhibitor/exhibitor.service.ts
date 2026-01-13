import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { ExhibitorLead } from './exhibitor-lead.entity';
import { ExhibitorView } from './exhibitor-view.entity';
import { ExhibitorRating } from './exhibitor-rating.entity';
import { BoothBanner } from './booth-banner.entity';
import { ExhibitorDto, DocumentDto, EventImageDto } from './exhibitor.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { ExhibitorFileUtils } from '../utils/exhibitor-file.utils';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
} from '../utils/exceptions/custom-exceptions';
import { EventService } from '../event/event.service';
import { UserEntity, UserRole } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { ExhibitorUtils } from '../utils/exhibitor.utils';

@Injectable()
export class ExhibitorService {
  constructor(
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
    @InjectRepository(ExhibitorLead)
    private exhibitorLeadRepository: Repository<ExhibitorLead>,
    @InjectRepository(ExhibitorView)
    private exhibitorViewRepository: Repository<ExhibitorView>,
    @InjectRepository(ExhibitorRating)
    private exhibitorRatingRepository: Repository<ExhibitorRating>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(BoothBanner)
    private boothBannerRepository: Repository<BoothBanner>,
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => EventService))
    private eventService: EventService,
  ) {}

  async createExhibitor(exhibitorDto: ExhibitorDto | Partial<ExhibitorDto>): Promise<any> {
    try {
      // Handle booth banners separately (stored in separate table)
      const boothBannersToSave = exhibitorDto.boothBanner;
      delete exhibitorDto.boothBanner; // Remove from DTO to avoid saving to exhibitor table

      // Ensure all flyers have unique IDs (required field)
      if (exhibitorDto.flyers && exhibitorDto.flyers.length > 0) {
        const { v4: uuidv4 } = require('uuid');
        exhibitorDto.flyers = exhibitorDto.flyers.map((flyer: any) => ({
          name: flyer.name,
          flyer: flyer.flyer,
          id: flyer.id || uuidv4(), // Always ensure ID exists
        }));
      }

      const exhibitor = this.exhibitorRepository.create(exhibitorDto);
      const savedExhibitor = await this.exhibitorRepository.save(exhibitor);
      
      // Create booth banners if provided
      if (boothBannersToSave && boothBannersToSave.length > 0) {
        // Normalize format: convert strings to {value: string} objects, then extract values
        const bannerValues = boothBannersToSave.map(banner => {
          return typeof banner === 'string' ? banner : (banner.value || String(banner));
        });
        
        const newBanners = bannerValues.map(bannerValue => {
          // Ensure we store only the string path, not a JSON object
          let finalBannerValue: string;
          if (typeof bannerValue === 'string') {
            // Check if it's a JSON stringified object
            try {
              const parsed = JSON.parse(bannerValue);
              if (parsed && typeof parsed === 'object' && parsed.value) {
                finalBannerValue = parsed.value; // Extract value from parsed object
              } else {
                finalBannerValue = bannerValue; // It's already a string
              }
            } catch {
              finalBannerValue = bannerValue; // Not JSON, use as is
            }
          } else {
            finalBannerValue = String(bannerValue);
          }
          
          return this.boothBannerRepository.create({
            exhibitorId: savedExhibitor.id,
            banner: finalBannerValue, // Store only the path string, not the object
          });
        });
        await this.boothBannerRepository.save(newBanners);
      }
      
      const full = await this.exhibitorRepository.findOne({
        where: { id: savedExhibitor.id },
        relations: ['boothBanners']
      });

      return full || savedExhibitor;
    } catch (error) {
      if (error instanceof DuplicateResourceException || error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor creation');
    }
  }

  async getAllExhibitors(
    eventId?: string,
    filters?: {
      page?: number;
      limit?: number;
      keyword?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{
    data: any[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      // If pagination is not provided, return all data
      const hasPagination = filters?.page !== undefined || filters?.limit !== undefined;
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const search = filters?.keyword;
      const sortBy = filters?.sortBy || 'createdAt';
      const sortOrder = filters?.sortOrder || 'DESC';

      // Build query builder
      const queryBuilder = this.exhibitorRepository
        .createQueryBuilder('exhibitor')
        .leftJoinAndSelect('exhibitor.boothBanners', 'boothBanners');

      // If eventId is provided, filter exhibitors by event
      if (eventId) {
        const { Event } = await import('../event/event.entity');
        const eventRepository = this.exhibitorRepository.manager.getRepository(Event);

        // Check if event exists
        const event = await eventRepository.findOne({
          where: { id: eventId },
        });

        if (!event) {
          throw new ResourceNotFoundException('Event', eventId);
        }

        // Join with EventExhibitor to filter by event
        queryBuilder
          .innerJoin('event_exhibitor', 'eventExhibitor', 'eventExhibitor.exhibitorId = exhibitor.id')
          .where('eventExhibitor.eventId = :eventId', { eventId });
      }

      // Apply search filter - search in company name, email, mobile, UEN
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.toLowerCase().trim()}%`;
        queryBuilder.andWhere(
          '(LOWER(exhibitor.companyName) LIKE :searchTerm OR ' +
          'LOWER(exhibitor.email) LIKE :searchTerm OR ' +
          'LOWER(exhibitor.mobile) LIKE :searchTerm OR ' +
          'LOWER(exhibitor.uen) LIKE :searchTerm)',
          { searchTerm },
        );
      }

      // Apply sorting with case-insensitive handling for string fields
      let orderByField = 'exhibitor.createdAt'; // default
      if (sortBy === 'companyName') {
        orderByField = 'exhibitor.companyName';
      } else if (sortBy === 'email') {
        orderByField = 'exhibitor.email';
      } else if (sortBy === 'createdAt') {
        orderByField = 'exhibitor.createdAt';
      } else if (sortBy === 'updatedAt') {
        orderByField = 'exhibitor.updatedAt';
      }
      
      // For string fields (companyName, email), database collation should handle case-insensitivity
      // If database collation is not case-insensitive, we'll sort in JavaScript after fetching
      queryBuilder.orderBy(orderByField, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination only if pagination parameters are provided
      let exhibitors;
      if (hasPagination) {
        const skip = (page - 1) * limit;
        exhibitors = await queryBuilder.skip(skip).take(limit).getMany();
      } else {
        // No pagination - return all data
        exhibitors = await queryBuilder.getMany();
      }

      // Get Event Staff repository
      const { EventStaff } = await import('../event/event-staff.entity');
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

      // Format using utility and include event staff
      let formattedExhibitors = await Promise.all(
        exhibitors.map(async (exhibitor) => {
          const basicInfo = ExhibitorUtils.getBasicExhibitorInfo(exhibitor);

          // Get Event Staff for this exhibitor
          const whereCondition: any = { exhibitorId: exhibitor.id };
          if (eventId) {
            whereCondition.eventId = eventId;
          }

          const eventStaffs = await eventStaffRepository.find({
            where: whereCondition,
            relations: ['user'],
          });

          // Format event staff data using utility
          const formattedEventStaff = ExhibitorUtils.formatEventStaff(eventStaffs);

          return {
            ...basicInfo,
            eventStaff: formattedEventStaff,
          };
        })
      );

      // Apply JavaScript-level sorting for case-insensitive sorting (especially for companyName and email)
      // This ensures consistent case-insensitive sorting regardless of database collation
      if (sortBy) {
        formattedExhibitors.sort((a: any, b: any) => {
          // Map sortBy to actual field values
          const getFieldValue = (item: any, field: string) => {
            if (field === 'companyName') {
              return item.companyName || '';
            } else if (field === 'email') {
              return item.email || '';
            } else if (field === 'createdAt') {
              return item.createdAt || '';
            } else if (field === 'updatedAt') {
              return item.updatedAt || '';
            }
            return item.createdAt || '';
          };

          const fieldA = getFieldValue(a, sortBy);
          const fieldB = getFieldValue(b, sortBy);

          // Handle date fields
          if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
            const dateA = fieldA ? new Date(fieldA) : new Date(0);
            const dateB = fieldB ? new Date(fieldB) : new Date(0);
            dateA.setHours(0, 0, 0, 0);
            dateB.setHours(0, 0, 0, 0);
            return sortOrder === 'ASC' 
              ? dateA.getTime() - dateB.getTime()
              : dateB.getTime() - dateA.getTime();
          }

          // Handle string fields (case-insensitive for companyName and email)
          const strA = String(fieldA || '').toLowerCase();
          const strB = String(fieldB || '').toLowerCase();
          
          if (sortOrder === 'ASC') {
            return strA.localeCompare(strB);
          } else {
            return strB.localeCompare(strA);
          }
        });
      }

      // Return response with or without pagination
      if (hasPagination) {
        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
          data: formattedExhibitors,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
          },
        };
      } else {
        // No pagination - return all data without pagination metadata
        return {
          data: formattedExhibitors,
        };
      }
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitors retrieval');
    }
  }

  async getExhibitorById(id: string): Promise<any> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ 
        where: { id },
        relations: ['boothBanners'],
      });
      
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // Get Event Staff for this exhibitor
      const { EventStaff } = await import('../event/event-staff.entity');
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      
      const eventStaffs = await eventStaffRepository.find({
        where: { exhibitorId: id },
        relations: ['user'],
      });

      // Format event staff data using utility
      const formattedEventStaff = ExhibitorUtils.formatEventStaff(eventStaffs);

      // Use utility to format exhibitor data
      const basicExhibitorInfo = ExhibitorUtils.getBasicExhibitorInfo(exhibitor);

      return {
        ...basicExhibitorInfo,
     
        eventStaff: formattedEventStaff,
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
      const exhibitor = await this.exhibitorRepository.findOne({ 
        where: { id },
        relations: ['boothBanners'], // Include boothBanners relation for update operations
      });
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

  async updateExhibitor(
    id: string,
    exhibitorDto: Partial<ExhibitorDto>,
    userId?: string,
    userRole?: string,
    userEmail?: string,
  ): Promise<any> {
    try {
      const existingExhibitor = await this.getExhibitorEntityById(id);

      // If user is Exhibitor (not Admin), verify they can update this exhibitor
      if (userRole === 'exhibitor' && userId) {
        let userCanUpdate = false;

        // Check if exhibitor email matches user email
        if (userEmail && existingExhibitor.email === userEmail) {
          userCanUpdate = true;
        }

        // If not found by email, check via EventStaff table
        if (!userCanUpdate && userId) {
          const { EventStaff } = await import('../event/event-staff.entity');
          const eventStaffRepository =
            this.exhibitorRepository.manager.getRepository(EventStaff);

          const userStaffRecord = await eventStaffRepository.findOne({
            where: {
              exhibitorId: id,
              userId: userId,
            },
          });

          if (userStaffRecord) {
            userCanUpdate = true;
          }
        }

        // If user cannot update this exhibitor, throw forbidden error
        if (!userCanUpdate) {
          throw new ForbiddenException(
            'You do not have permission to update this exhibitor. You can only update your own exhibitor profile.',
          );
        }
      }

      // Handle booth banners separately (stored in separate table)
      const boothBannersToSave = exhibitorDto.boothBanner;
      delete exhibitorDto.boothBanner; // Remove from DTO to avoid saving to exhibitor table

      // Clean up old files that are no longer needed (for other fields like flyers, documents, etc.)
      // Note: boothBanner cleanup is handled in updateExhibitorBoothBanner method
      await ExhibitorFileUtils.cleanupRemovedFiles(existingExhibitor, exhibitorDto, this.errorHandler);
      
      Object.assign(existingExhibitor, exhibitorDto);
      const savedExhibitor = await this.exhibitorRepository.save(existingExhibitor);

      // Update booth banners if provided - adds new banners to existing ones
      if (boothBannersToSave !== undefined) {
        // Normalize format: extract values from objects or use strings directly
        const normalizedBanners: Array<{ id?: string; value: string }> = boothBannersToSave.map((banner: any) => {
          let extractedValue: string;
          
          // Extract the actual string value
          if (typeof banner === 'string') {
            // Check if it's a JSON stringified object
            try {
              const parsed = JSON.parse(banner);
              if (parsed && typeof parsed === 'object' && parsed.value) {
                extractedValue = parsed.value; // Extract value from parsed object
              } else {
                extractedValue = banner; // It's already a string
              }
            } catch {
              extractedValue = banner; // Not JSON, use as is
            }
          } else if (banner && typeof banner === 'object' && 'value' in banner) {
            // Extract value from object, handling nested JSON strings
            if (typeof banner.value === 'string') {
              try {
                const parsed = JSON.parse(banner.value);
                if (parsed && typeof parsed === 'object' && parsed.value) {
                  extractedValue = parsed.value; // Extract value from parsed object
                } else {
                  extractedValue = banner.value; // It's already a string
                }
              } catch {
                extractedValue = banner.value; // Not JSON, use as is
              }
            } else {
              extractedValue = String(banner.value);
            }
            
            // If it has an id, preserve it (existing banner)
            if ('id' in banner && typeof banner.id === 'string' && banner.id) {
              return { id: banner.id, value: extractedValue };
            }
            return { value: extractedValue };
          } else {
            // Fallback: try to extract value from object
            extractedValue = String(banner);
          }
          
          return { value: extractedValue };
        });
        // This method will add new banners and keep existing ones
        await this.updateExhibitorBoothBanner(id, normalizedBanners);
      }
      
      // Return formatted response (same format as getExhibitorById)
      return await this.getExhibitorById(id);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException ||
        error instanceof ForbiddenException
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
      ExhibitorFileUtils.deleteExhibitorFiles(exhibitor, this.errorHandler);

      await this.exhibitorRepository.remove(exhibitor);
      return { message: 'Exhibitor deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor deletion');
    }
  }

  async updateExhibitorFlyers(
    id: string,
    flyers: Array<{ id?: string; name: string; flyer: string }>,
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // Always generate unique IDs for all flyers (required field)
      const { v4: uuidv4 } = require('uuid');
      const flyersWithIds: Array<{ id: string; name: string; flyer: string }> = flyers.map(flyer => ({
        name: flyer.name,
        flyer: flyer.flyer,
        id: flyer.id || uuidv4(), // Always ensure ID exists (generate if not provided)
      }));

      exhibitor.flyers = flyersWithIds;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor flyers update');
    }
  }

  async updateExhibitorDocuments(
    id: string,
    documents: Array<{ id?: string; name: string; document: string }>,
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // Always generate unique IDs for all documents (required field)
      const { v4: uuidv4 } = require('uuid');
      const documentsWithIds: Array<{ id: string; name: string; document: string }> = documents.map(doc => ({
        name: doc.name,
        document: doc.document,
        id: doc.id || uuidv4(), // Always ensure ID exists (generate if not provided)
      }));

      exhibitor.documents = documentsWithIds;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor documents update');
    }
  }

  /**
   * Update booth banners for an exhibitor
   * Adds new banners to existing ones (does not replace)
   * Only deletes banners that are explicitly removed (not in the new list)
   */
  async updateExhibitorBoothBanner(
    id: string,
    boothBanners: Array<{ id?: string; value: string }>,
  ): Promise<void> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ 
        where: { id },
        relations: ['boothBanners'],
      });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // Get existing banners with their IDs
      const existingBanners = exhibitor.boothBanners || [];
      const existingBannerMap = new Map(
        existingBanners.map(bb => [bb.id, bb.banner])
      );
      
      // Separate existing banners (with IDs) from new banners (without IDs)
      const bannersToKeep: Array<{ id: string; value: string }> = [];
      const newBannersToAdd: Array<{ value: string }> = [];
      
      boothBanners.forEach(banner => {
        if (banner.id && existingBannerMap.has(banner.id)) {
          // This is an existing banner, keep it
          bannersToKeep.push({ id: banner.id, value: banner.value });
        } else {
          // This is a new banner, add it
          newBannersToAdd.push({ value: banner.value });
        }
      });

      // Get banners that should be deleted (existing banners not in the keep list)
      const bannersToDelete = existingBanners.filter(bb => {
        return !bannersToKeep.some(keep => keep.id === bb.id);
      });

      // Delete files for removed banners (only files, not URLs)
      const fs = require('fs');
      const path = require('path');
      
      for (const bannerToDelete of bannersToDelete) {
        // Only delete if it's a file path (starts with uploads/), not a URL
        if (bannerToDelete.banner && bannerToDelete.banner.startsWith('uploads/')) {
          const fullPath = path.join(__dirname, '..', '..', bannerToDelete.banner);
          try {
            // Use safe deletion with retry logic
            await this.deleteFileSafely(fullPath);
          } catch (error: any) {
            // Log but don't throw - file deletion is not critical
            const fileExists = fs.existsSync(fullPath);
            if (fileExists) {
              console.error(`Failed to delete removed booth banner file after retries: ${bannerToDelete.banner}`, error);
            }
          }
        }
      }

      // Delete removed banners from database
      if (bannersToDelete.length > 0) {
        await this.boothBannerRepository.remove(bannersToDelete);
      }

      // Create new booth banners (only add new ones, existing ones are already in DB)
      if (newBannersToAdd.length > 0) {
        const bannersToCreate = newBannersToAdd.map(banner => {
          // Extract the actual string value, handling cases where value might be nested or stringified
          let bannerValue: string;
          if (typeof banner.value === 'string') {
            // Check if it's a JSON stringified object
            try {
              const parsed = JSON.parse(banner.value);
              if (parsed && typeof parsed === 'object' && parsed.value) {
                bannerValue = parsed.value; // Extract value from parsed object
              } else {
                bannerValue = banner.value; // It's already a string
              }
            } catch {
              bannerValue = banner.value; // Not JSON, use as is
            }
          } else {
            bannerValue = String(banner.value);
          }
          
          return this.boothBannerRepository.create({
            exhibitorId: id,
            banner: bannerValue, // Store only the path string, not the object
          });
        });
        await this.boothBannerRepository.save(bannersToCreate);
      }
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor booth banner update');
    }
  }

  /**
   * Get booth banners for an exhibitor
   */
  async getExhibitorBoothBanners(exhibitorId: string): Promise<BoothBanner[]> {
    try {
      return await this.boothBannerRepository.find({
        where: { exhibitorId },
        order: { createdAt: 'ASC' },
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Get exhibitor booth banners');
      return [];
    }
  }

  /**
   * Delete a specific booth banner by ID
   */
  async deleteBoothBanner(bannerId: string, exhibitorId: string): Promise<void> {
    try {
      const banner = await this.boothBannerRepository.findOne({
        where: { id: bannerId, exhibitorId },
      });

      if (!banner) {
        throw new ResourceNotFoundException('Booth banner', bannerId);
      }

      // Delete file from filesystem if it's a file path
      if (banner.banner.startsWith('uploads/')) {
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(__dirname, '..', '..', banner.banner);
        try {
          // Use safe deletion with retry logic to ensure file is deleted from folder
          await this.deleteFileSafely(fullPath);
        } catch (fileError: any) {
          // If file still exists after all retries, log error but continue
          const fileExists = fs.existsSync(fullPath);
          if (fileExists) {
            console.error(`Failed to delete booth banner file after retries: ${banner.banner}`, fileError);
            this.errorHandler.logError(
              fileError,
              `File deletion failed for booth banner: ${banner.banner}. File may need manual deletion.`,
              undefined,
            );
          }
          // Continue with database deletion even if file deletion fails
        }
      }

      await this.boothBannerRepository.remove(banner);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Delete booth banner');
    }
  }

  /**
   * Delete all booth banners for an exhibitor
   */
  async deleteAllBoothBanners(exhibitorId: string): Promise<void> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({
        where: { id: exhibitorId },
        relations: ['boothBanners'],
      });

      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', exhibitorId);
      }

      const banners = exhibitor.boothBanners || [];
      
      if (banners.length === 0) {
        return; // No banners to delete
      }

      // Delete all files from filesystem (only files, not URLs)
      const fs = require('fs');
      const path = require('path');
      
      for (const banner of banners) {
        // Only delete if it's a file path (starts with uploads/), not a URL
        if (banner.banner && banner.banner.startsWith('uploads/')) {
          const fullPath = path.join(__dirname, '..', '..', banner.banner);
          try {
            // Use safe deletion with retry logic to ensure file is deleted from folder
            await this.deleteFileSafely(fullPath);
          } catch (fileError: any) {
            // Log but don't throw - file deletion is not critical
            const fileExists = fs.existsSync(fullPath);
            if (fileExists) {
              console.error(`Failed to delete booth banner file after retries: ${banner.banner}`, fileError);
              this.errorHandler.logError(
                fileError,
                `File deletion failed for booth banner: ${banner.banner}. File may need manual deletion.`,
                undefined,
              );
            }
          }
        }
      }

      // Delete all banners from database
      await this.boothBannerRepository.remove(banners);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Delete all booth banners');
    }
  }

  /**
   * Safely delete a file with retry logic for Windows file locking issues
   * Ensures file is deleted from filesystem even if there are permission issues
   */
  private async deleteFileSafely(filePath: string, retries = 5, delay = 200): Promise<void> {
    const fs = require('fs');
    const { promisify } = require('util');
    const unlinkAsync = promisify(fs.unlink);
    const accessAsync = promisify(fs.access);
    
    // First check if file exists
    try {
      await accessAsync(filePath, fs.constants.F_OK);
    } catch {
      // File doesn't exist, consider it already deleted
      return;
    }
    
    for (let i = 0; i < retries; i++) {
      try {
        // Try to delete the file
        await unlinkAsync(filePath);
        
        // Verify file is actually deleted
        try {
          await accessAsync(filePath, fs.constants.F_OK);
          // File still exists, continue to retry
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            continue;
          }
        } catch {
          // File successfully deleted (access check failed = file doesn't exist)
          return;
        }
      } catch (error: any) {
        // If it's the last retry, try one more aggressive approach
        if (i === retries - 1) {
          // Last attempt: try with chmod to remove read-only flag (Windows)
          try {
            const chmodAsync = promisify(fs.chmod);
            await chmodAsync(filePath, 0o666); // Make file writable
            await unlinkAsync(filePath);
            return;
          } catch (finalError: any) {
            // If still fails, throw the original error
            throw error;
          }
        }
        
        // If it's a permission error (EPERM) or file in use (EBUSY), wait and retry
        if (error.code === 'EPERM' || error.code === 'EBUSY' || error.code === 'EACCES' || error.code === 'ENOENT') {
          // ENOENT means file doesn't exist (already deleted), which is fine
          if (error.code === 'ENOENT') {
            return;
          }
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }
  }

  /**
   * Check if a user has permission to update an exhibitor
   * Used by guards to check permissions before file uploads
   */
  async canUserUpdateExhibitor(
    exhibitorId: string,
    userId: string,
    userEmail?: string,
  ): Promise<boolean> {
    try {
      const existingExhibitor = await this.getExhibitorEntityById(exhibitorId);
      let userCanUpdate = false;

      // Check if exhibitor email matches user email
      if (userEmail && existingExhibitor.email === userEmail) {
        userCanUpdate = true;
      }

      // If not found by email, check via EventStaff table
      if (!userCanUpdate && userId) {
        const { EventStaff } = await import('../event/event-staff.entity');
        const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

        const userStaffRecord = await eventStaffRepository.findOne({
          where: {
            exhibitorId: exhibitorId,
            userId: userId,
          },
        });

        if (userStaffRecord) {
          userCanUpdate = true;
        }
      }

      return userCanUpdate;
    } catch (error) {
      // If exhibitor not found or other error, return false
      return false;
    }
  }

  async updateExhibitorEventImages(
    id: string,
    eventImages: Array<{ id?: string; name: string; eventImage: string }>,
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // Always generate unique IDs for all event images (required field)
      const { v4: uuidv4 } = require('uuid');
      const eventImagesWithIds: Array<{ id: string; name: string; eventImage: string }> = eventImages.map(img => ({
        name: img.name,
        eventImage: img.eventImage,
        id: img.id || uuidv4(), // Always ensure ID exists (generate if not provided)
      }));

      exhibitor.eventImages = eventImagesWithIds;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor event images update');
    }
  }

  /**
   * Get all exhibitors with event-wise booth and staff information
   * Access: Admin and Exhibitor roles only
   * - If Exhibitor: Only show their own events
   * - If Admin: Show all exhibitors and all events
   */
  async getAllExhibitorsWithEventDetails(userId?: string, userRole?: string, userEmail?: string): Promise<any> {
    try {
      const { EventBooth } = await import('../event/event-booth.entity');
      const { EventStaff } = await import('../event/event-staff.entity');
      const { Event } = await import('../event/event.entity');

      const eventBoothRepository = this.exhibitorRepository.manager.getRepository(EventBooth);
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      const eventRepository = this.exhibitorRepository.manager.getRepository(Event);

      let exhibitors = [];

      // If user is Exhibitor, find their exhibitor record
      if (userRole === 'exhibitor' && userId) {
        // First try to find exhibitor by user email
        let exhibitor = null;
        if (userEmail) {
          exhibitor = await this.exhibitorRepository.findOne({
            where: { email: userEmail },
          });
        }
        
        // If not found by email, try to find via EventStaff table
        if (!exhibitor && userId) {
          const userStaffRecords = await eventStaffRepository.find({
            where: { userId: userId },
            relations: ['exhibitor'],
          });
          
          // Get unique exhibitor IDs from staff records
          const exhibitorIds = [...new Set(userStaffRecords.map(es => es.exhibitorId).filter(Boolean))];
          
          if (exhibitorIds.length > 0) {
            // Get the first exhibitor (or we could get all, but for exhibitor role, usually one)
            exhibitor = await this.exhibitorRepository.findOne({
              where: { id: exhibitorIds[0] },
            });
          }
        }
        
        if (exhibitor) {
          exhibitors = [exhibitor];
        } else {
          // No exhibitor found for this user
          return {
            memberStaff: [],
          };
        }
      } 
      // If Admin, show all exhibitors
      else {
        exhibitors = await this.exhibitorRepository.find({
        });
      }

      // Combine all memberStaff from relevant exhibitors into one array
      const allMemberStaff = [];

      for (const exhibitor of exhibitors) {
        const exhibitorData = await this.formatExhibitorWithEventDetails(
          exhibitor,
          eventBoothRepository,
          eventStaffRepository,
          eventRepository,
        );
        
        if (exhibitorData?.memberStaff && exhibitorData.memberStaff.length > 0) {
          // For non-admin users, filter to only show events where they are staff members
          if (userRole !== 'admin' && userId) {
            const filteredStaffData = exhibitorData.memberStaff.filter((staffEntry: any) => {
              // Check if the logged-in user is in the staffs array for this event
              const staffs = staffEntry?.eventBooth?.staffs || [];
              return staffs.some((staff: any) => staff.id === userId);
            });
            
            if (filteredStaffData.length > 0) {
              allMemberStaff.push(...filteredStaffData);
            }
          } else {
            // Admin sees all events
            allMemberStaff.push(...exhibitorData.memberStaff);
          }
        }
      }

      return {
        memberStaff: allMemberStaff || [],
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Exhibitors retrieval with event details');
    }
  }

  /**
   * Get exhibitor by ID with event-wise booth and staff information
   * Access: Admin and Exhibitor users only
   * Exhibitor users can only access their own exhibitor data
   */
  async getExhibitorByIdWithEventDetails(
    id: string,
    userId?: string,
    userRole?: string,
    userEmail?: string,
  ): Promise<any> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({
        where: { id },
      });

      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // If user is Exhibitor (not Admin), verify they can access this exhibitor
      if (userRole === 'exhibitor' && userId) {
        let userCanAccess = false;

        // Check if exhibitor email matches user email
        if (userEmail && exhibitor.email === userEmail) {
          userCanAccess = true;
        }

        // If not found by email, check via EventStaff table
        if (!userCanAccess && userId) {
          const { EventStaff } = await import('../event/event-staff.entity');
          const eventStaffRepository =
            this.exhibitorRepository.manager.getRepository(EventStaff);

          const userStaffRecord = await eventStaffRepository.findOne({
            where: {
              exhibitorId: id,
              userId: userId,
            },
          });

          if (userStaffRecord) {
            userCanAccess = true;
          }
        }

        // If user cannot access this exhibitor, throw forbidden error
        if (!userCanAccess) {
          throw new ForbiddenException(
            'You do not have permission to access this exhibitor data',
          );
        }
      }

      const { EventBooth } = await import('../event/event-booth.entity');
      const { EventStaff } = await import('../event/event-staff.entity');
      const { Event } = await import('../event/event.entity');

      const eventBoothRepository = this.exhibitorRepository.manager.getRepository(EventBooth);
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      const eventRepository = this.exhibitorRepository.manager.getRepository(Event);

      return await this.formatExhibitorWithEventDetails(
        exhibitor,
        eventBoothRepository,
        eventStaffRepository,
        eventRepository,
      );
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor retrieval by ID with event details');
    }
  }

  /**
   * Format exhibitor with event-wise booth and staff information
   */
  private async formatExhibitorWithEventDetails(
    exhibitor: Exhibitor,
    eventBoothRepository: Repository<any>,
    eventStaffRepository: Repository<any>,
    eventRepository: Repository<any>,
  ): Promise<any> {
    // Get all event booths for this exhibitor
    const eventBooths = await eventBoothRepository.find({
      where: { exhibitorId: exhibitor.id },
      relations: ['event'],
    });

    // Get all event staff for this exhibitor
    const eventStaffs = await eventStaffRepository.find({
      where: { exhibitorId: exhibitor.id },
      relations: ['user', 'event'],
    });

    // Get all unique event IDs
    const eventIds = new Set<string>();
    eventBooths.forEach(booth => eventIds.add(booth.eventId));
    eventStaffs.forEach(staff => eventIds.add(staff.eventId));

    // Fetch all events at once
    const events = await eventRepository.find({
      where: Array.from(eventIds).map(id => ({ id })),
    });

    // Create event lookup map
    const eventLookup = new Map<string, any>();
    events.forEach(event => eventLookup.set(event.id, event));

    // Build memberStaff array - one entry per event booth
    const memberStaff = [];

    // Process each event booth
    for (const booth of eventBooths) {
      const eventId = booth.eventId;
      const event = eventLookup.get(eventId) || booth.event;
      
      // Get staff members for this specific event
      const filteredEventStaffs = eventStaffs.filter(es => es.eventId === eventId && es.user);
      const eventStaffMembers = ExhibitorUtils.formatEventStaff(filteredEventStaffs);

      // Remove duplicates from staff members
      const uniqueStaffMembers = Array.from(
        new Map(eventStaffMembers.map((staff) => [staff.id, staff])).values()
      );

      memberStaff.push({
        eventBooth: {
          event: {
            id: event?.id || eventId,
            name: event?.name || 'Unknown Event',
            startDate: event?.startDate || null,
            endDate: event?.endDate || null,
            location: event?.location || null,
            venue: event?.venue || null,
          },
          company: {
            id: exhibitor.id,
            companyName: exhibitor.companyName,
            email: exhibitor.email,
            mobile: exhibitor.mobile,
            uen: exhibitor.uen,
            logo: exhibitor.logo,
            booth: booth.uniqueCode || null,
          },
          staffs: uniqueStaffMembers,
        },
      });
    }

    // Also include events that have staff but no booth
    const eventsWithStaffOnly = new Set<string>();
    eventStaffs.forEach(staff => {
      const hasBooth = eventBooths.some(booth => booth.eventId === staff.eventId);
      if (!hasBooth) {
        eventsWithStaffOnly.add(staff.eventId);
      }
    });

    for (const eventId of eventsWithStaffOnly) {
      const event = eventLookup.get(eventId);
      
      // Get staff members for this specific event
      const filteredEventStaffs = eventStaffs.filter(es => es.eventId === eventId && es.user);
      const eventStaffMembers = ExhibitorUtils.formatEventStaff(filteredEventStaffs);

      // Remove duplicates from staff members
      const uniqueStaffMembers = Array.from(
        new Map(eventStaffMembers.map((staff) => [staff.id, staff])).values()
      );

      memberStaff.push({
        eventBooth: {
          event: {
            id: event?.id || eventId,
            name: event?.name || 'Unknown Event',
            startDate: event?.startDate || null,
            endDate: event?.endDate || null,
            location: event?.location || null,
            venue: event?.venue || null,
          },
          company: {
            id: exhibitor.id,
            companyName: exhibitor.companyName,
            email: exhibitor.email,
            mobile: exhibitor.mobile,
            uen: exhibitor.uen,
            logo: exhibitor.logo,
            booth: null,
          },
          staffs: uniqueStaffMembers,
        },
      });
    }

    // Always return memberStaff as an array, even if empty
    return {
      memberStaff: memberStaff || [],
    };
  }

  /**
   * Get staff member user details
   * Only allows access if logged-in user and requested staff member are in the same event(s)
   */
  async getStaffMemberUserDetails(
    staffUserId: string,
    loggedInUserId: string,
    loggedInUserRole?: string,
  ): Promise<any> {
    try {
      // Import UserEntity and EventStaff
      const { UserEntity } = await import('../user/users.entity');
      const { EventStaff } = await import('../event/event-staff.entity');
      const { UserUtils } = await import('../utils/user.utils');

      const userRepository = this.exhibitorRepository.manager.getRepository(UserEntity);
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

      // Get the staff member user - only basic fields needed
      const staffUser = await userRepository.findOne({
        where: { id: staffUserId },
        select: ['id', 'firstName', 'lastName', 'email', 'mobile', 'profilePicture', 'role', 'createdAt'],
      });

      if (!staffUser) {
        throw new ResourceNotFoundException('User', staffUserId);
      }

      // For non-admin users, verify they are in the same event(s)
      if (loggedInUserRole !== 'admin' && loggedInUserId) {
        // Get all events where logged-in user is a staff member
        const loggedInUserEvents = await eventStaffRepository.find({
          where: { userId: loggedInUserId },
          select: ['eventId', 'exhibitorId'],
        });

        // Get all events where requested staff member is a staff member
        const staffUserEvents = await eventStaffRepository.find({
          where: { userId: staffUserId },
          select: ['eventId', 'exhibitorId'],
        });

        // Check if they share at least one common event
        const loggedInUserEventIds = new Set(
          loggedInUserEvents.map((es) => `${es.eventId}_${es.exhibitorId}`),
        );
        const hasCommonEvent = staffUserEvents.some(
          (es) => loggedInUserEventIds.has(`${es.eventId}_${es.exhibitorId}`),
        );

        if (!hasCommonEvent) {
          throw new ForbiddenException(
            'You do not have permission to view this staff member. You must be in the same event.',
          );
        }
      }

      // Return only basic user details
      return {
        id: staffUser.id,
        firstName: staffUser.firstName,
        lastName: staffUser.lastName,
        email: staffUser.email,
        mobile: staffUser.mobile || null,
        profilePicture: staffUser.profilePicture || null,
        role: staffUser.role,
        createdAt: staffUser.createdAt,
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Staff member user details retrieval');
    }
  }

  /**
   * Get all events where logged-in user is an exhibitor (staff member)
   * Returns all events regardless of company/exhibitor with full event details
   */
  async getUserExhibitorEvents(userId: string, userRole?: string): Promise<any> {
    try {
      const { EventStaff } = await import('../event/event-staff.entity');

      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

      // Get all EventStaff records for this user
      const userStaffRecords = await eventStaffRepository.find({
        where: { userId: userId },
        relations: ['event', 'exhibitor'],
      });

      if (!userStaffRecords || userStaffRecords.length === 0) {
        return {
          events: [],
        };
      }

      // Get all unique event IDs
      const uniqueEventIds = [...new Set(userStaffRecords.map(es => es.eventId).filter(Boolean))];
      
      // Fetch full event details for each unique event using EventService
      const eventDetailsMap = new Map<string, any>();
      await Promise.all(
        uniqueEventIds.map(async (eventId) => {
          try {
            const fullEventDetails = await this.eventService.getEventById(eventId, userId, userRole);
            eventDetailsMap.set(eventId, fullEventDetails);
          } catch (error) {
            // If event not found or error, skip it
            console.warn(`Failed to fetch event details for eventId ${eventId}:`, error);
          }
        })
      );

      // Build events array with full event details only
      const eventsList = [];
      const processedEventIds = new Set<string>(); // Track processed event IDs

      for (const eventStaff of userStaffRecords) {
        const eventId = eventStaff.eventId;

        // Skip if already processed (same event)
        if (processedEventIds.has(eventId)) continue;
        processedEventIds.add(eventId);

        const fullEventDetails = eventDetailsMap.get(eventId);
        if (!fullEventDetails) continue;

        // Return only full event details without additional company/staff info
        eventsList.push(fullEventDetails);
      }

      return {
        events: eventsList,
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'User exhibitor events retrieval');
    }
  }

  /**
   * Get simplified list of events for report (where user is staff member)
   * Returns only: id, name, date, location
   */
  async getReportEventsList(userId: string): Promise<any> {
    try {
      const { EventStaff } = await import('../event/event-staff.entity');
      const { Event } = await import('../event/event.entity');

      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      const eventRepository = this.exhibitorRepository.manager.getRepository(Event);

      // Get all EventStaff records for this user
      const userStaffRecords = await eventStaffRepository.find({
        where: { userId: userId },
      });

      if (!userStaffRecords || userStaffRecords.length === 0) {
        return {
          events: [],
        };
      }

      // Get all unique event IDs
      const uniqueEventIds = [...new Set(userStaffRecords.map(es => es.eventId).filter(Boolean))];
      
      // Fetch events with only required fields
      const events = await eventRepository.find({
        where: uniqueEventIds.map(id => ({ id })),
        select: ['id', 'name', 'startDate', 'endDate', 'location'],
      });

      // Format events to simple structure
      const eventsList = events.map(event => ({
        id: event.id,
        name: event.name,
      }));

      return {
        events: eventsList,
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Report events list retrieval');
    }
  }

  /**
   * Get event statistics for report
   * Returns: event name, likes count, monthly views, downloads count, total leads
   */
  async getEventReportStatistics(eventId: string, userId: string): Promise<any> {
    try {
      const { EventStaff } = await import('../event/event-staff.entity');
      const { Event } = await import('../event/event.entity');
      const { FavoriteEvent } = await import('../favorite-event/favorite-event.entity');
      const { RegisterEvent } = await import('../registerEvent/registerEvent.entity');
      const { EventAttendance } = await import('../attendance/attendance.entity');
      const { ExhibitorStamp } = await import('../attendance/exhibitor-stamp.entity');

      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      const eventRepository = this.exhibitorRepository.manager.getRepository(Event);
      const favoriteEventRepository = this.exhibitorRepository.manager.getRepository(FavoriteEvent);
      const registerEventRepository = this.exhibitorRepository.manager.getRepository(RegisterEvent);
      const attendanceRepository = this.exhibitorRepository.manager.getRepository(EventAttendance);
      const exhibitorStampRepository = this.exhibitorRepository.manager.getRepository(ExhibitorStamp);

      // Verify user is staff member for this event
      const userStaffRecord = await eventStaffRepository.findOne({
        where: {
          eventId: eventId,
          userId: userId,
        },
      });

      if (!userStaffRecord) {
        throw new ForbiddenException('You do not have permission to view statistics for this event');
      }

      // Get event details
      const event = await eventRepository.findOne({
        where: { id: eventId },
        select: ['id', 'name', 'startDate', 'endDate'],
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Get total leads collected for this event (from ExhibitorLead)
      const totalLeadsCount = await this.exhibitorLeadRepository.count({
        where: { eventId: eventId },
      });

      // Get leads collected by staff (for bar chart)
      const leadsByStaff = await this.exhibitorLeadRepository
        .createQueryBuilder('lead')
        .select('lead.scannedBy', 'staffId')
        .addSelect('COUNT(*)', 'count')
        .where('lead.eventId = :eventId', { eventId })
        .groupBy('lead.scannedBy')
        .getRawMany();

      // Get all staff members for this event to map staff IDs to names
      const allStaff = await eventStaffRepository.find({
        where: { eventId: eventId },
        relations: ['user'],
      });

      // Map leads by staff with staff names
      const leadsByStaffData = leadsByStaff.map((item, index) => {
        const staff = allStaff.find((s) => s.userId === item.staffId);
        return {
          staffId: item.staffId,
          staffName: staff?.user?.firstName && staff?.user?.lastName
            ? `${staff.user.firstName} ${staff.user.lastName}`
            : `Staff ${index + 1}`,
          count: parseInt(item.count),
        };
      }).sort((a, b) => b.count - a.count); // Sort by count descending for display

      // Get total stamps issued for this event
      const stampsIssued = await exhibitorStampRepository.count({
        where: { eventId: eventId },
      });

      // Get total number of registered attendees for percentage calculation
      // Formula: (Total Leads / Total Registered Attendees) * 100
      // Example: If 5 leads out of 5 registered attendees = 100%
      // Example from image: If 86 leads out of ~782 registered attendees = 11%
      const totalAttendees = await registerEventRepository.count({
        where: {
          eventId: eventId,
          type: 'Attendee',
          isRegister: true,
        },
      });

      // Calculate leads collected percentage: (Total Leads / Total Registered Attendees) * 100
      // Round to 1 decimal place (e.g., 11.0%)
      // Formula: If 86 leads and 782 attendees = 86/782 * 100 = 11.0%
      // Example: If 5 leads and 5 attendees = 5/5 * 100 = 100.0%
      const leadsCollectedPercentage = totalAttendees > 0
        ? parseFloat(((totalLeadsCount / totalAttendees) * 100).toFixed(1))
        : 0;

      // Get total view count for this event (from ExhibitorView)
      const totalViewCount = await this.exhibitorViewRepository.count({
        where: { eventId: eventId, isActive: true },
      });

      // Get view count over time (grouped by date) for line chart
      const views = await this.exhibitorViewRepository.find({
        where: { eventId: eventId, isActive: true },
        select: ['createdAt'],
        order: { createdAt: 'ASC' },
      });

      // Group views by date and track first timestamp for each date
      // Use ISO timestamp format for dates
      const viewCountByDate: { [key: string]: { count: number; firstTimestamp: Date } } = {};
      views.forEach((view) => {
        const FormattedDate = new Date(view.createdAt);
        // Format date to YYYY-MM-DD for grouping (without time)
     
        if (!viewCountByDate[FormattedDate.toString()]) {
          viewCountByDate[FormattedDate.toString()] = {
            count: 0,
            firstTimestamp: FormattedDate,
          };
        }
        viewCountByDate[FormattedDate.toString()].count += 1;
      });

      // Convert to array format for line chart (daily counts, not cumulative)
      // Sort dates properly and format as ISO timestamp
      const viewCountChartData = Object.keys(viewCountByDate)
        .sort((a, b) => {
          const dateA = new Date(a);
          const dateB = new Date(b);
          return dateA.getTime() - dateB.getTime();
        }) // ISO date strings sort naturally
        .map((dateKey) => {
          const viewData = viewCountByDate[dateKey];
          return {
            date: viewData.firstTimestamp.toISOString(), // Format: "2026-01-12T08:38:43.503Z"
            count: viewData.count,
          };
        });

      // Get average rating score for this event (from ExhibitorRating)
      const ratings = await this.exhibitorRatingRepository.find({
        where: { eventId: eventId, isActive: true },
        select: ['rating'],
      });

      let ratingScore = 0;
      if (ratings.length > 0) {
        const totalRating = ratings.reduce((sum, r) => sum + parseFloat(String(r.rating)), 0);
        ratingScore = parseFloat((totalRating / ratings.length).toFixed(1));
      } else {
        ratingScore = 0; // No ratings yet
      }

      return {
        leadsCollected: {
          totalLeadsCount,
          leadsCollectedPercentage,
          stampsIssued,
          leadsByStaff: leadsByStaffData,
        },
        boothProfileStatistics: {
          totalViewCount,
          ratingScore,
          viewCountOverTime: viewCountChartData,
        },
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event report statistics retrieval');
    }
  }

  /**
   * Scan attendee QR code and collect lead for exhibitor
   * @param qrCodeId QR code identifier (user ID) - actual user ID
   * @param eventId Event ID where the lead is being collected
   * @param exhibitorId Exhibitor ID who is collecting the lead
   * @param scannedBy User ID of the exhibitor staff member who scanned
   * @param notes Optional notes about the lead
   * @returns Lead information with attendee contact details
   */
  async scanAttendeeQRCodeForLead(
    qrCodeId: string,
    eventId: string,
    exhibitorId: string,
    scannedBy: string,
    notes?: string,
  ): Promise<any> {
    try {
      // QR code ID is the actual user ID
      const userId = qrCodeId;

      // Get attendee (user) data
      const attendee = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!attendee) {
        throw new ResourceNotFoundException('Attendee', userId);
      }

      // Check if the user being scanned is an exhibitor - exhibitors cannot be scanned as leads
      if (attendee.role === UserRole.Exhibitor) {
        throw new BadRequestException('Exhibitors cannot be scanned as leads. Only attendees can be scanned.');
      }

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Check if attendee is registered for this event
      const { RegisterEvent } = await import('../registerEvent/registerEvent.entity');
      const registerEventRepository = this.exhibitorRepository.manager.getRepository(RegisterEvent);
      
      const registration = await registerEventRepository.findOne({
        where: {
          userId: userId,
          eventId: eventId,
          isRegister: true,
        },
      });

      if (!registration) {
        throw new BadRequestException('Attendee is not registered for this event');
      }

      // Verify exhibitor exists
      const exhibitor = await this.exhibitorRepository.findOne({
        where: { id: exhibitorId },
      });

      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', exhibitorId);
      }

      // Check if exhibitor is associated with this event
      const { EventExhibitor } = await import('../event/event.entity');
      const { EventBooth } = await import('../event/event-booth.entity');
      const eventExhibitorRepository = this.exhibitorRepository.manager.getRepository(EventExhibitor);
      const eventBoothRepository = this.exhibitorRepository.manager.getRepository(EventBooth);

      // Check via EventExhibitor table
      const eventExhibitor = await eventExhibitorRepository.findOne({
        where: {
          eventId: eventId,
          exhibitorId: exhibitorId,
        },
      });

      // Check via EventBooth table
      const eventBooth = await eventBoothRepository.findOne({
        where: {
          eventId: eventId,
          exhibitorId: exhibitorId,
        },
      });

      if (!eventExhibitor && !eventBooth) {
        throw new ForbiddenException('Exhibitor is not associated with this event');
      }

      // Verify scanner (exhibitor staff) exists
      const scanner = await this.userRepository.findOne({
        where: { id: scannedBy },
      });

      if (!scanner) {
        throw new ResourceNotFoundException('Scanner', scannedBy);
      }

      // Verify scanner is staff member for this exhibitor at this event
      const { EventStaff } = await import('../event/event-staff.entity');
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

      const staffRecord = await eventStaffRepository.findOne({
        where: {
          userId: scannedBy,
          exhibitorId: exhibitorId,
          eventId: eventId,
        },
      });

      if (!staffRecord) {
        throw new ForbiddenException('You do not have permission to collect leads for this exhibitor at this event');
      }

      // Check if lead already exists for this exhibitor-attendee-event combination
      const existingLead = await this.exhibitorLeadRepository.findOne({
        where: {
          exhibitorId: exhibitorId,
          attendeeId: userId,
          eventId: eventId,
        },
      });

      if (existingLead) {
        // Return existing lead information
        return {
          success: true,
          message: 'Lead already collected for this attendee',
          data: {
            lead: {
              id: existingLead.id,
              collectedAt: existingLead.createdAt,
            },
            attendee: {
              id: attendee.id,
              firstName: attendee.firstName,
              lastName: attendee.lastName,
              email: attendee.email,
              mobile: attendee.mobile,
              company: attendee.company,
              designation: attendee.designation,
              profilePicture: attendee.profilePicture,
            },
            event: {
              id: event.id,
              name: event.name,
            },
            exhibitor: {
              id: exhibitor.id,
              companyName: exhibitor.companyName,
            },
            isNewLead: false,
          },
        };
      }

      // Create new lead
      const lead = this.exhibitorLeadRepository.create({
        exhibitorId: exhibitorId,
        attendeeId: userId,
        eventId: eventId,
        scannedBy: scannedBy,
        notes: notes || undefined,
      });

      const savedLead = await this.exhibitorLeadRepository.save(lead);

      return {
        success: true,
        message: 'Lead collected successfully',
        data: {
          lead: {
            id: savedLead.id,
            collectedAt: savedLead.createdAt,
          },
          attendee: {
            id: attendee.id,
            firstName: attendee.firstName,
            lastName: attendee.lastName,
            email: attendee.email,
            mobile: attendee.mobile,
            company: attendee.company,
            designation: attendee.designation,
            profilePicture: attendee.profilePicture,
          },
          event: {
            id: event.id,
            name: event.name,
          },
          exhibitor: {
            id: exhibitor.id,
            companyName: exhibitor.companyName,
          },
          isNewLead: true,
        },
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Attendee QR code scanning for lead collection');
    }
  }

  /**
   * Get current event ID for a user from their current association
   * @param userId User ID
   * @returns Event ID or null if no current association
   */
  async getCurrentEventIdForUser(userId: string): Promise<string | null> {
    try {
      const { EventStaff } = await import('../event/event-staff.entity');
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      
      const currentEventStaff = await eventStaffRepository.findOne({
        where: {
          userId: userId,
          isCurrent: true,
        },
      });

      return currentEventStaff ? currentEventStaff.eventId : null;
    } catch (error) {
      this.errorHandler.logError(error, 'Get current event ID for user', userId);
      return null;
    }
  }

  /**
   * Manually create a lead entry for an attendee by user ID
   * Allows exhibitor to manually enter attendee by user ID as a lead
   * Exhibitor ID is automatically determined from the logged-in user's current association
   * @param eventId Event ID where the lead is being collected
   * @param attendeeId User ID of the attendee
   * @param scannedBy User ID of the exhibitor staff member who is creating the lead
   * @param notes Optional notes about the lead
   * @returns Lead information
   */
  async createManualLead(
    eventId: string,
    attendeeId: string,
    scannedBy: string,
    notes?: string,
  ): Promise<any> {
    try {
      // Get the exhibitor from the logged-in user's EventStaff association for this event
      const { EventStaff } = await import('../event/event-staff.entity');
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      
      const currentEventStaff = await eventStaffRepository.findOne({
        where: {
          userId: scannedBy,
          eventId: eventId,
        },
      });

      if (!currentEventStaff) {
        throw new ForbiddenException('You are not associated with this event as an exhibitor staff member');
      }

      const exhibitorId = currentEventStaff.exhibitorId;
      const isCurrent = currentEventStaff.isCurrent;

      // Get booth details ONLY if isCurrent is true
      // When isCurrent is true, always include exhibitorBooth field in response (default data)
      let exhibitorBooth: any = undefined; // Use undefined so field is not included when false
      if (isCurrent) {
        const { EventBooth } = await import('../event/event-booth.entity');
        const eventBoothRepository = this.exhibitorRepository.manager.getRepository(EventBooth);
        
        const eventBooth = await eventBoothRepository.findOne({
          where: {
            eventId: eventId,
            exhibitorId: exhibitorId,
          },
        });

        // Always set exhibitorBooth when isCurrent is true (default data)
        // If booth exists, include details; if not, set to null but field will still be included
        exhibitorBooth = eventBooth ? {
          id: eventBooth.id,
          uniqueCode: eventBooth.uniqueCode,
          isActive: eventBooth.isActive,
        } : null;
      }

      // Get attendee (user) data
      const attendee = await this.userRepository.findOne({
        where: { id: attendeeId },
      });

      if (!attendee) {
        throw new ResourceNotFoundException('Attendee', attendeeId);
      }

      // Check if the user being scanned is an exhibitor - exhibitors cannot be scanned as leads
      if (attendee.role === UserRole.Exhibitor) {
        throw new BadRequestException('Exhibitors cannot be scanned as leads. Only attendees can be scanned.');
      }

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Check if attendee is registered for this event
      const { RegisterEvent } = await import('../registerEvent/registerEvent.entity');
      const registerEventRepository = this.exhibitorRepository.manager.getRepository(RegisterEvent);
      
      const registration = await registerEventRepository.findOne({
        where: {
          userId: attendeeId,
          eventId: eventId,
          isRegister: true,
        },
      });

      if (!registration) {
        throw new BadRequestException('Attendee is not registered for this event');
      }

      // Verify exhibitor exists
      const exhibitor = await this.exhibitorRepository.findOne({
        where: { id: exhibitorId },
      });

      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', exhibitorId);
      }

      // We already verified the exhibitor is associated with this event through EventStaff
      // No need to check again

      // Verify scanner (exhibitor staff) exists
      const scanner = await this.userRepository.findOne({
        where: { id: scannedBy },
      });

      if (!scanner) {
        throw new ResourceNotFoundException('Scanner', scannedBy);
      }

      // We already verified the scanner is staff member through currentEventStaff check above
      // No need to check again

      // Check if lead already exists for this exhibitor-attendee-event combination
      const existingLead = await this.exhibitorLeadRepository.findOne({
        where: {
          exhibitorId: exhibitorId,
          attendeeId: attendeeId,
          eventId: eventId,
        },
      });

      if (existingLead) {
        // Throw error if lead already exists
        throw new ConflictException('Lead already collected for this attendee');
      }

      // Create new manual lead
      const lead = this.exhibitorLeadRepository.create({
        exhibitorId: exhibitorId,
        attendeeId: attendeeId,
        eventId: eventId,
        scannedBy: scannedBy,
        notes: notes || undefined,
      });

      const savedLead = await this.exhibitorLeadRepository.save(lead);

      // Build response matching GET response structure
      return {
        success: true,
        message: 'Lead created successfully',
        data: {
          id: savedLead.id,
          attendee: {
            id: attendee.id,
            firstName: attendee.firstName,
            lastName: attendee.lastName,
            email: attendee.email,
            mobile: attendee.mobile,
            company: attendee.company,
            designation: attendee.designation,
            profilePicture: attendee.profilePicture,
          },
          event: {
            id: event.id,
            name: event.name,
          },
          exhibitor: {
            id: exhibitor.id,
            companyName: exhibitor.companyName,
          },
          scanner: {
            id: scanner.id,
            firstName: scanner.firstName,
            lastName: scanner.lastName,
            email: scanner.email,
          },
          notes: savedLead.notes || null,
          collectedAt: savedLead.createdAt,
          updatedAt: savedLead.updatedAt,
        },
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Manual lead creation');
    }
  }

  /**
   * Get all leads
   * - For Exhibitor role: Automatically shows all leads for their company (no exhibitorId needed)
   * - For Admin role: Shows all leads, or filter by exhibitorId if provided
   * Can filter by eventId, and supports pagination
   * @param exhibitorId Optional exhibitor ID (only for admin, exhibitor role doesn't need it)
   * @param eventId Optional event ID to filter leads
   * @param userId User ID making the request (for permission check)
   * @param userRole User role (for permission check)
   * @param filters Pagination and search filters
   * @returns List of leads with pagination
   */
  async getExhibitorLeads(
    exhibitorId: string | undefined,
    eventId: string | undefined,
    userId: string,
    userRole: string,
    filters: {
      page?: number;
      limit?: number;
      keyword?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<any> {
    try {
      let exhibitorIds: string[] = [];

      // Permission check: Exhibitor users can only access their own company's leads
      if (userRole === 'exhibitor') {
        // Get all exhibitor IDs where this user is a staff member
        const { EventStaff } = await import('../event/event-staff.entity');
        const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

        const staffRecords = eventId
          ? await eventStaffRepository.find({
              where: {
                userId: userId,
                eventId: eventId,
              },
              select: ['exhibitorId'],
            })
          : await eventStaffRepository.find({
              where: {
                userId: userId,
              },
              select: ['exhibitorId'],
            });

        if (!staffRecords || staffRecords.length === 0) {
          // Return empty result if user is not a staff member for any exhibitor
          return {
            data: [],
            pagination: {
              total: 0,
              page: filters.page || 1,
              limit: filters.limit || 10,
              totalPages: 0,
            },
          };
        }

        // Extract unique exhibitor IDs
        exhibitorIds = [...new Set(staffRecords.map(record => record.exhibitorId))];
      } else if (userRole === 'admin') {
        // Admin can see all leads, or filter by specific exhibitorId if provided
        if (exhibitorId) {
          // Verify exhibitor exists
          const exhibitor = await this.exhibitorRepository.findOne({
            where: { id: exhibitorId },
          });

          if (!exhibitor) {
            throw new ResourceNotFoundException('Exhibitor', exhibitorId);
          }
          exhibitorIds = [exhibitorId];
        }
        // If no exhibitorId provided, exhibitorIds remains empty array (will show all leads)
      }

      // Build query
      const queryBuilder = this.exhibitorLeadRepository
        .createQueryBuilder('lead')
        .leftJoinAndSelect('lead.attendee', 'attendee')
        .leftJoinAndSelect('lead.event', 'event')
        .leftJoinAndSelect('lead.exhibitor', 'exhibitor')
        .leftJoinAndSelect('lead.scanner', 'scanner')
        .where('lead.isActive = :isActive', { isActive: true });

      // Filter by exhibitor(s)
      if (userRole === 'exhibitor') {
        // Exhibitor users: only their company's leads
        if (exhibitorIds.length > 0) {
          queryBuilder.andWhere('lead.exhibitorId IN (:...exhibitorIds)', { exhibitorIds });
        } else {
          // No exhibitor IDs found, return empty result
          return {
            data: [],
            pagination: {
              total: 0,
              page: filters.page || 1,
              limit: filters.limit || 10,
              totalPages: 0,
            },
          };
        }
      } else if (userRole === 'admin' && exhibitorId) {
        // Admin with specific exhibitorId: filter by that exhibitor
        queryBuilder.andWhere('lead.exhibitorId = :exhibitorId', { exhibitorId });
      }
      // Admin without exhibitorId: show all leads (no additional filter)

      // Filter by event if provided
      if (eventId) {
        queryBuilder.andWhere('lead.eventId = :eventId', { eventId });
      }

      // Search filter - search in attendee fields
      if (filters.keyword) {
        const searchTerm = `%${filters.keyword}%`;
        queryBuilder.andWhere(
          '(attendee.firstName LIKE :search OR attendee.lastName LIKE :search OR attendee.email LIKE :search OR attendee.mobile LIKE :search OR attendee.company LIKE :search)',
          { search: searchTerm },
        );
      }

      // Sorting
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'DESC';
      
      // Map attendee fields to the correct relation path
      const attendeeSortFields = ['firstName', 'lastName', 'email', 'mobile', 'company', 'designation'];
      if (attendeeSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`attendee.${sortBy}`, sortOrder);
      } else {
        queryBuilder.orderBy(`lead.${sortBy}`, sortOrder);
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      queryBuilder.skip(skip).take(limit);

      // Execute query
      const [leads, total] = await queryBuilder.getManyAndCount();

      // Format response based on user role
      // For exhibitor role: show only attendee information
      // For admin role: show all information
      const formattedLeads = leads.map((lead) => {
        if (userRole === UserRole.Exhibitor) {
          // Exhibitor role: return only attendee information
          return {
            id: lead.id,
            attendee: {
              id: lead.attendeeId,
              firstName: lead.attendee?.firstName,
              lastName: lead.attendee?.lastName,
              email: lead.attendee?.email,
              mobile: lead.attendee?.mobile,
              company: lead.attendee?.company,
              designation: lead.attendee?.designation,
              profilePicture: lead.attendee?.profilePicture,
            },
            collectedAt: lead.createdAt,
          };
        } else {
          // Admin role: return all information
          return {
            id: lead.id,
            attendee: {
              id: lead.attendeeId,
              firstName: lead.attendee?.firstName,
              lastName: lead.attendee?.lastName,
              email: lead.attendee?.email,
              mobile: lead.attendee?.mobile,
              company: lead.attendee?.company,
              designation: lead.attendee?.designation,
              profilePicture: lead.attendee?.profilePicture,
            },
            event: {
              id: lead.eventId,
              name: lead.event?.name,
            },
            exhibitor: {
              id: lead.exhibitorId,
              companyName: lead.exhibitor?.companyName,
            },
            scanner: {
              id: lead.scannedBy,
              firstName: lead.scanner?.firstName,
              lastName: lead.scanner?.lastName,
              email: lead.scanner?.email,
            },
            notes: lead.notes,
            collectedAt: lead.createdAt,
            updatedAt: lead.updatedAt,
          };
        }
      });

      return {
        data: formattedLeads,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor leads retrieval');
    }
  }

  /**
   * Get lead by ID
   * Exhibitor users can only view leads from their own company
   * Admin users can view any lead
   * @param leadId Lead ID
   * @param userId User ID making the request (for permission check)
   * @param userRole User role (for permission check)
   * @returns Lead information
   */
  async getLeadById(
    leadId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    try {
      // Get lead with relations
      const lead = await this.exhibitorLeadRepository.findOne({
        where: { id: leadId, isActive: true },
        relations: ['attendee', 'event', 'exhibitor', 'scanner'],
      });

      if (!lead) {
        throw new ResourceNotFoundException('Lead', leadId);
      }

      // Permission check: Exhibitor users can only access their own company's leads
      if (userRole === 'exhibitor') {
        // Check if user is staff member for this exhibitor
        const { EventStaff } = await import('../event/event-staff.entity');
        const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

        const staffRecord = await eventStaffRepository.findOne({
          where: {
            userId: userId,
            exhibitorId: lead.exhibitorId,
          },
        });

        if (!staffRecord) {
          throw new ForbiddenException('You do not have permission to view this lead');
        }
      }
      // Admin users can view any lead (no additional check needed)

      // Format response
      return {
        id: lead.id,
        eventId: lead.eventId, // Add eventId at top level for easy identification
        attendee: {
          id: lead.attendeeId,
          firstName: lead.attendee?.firstName,
          lastName: lead.attendee?.lastName,
          email: lead.attendee?.email,
          mobile: lead.attendee?.mobile,
          company: lead.attendee?.company,
          designation: lead.attendee?.designation,
          profilePicture: lead.attendee?.profilePicture,
        },
        event: {
          id: lead.eventId,
          name: lead.event?.name,
        },
        exhibitor: {
          id: lead.exhibitorId,
          companyName: lead.exhibitor?.companyName,
        },
        scanner: {
          id: lead.scannedBy,
          firstName: lead.scanner?.firstName,
          lastName: lead.scanner?.lastName,
          email: lead.scanner?.email,
        },
        notes: lead.notes,
        collectedAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Lead retrieval by ID');
    }
  }

  /**
   * Update lead notes
   * Exhibitor users can only update leads from their own company
   * Admin users can update any lead
   * @param leadId Lead ID
   * @param notes Notes to update (can be null/empty to clear notes)
   * @param userId User ID making the request (for permission check)
   * @param userRole User role (for permission check)
   * @returns Updated lead information
   */
  async updateLeadNotes(
    leadId: string,
    notes: string | undefined,
    userId: string,
    userRole: string,
  ): Promise<any> {
    try {
      // Get lead with relations
      const lead = await this.exhibitorLeadRepository.findOne({
        where: { id: leadId, isActive: true },
        relations: ['attendee', 'event', 'exhibitor', 'scanner'],
      });

      if (!lead) {
        throw new ResourceNotFoundException('Lead', leadId);
      }

      // Permission check: Exhibitor users can only update their own company's leads
      if (userRole === 'exhibitor') {
        // Check if user is staff member for this exhibitor
        const { EventStaff } = await import('../event/event-staff.entity');
        const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

        const staffRecord = await eventStaffRepository.findOne({
          where: {
            userId: userId,
            exhibitorId: lead.exhibitorId,
          },
        });

        if (!staffRecord) {
          throw new ForbiddenException('You do not have permission to update this lead');
        }
      }
      // Admin users can update any lead (no additional check needed)

      // Update notes (allow null/empty string to clear notes)
      if (notes !== undefined) {
        lead.notes = notes.trim() || (null as any); // Allow null to clear notes
      }
      const updatedLead = await this.exhibitorLeadRepository.save(lead);

      // Format response
      return {
        id: updatedLead.id,
        eventId: updatedLead.eventId,
        attendee: {
          id: updatedLead.attendeeId,
          firstName: lead.attendee?.firstName,
          lastName: lead.attendee?.lastName,
          email: lead.attendee?.email,
          mobile: lead.attendee?.mobile,
          company: lead.attendee?.company,
          designation: lead.attendee?.designation,
          profilePicture: lead.attendee?.profilePicture,
        },
        event: {
          id: updatedLead.eventId,
          name: lead.event?.name,
        },
        exhibitor: {
          id: updatedLead.exhibitorId,
          companyName: lead.exhibitor?.companyName,
        },
        scanner: {
          id: updatedLead.scannedBy,
          firstName: lead.scanner?.firstName,
          lastName: lead.scanner?.lastName,
          email: lead.scanner?.email,
        },
        notes: updatedLead.notes,
        collectedAt: updatedLead.createdAt,
        updatedAt: updatedLead.updatedAt,
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Lead notes update');
    }
  }

  /**
   * Track exhibitor profile view count
   * One view per registered user per exhibitor per event
   * If user views same exhibitor in different event, it counts as separate view
   * If user views same exhibitor in same event multiple times, it only counts as 1 view
   * @param exhibitorId Exhibitor ID whose profile was viewed
   * @param eventId Event ID where the view occurred
   * @param userId User ID of the registered user who viewed
   * @returns View count information
   */
  async trackExhibitorView(
    exhibitorId: string,
    eventId: string,
    userId: string,
  ): Promise<any> {
    try {
      // Verify exhibitor exists
      const exhibitor = await this.exhibitorRepository.findOne({
        where: { id: exhibitorId },
      });

      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', exhibitorId);
      }

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Verify user exists and is registered
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user is registered for this event
      const { RegisterEvent } = await import('../registerEvent/registerEvent.entity');
      const registerEventRepository = this.exhibitorRepository.manager.getRepository(RegisterEvent);
      
      const registration = await registerEventRepository.findOne({
        where: {
          userId: userId,
          eventId: eventId,
          isRegister: true,
        },
      });

      if (!registration) {
        throw new BadRequestException('User must be registered for this event to view exhibitor profiles');
      }

      // Check if view already exists for this user-exhibitor-event combination
      const existingView = await this.exhibitorViewRepository.findOne({
        where: {
          userId: userId,
          exhibitorId: exhibitorId,
          eventId: eventId,
        },
      });

      let viewRecord;
      let isNewView = false;

      if (!existingView) {
        // Create new view record (first time this user views this exhibitor in this event)
        viewRecord = this.exhibitorViewRepository.create({
          userId: userId,
          exhibitorId: exhibitorId,
          eventId: eventId,
        });

        viewRecord = await this.exhibitorViewRepository.save(viewRecord);
        isNewView = true;
      } else {
        // View already exists, return existing record
        viewRecord = existingView;
        isNewView = false;
      }

      // Get total view count for this exhibitor in this event
      const totalViewCount = await this.exhibitorViewRepository.count({
        where: {
          exhibitorId: exhibitorId,
          eventId: eventId,
          isActive: true,
        },
      });

      return {
        success: true,
        message: isNewView ? 'View counted successfully' : 'View already recorded',
        data: {
          view: {
            id: viewRecord.id,
            viewedAt: viewRecord.createdAt,
          },
          exhibitor: {
            id: exhibitor.id,
            companyName: exhibitor.companyName,
          },
          event: {
            id: event.id,
            name: event.name,
          },
          totalViewCount,
          isNewView,
        },
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor view tracking');
    }
  }

  /**
   * Submit or update exhibitor rating
   * One rating per registered user per exhibitor per event
   * Rating value should be between 1.0 and 5.0
   * @param exhibitorId Exhibitor ID being rated
   * @param eventId Event ID where the rating is given
   * @param userId User ID of the registered user giving the rating
   * @param rating Rating value (1.0 to 5.0)
   * @param comment Optional comment/review
   * @returns Rating information
   */
  async submitExhibitorRating(
    exhibitorId: string,
    eventId: string,
    userId: string,
    rating: number,
    comment?: string,
  ): Promise<any> {
    try {
      // Validate rating value (1.0 to 5.0)
      if (rating < 1.0 || rating > 5.0) {
        throw new BadRequestException('Rating must be between 1.0 and 5.0');
      }

      // Verify exhibitor exists
      const exhibitor = await this.exhibitorRepository.findOne({
        where: { id: exhibitorId },
      });

      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', exhibitorId);
      }

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Verify user exists and is registered
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user is registered for this event
      const { RegisterEvent } = await import('../registerEvent/registerEvent.entity');
      const registerEventRepository = this.exhibitorRepository.manager.getRepository(RegisterEvent);
      
      const registration = await registerEventRepository.findOne({
        where: {
          userId: userId,
          eventId: eventId,
          isRegister: true,
        },
      });

      if (!registration) {
        throw new BadRequestException('User must be registered for this event to rate exhibitors');
      }

      // Check if rating already exists for this user-exhibitor-event combination
      const existingRating = await this.exhibitorRatingRepository.findOne({
        where: {
          userId: userId,
          exhibitorId: exhibitorId,
          eventId: eventId,
        },
      });

      let ratingRecord;
      let isNewRating = false;

      if (existingRating) {
        // Update existing rating
        existingRating.rating = rating;
        if (comment !== undefined) {
          existingRating.comment = comment || undefined;
        }
        ratingRecord = await this.exhibitorRatingRepository.save(existingRating);
        isNewRating = false;
      } else {
        // Create new rating
        ratingRecord = this.exhibitorRatingRepository.create({
          userId: userId,
          exhibitorId: exhibitorId,
          eventId: eventId,
          rating: rating,
          comment: comment || undefined,
        });

        ratingRecord = await this.exhibitorRatingRepository.save(ratingRecord);
        isNewRating = true;
      }

      // Get average rating for this exhibitor in this event
      const allRatings = await this.exhibitorRatingRepository.find({
        where: {
          exhibitorId: exhibitorId,
          eventId: eventId,
          isActive: true,
        },
        select: ['rating'],
      });

      let averageRating = 0;
      if (allRatings.length > 0) {
        const totalRating = allRatings.reduce((sum, r) => sum + parseFloat(String(r.rating)), 0);
        averageRating = parseFloat((totalRating / allRatings.length).toFixed(1));
      }

      return {
        success: true,
        message: isNewRating ? 'Rating submitted successfully' : 'Rating updated successfully',
        data: {
          rating: {
            id: ratingRecord.id,
            rating: parseFloat(String(ratingRecord.rating)),
            comment: ratingRecord.comment || null,
            submittedAt: ratingRecord.createdAt,
            updatedAt: ratingRecord.updatedAt,
          },
          exhibitor: {
            id: exhibitor.id,
            companyName: exhibitor.companyName,
          },
          event: {
            id: event.id,
            name: event.name,
          },
          averageRating,
          totalRatings: allRatings.length,
          isNewRating,
        },
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor rating submission');
    }
  }

  /**
   * Get ratings for an exhibitor in an event
   * Admin and Exhibitor can see all ratings
   * Regular users can only see their own rating
   * @param exhibitorId Exhibitor ID
   * @param eventId Event ID
   * @param userId User ID of the requesting user
   * @param userRole Role of the requesting user
   * @returns Rating information
   */
  async getExhibitorRatings(
    exhibitorId: string,
    eventId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    try {
      // Verify exhibitor exists
      const exhibitor = await this.exhibitorRepository.findOne({
        where: { id: exhibitorId },
      });

      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', exhibitorId);
      }

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Build query conditions
      const whereConditions: any = {
        exhibitorId: exhibitorId,
        eventId: eventId,
        isActive: true,
      };

      // Admin and Exhibitor can see all ratings
      // Regular users can only see their own rating
      const canSeeAllRatings = userRole === UserRole.Admin || userRole === UserRole.Exhibitor;
      
      if (!canSeeAllRatings) {
        // Regular user can only see their own rating
        whereConditions.userId = userId;
      }

      // Get ratings
      const ratings = await this.exhibitorRatingRepository.find({
        where: whereConditions,
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });

      // Get all ratings for average calculation (regardless of user role)
      const allRatings = await this.exhibitorRatingRepository.find({
        where: {
          exhibitorId: exhibitorId,
          eventId: eventId,
          isActive: true,
        },
        select: ['rating'],
      });

      // Calculate average rating from all ratings
      let averageRating = 0;
      if (allRatings.length > 0) {
        const totalRating = allRatings.reduce((sum, r) => sum + parseFloat(String(r.rating)), 0);
        averageRating = parseFloat((totalRating / allRatings.length).toFixed(1));
      }

      // Format ratings data
      const formattedRatings = ratings.map((rating) => ({
        id: rating.id,
        rating: parseFloat(String(rating.rating)),
        comment: rating.comment || null,
        user: {
          id: rating.user?.id,
          firstName: rating.user?.firstName || '',
          lastName: rating.user?.lastName || '',
          email: rating.user?.email || '',
          profilePicture: rating.user?.profilePicture || null,
        },
        submittedAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      }));

      // Get user's own rating (if exists)
      const userRating = ratings.find(r => r.userId === userId);
      const formattedUserRating = userRating ? {
        id: userRating.id,
        rating: parseFloat(String(userRating.rating)),
        comment: userRating.comment || null,
        submittedAt: userRating.createdAt,
        updatedAt: userRating.updatedAt,
      } : null;

      // For regular users, return single rating object instead of array
      // For Admin/Exhibitor, return array of all ratings
      // Build response data
      const responseData: any = {
        exhibitor: {
          id: exhibitor.id,
          companyName: exhibitor.companyName,
        },
        event: {
          id: event.id,
          name: event.name,
        },
        averageRating,
        totalRatings: allRatings.length,
      };

      if (canSeeAllRatings) {
        // Admin/Exhibitor: return array of all ratings and optionally their own rating
        responseData.ratings = formattedRatings;
        // Only include userRating if admin/exhibitor has their own rating
        if (formattedUserRating) {
          responseData.userRating = formattedUserRating;
        }
      } else {
        // Regular User: only return their own rating (single object, not array)
        responseData.rating = formattedUserRating;
      }

      return {
        success: true,
        message: canSeeAllRatings 
          ? 'All ratings retrieved successfully'
          : (formattedUserRating ? 'Your rating retrieved successfully' : 'No rating found'),
        data: responseData,
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Get exhibitor ratings');
    }
  }
}