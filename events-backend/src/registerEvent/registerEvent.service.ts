import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterEvent } from './registerEvent.entity';
import { CreateRegisterEventDto } from './registerEvent.dto';
import { Event } from 'event/event.entity';
import { Order } from 'order/order.entity';

@Injectable()
export class RegisterEventService {
  constructor(
    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,

    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async createRegisterEvent(
    userId: string,
    createRegisterEventDto: CreateRegisterEventDto,
  ): Promise<RegisterEvent> {
    const { eventId, type, registerCode, orderId } = createRegisterEventDto;

    // Check if event exists
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if order exists (only if orderId is provided)
    let order: Order | null = null;
    if (orderId) {
      order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }
    }

    // ✅ Check logic for registerCode
    if (type === 'Exhibitor') {
      if (!registerCode) {
        throw new BadRequestException(
          'Register code is required for Exhibitor',
        );
      }
    } else {
      if (registerCode) {
        throw new BadRequestException('Attendee should not have register code');
      }
      if (!orderId) {
        throw new BadRequestException('Order ID is required for Attendee');
      }
    }

    const registerEvent = this.registerEventRepository.create({
      user: { id: userId },
      event: { id: eventId },
      type,
      registerCode,
      orderId,
    });

    return await this.registerEventRepository.save(registerEvent);
  }

  async findAll() {
  const [data, count] = await this.registerEventRepository.findAndCount({
    relations: ['user', 'event', 'order'],
  });

  return {
    success: true,
    message: 'Register events fetched successfully',
    count,
    data,
  };
}

async findOne(id: string) {
  const registerEvent = await this.registerEventRepository.findOne({
    where: { id },
    relations: ['user', 'event', 'order'],
  });

  if (!registerEvent) {
    throw new NotFoundException('Register event not found');
  }

  return {
    success: true,
    message: 'Register event fetched successfully',
    data: registerEvent,
  };
}

}
