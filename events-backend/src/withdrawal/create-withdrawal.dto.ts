// src/withdrawal/dto/create-withdrawal.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, IsUUID } from 'class-validator';

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class CreateWithdrawalDto {
  @IsUUID()
  @IsNotEmpty()
  order_id!: string;

  @IsUUID()
  @IsNotEmpty()
  event_id!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  reason!: string;

  // @IsOptional()
  // @IsString()
  // comment?: string;

  // @IsNotEmpty()
  // @IsString()
  // document!: string;

  @IsEnum(WithdrawalStatus)
  status!: WithdrawalStatus;

  @IsOptional()
  @IsString()
  admin_note?: string;
}
