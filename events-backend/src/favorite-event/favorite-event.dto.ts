// src/dto/favorite-event.dto.ts
import { IsNotEmpty, IsUUID } from 'class-validator';

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