import { Injectable, Logger } from '@nestjs/common';
import { ValidationException, ResourceNotFoundException, DuplicateResourceException, ForeignKeyConstraintException, DatabaseConstraintException } from '../exceptions/custom-exceptions';

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  /**
   * Handle database errors and convert them to appropriate exceptions
   */
  handleDatabaseError(error: any, context: string): never {
    this.logger.error(`Database error in ${context}:`, error);

    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      const match = error.message.match(/Duplicate entry '(.+)' for key '(.+)'/);
      if (match) {
        const value = match[1];
        const field = match[2].split('.')[1] || 'unknown';
        throw new DuplicateResourceException(context, field, value);
      }
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ResourceNotFoundException('Referenced resource');
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new ValidationException('Cannot delete this resource as it is being used by other records');
    }

    // Handle PostgreSQL foreign key constraint violations
    if (error.code === '23503') {
      const constraintMatch = error.message.match(/violates foreign key constraint "(.+)" on table "(.+)"/);
      if (constraintMatch) {
        const constraintName = constraintMatch[1];
        const tableName = constraintMatch[2];
        
        // Map constraint names to user-friendly messages
        const constraintMessages = {
          'FK_855886461e5c629664994a11d72': {
            resource: 'Category',
            relatedResource: 'Event',
            action: 'delete'
          },
          'FK_events_category': {
            resource: 'Category',
            relatedResource: 'Event',
            action: 'delete'
          },
          'FK_events_speaker': {
            resource: 'Speaker',
            relatedResource: 'Event',
            action: 'delete'
          },
          'FK_events_exhibitor': {
            resource: 'Exhibitor',
            relatedResource: 'Event',
            action: 'delete'
          },
          'FK_carts_event': {
            resource: 'Event',
            relatedResource: 'Cart',
            action: 'delete'
          },
          'FK_orders_event': {
            resource: 'Event',
            relatedResource: 'Order',
            action: 'delete'
          },
          'FK_favorites_event': {
            resource: 'Event',
            relatedResource: 'Favorite',
            action: 'delete'
          },
          'FK_feedback_event': {
            resource: 'Event',
            relatedResource: 'Feedback',
            action: 'delete'
          },
          'FK_gallery_event': {
            resource: 'Event',
            relatedResource: 'Gallery',
            action: 'delete'
          },
          'FK_register_event': {
            resource: 'Event',
            relatedResource: 'Registration',
            action: 'delete'
          }
        };

        const constraintInfo = constraintMessages[constraintName as keyof typeof constraintMessages] || {
          resource: 'Resource',
          relatedResource: 'Related Resource',
          action: 'delete'
        };

        throw new ForeignKeyConstraintException(
          constraintInfo.resource,
          constraintInfo.relatedResource,
          1, // We'll get actual count in the service
          constraintInfo.action
        );
      }
    }

    // Handle PostgreSQL unique constraint violations
    if (error.code === '23505') {
      const match = error.message.match(/duplicate key value violates unique constraint "(.+)"/);
      if (match) {
        const constraintName = match[1];
        throw new DuplicateResourceException('Resource', 'field', 'value');
      }
    }

    // Handle PostgreSQL check constraint violations
    if (error.code === '23514') {
      throw new ValidationException('Data validation failed');
    }

    // Generic database error
    throw new DatabaseConstraintException(
      'Database operation failed',
      'UNKNOWN',
      { originalError: error.message }
    );
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors: any[], context: string): never {
    const formattedErrors = errors.map(error => ({
      field: error.property,
      message: Object.values(error.constraints || {}).join(', '),
      value: error.value,
    }));

    throw new ValidationException(
      `Validation failed for ${context}`,
      formattedErrors
    );
  }

  /**
   * Handle file upload errors
   */
  handleFileUploadError(error: any, context: string): never {
    this.logger.error(`File upload error in ${context}:`, error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      throw new ValidationException('File size exceeds the maximum limit');
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      throw new ValidationException('Too many files uploaded');
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      throw new ValidationException('Unexpected file field');
    }

    throw new ValidationException('File upload failed');
  }

  /**
   * Handle external API errors
   */
  handleExternalApiError(error: any, service: string): never {
    this.logger.error(`External API error from ${service}:`, error);

    if (error.response?.status === 401) {
      throw new ValidationException(`${service} authentication failed`);
    }

    if (error.response?.status === 404) {
      throw new ResourceNotFoundException(`${service} resource`);
    }

    throw new ValidationException(`${service} service is temporarily unavailable`);
  }

  /**
   * Log error with context
   */
  logError(error: any, context: string, userId?: string) {
    this.logger.error(`Error in ${context}:`, {
      error: error.message,
      stack: error.stack,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get related data count for foreign key constraint errors
   */
  async getRelatedDataCount(repository: any, whereClause: any, context: string): Promise<number> {
    try {
      return await repository.count({ where: whereClause });
    } catch (error) {
      this.logger.error(`Error getting related data count for ${context}:`, error);
      return 0;
    }
  }
} 