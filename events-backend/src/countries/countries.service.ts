// src/countries/countries.service.ts
import { Injectable } from '@nestjs/common';
import * as countries from 'i18n-iso-countries';

@Injectable()
export class CountriesService {
  constructor() {
    // register English names
    countries.registerLocale(require('i18n-iso-countries/langs/en.json'));
  }

  /**
   * Returns an array of all countries:
   * [
   *   { code: 'AF', name: 'Afghanistan' },
   *   ...
   * ]
   */
  getAll(): { code: string; name: string }[] {
    const names = countries.getNames('en', { select: 'official' });
    return Object.entries(names).map(([code, name]) => ({ code, name }));
  }
}
