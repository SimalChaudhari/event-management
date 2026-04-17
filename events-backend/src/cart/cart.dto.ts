// src/dto/cart.dto.ts
import { IsNotEmpty, IsUUID, IsOptional, IsArray, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CartDto {
    @IsNotEmpty()
    @IsUUID()
    eventId?: string; // Event ID to be added to the cart

    @IsNotEmpty()
    @IsUUID()
    userId?: string; // User ID who is adding the event to the cart
}

export class CreateCheckoutFromCartDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    cartIds?: string[];

    @IsOptional()
    @IsString()
    couponCode?: string;

    @IsOptional()
    @IsBoolean()
    useAllCartItems?: boolean = false;
}

export class CartCheckoutSummaryDto {
    @IsNotEmpty()
    @IsString()
    cartId!: string;

    @IsNotEmpty()
    @IsString()
    eventId!: string;

    @IsNotEmpty()
    @IsString()
    eventName!: string;

    @IsNotEmpty()
    @IsNumber()
    price!: number;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsString()
    startDate?: string;
}

export class PayWithSavedCardDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    cartIds?: string[];

    @IsOptional()
    @IsString()
    couponCode?: string;

    @IsOptional()
    @IsBoolean()
    useAllCartItems?: boolean = false;

    @IsNotEmpty()
    @IsString()
    paymentMethodId!: string; // Selected saved payment method ID

    @IsNotEmpty()
    @IsString()
    cvc!: string; // CVV for the saved card

    @IsOptional()
    @IsString()
    notes?: string; // Optional notes
}

export class SelectableCartItemDto {
    @IsNotEmpty()
    @IsString()
    cartId!: string;

    @IsNotEmpty()
    @IsString()
    eventId!: string;

    @IsNotEmpty()
    @IsString()
    eventName!: string;

    @IsNotEmpty()
    @IsNumber()
    price!: number;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsBoolean()
    isSelected?: boolean = false;

    @IsOptional()
    @IsNumber()
    selectionIndex?: number;
}

export class DeleteMultipleCartsDto {
    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    cartIds!: string[];
}