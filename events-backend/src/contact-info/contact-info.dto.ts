import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsUUID, 
  IsBoolean, 
  IsDateString,
  Length,
  IsPhoneNumber
} from 'class-validator';

export class CreateContactInfoDto {
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @Length(10, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  location?: string;
}

export class UpdateContactInfoDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(10, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  location?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StoreScannedContactDto {
  @IsUUID()
  scannedUserId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  location?: string;

  @IsOptional()
  @IsBoolean()
  autoSyncToPhone?: boolean;

  @IsOptional()
  @IsBoolean()
  confirmAdd?: boolean; // New field for confirmation
}

export class GetScannedUserInfoDto {
  @IsUUID()
  scannedUserId!: string;
}

export class SyncContactsToPhoneDto {
  @IsOptional()
  @IsUUID()
  contactId?: string; // If provided, sync only this contact
}

export class ContactInfoResponseDto {
  success!: boolean;
  message!: string;
  data?: {
    contact: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      location?: string;
      isActive: boolean;
      isSyncedToPhone: boolean;
      syncedAt?: Date;
      createdAt: Date;
      updatedAt: Date;
    };
  };
  metadata?: {
    timestamp: string;
  };
}

export class ContactListResponseDto {
  success!: boolean;
  message!: string;
  data?: {
    contacts: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      location?: string;
      isActive: boolean;
      isSyncedToPhone: boolean;
      syncedAt?: Date;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
    syncedCount: number;
  };
  metadata?: {
    timestamp: string;
    page?: number;
    limit?: number;
  };
}

export class ScannedUserInfoResponseDto {
  success!: boolean;
  message!: string;
  data?: {
    scannedUser: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      profilePicture?: string;
      role: string;
    };
    alreadyExists: boolean;
  };
  metadata?: {
    timestamp: string;
  };
}

export class SyncResponseDto {
  success!: boolean;
  message!: string;
  data?: {
    syncedContacts: number;
    failedContacts: number;
    totalContacts: number;
    syncDetails: Array<{
      contactId: string;
      contactName: string;
      status: 'success' | 'failed';
      error?: string;
    }>;
  };
  metadata?: {
    timestamp: string;
  };
}
