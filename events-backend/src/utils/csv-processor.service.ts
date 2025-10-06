import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { csvUploadConfig, CsvUploadConfig } from './csv-upload.config';
import { CsvUserDto } from '../validation/auth.validation';

export interface CsvProcessingResult {
  success: boolean;
  data: CsvUserDto[];
  errors: string[];
  warnings: string[];
  statistics: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    skippedRows: number;
    processingTimeMs: number;
  };
}

export interface CsvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldMappings: { [key: string]: string };
}

@Injectable()
export class CsvProcessorService {
  private readonly config: CsvUploadConfig;

  constructor() {
    this.config = csvUploadConfig.getConfig();
  }

  /**
   * Process CSV file with professional validation and error handling
   */
  async processCsvFile(filePath: string): Promise<CsvProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Read and parse CSV file
      const csvContent = await this.readCsvFile(filePath);
      const lines = this.parseCsvLines(csvContent);
      
      if (lines.length < 2) {
        throw new BadRequestException('CSV file must contain at least a header row and one data row');
      }

      // Validate headers
      const headerValidation = this.validateHeaders(lines[0]);
      if (!headerValidation.isValid) {
        throw new BadRequestException(`Invalid CSV headers: ${headerValidation.errors.join(', ')}`);
      }

      // Process data rows
      const processingResult = await this.processDataRows(lines, headerValidation.fieldMappings);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: processingResult.validData,
        errors: processingResult.errors,
        warnings: processingResult.warnings,
        statistics: {
          totalRows: lines.length - 1, // Exclude header
          validRows: processingResult.validData.length,
          invalidRows: processingResult.errors.length,
          skippedRows: processingResult.warnings.length,
          processingTimeMs: processingTime
        }
      };

    } catch (error: any) {
      console.error('❌ CSV processing failed:', error);
      throw error;
    }
  }

  /**
   * Validate CSV content structure
   */
  async validateCsvContent(csvContent: string): Promise<CsvValidationResult> {
    try {
      const lines = this.parseCsvLines(csvContent);
      
      if (lines.length < 2) {
        return {
          isValid: false,
          errors: ['CSV must contain at least a header row and one data row'],
          warnings: [],
          fieldMappings: {}
        };
      }

      // Validate headers
      const headerValidation = this.validateHeaders(lines[0]);
      
      // Validate data rows
      const dataErrors: string[] = [];
      const dataWarnings: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const rowValidation = this.validateDataRow(lines[i], headerValidation.fieldMappings, i + 1);
        dataErrors.push(...rowValidation.errors);
        dataWarnings.push(...rowValidation.warnings);
      }

      return {
        isValid: headerValidation.isValid && dataErrors.length === 0,
        errors: [...headerValidation.errors, ...dataErrors],
        warnings: [...headerValidation.warnings, ...dataWarnings],
        fieldMappings: headerValidation.fieldMappings
      };

    } catch (error: any) {
      return {
        isValid: false,
        errors: [`CSV validation failed: ${error.message}`],
        warnings: [],
        fieldMappings: {}
      };
    }
  }

  /**
   * Read CSV file from filesystem
   */
  private async readCsvFile(filePath: string): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException(`CSV file not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (!content || content.trim().length === 0) {
        throw new BadRequestException('CSV file is empty');
      }

      return content;
    } catch (error: any) {
      throw new BadRequestException(`Failed to read CSV file: ${error.message}`);
    }
  }

  /**
   * Parse CSV lines with proper handling of quotes and commas
   */
  private parseCsvLines(content: string): string[][] {
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lines.map(line => {
      // Simple CSV parsing - handles basic cases
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    });
  }

  /**
   * Validate CSV headers
   */
  private validateHeaders(headerLine: string[]): { isValid: boolean; errors: string[]; warnings: string[]; fieldMappings: { [key: string]: string } } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldMappings: { [key: string]: string } = {};

    // Normalize headers
    const normalizedHeaders = headerLine.map(h => h.toLowerCase().trim());
    
    // Check for duplicate headers
    const duplicateHeaders = normalizedHeaders.filter((header, index) => normalizedHeaders.indexOf(header) !== index);
    if (duplicateHeaders.length > 0) {
      errors.push(`Duplicate headers found: ${duplicateHeaders.join(', ')}`);
    }

    // Map headers to standard field names
    normalizedHeaders.forEach((header, index) => {
      const mappedField = csvUploadConfig.getFieldMapping(header);
      fieldMappings[header] = mappedField;
    });

    // Check for required fields
    const validation = csvUploadConfig.validateHeaders(normalizedHeaders);
    if (!validation.isValid) {
      errors.push(`Missing required fields: ${validation.missingFields.join(', ')}`);
    }

    // Check for unknown fields
    const knownFields = Object.values(csvUploadConfig.getConfig().fieldMappings);
    const unknownFields = normalizedHeaders.filter(header => {
      const mapped = fieldMappings[header];
      return !knownFields.includes(mapped) && !this.config.requiredFields.includes(mapped);
    });
    
    if (unknownFields.length > 0) {
      warnings.push(`Unknown fields detected (will be ignored): ${unknownFields.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fieldMappings
    };
  }

  /**
   * Validate individual data row
   */
  private validateDataRow(row: string[], fieldMappings: { [key: string]: string }, rowNumber: number): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if number of values matches headers
    const expectedFields = Object.keys(fieldMappings).length;
    if (row.length !== expectedFields) {
      errors.push(`Row ${rowNumber}: Expected ${expectedFields} fields, got ${row.length}`);
      return { errors, warnings };
    }

    // Validate required fields
    const requiredFields = this.config.requiredFields;
    requiredFields.forEach(requiredField => {
      const headerIndex = Object.keys(fieldMappings).findIndex(header => fieldMappings[header] === requiredField);
      if (headerIndex >= 0 && headerIndex < row.length) {
        const value = row[headerIndex].trim();
        if (!value || value === '') {
          errors.push(`Row ${rowNumber}: Missing required field '${requiredField}'`);
        }
      }
    });

    // Validate email format
    const emailFieldIndex = Object.keys(fieldMappings).findIndex(header => fieldMappings[header] === 'email');
    if (emailFieldIndex >= 0 && emailFieldIndex < row.length) {
      const email = row[emailFieldIndex].trim();
      if (email && !this.isValidEmail(email)) {
        errors.push(`Row ${rowNumber}: Invalid email format '${email}'`);
      }
    }

    // Validate mobile format (basic check)
    const mobileFieldIndex = Object.keys(fieldMappings).findIndex(header => fieldMappings[header] === 'mobile');
    if (mobileFieldIndex >= 0 && mobileFieldIndex < row.length) {
      const mobile = row[mobileFieldIndex].trim();
      if (mobile && !this.isValidMobile(mobile)) {
        warnings.push(`Row ${rowNumber}: Mobile number '${mobile}' may be invalid`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Process data rows and convert to CsvUserDto
   */
  private async processDataRows(
    lines: string[][],
    fieldMappings: { [key: string]: string }
  ): Promise<{ validData: CsvUserDto[]; errors: string[]; warnings: string[] }> {
    const validData: CsvUserDto[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const headers = lines[0];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const rowNumber = i + 1;

      try {
        // Validate row
        const rowValidation = this.validateDataRow(row, fieldMappings, rowNumber);
        
        if (rowValidation.errors.length > 0) {
          errors.push(...rowValidation.errors);
          continue; // Skip invalid rows
        }

        if (rowValidation.warnings.length > 0) {
          warnings.push(...rowValidation.warnings);
        }

        // Convert to CsvUserDto
        const userData = this.convertRowToUserDto(row, headers, fieldMappings);
        
        if (userData) {
          validData.push(userData);
        }

      } catch (error: any) {
        errors.push(`Row ${rowNumber}: Processing error - ${error.message}`);
      }
    }

    return { validData, errors, warnings };
  }

  /**
   * Convert CSV row to CsvUserDto
   */
  private convertRowToUserDto(
    row: string[],
    headers: string[],
    fieldMappings: { [key: string]: string }
  ): CsvUserDto | null {
    try {
      const userData: any = {};

      headers.forEach((header, index) => {
        const mappedField = fieldMappings[header.toLowerCase().trim()];
        const value = row[index] ? row[index].trim() : '';
        
        if (mappedField && value) {
          userData[mappedField] = value;
        }
      });

      // Validate required fields are present
      const requiredFields = ['firstName', 'lastName', 'email', 'mobile'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        console.warn(`Missing required fields: ${missingFields.join(', ')}`);
        return null;
      }

      return {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        mobile: userData.mobile
      };

    } catch (error: any) {
      console.error('Error converting row to UserDto:', error);
      return null;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate mobile format (basic check)
   */
  private isValidMobile(mobile: string): boolean {
    // Basic mobile validation - at least 10 digits
    const mobileRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return mobileRegex.test(mobile);
  }

  /**
   * Clean up temporary file
   */
  async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up temporary file: ${filePath}`);
      }
      } catch (error: any) {
        console.error(`❌ Failed to cleanup temp file ${filePath}:`, error);
      }
  }

  /**
   * Get processing statistics
   */
  getProcessingStatistics(result: CsvProcessingResult): string {
    const { statistics } = result;
    const successRate = ((statistics.validRows / statistics.totalRows) * 100).toFixed(1);
    
    return `Processed ${statistics.totalRows} rows: ${statistics.validRows} valid (${successRate}%), ${statistics.invalidRows} invalid, ${statistics.skippedRows} warnings in ${statistics.processingTimeMs}ms`;
  }
}
