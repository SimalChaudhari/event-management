// src/services/favorite-event.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FavoriteEvent } from './favorite-event.entity';
import { Event } from 'event/event.entity';
import { UserEntity } from 'user/users.entity';
import { getEventColor } from 'utils/event-color.util';

@Injectable()
export class FavoriteEventService {
  constructor(
    @InjectRepository(FavoriteEvent)
    private favoriteEventRepository: Repository<FavoriteEvent>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
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

  async getUserFavorites(userId: string) {
    const favorites = await this.favoriteEventRepository.find({
      where: { userId },
      relations: ['event', 'event.eventSpeakers', 'event.eventSpeakers.speaker'],
    });

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