// src/faq/faq.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {  AppVersionController, BannerController, BannerEventController, LogoController, PrivacyPolicyController, TermsConditionsController, UserPermissionsController, PermissionTemplateController, PushNotificationController, AdvertNotificationController, AdvertNotificationUserController } from './setting.controller';
import {  AppVersionService, BannerService, BannerEventService, LogoService, PrivacyPolicyService, TermsConditionsService, UserPermissionsService, PermissionTemplateService, PushNotificationService, AdvertNotificationService } from './setting.service';
import {  AppVersionSetting, Banner, BannerEvent, Logo, PrivacyPolicy, TermsConditions, UserPermissions, PermissionTemplate, PushNotification, NotificationHistory, AdvertNotification, AdvertNotificationRead } from './setting.entity';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { EventNotification, EventNotificationRead } from './event-notification.entity';
import { NotificationUtil } from '../utils/notification.util';
import { EventNotificationService } from '../utils/event-notification.service';
import { NotificationConnectionService } from './notification-connection.service';
import { UserEntity } from 'user/users.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ AppVersionSetting, PrivacyPolicy, TermsConditions, Banner, BannerEvent, Logo, UserPermissions, PermissionTemplate, PushNotification, NotificationHistory, RegisterEvent, EventNotification, EventNotificationRead, AdvertNotification, AdvertNotificationRead, UserEntity]),
    JwtModule.register({
        secret: process.env.JWT_SECRET,  // Use JWT secret from .env file
        signOptions: {},  // Set token expiration
    }), 
],
controllers: [AppVersionController, PrivacyPolicyController, TermsConditionsController, BannerController, BannerEventController, LogoController, UserPermissionsController, PermissionTemplateController, PushNotificationController, AdvertNotificationController, AdvertNotificationUserController],
providers: [AppVersionService, PrivacyPolicyService, TermsConditionsService, BannerService, BannerEventService, LogoService, UserPermissionsService, PermissionTemplateService, PushNotificationService, AdvertNotificationService, NotificationGateway, NotificationUtil, EventNotificationService, NotificationConnectionService],

})
export class SettingModule {}
