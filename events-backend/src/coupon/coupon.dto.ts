import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ApplyCouponDto {
    @IsNotEmpty()
    @IsString()
    code!: string;
  }

export class CreateCouponDto {
  
  @IsNotEmpty()
  @IsString()
  code!: string;
  
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
  expiryDate?: Date;
}