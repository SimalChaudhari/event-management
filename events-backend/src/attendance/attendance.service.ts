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

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(EventAttendance)
    private attendanceRepository: Repository<EventAttendance>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

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
  ): Promise<EventAttendance> {
    try {
      // First scan the QR code to get user info
      const scanResult = await this.scanQRCodeForAttendance(
        checkInData.qrCodeId,
        checkInData.eventId,
      );

      if (!scanResult.data?.isRegistered) {
        throw new BadRequestException(
          'User is not registered for this event. Cannot check in.',
        );
      }

      if (!scanResult.data?.canCheckIn) {
        throw new ConflictException(
          'User is already checked in or cannot be checked in at this time.',
        );
      }

      const userId = scanResult.data?.user.id;
      const eventId = checkInData.eventId;

      // Check if attendance record already exists
      let attendance = await this.attendanceRepository.findOne({
        where: {
          userId: userId,
          eventId: eventId,
        },
      });

      if (attendance) {
        // Update existing attendance record
        attendance.status = AttendanceStatus.CheckedIn;
        attendance.checkInTime = new Date();
        attendance.checkInLocation = checkInData.checkInLocation;
        attendance.checkedInBy = adminUserId;
        attendance.notes = checkInData.notes;
        attendance.checkInMethod = CheckInMethod.QRCode;
      } else {
        // Create new attendance record
        attendance = this.attendanceRepository.create({
          userId: userId,
          eventId: eventId,
          registerEventId: scanResult.data?.registration?.id,
          status: AttendanceStatus.CheckedIn,
          checkInTime: new Date(),
          checkInLocation: checkInData.checkInLocation,
          checkedInBy: adminUserId,
          notes: checkInData.notes,
          checkInMethod: CheckInMethod.QRCode,
        });
      }

      return await this.attendanceRepository.save(attendance);
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

      return await this.attendanceRepository.save(attendance);
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

      return await this.attendanceRepository.save(attendance);
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
   * Get attendance statistics for an event
   */
  async getEventAttendanceStats(eventId: string): Promise<{
    totalRegistered: number;
    totalCheckedIn: number;
    totalCheckedOut: number;
    totalNoShow: number;
    checkInRate: number;
  }> {
    try {
      // Get total registrations for the event
      const totalRegistered = await this.registerEventRepository.count({
        where: {
          eventId: eventId,
          isRegister: true,
        },
      });

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
        checkInRate: 0,
      };

      // Calculate counts from attendance records
      attendanceCounts.forEach((item) => {
        const count = parseInt(item.count);
        switch (item.status) {
          case AttendanceStatus.CheckedIn:
            stats.totalCheckedIn = count;
            break;
          case AttendanceStatus.CheckedOut:
            stats.totalCheckedOut = count;
            break;
          case AttendanceStatus.NoShow:
            stats.totalNoShow = count;
            break;
        }
      });

      // Calculate check-in rate
      if (totalRegistered > 0) {
        stats.checkInRate = (stats.totalCheckedIn / totalRegistered) * 100;
      }

      return stats;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Event attendance statistics');
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
}
