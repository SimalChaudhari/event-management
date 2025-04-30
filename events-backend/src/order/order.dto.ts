// events-backend/src/order/order.dto.ts
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';

export enum OrderStatus {
    Pending = 'Pending',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
}

export class OrderDto {
    @IsOptional()
    @IsString()
    orderNo?: string;

    @IsNotEmpty()
    @IsString()
    paymentMethod!: string;

    @IsNotEmpty()
    @IsNumber()
    price!: number;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;
    
}

export class CreateOrderWithItemsDto {
    @IsNotEmpty()
    paymentMethod!: string;

    @IsNotEmpty()
    @IsNumber()
    price!: number;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsNotEmpty()
    eventId!: string;
}



export class EventOrderDto {
    @IsNotEmpty()
    eventId!: string;
}


export class CreateEventOrderDto {

    @IsNotEmpty()
    orderId!: string;

    @ValidateNested({ each: true })
    @Type(() => EventOrderDto)
    @ArrayMinSize(1) // Ensure there's at least one item
    event!: EventOrderDto[];
}