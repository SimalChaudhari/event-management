import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum Type {
  Attendee = 'Attendee',
  Exhibitor = 'Exhibitor',
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

}
