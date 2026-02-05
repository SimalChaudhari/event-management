import { IsBoolean, IsDate, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ApplyCouponDto {
  @IsNotEmpty()
  @IsString()
  name!: string; // Voucher name

  @IsOptional()
  @IsNumber()
  orderAmount?: number; // Order amount for minimum check
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

  @IsNotEmpty({ message: 'Valid from date and time is required.' })
  @IsDateString()
  validFrom!: string; // Voucher valid from date and time (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)

  @IsNotEmpty({ message: 'Valid to date and time is required.' })
  @IsDateString()
  validTo!: string; // Voucher valid to date and time (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
}