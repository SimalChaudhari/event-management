// src/controllers/favorite-event.controller.ts
import { Controller, Post, Get, Body, Param, Res, UseGuards, Request, Query } from '@nestjs/common';
import { Response } from 'express';
import { FavoriteEventService } from './favorite-event.service';
import { ToggleFavoriteDto, GetFavoritesDto, FavoriteFilterType } from './favorite-event.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { TabVisibilityFilterUtil } from '../utils/tab-visibility-filter.util';

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
  async getMyFavorites(
    @Request() req: any, 
    @Res() response: Response,
    @Query() query: GetFavoritesDto
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const filter = query.filter || FavoriteFilterType.ALL;
    
    const favorites = await this.favoriteEventService.getUserFavorites(userId, filter, userRole);
    
    // Apply tab visibility filtering to favorite events
    // Each item in favorites has structure: { event: EventObject, ... }
    const filteredFavorites = favorites.map(item => {
      if (item.event) {
        return {
          ...item,
          event: TabVisibilityFilterUtil.filterEventDataByTabVisibility(item.event, userRole)
        };
      }
      return item;
    });
    
    return response.status(200).json({
      success: true,
      message: `Favorites retrieved successfully with filter: ${filter}`,
      filter: filter,
      total: filteredFavorites.length,
      metadata: {
        filter: filter,
        totalFavorites: filteredFavorites.length,
        userId: userId,
        timestamp: new Date().toISOString()
      },
      data: filteredFavorites,
    });
  }
}