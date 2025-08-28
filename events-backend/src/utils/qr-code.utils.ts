import * as QRCode from 'qrcode';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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

  /**
   * Generate QR code as SVG string
   * @param data Data to encode in QR code
   * @returns SVG string
   */
  static async generateQRCodeAsSVG(data: string): Promise<string> {
    try {
      const qrCodeSVG = await QRCode.toString(data, {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 300,
      });
      
      return qrCodeSVG;
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Generate QR code as Buffer
   * @param data Data to encode in QR code
   * @returns Buffer containing QR code image
   */
  static async generateQRCodeAsBuffer(data: string): Promise<Buffer> {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(data, {
        type: 'png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 300,
      });
      
      return qrCodeBuffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  /**
   * Save QR code as PNG file to server
   * @param data Data to encode in QR code
   * @param username Username for folder creation
   * @param email Email for folder creation
   * @param uploadPath Path to save the file (default: uploads/qr-codes)
   * @returns Object with file path and URL
   */
  static async saveQRCodeAsPNG(
    data: string, 
    username: string,
    email: string,
    uploadPath: string = 'uploads/qr-codes'
  ): Promise<{ filePath: string; fileUrl: string; fileName: string; folderPath: string }> {
    try {
      // Create folder name: username-emailname
      const emailName = email.split('@')[0]; // Get part before @
      const folderName = `${username}-${emailName}`;
      const fullUploadPath = path.join(process.cwd(), uploadPath, folderName);
      
      // Ensure folder exists
      if (!fs.existsSync(fullUploadPath)) {
        fs.mkdirSync(fullUploadPath, { recursive: true });
      }

      // Check if QR code already exists in this folder
      const existingFiles = fs.readdirSync(fullUploadPath);
      const qrCodeFile = existingFiles.find(file => file.endsWith('.png'));
      
      if (qrCodeFile) {
        // QR code already exists, return existing file info
        const existingFilePath = path.join(fullUploadPath, qrCodeFile);
        return {
          filePath: existingFilePath,
          fileUrl: `/uploads/qr-codes/${folderName}/${qrCodeFile}`,
          fileName: qrCodeFile,
          folderPath: folderName
        };
      }

      // Generate new QR code buffer
      const qrCodeBuffer = await this.generateQRCodeAsBuffer(data);
      
      // Create filename: qr-code.png (no timestamp needed since one per user)
      const filename = 'qr-code.png';
      const fullFilePath = path.join(fullUploadPath, filename);
      
      // Write file to disk
      fs.writeFileSync(fullFilePath, qrCodeBuffer);
      
      // Return file information
      return {
        filePath: fullFilePath,
        fileUrl: `/uploads/qr-codes/${folderName}/${filename}`,
        fileName: filename,
        folderPath: folderName
      };
    } catch (error) {
      console.error('Error saving QR code as PNG:', error);
      throw new Error('Failed to save QR code as PNG file');
    }
  }

  /**
   * Delete QR code PNG file from server
   * @param filename Filename to delete
   * @param uploadPath Path where file is stored (default: uploads/qr-codes)
   * @returns Boolean indicating success
   */
  static deleteQRCodePNG(
    filename: string, 
    uploadPath: string = 'uploads/qr-codes'
  ): boolean {
    try {
      const fullFilePath = path.join(process.cwd(), uploadPath, filename);
      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting QR code PNG:', error);
      return false;
    }
  }

  /**
   * Validate QR code data
   * @param data Data to validate
   * @returns Boolean indicating if data is valid
   */
  static isValidQRCodeData(data: string): boolean {
    return Boolean(data && data.length > 0 && data.length <= 2953); // QR code capacity limit
  }
}
