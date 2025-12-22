import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AddressType } from './address.entity';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apartment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;

  @IsNotEmpty()
  @IsUUID()
  userId!: string;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apartment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class AddressQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SetDefaultAddressDto {
  @IsNotEmpty()
  @IsUUID()
  addressId!: string;
}
