import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export enum Type {
  Attendee = 'Attendee',
  Exhibitor = 'Exhibitor',
}

export enum Status {
  // Pending = 'Pending',
  Sucesss = 'Sucesss',
  Withdraw = 'Withdraw',
}

// DTO for regular user registration (userId comes from JWT token)
export class CreateRegisterEventDto {
  @IsOptional()
  @IsString()
  eventId?: string;

  @IsEnum(Type)
  type: Type = Type.Attendee;  // Default type is 'Attendee'

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsEnum(Status)
  status: Status = Status.Sucesss;

  @IsOptional()
  @IsBoolean()
  isCreatedByAdmin?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isRegister?: boolean = true;
}

// DTO for admin registration (userId required in body)
export class AdminCreateRegisterEventDto extends CreateRegisterEventDto {
  @IsUUID()
  userId!: string; // Required for admin to specify which user to register
}

export class UpdateRegisterEventDto {
  userId?: string;
  eventId?: string;
  type?: 'Attendee' | 'Exhibitor';
  isCreatedByAdmin?: boolean;
  orderId?: string;
  isRegister?: boolean;
}