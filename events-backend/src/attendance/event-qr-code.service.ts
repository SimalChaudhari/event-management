import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventQRCode, EventQRCodeType, EventQRCodeStatus } from './event-qr-code.entity';
import { ContactExchange } from './contact-exchange.entity';
import { ExhibitorStamp } from './exhibitor-stamp.entity';
import { EventAttendance, AttendanceStatus, CheckInMethod } from './attendance.entity';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { AdminInfo } from '../registerEvent/admin-info.entity';
import { Status } from '../registerEvent/registerEvent.dto';
import { 

  ContactExchangeDto,
  CollectExhibitorStampDto,
  SelfCheckInDto,
} from './attendance.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { QRCodeUtils } from '../utils/qr-code.utils';
import { ResourceNotFoundException, DuplicateResourceException } from '../utils/exceptions/custom-exceptions';

@Injectable()
export class EventQRCodeService {
  constructor(
    @InjectRepository(EventQRCode)
    private eventQRCodeRepository: Repository<EventQRCode>,
    @InjectRepository(ContactExchange)
    private contactExchangeRepository: Repository<any>,
    @InjectRepository(ExhibitorStamp)
    private exhibitorStampRepository: Repository<ExhibitorStamp>,
    @InjectRepository(EventAttendance)
    private attendanceRepository: Repository<EventAttendance>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(AdminInfo)
    private adminInfoRepository: Repository<AdminInfo>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}



  /**
   * Get all event QR codes for an event
   */
  async getEventQRCodes(eventId: string): Promise<EventQRCode[]> {
    try {
      return await this.eventQRCodeRepository.find({
        where: { eventId, isActive: true },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Event QR codes retrieval');
    }
  }

  /**
   * Get a specific event QR code
   */
  async getEventQRCode(qrCodeId: string): Promise<EventQRCode> {
    try {
      const eventQRCode = await this.eventQRCodeRepository.findOne({
        where: { id: qrCodeId, isActive: true },
        relations: ['event'],
      });

      if (!eventQRCode) {
        throw new ResourceNotFoundException('Event QR Code', qrCodeId);
      }

      return eventQRCode;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event QR code retrieval');
    }
  }

  /**
   * Delete an event QR code
   */
  async deleteEventQRCode(qrCodeId: string): Promise<{ message: string }> {
    try {
      const eventQRCode = await this.eventQRCodeRepository.findOne({
        where: { id: qrCodeId },
      });

      if (!eventQRCode) {
        throw new ResourceNotFoundException('Event QR Code', qrCodeId);
      }

      await this.eventQRCodeRepository.remove(eventQRCode);
      return { message: 'Event QR code deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event QR code deletion');
    }
  }

  /**
   * Handle self check-in via event QR code
   */
  async handleSelfCheckIn(
    selfCheckInDto: SelfCheckInDto,
    userId: string,
  ): Promise<any> {
    try {
      // Use QR code data directly as event ID
      const eventId = selfCheckInDto.qrCodeData;
      
      // Get event
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Check if user is registered for the event
      let registration = await this.registerEventRepository.findOne({
        where: {
          userId: userId,
          eventId: eventId,
          isRegister: true,
        },
      });

      let autoRegistered = false;
      let redirectToPayment = false;
      let paymentUrl = null;

      // If user is not registered, handle based on event type
      if (!registration) {
        // Check if event is free (price is 0 or null)
        const isEventFree = !event.price || event.price === 0;
        
        if (isEventFree) {
          // Auto-register user for free events
          registration = this.registerEventRepository.create({
            userId: userId,
            eventId: eventId,
            type: 'Attendee',
            status: Status.Sucesss,
            isRegister: true,
            isCreatedByAdmin: false,
          });
          await this.registerEventRepository.save(registration);
          autoRegistered = true;
        } else {
          // Redirect to payment for paid events
          redirectToPayment = true;
          paymentUrl = `/events/${eventId}/register`;
        }
      }

      // If redirecting to payment, don't proceed with check-in
      if (redirectToPayment) {
        return {
          success: true,
          message: 'Please complete your registration to check in',
          data: {
            checkInResult: null,
            registration: null,
            autoRegistered: false,
            redirectToPayment: true,
            paymentUrl,
          },
        };
      }

      // Check existing attendance
      let attendance = await this.attendanceRepository.findOne({
        where: {
          userId: userId,
          eventId: eventId,
        },
      });

      if (attendance && attendance.status === AttendanceStatus.CheckedIn) {
        throw new ConflictException('You are already checked in for this event');
      }

      // Create or update attendance record
      if (attendance) {
        attendance.status = AttendanceStatus.CheckedIn;
        attendance.checkInTime = new Date();
        attendance.checkInLocation = selfCheckInDto.location;
        attendance.checkedInBy = userId; // Self check-in
        attendance.notes = selfCheckInDto.notes;
        attendance.checkInMethod = CheckInMethod.QRCode;
      } else {
        attendance = this.attendanceRepository.create({
          userId: userId,
          eventId: eventId,
          registerEventId: registration?.id,
          status: AttendanceStatus.CheckedIn,
          checkInTime: new Date(),
          checkInLocation: selfCheckInDto.location,
          checkedInBy: userId, // Self check-in
          notes: selfCheckInDto.notes,
          checkInMethod: CheckInMethod.QRCode,
        });
      }

      const savedAttendance = await this.attendanceRepository.save(attendance);

      // Auto-generate lucky draw number if feature is enabled and this is first check-in
      if (event.enableLuckyDrawFeature && savedAttendance.status === AttendanceStatus.CheckedIn && registration) {
        await this.generateLuckyDrawNumber(registration.id, eventId);
      }

      return {
        success: true,
        message: autoRegistered 
          ? 'Successfully registered and checked in to the event'
          : 'Check-in successful',
        data: {
          checkInResult: {
            id: savedAttendance.id,
            status: savedAttendance.status,
            checkInTime: savedAttendance.checkInTime,
            method: savedAttendance.checkInMethod,
          },
          registration: registration ? {
            id: registration.id,
            type: registration.type,
            status: registration.status,
          } : null,
          autoRegistered,
          redirectToPayment: false,
          paymentUrl: null,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ResourceNotFoundException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Self check-in');
    }
  }

  /**
   * Generate lucky draw number based on check-in sequence
   */
  private async generateLuckyDrawNumber(registerEventId: string, eventId: string): Promise<void> {
    try {
      // Check if admin info already exists for this registration
      const existingAdminInfo = await this.adminInfoRepository.findOne({
        where: { registerEventId },
      });

      if (existingAdminInfo && existingAdminInfo.luckyDrawNumber) {
        // Lucky draw number already exists, don't regenerate
        return;
      }

      // Get the count of checked-in attendees for this event to determine sequence
      // Note: This function is called AFTER attendance is saved, so count includes current check-in
      const checkedInCount = await this.attendanceRepository
        .createQueryBuilder('attendance')
        .where('attendance.eventId = :eventId', { eventId })
        .andWhere('attendance.status = :status', { status: AttendanceStatus.CheckedIn })
        .getCount();

      // Generate lucky draw number based on sequence (0001, 0002, 0003, etc.) - 4 digits
      // Since count already includes the current check-in, we use it directly as sequence number
      // First person: count = 1 -> 0001, Second person: count = 2 -> 0002, etc.
      const sequenceNumber = checkedInCount;
      const luckyDrawNumber = String(sequenceNumber).padStart(4, '0');
      
      // Validate that number doesn't exceed 9999
      if (sequenceNumber > 9999) {
        throw new BadRequestException('Maximum lucky draw numbers (9999) reached for this event');
      }

      // Create or update admin info with lucky draw number
      if (existingAdminInfo) {
        existingAdminInfo.luckyDrawNumber = luckyDrawNumber;
        await this.adminInfoRepository.save(existingAdminInfo);
      } else {
        const newAdminInfo = this.adminInfoRepository.create({
          registerEventId,
          luckyDrawNumber,
        });
        await this.adminInfoRepository.save(newAdminInfo);
      }
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Lucky draw number generation');
    }
  }



  /**
   * Handle contact exchange between users
   */
  async handleContactExchange(
    contactExchangeDto: ContactExchangeDto,
    scannerId: string,
  ): Promise<any> {
    try {
      // Verify the scanned user exists with related profiles
      const scannedUser = await this.userRepository.findOne({
        where: { id: contactExchangeDto.scannedUserId },
        relations: ['speakerProfile', 'exhibitorProfile'],
      });

      if (!scannedUser) {
        throw new ResourceNotFoundException('User', contactExchangeDto.scannedUserId);
      }

      // Check if contact exchange already exists
      const existingExchange = await this.contactExchangeRepository.findOne({
        where: {
          scannerId: scannerId,
          scannedUserId: contactExchangeDto.scannedUserId,
          eventId: contactExchangeDto.eventId,
        },
      });

      if (existingExchange) {
        throw new ConflictException('Contact exchange already exists with this user');
      }

      // Create contact exchange record
      const contactExchange = this.contactExchangeRepository.create({
        scannerId: scannerId,
        scannedUserId: contactExchangeDto.scannedUserId,
        eventId: contactExchangeDto.eventId,
        location: contactExchangeDto.location,
        notes: contactExchangeDto.notes,
      });

      const savedExchange = await this.contactExchangeRepository.save(contactExchange);

      return {
        success: true,
        message: 'Contact exchange successful',
        data: {
          scannedUser: {
            id: scannedUser.id,
            firstName: scannedUser.firstName,
            lastName: scannedUser.lastName,
            email: scannedUser.email,
            profilePicture: scannedUser.profilePicture,
            role: scannedUser.role,
            mobile: scannedUser.mobile,
            // Add company info if available (for speakers and exhibitors)
            companyName: scannedUser.speakerProfile?.companyName || 
                        (scannedUser.exhibitorProfile && scannedUser.exhibitorProfile.length > 0 ? scannedUser.exhibitorProfile[0].companyName : null),
            position: scannedUser.speakerProfile?.position || null,
          },
          contactExchange: {
            id: savedExchange.id,
            createdAt: savedExchange.createdAt,
          },
        },
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof ResourceNotFoundException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Contact exchange');
    }
  }

  /**
   * Handle exhibitor stamp collection
   */
  async handleExhibitorStampCollection(
    stampDto: CollectExhibitorStampDto,
    attendeeId: string,
  ): Promise<any> {
    try {
      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: stampDto.eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', stampDto.eventId);
      }

      // Check if stamp already collected for this event
      const existingStamp = await this.exhibitorStampRepository.findOne({
        where: {
          attendeeId: attendeeId,
          eventId: stampDto.eventId,
        },
      });

      if (existingStamp) {
        throw new ConflictException('You have already collected a stamp for this event');
      }

      // Create exhibitor stamp record
      const exhibitorStamp = this.exhibitorStampRepository.create({
        attendeeId: attendeeId,
        eventId: stampDto.eventId,
        boothName: event.name,
        boothLocation: event.location,
        notes: stampDto.notes,
      });

      const savedStamp = await this.exhibitorStampRepository.save(exhibitorStamp);

      // Get total stamps collected by this attendee for this event
      const totalStamps = await this.exhibitorStampRepository.count({
        where: {
          attendeeId: attendeeId,
          eventId: stampDto.eventId,
        },
      });

      return {
        success: true,
        message: 'Exhibitor stamp collected successfully',
        data: {
          booth: {
            name: event.name,
            location: event.location,
            description: event.description,
          },
          stamp: {
            id: savedStamp.id,
            collectedAt: savedStamp.createdAt,
          },
          totalStamps,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ResourceNotFoundException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor stamp collection');
    }
  }

  /**
   * Get contact exchanges for a user
   */
  async getUserContactExchanges(userId: string, eventId?: string): Promise<any[]> {
    try {
      const where: any = { scannerId: userId, isActive: true };
      if (eventId) {
        where.eventId = eventId;
      }

      return await this.contactExchangeRepository.find({
        where,
        relations: ['scannedUser', 'event'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'User contact exchanges retrieval');
    }
  }

  /**
   * Get exhibitor stamps for a user
   */
  async getUserExhibitorStamps(userId: string, eventId?: string): Promise<ExhibitorStamp[]> {
    try {
      const where: any = { attendeeId: userId, isActive: true };
      if (eventId) {
        where.eventId = eventId;
      }

      return await this.exhibitorStampRepository.find({
        where,
        relations: ['event'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'User exhibitor stamps retrieval');
    }
  }

  /**
   * Generate QR code image for an event QR code
   */
  async generateEventQRCodeImage(qrCodeId: string): Promise<string> {
    try {
      const eventQRCode = await this.getEventQRCode(qrCodeId);
      
      // Create a unique identifier for this QR code
      const qrCodeData = `event_${eventQRCode.id}_${eventQRCode.type}_${eventQRCode.eventId}`;
      
      // Generate QR code image
      const qrCodeImage = await QRCodeUtils.generateQRCodeAsDataURL(qrCodeData);
      
      return qrCodeImage;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Event QR code image generation');
    }
  }

  /**
   * Generate simple Event QR code (similar to user QR code)
   * @param eventId Event ID
   * @returns QR code data with event information
   */
  async generateSimpleEventQRCode(eventId: string): Promise<{
    qrCodeId: string;
    qrCodeImage: string; // Base64 image
    eventInfo: any;
  }> {
    try {
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Use event ID directly as QR code data
      const qrCodeId = eventId;
      const qrCodeUrl = `${process.env.APP_URL}/api/attendance/event-qr-code/scan/${qrCodeId}`;
      
      // Generate QR code image
      const qrCodeImage = await QRCodeUtils.generateQRCodeAsDataURL(qrCodeUrl);

      // Return event data for QR code
      const eventInfo = {
        id: event.id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        isFree: !event.price || event.price === 0,
        price: event.price || 0,
        type: event.type,
      };

      return {
        eventInfo,
        qrCodeId,
        qrCodeImage,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Simple Event QR code generation');
    }
  }

  /**
   * Get event information from scanned QR code
   * @param qrCodeId QR code identifier (event ID)
   * @returns Event information
   */
  async getEventInfoFromQRCode(qrCodeId: string): Promise<any> {
    try {
      // Use qrCodeId directly as event ID
      const eventId = qrCodeId;
      
      // Get event data directly from database
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Return event data
      return {
        id: event.id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        isFree: !event.price || event.price === 0,
        price: event.price || 0,
        type: event.type,
        qrCodeId,
        scanTime: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event QR code scanning');
    }
  }
}
