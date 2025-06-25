// events-backend/src/order/order.dto.ts
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';

export enum OrderStatus {
    Pending = 'Pending',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
}

export enum PaymentMethod {
    Cash = 'Cash',
    BankTransfer = 'Bank Transfer',
    CreditCard = 'Credit Card',
    PayPal = 'PayPal',
}

export enum OrderNoStatus {
    Pending = 'Pending',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
}

export class OrderDto {
    @IsOptional()
    @IsString()
    orderNo?: string;

    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod;

    @IsNotEmpty()
    @IsNumber()
    price!: number;

    @IsOptional()
    @IsNumber()
    discount?: number;

    @IsOptional()
    @IsNumber()
    originalPrice?: number; 

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;
    
}

export class CreateOrderWithItemsDto {
    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod;

    @IsNotEmpty()
    @IsNumber()
    price!: number;

    @IsOptional()
    @IsNumber()
    discount?: number;

    @IsOptional()
    @IsNumber()
    originalPrice?: number; 

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsNotEmpty()
    eventId!: string;

    @IsOptional()
    @IsString()
    couponCode?: string;
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

export class UpdateOrderItemStatusDto {
    @IsNotEmpty()
    @IsString()
    orderItemId!: string;

    @IsNotEmpty()
    @IsEnum(OrderNoStatus)
    status!: OrderNoStatus;
}