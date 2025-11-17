import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { UserRole } from '../user/users.entity';
import { ScheduledPushNotificationService } from './scheduled-push-notification.service';
import {
  CreateScheduledPushNotificationDto,
  UpdateScheduledPushNotificationDto,
  ScheduledPushNotificationResponseDto,
  FilterScheduledPushNotificationDto,
} from './scheduled-push-notification.dto';

@Controller('api/scheduled-push-notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class ScheduledPushNotificationController {
  constructor(
    private readonly scheduledNotificationService: ScheduledPushNotificationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateScheduledPushNotificationDto,
  ): Promise<ScheduledPushNotificationResponseDto> {
    return this.scheduledNotificationService.create(dto);
  }

  @Get()
  async findAll(
    @Query() filters?: FilterScheduledPushNotificationDto,
  ): Promise<ScheduledPushNotificationResponseDto[]> {
    return this.scheduledNotificationService.findAll(filters);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ScheduledPushNotificationResponseDto> {
    return this.scheduledNotificationService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduledPushNotificationDto,
  ): Promise<ScheduledPushNotificationResponseDto> {
    return this.scheduledNotificationService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.scheduledNotificationService.delete(id);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  async sendNotification(@Param('id') id: string): Promise<{
    message: string;
    success: boolean;
  }> {
    await this.scheduledNotificationService.sendNotification(id);
    return {
      message: 'Notification sent successfully',
      success: true,
    };
  }

  @Post('cleanup/old-deliveries')
  @HttpCode(HttpStatus.OK)
  async cleanupOldDeliveries(
    @Query('readDays') readDays?: string,
    @Query('unreadDays') unreadDays?: string,
  ): Promise<{
    message: string;
    readDeleted: number;
    unreadDeleted: number;
    totalDeleted: number;
  }> {
    let result;
    if (readDays || unreadDays) {
      const readRetention = readDays ? parseInt(readDays, 10) : 30;
      const unreadRetention = unreadDays ? parseInt(unreadDays, 10) : 90;
      result = await this.scheduledNotificationService.cleanupOldDeliveryRecords(
        readRetention,
        unreadRetention,
      );
    } else {
      result = await this.scheduledNotificationService.cleanupOldDeliveryRecordsWithEnv();
    }

    return {
      message: `Cleanup completed: ${result.totalDeleted} records deleted`,
      readDeleted: result.readDeleted,
      unreadDeleted: result.unreadDeleted,
      totalDeleted: result.totalDeleted,
    };
  }
}

