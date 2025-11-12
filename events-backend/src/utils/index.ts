// src/utils/index.ts
// Export all utility functions for cleaner imports

export { FirebaseUtil } from './firebase.util';


// Speaker time utilities
export { SpeakerTimeUtils } from './speaker-time.utils';
export type { SpeakerTimeValidation, EventTimeInfo } from './speaker-time.utils';

// Error handling utilities
export { ErrorHandlerService } from './services/error-handler.service';

// Email utilities
export { EmailUtils } from './email.utils';
export { EmailTemplateUtils } from './email-templates.utils';

// File upload utilities
export { FileUploadUtils, FileUploadConfig } from './filesUploadFormat/file-upload.utils';

// User utilities
export { UserUtils } from './user.utils';

// User deletion utilities
export {
  deleteUserRelatedData,
  deleteProfilePicture,
  UserDeletionOptions,
} from './user-deletion.utils';

// Exhibitor utilities
export { ExhibitorUtils } from './exhibitor.utils';

// Survey utilities
export { SurveyUtils } from './survey-utils';

// Event validation utilities
export { EventValidationUtils } from './validateEvents';

// Search utilities
export { EventQueryBuilderUtils, GlobalSearchUtils } from './searchEvent';

// Custom exceptions
export {
  ResourceNotFoundException,
  DuplicateResourceException,
  ValidationException,
  ForeignKeyConstraintException,
} from './exceptions/custom-exceptions';

// Interfaces
export type { SuccessResponse } from './interfaces/error-response.interface';

export * from './firebase.util';

