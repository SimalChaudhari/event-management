import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactInfo } from './contact-info.entity';
import {
  CreateContactInfoDto,
  UpdateContactInfoDto,
  StoreScannedContactDto,
  GetScannedUserInfoDto,
  SyncContactsToPhoneDto,
  ContactInfoResponseDto,
  ContactListResponseDto,
  ScannedUserInfoResponseDto,
  SyncResponseDto,
} from './contact-info.dto';
import { UserEntity } from '../user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Injectable()
export class ContactInfoService {
  constructor(
    @InjectRepository(ContactInfo)
    private contactInfoRepository: Repository<ContactInfo>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private errorHandler: ErrorHandlerService,
  ) {}

  async createContactInfo(
    createContactInfoDto: CreateContactInfoDto,
    userId: string,
  ): Promise<ContactInfoResponseDto> {
    try {
      // Check if contact already exists for this user
      const existingContact = await this.contactInfoRepository.findOne({
        where: {
          userId: userId,
          email: createContactInfoDto.email,
        },
      });

      if (existingContact) {
        throw new ConflictException('Contact already exists');
      }

      // Create new contact info
      const contactInfo = this.contactInfoRepository.create({
        ...createContactInfoDto,
        userId: userId,
      });

      const savedContact = await this.contactInfoRepository.save(contactInfo);

      return {
        success: true,
        message: 'Contact information created successfully',
        data: {
          contact: {
            id: savedContact.id,
            firstName: savedContact.firstName,
            lastName: savedContact.lastName,
            email: savedContact.email,
            phone: savedContact.phone,
            location: savedContact.location,
            isActive: savedContact.isActive,
            isSyncedToPhone: savedContact.isSyncedToPhone,
            syncedAt: savedContact.syncedAt,
            createdAt: savedContact.createdAt,
            updatedAt: savedContact.updatedAt,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Create contact info');
    }
  }

  async getScannedUserInfo(
    getScannedUserInfoDto: GetScannedUserInfoDto,
    scannerId: string,
  ): Promise<ScannedUserInfoResponseDto> {
    try {
      // Get scanned user information
      const scannedUser = await this.userRepository.findOne({
        where: { id: getScannedUserInfoDto.scannedUserId },
      });

      if (!scannedUser) {
        throw new NotFoundException('Scanned user not found');
      }

      // Check if contact already exists
      const existingContact = await this.contactInfoRepository.findOne({
        where: {
          userId: scannerId,
          email: scannedUser.email,
        },
      });

      return {
        success: true,
        message: 'Scanned user information retrieved successfully',
        data: {
          scannedUser: {
            id: scannedUser.id,
            firstName: scannedUser.firstName,
            lastName: scannedUser.lastName,
            email: scannedUser.email,
            phone: scannedUser.mobile,
            profilePicture: scannedUser.profilePicture,
            role: scannedUser.role || 'user',
          },
          alreadyExists: !!existingContact,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Get scanned user info');
    }
  }

  async storeScannedContact(
    storeScannedContactDto: StoreScannedContactDto,
    scannerId: string,
  ): Promise<ContactInfoResponseDto> {
    try {
      // Check if confirmation is provided
      if (storeScannedContactDto.confirmAdd !== true) {
        throw new BadRequestException('Contact add confirmation is required');
      }

      // Get scanned user information
      const scannedUser = await this.userRepository.findOne({
        where: { id: storeScannedContactDto.scannedUserId },
      });

      if (!scannedUser) {
        throw new NotFoundException('Scanned user not found');
      }

      // Check if contact already exists
      const existingContact = await this.contactInfoRepository.findOne({
        where: {
          userId: scannerId,
          email: scannedUser.email,
        },
      });

      if (existingContact) {
        throw new ConflictException(
          'Contact already exists in your contact list',
        );
      }

      // Create contact info from scanned user
      const contactInfo = this.contactInfoRepository.create({
        userId: scannerId,
        firstName: scannedUser.firstName,
        lastName: scannedUser.lastName,
        email: scannedUser.email,
        phone: scannedUser.mobile,
        location: storeScannedContactDto.location,
        isSyncedToPhone: storeScannedContactDto.autoSyncToPhone || false,
      });

      const savedContact = await this.contactInfoRepository.save(contactInfo);

      // If auto sync is enabled, mark as synced
      if (storeScannedContactDto.autoSyncToPhone) {
        savedContact.isSyncedToPhone = true;
        savedContact.syncedAt = new Date();
        await this.contactInfoRepository.save(savedContact);
      }

      return {
        success: true,
        message: 'Scanned contact stored successfully',
        data: {
          contact: {
            id: savedContact.id,
            firstName: savedContact.firstName,
            lastName: savedContact.lastName,
            email: savedContact.email,
            phone: savedContact.phone,
            location: savedContact.location,
            isActive: savedContact.isActive,
            isSyncedToPhone: savedContact.isSyncedToPhone,
            syncedAt: savedContact.syncedAt,
            createdAt: savedContact.createdAt,
            updatedAt: savedContact.updatedAt,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Store scanned contact');
    }
  }

  async getAllContacts(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ContactListResponseDto> {
    try {
      const queryBuilder = this.contactInfoRepository
        .createQueryBuilder('contact')
        .where('contact.userId = :userId', { userId })
        .andWhere('contact.isActive = :isActive', { isActive: true });

      const [contacts, total] = await queryBuilder
        .orderBy('contact.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const syncedCount = await this.contactInfoRepository.count({
        where: {
          userId: userId,
          isSyncedToPhone: true,
          isActive: true,
        },
      });

      return {
        success: true,
        message: 'Contacts retrieved successfully',
        data: {
          contacts: contacts.map((contact) => ({
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            location: contact.location,
            isActive: contact.isActive,
            isSyncedToPhone: contact.isSyncedToPhone,
            syncedAt: contact.syncedAt,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
          })),
          total,
          syncedCount,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          page,
          limit,
        },
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Get all contacts');
    }
  }

  async getContactById(
    contactId: string,
    userId: string,
  ): Promise<ContactInfoResponseDto> {
    try {
      const contact = await this.contactInfoRepository.findOne({
        where: { id: contactId, userId: userId },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      return {
        success: true,
        message: 'Contact retrieved successfully',
        data: {
          contact: {
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            location: contact.location,
            isActive: contact.isActive,
            isSyncedToPhone: contact.isSyncedToPhone,
            syncedAt: contact.syncedAt,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Get contact by ID');
    }
  }

  async updateContact(
    contactId: string,
    updateContactInfoDto: UpdateContactInfoDto,
    userId: string,
  ): Promise<ContactInfoResponseDto> {
    try {
      const contact = await this.contactInfoRepository.findOne({
        where: { id: contactId, userId: userId },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      // Update contact info
      Object.assign(contact, updateContactInfoDto);
      const updatedContact = await this.contactInfoRepository.save(contact);

      return {
        success: true,
        message: 'Contact updated successfully',
        data: {
          contact: {
            id: updatedContact.id,
            firstName: updatedContact.firstName,
            lastName: updatedContact.lastName,
            email: updatedContact.email,
            phone: updatedContact.phone,
            location: updatedContact.location,
            isActive: updatedContact.isActive,
            isSyncedToPhone: updatedContact.isSyncedToPhone,
            syncedAt: updatedContact.syncedAt,
            createdAt: updatedContact.createdAt,
            updatedAt: updatedContact.updatedAt,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Update contact');
    }
  }

  async deleteContact(
    contactId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const contact = await this.contactInfoRepository.findOne({
        where: { id: contactId, userId: userId },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      // Soft delete by setting isActive to false
      contact.isActive = false;
      await this.contactInfoRepository.save(contact);

      return {
        success: true,
        message: 'Contact deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Delete contact');
    }
  }

  async syncContactsToPhone(
    syncContactsToPhoneDto: SyncContactsToPhoneDto,
    userId: string,
  ): Promise<SyncResponseDto> {
    try {
      let contacts: ContactInfo[] = [];
      let syncDetails: Array<{
        contactId: string;
        contactName: string;
        status: 'success' | 'failed';
        error?: string;
      }> = [];

      if (syncContactsToPhoneDto.contactId) {
        // Sync specific contact
        const contact = await this.contactInfoRepository.findOne({
          where: { id: syncContactsToPhoneDto.contactId, userId: userId },
        });
        if (contact) {
          contacts = [contact];
        }
      } else {
        // Sync all unsynced contacts
        contacts = await this.contactInfoRepository.find({
          where: {
            userId: userId,
            isActive: true,
            isSyncedToPhone: false,
          },
        });
      }

      if (contacts.length === 0) {
        return {
          success: true,
          message: 'No contacts to sync',
          data: {
            syncedContacts: 0,
            failedContacts: 0,
            totalContacts: 0,
            syncDetails: [],
          },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        };
      }

      let syncedCount = 0;
      let failedCount = 0;

      // Simulate phone sync process
      for (const contact of contacts) {
        try {
          // Here you would implement actual phone sync logic
          // For now, we'll simulate the sync process
          contact.isSyncedToPhone = true;
          contact.syncedAt = new Date();
          await this.contactInfoRepository.save(contact);

          syncDetails.push({
            contactId: contact.id,
            contactName: `${contact.firstName} ${contact.lastName}`,
            status: 'success',
          });
          syncedCount++;
        } catch (error: any) {
          syncDetails.push({
            contactId: contact.id,
            contactName: `${contact.firstName} ${contact.lastName}`,
            status: 'failed',
            error: error.message,
          });
          failedCount++;
        }
      }

      return {
        success: true,
        message: `Sync completed: ${syncedCount} successful, ${failedCount} failed`,
        data: {
          syncedContacts: syncedCount,
          failedContacts: failedCount,
          totalContacts: contacts.length,
          syncDetails,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Sync contacts to phone');
    }
  }
}
