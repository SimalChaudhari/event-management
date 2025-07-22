import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(message: string, errors?: any[]) {
    super(
      {
        message,
        errors,
        error: 'ValidationError',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;

    super(
      {
        message,
        error: 'NotFound',
        resource,
        id,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field: string, value: string) {
    super(
      {
        message: `${resource} with ${field} '${value}' already exists`,
        error: 'Conflict',
        resource,
        field,
        value,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InsufficientPermissionsException extends HttpException {
  constructor(action: string, resource: string) {
    super(
      {
        message: `Insufficient permissions to ${action} ${resource}`,
        error: 'Forbidden',
        action,
        resource,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class BusinessLogicException extends HttpException {
  constructor(message: string, code?: string) {
    super(
      {
        message,
        error: 'BusinessLogicError',
        code,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ForeignKeyConstraintException extends HttpException {
  constructor(
    resource: string,
    relatedResource: string,
    relatedCount: number,
    action: string = 'delete',
  ) {
    const message = `Please remove all ${relatedResource} links before deleting this resource.`;

    super(
      {
        message,
        error: 'ForeignKeyConstraint',
        resource,
        relatedResource,
        relatedCount,
        action,
        details: {
          resource,
          relatedResource,
          relatedCount,
          action,
          suggestion: `First remove all ${relatedResource} connections, then try to ${action} the ${resource}.`,
        },
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class DatabaseConstraintException extends HttpException {
  constructor(message: string, constraintType: string, details?: any) {
    super(
      {
        message,
        error: 'DatabaseConstraint',
        constraintType,
        details,
      },
      HttpStatus.CONFLICT,
    );
  }
}
