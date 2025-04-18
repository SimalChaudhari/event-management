// events-backend/src/order/order.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, Res, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './order.entity';
import { Request, Response } from 'express';
import { CreateEventOrderDto, CreateOrderWithItemsDto, OrderDto } from './order.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { OrderItemEntity } from './event.item.entity';

@Controller('api/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) {}


    @Post('create')
    async createOrderWithItems(
        @Req() req: Request,
        @Body() dto: CreateOrderWithItemsDto,
    ) {
        const userId = req.user.id;
        return this.orderService.createOrderWithItems(userId, dto);
    }
    
    @Get()
    async getAllOrders(@Req() req: Request, @Res() response: Response) {
        const userId = req.user.id;
        const orders = await this.orderService.getAllOrders(userId);
    
        return response.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            length: orders.length, // 👈 total number of orders
            data: orders,
        });
    }
    
    @Get(':id')
    async getOrderById(@Param('id') id: string, @Req() req: Request, @Res() response: Response) {
        const userId = req.user.id;
        const order = await this.orderService.getOrderById(id, userId);
        return response.status(200).json({
            success: true,
            message: 'Order retrieved successfully',
            data: order,
        });
    }

    @Delete('delete/:id')
    async deleteOrder(@Param('id') id: string, @Req() req: Request, @Res() response: Response) {
        const userId = req.user.id;
        await this.orderService.deleteOrder(id, userId);
        return response.status(200).json({
            success: true,
            message: 'Order deleted successfully',
        });
    }
    
}