import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WithdrawalStatus } from './withdrawal.entity';

/** Body for withdrawal request: only optional fields. order_id and event_id come from URL params. */
export class CreateWithdrawalBodyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;
}

/** Internal: order_id + event_id from params + optional body. */
export interface CreateWithdrawalDto {
  order_id: string;
  event_id: string;
  name?: string;
  title?: string;
  reason?: string;
  status?: WithdrawalStatus;
}
