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

export class CreateRegisterEventDto {
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsEnum(Type)
  type: Type = Type.Attendee;  // Default type is 'Attendee'

  @IsOptional()
  registerCode?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsEnum(Status)
  status: Status = Status.Sucesss;

  @IsOptional()
  @IsBoolean()
  isCreatedByAdmin?: boolean = false;

}
