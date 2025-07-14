// src/controllers/favorite-event.controller.ts
import { Controller, Post, Get, Body, Param, Res, UseGuards, Request, Query } from '@nestjs/common';
import { Response } from 'express';
import { FavoriteEventService } from './favorite-event.service';
import { FavoriteFilterType, GetFavoritesDto, ToggleFavoriteDto } from './favorite-event.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';

@Controller('api/favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteEventController {
  constructor(private readonly favoriteEventService: FavoriteEventService) {}

  @Post('toggle')
  async toggleFavorite(
    @Body() toggleFavoriteDto: ToggleFavoriteDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    const userId = req.user.id;
    const result = await this.favoriteEventService.toggleFavorite(userId, toggleFavoriteDto.eventId);
    
    return response.status(200).json({
      success: true,
      message: result.message,
      data: {
        isFavorite: result.isFavorite,
        eventId: toggleFavoriteDto.eventId,
      },
    });
  }

  @Get('my-favorites')
  async getMyFavorites(@Request() req: any, @Res() response: Response,    @Query() query: GetFavoritesDto) {
    const userId = req.user.id;
    const filter = query.filter || FavoriteFilterType.ALL;
    const favorites = await this.favoriteEventService.getUserFavorites(userId);
    
    return response.status(200).json({
      success: true,
      message: 'Favorites retrieved successfully',
      filter: filter,
      totalCount: favorites.length,
      metadata: {
        filter: filter,
        totalFavorites: favorites.length,
        userId: userId,
        timestamp: new Date().toISOString()
      },
      data: favorites,
    });
  }
}