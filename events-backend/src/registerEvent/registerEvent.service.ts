import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterEvent } from './registerEvent.entity';
import {
  CreateRegisterEventDto,
  UpdateRegisterEventDto,
} from './registerEvent.dto';
import { Event } from 'event/event.entity';
import { Order } from 'order/order.entity';
import { getEventColor } from 'utils/event-color.util';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { UserEntity } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { 
  ResourceNotFoundException, 
  DuplicateResourceException, 
  ValidationException 
} from '../utils/exceptions/custom-exceptions';

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

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async createRegisterEvent(
    userId: string,
    createRegisterEventDto: CreateRegisterEventDto,
  ): Promise<RegisterEvent> {
    try {
      const { eventId, type, registerCode, isCreatedByAdmin } = createRegisterEventDto;

      // Check if event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if the user has already registered for this event
      const existingRegistration = await this.registerEventRepository.findOne({
        where: {
          user: { id: userId },
          event: { id: eventId },
        },
      });

      if (existingRegistration) {
        throw new DuplicateResourceException(
          'Registration',
          'user-event combination',
          `${userId}-${eventId}`
        );
      }

      // Validate registerCode for Exhibitor type (only if not created by admin)
      if (type === 'Exhibitor' && !registerCode && !isCreatedByAdmin) {
        throw new ValidationException('Register code is required for Exhibitor');
      }

      // Create new registration
      const registerEventData = {
        userId: userId,
        eventId: eventId,
        type: type,
        registerCode: registerCode,
        isCreatedByAdmin: isCreatedByAdmin || false,
        orderId: isCreatedByAdmin ? undefined : createRegisterEventDto.orderId,
      };

      const registerEvent = this.registerEventRepository.create(registerEventData);
      return await this.registerEventRepository.save(registerEvent);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Register Event creation');
    }
  }

  async findAll(userId: string, role: string) {
    try {
      let registerEvents;

      if (role === 'admin') {
        // Admin can see all register events
        registerEvents = await this.registerEventRepository.find({
          relations: [
            'user',
            'event',
            'event.eventSpeakers',
            'event.eventSpeakers.speaker',
            'event.category',
            'event.category.category',
            'event.galleries',
            'event.eventExhibitors',
            'event.eventExhibitors.exhibitor',
            'event.eventExhibitors.exhibitor.promotionalOffers',
            'order',
          ],
        });
      } else {
        // Normal user can only see their own registered events
        registerEvents = await this.registerEventRepository.find({
          where: { user: { id: userId } },
          relations: [
            'user',
            'event',
            'event.eventSpeakers',
            'event.eventSpeakers.speaker',
            'event.category',
            'event.category.category',
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
          const attendanceCount = registerEvent.eventId
            ? await this.getEventAttendanceCount(registerEvent.eventId)
            : 0;

          // Check if event is favorited by the user
          let isFavorite = false;
          if (registerEvent.userId) {
            const favorite = await this.favoriteEventRepository.findOne({
              where: {
                userId: registerEvent.userId,
                eventId: registerEvent.eventId,
              },
            });
            isFavorite = !!favorite;
          }

          const speakers = registerEvent.event?.eventSpeakers?.map((es) => es.speaker) || [];
          const categories = registerEvent.event?.category?.map((ec) => ec.category) || [];

          const {
            eventSpeakers,
            category,
            eventExhibitors,
            exhibitorDescription,
            eventStampDescription,
            eventStampImages,
            ...restEvent
          } = registerEvent.event || {};

          const event = {
            ...restEvent,
            color: getEventColor(registerEvent.event?.type),
            speakers,
            categories,
            eventStamps: {
              description: registerEvent.event?.eventStampDescription,
              images: registerEvent.event?.eventStampImages,
            },
            exhibitorsData: {
              exhibitorDescription: exhibitorDescription || '',
              exhibitors:
                registerEvent.event?.eventExhibitors
                  ?.filter((ee) => ee.exhibitor.isActive)
                  ?.map((ee) => ({
                    ...ee.exhibitor,
                    promotionalOffers: ee.exhibitor.promotionalOffers || [],
                  })) || [],
            },
            attendanceCount: attendanceCount,
            isFavorite: isFavorite,
          };

          const { firstName, lastName, email, mobile, id } = registerEvent.user || {};
          const cleanedUser = { firstName, lastName, email, mobile, id };

          const {
            orderId: _,
            eventId: __,
            ...cleanRegisterEvent
          } = registerEvent;

          return {
            ...cleanRegisterEvent,
            event,
            user: cleanedUser,
            isCreatedByAdmin: registerEvent.isCreatedByAdmin,
          };
        }),
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
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Register Event retrieval');
    }
  }

  async getEventAttendanceCount(eventId: string): Promise<number> {
    try {
      const count = await this.registerEventRepository.count({
        where: { eventId: eventId },
      });
      return count;
    } catch (error) {
      this.errorHandler.logError(error, 'Event Attendance Count', eventId);
      return 0;
    }
  }

  async findOne(registrationId: string, userId: string, role: string) {
    try {
      // Query to find the specific register event
      const registerEvent = await this.registerEventRepository.findOne({
        where:
          role === 'admin'
            ? { id: registrationId }
            : { id: registrationId, user: { id: userId } },
        relations: [
          'user',
          'event',
          'event.eventSpeakers',
          'event.eventSpeakers.speaker',
          'event.category',
          'event.category.category',
          'event.galleries',
          'event.eventExhibitors',
          'event.eventExhibitors.exhibitor',
          'event.eventExhibitors.exhibitor.promotionalOffers',
          'order',
        ],
      });

      if (!registerEvent) {
        throw new ResourceNotFoundException('Register Event', registrationId);
      }

      // Get attendance count for this event
      const attendanceCount = registerEvent.eventId
        ? await this.getEventAttendanceCount(registerEvent.eventId)
        : 0;

      // Check if event is favorited by the user
      let isFavorite = false;
      if (registerEvent.userId) {
        const favorite = await this.favoriteEventRepository.findOne({
          where: { userId: registerEvent.userId, eventId: registerEvent.eventId },
        });
        isFavorite = !!favorite;
      }

      // Extract only speakers
      const speakers = registerEvent.event?.eventSpeakers?.map((es) => es.speaker) || [];
      const categories = registerEvent.event?.category?.map((ec) => ec.category) || [];

      // Extract exhibitors (only active ones)
      const exhibitors =
        registerEvent.event?.eventExhibitors
          ?.filter((ee) => ee.exhibitor.isActive)
          ?.map((ee) => ({
            ...ee.exhibitor,
            promotionalOffers: ee.exhibitor.promotionalOffers || [],
          })) || [];

      // Clean up event object
      const {
        eventSpeakers,
        category,
        eventExhibitors,
        exhibitorDescription,
        eventStampDescription,
        eventStampImages,
        ...restEvent
      } = registerEvent.event || {};

      const event = {
        ...restEvent,
        color: getEventColor(registerEvent.event?.type),
        speakers,
        categories,
        eventStamps: {
          description: registerEvent.event?.eventStampDescription,
          images: registerEvent.event?.eventStampImages,
        },
        exhibitorsData: {
          exhibitorDescription: exhibitorDescription || '',
          exhibitors: exhibitors,
        },
        attendanceCount: attendanceCount,
        isFavorite: isFavorite,
      };

      // Clean up user object
      const { firstName, lastName, email, mobile, id } = registerEvent.user || {};
      const cleanedUser = { firstName, lastName, email, mobile, id };

      // Exclude unnecessary fields
      const { orderId: _, eventId: __, ...cleanRegisterEvent } = registerEvent;

      return {
        success: true,
        message: 'Register event fetched successfully',
        data: {
          ...cleanRegisterEvent,
          event,
          user: cleanedUser,
          isCreatedByAdmin: registerEvent.isCreatedByAdmin,
        },
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Register Event retrieval by ID');
    }
  }

  async adminUpdateRegisterEvent(
    id: string,
    updateRegisterEventDto: UpdateRegisterEventDto,
  ): Promise<RegisterEvent> {
    try {
      const registration = await this.registerEventRepository.findOne({
        where: { id },
        relations: ['user', 'event'],
      });

      if (!registration) {
        throw new ResourceNotFoundException('Registration', id);
      }

      // Update user if provided
      if (updateRegisterEventDto.userId !== undefined) {
        const newUser = await this.userRepository.findOne({
          where: { id: updateRegisterEventDto.userId },
        });
        if (!newUser) {
          throw new ResourceNotFoundException('User', updateRegisterEventDto.userId);
        }
        registration.userId = updateRegisterEventDto.userId;
        registration.user = newUser;
      }

      // Update event if provided
      if (updateRegisterEventDto.eventId !== undefined) {
        const newEvent = await this.eventRepository.findOne({
          where: { id: updateRegisterEventDto.eventId },
        });
        if (!newEvent) {
          throw new ResourceNotFoundException('Event', updateRegisterEventDto.eventId);
        }
        registration.eventId = updateRegisterEventDto.eventId;
        registration.event = newEvent;
      }

      // Update other fields
      if (updateRegisterEventDto.type !== undefined) {
        registration.type = updateRegisterEventDto.type;
      }
      if (updateRegisterEventDto.registerCode !== undefined) {
        registration.registerCode = updateRegisterEventDto.registerCode;
      }
      if (updateRegisterEventDto.isCreatedByAdmin !== undefined) {
        registration.isCreatedByAdmin = updateRegisterEventDto.isCreatedByAdmin;
      }
      if (updateRegisterEventDto.orderId !== undefined) {
        registration.orderId = updateRegisterEventDto.orderId;
      }

      // Save the updated registration
      const updatedRegistration = await this.registerEventRepository.save(registration);

      // Fetch the updated registration with fresh relations
      const freshRegistration = await this.registerEventRepository.findOne({
        where: { id: updatedRegistration.id },
        relations: ['user', 'event'],
      });

      if (!freshRegistration) {
        throw new ResourceNotFoundException('Updated Registration', id);
      }

      return freshRegistration;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Register Event update');
    }
  }

  async adminDeleteRegisterEvent(id: string): Promise<void> {
    try {
      const registration = await this.registerEventRepository.findOne({
        where: { id },
      });

      if (!registration) {
        throw new ResourceNotFoundException('Registration', id);
      }

      await this.registerEventRepository.remove(registration);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Register Event deletion');
    }
  }
}
