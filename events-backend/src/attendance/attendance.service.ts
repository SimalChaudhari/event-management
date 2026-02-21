import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventAttendance, AttendanceStatus, CheckInMethod } from './attendance.entity';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { AdminInfo } from '../registerEvent/admin-info.entity';
import { 
  CheckInByQRCodeDto, 
  ManualCheckInDto, 
  CheckOutDto, 
  UpdateAttendanceDto,
  QRCodeScanResponseDto 
} from './attendance.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { UserUtils } from '../utils/user.utils';
import { QRCodeUtils } from '../utils/qr-code.utils';
import { ResourceNotFoundException, DuplicateResourceException } from '../utils/exceptions/custom-exceptions';
//test
@Injectable()
export class AttendanceService {
  private attendanceGateway: { emitAttendanceUpdate: (eventId: string) => void } | null = null;

  constructor(
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

  setAttendanceGateway(gateway: { emitAttendanceUpdate: (eventId: string) => void }): void {
    this.attendanceGateway = gateway;
  }

  /**
   * Scan QR code and get user information for attendance check-in
   * This is the main method for QR code scanning
   */
  async scanQRCodeForAttendance(
    qrCodeId: string,
    eventId: string,
  ): Promise<QRCodeScanResponseDto> {
    try {
      // Extract user ID from QR code ID format: qr_${userId}_${timestamp}_${random}
      const qrCodeParts = qrCodeId.split('_');
      if (qrCodeParts.length < 2) {
        throw new ResourceNotFoundException('QR Code', qrCodeId);
      }

      const userId = qrCodeParts[1];
      
      // Get user data
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Get event data
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Check if user is registered for the event
      const registration = await this.registerEventRepository.findOne({
        where: {
          userId: userId,
          eventId: eventId,
          isRegister: true,
        },
      });

      // Check existing attendance record
      const existingAttendance = await this.attendanceRepository.findOne({
        where: {
          userId: userId,
          eventId: eventId,
        },
      });

      // Determine if user can check in
      const isRegistered = !!registration;
      const canCheckIn = isRegistered && 
        (!existingAttendance || 
         existingAttendance.status === AttendanceStatus.CheckedOut ||
         existingAttendance.status === AttendanceStatus.NoShow);

      // Prepare response data
      const responseData = {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role || 'User',
        },
        event: {
          id: event.id,
          title: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
        },
        registration: registration ? {
          id: registration.id,
          type: registration.type || 'Attendee',
          status: registration.status || 'Success',
        } : undefined,
        attendance: existingAttendance ? {
          id: existingAttendance.id,
          status: existingAttendance.status,
          checkInTime: existingAttendance.checkInTime,
          checkOutTime: existingAttendance.checkOutTime,
        } : undefined,
        isRegistered,
        canCheckIn,
      };

      return {
        success: true,
        message: isRegistered 
          ? 'QR code scanned successfully. User is registered for this event.'
          : 'QR code scanned successfully. User is NOT registered for this event.',
        data: responseData,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'QR code scanning for attendance');
    }
  }

  /**
   * Check in user by scanning their QR code
   */
  async checkInByQRCode(
    checkInData: CheckInByQRCodeDto,
    adminUserId: string,
    userId: string, // User ID from QR code scan
  ): Promise<EventAttendance> {
    try {
      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: checkInData.eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', checkInData.eventId);
      }

      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user is registered for the event
      const registration = await this.registerEventRepository.findOne({
        where: {
          userId: userId,
          eventId: checkInData.eventId,
          isRegister: true,
        },
      });

      if (!registration) {
        throw new BadRequestException(
          'User is not registered for this event. Cannot check in.',
        );
      }

      // Check existing attendance record
      let attendance = await this.attendanceRepository.findOne({
        where: {
          userId: userId,
          eventId: checkInData.eventId,
        },
      });

      if (attendance && attendance.status === AttendanceStatus.CheckedIn) {
        throw new ConflictException(
          'User is already checked in for this event.',
        );
      }

      const method = checkInData.checkInMethod ?? CheckInMethod.QRCode;
      if (attendance) {
        // Update existing attendance record
        attendance.status = AttendanceStatus.CheckedIn;
        attendance.checkInTime = new Date();
        attendance.checkInLocation = checkInData.checkInLocation;
        attendance.checkedInBy = adminUserId;
        attendance.notes = checkInData.notes;
        attendance.checkInMethod = method;
      } else {
        // Create new attendance record
        attendance = this.attendanceRepository.create({
          userId: userId,
          eventId: checkInData.eventId,
          registerEventId: registration.id,
          status: AttendanceStatus.CheckedIn,
          checkInTime: new Date(),
          checkInLocation: checkInData.checkInLocation,
          checkedInBy: adminUserId,
          notes: checkInData.notes,
          checkInMethod: method,
        });
      }

      const savedAttendance = await this.attendanceRepository.save(attendance);

      // Auto-generate lucky draw number if feature is enabled and this is first check-in
      if (event.enableLuckyDrawFeature && attendance.status === AttendanceStatus.CheckedIn) {
        await this.generateLuckyDrawNumber(registration.id, checkInData.eventId);
      }

      this.attendanceGateway?.emitAttendanceUpdate(checkInData.eventId);

      return savedAttendance;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ResourceNotFoundException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'QR code check-in');
    }
  }

  /**
   * Manual check-in by admin (for users without QR codes or as backup)
   */
  async manualCheckIn(
    checkInData: ManualCheckInDto,
    adminUserId: string,
  ): Promise<EventAttendance> {
    try {
      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { id: checkInData.userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', checkInData.userId);
      }

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: checkInData.eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', checkInData.eventId);
      }

      // Check if user is registered for the event
      const registration = await this.registerEventRepository.findOne({
        where: {
          userId: checkInData.userId,
          eventId: checkInData.eventId,
          isRegister: true,
        },
      });

      if (!registration) {
        throw new BadRequestException(
          'User is not registered for this event. Cannot check in.',
        );
      }

      // Check existing attendance
      let attendance = await this.attendanceRepository.findOne({
        where: {
          userId: checkInData.userId,
          eventId: checkInData.eventId,
        },
      });

      if (attendance && attendance.status === AttendanceStatus.CheckedIn) {
        throw new ConflictException('User is already checked in for this event.');
      }

      if (attendance) {
        // Update existing attendance record
        attendance.status = AttendanceStatus.CheckedIn;
        attendance.checkInTime = new Date();
        attendance.checkInLocation = checkInData.checkInLocation;
        attendance.checkedInBy = adminUserId;
        attendance.notes = checkInData.notes;
        attendance.checkInMethod = checkInData.checkInMethod || CheckInMethod.Manual;
      } else {
        // Create new attendance record
        attendance = this.attendanceRepository.create({
          userId: checkInData.userId,
          eventId: checkInData.eventId,
          registerEventId: registration.id,
          status: AttendanceStatus.CheckedIn,
          checkInTime: new Date(),
          checkInLocation: checkInData.checkInLocation,
          checkedInBy: adminUserId,
          notes: checkInData.notes,
          checkInMethod: checkInData.checkInMethod || CheckInMethod.Manual,
        });
      }

      const savedAttendance = await this.attendanceRepository.save(attendance);

      // Auto-generate lucky draw number if feature is enabled and this is first check-in
      if (event.enableLuckyDrawFeature && attendance.status === AttendanceStatus.CheckedIn) {
        await this.generateLuckyDrawNumber(registration.id, checkInData.eventId);
      }

      this.attendanceGateway?.emitAttendanceUpdate(checkInData.eventId);

      return savedAttendance;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ResourceNotFoundException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Manual check-in');
    }
  }

  /**
   * Check-in via share link (public, no admin). Same as manual check-in with checkedInBy = userId.
   */
  async checkInByShareLink(userId: string, eventId: string): Promise<EventAttendance> {
    return this.manualCheckIn(
      { userId, eventId, checkInMethod: CheckInMethod.Manual },
      userId,
    );
  }

  /**
   * Check out user from event
   */
  async checkOut(
    checkOutData: CheckOutDto,
    adminUserId: string,
  ): Promise<EventAttendance> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: {
          userId: checkOutData.userId,
          eventId: checkOutData.eventId,
        },
      });

      if (!attendance) {
        throw new ResourceNotFoundException('Attendance record', `${checkOutData.userId}-${checkOutData.eventId}`);
      }

      if (attendance.status !== AttendanceStatus.CheckedIn) {
        throw new BadRequestException('User is not currently checked in for this event.');
      }

      attendance.status = AttendanceStatus.CheckedOut;
      attendance.checkOutTime = new Date();
      attendance.notes = checkOutData.notes;

      const saved = await this.attendanceRepository.save(attendance);
      this.attendanceGateway?.emitAttendanceUpdate(checkOutData.eventId);
      return saved;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ResourceNotFoundException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Check-out');
    }
  }

  /**
   * Get attendance records for a specific event
   */
  async getEventAttendance(eventId: string): Promise<EventAttendance[]> {
    try {
      return await this.attendanceRepository.find({
        where: { eventId },
        relations: ['user', 'event', 'registerEvent'],
        order: { checkInTime: 'DESC' },
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Event attendance retrieval');
    }
  }

  /**
   * Get attendance records for a specific user
   */
  async getUserAttendance(userId: string): Promise<EventAttendance[]> {
    try {
      return await this.attendanceRepository.find({
        where: { userId },
        relations: ['event', 'registerEvent'],
        order: { checkInTime: 'DESC' },
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'User attendance retrieval');
    }
  }

  /**
   * Get comprehensive attendance statistics for an event
   */
  async getEventAttendanceStats(eventId: string): Promise<{
    totalRegistered: number;
    totalCheckedIn: number;
    totalCheckedOut: number;
    totalNoShow: number;
    totalWalkInRegistrations: number;
    totalAttendees: number; // Total people who attended (checked in + walk-ins)
    checkInRate: number;
    attendanceRate: number; // Percentage of registered who actually attended
    walkInRate: number; // Percentage of walk-ins vs total attendees
    liveStatus: {
      currentlyCheckedIn: number;
      currentlyCheckedOut: number;
      currentlyNoShow: number;
    };
    registrationBreakdown: {
      preEventRegistrations: number;
      walkInRegistrations: number;
    };
    eventInfo: {
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      isEventActive: boolean;
      isEventEnded: boolean;
    };
  }> {
    try {
      // Get event information
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      const now = new Date();
      const isEventActive = now >= event.startDate && now <= event.endDate;
      const isEventEnded = now > event.endDate;

      // Get total registrations for the event
      const totalRegistered = await this.registerEventRepository.count({
        where: {
          eventId: eventId,
          isRegister: true,
        },
      });

      // Get walk-in registrations (registrations made between event start and end time)
      const totalWalkInRegistrations = await this.registerEventRepository
        .createQueryBuilder('registerEvent')
        .where('registerEvent.eventId = :eventId', { eventId })
        .andWhere('registerEvent.isRegister = :isRegister', { isRegister: true })
        .andWhere('registerEvent.createdAt >= :startDate', { startDate: event.startDate })
        .andWhere('registerEvent.createdAt <= :endDate', { endDate: event.endDate })
        .getCount();

      // Get pre-event registrations
      const preEventRegistrations = totalRegistered - totalWalkInRegistrations;

      // Get attendance counts by status
      const attendanceCounts = await this.attendanceRepository
        .createQueryBuilder('attendance')
        .select('attendance.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('attendance.eventId = :eventId', { eventId })
        .groupBy('attendance.status')
        .getRawMany();

      const stats = {
        totalRegistered,
        totalCheckedIn: 0,
        totalCheckedOut: 0,
        totalNoShow: 0,
        totalWalkInRegistrations,
        totalAttendees: 0,
        checkInRate: 0,
        attendanceRate: 0,
        walkInRate: 0,
        liveStatus: {
          currentlyCheckedIn: 0,
          currentlyCheckedOut: 0,
          currentlyNoShow: 0,
        },
        registrationBreakdown: {
          preEventRegistrations,
          walkInRegistrations: totalWalkInRegistrations,
        },
        eventInfo: {
          id: event.id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          isEventActive,
          isEventEnded,
        },
      };

      // Calculate counts from attendance records
      attendanceCounts.forEach((item) => {
        const count = parseInt(item.count);
        switch (item.status) {
          case AttendanceStatus.CheckedIn:
            stats.totalCheckedIn = count;
            stats.liveStatus.currentlyCheckedIn = count;
            break;
          case AttendanceStatus.CheckedOut:
            stats.totalCheckedOut = count;
            stats.liveStatus.currentlyCheckedOut = count;
            break;
          case AttendanceStatus.NoShow:
            stats.totalNoShow = count;
            stats.liveStatus.currentlyNoShow = count;
            break;
        }
      });

      // Calculate total attendees (checked in + walk-ins)
      stats.totalAttendees = stats.totalCheckedIn + totalWalkInRegistrations;

      // Calculate rates
      if (totalRegistered > 0) {
        stats.checkInRate = (stats.totalCheckedIn / totalRegistered) * 100;
        stats.attendanceRate = (stats.totalAttendees / totalRegistered) * 100;
      }

      if (stats.totalAttendees > 0) {
        stats.walkInRate = (totalWalkInRegistrations / stats.totalAttendees) * 100;
      }

      return stats;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event attendance statistics');
    }
  }

  /**
   * Get live attendance status for real-time updates
   * - Optimized for frequent polling
   * - Returns only essential live data
   */
  async getLiveAttendanceStatus(eventId: string): Promise<{
    totalRegistered: number;
    totalCheckedIn: number;
    totalWalkInRegistrations: number;
    totalAttendees: number;
    checkInRate: number;
    attendanceRate: number;
    liveStatus: {
      currentlyCheckedIn: number;
      currentlyCheckedOut: number;
      currentlyNoShow: number;
    };
    eventInfo: {
      id: string;
      name: string;
      isEventActive: boolean;
      isEventEnded: boolean;
    };
    lastUpdated: string;
  }> {
    try {
      // Get event information
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
        select: ['id', 'name', 'startDate', 'endDate'],
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      const now = new Date();
      const isEventActive = now >= event.startDate && now <= event.endDate;
      const isEventEnded = now > event.endDate;

      // Get total registrations (optimized query)
      const totalRegistered = await this.registerEventRepository.count({
        where: {
          eventId: eventId,
          isRegister: true,
        },
      });

      // Get walk-in registrations (optimized query)
      const totalWalkInRegistrations = await this.registerEventRepository
        .createQueryBuilder('registerEvent')
        .where('registerEvent.eventId = :eventId', { eventId })
        .andWhere('registerEvent.isRegister = :isRegister', { isRegister: true })
        .andWhere('registerEvent.createdAt >= :startDate', { startDate: event.startDate })
        .andWhere('registerEvent.createdAt <= :endDate', { endDate: event.endDate })
        .getCount();

      // Get attendance counts by status (optimized query)
      const attendanceCounts = await this.attendanceRepository
        .createQueryBuilder('attendance')
        .select('attendance.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('attendance.eventId = :eventId', { eventId })
        .groupBy('attendance.status')
        .getRawMany();

      let totalCheckedIn = 0;
      let currentlyCheckedIn = 0;
      let currentlyCheckedOut = 0;
      let currentlyNoShow = 0;

      // Calculate counts from attendance records
      attendanceCounts.forEach((item) => {
        const count = parseInt(item.count);
        switch (item.status) {
          case AttendanceStatus.CheckedIn:
            totalCheckedIn = count;
            currentlyCheckedIn = count;
            break;
          case AttendanceStatus.CheckedOut:
            currentlyCheckedOut = count;
            break;
          case AttendanceStatus.NoShow:
            currentlyNoShow = count;
            break;
        }
      });

      // Calculate total attendees and rates
      const totalAttendees = totalCheckedIn + totalWalkInRegistrations;
      const checkInRate = totalRegistered > 0 ? (totalCheckedIn / totalRegistered) * 100 : 0;
      const attendanceRate = totalRegistered > 0 ? (totalAttendees / totalRegistered) * 100 : 0;

      return {
        totalRegistered,
        totalCheckedIn,
        totalWalkInRegistrations,
        totalAttendees,
        checkInRate: Math.round(checkInRate * 100) / 100, // Round to 2 decimal places
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        liveStatus: {
          currentlyCheckedIn,
          currentlyCheckedOut,
          currentlyNoShow,
        },
        eventInfo: {
          id: event.id,
          name: event.name,
          isEventActive,
          isEventEnded,
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Live attendance status');
    }
  }

  /**
   * Generate lucky draw number based on check-in sequence
   */
  async generateLuckyDrawNumber(registerEventId: string, eventId: string): Promise<void> {
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
   * Update attendance record
   */
  async updateAttendance(
    attendanceId: string,
    updateData: UpdateAttendanceDto,
  ): Promise<EventAttendance> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id: attendanceId },
      });

      if (!attendance) {
        throw new ResourceNotFoundException('Attendance record', attendanceId);
      }

      // Update fields
      Object.assign(attendance, updateData);

      // Convert string dates to Date objects if provided
      if (updateData.checkInTime) {
        attendance.checkInTime = new Date(updateData.checkInTime);
      }
      if (updateData.checkOutTime) {
        attendance.checkOutTime = new Date(updateData.checkOutTime);
      }

      return await this.attendanceRepository.save(attendance);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Attendance update');
    }
  }

  /**
   * Delete attendance record
   */
  async deleteAttendance(attendanceId: string): Promise<{ message: string }> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id: attendanceId },
      });

      if (!attendance) {
        throw new ResourceNotFoundException('Attendance record', attendanceId);
      }

      await this.attendanceRepository.remove(attendance);
      return { message: 'Attendance record deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Attendance deletion');
    }
  }

  /**
   * Get registered participants with their attendance status
   * Returns all registered participants and whether they marked attendance (QR scanned)
   */
  async getRegisteredParticipantsWithAttendance(eventId: string): Promise<{
    participants: Array<{
      registrationId: string;
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      mobile?: string;
      company?: string;
      designation?: string;
      type: string;
      registeredAt: Date;
      hasMarkedAttendance: boolean;
      attendanceStatus?: AttendanceStatus;
      checkInTime?: Date;
      checkInMethod?: CheckInMethod;
      checkOutTime?: Date;
      luckyDrawNumber?: string; // 4-digit lucky draw number (0001-9999)
    }>;
    summary: {
      totalRegistered: number;
      totalAttended: number;
      totalNotAttended: number;
      attendanceRate: number;
    };
  }> {
    try {
      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Get all registered participants for the event
      const registrations = await this.registerEventRepository.find({
        where: {
          eventId: eventId,
          isRegister: true,
        },
        relations: ['user', 'adminInfo'],
        order: {
          createdAt: 'DESC',
        },
      });

      // Get all attendance records for the event
      const attendanceRecords = await this.attendanceRepository.find({
        where: { eventId: eventId },
      });

      // Create a map of userId -> attendance record for quick lookup
      const attendanceMap = new Map<string, EventAttendance>();
      attendanceRecords.forEach((attendance) => {
        attendanceMap.set(attendance.userId, attendance);
      });

      // Build participants list with attendance status
      const participants = registrations.map((registration) => {
        const attendance = attendanceMap.get(registration.userId || '');
        const hasMarkedAttendance = !!attendance && 
          (attendance.status === AttendanceStatus.CheckedIn || 
           attendance.status === AttendanceStatus.CheckedOut);

        return {
          registrationId: registration.id,
          userId: registration.userId || '',
          firstName: registration.user?.firstName || '',
          lastName: registration.user?.lastName || '',
          email: registration.user?.email || '',
          mobile: registration.user?.mobile || undefined,
          company: registration.user?.company || undefined,
          designation: registration.user?.designation || undefined,
          type: registration.type || 'Attendee',
          registeredAt: registration.createdAt,
          hasMarkedAttendance,
          attendanceStatus: attendance?.status,
          checkInTime: attendance?.checkInTime,
          checkInMethod: attendance?.checkInMethod,
          checkOutTime: attendance?.checkOutTime,
          luckyDrawNumber: registration.adminInfo?.luckyDrawNumber || undefined,
        };
      });

      // Calculate summary statistics
      const totalRegistered = participants.length;
      const totalAttended = participants.filter((p) => p.hasMarkedAttendance).length;
      const totalNotAttended = totalRegistered - totalAttended;
      const attendanceRate = totalRegistered > 0 ? (totalAttended / totalRegistered) * 100 : 0;

      return {
        participants,
        summary: {
          totalRegistered,
          totalAttended,
          totalNotAttended,
          attendanceRate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimal places
        },
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Get registered participants with attendance');
    }
  }
}
