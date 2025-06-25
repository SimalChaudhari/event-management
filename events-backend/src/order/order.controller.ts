// events-backend/src/order/order.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, Res, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './order.entity';
import { Request, Response } from 'express';
import { CreateEventOrderDto, CreateOrderWithItemsDto, OrderDto, UpdateOrderItemStatusDto } from './order.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';

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
        const role = req.user.role;
        const orders = await this.orderService.getAllOrders(userId,role);
    
        return response.status(200).json({
            success: true,
            message: role === 'admin' 
                ? 'All orders retrieved successfully' 
                : 'Your orders retrieved successfully',
            count: orders.length,
            data: orders,
        });
    }
    
    @Get(':id')
    async getOrderById(@Param('id') id: string, @Req() req: Request, @Res() response: Response) {
        const userId = req.user.id;
        const role = req.user.role;
        const order = await this.orderService.getOrderById(id, userId, role);
        return response.status(200).json({
            success: true,
            message: 'Order retrieved successfully',
            data: order,
        });
    }
    
    @Delete('delete/:id')
    async deleteOrder(@Param('id') id: string, @Req() req: Request, @Res() response: Response) {
        const userId = req.user.id;
        const role = req.user.role;
        await this.orderService.deleteOrder(id, userId, role);
        return response.status(200).json({
            success: true,
            message: 'Order deleted successfully',
        });
    }
    
    @Put('item/status')
    async updateOrderItemStatus(
        @Body() dto: UpdateOrderItemStatusDto,
        @Req() req: Request,
        @Res() response: Response
    ) {
        const userId = req.user.id;
        const role = req.user.role;
        
        const result = await this.orderService.updateOrderItemStatus(
            dto.orderItemId,
            dto.status,
            userId,
            role
        );
        
        return response.status(200).json({
            success: true,
            message: `Order item status updated to ${dto.status} successfully`,
            data: result,
        });
    }
}