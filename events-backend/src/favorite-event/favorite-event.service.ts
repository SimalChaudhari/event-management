// src/services/favorite-event.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FavoriteEvent } from './favorite-event.entity';
import { Event } from 'event/event.entity';
import { UserEntity } from 'user/users.entity';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { getEventColor } from 'utils/event-color.util';
import { FavoriteFilterType } from './favorite-event.dto';

@Injectable()
export class FavoriteEventService {
  constructor(
    @InjectRepository(FavoriteEvent)
    private favoriteEventRepository: Repository<FavoriteEvent>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
  ) {}

  async toggleFavorite(
    userId: string,
    eventId: string,
  ): Promise<{ isFavorite: boolean; message: string }> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if event exists
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if already favorited
    const existingFavorite = await this.favoriteEventRepository.findOne({
      where: { userId, eventId },
    });

    if (existingFavorite) {
      // Remove from favorites - DELETE RECORD FROM DATABASE
      await this.favoriteEventRepository.remove(existingFavorite);
      return { isFavorite: false, message: 'Event removed from favorites' };
    } else {
      // Add to favorites - CREATE NEW RECORD IN DATABASE
      const favoriteEvent = new FavoriteEvent();
      favoriteEvent.userId = userId;
      favoriteEvent.eventId = eventId;
      await this.favoriteEventRepository.save(favoriteEvent);
      return { isFavorite: true, message: 'Event added to favorites' };
    }
  }

  async getUserFavorites(
    userId: string,
    filter: FavoriteFilterType = FavoriteFilterType.ALL,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = this.favoriteEventRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.event', 'event')
      .leftJoinAndSelect('event.eventSpeakers', 'eventSpeakers')
      .leftJoinAndSelect('eventSpeakers.speaker', 'speaker')
      .leftJoinAndSelect('event.category', 'eventCategory') // Add this
      .leftJoinAndSelect('eventCategory.category', 'category') // Add this
      .where('favorite.userId = :userId', { userId });

    // Apply filters based on filter type
    switch (filter) {
      case FavoriteFilterType.UPCOMING:
        query = query.andWhere('event.startDate >= :today', { today });
        break;

      case FavoriteFilterType.MY_EVENTS:
        // Get events where user is registered AND has favorited
        // First get all registered event IDs for this user
        const registeredEvents = await this.registerEventRepository
          .createQueryBuilder('register')
          .select('register.eventId')
          .where('register.userId = :userId', { userId })
          .getRawMany();

        const registeredEventIds = registeredEvents.map(
          (item) => item.register_eventId,
        );

        if (registeredEventIds.length > 0) {
          // Only show favorite events that user has also registered for
          query = query.andWhere(
            'favorite.eventId IN (:...registeredEventIds)',
            { registeredEventIds },
          );
          console.log('Query with registered events filter applied');
        } else {
          // If no registered events, return empty array
          console.log('No registered events found, returning empty array');
          return [];
        }
        break;

      case FavoriteFilterType.ALL:
      default:
        // Show all favorite events (no additional filter)
        break;
    }

    const favorites = await query.getMany();

    // Add attendance count and favorite status to each favorite event
    const favoritesWithAttendance = await Promise.all(
      favorites.map(async (favorite) => {
        const attendanceCount = favorite.eventId
          ? await this.getEventAttendanceCount(favorite.eventId)
          : 0;

        // Since these are favorite events, isFavorite will always be true
        const isFavorite = true;

        // Check if user has registered for this event भी add करें
        let isRegistered = false;
        if (favorite.eventId) {
          const registration = await this.registerEventRepository.findOne({
            where: {
              userId: userId,
              eventId: favorite.eventId,
              isRegister: true, // Only count active registrations
            },
          });
          isRegistered = !!registration;
        }

        const { eventSpeakers, category, ...eventData } = favorite.event;

        // Extract categories
        const categories = category?.map((ec) => ec.category) || [];

        return {
          id: favorite.id,
          createdAt: favorite.createdAt,
          event: {
            ...eventData,
            color: getEventColor(favorite.event.type),
            speakers: eventSpeakers?.map((es) => es.speaker) || [],
            categories: categories,
            attendanceCount: attendanceCount,
            isFavorite: isFavorite, // Always true for favorite events
            isRegistered: isRegistered,
          },
        };
      }),
    );

    return favoritesWithAttendance;
  }

  // Add this method to get event attendance count
  async getEventAttendanceCount(eventId: string): Promise<number> {
    const count = await this.registerEventRepository.count({
      where: { eventId: eventId },
    });
    return count;
  }
}
