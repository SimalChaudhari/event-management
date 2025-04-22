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
    const { eventId, type, registerCode } = createRegisterEventDto;

    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    // 🔁 Check if the user has already registered for this event
    const existingRegistration = await this.registerEventRepository.findOne({
      where: {
        user: { id: userId },
        event: { id: eventId },
      },
    });

    if (existingRegistration) {
      throw new BadRequestException(
        'You have already registered for this event either Exhibitor or Attendee',
      );
    }

    // ✅ Validate registerCode for Exhibitor type
    if (type === 'Exhibitor' && !registerCode) {
      throw new BadRequestException('Register code is required for Exhibitor');
    }

    // 🆕 Create new registration
    const registerEvent = this.registerEventRepository.create({
      userId: userId,
      eventId: eventId,
      type: type,
      registerCode: registerCode,
    });

    return await this.registerEventRepository.save(registerEvent);
  }

  async findAll(userId: string) {
    const registerEvents = await this.registerEventRepository.find({
      where: { user: { id: userId } },
      relations: [
        'user',
        'event',
        'event.eventSpeakers',
        'event.eventSpeakers.speaker',
        'order',
      ],
    });

    if (!registerEvents || registerEvents.length === 0) {
      throw new NotFoundException('No registered events found for this user');
    }

    const cleanedData = registerEvents.map((registerEvent) => {
      const speakers =
        registerEvent.event?.eventSpeakers?.map((es) => es.speaker) || [];

      const { eventSpeakers, ...restEvent } = registerEvent.event || {};
      const event = {
        ...restEvent,
        speakers,
      };

      const { firstName, lastName, email, mobile } = registerEvent.user || {};
      const cleanedUser = { firstName, lastName, email, mobile };

      const { orderId: _, eventId: __, ...cleanRegisterEvent } = registerEvent;

      return {
        ...cleanRegisterEvent,
        event,
        user: cleanedUser,
      };
    });

    return {
      success: true,
      message: 'All registered events fetched successfully',
      count: cleanedData.length, // 👈 add total count
      data: cleanedData,
    };
  }

  async findOne(id: string, userId: string) {
    // Query to find the specific register event, ensuring it belongs to the current user
    const registerEvent = await this.registerEventRepository.findOne({
      where: {
        id, // Event ID
        user: { id: userId }, // Ensures the event belongs to the authenticated user
      },
      relations: [
        'user',
        'event',
        'event.eventSpeakers',
        'event.eventSpeakers.speaker',
        'order',
      ],
    });

    if (!registerEvent) {
      throw new NotFoundException('Register event not found for this user');
    }

    // 🧼 Extract only speakers
    const speakers =
      registerEvent.event?.eventSpeakers?.map((es) => es.speaker) || [];

    // 🧼 Clean up event object (remove eventSpeakers)
    const { eventSpeakers, ...restEvent } = registerEvent.event || {};

    // ✅ Replace with clean speakers
    const event = {
      ...restEvent,
      speakers,
    };

    // 🧼 Clean up user object, showing only specific fields
    const { firstName, lastName, email, mobile } = registerEvent.user || {};

    const cleanedUser = { firstName, lastName, email, mobile };
    // 🧼 Exclude `userId` and `eventId` from the `registerEvent` data
    const { orderId: _, eventId: __, ...cleanRegisterEvent } = registerEvent;

    // ✅ Final response
    return {
      success: true,
      message: 'Register event fetched successfully',
      data: {
        ...cleanRegisterEvent,
        event, // Only includes clean event + speakers
        user: cleanedUser, // Only includes user with cleaned fields
      },
    };
  }
}
