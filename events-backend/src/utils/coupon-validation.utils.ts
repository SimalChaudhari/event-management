import { BadRequestException } from '@nestjs/common';

const MESSAGES = {
  required: 'Valid from and valid to date and time are required. Please provide both to create a coupon.',
  fromBeforeTo: 'Valid from date and time must be before valid to date and time.',
  fromPast: 'Valid from date and time cannot be in the past. Please choose a current or future date and time.',
  toPast: 'Valid to date and time cannot be in the past. Please choose a current or future date and time.',
};

export interface ValidateCouponDatesForCreateResult {
  validFrom: Date;
  validTo: Date;
}

/**
 * Validates coupon validFrom and validTo for create.
 * Both are required, must not be in the past, and validFrom must be before validTo.
 * @throws BadRequestException with user-friendly message when validation fails.
 */
export function validateCouponDatesForCreate(
  validFrom: string | undefined,
  validTo: string | undefined,
): ValidateCouponDatesForCreateResult {
  if (!validFrom || !validTo) {
    throw new BadRequestException(MESSAGES.required);
  }
  const validFromDate = new Date(validFrom);
  const validToDate = new Date(validTo);
  if (validFromDate > validToDate) {
    throw new BadRequestException(MESSAGES.fromBeforeTo);
  }
  const now = new Date();
  if (validFromDate < now) {
    throw new BadRequestException(MESSAGES.fromPast);
  }
  if (validToDate < now) {
    throw new BadRequestException(MESSAGES.toPast);
  }
  return { validFrom: validFromDate, validTo: validToDate };
}

/**
 * Validates a single date (validFrom or validTo) for update: must not be in the past.
 * @throws BadRequestException when date is in the past.
 */
export function validateCouponDateNotPast(
  value: string | Date | undefined,
  field: 'validFrom' | 'validTo',
): Date | undefined {
  if (value === undefined || value === null) return undefined;
  const date = new Date(value);
  const now = new Date();
  if (date < now) {
    const message = field === 'validFrom' ? MESSAGES.fromPast : MESSAGES.toPast;
    throw new BadRequestException(message);
  }
  return date;
}
