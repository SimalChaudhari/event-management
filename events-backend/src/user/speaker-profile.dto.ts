import {
  IsOptional,
  IsString,
} from 'class-validator';

export class SpeakerProfileDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSpeakerProfileDto extends SpeakerProfileDto {
  @IsString()
  userId!: string;
}

export class UpdateSpeakerProfileDto extends SpeakerProfileDto {}
