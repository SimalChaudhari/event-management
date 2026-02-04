import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, ArrayMinSize, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum CheckoutStatus {
    Pending = 'Pending',
    Processing = 'Processing',
    Completed = 'Completed',
    Failed = 'Failed',
    Cancelled = 'Cancelled',
}

export enum PaymentGateway {
    WooShPay = 'WooShPay',
    PayPal = 'PayPal',
    Stripe = 'Stripe',
    Cash = 'Cash',
    BankTransfer = 'Bank Transfer',
}

export class CartItemDto {
    @IsNotEmpty()
    @IsString()
    eventId!: string;

    @IsNotEmpty()
    @IsNumber()
    price!: number;

    @IsOptional()
    @IsString()
    eventName?: string;
}

export class CreateCheckoutDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CartItemDto)
    cartItems!: CartItemDto[];

    @IsOptional()
    @IsString()
    couponCode?: string;

    @IsOptional()
    @IsNumber()
    discount?: number;

    @IsNotEmpty()
    @IsNumber()
    totalAmount!: number;

    @IsOptional()
    @IsString()
    promoCode?: string;

    @IsOptional()
    useSelectedItemsOnly?: boolean; // Flag to indicate if only selected cart items should be processed
}



export class CheckoutResponseDto {
    @IsNotEmpty()
    @IsString()
    checkoutId!: string;

    @IsNotEmpty()
    @IsEnum(CheckoutStatus)
    status!: CheckoutStatus;

    @IsNotEmpty()
    @IsNumber()
    totalAmount!: number;

    @IsOptional()
    @IsNumber()
    discount?: number;

    @IsOptional()
    @IsString()
    couponCode?: string;

    @IsOptional()
    @IsString()
    paymentUrl?: string;

    @IsOptional()
    @IsString()
    message?: string;
}

/** Optional body for get-or-create WooShPay customer (all fields optional) */
export class WooShPayCustomerDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  address?: {
    city?: string;
    country?: string;
    line1?: string;
    line2?: string;
    postal_code?: string;
    state?: string;
  };

  @IsOptional()
  shipping?: {
    address?: { city?: string; country?: string; line1?: string; line2?: string; postal_code?: string; state?: string };
    name?: string;
    phone?: string;
  };
}

/** Body for creating WooShPay checkout session. successUrl, cancelUrl, currency are set by backend from env. */
export class CreateWooShPaySessionDto {
  @IsNotEmpty()
  @IsString()
  checkoutId!: string;
}