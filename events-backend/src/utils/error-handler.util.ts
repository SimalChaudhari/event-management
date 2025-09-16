import { 
  BadRequestException,        // 400
  UnauthorizedException,      // 401
  ForbiddenException,         // 403
  NotFoundException,          // 404
  MethodNotAllowedException,  // 405
  NotAcceptableException,     // 406
  ConflictException,          // 409
  GoneException,              // 410
  UnprocessableEntityException, // 422
  InternalServerErrorException, // 500
  NotImplementedException,    // 501
  BadGatewayException,        // 502
  ServiceUnavailableException, // 503
  GatewayTimeoutException,    // 504
  HttpException
} from '@nestjs/common';

export class ErrorHandlerUtil {
  static handleError(error: any, customMessage?: string, statusCode?: number): never {
    // Log the actual error details for debugging
    console.error('🔍 Actual Error Details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      driverError: error.driverError,
      query: error.query,
      parameters: error.parameters
    });

    // If it's already a NestJS HTTP exception, re-throw it
    if (error instanceof HttpException) {
      throw error;
    }

    // Handle specific error types with proper status codes
    if (error.code === '23505') { // Unique constraint violation
      throw new ConflictException(customMessage || 'Resource already exists'); // 409
    }
    
    if (error.code === '23503') { // Foreign key constraint violation
      throw new BadRequestException(customMessage || 'Invalid reference to related resource'); // 400
    }
    
    if (error.code === '23502') { // Not null constraint violation
      throw new BadRequestException(customMessage || 'Required field is missing'); // 400
    }

    if (error.code === '23514') { // Check constraint violation
      throw new BadRequestException(customMessage || 'Data validation failed'); // 400
    }

    if (error.code === '42P01') { // Undefined table
      throw new InternalServerErrorException(customMessage || `Database table not found: ${error.message}`); // 500
    }

    if (error.code === '42P07') { // Duplicate table
      throw new ConflictException(customMessage || 'Table already exists'); // 409
    }

    // Handle authentication errors
    if (error.message?.includes('jwt') || error.message?.includes('token') || error.message?.includes('unauthorized')) {
      throw new UnauthorizedException(customMessage || 'Authentication required'); // 401
    }

    // Handle permission errors
    if (error.message?.includes('permission') || error.message?.includes('forbidden') || error.message?.includes('access denied')) {
      throw new ForbiddenException(customMessage || 'Access denied'); // 403
    }

    // Handle not found errors
    if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
      throw new NotFoundException(customMessage || 'Resource not found'); // 404
    }

    // Handle validation errors
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      throw new UnprocessableEntityException(customMessage || 'Validation failed'); // 422
    }

    // Handle type errors
    if (error.name === 'TypeError') {
      throw new BadRequestException(customMessage || 'Invalid data type'); // 400
    }

    // Handle reference errors
    if (error.name === 'ReferenceError') {
      throw new BadRequestException(customMessage || 'Reference error'); // 400
    }

    // Handle timeout errors
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      throw new GatewayTimeoutException(customMessage || 'Request timeout'); // 504
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new ServiceUnavailableException(customMessage || 'Service unavailable'); // 503
    }

    // Handle rate limiting
    if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
      throw new HttpException(customMessage || 'Too many requests', 429); // 429
    }

    // Handle custom status code if provided
    if (statusCode) {
      const errorMessage = customMessage || error.message || 'An error occurred';
      throw new HttpException(errorMessage, statusCode);
    }

    // Default to Internal Server Error for unknown errors
    const errorMessage = customMessage || `Error: ${error.message} (Code: ${error.code || 'UNKNOWN'})` || 'Internal server error';
    throw new InternalServerErrorException(errorMessage); // 500
  }
}