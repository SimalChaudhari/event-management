import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface FileUploadConfig {
  images?: Express.Multer.File[];
  documents?: Express.Multer.File[];
  floorPlan?: Express.Multer.File[];
  eventStampImages?: Express.Multer.File[];
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
      { name: 'eventStampImages', maxCount: maxEventStampImageCount }
    ];
  }

  /**
   * Create storage configuration for event file uploads
   */
  static getEventStorageConfig() {
    return diskStorage({
      destination: (req, file, cb) => {
        const fieldName = file.fieldname;
        
        switch (fieldName) {
          case 'images':
            cb(null, './uploads/event/images');
            break;
          case 'documents':
            cb(null, './uploads/event/documents');
            break;
          case 'floorPlan':
            cb(null, './uploads/event/floorPlan');
            break;
          case 'eventStampImages':
            cb(null, './uploads/eventStamps/images');
            break;
          default:
            cb(null, './uploads/event/images'); // Default fallback
        }
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
      if (['images', 'floorPlan', 'eventStampImages'].includes(fieldName)) {
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
  } {
    const result: any = {};

    if (files.images && files.images.length > 0) {
      result.images = files.images.map(file => file.path);
    }

    if (files.documents && files.documents.length > 0) {
      result.documents = files.documents.map(file => file.path);
    }

    if (files.floorPlan && files.floorPlan.length > 0) {
      result.floorPlan = files.floorPlan[0].path;
    }

    if (files.eventStampImages && files.eventStampImages.length > 0) {
      result.eventStampImages = files.eventStampImages.map(file => file.path);
    }

    return result;
  }

  /**
   * Validate file types for a specific field
   */
  static validateFileType(fieldName: string, mimeType: string): boolean {
    if (['images', 'floorPlan', 'eventStampImages'].includes(fieldName)) {
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
    if (['images', 'floorPlan', 'eventStampImages'].includes(fieldName)) {
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
            console.log(`Cleaned up image: ${uploadedPath}`);
          }
        });
      }

      if (files.documents) {
        files.documents.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', '..', 'uploads', 'event', 'documents', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
            console.log(`Cleaned up document: ${uploadedPath}`);
          }
        });
      }

      if (files.floorPlan) {
        files.floorPlan.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', '..', 'uploads', 'event', 'floorPlan', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
            console.log(`Cleaned up floor plan: ${uploadedPath}`);
          }
        });
      }

      if (files.eventStampImages) {
        files.eventStampImages.forEach((file: any) => {
          const uploadedPath = path.join(__dirname, '..', '..', '..', 'uploads', 'eventStamps', 'images', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
            console.log(`Cleaned up event stamp image: ${uploadedPath}`);
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
}
