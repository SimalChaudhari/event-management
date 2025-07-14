// src/dto/favorite-event.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ToggleFavoriteDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;
}

export class FavoriteEventResponseDto {
  success!: boolean;
  message!: string;
  data?: any;
}

export enum FavoriteFilterType {
  ALL = 'featured',
  UPCOMING = 'upcoming',
  MY_EVENTS = 'my_events'
}

export class GetFavoritesDto {
  @IsOptional()
  @IsEnum(FavoriteFilterType)
  filter?: FavoriteFilterType = FavoriteFilterType.ALL;
}