// events-backend/src/order/order.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './order.entity';
import { Request, Response } from 'express';
import {
  CreateEventOrderDto,
  CreateOrderWithItemsDto,
  OrderDto,
  UpdateOrderItemStatusDto,
} from './order.dto';
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
  async getAllOrders(
    @Req() req: Request,
    @Res() response: Response,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('userId') filterUserId?: string,
  ) {
    const userId = req.user.id;
    const role = req.user.role;

    const usePagination = page !== undefined || limit !== undefined || search !== undefined || status !== undefined || dateFrom !== undefined || dateTo !== undefined || filterUserId !== undefined;

    if (usePagination) {
      const result = await this.orderService.getAllOrdersWithPagination(userId, role, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        sortBy,
        sortOrder,
        search,
        status: status as any,
        dateFrom,
        dateTo,
        userId: filterUserId,
      });
      return response.status(200).json({
        success: true,
        message: 'Orders retrieved successfully',
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    }

    const orders = await this.orderService.getAllOrders(userId, role);
    return response.status(200).json({
      success: true,
      message:
        role === 'admin'
          ? 'All orders retrieved successfully'
          : 'Your orders retrieved successfully',
      count: orders.length,
      data: orders,
    });
  }

  @Get('customers/list')
  async getOrderCustomers(
    @Req() req: Request,
    @Res() response: Response,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    const role = req.user.role;
    const pageNum = Math.max(1, page ? parseInt(page, 10) : 1);
    const limitNum = Math.min(50, Math.max(1, limit ? parseInt(limit, 10) : 20));
    const result = await this.orderService.getOrderCustomers(
      userId,
      role,
      search || '',
      pageNum,
      limitNum,
    );
    return response.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }

  @Get(':id')
  async getOrderById(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const userId = req.user.id;
    const role = req.user.role;
    const order = await this.orderService.getOrderById(id, userId, role);
    return response.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: order,
    });
  }

  @Delete('delete-all')
  async deleteAllOrders(@Req() req: Request, @Res() response: Response) {
    const userId = req.user.id;
    const role = req.user.role;
    const result = await this.orderService.deleteAllOrders(userId, role);
    return response.status(200).json({
      success: true,
      message: result.deleted > 0 ? `Successfully deleted ${result.deleted} order(s).` : 'No orders to delete.',
      deleted: result.deleted,
    });
  }

  @Delete('delete/:id')
  async deleteOrder(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const userId = req.user.id;
    const role = req.user.role;
    await this.orderService.deleteOrder(id, userId, role);
    return response.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  }

  @Put('item/status/:id')
  async updateOrderItemStatus(
    @Param('id') orderItemId: string,
    @Body() dto: UpdateOrderItemStatusDto,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const user = req.user;

    if (user.role !== process.env.ADMIN) {
      throw new NotFoundException('You are not authorized to change status');
    }

    const result = await this.orderService.updateOrderItemStatus(
      orderItemId,
      dto.status,
    );

    return response.status(200).json({
      success: true,
      message: `Order item status updated to ${dto.status} successfully`,
      data: result,
    });
  }
}
