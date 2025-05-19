// src/withdrawal/withdrawal.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal, WithdrawalStatus } from './withdrawal.entity';
import { Order } from '../order/order.entity';
import { CreateWithdrawalDto } from './create-withdrawal.dto';
import { Event } from 'event/event.entity';
import { UserEntity } from 'user/users.entity';
import { OrderItemEntity, OrderNoStatus } from 'order/event.item.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { OrderStatus } from 'order/order.dto';
import { getEventColor } from 'utils/event-color.util';
  
@Injectable()
export class WithdrawalService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,

    @InjectRepository(Event)
    private eventRepository: Repository<Event>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,


    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
  ) { }

  async create(dto: CreateWithdrawalDto, userId: string): Promise<any> {
    if (!dto.order_id) {
      throw new NotFoundException('Order ID is missing');
    }

    if (!dto.event_id) {
      throw new NotFoundException('Event ID is missing');
    }

    const order = await this.orderRepo.findOne({
      where: { id: dto.order_id },
      relations: ['user', 'orderItems', 'orderItems.event'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.order_id} not found`);
    }

    if (order.user.id !== userId) {
      throw new NotFoundException(`Order does not belong to the current user`);
    }

    const orderItem = order.orderItems.find(
      (item) => item.event.id === dto.event_id,
    );
    if (!orderItem) {
      throw new NotFoundException(
        `Event with ID ${dto.event_id} is not part of this order`,
      );
    }

    const withdrawal = this.withdrawalRepo.create({
      ...dto,
      order,
      event: orderItem.event,
    });

    const saved = await this.withdrawalRepo.save(withdrawal);

    // Return filtered response
    return saved;
  }

  private filterOrderItemsByEvent(withdrawal: Withdrawal): Withdrawal {
    if (
      withdrawal?.order?.orderItems &&
      Array.isArray(withdrawal.order.orderItems)
    ) {
      withdrawal.order.orderItems = withdrawal.order.orderItems.filter(
        (item) => item.event?.id === withdrawal.event?.id,
      );
    }

    if (withdrawal.order?.orderItems?.length) {
      withdrawal.order.orderItems.forEach((item) => {
        if (item.event) {
          const color = getEventColor(item.event.type);
          (item.event as any).color = color; // 👈 cast to 'any' to bypass TS check
        }
      });
    }

    // Destructure the user information and create a new object with only the necessary fields
    if (withdrawal?.order?.user) {
      const { id, firstName, lastName, email, mobile } = withdrawal.order.user;
      withdrawal.order.user = {
        id,
        firstName,
        lastName,
        email,
        mobile,
      } as UserEntity; // Type assertion
    }

    delete withdrawal.event; // Remove event from withdrawal

    return withdrawal;
  }

  async findByUserId(userId: string): Promise<Withdrawal[]> {
    const withdrawals = await this.withdrawalRepo.find({
      where: {
        order: {
          user: { id: userId },
        },
      },
      relations: [
        'order',
        'order.user',
        'order.orderItems',
        'order.orderItems.event',
        'event', // Make sure event relation is loaded
      ],
    });

    return withdrawals.map(this.filterOrderItemsByEvent);
  }

  async findAll(): Promise<Withdrawal[]> {
    const withdrawals = await this.withdrawalRepo.find({
      relations: [
        'order',
        'order.user',
        'order.orderItems',
        'order.orderItems.event',
        'event',
      ],
    });

    return withdrawals.map(this.filterOrderItemsByEvent);
  }

  async findOne(id: string): Promise<Withdrawal | null> {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id },
      relations: [
        'order',
        'order.user',
        'order.orderItems',
        'order.orderItems.event',
        'event',
      ],
    });

    if (!withdrawal) return null;

    return this.filterOrderItemsByEvent(withdrawal);
  }

  // Change status

  async updateStatus(
    id: string,
    status: WithdrawalStatus,
  ): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id },
      relations: [
        'order',
        'order.user',
        'order.orderItems',
        'order.orderItems.event',
        'event',
      ],
    });

    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    }

    withdrawal.status = status; // Now type matches
    const updated = await this.withdrawalRepo.save(withdrawal);

    // ✅ If status is APPROVED, delete only the matching orderItem(s)
    if (status === WithdrawalStatus.APPROVED && withdrawal.order && withdrawal.event) {
      const order = withdrawal.order;
      const eventID = withdrawal.event.id

      // Find matching orderItem(s) with the event ID in the withdrawal
      const matchingOrderItems = order.orderItems.filter(
        (item) => item.event && item.event.id === eventID // Check if event.id matches
      );

      // If matching orderItems are found, delete them
      if (matchingOrderItems.length > 0) {
        for (const item of matchingOrderItems) {
          // Delete the orderItem from the repository
          await this.orderItemRepository.update(item.id, {
            isDeleted: true,
            status: OrderNoStatus.Cancelled,
          });

          // Delete the registration from the registerEventRepo (assuming it links users to events)
          await this.registerEventRepository.delete({
            eventId: item.event.id,
            userId: order.user.id,
          });
        }
        // After deleting orderItems and registrations, delete the entire order
        await this.orderRepo.update(order.id, {
          isDeleted: true

        });

      }
    }

    return this.filterOrderItemsByEvent(updated);
  }
}
