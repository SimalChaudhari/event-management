import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { ScheduledPushNotificationService } from './scheduled-push-notification.service';
import {
  UserPushNotificationFilterDto,
  UserPushNotificationResponseDto,
} from './scheduled-push-notification.dto';

@Controller('api/user/push-notifications')
@UseGuards(JwtAuthGuard)
export class UserScheduledPushNotificationController {
  constructor(
    private readonly scheduledNotificationService: ScheduledPushNotificationService,
  ) {}

  @Get()
  async getUserNotifications(
    @Req() req: any,
    @Query() filters: UserPushNotificationFilterDto,
  ): Promise<{ data: UserPushNotificationResponseDto[] }> {
    const userId = req.user?.id;
    const notifications =
      await this.scheduledNotificationService.getUserNotifications(
        userId,
        filters,
      );
    return { data: notifications };
  }

  @Patch(':deliveryId/read')
  @HttpCode(HttpStatus.OK)
  async markNotificationRead(
    @Req() req: any,
    @Param('deliveryId') deliveryId: string,
  ): Promise<{ message: string; success: boolean }> {
    const userId = req.user?.id;
    await this.scheduledNotificationService.markUserNotificationRead(
      deliveryId,
      userId,
    );
    return {
      message: 'Notification marked as read',
      success: true,
    };
  }

  @Patch('mark-all/read')
  @HttpCode(HttpStatus.OK)
  async markAllNotificationsRead(
    @Req() req: any,
  ): Promise<{ message: string; success: boolean }> {
    const userId = req.user?.id;
    await this.scheduledNotificationService.markAllUserNotificationsRead(userId);
    return {
      message: 'All notifications marked as read',
      success: true,
    };
  }
}


