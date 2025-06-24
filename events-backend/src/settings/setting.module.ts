// src/faq/faq.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {  BannerController, BannerEventController, PrivacyPolicyController, TermsConditionsController } from './setting.controller';
import {  BannerEventService, BannerService, PrivacyPolicyService, TermsConditionsService } from './setting.service';
import {  Banner, BannerEvent, PrivacyPolicy, TermsConditions } from './setting.entity';
@Module({
    imports: [TypeOrmModule.forFeature([ PrivacyPolicy, TermsConditions,Banner,BannerEvent])
],
controllers: [PrivacyPolicyController, TermsConditionsController, BannerController,BannerEventController],
providers: [PrivacyPolicyService, TermsConditionsService, BannerService,BannerEventService],

})
export class SettingModule { }
