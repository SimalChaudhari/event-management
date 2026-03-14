// events-backend/src/order/order.service.ts
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Like, Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateEventOrderDto, CreateOrderWithItemsDto, OrderDto, OrderStatus, OrderListQueryDto } from './order.dto';
import { UserEntity } from 'user/users.entity'; // Ensure this import is correct
import { OrderItemEntity } from './event.item.entity';
import { Event } from 'event/event.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { Cart } from 'cart/cart.entity';
import { getEventColor } from 'utils/event-color.util';
import { CouponService } from 'coupon/coupon.service';
import { generateUniqueOrderNumber } from 'utils/order-number.utils';
import { OrderNoStatus } from './order.dto';
import { Not, IsNull } from 'typeorm';
import { Checkout } from '../checkout/checkout.entity';
import { CheckoutCartItem } from '../checkout/checkout-cart-item.entity';
import { CheckoutUtils } from '../utils/checkout.utils';
import { toDisplayPrice } from '../utils/price.util';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(OrderItemEntity)
        private readonly orderItemRepository: Repository<OrderItemEntity>,
        @InjectRepository(RegisterEvent)
        private readonly registerEventRepository: Repository<RegisterEvent>,
        @InjectRepository(Checkout)
        private readonly checkoutRepository: Repository<Checkout>,
        @InjectRepository(CheckoutCartItem)
        private readonly checkoutCartItemRepository: Repository<CheckoutCartItem>,
        private readonly couponService: CouponService,
    ) {}

    /** Event fields only needed in order responses. Use priceOverride when returning from order item (charged price). */
    private mapEventToMinimal(event: any, priceOverride?: number): any {
        if (!event) return null;
        return {
            id: event.id,
            name: event.name,
            startDate: event.startDate,
            endDate: event.endDate,
            price: priceOverride != null ? priceOverride : toDisplayPrice(event.price),
            gstRate: event.gstRate != null ? Number(event.gstRate) : undefined,
            currency: event.currency,
            type: event.type,
            location: event.location,
            venue: event.venue,
            color: getEventColor(event.type),
        };
    }

    /** Build price breakdown for an order from its items and order discount. Uses unitPrice (charged at order time) when set. */
    private buildOrderPriceBreakdown(order: Order): { eventTotal: number; gstTotal: number; discount: number; total: number } {
        const items = order.orderItems || [];
        let eventTotal = 0;
        let gstTotal = 0;
        items.forEach((item) => {
            const base = Number((item as any).unitPrice ?? item.event?.price) || 0;
            const rate = Number(item.event?.gstRate) || 18;
            eventTotal += base;
            gstTotal += Math.round(base * (rate / 100) * 100) / 100;
        });
        const discount = Number(order.discount) || 0;
        const total = Number(order.price) ?? eventTotal + gstTotal - discount;
        return { eventTotal, gstTotal, discount, total };
    }

    private async getCheckoutForOrder(orderId: string): Promise<any> {
        try {
            return await CheckoutUtils.getCheckoutByOrderId(
                orderId,
                this.orderRepository,
                this.checkoutRepository,
                this.checkoutCartItemRepository,
            );
        } catch {
            return null;
        }
    }

    private async generateUniqueOrderNumber(): Promise<string> {
        try {
            return await generateUniqueOrderNumber(async (orderNo) => {
                const existing = await this.orderRepository.findOne({
                    where: { orderNo },
                    select: ['id'],
                });
                return !!existing;
            });
        } catch (error: any) {
            if (error?.message?.includes('unique order number')) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException('Error generating unique order number');
        }
    }

    async createOrderWithItems(userId: string, dto: CreateOrderWithItemsDto): Promise<any> {
        const { paymentMethod, price, eventId, couponCode } = dto;

        // 1. Split the eventId string into an array
        const eventIds = eventId.split(',').map((id) => id.trim());
        
        // 2. Validate user
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        
        // 3. Validate all eventIds and cart items FIRST
        const validatedEvents: Event[] = [];
        let totalPrice = 0;
        
        for (const id of eventIds) {
          const eventData = await this.eventRepository.findOne({ where: { id } });
          if (!eventData) {
            throw new NotFoundException(`Event with ID ${id} not found`);
          }
        
          const cartItem = await this.cartRepository.findOne({
            where: { userId, eventId: id },
          });
        
          if (!cartItem) {
            throw new NotFoundException(`Event ID ${id} is not in your cart`);
          }
        
          validatedEvents.push(eventData); // save for next step
          totalPrice += Number(eventData.price) || 0; // Add event price
        }

        // 4. Handle coupon logic
        let discount = 0;
        let couponData = null;

        if (couponCode) {
          try {
            const couponResult = await this.couponService.validateAndApplyCoupon(
              couponCode, 
              userId, 
              totalPrice
            );
            discount = couponResult.discount;
            couponData = couponResult.coupon;
          } catch (error: any) {
            throw new NotFoundException(`Coupon error: ${error.message}`);
          }
        }

        const finalPrice = totalPrice - discount;

        // 5. Check if price matches
        if (Number(price) !== finalPrice) {
          throw new NotFoundException(`Price mismatch! Actual price after coupon is ${finalPrice}, but received ${price}`);
        }
        
        // 6. Use transaction to ensure data consistency
        return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
            const orderNo = await this.generateUniqueOrderNumber();
            
            const order = transactionalEntityManager.create(Order, {
              orderNo,
              user,
              paymentMethod,
              price: finalPrice, // Use final price after discount
              status : OrderStatus.Completed,
              discount,
              originalPrice: totalPrice,
            });
            
            const savedOrder = await transactionalEntityManager.save(Order, order);
            
            // 7. Now create order items (Completed + invoice) and register events
            const savedOrderItems: any[] = [];

            for (const eventData of validatedEvents) {
              const invoiceNumber = await this.generateInvoiceNumberInTransaction(transactionalEntityManager);
              const orderItem = transactionalEntityManager.create(OrderItemEntity, {
                order: savedOrder,
                event: eventData,
                status: OrderNoStatus.Completed,
                invoiceNumber,
              });

              const savedItem = await transactionalEntityManager.save(OrderItemEntity, orderItem);

              savedOrderItems.push({
                id: savedItem.id,
                event: eventData,
                status: savedItem.status,
                invoiceNumber: savedItem.invoiceNumber,
                createdAt: savedItem.createdAt,
              });

              const registerEvent = transactionalEntityManager.create(RegisterEvent, {
                userId,
                eventId: eventData.id,
                type: 'Attendee',
                orderId: savedOrder.id,
              });

              await transactionalEntityManager.save(RegisterEvent, registerEvent);
            }

            // 8. Record coupon usage if coupon was applied
            if (couponData) {
              await this.couponService.recordCouponUsage(userId, couponData.id, savedOrder.id);
            }

            // 9. Delete cart items ONLY after everything is successful
            for (const eventData of validatedEvents) {
              await transactionalEntityManager.delete(Cart, { userId, eventId: eventData.id });
            }
            
            return {
              id: savedOrder.id,
              orderNo: savedOrder.orderNo,
              paymentMethod: savedOrder.paymentMethod,
              price: savedOrder.price,
              status: savedOrder.status,
              discount: savedOrder.discount,
              originalPrice: savedOrder.originalPrice,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                mobile: user.mobile,
              },
              orderItems: savedOrderItems,
            };
        });
    }
      
    

    async getOrderById(orderId: string, userId: string, role: string): Promise<any> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user', 'orderItems', 'orderItems.event'],
        });

        if (!order) throw new NotFoundException('Order not found');

        if (role !== 'admin' && order.user.id !== userId) {
            throw new ForbiddenException('You are not allowed to view this order');
        }

        const orderItems = (order.orderItems || []).map((item) => ({
            id: item.id,
            event: this.mapEventToMinimal(item.event, item.unitPrice != null ? Number(item.unitPrice) : undefined),
            status: item.status,
            invoiceNumber: item.invoiceNumber || null,
            createdAt: item.createdAt,
        }));

        const checkout = await this.getCheckoutForOrder(order.id);
        const price = Number(order.price);
        const priceBreakdown = this.buildOrderPriceBreakdown(order);

        return {
            id: order.id,
            orderNo: order.orderNo,
            paymentMethod: order.paymentMethod,
            price,
            amountPaid: price,
            status: order.status ?? 'Pending',
            discount: Number(order.discount),
            originalPrice: Number(order.originalPrice),
            priceBreakdown: {
                eventTotal: priceBreakdown.eventTotal,
                gstTotal: priceBreakdown.gstTotal,
                discount: priceBreakdown.discount,
                total: priceBreakdown.total,
            },
            user: {
                id: order.user.id,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                mobile: order.user.mobile,
                email: order.user.email,
            },
            orderItems,
            checkout,
        };
    }
    
    /** Map sortBy param to entity column */
    private orderSortField(sortBy: string): string {
        const allowed = { orderNo: 'orderNo', createdAt: 'createdAt', price: 'price', status: 'status' };
        return allowed[sortBy as keyof typeof allowed] || 'createdAt';
    }

    async getAllOrdersWithPagination(
        userId: string,
        role: string,
        filters: OrderListQueryDto = {},
    ): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number }> {
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
        const sortBy = this.orderSortField(filters.sortBy || 'createdAt');
        const sortOrder = (filters.sortOrder === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        const search = (filters.search || '').trim();
        const status = filters.status;
        const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const dateTo = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59.999Z') : null;
        const filterUserId = filters.userId?.trim();

        const countQb = this.orderRepository
            .createQueryBuilder('order')
            .leftJoin('order.user', 'user')
            .where('order.isDeleted = :isDeleted', { isDeleted: false });

        if (role !== 'admin') {
            countQb.andWhere('order.userId = :userId', { userId });
        }
        if (filterUserId) {
            countQb.andWhere('order.userId = :filterUserId', { filterUserId });
        }
        if (search) {
            countQb.andWhere(
                '(order.orderNo ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
                { search: `%${search}%` },
            );
        }
        if (status) {
            countQb.andWhere('order.status = :status', { status });
        }
        if (dateFrom) {
            countQb.andWhere('order.createdAt >= :dateFrom', { dateFrom });
        }
        if (dateTo) {
            countQb.andWhere('order.createdAt <= :dateTo', { dateTo });
        }
        const total = await countQb.getCount();

        const qb = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.orderItems', 'orderItems')
            .leftJoinAndSelect('orderItems.event', 'event')
            .where('order.isDeleted = :isDeleted', { isDeleted: false });

        if (role !== 'admin') {
            qb.andWhere('order.userId = :userId', { userId });
        }
        if (filterUserId) {
            qb.andWhere('order.userId = :filterUserId', { filterUserId });
        }
        if (search) {
            qb.andWhere(
                '(order.orderNo ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
                { search: `%${search}%` },
            );
        }
        if (status) {
            qb.andWhere('order.status = :status', { status });
        }
        if (dateFrom) {
            qb.andWhere('order.createdAt >= :dateFrom', { dateFrom });
        }
        if (dateTo) {
            qb.andWhere('order.createdAt <= :dateTo', { dateTo });
        }

        qb.orderBy(`order.${sortBy}`, sortOrder);
        const orders = await qb.skip((page - 1) * limit).take(limit).getMany();

        const totalPages = Math.ceil(total / limit) || 1;
        const data = orders.map((order) => this.mapOrderToResponse(order));
        for (let i = 0; i < data.length; i++) {
            data[i].checkout = await this.getCheckoutForOrder(orders[i].id);
        }
        return { data, total, page, limit, totalPages };
    }

    private mapOrderToResponse(order: Order): any {
        const price = Number(order.price);
        const discount = Number(order.discount);
        const priceBreakdown = this.buildOrderPriceBreakdown(order);
        return {
            id: order.id,
            orderNo: order.orderNo,
            paymentMethod: order.paymentMethod,
            price,
            amountPaid: price,
            status: order.status ?? 'Pending',
            discount,
            originalPrice: Number(order.originalPrice),
            priceBreakdown: {
                eventTotal: priceBreakdown.eventTotal,
                gstTotal: priceBreakdown.gstTotal,
                discount: priceBreakdown.discount,
                total: priceBreakdown.total,
            },
            createdAt: order.createdAt,
            user: {
                id: order.user?.id,
                firstName: order.user?.firstName,
                lastName: order.user?.lastName,
                mobile: order.user?.mobile,
                email: order.user?.email,
            },
            orderItems: (order.orderItems || []).map((item) => ({
                id: item.id,
                event: this.mapEventToMinimal(item.event, item.unitPrice != null ? Number(item.unitPrice) : undefined),
                status: item.status,
                invoiceNumber: item.invoiceNumber || null,
                createdAt: item.createdAt,
            })),
        };
    }

    /**
     * Get distinct customers (users who have orders) for dropdown filter.
     * Supports search by name/email and pagination.
     */
    async getOrderCustomers(
        userId: string,
        role: string,
        search: string,
        page: number,
        limit: number,
    ): Promise<{ data: Array<{ id: string; firstName: string; lastName: string; email: string }>; total: number; page: number; limit: number; totalPages: number }> {
        const subQb = this.orderRepository
            .createQueryBuilder('order')
            .select('order.userId')
            .where('order.isDeleted = :isDeleted', { isDeleted: false })
            .groupBy('order.userId');
        if (role !== 'admin') {
            subQb.andWhere('order.userId = :userId', { userId });
        }
        const qb = this.userRepository
            .createQueryBuilder('user')
            .where(`user.id IN (${subQb.getQuery()})`)
            .setParameters(subQb.getParameters());
        if (search && search.trim()) {
            qb.andWhere(
                '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
                { search: `%${search.trim()}%` },
            );
        }
        const total = await qb.getCount();
        const users = await qb
            .select(['user.id', 'user.firstName', 'user.lastName', 'user.email'])
            .orderBy('user.firstName', 'ASC')
            .addOrderBy('user.lastName', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            data: users.map((u) => ({ id: u.id, firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '' })),
            total,
            page,
            limit,
            totalPages,
        };
    }

    async getAllOrders(userId: string, role: string): Promise<any[]> {
        let orders;

        if (role === 'admin') {
            orders = await this.orderRepository.find({
                relations: ['user', 'orderItems', 'orderItems.event'],
                where: { isDeleted: false },
            });
        } else {
            orders = await this.orderRepository.find({
                where: { user: { id: userId }, isDeleted: false },
                relations: ['user', 'orderItems', 'orderItems.event'],
            });
        }
        if (!orders || orders.length === 0) {
            throw new NotFoundException('No orders found');
        }
        const data = orders.map((order) => this.mapOrderToResponse(order));
        for (let i = 0; i < data.length; i++) {
            data[i].checkout = await this.getCheckoutForOrder(orders[i].id);
        }
        return data;
    }

    async deleteOrder(orderId: string, userId: string, role: string): Promise<void> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user'],
        });

        if (!order) throw new NotFoundException('Order not found');

        if (role !== 'admin' && order.user.id !== userId) {
            throw new ForbiddenException('You are not allowed to delete this order');
        }

        // Force delete: unlink and remove dependents so the order can be deleted
        // 1. Unlink registerEvents that reference this order (set orderId = null)
        await this.registerEventRepository
            .createQueryBuilder()
            .update(RegisterEvent)
            .set({ orderId: () => 'NULL' })
            .where('orderId = :orderId', { orderId })
            .execute();
        // 2. Delete order items for this order
        await this.orderItemRepository.delete({ order: { id: orderId } });
        // 3. Delete the order
        await this.orderRepository.remove(order);
    }

    /**
     * Delete all orders (admin only). Force-deletes: unlinks registerEvents, deletes order items, then deletes orders.
     */
    async deleteAllOrders(userId: string, role: string): Promise<{ deleted: number }> {
        if (role !== 'admin') {
            throw new ForbiddenException('Only admin can delete all orders');
        }
        const orders = await this.orderRepository.find({ where: { isDeleted: false }, select: ['id'] });
        const count = orders.length;
        if (count === 0) {
            return { deleted: 0 };
        }
        const orderIds = orders.map((o) => o.id);
        // 1. Unlink all registerEvents that reference any of these orders
        await this.registerEventRepository
            .createQueryBuilder()
            .update(RegisterEvent)
            .set({ orderId: () => 'NULL' })
            .where('orderId IN (:...orderIds)', { orderIds })
            .execute();
        // 2. Delete all order items for these orders
        await this.orderItemRepository
            .createQueryBuilder()
            .delete()
            .where('orderId IN (:...orderIds)', { orderIds })
            .execute();
        // 3. Delete all orders
        await this.orderRepository
            .createQueryBuilder()
            .delete()
            .where('id IN (:...orderIds)', { orderIds })
            .execute();
        return { deleted: count };
    }

    private async generateInvoiceNumber(repo?: Repository<OrderItemEntity>): Promise<string> {
        const orderItemRepo = repo ?? this.orderItemRepository;
        try {
            const currentYear = new Date().getFullYear();
            const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

            const lastInvoice = await orderItemRepo.find({
                where: { invoiceNumber: Like(`INV-${currentYear}${currentMonth}%`) },
                select: ['invoiceNumber'],
                order: { invoiceNumber: 'DESC' },
                take: 1,
            });

            if (lastInvoice.length > 0 && lastInvoice[0].invoiceNumber) {
                const lastSequentialNumber = parseInt(lastInvoice[0].invoiceNumber.slice(12), 10);
                const next = (lastSequentialNumber + 1).toString().padStart(4, '0');
                return `INV-${currentYear}${currentMonth}-${next}`;
            }
            return `INV-${currentYear}${currentMonth}-0001`;
        } catch (error) {
            throw new InternalServerErrorException('Error generating invoice number');
        }
    }

    /** Use inside a transaction so the next invoice number sees already-saved items in the same transaction. */
    async generateInvoiceNumberInTransaction(manager: EntityManager): Promise<string> {
        const repo = manager.getRepository(OrderItemEntity);
        return this.generateInvoiceNumber(repo);
    }

    async updateOrderItemStatus(
        orderItemId: string, 
        status: OrderNoStatus, 
    ): Promise<any> {
 
        const orderItem = await this.orderItemRepository.findOne({
            where: { id: orderItemId },
            relations: ['order', 'event'],
        });

        if (!orderItem) {
            throw new NotFoundException('Order item not found');
        }

        // Update status
        orderItem.status = status;

        // Generate invoice number only when status is changed to Completed
        if (status === OrderNoStatus.Completed && !orderItem.invoiceNumber) {
            orderItem.invoiceNumber = await this.generateInvoiceNumber();
        }

        const updatedOrderItem = await this.orderItemRepository.save(orderItem);

        return {
            id: updatedOrderItem.id,
            status: updatedOrderItem.status,
            invoiceNumber: updatedOrderItem.invoiceNumber,
            event: {
                id: updatedOrderItem.event.id,
                name: updatedOrderItem.event.name,
                price: Number(updatedOrderItem.unitPrice ?? updatedOrderItem.event.price),
            },
            order: {
                id: updatedOrderItem.order.id,
                orderNo: updatedOrderItem.order.orderNo,
            },
            updatedAt: new Date(),
        };
    }
}