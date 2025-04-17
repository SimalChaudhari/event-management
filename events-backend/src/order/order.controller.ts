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
    


    // @Post('add-items')
    // async addItemsToOrder(@Body() createEventOrderDto: CreateEventOrderDto): Promise<OrderItemEntity[]> {

    //     return this.orderService.addItemToOrder(createEventOrderDto);
    // }

    @Get()
    async getAllOrders() {
        return this.orderService.getAllOrders();
    }
    

    @Get(':id')
    async getOrderById(@Param('id') id: string, @Res() response: Response) {
        const order = await this.orderService.getOrderById(id);
        return response.status(200).json({
            success: true,
            message: 'Order retrieved successfully',
            data: order,
        });
    }

    @Put('update/:id')
    async updateOrder(@Param('id') id: string, @Body() orderData: Partial<Order>, @Res() response: Response) {
        const updatedOrder = await this.orderService.updateOrder(id, orderData);
        return response.status(200).json({
            success: true,
            message: 'Order updated successfully',
            data: updatedOrder,
        });
    }

    @Delete('delete/:id')
    async deleteOrder(@Param('id') id: string, @Res() response: Response) {
        await this.orderService.deleteOrder(id);
        return response.status(200).json({
            success: true,
            message: 'Order deleted successfully',
        });
    }
}