import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean, IsDateString, IsNumber, IsInt } from 'class-validator';
import { AttendanceStatus, CheckInMethod } from './attendance.entity';
import { EventQRCodeType, EventQRCodeStatus } from './event-qr-code.entity';

export class CheckInByQRCodeDto {
  @IsString()
  qrCodeId!: string;

  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsString()
  checkInLocation?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ManualCheckInDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsString()
  checkInLocation?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(CheckInMethod)
  checkInMethod?: CheckInMethod = CheckInMethod.Manual;
}

export class CheckOutDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  checkInLocation?: string;

  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @IsOptional()
  @IsDateString()
  checkOutTime?: string;
}

export class AttendanceResponseDto {
  success!: boolean;
  message!: string;
  data?: any;
  metadata?: {
    total?: number;
    timestamp: string;
  };
}

export class QRCodeScanResponseDto {
  success!: boolean;
  message!: string;
  data?: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      profilePicture?: string;
      role: string;
    };
    event: {
      id: string;
      title: string;
      startDate: Date;
      endDate: Date;
    };
    registration?: {
      id: string;
      type: string;
      status: string;
    };
    attendance?: {
      id: string;
      status: string;
      checkInTime?: Date;
      checkOutTime?: Date;
    };
    isRegistered: boolean;
    canCheckIn: boolean;
  };
  metadata?: {
    timestamp: string;
  };
}

// New DTOs for Event QR Codes
export class CreateEventQRCodeDto {
  @IsUUID()
  eventId!: string;

  @IsEnum(EventQRCodeType)
  type!: EventQRCodeType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  allowSelfCheckIn?: boolean = true;

  @IsOptional()
  @IsBoolean()
  autoRegister?: boolean = false;

  @IsOptional()
  @IsBoolean()
  redirectToPayment?: boolean = false;

  @IsOptional()
  @IsInt()
  maxScans?: number = -1;
}

export class UpdateEventQRCodeDto {
  @IsOptional()
  @IsEnum(EventQRCodeType)
  type?: EventQRCodeType;

  @IsOptional()
  @IsEnum(EventQRCodeStatus)
  status?: EventQRCodeStatus;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  allowSelfCheckIn?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRegister?: boolean;

  @IsOptional()
  @IsBoolean()
  redirectToPayment?: boolean;

  @IsOptional()
  @IsInt()
  maxScans?: number;
}

// DTOs for Contact Exchange
export class ContactExchangeDto {
  @IsUUID()
  scannedUserId!: string; // User whose QR code was scanned

  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ContactExchangeResponseDto {
  success!: boolean;
  message!: string;
  data?: {
    scannedUser: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      profilePicture?: string;
      role: string;
      companyName?: string;
      position?: string;
      phone?: string;
    };
    contactExchange: {
      id: string;
      createdAt: Date;
    };
  };
  metadata?: {
    timestamp: string;
  };
}

// DTOs for Exhibitor Stamp Collection
export class CollectExhibitorStampDto {
  @IsUUID()
  eventQRCodeId!: string; // QR code of the exhibition booth

  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ExhibitorStampResponseDto {
  success!: boolean;
  message!: string;
  data?: {
    booth: {
      name?: string;
      location?: string;
      description?: string;
    };
    stamp: {
      id: string;
      collectedAt: Date;
    };
    totalStamps: number;
  };
  metadata?: {
    timestamp: string;
  };
}

// DTOs for Self Check-in via Event QR Code
export class SelfCheckInDto {
  @IsString()
  qrCodeData!: string; // The scanned QR code data (e.g., "event_event-123_1700000000000_abc123")

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SelfCheckInResponseDto {
  success!: boolean;
  message!: string;
  data?: {
    checkInResult: {
      id: string;
      status: string;
      checkInTime: Date;
      method: string;
    };
    registration?: {
      id: string;
      type: string;
      status: string;
    };
    autoRegistered?: boolean;
    redirectToPayment?: boolean;
    paymentUrl?: string;
  };
  metadata?: {
    timestamp: string;
  };
}
