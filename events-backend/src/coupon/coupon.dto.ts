import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ApplyCouponDto {
    @IsNotEmpty()
    @IsString()
    name!: string; // Voucher name
  }

export class CreateCouponDto {
  
  @IsNotEmpty()
  @IsString()
  name!: string; // Voucher name
  
  @IsNotEmpty()
  @IsBoolean()
  isActive!: boolean;

  @IsNotEmpty()
  @IsNumber()
  actualValue!: number;


  @IsNotEmpty()
  @IsNumber()
  discountValue!: number;

  @IsNotEmpty()
  @IsString()
  discountType!: 'percentage' | 'fixed';

  @IsNotEmpty()
  @IsNumber()
  usageLimit!: number;

  @IsOptional()
  @IsDate()
  validFrom?: Date; // Voucher valid from date

  @IsOptional()
  @IsDate()
  validTo?: Date; // Voucher valid to date

  @IsOptional()
  @IsString()
  eventId?: string; // Event ID - optional, null means global coupon
}