import { Controller, Post, Body, HttpStatus, HttpCode, Res } from '@nestjs/common';
import { Response } from 'express';
import { 
  validateCard, 
  detectCardTypeRealtime, 
  validateExpiryDate, 
  formatCardNumber,
  maskCardNumber,
  extractBINInfo,
  CardValidationResult,
  CARD_TYPES
} from '../utils/card-validation.utils';

export class CardValidationDto {
  cardNumber!: string;
  cvv?: string;
  expMonth?: number;
  expYear?: number;
}

export class CardTypeDetectionDto {
  cardNumber!: string;
}

@Controller('api/card-validation')
export class CardValidationController {
  
  /**
   * Real-time card type detection (as user types)
   * Similar to Amazon/Flipkart implementation
   */
  @Post('detect-type')
  @HttpCode(HttpStatus.OK)
  async detectCardType(@Body() dto: CardTypeDetectionDto, @Res() response: Response) {
    try {
      const result = detectCardTypeRealtime(dto.cardNumber);
      
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Card type detected successfully',
        data: {
          cardType: result.cardType.type,
          cardName: result.cardType.name,
          logo: result.cardType.logo,
          color: result.cardType.color,
          isValidLength: result.isValidLength,
          isLuhnValid: result.isLuhnValid,
          formattedNumber: result.formattedNumber,
          validLengths: result.cardType.validLengths,
          cvvLength: result.cardType.cvvLength,
          binInfo: extractBINInfo(dto.cardNumber)
        }
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Card type detection failed',
        error: error.message
      });
    }
  }

  /**
   * Comprehensive card validation
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateCard(@Body() dto: CardValidationDto, @Res() response: Response) {
    try {
      const validationResult = validateCard(dto.cardNumber, dto.cvv);
      
      let expiryValid = true;
      let expiryMessage = '';
      
      if (dto.expMonth && dto.expYear) {
        expiryValid = validateExpiryDate(dto.expMonth, dto.expYear);
        if (!expiryValid) {
          expiryMessage = 'Expiry date is invalid or expired';
        }
      }
      
      const isValid = validationResult.isValid && expiryValid;
      
      const statusCode = isValid ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
      
      return response.status(statusCode).json({
        success: isValid,
        message: isValid ? 'Card validation successful' : 'Card validation failed',
        data: {
          isValid,
          cardType: validationResult.cardType,
          isLuhnValid: validationResult.isLuhnValid,
          isValidLength: validationResult.cardType.validLengths.includes(
            dto.cardNumber.replace(/\D/g, '').length
          ),
          isValidCVV: dto.cvv ? validationResult.cardType.cvvLength === dto.cvv.length : true,
          isValidExpiry: expiryValid,
          expiryMessage,
          formattedNumber: validationResult.formattedNumber,
          maskedNumber: validationResult.maskedNumber,
          binInfo: validationResult.binInfo,
          validationDetails: {
            luhnCheck: validationResult.isLuhnValid,
            lengthCheck: validationResult.cardType.validLengths.includes(
              dto.cardNumber.replace(/\D/g, '').length
            ),
            cvvCheck: dto.cvv ? validationResult.cardType.cvvLength === dto.cvv.length : null,
            expiryCheck: expiryValid
          }
        }
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Card validation failed',
        error: error.message
      });
    }
  }

  /**
   * Format card number
   */
  @Post('format')
  @HttpCode(HttpStatus.OK)
  async formatCardNumber(@Body() dto: { cardNumber: string }, @Res() response: Response) {
    try {
      const formatted = formatCardNumber(dto.cardNumber);
      const masked = maskCardNumber(dto.cardNumber);
      const binInfo = extractBINInfo(dto.cardNumber);
      
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Card number formatted successfully',
        data: {
          original: dto.cardNumber,
          formatted: formatted,
          masked: masked,
          binInfo: binInfo
        }
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Card formatting failed',
        error: error.message
      });
    }
  }

  /**
   * Get BIN information
   */
  @Post('bin-info')
  @HttpCode(HttpStatus.OK)
  async getBINInfo(@Body() dto: { cardNumber: string }, @Res() response: Response) {
    try {
      const binInfo = extractBINInfo(dto.cardNumber);
      
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'BIN information retrieved successfully',
        data: binInfo
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'BIN information retrieval failed',
        error: error.message
      });
    }
  }

  /**
   * Get all supported card types
   */
  @Post('supported-types')
  @HttpCode(HttpStatus.OK)
  async getSupportedCardTypes(@Res() response: Response) {
    try {
      const cardTypes = Object.values(CARD_TYPES).map(cardType => ({
        type: cardType.type,
        name: cardType.name,
        logo: cardType.logo,
        color: cardType.color,
        validLengths: cardType.validLengths,
        cvvLength: cardType.cvvLength,
        country: cardType.country,
        region: cardType.region,
      }));

      // Group by region
      const groupedByRegion = cardTypes.reduce((acc, cardType) => {
        const region = cardType.region || 'Global';
        if (!acc[region]) {
          acc[region] = [];
        }
        acc[region].push(cardType);
        return acc;
      }, {} as Record<string, any[]>);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Supported card types retrieved successfully',
        data: {
          totalTypes: cardTypes.length,
          cardTypes: cardTypes,
          groupedByRegion: groupedByRegion,
          regions: Object.keys(groupedByRegion)
        }
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Failed to retrieve supported card types',
        error: error.message
      });
    }
  }
}
