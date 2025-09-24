/**
 * Card Validation and Type Detection Utilities
 * Implements BIN/IIN detection and Luhn algorithm validation
 * Similar to Amazon/Flipkart card type detection
 */

export interface CardTypeInfo {
  type: 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | 'maestro' | 'elo' | 'hipercard' | 'aura' | 'mir' | 'troy' | 'rupay' | 'instapayment' | 'laser' | 'solo' | 'switch' | 'dankort' | 'carte_bancaire' | 'unknown';
  name: string;
  logo: string;
  color: string;
  validLengths: number[];
  validPrefixes: (string | number | number[])[];
  cvvLength: number;
  country?: string;
  region?: string;
}

export interface CardValidationResult {
  isValid: boolean;
  cardType: CardTypeInfo;
  isLuhnValid: boolean;
  formattedNumber: string;
  maskedNumber: string;
  binInfo: {
    bin: string;
    brand: string;
    country?: string;
    bank?: string;
  };
}

/**
 * Comprehensive card type definitions with BIN/IIN ranges
 * Includes all major international and regional card types
 */
export const CARD_TYPES: Record<string, CardTypeInfo> = {
  // Major Global Networks
  visa: {
    type: 'visa',
    name: 'Visa',
    logo: 'visa',
    color: '#1A1F71',
    validLengths: [13, 16, 19],
    validPrefixes: [4],
    cvvLength: 3,
    region: 'Global',
  },
  mastercard: {
    type: 'mastercard',
    name: 'Mastercard',
    logo: 'mastercard',
    color: '#EB001B',
    validLengths: [16],
    validPrefixes: [
      51, 52, 53, 54, 55, // 5x series
      [2221, 2720], // 2xxx series
    ],
    cvvLength: 3,
    region: 'Global',
  },
  amex: {
    type: 'amex',
    name: 'American Express',
    logo: 'amex',
    color: '#006FCF',
    validLengths: [15],
    validPrefixes: [34, 37],
    cvvLength: 4,
    country: 'USA',
    region: 'Global',
  },
  discover: {
    type: 'discover',
    name: 'Discover',
    logo: 'discover',
    color: '#FF6000',
    validLengths: [16],
    validPrefixes: [6011, [644, 649], 65],
    cvvLength: 3,
    country: 'USA',
    region: 'Americas',
  },
  diners: {
    type: 'diners',
    name: 'Diners Club',
    logo: 'diners',
    color: '#0079BE',
    validLengths: [14],
    validPrefixes: [36, 38, [300, 305]],
    cvvLength: 3,
    region: 'Global',
  },
  jcb: {
    type: 'jcb',
    name: 'JCB',
    logo: 'jcb',
    color: '#003B7C',
    validLengths: [15, 16],
    validPrefixes: [[3528, 3589]],
    cvvLength: 3,
    country: 'Japan',
    region: 'Asia',
  },
  unionpay: {
    type: 'unionpay',
    name: 'UnionPay',
    logo: 'unionpay',
    color: '#E21836',
    validLengths: [16, 17, 18, 19],
    validPrefixes: [62, 88],
    cvvLength: 3,
    country: 'China',
    region: 'Asia',
  },

  // European Cards
  maestro: {
    type: 'maestro',
    name: 'Maestro',
    logo: 'maestro',
    color: '#009DDC',
    validLengths: [12, 13, 14, 15, 16, 17, 18, 19],
    validPrefixes: [
      5018, 5020, 5038, 5893, 6304, 6759, 6761, 6762, 6763,
      [500000, 509999], [560000, 569999], [600000, 609999]
    ],
    cvvLength: 3,
    region: 'Europe',
  },
  instapayment: {
    type: 'instapayment',
    name: 'InstaPayment',
    logo: 'instapayment',
    color: '#FF6600',
    validLengths: [16],
    validPrefixes: [637, 638, 639],
    cvvLength: 3,
    region: 'Europe',
  },
  laser: {
    type: 'laser',
    name: 'Laser',
    logo: 'laser',
    color: '#0066CC',
    validLengths: [16, 17, 18, 19],
    validPrefixes: [6304, 6706, 6771, 6709],
    cvvLength: 3,
    country: 'Ireland',
    region: 'Europe',
  },
  solo: {
    type: 'solo',
    name: 'Solo',
    logo: 'solo',
    color: '#FF6600',
    validLengths: [16, 18, 19],
    validPrefixes: [6334, 6767],
    cvvLength: 3,
    country: 'UK',
    region: 'Europe',
  },
  switch: {
    type: 'switch',
    name: 'Switch',
    logo: 'switch',
    color: '#FF6600',
    validLengths: [16, 18, 19],
    validPrefixes: [4903, 4905, 4911, 4936, 564182, 633110, 6333, 6759],
    cvvLength: 3,
    country: 'UK',
    region: 'Europe',
  },
  dankort: {
    type: 'dankort',
    name: 'Dankort',
    logo: 'dankort',
    color: '#0066CC',
    validLengths: [16],
    validPrefixes: [5019],
    cvvLength: 3,
    country: 'Denmark',
    region: 'Europe',
  },
  carte_bancaire: {
    type: 'carte_bancaire',
    name: 'Carte Bancaire',
    logo: 'carte_bancaire',
    color: '#FF6600',
    validLengths: [16],
    validPrefixes: [4],
    cvvLength: 3,
    country: 'France',
    region: 'Europe',
  },

  // Asian Cards
  rupay: {
    type: 'rupay',
    name: 'RuPay',
    logo: 'rupay',
    color: '#00AEEF',
    validLengths: [16],
    validPrefixes: [60, 6521, 6522],
    cvvLength: 3,
    country: 'India',
    region: 'Asia',
  },
  mir: {
    type: 'mir',
    name: 'MIR',
    logo: 'mir',
    color: '#00B956',
    validLengths: [16, 17, 18, 19],
    validPrefixes: [2200, 2201, 2202, 2203, 2204],
    cvvLength: 3,
    country: 'Russia',
    region: 'Europe/Asia',
  },

  // South American Cards
  elo: {
    type: 'elo',
    name: 'Elo',
    logo: 'elo',
    color: '#FFD700',
    validLengths: [16],
    validPrefixes: [
      401178, 401179, 438935, 457631, 457632, 431274, 451416,
      457393, 504175, 506699, 506770, 506771, 506772, 506773,
      506774, 506775, 506776, 506777, 506778, 627780, 636297,
      636368, 650031, 650032, 650033, 650034, 650035, 650036,
      650037, 650038, 650039, 650040, 650041, 650042, 650043,
      650044, 650045, 650046, 650047, 650048, 650049, 650050,
      650051, 650405, 650406, 650407, 650408, 650409, 650410,
      650411, 650412, 650413, 650414, 650415, 650416, 650417,
      650418, 650419, 650420, 650421, 650422, 650423, 650424,
      650425, 650426, 650427, 650428, 650429, 650430, 650431,
      650432, 650433, 650434, 650435, 650436, 650437, 650438,
      650439, 650440, 650441, 650442, 650443, 650444, 650445,
      650446, 650447, 650448, 650449, 650450, 650451, 650452,
      650453, 650454, 650455, 650456, 650457, 650458, 650459,
      650460, 650461, 650462, 650463, 650464, 650465, 650466,
      650467, 650468, 650469, 650470, 650471, 650472, 650473,
      650474, 650475, 650476, 650477, 650478, 650479, 650480,
      650481, 650482, 650483, 650484, 650485, 650486, 650487,
      650488, 650489, 650490, 650491, 650492, 650493, 650494,
      650495, 650496, 650497, 650498, 650499, 650500, 650501,
      650502, 650503, 650504, 650505, 650506, 650507, 650508,
      650509, 650510, 650511, 650512, 650513, 650514, 650515,
      650516, 650517, 650518, 650519, 650520, 650521, 650522,
      650523, 650524, 650525, 650526, 650527, 650528, 650529,
      650530, 650531, 650532, 650533, 650534, 650535, 650536,
      650537, 650538, 650539, 650540, 650541, 650542, 650543,
      650544, 650545, 650546, 650547, 650548, 650549, 650550,
      650551, 650552, 650553, 650554, 650555, 650556, 650557,
      650558, 650559, 650560, 650561, 650562, 650563, 650564,
      650565, 650566, 650567, 650568, 650569, 650570, 650571,
      650572, 650573, 650574, 650575, 650576, 650577, 650578,
      650579, 650580, 650581, 650582, 650583, 650584, 650585,
      650586, 650587, 650588, 650589, 650590, 650591, 650592,
      650593, 650594, 650595, 650596, 650597, 650598, 650599,
      650600, 650601, 650602, 650603, 650604, 650605, 650606,
      650607, 650608, 650609, 650610, 650611, 650612, 650613,
      650614, 650615, 650616, 650617, 650618, 650619, 650620,
      650621, 650622, 650623, 650624, 650625, 650626, 650627,
      650628, 650629, 650630, 650631, 650632, 650633, 650634,
      650635, 650636, 650637, 650638, 650639, 650640, 650641,
      650642, 650643, 650644, 650645, 650646, 650647, 650648,
      650649, 650650, 650651, 650652, 650653, 650654, 650655,
      650656, 650657, 650658, 650659, 650660, 650661, 650662,
      650663, 650664, 650665, 650666, 650667, 650668, 650669,
      650670, 650671, 650672, 650673, 650674, 650675, 650676,
      650677, 650678, 650679, 650680, 650681, 650682, 650683,
      650684, 650685, 650686, 650687, 650688, 650689, 650690,
      650691, 650692, 650693, 650694, 650695, 650696, 650697,
      650698, 650699, 650700, 650701, 650702, 650703, 650704,
      650705, 650706, 650707, 650708, 650709, 650710, 650711,
      650712, 650713, 650714, 650715, 650716, 650717, 650718,
      650719, 650720, 650721, 650722, 650723, 650724, 650725,
      650726, 650727, 650728, 650729, 650730, 650731, 650732,
      650733, 650734, 650735, 650736, 650737, 650738, 650739,
      650740, 650741, 650742, 650743, 650744, 650745, 650746,
      650747, 650748, 650749, 650750, 650751, 650752, 650753,
      650754, 650755, 650756, 650757, 650758, 650759, 650760,
      650761, 650762, 650763, 650764, 650765, 650766, 650767,
      650768, 650769, 650770, 650771, 650772, 650773, 650774,
      650775, 650776, 650777, 650778, 650779, 650780, 650781,
      650782, 650783, 650784, 650785, 650786, 650787, 650788,
      650789, 650790, 650791, 650792, 650793, 650794, 650795,
      650796, 650797, 650798, 650799, 650800, 650801, 650802,
      650803, 650804, 650805, 650806, 650807, 650808, 650809,
      650810, 650811, 650812, 650813, 650814, 650815, 650816,
      650817, 650818, 650819, 650820, 650821, 650822, 650823,
      650824, 650825, 650826, 650827, 650828, 650829, 650830,
      650831, 650832, 650833, 650834, 650835, 650836, 650837,
      650838, 650839, 650840, 650841, 650842, 650843, 650844,
      650845, 650846, 650847, 650848, 650849, 650850, 650851,
      650852, 650853, 650854, 650855, 650856, 650857, 650858,
      650859, 650860, 650861, 650862, 650863, 650864, 650865,
      650866, 650867, 650868, 650869, 650870, 650871, 650872,
      650873, 650874, 650875, 650876, 650877, 650878, 650879,
      650880, 650881, 650882, 650883, 650884, 650885, 650886,
      650887, 650888, 650889, 650890, 650891, 650892, 650893,
      650894, 650895, 650896, 650897, 650898, 650899, 650900,
      650901, 650902, 650903, 650904, 650905, 650906, 650907,
      650908, 650909, 650910, 650911, 650912, 650913, 650914,
      650915, 650916, 650917, 650918, 650919, 650920, 650921,
      650922, 650923, 650924, 650925, 650926, 650927, 650928,
      650929, 650930, 650931, 650932, 650933, 650934, 650935,
      650936, 650937, 650938, 650939, 650940, 650941, 650942,
      650943, 650944, 650945, 650946, 650947, 650948, 650949,
      650950, 650951, 650952, 650953, 650954, 650955, 650956,
      650957, 650958, 650959, 650960, 650961, 650962, 650963,
      650964, 650965, 650966, 650967, 650968, 650969, 650970,
      650971, 650972, 650973, 650974, 650975, 650976, 650977,
      650978, 650979, 650980, 650981, 650982, 650983, 650984,
      650985, 650986, 650987, 650988, 650989, 650990, 650991,
      650992, 650993, 650994, 650995, 650996, 650997, 650998,
      650999
    ],
    cvvLength: 3,
    country: 'Brazil',
    region: 'South America',
  },
  hipercard: {
    type: 'hipercard',
    name: 'Hipercard',
    logo: 'hipercard',
    color: '#FF6600',
    validLengths: [13, 16, 19],
    validPrefixes: [606282, 384100, 384140, 384160],
    cvvLength: 3,
    country: 'Brazil',
    region: 'South America',
  },
  aura: {
    type: 'aura',
    name: 'Aura',
    logo: 'aura',
    color: '#0066CC',
    validLengths: [16],
    validPrefixes: [50],
    cvvLength: 3,
    country: 'Brazil',
    region: 'South America',
  },

  // Turkish Cards
  troy: {
    type: 'troy',
    name: 'Troy',
    logo: 'troy',
    color: '#FF6600',
    validLengths: [16],
    validPrefixes: [9792],
    cvvLength: 3,
    country: 'Turkey',
    region: 'Europe/Asia',
  },

  // Unknown/Generic
  unknown: {
    type: 'unknown',
    name: 'Unknown Card',
    logo: 'unknown',
    color: '#666666',
    validLengths: [12, 13, 14, 15, 16, 17, 18, 19],
    validPrefixes: [],
    cvvLength: 3,
    region: 'Global',
  },
};

/**
 * Luhn algorithm implementation for card number validation
 */
export function validateLuhnAlgorithm(cardNumber: string): boolean {
  // Remove all non-digit characters
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length === 0) return false;
  
  let sum = 0;
  let isEven = false;
  
  // Process digits from right to left
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Detect card type based on BIN/IIN (Bank Identification Number)
 */
export function detectCardType(cardNumber: string): CardTypeInfo {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length === 0) {
    return CARD_TYPES.unknown;
  }
  
  // Check each card type
  for (const [type, cardInfo] of Object.entries(CARD_TYPES)) {
    if (type === 'unknown') continue;
    
    for (const prefix of cardInfo.validPrefixes) {
      if (Array.isArray(prefix)) {
        // Handle range prefixes (e.g., [2221, 2720])
        const [start, end] = prefix;
        const bin = parseInt(cleanNumber.substring(0, start.toString().length), 10);
        
        if (bin >= start && bin <= end) {
          return cardInfo;
        }
      } else {
        // Handle single prefixes
        const prefixStr = prefix.toString();
        if (cleanNumber.startsWith(prefixStr)) {
          return cardInfo;
        }
      }
    }
  }
  
  return CARD_TYPES.unknown;
}

/**
 * Validate card number length based on card type
 */
export function validateCardLength(cardNumber: string, cardType: CardTypeInfo): boolean {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  return cardType.validLengths.includes(cleanNumber.length);
}

/**
 * Validate CVV based on card type
 */
export function validateCVV(cvv: string, cardType: CardTypeInfo): boolean {
  const cleanCvv = cvv.replace(/\D/g, '');
  return cleanCvv.length === cardType.cvvLength;
}

/**
 * Format card number with spaces (e.g., 4111 1111 1111 1111)
 */
export function formatCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Different spacing patterns for different card types
  const cardType = detectCardType(cleanNumber);
  
  switch (cardType.type) {
    case 'amex':
      // American Express: XXXX XXXXXX XXXXX
      return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    case 'diners':
      // Diners Club: XXXX XXXXXX XXXXX
      return cleanNumber.replace(/(\d{4})(\d{6})(\d{4})/, '$1 $2 $3');
    default:
      // Most cards: XXXX XXXX XXXX XXXX
      return cleanNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
}

/**
 * Mask card number (e.g., **** **** **** 1111)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 4) return '*'.repeat(cleanNumber.length);
  
  const last4 = cleanNumber.slice(-4);
  const masked = '*'.repeat(cleanNumber.length - 4);
  
  return `${masked}${last4}`;
}

/**
 * Extract BIN (Bank Identification Number) information
 */
export function extractBINInfo(cardNumber: string): { bin: string; brand: string; country?: string; bank?: string } {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const cardType = detectCardType(cleanNumber);
  
  // Extract first 6-8 digits as BIN
  const bin = cleanNumber.substring(0, Math.min(8, cleanNumber.length));
  
  return {
    bin,
    brand: cardType.name,
    // Additional BIN database lookup could be added here
    // for country and bank information
  };
}

/**
 * Comprehensive card validation
 */
export function validateCard(cardNumber: string, cvv?: string): CardValidationResult {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const cardType = detectCardType(cleanNumber);
  const isLuhnValid = validateLuhnAlgorithm(cleanNumber);
  const isValidLength = validateCardLength(cleanNumber, cardType);
  const isValidCVV = cvv ? validateCVV(cvv, cardType) : true;
  
  const isValid = isLuhnValid && isValidLength && isValidCVV;
  
  return {
    isValid,
    cardType,
    isLuhnValid,
    formattedNumber: formatCardNumber(cleanNumber),
    maskedNumber: maskCardNumber(cleanNumber),
    binInfo: extractBINInfo(cleanNumber),
  };
}

/**
 * Real-time card type detection for frontend
 * Returns card type as user types
 */
export function detectCardTypeRealtime(cardNumber: string): {
  cardType: CardTypeInfo;
  isValidLength: boolean;
  isLuhnValid: boolean;
  formattedNumber: string;
} {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const cardType = detectCardType(cleanNumber);
  const isValidLength = validateCardLength(cleanNumber, cardType);
  const isLuhnValid = validateLuhnAlgorithm(cleanNumber);
  
  return {
    cardType,
    isValidLength,
    isLuhnValid,
    formattedNumber: formatCardNumber(cleanNumber),
  };
}

/**
 * Get card icon/logo for frontend display
 */
export function getCardIcon(cardType: string): string {
  const type = cardType.toLowerCase();
  return CARD_TYPES[type]?.logo || 'unknown';
}

/**
 * Get card color for frontend styling
 */
export function getCardColor(cardType: string): string {
  const type = cardType.toLowerCase();
  return CARD_TYPES[type]?.color || '#666666';
}

/**
 * Validate expiry date
 */
export function validateExpiryDate(month: number, year: number): boolean {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Convert 2-digit year to 4-digit
  const fullYear = year < 100 ? year + 2000 : year;
  
  // Check if expiry is in the future
  if (fullYear < currentYear) return false;
  if (fullYear === currentYear && month < currentMonth) return false;
  
  // Check if month is valid
  if (month < 1 || month > 12) return false;
  
  // Check if expiry is not too far in the future (e.g., 20 years)
  if (fullYear > currentYear + 20) return false;
  
  return true;
}

/**
 * Format expiry date (e.g., 12/25)
 */
export function formatExpiryDate(month: number, year: number): string {
  const formattedMonth = month.toString().padStart(2, '0');
  const formattedYear = year.toString().slice(-2);
  return `${formattedMonth}/${formattedYear}`;
}
