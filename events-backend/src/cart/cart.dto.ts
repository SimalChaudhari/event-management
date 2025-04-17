// src/dto/cart.dto.ts
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CartDto {
    @IsNotEmpty()
    @IsUUID()
    eventId?: string; // Event ID to be added to the cart

    @IsNotEmpty()
    @IsUUID()
    userId?: string; // User ID who is adding the event to the cart
}