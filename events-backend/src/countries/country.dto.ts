

import { IsString } from 'class-validator';

export class CountryDto {
    @IsString()
    code!: string;

    @IsString()
    name!: string;
  }
  