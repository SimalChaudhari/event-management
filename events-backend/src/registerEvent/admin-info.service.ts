import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminInfo } from './admin-info.entity';
import { RegisterEvent } from './registerEvent.entity';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import {
  CreateAdminInfoDto,
  UpdateAdminInfoDto,
  BulkUploadAdminInfoDto,
  CsvRowData,
  BulkUpdateResponseDto,
  BulkAdminInfoItemDto,
} from './admin-info.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';
import { CsvUtils } from '../utils/csv-utils';
import * as fs from 'fs';

@Injectable()
export class AdminInfoService {
  constructor(
    @InjectRepository(AdminInfo)
    private readonly adminInfoRepository: Repository<AdminInfo>,
    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Create or update admin info for a registration
  // Accepts either registerEventId OR (eventId + userId)
  async createOrUpdateAdminInfo(
    createAdminInfoDto: CreateAdminInfoDto,
  ): Promise<AdminInfo> {
    try {
      let registerEventId: string;
      let registration;

      // Check which format is provided: registerEventId OR (eventId + userId)
      if (createAdminInfoDto.registerEventId) {
        // Method 1: Direct registerEventId provided
        registerEventId = createAdminInfoDto.registerEventId;
        registration = await this.registerEventRepository.findOne({
          where: { id: registerEventId },
        });
        if (!registration) {
          throw new ResourceNotFoundException(
            'Registration',
            registerEventId,
          );
        }
      } else if (createAdminInfoDto.eventId && createAdminInfoDto.userId) {
        // Method 2: eventId + userId provided (Admin-friendly)
        registration = await this.registerEventRepository.findOne({
          where: {
            eventId: createAdminInfoDto.eventId,
            userId: createAdminInfoDto.userId,
            isRegister: true,
          },
        });
        if (!registration) {
          throw new ResourceNotFoundException(
            'Registration',
            `Event: ${createAdminInfoDto.eventId}, User: ${createAdminInfoDto.userId}`,
          );
        }
        registerEventId = registration.id;
      } else {
        throw new ValidationException(
          'Either registerEventId OR (eventId + userId) must be provided',
        );
      }

      // Check if admin info already exists
      let adminInfo = await this.adminInfoRepository.findOne({
        where: { registerEventId },
      });

      // Prepare data for admin info (exclude eventId and userId as they're not in entity)
      const { eventId, userId, registerEventId: _, ...adminInfoData } = createAdminInfoDto;
      
      // Convert empty strings to undefined for proper null handling
      const cleanAdminInfoData = {
        tableNumber: adminInfoData.tableNumber && adminInfoData.tableNumber.trim() !== '' 
          ? adminInfoData.tableNumber.trim() 
          : undefined,
        dressCode: adminInfoData.dressCode && adminInfoData.dressCode.trim() !== '' 
          ? adminInfoData.dressCode.trim() 
          : undefined,
        hall: adminInfoData.hall && adminInfoData.hall.trim() !== '' 
          ? adminInfoData.hall.trim() 
          : undefined,
        additionalInformation: adminInfoData.additionalInformation && adminInfoData.additionalInformation.trim() !== '' 
          ? adminInfoData.additionalInformation.trim() 
          : undefined,
        // Preserve luckyDrawNumber if it exists (auto-generated)
        luckyDrawNumber: adminInfoData.luckyDrawNumber,
        luckyDrawDateTime: adminInfoData.luckyDrawDateTime,
      };

      const finalAdminInfoDto = {
        ...cleanAdminInfoData,
        registerEventId,
      };

      if (adminInfo) {
        // Update existing admin info - preserve lucky draw number if it already exists
        // Update tableNumber, dressCode, hall, and additionalInformation from CSV
        if (finalAdminInfoDto.tableNumber !== undefined) {
          adminInfo.tableNumber = finalAdminInfoDto.tableNumber;
        }
        if (finalAdminInfoDto.dressCode !== undefined) {
          adminInfo.dressCode = finalAdminInfoDto.dressCode;
        }
        if (finalAdminInfoDto.hall !== undefined) {
          adminInfo.hall = finalAdminInfoDto.hall;
        }
        if (finalAdminInfoDto.additionalInformation !== undefined) {
          adminInfo.additionalInformation = finalAdminInfoDto.additionalInformation;
        }
        // Don't overwrite existing luckyDrawNumber or luckyDrawDateTime (auto-generated)
        // registerEventId should not change
        return await this.adminInfoRepository.save(adminInfo);
      } else {
        // Create new admin info
        adminInfo = this.adminInfoRepository.create(finalAdminInfoDto);
        return await this.adminInfoRepository.save(adminInfo);
      }
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Admin info creation');
    }
  }

  // Get admin info by registration ID
  async getAdminInfoByRegistrationId(
    registerEventId: string,
  ): Promise<AdminInfo | null> {
    try {
      return await this.adminInfoRepository.findOne({
        where: { registerEventId, isActive: true },
      });
    } catch (error) {
      throw this.errorHandler.handleDatabaseError(
        error,
        'Admin info retrieval',
      );
    }
  }

  // Get admin info by event ID (for admin view)
  async getAdminInfoByEventId(eventId: string): Promise<any[]> {
    try {
      const adminInfoList = await this.adminInfoRepository
        .createQueryBuilder('adminInfo')
        .leftJoinAndSelect('adminInfo.registerEvent', 'registerEvent')
        .leftJoinAndSelect('registerEvent.user', 'user')
        .leftJoinAndSelect('registerEvent.event', 'event')
        .where('event.id = :eventId', { eventId })
        .andWhere('adminInfo.isActive = :isActive', { isActive: true })
        .getMany();

      return adminInfoList.map((adminInfo) => ({
        id: adminInfo.id,
        luckyDrawNumber: adminInfo.luckyDrawNumber,
        luckyDrawDateTime: adminInfo.luckyDrawDateTime,
        tableNumber: adminInfo.tableNumber,
        additionalInformation: adminInfo.additionalInformation,
        dressCode: adminInfo.dressCode,
        hall: adminInfo.hall,
        createdAt: adminInfo.createdAt,
        updatedAt: adminInfo.updatedAt,
        user: {
          id: adminInfo.registerEvent.user?.id,
          firstName: adminInfo.registerEvent.user?.firstName,
          lastName: adminInfo.registerEvent.user?.lastName,
          email: adminInfo.registerEvent.user?.email,
        },
        registration: {
          id: adminInfo.registerEvent.id,
          type: adminInfo.registerEvent.type,
          status: adminInfo.registerEvent.status,
          createdAt: adminInfo.registerEvent.createdAt,
        },
      }));
    } catch (error) {
      throw this.errorHandler.handleDatabaseError(
        error,
        'Admin info retrieval by event',
      );
    }
  }

  // Update admin info for all registrations of an event
  async updateEventAdminInfo(
    eventId: string,
    luckyDrawDateTime?: string,
    additionalInformation?: string,
  ): Promise<{ updatedCount: number }> {
    try {
      // Find all adminInfo records for registrations of this event
      const adminInfoList = await this.adminInfoRepository
        .createQueryBuilder('adminInfo')
        .leftJoinAndSelect('adminInfo.registerEvent', 'registerEvent')
        .leftJoinAndSelect('registerEvent.event', 'event')
        .where('event.id = :eventId', { eventId })
        .andWhere('adminInfo.isActive = :isActive', { isActive: true })
        .getMany();

      let updatedCount = 0;

      for (const adminInfo of adminInfoList) {
        let hasUpdate = false;

        if (luckyDrawDateTime !== undefined) {
          adminInfo.luckyDrawDateTime = luckyDrawDateTime
            ? new Date(luckyDrawDateTime)
            : undefined;
          hasUpdate = true;
        }

        if (additionalInformation !== undefined) {
          adminInfo.additionalInformation = additionalInformation || undefined;
          hasUpdate = true;
        }

        if (hasUpdate) {
          await this.adminInfoRepository.save(adminInfo);
          updatedCount++;
        }
      }

      return { updatedCount };
    } catch (error) {
      throw this.errorHandler.handleDatabaseError(
        error,
        'Event admin info update',
      );
    }
  }

  // Delete admin info (soft delete)
  async deleteAdminInfo(id: string): Promise<void> {
    try {
      const adminInfo = await this.adminInfoRepository.findOne({
        where: { id },
      });
      if (!adminInfo) {
        throw new ResourceNotFoundException('Admin Info', id);
      }

      adminInfo.isActive = false;
      await this.adminInfoRepository.save(adminInfo);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Admin info deletion');
    }
  }

  // admin-info.service.ts

  async bulkUploadAdminInfo(
    bulkUploadDto: BulkUploadAdminInfoDto,
  ): Promise<BulkUpdateResponseDto> {
    try {
      const { eventId, bulkData } = bulkUploadDto;
      const response: BulkUpdateResponseDto = {
        success: true,
        message: 'Bulk upload completed',
        totalProcessed: 0,
        successfulUpdates: 0,
        failedUpdates: 0,
        errors: [],
      };

      response.totalProcessed = bulkData.length;

      for (const item of bulkData) {
        try {
          await this.processBulkItem(item, eventId);
          response.successfulUpdates++;
        } catch (error) {
          response.failedUpdates++;
          const errorMessage = `User ${item.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          response.errors?.push(errorMessage);
        }
      }

      // Update response message
      if (response.failedUpdates === 0) {
        response.message = `Successfully processed ${response.successfulUpdates} records`;
      } else {
        response.message = `Processed ${response.successfulUpdates} records, ${response.failedUpdates} failed`;
      }

      return response;
    } catch (error) {
      throw this.errorHandler.handleDatabaseError(
        error,
        'Bulk upload admin info',
      );
    }
  }

  // admin-info.service.ts

  async processCsvFile(
    file: Express.Multer.File,
    eventId: string,
  ): Promise<BulkUpdateResponseDto> {
    try {
      // Parse CSV file content - handle both buffer (memory) and disk storage
      let csvContent: string;
      if (file.buffer) {
        // File uploaded to memory
        csvContent = file.buffer.toString('utf-8');
      } else if (file.path) {
        // File uploaded to disk (for large files up to 15MB)
        csvContent = fs.readFileSync(file.path, 'utf-8');
      } else {
        throw new Error('File content not available');
      }
      
      const csvRows = csvContent.split('\n').filter((row) => row.trim() !== '');

      // Remove header row
      const dataRows = csvRows.slice(1);

      const response: BulkUpdateResponseDto = {
        success: true,
        message: 'CSV file processed',
        totalProcessed: 0,
        successfulUpdates: 0,
        failedUpdates: 0,
        errors: [],
      };

      response.totalProcessed = dataRows.length;

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i];
          const columns = row
            .split(',')
            .map((col) => col.trim().replace(/"/g, ''));

          if (columns.length < 1) continue;

          // Helper function to convert empty strings to undefined
          const cleanValue = (value: string | undefined) => {
            if (!value || value.trim() === '') return undefined;
            return value.trim();
          };

          const csvRow = {
            userId: columns[0]?.trim(), // First column is User ID
            // luckyDrawNumber removed - auto-generated on attendance check-in
            tableNumber: cleanValue(columns[1]),
            dressCode: cleanValue(columns[2]),
            hall: cleanValue(columns[3]),
          };

          await this.processBulkItem(csvRow, eventId);
          response.successfulUpdates++;
        } catch (error) {
          response.failedUpdates++;
          const errorMessage = `Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          response.errors?.push(errorMessage);
        }
      }

      // Update response message
      if (response.failedUpdates === 0) {
        response.message = `Successfully processed ${response.successfulUpdates} records from CSV`;
      } else {
        response.message = `Processed ${response.successfulUpdates} records, ${response.failedUpdates} failed`;
      }

      return response;
    } catch (error) {
      throw this.errorHandler.handleDatabaseError(error, 'CSV file processing');
    }
  }

  private async processBulkItem(
    item: any, // Accept both BulkAdminInfoItemDto and CSV row data
    eventId: string,
  ): Promise<void> {
    let registration;

    // Handle different input types
    if (item.registerEventId) {
      // Direct registerEventId provided (from CSV)
      registration = await this.registerEventRepository.findOne({
        where: {
          id: item.registerEventId,
          eventId: eventId,
          isRegister: true,
        },
      });
      if (!registration) {
        throw new Error(
          `Register Event with ID ${item.registerEventId} not found for this event`,
        );
      }
    } else if (item.userId) {
      // Direct userId provided (from CSV upload)
      // First, check if user exists in the system
      const user = await this.userRepository.findOne({
        where: { id: item.userId },
      });
      if (!user) {
        throw new Error(`User with ID ${item.userId} does not exist in the system`);
      }

      // Then, check if user is registered for this specific event
      registration = await this.registerEventRepository.findOne({
        where: {
          userId: item.userId,
          eventId: eventId,
          isRegister: true,
        },
      });
      if (!registration) {
        // Get event name for better error message
        const event = await this.eventRepository.findOne({
          where: { id: eventId },
          select: ['name'],
        });
        const eventName = event?.name || 'this event';
        throw new Error(
          `User ${user.firstName} ${user.lastName} (${user.email}) is not registered for ${eventName}. Only registered users can be assigned table numbers.`,
        );
      }
    } else {
      throw new Error('Either registerEventId or userId must be provided');
    }

    // Lucky draw number is auto-generated on attendance check-in, skip validation
    // No need to check for duplicate lucky draw numbers from CSV upload

    // Check for duplicate table numbers within the same event only
    // Table numbers can be same across different events, but not within the same event
    if (item.tableNumber) {
      const existingTable = await this.adminInfoRepository
        .createQueryBuilder('adminInfo')
        .leftJoin('adminInfo.registerEvent', 'registerEvent')
        .where('adminInfo.tableNumber = :tableNumber', { tableNumber: item.tableNumber })
        .andWhere('adminInfo.isActive = :isActive', { isActive: true })
        .andWhere('registerEvent.eventId = :eventId', { eventId: eventId })
        .andWhere('adminInfo.registerEventId != :currentRegistrationId', { currentRegistrationId: registration.id })
        .getOne();
      
      if (existingTable) {
        throw new Error(`Table number ${item.tableNumber} is already assigned to another user in this event`);
      }
    }

    // Hall and dress code duplicates are allowed - multiple people can have the same hall and dress code
    // Only table number needs to be unique within the same event
    // No validation needed for hall and dress code duplicates

    // Create or update admin info
    // Note: luckyDrawNumber is auto-generated on attendance check-in, not from CSV
    const adminInfoDto: CreateAdminInfoDto = {
      registerEventId: registration.id,
      // luckyDrawNumber: not set from CSV - auto-generated on attendance check-in
      tableNumber: item.tableNumber,
      additionalInformation: item.additionalInformation,
      dressCode: item.dressCode,
      hall: item.hall,
    };

    await this.createOrUpdateAdminInfo(adminInfoDto);
  }

  // Get admin info statistics for an event
  async getAdminInfoStats(eventId: string): Promise<any> {
    try {
      const totalRegistrations = await this.registerEventRepository.count({
        where: { eventId },
      });

      const adminInfoCount = await this.adminInfoRepository
        .createQueryBuilder('adminInfo')
        .leftJoin('adminInfo.registerEvent', 'registerEvent')
        .where('registerEvent.eventId = :eventId', { eventId })
        .andWhere('adminInfo.isActive = :isActive', { isActive: true })
        .getCount();

      const luckyDrawCount = await this.adminInfoRepository
        .createQueryBuilder('adminInfo')
        .leftJoin('adminInfo.registerEvent', 'registerEvent')
        .where('registerEvent.eventId = :eventId', { eventId })
        .andWhere('adminInfo.isActive = :isActive', { isActive: true })
        .andWhere('adminInfo.luckyDrawNumber IS NOT NULL')
        .andWhere('adminInfo.luckyDrawNumber != :emptyString', {
          emptyString: '',
        })
        .getCount();

      const tableNumberCount = await this.adminInfoRepository
        .createQueryBuilder('adminInfo')
        .leftJoin('adminInfo.registerEvent', 'registerEvent')
        .where('registerEvent.eventId = :eventId', { eventId })
        .andWhere('adminInfo.isActive = :isActive', { isActive: true })
        .andWhere('adminInfo.tableNumber IS NOT NULL')
        .andWhere('adminInfo.tableNumber != :emptyString', { emptyString: '' })
        .getCount();

      return {
        totalRegistrations,
        adminInfoCount,
        luckyDrawCount,
        tableNumberCount,
        coverage: {
          luckyDraw: (luckyDrawCount / totalRegistrations) * 100,
          tableNumber: (tableNumberCount / totalRegistrations) * 100,
        },
      };
    } catch (error) {
      throw this.errorHandler.handleDatabaseError(
        error,
        'Admin info statistics',
      );
    }
  }

  // Get admin info visibility status for an event
  async getAdminInfoVisibility(eventId: string): Promise<{
    showAdminInfoTab: boolean;
    features: {
      luckyDrawEnabled: boolean;
    };
    eventInfo: {
      id: string;
      name: string;
    };
  }> {
    try {
      // Get event information
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
        select: ['id', 'name', 'enableLuckyDrawFeature'],
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      const features = {
        luckyDrawEnabled: event.enableLuckyDrawFeature || false,
      };

      // Show admin info tab if lucky draw feature is enabled
      const showAdminInfoTab = features.luckyDrawEnabled;

      return {
        showAdminInfoTab,
        features,
        eventInfo: {
          id: event.id,
          name: event.name,
        },
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(
        error,
        'Admin info visibility check',
      );
    }
  }

  // Get lucky draw numbers for an event
  async getLuckyDrawNumbers(eventId: string): Promise<{
    luckyDrawNumbers: Array<{
      luckyDrawNumber: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      checkInTime: Date;
    }>;
    totalNumbers: number;
    eventInfo: {
      id: string;
      name: string;
    };
  }> {
    try {
      // Get event information
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
        select: ['id', 'name'],
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Get all admin info with lucky draw numbers for this event
      const adminInfoList = await this.adminInfoRepository
        .createQueryBuilder('adminInfo')
        .leftJoinAndSelect('adminInfo.registerEvent', 'registerEvent')
        .leftJoinAndSelect('registerEvent.user', 'user')
        .leftJoinAndSelect('registerEvent.event', 'event')
        .where('event.id = :eventId', { eventId })
        .andWhere('adminInfo.isActive = :isActive', { isActive: true })
        .andWhere('adminInfo.luckyDrawNumber IS NOT NULL')
        .andWhere('adminInfo.luckyDrawNumber != :emptyString', {
          emptyString: '',
        })
        .orderBy('adminInfo.luckyDrawNumber', 'ASC')
        .getMany();

      const luckyDrawNumbers = adminInfoList.map((adminInfo) => ({
        luckyDrawNumber: adminInfo.luckyDrawNumber!,
        user: {
          id: adminInfo.registerEvent.user?.id || '',
          firstName: adminInfo.registerEvent.user?.firstName || '',
          lastName: adminInfo.registerEvent.user?.lastName || '',
          email: adminInfo.registerEvent.user?.email || '',
        },
        checkInTime: adminInfo.createdAt, // This represents when the lucky draw number was assigned
      }));

      return {
        luckyDrawNumbers,
        totalNumbers: luckyDrawNumbers.length,
        eventInfo: {
          id: event.id,
          name: event.name,
        },
      };
    } catch (error) {
  
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(
        error,
        'Lucky draw numbers retrieval',
      );
    }
  }
}
