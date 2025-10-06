// src/faq/faq.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {  BannerController, BannerEventController, LogoController, PrivacyPolicyController, TermsConditionsController, UserPermissionsController, PermissionTemplateController, PushNotificationController, AdvertNotificationController, AdvertNotificationUserController } from './setting.controller';
import {  BannerEventService, BannerService, LogoService, PrivacyPolicyService, TermsConditionsService, UserPermissionsService, PermissionTemplateService, PushNotificationService, AdvertNotificationService } from './setting.service';
import {  Banner, BannerEvent, Logo, PrivacyPolicy, TermsConditions, UserPermissions, PermissionTemplate, PushNotification, NotificationHistory, AdvertNotification, AdvertNotificationRead } from './setting.entity';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { EventNotification, EventNotificationRead } from './event-notification.entity';
import { NotificationUtil } from '../utils/notification.util';
import { EventNotificationService } from '../utils/event-notification.service';
import { NotificationConnectionService } from './notification-connection.service';
import { UserEntity } from 'user/users.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ PrivacyPolicy, TermsConditions,Banner,BannerEvent, Logo, UserPermissions, PermissionTemplate, PushNotification, NotificationHistory, RegisterEvent, EventNotification, EventNotificationRead, AdvertNotification, AdvertNotificationRead, UserEntity]),
    JwtModule.register({
        secret: process.env.JWT_SECRET,  // Use JWT secret from .env file
        signOptions: {},  // Set token expiration
    }), 
],
controllers: [PrivacyPolicyController, TermsConditionsController, BannerController,BannerEventController, LogoController, UserPermissionsController, PermissionTemplateController, PushNotificationController, AdvertNotificationController, AdvertNotificationUserController],
providers: [PrivacyPolicyService, TermsConditionsService, BannerService,BannerEventService, LogoService, UserPermissionsService, PermissionTemplateService, PushNotificationService, AdvertNotificationService, NotificationGateway, NotificationUtil, EventNotificationService, NotificationConnectionService],

})
export class SettingModule {}
