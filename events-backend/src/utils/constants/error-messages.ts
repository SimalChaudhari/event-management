export const ERROR_MESSAGES = {
  // Database errors
  DATABASE_CONNECTION: 'Database connection failed',
  DATABASE_QUERY: 'Database query failed',
  
  // Validation errors
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PHONE: 'Please provide a valid phone number',
  INVALID_DATE: 'Please provide a valid date',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Authentication token has expired',
  TOKEN_INVALID: 'Invalid authentication token',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'The requested resource was not found',
  RESOURCE_ALREADY_EXISTS: 'This resource already exists',
  RESOURCE_IN_USE: 'This resource is currently in use and cannot be deleted',
  
  // Business logic errors
  EVENT_CONFLICT: 'Another event is already scheduled at this location during these dates',
  INVALID_DATE_RANGE: 'End date must be after start date',
  PAST_DATE_NOT_ALLOWED: 'Cannot create events in the past',
  
  // External service errors
  EXTERNAL_SERVICE_UNAVAILABLE: 'External service is temporarily unavailable',
  PAYMENT_FAILED: 'Payment processing failed',
  EMAIL_SEND_FAILED: 'Failed to send email',
  
  // Generic errors
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  NETWORK_ERROR: 'Network connection issue. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
};

export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Resource retrieved successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET: 'Password reset email sent',
  EMAIL_VERIFIED: 'Email verified successfully',
}; 