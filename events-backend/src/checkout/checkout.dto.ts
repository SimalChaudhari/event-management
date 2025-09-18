import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
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

export class ProcessPaymentDto {
    @IsNotEmpty()
    @IsString()
    checkoutId!: string;

    @IsNotEmpty()
    @IsEnum(PaymentGateway)
    paymentGateway!: PaymentGateway;

    @IsOptional()
    @IsString()
    paymentMethod?: string; // Credit Card, Debit Card, etc.

    @IsOptional()
    @IsString()
    cardNumber?: string; // Last 4 digits for reference

    @IsOptional()
    @IsString()
    transactionId?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class WooShPayPaymentDto {
    @IsNotEmpty()
    @IsString()
    checkoutId!: string;

    @IsNotEmpty()
    @IsNumber()
    amount!: number;

    @IsNotEmpty()
    @IsString()
    currency!: string;

    @IsNotEmpty()
    @IsString()
    customerEmail!: string;

    @IsOptional()
    @IsString()
    customerPhone?: string;

    @IsOptional()
    @IsString()
    customerName?: string;

    @IsOptional()
    @IsString()
    orderDescription?: string;

    @IsOptional()
    @IsString()
    returnUrl?: string;

    @IsOptional()
    @IsString()
    cancelUrl?: string;
}

export class PaymentResponseDto {
    @IsNotEmpty()
    @IsString()
    transactionId!: string;

    @IsNotEmpty()
    @IsString()
    status!: string;

    @IsOptional()
    @IsString()
    paymentUrl?: string;

    @IsOptional()
    @IsString()
    message?: string;

    @IsNotEmpty()
    @IsNumber()
    amount!: number;

    @IsNotEmpty()
    @IsString()
    currency!: string;
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
