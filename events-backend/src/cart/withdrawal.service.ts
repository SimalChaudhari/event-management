// Cart withdrawal service: request, list, get one, admin approve/reject. Refund on approve; record failed refund on API error.
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject, forwardRef } from '@nestjs/common';
import { Withdrawal, WithdrawalStatus } from './withdrawal.entity';
import { CreateWithdrawalDto } from './create-withdrawal.dto';
import { Order } from '../order/order.entity';
import { Event } from 'event/event.entity';
import { OrderItemEntity, OrderNoStatus } from 'order/event.item.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { Status } from 'registerEvent/registerEvent.dto';
import { Refund } from '../checkout/refund.entity';
import { CheckoutService } from '../checkout/checkout.service';
import { UserEntity } from 'user/users.entity';
import { getEventColor } from 'utils/event-color.util';

@Injectable()
export class CartWithdrawalService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @Inject(forwardRef(() => CheckoutService))
    private readonly checkoutService: CheckoutService,
  ) {}

  async create(dto: CreateWithdrawalDto, userId: string): Promise<Withdrawal> {
    if (!dto.order_id) throw new NotFoundException('Order ID is missing');
    if (!dto.event_id) throw new NotFoundException('Event ID is missing');

    const order = await this.orderRepo.findOne({
      where: { id: dto.order_id },
      relations: ['user', 'orderItems', 'orderItems.event'],
    });
    if (!order) throw new NotFoundException(`Order with ID ${dto.order_id} not found`);
    if (order.user.id !== userId) throw new NotFoundException('Order does not belong to the current user');

    const orderItem = order.orderItems.find((item) => item.event?.id === dto.event_id);
    if (!orderItem) throw new NotFoundException(`Event with ID ${dto.event_id} is not part of this order`);

    const event = orderItem.event;
    if (event && (event as any).withdrawalEnabled === false) {
      throw new BadRequestException(
        'Withdrawal is not enabled for this event. Contact the event organizer.',
      );
    }
    // Withdrawal only for events scheduled for a future date (compare to end of event day)
    const eventEnd = event?.endDate ? new Date(new Date(event.endDate).setHours(23, 59, 59, 999)) : null;
    if (!eventEnd || new Date() >= eventEnd) {
      throw new BadRequestException(
        'Withdrawal is only allowed for events scheduled for a future date.',
      );
    }

    // One request per order + event: block duplicate
    const existing = await this.withdrawalRepo.findOne({
      where: { order: { id: dto.order_id }, event: { id: dto.event_id } },
    });
    if (existing) {
      throw new BadRequestException(
        'A withdrawal request has already been submitted for this order and event.',
      );
    }

    const name = dto.name?.trim() || [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ').trim() || 'User';
    const title = dto.title?.trim() || event?.name || 'Withdrawal request';

    const withdrawal = this.withdrawalRepo.create({
      ...dto,
      name,
      title,
      status: dto.status ?? WithdrawalStatus.PENDING,
      order,
      event,
    });
    return this.withdrawalRepo.save(withdrawal);
  }

  /** Create withdrawal by eventId only: finds user's order for this event (from RegisterEvent). */
  async createByEventId(
    eventId: string,
    userId: string,
    body: { name?: string; title?: string; reason?: string; status?: WithdrawalStatus },
  ): Promise<Withdrawal> {
    const reg = await this.registerEventRepository.findOne({
      where: { userId, eventId },
      select: ['orderId', 'status'],
    });
    if (!reg?.orderId) {
      throw new NotFoundException(
        'No registration or order found for this event. You can only request withdrawal for an event you have registered and paid for.',
      );
    }
    if (reg.status === Status.Withdraw) {
      throw new BadRequestException(
        'Already withdrawn. Withdrawal request is not allowed for this event.',
      );
    }
    return this.create(
      { order_id: reg.orderId, event_id: eventId, ...body },
      userId,
    );
  }

  private filterOrderItemsByEvent(withdrawal: Withdrawal): Withdrawal {
    if (withdrawal?.order?.orderItems && Array.isArray(withdrawal.order.orderItems)) {
      withdrawal.order.orderItems = withdrawal.order.orderItems.filter(
        (item) => item.event?.id === withdrawal.event?.id,
      );
    }
    if (withdrawal.order?.orderItems?.length) {
      withdrawal.order.orderItems.forEach((item) => {
        if (item.event) {
          const categories = item.event?.category?.map((ec) => ec.category) || [];
          const speakers = item.event?.eventSpeakers?.map((es) => es.speaker) || [];
          const { eventSpeakers, category, ...restEvent } = item.event || {};
          const color = getEventColor(item.event.type);
          (item.event as any) = { ...restEvent, color, speakers, categories };
        }
      });
    }
    if (withdrawal?.order?.user) {
      const { id, firstName, lastName, email, mobile } = withdrawal.order.user;
      withdrawal.order.user = { id, firstName, lastName, email, mobile } as UserEntity;
    }
    delete withdrawal.event;
    return withdrawal;
  }

  async findByUserId(userId: string): Promise<Withdrawal[]> {
    const withdrawals = await this.withdrawalRepo.find({
      where: { order: { user: { id: userId } } },
      relations: ['order', 'order.user', 'order.orderItems', 'order.orderItems.event', 'order.orderItems.event.eventSpeakers.speaker', 'order.orderItems.event.category', 'order.orderItems.event.category.category', 'event'],
    });
    return withdrawals.map((w) => this.filterOrderItemsByEvent(w));
  }

  async findAll(): Promise<Withdrawal[]> {
    const withdrawals = await this.withdrawalRepo.find({
      relations: ['order', 'order.user', 'order.orderItems', 'order.orderItems.event', 'order.orderItems.event.eventSpeakers.speaker', 'order.orderItems.event.category', 'order.orderItems.event.category.category', 'event'],
    });
    return withdrawals.map((w) => this.filterOrderItemsByEvent(w));
  }

  async findOne(id: string): Promise<Withdrawal | null> {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id },
      relations: ['order', 'order.user', 'order.orderItems', 'order.orderItems.event', 'order.orderItems.event.eventSpeakers.speaker', 'order.orderItems.event.category', 'order.orderItems.event.category.category', 'event'],
    });
    return withdrawal ? this.filterOrderItemsByEvent(withdrawal) : null;
  }

  async updateStatus(id: string, status: WithdrawalStatus, adminNote?: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id },
      relations: ['order', 'order.user', 'order.orderItems', 'order.orderItems.event', 'event'],
    });
    if (!withdrawal) throw new NotFoundException(`Withdrawal with ID ${id} not found`);

    withdrawal.status = status;
    withdrawal.reviewed_at = new Date();
    if (adminNote !== undefined) withdrawal.admin_note = adminNote;
    const updated = await this.withdrawalRepo.save(withdrawal);

    if (status === WithdrawalStatus.APPROVED && withdrawal.order && withdrawal.event) {
      const order = withdrawal.order;
      const eventID = withdrawal.event.id;
      const userId = order.user?.id;

      if (userId) {
        try {
          await this.checkoutService.createRefundForOrder(order.id, userId);
        } catch (refundErr: any) {
          console.error('Withdrawal approve: refund failed', refundErr?.message);
          try {
            await this.refundRepo.save(
              this.refundRepo.create({
                orderId: order.id,
                wooshpayRefundId: `withdrawal_failed_${updated.id}`,
                amount: 0,
                currency: 'SGD',
                status: 'failed',
                reason: refundErr?.message ?? 'Refund API failed',
              }),
            );
          } catch (e) {
            console.error('CartWithdrawal: failed to save failed-refund record', (e as Error)?.message);
          }
        }
      }

      const matchingOrderItems = order.orderItems?.filter((item) => item.event && item.event.id === eventID) ?? [];
      if (matchingOrderItems.length > 0) {
        for (const item of matchingOrderItems) {
          await this.orderItemRepository.update(item.id, { isDeleted: true, status: OrderNoStatus.Cancelled });
          await this.registerEventRepository.delete({ eventId: item.event.id, userId: order.user.id });
        }
        await this.orderRepo.update(order.id, { isDeleted: true });
      }
    }

    return this.filterOrderItemsByEvent(updated);
  }
}
