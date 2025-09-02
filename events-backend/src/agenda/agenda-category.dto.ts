import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';

export class CreateAgendaCategoryDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color code (e.g., #FF5733)',
  })
  color?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAgendaCategoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color code (e.g., #FF5733)',
  })
  color?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AgendaCategoryResponseDto {
  id!: string;
  name!: string;
  color?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  agendaCount?: number; // Number of agendas using this category
}

export class AgendaCategoryListResponseDto {
  id!: string;
  name!: string;
  color?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  agendaCount?: number;
}

export class BulkUpdateAgendaCategoryDto {
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  categoryIds!: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DeleteAgendaCategoryDto {
  @IsOptional()
  @IsUUID()
  replacementCategoryId?: string; // Category to move existing agendas to
}
