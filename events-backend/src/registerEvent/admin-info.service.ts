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
  async createOrUpdateAdminInfo(
    createAdminInfoDto: CreateAdminInfoDto,
  ): Promise<AdminInfo> {
    try {
      // Check if registration exists
      const registration = await this.registerEventRepository.findOne({
        where: { id: createAdminInfoDto.registerEventId },
      });
      if (!registration) {
        throw new ResourceNotFoundException(
          'Registration',
          createAdminInfoDto.registerEventId,
        );
      }

      // Check if admin info already exists
      let adminInfo = await this.adminInfoRepository.findOne({
        where: { registerEventId: createAdminInfoDto.registerEventId },
      });

      if (adminInfo) {
        // Update existing admin info - only update non-lucky draw fields if lucky draw already exists
        if (adminInfo.luckyDrawNumber && createAdminInfoDto.luckyDrawNumber) {
          // Skip lucky draw number update if it already exists
          const { luckyDrawNumber, ...updateData } = createAdminInfoDto;
          Object.assign(adminInfo, updateData);
        } else {
          Object.assign(adminInfo, createAdminInfoDto);
        }
        return await this.adminInfoRepository.save(adminInfo);
      } else {
        // Create new admin info
        adminInfo = this.adminInfoRepository.create(createAdminInfoDto);
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
      // Parse CSV file content
      const csvContent = file.buffer.toString('utf-8');
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

          const csvRow = {
            registerEventId: columns[0], // First column should be registerEventId
            luckyDrawNumber: columns[1] || undefined, // Already inserted, so skip
            tableNumber: columns[2] || undefined,
            dressCode: columns[3] || undefined,
            hall: columns[4] || undefined,
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
      // Direct userId provided (from bulk upload)
      registration = await this.registerEventRepository.findOne({
        where: {
          userId: item.userId,
          eventId: eventId,
          isRegister: true,
        },
      });
      if (!registration) {
        throw new Error(`User ${item.userId} is not registered for this event`);
      }
    } else {
      throw new Error('Either registerEventId or userId must be provided');
    }

    // Check for duplicate lucky draw numbers
    if (item.luckyDrawNumber) {
      const existingLuckyDraw = await this.adminInfoRepository.findOne({
        where: {
          luckyDrawNumber: item.luckyDrawNumber,
          isActive: true,
        },
      });
      if (existingLuckyDraw) {
        throw new Error(
          `Lucky draw number ${item.luckyDrawNumber} already exists`,
        );
      }
    }

    // Check for duplicate table numbers
    if (item.tableNumber) {
      const existingTable = await this.adminInfoRepository.findOne({
        where: {
          tableNumber: item.tableNumber,
          isActive: true,
        },
      });
      if (existingTable) {
        throw new Error(`Table number ${item.tableNumber} already exists`);
      }
    }

    // Create or update admin info
    const adminInfoDto: CreateAdminInfoDto = {
      registerEventId: registration.id,
      luckyDrawNumber: item.luckyDrawNumber, // Skip if already exists
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
      console.log(error, '%%%%%%%%');
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
