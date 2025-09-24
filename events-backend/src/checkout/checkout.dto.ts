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

export class InAppPaymentDto {
    @IsOptional()
    @IsString()
    checkoutId?: string; // Made optional - only needed for actual payment

    @IsNotEmpty()
    @IsString()
    cardNumber!: string;

    @IsNotEmpty()
    @IsNumber()
    expMonth!: number;

    @IsNotEmpty()
    @IsNumber()
    expYear!: number;

    @IsNotEmpty()
    @IsString()
    cvc!: string;

    @IsOptional()
    @IsString()
    cardholderName?: string;

    @IsOptional()
    @IsString()
    billingEmail?: string;

    @IsOptional()
    @IsString()
    billingPhone?: string;

    @IsOptional()
    @IsString()
    nickname?: string; // User-defined name for the card

    @IsOptional()
    @IsBoolean()
    savePaymentMethod?: boolean = true; // Default: Save card (since we're creating cards)

    @IsOptional()
    @IsBoolean()
    setAsDefault?: boolean = true; // Default: Set as default card
}

export class CreateCardDto {
  @IsNotEmpty()
  @IsString()
  cardNumber!: string;

  @IsNotEmpty()
  @IsNumber()
  expMonth!: number;

  @IsNotEmpty()
  @IsNumber()
  expYear!: number;

  @IsNotEmpty()
  @IsString()
  cvc!: string;

  @IsOptional()
  @IsString()
  cardholderName?: string;

  @IsOptional()
  @IsString()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  billingPhone?: string;

  @IsOptional()
  @IsString()
  nickname?: string; // User-defined name for the card

  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean = true; // Default: Set as default card
}

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  cardholderName?: string;

  @IsOptional()
  @IsString()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  billingPhone?: string;

  @IsOptional()
  @IsString()
  nickname?: string; // User-defined name for the card

  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean; // Set as default card
}

export class InAppPaymentWithSavedMethodDto {
  @IsNotEmpty()
  @IsString()
  checkoutId!: string;

  @IsNotEmpty()
  @IsString()
  paymentMethodId!: string;

  @IsNotEmpty()
  @IsString()
  cvc!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}