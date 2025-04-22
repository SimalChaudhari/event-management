// src/countries/countries.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CountryDto } from './country.dto';

@Controller('api/countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  findAll(): CountryDto[] {
    return this.countriesService.getAll();
  }
}
