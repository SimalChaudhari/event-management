// events-backend/src/order/order.service.ts
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateEventOrderDto, CreateOrderWithItemsDto, OrderDto, OrderStatus } from './order.dto';
import { UserEntity } from 'user/users.entity'; // Ensure this import is correct
import { OrderItemEntity } from './event.item.entity';
import { Event } from 'event/event.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { Cart } from 'cart/cart.entity';


@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(UserEntity) // Inject the UserRepository
        private userRepository: Repository<UserEntity>,

        @InjectRepository(Event)
        private eventRepository: Repository<Event>,

        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,

        @InjectRepository(OrderItemEntity)
        private readonly orderItemRepository: Repository<OrderItemEntity>,
        @InjectRepository(RegisterEvent)
        private readonly registerEventRepository: Repository<RegisterEvent>,
    

    ) {}

    private async generateUniqueOrderNumber(): Promise<string> {
        try {
            // Get the current year
            const currentYear = new Date().getFullYear();

            // Retrieve the highest order number for the current year
            const lastOrder = await this.orderRepository.find({
                where: { orderNo: Like(`${currentYear}%`) },
                select: ['orderNo'],
                order: { orderNo: 'DESC' },
                take: 1,
            });

            let nextOrderNo: string;

            if (lastOrder.length > 0) {
                // Extract the numeric part of the last order number and increment it
                const lastSequentialNumber = parseInt(lastOrder[0].orderNo.slice(5), 10); // Extract the numeric part after the year and hyphen
                const nextSequentialNumber = lastSequentialNumber + 1;
                nextOrderNo = `${currentYear}-${nextSequentialNumber.toString().padStart(4, '0')}`; // Pad to 4 digits
            } else {
                // If no orders exist for the current year, start with 0001
                nextOrderNo = `${currentYear}-0001`;
            }

            // Return the formatted order number
            return nextOrderNo;
        } catch (error) {
            throw new InternalServerErrorException('Error generating unique order number');
        }
    }

    async createOrderWithItems(userId: string, dto: CreateOrderWithItemsDto): Promise<any> {
        const { paymentMethod, price, status = OrderStatus.Pending, eventId } = dto;

        // 1. Split the eventId string into an array
        const eventIds = eventId.split(',').map((id) => id.trim());
        
        // 2. Validate user
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        
        // 3. Validate all eventIds and cart items FIRST
        const validatedEvents = [];
        
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
        }
        
        // 4. If all validations passed, now create order
        const orderNo = await this.generateUniqueOrderNumber();
        
        const order = this.orderRepository.create({
          orderNo,
          user,
          paymentMethod,
          price,
          status,
        });
        
        const savedOrder = await this.orderRepository.save(order);
        
        // 5. Now create order items and register events
        const savedOrderItems: any[] = [];
        
        for (const eventData of validatedEvents) {
          const orderItem = this.orderItemRepository.create({
            order: savedOrder,
            event: eventData,
          });
        
          const savedItem = await this.orderItemRepository.save(orderItem);
        
          savedOrderItems.push({
            id: savedItem.id,
            event: eventData,
            status: savedItem.status,
            createdAt: savedItem.createdAt,
          });
        
          const registerEvent = this.registerEventRepository.create({
            userId,
            eventId: eventData.id,
            type: "Attendee",
            orderId: savedOrder.id,
          });
        
          await this.registerEventRepository.save(registerEvent);
          await this.cartRepository.delete({ userId, eventId: eventData.id });
        }
        
      
        return {
          id: savedOrder.id,
          orderNo: savedOrder.orderNo,
          paymentMethod: savedOrder.paymentMethod,
          price: savedOrder.price,
          status: savedOrder.status,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
          },
          orderItems: savedOrderItems,
        };
      }
      
    

    async getOrderById(orderId: string, userId: string,role:string): Promise<any> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user', 'orderItems', 'orderItems.event'],
        });


        if (!order) throw new NotFoundException('Order not found');
    
        // Only check permission if not admin
    if (role !== 'admin' && order.user.id !== userId) {
        throw new ForbiddenException('You are not allowed to view this order');
    }
    
        const orderItems = order.orderItems.map(item => ({
            id: item.id,
            event: item.event,
            status:item.status,
            createdAt: item.createdAt,
        }));
    
        return {
            id: order.id,
            orderNo: order.orderNo,
            paymentMethod: order.paymentMethod,
            price: order.price,
            status: order.status,
            user: {
                id: order.user.id,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                mobile: order.user.mobile,
                email: order.user.email,
            },
            orderItems,
        };
    }
    
    async getAllOrders(userId: string,role:string): Promise<any[]> {
        let orders;

        if (role === 'admin') {
            // 🧑‍💼 Admin can see all orders
            orders = await this.orderRepository.find({
                relations: ['user', 'orderItems', 'orderItems.event'],
            });
        } else {

          orders = await this.orderRepository.find({
            where: { user: { id: userId } },
            relations: ['user', 'orderItems', 'orderItems.event'],
        });
        }
        if (!orders || orders.length === 0) {
            throw new NotFoundException('No orders found');
        }
    
    
        return orders.map(order => ({
            id: order.id,
            orderNo: order.orderNo,
            paymentMethod: order.paymentMethod,
            price: order.price,
            status: order.status,
            user: {
                id: order.user.id,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                mobile: order.user.mobile,
                email: order.user.email,
            },
            orderItems: order.orderItems.map(item => ({
                id: item.id,
                event: item.event,
                status:item.status,
                createdAt: item.createdAt,
            })),
        }));
    }
    async deleteOrder(orderId: string, userId: string,role:string): Promise<void> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user'],
        });
    
        if (!order) throw new NotFoundException('Order not found');
    
     // Only check permission if not admin
     if (role !== 'admin' && order.user.id !== userId) {
        throw new ForbiddenException('You are not allowed to delete this order');
    }

    
        await this.orderRepository.remove(order);
    }
        

}