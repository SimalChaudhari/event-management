// events-backend/src/order/order.service.ts
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateEventOrderDto, CreateOrderWithItemsDto, OrderDto, OrderStatus } from './order.dto';
import { UserEntity } from 'user/users.entity'; // Ensure this import is correct
import { OrderItemEntity } from './event.item.entity';
import { Event } from 'event/event.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { Cart } from 'cart/cart.entity';
import { getEventColor } from 'utils/event-color.util';
import { CouponService } from 'coupon/coupon.service';
import { OrderNoStatus } from './order.dto';
import { Not, IsNull } from 'typeorm';


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
        private readonly couponService: CouponService,
    

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
            
            // 7. Now create order items and register events
            const savedOrderItems: any[] = [];
            
            for (const eventData of validatedEvents) {
              const orderItem = transactionalEntityManager.create(OrderItemEntity, {
                order: savedOrder,
                event: eventData,
              });
            
              const savedItem = await transactionalEntityManager.save(OrderItemEntity, orderItem);
            
              savedOrderItems.push({
                id: savedItem.id,
                event: eventData,
                status: savedItem.status,
                createdAt: savedItem.createdAt,
              });
            
              const registerEvent = transactionalEntityManager.create(RegisterEvent, {
                userId,
                eventId: eventData.id,
                type: "Attendee",
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
      
    

    async getOrderById(orderId: string, userId: string,role:string): Promise<any> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user', 'orderItems', 'orderItems.event', 
                'orderItems.event.eventSpeakers.speaker',
                'orderItems.event.category', // Add this
                'orderItems.event.category.category', // Add this
              ],
        });


        if (!order) throw new NotFoundException('Order not found');
    
        // Only check permission if not admin
    if (role !== 'admin' && order.user.id !== userId) {
        throw new ForbiddenException('You are not allowed to view this order');
    }
    
    const orderItems = order.orderItems.map(item => {
        // Extract categories
        const categories = item.event?.category?.map((ec) => ec.category) || [];
        
        // Extract speakers
        const speakers = item.event?.eventSpeakers?.map((es) => es.speaker) || [];
        
        // Clean up event object
        const { eventSpeakers, category, ...restEvent } = item.event || {};
        
        return {
            id: item.id,
            event: {
                ...restEvent,
                color: getEventColor(item.event.type),
                speakers,
                categories, // Add categories here
            },
            status: item.status,
            invoiceNumber: item.invoiceNumber || null,
            createdAt: item.createdAt,
        };
    });

    return {
        id: order.id,
        orderNo: order.orderNo,
        paymentMethod: order.paymentMethod,
        price: Number(order.price),
        status: order.status,
        discount: Number(order.discount),
        originalPrice: Number(order.originalPrice),
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
                relations: ['user', 'orderItems', 'orderItems.event',
                    'orderItems.event.eventSpeakers.speaker',
                    'orderItems.event.category', // Add this
                    'orderItems.event.category.category', // Add this
                ],
            });
        } else {

          orders = await this.orderRepository.find({
            where: { user: { id: userId } },
            relations: ['user', 'orderItems', 'orderItems.event',
                'orderItems.event.eventSpeakers.speaker',
                'orderItems.event.category', // Add this
                'orderItems.event.category.category', // Add this
            ],
        });
        }
        if (!orders || orders.length === 0) {
            throw new NotFoundException('No orders found');
        }

    
        return orders.map(order => ({
            id: order.id,
            orderNo: order.orderNo,
            paymentMethod: order.paymentMethod,
            price: Number(order.price),
            status: order.status,
            discount: Number(order.discount),
            originalPrice: Number(order.originalPrice),
            user: {
                id: order.user.id,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                mobile: order.user.mobile,
                email: order.user.email,
            },
            orderItems: order.orderItems.map(item => {
                // Extract categories
                const categories = item.event?.category?.map((ec) => ec.category) || [];
                
                // Extract speakers
                const speakers = item.event?.eventSpeakers?.map((es) => es.speaker) || [];
                
                // Clean up event object
                const { eventSpeakers, category, ...restEvent } = item.event || {};
                
                return {
                    id: item.id,
                    event: {
                        ...restEvent,
                        color: getEventColor(item.event.type),
                        speakers,
                        categories, // Add categories here
                    },
                    status: item.status,
                    invoiceNumber: item.invoiceNumber || null,
                    createdAt: item.createdAt,
                };
            }),
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
        
    private async generateInvoiceNumber(): Promise<string> {
        try {
            const currentYear = new Date().getFullYear();
            const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
            
            // Get the highest invoice number for current year and month
            const lastInvoice = await this.orderItemRepository.find({
                where: { 
                    invoiceNumber: Like(`INV-${currentYear}${currentMonth}%`)
                },
                select: ['invoiceNumber'],
                order: { invoiceNumber: 'DESC' },
                take: 1,
            });

            let nextInvoiceNo: string;

            if (lastInvoice.length > 0 && lastInvoice[0].invoiceNumber) {
                const lastSequentialNumber = parseInt(lastInvoice[0].invoiceNumber.slice(12), 10);
                const nextSequentialNumber = lastSequentialNumber + 1;
                nextInvoiceNo = `INV-${currentYear}${currentMonth}-${nextSequentialNumber.toString().padStart(4, '0')}`;
            } else {
                nextInvoiceNo = `INV-${currentYear}${currentMonth}-0001`;
            }

            return nextInvoiceNo;
        } catch (error) {
            throw new InternalServerErrorException('Error generating invoice number');
        }
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
                price: updatedOrderItem.event.price,
            },
            order: {
                id: updatedOrderItem.order.id,
                orderNo: updatedOrderItem.order.orderNo,
            },
            updatedAt: new Date(),
        };
    }
}