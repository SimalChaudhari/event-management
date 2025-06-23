// src/faq/faq.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {  BannerController, PrivacyPolicyController, TermsConditionsController } from './setting.controller';
import {  BannerService, PrivacyPolicyService, TermsConditionsService } from './setting.service';
import {  Banner, PrivacyPolicy, TermsConditions } from './setting.entity';
@Module({
    imports: [TypeOrmModule.forFeature([ PrivacyPolicy, TermsConditions,Banner])
],
controllers: [PrivacyPolicyController, TermsConditionsController, BannerController],
providers: [PrivacyPolicyService, TermsConditionsService, BannerService],

})
export class SettingModule { }
