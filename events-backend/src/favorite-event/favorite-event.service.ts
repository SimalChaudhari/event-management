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

  async toggleFavorite(userId: string, eventId: string): Promise<{ isFavorite: boolean; message: string }> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if event exists
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
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

  async getUserFavorites(userId: string, filter: FavoriteFilterType = FavoriteFilterType.ALL) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = this.favoriteEventRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.event', 'event')
      .leftJoinAndSelect('event.eventSpeakers', 'eventSpeakers')
      .leftJoinAndSelect('eventSpeakers.speaker', 'speaker')
      .where('favorite.userId = :userId', { userId });

    // Apply filters based on filter type
    switch (filter) {
      case FavoriteFilterType.UPCOMING:
        query = query.andWhere('event.startDate >= :today', { today });
        break;
      
        case FavoriteFilterType.MY_EVENTS:
        // Show favorite events where user is ALSO registered for that event
        // This means user has both favorited AND registered for the event
        query = query
          .innerJoin('registerEvent', 'register', 'register.eventId = favorite.eventId')
          .andWhere('register.userId = :userId', { userId });
        break;
      
      case FavoriteFilterType.ALL:
      default:
        // Show all favorite events (no additional filter)
        break;
    }

    const favorites = await query.getMany();

    return favorites.map(favorite => {
      const { eventSpeakers, ...eventData } = favorite.event;
      return {
        id: favorite.id,
        createdAt: favorite.createdAt,
        event: {
          ...eventData,
          color: getEventColor(favorite.event.type),
          speakers: eventSpeakers?.map(es => es.speaker) || [],
        },
      };
    });
  }
}