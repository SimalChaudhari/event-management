import * as QRCode from 'qrcode';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QRCodeUtils {
  /**
   * Generate QR code as data URL (base64 image)
   * @param data Data to encode in QR code
   * @returns Base64 encoded QR code image
   */
  static async generateQRCodeAsDataURL(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 300,
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

}
