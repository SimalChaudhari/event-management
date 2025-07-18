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
import { getEventColor } from 'utils/event-color.util';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';

@Injectable()
export class RegisterEventService {
  constructor(
    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,

    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(FavoriteEvent)
    private readonly favoriteEventRepository: Repository<FavoriteEvent>,
  ) {}

  async createRegisterEvent(
    userId: string,
    createRegisterEventDto: CreateRegisterEventDto,
  ): Promise<RegisterEvent> {
    const { eventId, type, registerCode, isCreatedByAdmin } = createRegisterEventDto;

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

    // ✅ Validate registerCode for Exhibitor type (only if not created by admin)
    if (type === 'Exhibitor' && !registerCode && !isCreatedByAdmin) {
      throw new BadRequestException('Register code is required for Exhibitor');
    }

    // 🆕 Create new registration
    const registerEventData = {
      userId: userId,
      eventId: eventId,
      type: type,
      registerCode: registerCode,
      isCreatedByAdmin: isCreatedByAdmin || false,
      // If created by admin, no orderId needed (payment bypassed)
      orderId: isCreatedByAdmin ? undefined : createRegisterEventDto.orderId,
    };

    const registerEvent = this.registerEventRepository.create(registerEventData);
    return await this.registerEventRepository.save(registerEvent);
  }

  async findAll(userId: string, role: string) {
    let registerEvents;
  
    if (role === 'admin') {
      // 🧑‍💼 Admin can see all register events
      registerEvents = await this.registerEventRepository.find({
        relations: [
          'user',
          'event',
          'event.eventSpeakers',
          'event.eventSpeakers.speaker',
          'event.category', // Add this
          'event.category.category', // Add this
          'event.galleries',
          'event.eventExhibitors',
          'event.eventExhibitors.exhibitor',
          'event.eventExhibitors.exhibitor.promotionalOffers',
          'order',
        ],
      });
    } else {
      // 👤 Normal user can only see their own registered events
      registerEvents = await this.registerEventRepository.find({
        where: { user: { id: userId } },
        relations: [
          'user',
          'event',
          'event.eventSpeakers',
          'event.eventSpeakers.speaker',
          'event.category', // Add this
          'event.category.category', // Add this\
          'event.galleries',
          'event.eventExhibitors',
          'event.eventExhibitors.exhibitor',
          'event.eventExhibitors.exhibitor.promotionalOffers',
          'order',
        ],
      });
    }
  
    // Add attendance count and favorite status to each registered event
    const registerEventsWithAttendance = await Promise.all(
      registerEvents.map(async (registerEvent) => {
        const attendanceCount = registerEvent.eventId ? await this.getEventAttendanceCount(registerEvent.eventId) : 0;
        
        // Check if event is favorited by the user
        let isFavorite = false;
        if (registerEvent.userId) {
          const favorite = await this.favoriteEventRepository.findOne({
            where: { userId: registerEvent.userId, eventId: registerEvent.eventId }
          });
          isFavorite = !!favorite;
        }
        
        const speakers =
          registerEvent.event?.eventSpeakers?.map((es) => es.speaker) || [];

          
        // Extract categories
        const categories = registerEvent.event?.category?.map((ec) => ec.category) || [];


        // Extract exhibitors (only active ones)
        const exhibitors = registerEvent.event?.eventExhibitors
          ?.filter((ee) => ee.exhibitor.isActive)
          ?.map((ee) => ({
            ...ee.exhibitor,
            promotionalOffers: ee.exhibitor.promotionalOffers || []
          })) || [];

        const { eventSpeakers, category, eventExhibitors, ...restEvent } = registerEvent.event || {};
        const event = {
          ...restEvent,
          color: getEventColor(registerEvent.event?.type),
          speakers,
          categories,
          exhibitors, // Add exhibitors here
          attendanceCount: attendanceCount,
          isFavorite: isFavorite,
        };


        const { firstName, lastName, email, mobile } = registerEvent.user || {};
        const cleanedUser = { firstName, lastName, email, mobile };

        const { orderId: _, eventId: __, ...cleanRegisterEvent } = registerEvent;

        return {
          ...cleanRegisterEvent,
          event,
          user: cleanedUser,
          isCreatedByAdmin: registerEvent.isCreatedByAdmin,
        };
      })
    );
  
    return {
      success: true,
      message:
        role === 'admin'
          ? 'All registered events fetched for admin'
          : 'Your registered events fetched successfully',
      count: registerEventsWithAttendance.length,
      data: registerEventsWithAttendance,
    };
  }
  

  // Get event attendance count
  async getEventAttendanceCount(eventId: string): Promise<number> {
    const count = await this.registerEventRepository.count({
      where: { eventId: eventId }
    });
    return count;
  }

  async findOne(id: string, userId: string, role: string) {
    // Query to find the specific register event, ensuring it belongs to the current user
    const registerEvent = await this.registerEventRepository.findOne({
      where:
      role === 'admin'
        ? { id } // 🧑‍💼 Admin can fetch any
        : { id, user: { id: userId } }, // 👤 User can fetch only their own
      relations: [
        'user',
        'event',
        'event.eventSpeakers',
        'event.eventSpeakers.speaker',
        'event.category', // Add this
        'event.category.category', // Add this
        'event.galleries',
        'event.eventExhibitors',
        'event.eventExhibitors.exhibitor',
        'event.eventExhibitors.exhibitor.promotionalOffers',
        'order',
      ],
    });

    if (!registerEvent) {
      throw new NotFoundException('Register event not found for this user');
    }

    // Get attendance count for this event
    const attendanceCount = registerEvent.eventId ? await this.getEventAttendanceCount(registerEvent.eventId) : 0;

    // Check if event is favorited by the user
    let isFavorite = false;
    if (registerEvent.userId) {
      const favorite = await this.favoriteEventRepository.findOne({
        where: { userId: registerEvent.userId, eventId: registerEvent.eventId }
      });
      isFavorite = !!favorite;
    }

    // 🧼 Extract only speakers
    const speakers =
      registerEvent.event?.eventSpeakers?.map((es) => es.speaker) || [];

   // Extract categories
   const categories = registerEvent.event?.category?.map((ec) => ec.category) || [];

   // Extract exhibitors (only active ones)
   const exhibitors = registerEvent.event?.eventExhibitors
     ?.filter((ee) => ee.exhibitor.isActive)
     ?.map((ee) => ({
       ...ee.exhibitor,
       promotionalOffers: ee.exhibitor.promotionalOffers || []
     })) || [];

   // 🧼 Clean up event object (remove eventSpeakers, category, and eventExhibitors)
   const { eventSpeakers, category, eventExhibitors, ...restEvent } = registerEvent.event || {};

   // ✅ Replace with clean speakers, categories, and exhibitors
   const event = {
     ...restEvent,
     color: getEventColor(registerEvent.event?.type),
     speakers,
     categories,
     exhibitors, // Add exhibitors here
     attendanceCount: attendanceCount,
     isFavorite: isFavorite,
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
        event, // Only includes clean event + speakers + isFavorite
        user: cleanedUser, // Only includes user with cleaned fields
        isCreatedByAdmin: registerEvent.isCreatedByAdmin,
      },
    };
  }
}
