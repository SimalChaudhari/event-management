import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    
    if (errors.length > 0) {
      // Get only the first error message
      const firstError = errors[0];
      
      if (firstError.constraints && Object.keys(firstError.constraints).length > 0) {
        const firstConstraintKey = Object.keys(firstError.constraints)[0];
        const errorMessage = firstError.constraints[firstConstraintKey];
        
        throw new BadRequestException({
          success: false,
          message: errorMessage,
          field: firstError.property,
        });
      } else {
        // Fallback if no constraints are available
        throw new BadRequestException({
          success: false,
          message: `Validation failed for field: ${firstError.property}`,
          field: firstError.property,
        });
      }
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
} 