// events-backend/src/order/order.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateEventOrderDto, CreateOrderWithItemsDto, OrderDto, OrderStatus } from './order.dto';
import { UserEntity } from 'user/users.entity'; // Ensure this import is correct
import { OrderItemEntity } from './event.item.entity';
import { Event } from 'event/event.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';


@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(UserEntity) // Inject the UserRepository
        private userRepository: Repository<UserEntity>,

        @InjectRepository(Event)
        private eventRepository: Repository<Event>,

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
        const { paymentMethod, price, status = OrderStatus.Pending, event } = dto;
    
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
    
        const orderNo = await this.generateUniqueOrderNumber();
    
        const order = this.orderRepository.create({
            orderNo,
            user,
            paymentMethod,
            price,
            status,
        });
    
        const savedOrder = await this.orderRepository.save(order);
    
        const savedOrderItems: any[] = [];
    
        for (const eventItem of event) {
            const eventData = await this.eventRepository.findOne({ where: { id: eventItem.eventId } });
            if (!eventData) {
                throw new NotFoundException(`Event with ID ${eventItem.eventId} not found`);
            }
    
            const orderItem = this.orderItemRepository.create({
                order: savedOrder,
                event: eventData,
            });
    
            const savedItem = await this.orderItemRepository.save(orderItem);
    
            // Include only required fields
            savedOrderItems.push({
                id: savedItem.id,
                event: eventData,
                createdAt: savedItem.createdAt,
            });

            // save data in register event table 
            const registerEvent = this.registerEventRepository.create({
                userId: userId,
                eventId: eventItem.eventId,
                type: "Attendee",
                orderId: savedOrder.id,
            });

       await this.registerEventRepository.save(registerEvent);
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
    
    

    // async addItemToOrder(createEventOrderDto: CreateEventOrderDto): Promise<OrderItemEntity[]> {
    //     const { orderId, event } = createEventOrderDto;

    //     // Find the order by orderId and load relations for User and Address
    //     const order = await this.orderRepository.findOne({
    //         where: { id: orderId },
    //         relations: ['user'],
    //     });

    //     if (!order) {
    //         throw new NotFoundException('Order not found');
    //     }

    //     const savedOrderItems: OrderItemEntity[] = [];

    //     // Loop through each product in the list and add them to the order
    //     for (const productOrder of event) {
    //         const { eventId } = productOrder;

    //         // Find the product by eventId
    //         const event = await this.eventRepository.findOne({ where: { id: eventId } });
    //         if (!event) {
    //             throw new NotFoundException(`event with ID ${eventId} not found`);
    //         }

    //         await this.eventRepository.save(event);  
    //         // Create and save each OrderItem
    //         const orderItem = this.orderItemRepository.create({
    //             order,
    //             event
    //         });
    //         const savedOrderItem = await this.orderItemRepository.save(orderItem);
    //         savedOrderItems.push(savedOrderItem);
    //     }
     
    //     return savedOrderItems;
    // }


    async getOrderById(orderId: string): Promise<any> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user', 'orderItems', 'orderItems.event'],
        });
    
        if (!order) throw new NotFoundException('Order not found');
    
        const orderItems = order.orderItems.map(item => ({
            id: item.id,
            event: item.event,
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

    async getAllOrders(): Promise<any[]> {
        const orders = await this.orderRepository.find({
            relations: ['user', 'orderItems', 'orderItems.event'],
            // order: { createdAt: 'DESC' }, // Optional: recent first
        });
    
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
                createdAt: item.createdAt,
            })),
        }));
    }
    
    

    async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
        const order = await this.getOrderById(id);
        Object.assign(order, orderData);
        return await this.orderRepository.save(order);
    }

    async deleteOrder(id: string): Promise<void> {
        const order = await this.getOrderById(id);
        await this.orderRepository.remove(order);
    }


}