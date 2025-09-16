import { Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { NotificationUtil } from '../utils/notification.util';
import { AdvertNotificationService } from './setting.service';

@Injectable()
export class NotificationConnectionService implements OnModuleInit {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationUtil: NotificationUtil,
    private readonly advertNotificationService: AdvertNotificationService,
  ) {}

  onModuleInit() {
    // Connect the notification gateway to the notification util
    this.notificationUtil.setNotificationGateway(this.notificationGateway);
    this.advertNotificationService.setNotificationGateway(this.notificationGateway);
    
    console.log('✅ Notification gateway connected to notification util and advert notification service');
  }
}
