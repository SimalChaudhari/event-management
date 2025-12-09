import * as fs from 'fs';
import path from 'path';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import { ExhibitorDto } from '../exhibitor/exhibitor.dto';
import { ErrorHandlerService } from './services/error-handler.service';

export interface ExhibitorFileUploadConfig {
  flyers?: Express.Multer.File[];
  documents?: Express.Multer.File[];
  eventImages?: Express.Multer.File[];
  logo?: Express.Multer.File[];
  boothBanner?: Express.Multer.File[];
}

export interface ExhibitorFileUploadOptions {
  maxFlyerCount?: number;
  maxDocumentCount?: number;
  maxEventImageCount?: number;
  maxLogoCount?: number;
  maxBoothBannerCount?: number;
  maxFileSize?: number; // in bytes
}

export class ExhibitorFileUtils {
  private static readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (for documents)
  private static readonly MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB for images
  private static readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
  ];
  private static readonly ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
  private static readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ];

  /**
   * Create file fields configuration for exhibitor uploads
   */
  static getExhibitorFileFields(options: ExhibitorFileUploadOptions = {}) {
    const {
      maxFlyerCount = 10,
      maxDocumentCount = 5,
      maxEventImageCount = 10,
      maxLogoCount = 1,
      maxBoothBannerCount = 20, // Allow multiple images, videos, etc.
    } = options;

    return [
      { name: 'flyers', maxCount: maxFlyerCount },
      { name: 'documents', maxCount: maxDocumentCount },
      { name: 'eventImages', maxCount: maxEventImageCount },
      { name: 'logo', maxCount: maxLogoCount },
      { name: 'boothBanner', maxCount: maxBoothBannerCount },
    ];
  }

  /**
   * Create storage configuration for exhibitor file uploads
   */
  static getExhibitorStorageConfig() {
    return diskStorage({
      destination: (req, file, cb) => {
        const fieldName = file.fieldname;
        let destinationPath = '';

        switch (fieldName) {
          case 'flyers':
            destinationPath = './uploads/exhibitor/flyers';
            break;
          case 'documents':
            destinationPath = './uploads/exhibitor/documents';
            break;
          case 'eventImages':
            destinationPath = './uploads/exhibitor/eventImages';
            break;
          case 'logo':
            destinationPath = './uploads/exhibitor/logos';
            break;
          case 'boothBanner':
            destinationPath = './uploads/exhibitor/boothBanner';
            break;
          default:
            destinationPath = './uploads/exhibitor/flyers'; // Default fallback
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
   * Create file filter for exhibitor uploads with size validation
   */
  static getExhibitorFileFilter() {
    return (req: any, file: Express.Multer.File, cb: any) => {
      const fieldName = file.fieldname;
      const mimeType = file.mimetype;
      const fileSize = (req as any).file?.size || file.size || 0;

      // Check image files (flyers, eventImages, logo)
      if (['flyers', 'eventImages', 'logo'].includes(fieldName)) {
        if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
          // Check file size for images (50MB max)
          if (fileSize > this.MAX_IMAGE_SIZE) {
            cb(
              new Error(
                `Image file size exceeds maximum allowed size of ${this.MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
              ),
              false,
            );
            return;
          }
          cb(null, true);
          return;
        }
        cb(
          new Error(
            `Invalid image file type. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
          ),
          false,
        );
        return;
      }

      // Check booth banner files (images and videos)
      if (fieldName === 'boothBanner') {
        if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
          // Check file size for images (50MB max)
          if (fileSize > this.MAX_IMAGE_SIZE) {
            cb(
              new Error(
                `Banner image file size exceeds maximum allowed size of ${this.MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
              ),
              false,
            );
            return;
          }
          cb(null, true);
          return;
        }
        if (this.ALLOWED_VIDEO_TYPES.includes(mimeType)) {
          // Check file size for videos (100MB max)
          if (fileSize > this.MAX_VIDEO_SIZE) {
            cb(
              new Error(
                `Banner video file size exceeds maximum allowed size of ${this.MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
              ),
              false,
            );
            return;
          }
          cb(null, true);
          return;
        }
        cb(
          new Error(
            `Invalid booth banner file type. Allowed types: images (${this.ALLOWED_IMAGE_TYPES.join(', ')}) or videos (${this.ALLOWED_VIDEO_TYPES.join(', ')})`,
          ),
          false,
        );
        return;
      }

      // Check document files
      if (fieldName === 'documents') {
        if (this.ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
          cb(null, true);
          return;
        }
        cb(
          new Error(
            `Invalid document file type. Allowed types: ${this.ALLOWED_DOCUMENT_TYPES.join(', ')}`,
          ),
          false,
        );
        return;
      }

      // Unknown field name
      cb(new Error(`Unknown field name: ${fieldName}`), false);
    };
  }

  /**
   * Create file size limits configuration
   * Uses different limits based on file type (handled in fileFilter)
   */
  static getExhibitorFileSizeLimits(maxFileSize?: number) {
    // Use the maximum of all limits to allow all file types
    // Individual file type limits are enforced in fileFilter
    return {
      fileSize: maxFileSize || Math.max(this.MAX_IMAGE_SIZE, this.MAX_VIDEO_SIZE, this.DEFAULT_MAX_FILE_SIZE),
    };
  }

  /**
   * Create complete FileFieldsInterceptor configuration for exhibitors
   */
  static createExhibitorFileInterceptor(
    options: ExhibitorFileUploadOptions = {},
  ) {
    return FileFieldsInterceptor(this.getExhibitorFileFields(options), {
      storage: this.getExhibitorStorageConfig(),
      fileFilter: this.getExhibitorFileFilter(),
      limits: this.getExhibitorFileSizeLimits(options.maxFileSize),
    });
  }

  /**
   * Process uploaded files and return file paths with names
   */
  static processExhibitorFiles(
    files: ExhibitorFileUploadConfig,
    names?: {
      flyerNames?: string;
      documentNames?: string;
      eventImageNames?: string;
    },
  ): {
    flyers?: Array<{ name: string; flyer: string }>;
    documents?: Array<{ name: string; document: string }>;
    eventImages?: Array<{ name: string; eventImage: string }>;
    logo?: string;
    boothBanner?: string[];
  } {
    const result: any = {};

    // Process logo
    if (files.logo && files.logo.length > 0) {
      result.logo = `uploads/exhibitor/logos/${files.logo[0].filename}`;
    }

    // Process flyers
    if (files.flyers && files.flyers.length > 0) {
      const flyerNames = names?.flyerNames
        ? names.flyerNames
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean)
        : [];

      result.flyers = files.flyers.map((file, index) => ({
        name: flyerNames[index] ?? `Flyer ${index + 1}`,
        flyer: `uploads/exhibitor/flyers/${file.filename}`,
      }));
    }

    // Process documents
    if (files.documents && files.documents.length > 0) {
      const documentNames = names?.documentNames
        ? names.documentNames
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean)
        : [];

      result.documents = files.documents.map((file, index) => ({
        name: documentNames[index] ?? `Document ${index + 1}`,
        document: `uploads/exhibitor/documents/${file.filename}`,
      }));
    }

    // Process event images
    if (files.eventImages && files.eventImages.length > 0) {
      const eventImageNames = names?.eventImageNames
        ? names.eventImageNames
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean)
        : [];

      result.eventImages = files.eventImages.map((file, index) => ({
        name: eventImageNames[index] ?? `Event Image ${index + 1}`,
        eventImage: `uploads/exhibitor/eventImages/${file.filename}`,
      }));
    }

    // Process booth banner files (images and videos)
    // IDs will be generated by database when saved to booth_banners table
    if (files.boothBanner && files.boothBanner.length > 0) {
      result.boothBanner = files.boothBanner.map((file) => {
        return {
          value: `uploads/exhibitor/boothBanner/${file.filename}`
        };
      });
    }

    return result;
  }

  /**
   * Validate file types for a specific field
   */
  static validateExhibitorFileType(
    fieldName: string,
    mimeType: string,
  ): boolean {
    if (['flyers', 'eventImages', 'logo'].includes(fieldName)) {
      return this.ALLOWED_IMAGE_TYPES.includes(mimeType);
    }

    if (fieldName === 'documents') {
      return this.ALLOWED_DOCUMENT_TYPES.includes(mimeType);
    }

    if (fieldName === 'boothBanner') {
      return this.ALLOWED_IMAGE_TYPES.includes(mimeType) || this.ALLOWED_VIDEO_TYPES.includes(mimeType);
    }

    return false;
  }

  /**
   * Get allowed file types for a specific field
   */
  static getAllowedExhibitorFileTypes(fieldName: string): string[] {
    if (['flyers', 'eventImages', 'logo'].includes(fieldName)) {
      return this.ALLOWED_IMAGE_TYPES;
    }

    if (fieldName === 'documents') {
      return this.ALLOWED_DOCUMENT_TYPES;
    }

    if (fieldName === 'boothBanner') {
      return [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_VIDEO_TYPES];
    }

    return [];
  }

  /**
   * Get upload directory for a specific field
   */
  static getExhibitorUploadDirectory(fieldName: string): string {
    switch (fieldName) {
      case 'flyers':
        return './uploads/exhibitor/flyers';
      case 'documents':
        return './uploads/exhibitor/documents';
      case 'eventImages':
        return './uploads/exhibitor/eventImages';
      case 'logo':
        return './uploads/exhibitor/logos';
      case 'boothBanner':
        return './uploads/exhibitor/boothBanner';
      default:
        return './uploads/exhibitor/flyers';
    }
  }

  /**
   * Clean up uploaded files from filesystem if error occurs
   */
  static cleanupUploadedFiles(files: ExhibitorFileUploadConfig): void {
    try {
      if (files.flyers) {
        files.flyers.forEach((file: any) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'exhibitor',
            'flyers',
            file.filename,
          );
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          
          }
        });
      }

      if (files.documents) {
        files.documents.forEach((file: any) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'exhibitor',
            'documents',
            file.filename,
          );
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
        
          }
        });
      }

      if (files.eventImages) {
        files.eventImages.forEach((file: any) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'exhibitor',
            'eventImages',
            file.filename,
          );
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
           
          }
        });
      }

      if (files.logo) {
        files.logo.forEach((file: any) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'exhibitor',
            'logos',
            file.filename,
          );
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
  static validateUploadedFiles(files: ExhibitorFileUploadConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // Check if files exist and are valid
      if (files.flyers && files.flyers.length > 0) {
        files.flyers.forEach((file: any, index: number) => {
          if (!file || !file.filename || !file.mimetype) {
            errors.push(`Invalid flyer file at index ${index}`);
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

      if (files.eventImages && files.eventImages.length > 0) {
        files.eventImages.forEach((file: any, index: number) => {
          if (!file || !file.filename || !file.mimetype) {
            errors.push(`Invalid event image file at index ${index}`);
          }
        });
      }

      if (files.logo && files.logo.length > 0) {
        files.logo.forEach((file: any, index: number) => {
          if (!file || !file.filename || !file.mimetype) {
            errors.push(`Invalid logo file at index ${index}`);
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      errors.push(`File validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
      };
    }
  }

  /**
   * Process files with validation and error handling
   */
  static processFilesSafely(
    files: ExhibitorFileUploadConfig,
    names?: {
      flyerNames?: string;
      documentNames?: string;
      eventImageNames?: string;
    },
    existingBoothBanner?: string[], // Existing booth banner items to merge with new uploads
  ): {
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
          errors: validation.errors,
        };
      }

      // Process files
      const processedFiles = this.processExhibitorFiles(files, names);

      // Merge new booth banner files with existing ones if provided
      if (processedFiles.boothBanner && existingBoothBanner && Array.isArray(existingBoothBanner)) {
        processedFiles.boothBanner = [...existingBoothBanner, ...processedFiles.boothBanner];
      }

      return {
        success: true,
        processedFiles,
      };
    } catch (error: any) {
      // Clean up files on any error
      this.cleanupUploadedFiles(files);
      return {
        success: false,
        errors: [`File processing error: ${error.message}`],
      };
    }
  }

  /**
   * Clean up removed files during exhibitor update
   */
  static async cleanupRemovedFiles(
    existingExhibitor: Exhibitor,
    newData: Partial<ExhibitorDto>,
    errorHandler: ErrorHandlerService,
  ): Promise<void> {
    try {
      // Clean up flyers
      if (newData.flyers && existingExhibitor.flyers) {
        this.cleanupRemovedFlyers(existingExhibitor.flyers, newData.flyers);
      }

      // Clean up documents
      if (newData.documents && existingExhibitor.documents) {
        this.cleanupRemovedDocuments(
          existingExhibitor.documents,
          newData.documents,
        );
      }

      // Clean up event images
      if (newData.eventImages && existingExhibitor.eventImages) {
        this.cleanupRemovedEventImages(
          existingExhibitor.eventImages,
          newData.eventImages,
        );
      }

      // Clean up booth banner files (only deletes files, not URLs)
      // Now using separate booth_banners table
      if (newData.boothBanner && existingExhibitor.boothBanners) {
        // Get existing banners as array of values
        const existingBannerValues = existingExhibitor.boothBanners.map(bb => bb.banner);
        const newBannerValues = newData.boothBanner.map((b: any) => b.value || b);
        
        this.cleanupRemovedBoothBanner(
          existingBannerValues,
          newBannerValues,
        );
      }

      // Clean up logo if changed
      if (
        newData.logo &&
        existingExhibitor.logo &&
        newData.logo !== existingExhibitor.logo
      ) {
        const oldLogoPath = path.resolve(existingExhibitor.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
    } catch (error) {
      errorHandler.logError(
        error,
        'File cleanup during update',
        existingExhibitor.id,
      );
    }
  }

  /**
   * Clean up removed flyer files
   */
  private static cleanupRemovedFlyers(
    oldFlyers: any[],
    newFlyers: any[],
  ): void {
    if (!oldFlyers || !newFlyers) return;

    const oldPaths = oldFlyers.map((f) => f.flyer || f);
    const newPaths = newFlyers.map((f) => f.flyer || f);

    // Find files that exist in old but not in new
    const filesToDelete = oldPaths.filter(
      (oldPath) => !newPaths.includes(oldPath),
    );

    // Delete the removed files
    filesToDelete.forEach((filePath) => {
      try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error(`Failed to delete flyer file: ${filePath}`, error);
      }
    });
  }

  /**
   * Clean up removed document files
   */
  private static cleanupRemovedDocuments(oldDocs: any[], newDocs: any[]): void {
    if (!oldDocs || !newDocs) return;

    const oldPaths = oldDocs.map((d) => d.document || d);
    const newPaths = newDocs.map((d) => d.document || d);

    // Find files that exist in old but not in new
    const filesToDelete = oldPaths.filter(
      (oldPath) => !newPaths.includes(oldPath),
    );

    // Delete the removed files
    filesToDelete.forEach((filePath) => {
      try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error(`Failed to delete document file: ${filePath}`, error);
      }
    });
  }

  /**
   * Clean up removed event image files
   */
  private static cleanupRemovedEventImages(
    oldImages: any[],
    newImages: any[],
  ): void {
    if (!oldImages || !newImages) return;

    const oldPaths = oldImages.map((img) => img.eventImage || img);
    const newPaths = newImages.map((img) => img.eventImage || img);

    // Find files that exist in old but not in new
    const filesToDelete = oldPaths.filter(
      (oldPath) => !newPaths.includes(oldPath),
    );

    // Delete the removed files
    filesToDelete.forEach((filePath) => {
      try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error(`Failed to delete event image file: ${filePath}`, error);
      }
    });
  }

  /**
   * Clean up removed booth banner files
   * Only deletes files (not URLs) that are removed from the array
   */
  private static cleanupRemovedBoothBanner(
    oldBanner: string[],
    newBanner: string[],
  ): void {
    if (!oldBanner || !newBanner) return;

    // Only process file paths (those starting with 'uploads/'), not URLs
    const oldFilePaths = oldBanner.filter((item) => item && item.startsWith('uploads/'));
    const newFilePaths = newBanner.filter((item) => item && item.startsWith('uploads/'));

    // Find files that exist in old but not in new
    const filesToDelete = oldFilePaths.filter(
      (oldPath) => !newFilePaths.includes(oldPath),
    );

    // Delete the removed files
    filesToDelete.forEach((filePath) => {
      try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error(`Failed to delete booth banner file: ${filePath}`, error);
      }
    });
  }

  /**
   * Delete all exhibitor files
   */
  static deleteExhibitorFiles(
    exhibitor: Exhibitor,
    errorHandler: ErrorHandlerService,
  ): void {
    try {
      // Delete logo if it exists
      if (exhibitor.logo) {
        const logoPath = path.resolve(exhibitor.logo);
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
      }

      // Delete flyers if they exist
      if (exhibitor.flyers && exhibitor.flyers.length > 0) {
        exhibitor.flyers.forEach((flyer) => {
          const filePath = path.resolve(flyer.flyer);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Delete documents if they exist
      if (exhibitor.documents && exhibitor.documents.length > 0) {
        exhibitor.documents.forEach((doc) => {
          const filePath = path.resolve(doc.document);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Delete event images if they exist
      if (exhibitor.eventImages && exhibitor.eventImages.length > 0) {
        exhibitor.eventImages.forEach((image) => {
          const filePath = path.resolve(image.eventImage);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Delete booth banner files if they exist (only files, not URLs)
      // Now using separate booth_banners table
      if (exhibitor.boothBanners && exhibitor.boothBanners.length > 0) {
        exhibitor.boothBanners.forEach((banner) => {
          // Only delete if it's a file path (starts with 'uploads/'), not a URL
          if (banner.banner && banner.banner.startsWith('uploads/')) {
            const filePath = path.resolve(banner.banner);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
      }
    } catch (fileError) {
      errorHandler.logError(fileError, 'Exhibitor file deletion', exhibitor.id);
      // Continue with exhibitor deletion even if file deletion fails
    }
  }
}
