import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import * as fs from 'fs';

export interface FileUploadConfig {
  images?: Express.Multer.File[];
  documents?: Express.Multer.File[];
  floorPlan?: Express.Multer.File[];
  eventStampImages?: Express.Multer.File[];
  advertImage?: Express.Multer.File[];
  backgroundImage?: Express.Multer.File[];
}

export interface FileUploadOptions {
  maxImageCount?: number;
  maxDocumentCount?: number;
  maxFloorPlanCount?: number;
  maxEventStampImageCount?: number;
  maxFileSize?: number; // in bytes
}

export class FileUploadUtils {
  private static readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  private static readonly ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

  /**
   * Create file fields configuration for event uploads
   */
  static getEventFileFields(options: FileUploadOptions = {}) {
    const {
      maxImageCount = 10,
      maxDocumentCount = 5,
      maxFloorPlanCount = 1,
      maxEventStampImageCount = 10
    } = options;

    return [
      { name: 'images', maxCount: maxImageCount },
      { name: 'documents', maxCount: maxDocumentCount },
      { name: 'floorPlan', maxCount: maxFloorPlanCount },
      { name: 'eventStampImages', maxCount: maxEventStampImageCount },
      { name: 'backgroundImage', maxCount: 1 }
    ];
  }

  /**
   * Create storage configuration for event file uploads
   */
  static getEventStorageConfig() {
    return diskStorage({
      destination: (req, file, cb) => {
        const fieldName = file.fieldname;
        let destinationPath = '';
        
        switch (fieldName) {
          case 'images':
            destinationPath = './uploads/event/images';
            break;
          case 'documents':
            destinationPath = './uploads/event/documents';
            break;
          case 'floorPlan':
            destinationPath = './uploads/event/floorPlan';
            break;
          case 'eventStampImages':
            destinationPath = './uploads/eventStamps/images';
            break;
          case 'backgroundImage':
            destinationPath = './uploads/event/background';
            break;
          default:
            destinationPath = './uploads/event/images'; // Default fallback
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(destinationPath)) {
          fs.mkdirSync(destinationPath, { recursive: true });
        }
        
        cb(null, destinationPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
      },
    });
  }

  /**
   * Create file filter for event uploads
   */
  static getEventFileFilter() {
    return (req: any, file: Express.Multer.File, cb: any) => {
      const fieldName = file.fieldname;
      const mimeType = file.mimetype;

      // Check image files
      if (['images', 'floorPlan', 'eventStampImages', 'backgroundImage'].includes(fieldName)) {
        if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
          cb(null, true);
          return;
        }
        cb(new Error(`Invalid image file type. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`), false);
        return;
      }

      // Check document files
      if (fieldName === 'documents') {
        if (this.ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
          cb(null, true);
          return;
        }
        cb(new Error(`Invalid document file type. Allowed types: ${this.ALLOWED_DOCUMENT_TYPES.join(', ')}`), false);
        return;
      }

      // Unknown field name
      cb(new Error(`Unknown field name: ${fieldName}`), false);
    };
  }

  /**
   * Create file size limits configuration
   */
  static getFileSizeLimits(maxFileSize?: number) {
    return {
      fileSize: maxFileSize || this.DEFAULT_MAX_FILE_SIZE,
    };
  }

  /**
   * Create complete FileFieldsInterceptor configuration for events
   */
  static createEventFileInterceptor(options: FileUploadOptions = {}) {
    return FileFieldsInterceptor(
      this.getEventFileFields(options),
      {
        storage: this.getEventStorageConfig(),
        fileFilter: this.getEventFileFilter(),
        limits: this.getFileSizeLimits(options.maxFileSize),
      }
    );
  }

  /**
   * Process uploaded files and return file paths
   */
  static processEventFiles(files: FileUploadConfig): {
    images?: string[];
    documents?: string[];
    floorPlan?: string;
    eventStampImages?: string[];
    backgroundImage?: string;
  } {
    const result: any = {};

    if (files.images && files.images.length > 0) {
      result.images = files.images.map(file => `uploads/event/images/${file.filename}`);
    }

    if (files.documents && files.documents.length > 0) {
      result.documents = files.documents.map(file => `uploads/event/documents/${file.filename}`);
    }

    if (files.floorPlan && files.floorPlan.length > 0) {
      result.floorPlan = `uploads/event/floorPlan/${files.floorPlan[0].filename}`;
    }

    if (files.eventStampImages && files.eventStampImages.length > 0) {
      result.eventStampImages = files.eventStampImages.map(file => `uploads/eventStamps/images/${file.filename}`);
    }

    if (files.backgroundImage && files.backgroundImage.length > 0) {
      result.backgroundImage = `uploads/event/background/${files.backgroundImage[0].filename}`;
    }

    return result;
  }

  /**
   * Validate file types for a specific field
   */
  static validateFileType(fieldName: string, mimeType: string): boolean {
    if (['images', 'floorPlan', 'eventStampImages', 'backgroundImage'].includes(fieldName)) {
      return this.ALLOWED_IMAGE_TYPES.includes(mimeType);
    }
    
    if (fieldName === 'documents') {
      return this.ALLOWED_DOCUMENT_TYPES.includes(mimeType);
    }

    return false;
  }

  /**
   * Get allowed file types for a specific field
   */
  static getAllowedFileTypes(fieldName: string): string[] {
    if (['images', 'floorPlan', 'eventStampImages', 'backgroundImage'].includes(fieldName)) {
      return this.ALLOWED_IMAGE_TYPES;
    }
    
    if (fieldName === 'documents') {
      return this.ALLOWED_DOCUMENT_TYPES;
    }

    return [];
  }

  /**
   * Get upload directory for a specific field
   */
  static getUploadDirectory(fieldName: string): string {
    switch (fieldName) {
      case 'images':
        return './uploads/event/images';
      case 'documents':
        return './uploads/event/documents';
      case 'floorPlan':
        return './uploads/event/floorPlan';
      case 'eventStampImages':
        return './uploads/eventStamps/images';
      case 'backgroundImage':
        return './uploads/event/background';
      default:
        return './uploads/event/images';
    }
  }

  /**
   * Clean up uploaded files from filesystem if error occurs
   */
  static cleanupUploadedFiles(files: FileUploadConfig): void {
    const fs = require('fs');
    const path = require('path');

    try {
      if (files.images) {
        files.images.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', '..', 'uploads', 'event', 'images', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
           
          }
        });
      }

      if (files.documents) {
        files.documents.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', '..', 'uploads', 'event', 'documents', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          
          }
        });
      }

      if (files.floorPlan) {
        files.floorPlan.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', '..', 'uploads', 'event', 'floorPlan', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
         
          }
        });
      }

      if (files.eventStampImages) {
        files.eventStampImages.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', '..', 'uploads', 'eventStamps', 'images', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
         
          }
        });
      }

      if (files.backgroundImage) {
        files.backgroundImage.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', '..', 'uploads', 'event', 'background', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }
        });
      }
    } catch (cleanupError: any) {
      console.error('Error during file cleanup:', cleanupError);
      // Don't throw error during cleanup to avoid masking the original error
    }
  }

  /**
   * Validate uploaded files before processing to catch errors early
   */
  static validateUploadedFiles(files: FileUploadConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check if files exist and are valid
      if (files.images && files.images.length > 0) {
        files.images.forEach((file: any, index: number) => {
          if (!file || !file.filename || !file.mimetype) {
            errors.push(`Invalid image file at index ${index}`);
          }
        });
      }

      if (files.documents && files.documents.length > 0) {
        files.documents.forEach((file: any, index: number) => {
          if (!file || !file.filename || !file.mimetype) {
            errors.push(`Invalid document file at index ${index}`);
          }
        });
      }

      if (files.floorPlan && files.floorPlan.length > 0) {
        files.floorPlan.forEach((file: any, index: number) => {
          if (!file || !file.filename || !file.mimetype) {
            errors.push(`Invalid floor plan file at index ${index}`);
          }
        });
      }

      if (files.eventStampImages && files.eventStampImages.length > 0) {
        files.eventStampImages.forEach((file: any, index: number) => {
          if (!file || !file.filename || !file.mimetype) {
            errors.push(`Invalid event stamp image file at index ${index}`);
          }
        });
      }

      if (files.backgroundImage && files.backgroundImage.length > 0) {
        files.backgroundImage.forEach((file: any, index: number) => {
          if (!file || !file.filename || !file.mimetype) {
            errors.push(`Invalid background image file at index ${index}`);
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error: any) {
      errors.push(`File validation error: ${error.message}`);
      return {
        isValid: false,
        errors
      };
    }
  }

  /**
   * Process files with validation and error handling
   */
  static processFilesSafely(files: FileUploadConfig): {
    success: boolean;
    processedFiles?: any;
    errors?: string[];
  } {
    try {
      // First validate files
      const validation = this.validateUploadedFiles(files);
      if (!validation.isValid) {
        // Clean up invalid files immediately
        this.cleanupUploadedFiles(files);
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Process files
      const processedFiles = this.processEventFiles(files);
      
      return {
        success: true,
        processedFiles
      };
    } catch (error: any) {
      // Clean up files on any error
      this.cleanupUploadedFiles(files);
      return {
        success: false,
        errors: [`File processing error: ${error.message}`]
      };
    }
  }

  // ==================== ADVERT NOTIFICATION FILE UPLOAD METHODS ====================

  /**
   * Create file fields configuration for advert notification uploads
   */
  static getAdvertFileFields(options: FileUploadOptions = {}) {
    const { maxImageCount = 1 } = options;

    return [
      { name: 'advertImage', maxCount: maxImageCount }
    ];
  }

  /**
   * Create storage configuration for advert notification file uploads
   */
  static getAdvertStorageConfig() {
    return diskStorage({
      destination: (req, file, cb) => {
        const destinationPath = './uploads/advert-notifications';
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(destinationPath)) {
          fs.mkdirSync(destinationPath, { recursive: true });
        }
        
        cb(null, destinationPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
      },
    });
  }

  /**
   * Create file filter for advert notification uploads
   */
  static getAdvertFileFilter() {
    return (req: any, file: Express.Multer.File, cb: any) => {
      const mimeType = file.mimetype;

      // Check image files
      if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        cb(null, true);
        return;
      }
      
      cb(new Error(`Invalid image file type. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`), false);
    };
  }

  /**
   * Create complete FileFieldsInterceptor configuration for advert notifications
   */
  static createAdvertFileInterceptor(options: FileUploadOptions = {}) {
    return FileFieldsInterceptor(
      this.getAdvertFileFields(options),
      {
        storage: this.getAdvertStorageConfig(),
        fileFilter: this.getAdvertFileFilter(),
        limits: this.getFileSizeLimits(options.maxFileSize),
      }
    );
  }

  /**
   * Process uploaded advert files and return file paths
   */
  static processAdvertFiles(files: FileUploadConfig): {
    advertImage?: string;
  } {
    const result: any = {};

    if (files.advertImage && files.advertImage.length > 0) {
      result.advertImage = files.advertImage[0].path;
    }

    return result;
  }

  /**
   * Clean up uploaded advert files from filesystem if error occurs
   */
  static cleanupAdvertFiles(files: FileUploadConfig): void {
    const fs = require('fs');
    const path = require('path');

    try {
      if (files.advertImage) {
        files.advertImage.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', '..', 'uploads', 'advert-notifications', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          
          }
        });
      }
    } catch (cleanupError: any) {
      console.error('Error during advert file cleanup:', cleanupError);
      // Don't throw error during cleanup to avoid masking the original error
    }
  }

  /**
   * Validate uploaded advert files before processing to catch errors early
   */
  static validateAdvertFiles(files: FileUploadConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check if files exist and are valid
      if (files.advertImage && files.advertImage.length > 0) {
        files.advertImage.forEach((file: any, index: number) => {
          if (!file || !file.filename || !file.mimetype) {
            errors.push(`Invalid advert image file at index ${index}`);
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error: any) {
      errors.push(`Advert file validation error: ${error.message}`);
      return {
        isValid: false,
        errors
      };
    }
  }

  /**
   * Process advert files with validation and error handling
   */
  static processAdvertFilesSafely(files: FileUploadConfig): {
    success: boolean;
    processedFiles?: any;
    errors?: string[];
  } {
    try {
      // First validate files
      const validation = this.validateAdvertFiles(files);
      if (!validation.isValid) {
        // Clean up invalid files immediately
        this.cleanupAdvertFiles(files);
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Process files
      const processedFiles = this.processAdvertFiles(files);
      
      return {
        success: true,
        processedFiles
      };
    } catch (error: any) {
      // Clean up files on any error
      this.cleanupAdvertFiles(files);
      return {
        success: false,
        errors: [`Advert file processing error: ${error.message}`]
      };
    }
  }
}
