/**
 * Order number generation utility.
 * Format: ORD-YYYYMMDD-XXXXXX (date + 6 random alphanumeric chars).
 * Caller must provide a checkExists function to ensure uniqueness.
 */

const ORDER_NUMBER_PREFIX = 'ORD';
const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const RANDOM_CODE_LENGTH = 6;
const DEFAULT_MAX_ATTEMPTS = 20;

/**
 * Returns the date part for order number: YYYYMMDD
 */
export function getOrderNumberDatePart(date: Date = new Date()): string {
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getDate().toString().padStart(2, '0'),
  ].join('');
}

/**
 * Returns the prefix for order number: ORD-YYYYMMDD-
 */
export function getOrderNumberPrefix(date: Date = new Date()): string {
  return `${ORDER_NUMBER_PREFIX}-${getOrderNumberDatePart(date)}-`;
}

/**
 * Generates a random alphanumeric code (0-9, A-Z) of given length.
 */
export function generateRandomOrderCode(length: number = RANDOM_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return code;
}

export interface GenerateUniqueOrderNumberOptions {
  /** Max attempts before throwing. Default 20. */
  maxAttempts?: number;
  /** Optional custom date for prefix. Default: now */
  date?: Date;
}

/**
 * Generates a unique order number: ORD-YYYYMMDD-XXXXXX.
 * Uses checkExists(orderNo) to ensure the number is not already used.
 * @param checkExists - Async function that returns true if orderNo already exists in DB
 * @param options - Optional maxAttempts and date
 * @returns Unique order number
 * @throws Error if unique number could not be generated after maxAttempts
 */
export async function generateUniqueOrderNumber(
  checkExists: (orderNo: string) => Promise<boolean>,
  options: GenerateUniqueOrderNumberOptions = {},
): Promise<string> {
  const { maxAttempts = DEFAULT_MAX_ATTEMPTS, date = new Date() } = options;
  const prefix = getOrderNumberPrefix(date);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRandomOrderCode(RANDOM_CODE_LENGTH);
    const orderNo = `${prefix}${code}`;
    const exists = await checkExists(orderNo);
    if (!exists) return orderNo;
  }

  throw new Error('Could not generate unique order number. Please retry.');
}
