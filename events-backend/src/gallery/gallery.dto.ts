// src/dto/gallery.dto.ts
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsUUID,
    IsArray,
  } from 'class-validator';
  
  export class GalleryDto {
    @IsNotEmpty()
    @IsString()
    title!: string;
  
    @IsNotEmpty()
    @IsUUID()
    eventId!: string;
  
    @IsOptional()
    @IsArray()
    galleryImages?: string[];
  }
  
  export class UpdateGalleryDto {
    @IsOptional()
    @IsString()
    title?: string;
  
    @IsOptional()
    @IsArray()
    galleryImages?: string[];

    @IsOptional()
    originalImages?: any; // Add this line

  }