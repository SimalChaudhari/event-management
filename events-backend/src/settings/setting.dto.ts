// src/faq/dto/create-faq.dto.ts

import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePrivacyPolicyDto {
    @IsString()
    readonly id?: string; // Optional for creation, required for updates

    @IsNotEmpty()
    @IsString()
    readonly content?: string;
}

export class CreateTermsConditionsDto {
    @IsString()
    readonly id?: string; // Optional for creation, required for updates

    @IsNotEmpty()
    @IsString()
    readonly content?: string;
}

export class CreateBannerDto {
    @IsString()
    readonly id?: string;

    @IsString()
    readonly imageUrl!: string;

    @IsOptional()
    @IsString()
    readonly hyperlink?: string;
}

export class CreateBannerEventDto {
    @IsString()
    readonly id?: string;

    @IsArray()
    @IsString({ each: true })
    readonly imageUrls!: string[];

    @IsOptional()
    @IsString()
    readonly hyperlink?: string;
}

