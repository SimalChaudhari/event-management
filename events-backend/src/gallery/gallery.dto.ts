// src/dto/gallery.dto.ts
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsUUID,
    IsArray,
  } from 'class-validator';
  
  export class GalleryDto {
    /** When present, update this gallery (edit mode). When absent, create or find by eventId+trackTitle. */
    @IsOptional()
    @IsUUID()
    id?: string;

    /** Track name (e.g. "Track 1", "Track 2"). Defaults to "Default" if empty. */
    @IsOptional()
    @IsString()
    trackTitle?: string;

    @IsOptional()
    @IsArray()
    galleryImages?: string[];

    @IsOptional()
    originalImages?: any;
  }

  export class UpdateGalleryDto {
    @IsOptional()
    @IsString()
    trackTitle?: string;

    @IsOptional()
    @IsArray()
    galleryImages?: string[];

    @IsOptional()
    originalImages?: any;
  }