// src/faq/faq.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {  BannerController, BannerEventController, PrivacyPolicyController, TermsConditionsController, UserPermissionsController, PermissionTemplateController, PushNotificationController } from './setting.controller';
import {  BannerEventService, BannerService, PrivacyPolicyService, TermsConditionsService, UserPermissionsService, PermissionTemplateService, PushNotificationService } from './setting.service';
import {  Banner, BannerEvent, PrivacyPolicy, TermsConditions, UserPermissions, PermissionTemplate, PushNotification, NotificationHistory } from './setting.entity';
import { JwtModule } from '@nestjs/jwt';
// import { NotificationGateway } from './notification.gateway';
@Module({
    imports: [TypeOrmModule.forFeature([ PrivacyPolicy, TermsConditions,Banner,BannerEvent, UserPermissions, PermissionTemplate, PushNotification, NotificationHistory]),
    JwtModule.register({
        secret: process.env.JWT_SECRET,  // Use JWT secret from .env file
        signOptions: {},  // Set token expiration
    }), 
],
controllers: [PrivacyPolicyController, TermsConditionsController, BannerController,BannerEventController, UserPermissionsController, PermissionTemplateController, PushNotificationController],
providers: [PrivacyPolicyService, TermsConditionsService, BannerService,BannerEventService, UserPermissionsService, PermissionTemplateService, PushNotificationService],

})
export class SettingModule {}
