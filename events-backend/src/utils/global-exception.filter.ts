import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code and message
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorType = 'InternalServerError';
    let details = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        details = responseObj.errors || responseObj.details || null;
      }
      
      // Map status codes to error types
      switch (status) {
        case HttpStatus.BAD_REQUEST:
          errorType = 'BadRequest';
          break;
        case HttpStatus.UNAUTHORIZED:
          errorType = 'Unauthorized';
          break;
        case HttpStatus.FORBIDDEN:
          errorType = 'Forbidden';
          break;
        case HttpStatus.NOT_FOUND:
          errorType = 'NotFound';
          break;
        case HttpStatus.CONFLICT:
          errorType = 'Conflict';
          break;
        case HttpStatus.UNPROCESSABLE_ENTITY:
          errorType = 'ValidationError';
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    // Log the error with context
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        userId: (request as any).user?.id || 'anonymous',
      }
    );

    // Send consistent error response
    const errorResponse = {
      success: false,
      message: message,
      error: {
        type: errorType,
        code: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
      ...(details && { details }),
    };

    response.status(status).json(errorResponse);
  }
} 